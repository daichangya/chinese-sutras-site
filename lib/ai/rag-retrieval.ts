/**
 * FTS 版 RAG 检索（对标 FoJin precise_retrieval + vector Top-K）
 * @author 代长亚
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import { searchParagraphs } from "@/lib/search/fts";
import { getParagraphsForSutra } from "@/lib/sutra/queries";

export type RagCitation = {
  sutraSlug: string;
  sutraTitle: string;
  paragraphId: string;
  seq: number;
  snippet: string;
};

export type RagContext = {
  citations: RagCitation[];
  contextText: string;
};

const PRECISE_RE =
  /[《「]?([^》」\n]{1,30}经)[》」]?[第\s]*([0-9一二三四五六七八九十百千]+)[卷册]?/;

const CN_NUM: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
};

function parseChineseNumber(raw: string): number | null {
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  if (raw.length === 1 && CN_NUM[raw]) return CN_NUM[raw];
  if (raw.startsWith("十") && raw.length === 2 && CN_NUM[raw[1]!]) return 10 + CN_NUM[raw[1]!]!;
  if (raw.endsWith("十") && raw.length === 2 && CN_NUM[raw[0]!]) return CN_NUM[raw[0]!]! * 10;
  return null;
}

function tryPreciseRetrieval(query: string): RagCitation[] {
  const m = query.match(PRECISE_RE);
  if (!m) return [];
  const titleHint = m[1]!.replace(/[《》]/g, "");
  const juan = parseChineseNumber(m[2]!);
  if (!titleHint) return [];

  const db = getSqlite();
  const sutra = db
    .prepare(
      `SELECT id, slug, title FROM sutra WHERE title LIKE ? ORDER BY length(title) ASC LIMIT 1`,
    )
    .get(`%${titleHint}%`) as { id: string; slug: string; title: string } | undefined;
  if (!sutra) return [];

  const juanSeq = juan !== null ? juan - 1 : 0;
  const rows = getParagraphsForSutra(sutra.id, Math.max(0, juanSeq)).slice(0, 8);

  return rows.map((r) => ({
    sutraSlug: sutra.slug,
    sutraTitle: sutra.title,
    paragraphId: r.id,
    seq: r.seq,
    snippet: r.text.slice(0, 120),
  }));
}

function extractKeywords(text: string, max = 4): string {
  const cleaned = text.replace(/[^\u4e00-\u9fff]/g, "");
  if (cleaned.length <= 8) return cleaned;
  const chunks: string[] = [];
  for (let i = 0; i < cleaned.length && chunks.length < max; i += 4) {
    chunks.push(cleaned.slice(i, i + 4));
  }
  return chunks.join(" ");
}

export function retrieveRagContext(
  userQuery: string,
  options?: { sutraTitle?: string; contextText?: string; limit?: number },
): RagContext {
  const limit = options?.limit ?? 5;
  const precise = tryPreciseRetrieval(userQuery);
  if (precise.length > 0) {
    return {
      citations: precise.slice(0, limit),
      contextText: precise
        .slice(0, limit)
        .map((c, i) => `[${i + 1}] 《${c.sutraTitle}》第${c.seq}段：${c.snippet}`)
        .join("\n\n"),
    };
  }

  const searchText = [userQuery, options?.contextText, options?.sutraTitle]
    .filter(Boolean)
    .join(" ");
  const keywordQuery = extractKeywords(searchText) || userQuery.slice(0, 20);
  let hits = searchParagraphs(keywordQuery, limit * 2);

  if (options?.sutraTitle) {
    const filtered = hits.filter((h) => h.sutraTitle.includes(options.sutraTitle!.replace(/经$/, "")));
    if (filtered.length > 0) hits = filtered;
  }

  const seen = new Set<string>();
  const citations: RagCitation[] = [];
  for (const h of hits) {
    if (seen.has(h.paragraphId)) continue;
    seen.add(h.paragraphId);
    citations.push({
      sutraSlug: h.sutraSlug,
      sutraTitle: h.sutraTitle,
      paragraphId: h.paragraphId,
      seq: h.seq,
      snippet: h.snippet.replace(/<\/?mark>/g, ""),
    });
    if (citations.length >= limit) break;
  }

  return {
    citations,
    contextText:
      citations.length > 0
        ? citations
            .map((c, i) => `[${i + 1}] 《${c.sutraTitle}》第${c.seq}段：${c.snippet}`)
            .join("\n\n")
        : "",
  };
}
