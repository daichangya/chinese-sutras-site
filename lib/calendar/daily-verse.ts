/**
 * 节日今日经句三级回落
 * @author 代长亚
 */
import { getDailyVerse, getParagraphById, getSutraBySlug } from "@/lib/sutra/queries";
import { resolveFestivalSutraExcerpt } from "./festival-sutras";
import { findMajorFestivalForLunar } from "./festivals";
import { getLunarInfo } from "./lunar";
import { resolveCalendarDay } from "./resolve-day";
import type { FestivalEntry, ResolvedDailyVerse } from "./types";
import { getSqlite } from "@/lib/db";

const DEFAULT_VERSE = "凡所有相，皆是虚妄。若见诸相非相，则见如来。";

function festivalCacheId(festivalId: string, date: string): string {
  return `festival-${festivalId}-${date}`;
}

function getFestivalVerseCache(date: string, festivalId: string) {
  const db = getSqlite();
  const id = festivalCacheId(festivalId, date);
  const byId = db
    .prepare(
      `SELECT id, verse_date as verseDate, paragraph_id as paragraphId, custom_text as customText,
              ai_summary as aiSummary, snippet_text as snippetText, source_title as sourceTitle
       FROM daily_verse WHERE id = ?`,
    )
    .get(id) as
    | {
        paragraphId: string | null;
        customText: string | null;
        aiSummary: string | null;
        snippetText: string | null;
        sourceTitle: string | null;
      }
    | undefined;
  if (byId) return byId;

  return db
    .prepare(
      `SELECT id, verse_date as verseDate, paragraph_id as paragraphId, custom_text as customText,
              ai_summary as aiSummary, snippet_text as snippetText, source_title as sourceTitle
       FROM daily_verse WHERE verse_date = ? AND id LIKE 'festival-%'`,
    )
    .get(date) as
    | {
        paragraphId: string | null;
        customText: string | null;
        aiSummary: string | null;
        snippetText: string | null;
        sourceTitle: string | null;
      }
    | undefined;
}

function mapCuratedOverride(festival: FestivalEntry): Omit<ResolvedDailyVerse, "source" | "festival" | "needsAiRefresh" | "aiRecommended"> {
  const o = festival.verseOverride!;
  let verseText = o.customText ?? "";
  let verseSource = "";
  let paragraphId = o.paragraphId ?? null;

  if (paragraphId) {
    const p = getParagraphById(paragraphId);
    if (p) {
      verseText = o.customText ?? p.text.slice(0, 80);
      const sutra = getSutraBySlug(o.sutraSlug ?? "");
      verseSource = sutra?.title ?? "";
    }
  } else if (o.sutraSlug) {
    const sutra = getSutraBySlug(o.sutraSlug);
    if (sutra) {
      verseSource = sutra.title;
      if (!verseText) {
        const db = getSqlite();
        const p = db
          .prepare(`SELECT id, text FROM paragraph WHERE sutra_id = ? ORDER BY seq LIMIT 1`)
          .get(sutra.id) as { id: string; text: string } | undefined;
        if (p) {
          verseText = p.text.slice(0, 80);
          paragraphId = p.id;
        }
      }
    }
  }

  return {
    verseText: verseText || DEFAULT_VERSE,
    verseSource,
    paragraphId,
    aiSummary: null,
  };
}

export function getFestivalVerseFallback(festival: FestivalEntry): Omit<ResolvedDailyVerse, "source" | "festival" | "needsAiRefresh" | "aiRecommended"> {
  if (festival.relatedSutras?.length) {
    try {
      for (const slug of festival.relatedSutras) {
        const excerpt = resolveFestivalSutraExcerpt(slug);
        if (excerpt) {
          return {
            verseText: excerpt.verseText,
            verseSource: excerpt.title,
            paragraphId: excerpt.paragraphId,
            aiSummary: null,
          };
        }
      }
    } catch {
      // 经藏库未就绪时回落默认经句
    }
  }

  return {
    verseText: DEFAULT_VERSE,
    verseSource: "",
    paragraphId: null,
    aiSummary: null,
  };
}

function mapDailyRow(
  row: ReturnType<typeof getDailyVerse>,
): Omit<ResolvedDailyVerse, "source" | "festival" | "needsAiRefresh" | "aiRecommended"> {
  if (!row) {
    return {
      verseText: DEFAULT_VERSE,
      verseSource: "",
      paragraphId: null,
      aiSummary: null,
    };
  }

  let verseText = row.customText ?? DEFAULT_VERSE;
  let verseSource = row.sourceTitle ?? "";

  if (row.snippetText) {
    verseText = row.snippetText;
  } else if (row.paragraphId) {
    const p = getParagraphById(row.paragraphId);
    if (p) verseText = p.text.slice(0, 80);
  }

  return {
    verseText,
    verseSource,
    paragraphId: row.paragraphId,
    aiSummary: row.aiSummary,
  };
}

export function resolveDailyVerse(date: string): ResolvedDailyVerse {
  const lunar = getLunarInfo(date);
  const festival = findMajorFestivalForLunar(lunar);

  if (!festival) {
    const mapped = mapDailyRow(getDailyVerse(date));
    return {
      source: "daily_verse",
      festival: null,
      needsAiRefresh: false,
      aiRecommended: false,
      ...mapped,
    };
  }

  if (festival.verseOverride) {
    const mapped = mapCuratedOverride(festival);
    return {
      source: "festival_curated",
      festival,
      needsAiRefresh: false,
      aiRecommended: false,
      ...mapped,
    };
  }

  const cached = getFestivalVerseCache(date, festival.id);
  if (cached) {
    const verseText = cached.snippetText ?? cached.customText ?? DEFAULT_VERSE;
    return {
      source: "festival_ai_cached",
      festival,
      needsAiRefresh: false,
      aiRecommended: true,
      verseText,
      verseSource: cached.sourceTitle ?? "",
      paragraphId: cached.paragraphId,
      aiSummary: cached.aiSummary,
    };
  }

  const fallback = getFestivalVerseFallback(festival);
  return {
    source: "festival_fallback",
    festival,
    needsAiRefresh: true,
    aiRecommended: false,
    ...fallback,
  };
}

export function findMajorFestivalForDate(isoDate: string): FestivalEntry | null {
  const lunar = getLunarInfo(isoDate);
  return findMajorFestivalForLunar(lunar);
}

export { festivalCacheId, getFestivalVerseCache };
