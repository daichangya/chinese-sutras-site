/**
 * 节日经句 AI 推荐（FTS RAG + 缓存）
 * @author 代长亚
 */
import "server-only";

import { chatCompletion, isAiGatewayConfigured } from "@/lib/ai/gateway";
import { buildDailySummaryPrompt, buildFestivalVerseSelectPrompt } from "@/lib/ai/prompts";
import { retrieveRagContext } from "@/lib/ai/rag-retrieval";
import { getFestivalSutraRef } from "./festival-sutra-registry";
import { getSqlite } from "@/lib/db";
import { getParagraphById } from "@/lib/sutra/queries";
import { festivalCacheId } from "./daily-verse";
import { findFestivalById } from "./festivals";
import { getFestivalVerseFallback } from "./daily-verse";
import type { FestivalEntry } from "./types";

export type FestivalVerseRecommendation = {
  verseText: string;
  verseSource: string;
  paragraphId: string | null;
  aiSummary: string | null;
};

function buildFestivalSearchQuery(festival: FestivalEntry): string {
  const hints = festival.searchHints?.join(" ") ?? "";
  return `${festival.name} ${hints}`.trim();
}

function parseVerseSelection(raw: string, citations: { paragraphId: string; sutraTitle: string; snippet: string }[]) {
  const idxMatch = raw.match(/\[(\d+)\]/);
  if (idxMatch) {
    const idx = Number(idxMatch[1]) - 1;
    const c = citations[idx];
    if (c) {
      return {
        verseText: c.snippet.slice(0, 80),
        verseSource: c.sutraTitle,
        paragraphId: c.paragraphId,
      };
    }
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { paragraphId?: string; excerpt?: string; sutraTitle?: string };
      if (parsed.paragraphId) {
        const p = getParagraphById(parsed.paragraphId);
        return {
          verseText: (parsed.excerpt ?? p?.text.slice(0, 80) ?? "").slice(0, 80),
          verseSource: parsed.sutraTitle ?? "",
          paragraphId: parsed.paragraphId,
        };
      }
    } catch {
      /* fall through */
    }
  }

  return null;
}

export async function recommendFestivalVerse(
  festivalId: string,
  date: string,
): Promise<FestivalVerseRecommendation> {
  const festival = findFestivalById(festivalId);
  if (!festival) {
    throw new Error(`Unknown festival: ${festivalId}`);
  }

  const db = getSqlite();
  const cacheId = festivalCacheId(festivalId, date);
  const existing = db
    .prepare(
      `SELECT custom_text as customText, snippet_text as snippetText, source_title as sourceTitle,
              paragraph_id as paragraphId, ai_summary as aiSummary
       FROM daily_verse WHERE id = ?`,
    )
    .get(cacheId) as
    | {
        customText: string | null;
        snippetText: string | null;
        sourceTitle: string | null;
        paragraphId: string | null;
        aiSummary: string | null;
      }
    | undefined;

  if (existing?.snippetText || existing?.customText) {
    return {
      verseText: existing.snippetText ?? existing.customText ?? "",
      verseSource: existing.sourceTitle ?? "",
      paragraphId: existing.paragraphId,
      aiSummary: existing.aiSummary,
    };
  }

  if (!isAiGatewayConfigured()) {
    const fallback = getFestivalVerseFallback(festival);
    return { ...fallback, aiSummary: null };
  }

  const query = buildFestivalSearchQuery(festival);
  const primarySutra = festival.relatedSutras?.[0]
    ? getFestivalSutraRef(festival.relatedSutras[0])?.title
    : undefined;
  const rag = retrieveRagContext(query, { limit: 6, sutraTitle: primarySutra });

  let verseText = "";
  let verseSource = "";
  let paragraphId: string | null = null;

  if (rag.citations.length > 0) {
    const { system, user } = buildFestivalVerseSelectPrompt(festival.name, festival.aiTheme ?? "", rag.contextText);
    const selection = await chatCompletion([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    const parsed = parseVerseSelection(selection, rag.citations);
    if (parsed) {
      verseText = parsed.verseText;
      verseSource = parsed.verseSource;
      paragraphId = parsed.paragraphId;
    }
  }

  if (!verseText) {
    const fallback = getFestivalVerseFallback(festival);
    verseText = fallback.verseText;
    verseSource = fallback.verseSource;
    paragraphId = fallback.paragraphId;
  }

  const { system, user } = buildDailySummaryPrompt(verseText, verseSource, festival.aiTheme);
  const aiSummary = await chatCompletion([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  db.prepare(
    `INSERT INTO daily_verse (id, verse_date, paragraph_id, custom_text, snippet_text, source_title, ai_summary)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(verse_date) DO UPDATE SET
       id=excluded.id,
       paragraph_id=excluded.paragraph_id,
       custom_text=excluded.custom_text,
       snippet_text=excluded.snippet_text,
       source_title=excluded.source_title,
       ai_summary=excluded.ai_summary`,
  ).run(cacheId, date, paragraphId, verseText, verseText, verseSource, aiSummary);

  return { verseText, verseSource, paragraphId, aiSummary };
}
