/**
 * SQLite FTS5 全文检索（server-only，paragraph_fts 在检索库）
 * @author 代长亚
 */
import "server-only";

import { listMvpSutras } from "@/lib/canon/popular";
import { getSqlite } from "@/lib/db";
import { getParagraphFtsDb, paragraphFtsHasDenormColumns } from "@/lib/db/search-sqlite";
import { buildParagraphFtsQuery } from "@/lib/search/fts-query";
import { compareSutraByCanonRank } from "@/lib/search/sutra-pagerank";
import { countQueryHitsInText } from "@/lib/search/score-sutra";
import type { SearchHit } from "@/lib/search/fts-types";

export type { SearchHit } from "@/lib/search/fts-types";

export type ParagraphSearchOptions = {
  cjkChars?: string[];
  sutraRankHint?: string[];
};

function stripSnippetMarks(snippet: string): string {
  return snippet.replace(/<\/?mark>/g, "");
}

export function searchParagraphs(
  query: string,
  limit = 20,
  options?: ParagraphSearchOptions,
): SearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const mainDb = getSqlite();
  const searchDb = getParagraphFtsDb(mainDb);
  const ftsQuery = buildParagraphFtsQuery(trimmed);
  if (!ftsQuery) return [];

  const cjkChars = options?.cjkChars ?? [];
  const rankHint = new Set((options?.sutraRankHint ?? []).map((id) => id.toUpperCase()));

  try {
    const denorm = paragraphFtsHasDenormColumns(searchDb);
    const fetchLimit = Math.max(limit * 4, 80);

    const hits: SearchHit[] = [];
    if (denorm) {
      const rows = searchDb
        .prepare(
          `
        SELECT
          f.paragraph_id,
          f.sutra_id,
          f.sutra_slug,
          f.sutra_title,
          f.cbeta_id,
          CAST(f.seq AS INTEGER) as seq,
          snippet(paragraph_fts, 6, '<mark>', '</mark>', '...', 32) as snippet
        FROM paragraph_fts f
        WHERE paragraph_fts MATCH ?
        LIMIT ?
      `,
        )
        .all(ftsQuery, fetchLimit) as Array<{
        paragraph_id: string;
        sutra_id: string;
        sutra_slug: string;
        sutra_title: string;
        cbeta_id: string;
        seq: number;
        snippet: string;
      }>;

      for (const r of rows) {
        if (!r.sutra_id) continue;
        hits.push({
          paragraphId: r.paragraph_id,
          sutraId: r.sutra_id,
          sutraSlug: r.sutra_slug,
          sutraTitle: r.sutra_title,
          cbetaId: r.cbeta_id,
          snippet: r.snippet,
          seq: r.seq,
          wordcount: countQueryHitsInText(stripSnippetMarks(r.snippet), cjkChars),
        });
      }
    } else {
      const rows = searchDb
        .prepare(
          `
        SELECT
          f.paragraph_id,
          snippet(paragraph_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
        FROM paragraph_fts f
        WHERE paragraph_fts MATCH ?
        LIMIT ?
      `,
        )
        .all(ftsQuery, fetchLimit) as Array<{ paragraph_id: string; snippet: string }>;

      if (rows.length > 0) {
        const ids = rows.map((r) => r.paragraph_id);
        const placeholders = ids.map(() => "?").join(",");
        const metaRows = mainDb
          .prepare(
            `SELECT p.id, p.sutra_id, p.seq, s.slug as sutra_slug, s.title as sutra_title, s.cbeta_id
             FROM paragraph p JOIN sutra s ON s.id = p.sutra_id WHERE p.id IN (${placeholders})`,
          )
          .all(...ids) as Array<{
          id: string;
          sutra_id: string;
          seq: number;
          sutra_slug: string;
          sutra_title: string;
          cbeta_id: string;
        }>;
        const metaById = new Map(metaRows.map((m) => [m.id, m]));

        for (const r of rows) {
          const meta = metaById.get(r.paragraph_id);
          if (!meta) continue;
          hits.push({
            paragraphId: r.paragraph_id,
            sutraId: meta.sutra_id,
            sutraSlug: meta.sutra_slug,
            sutraTitle: meta.sutra_title,
            cbetaId: meta.cbeta_id,
            snippet: r.snippet,
            seq: meta.seq,
            wordcount: countQueryHitsInText(stripSnippetMarks(r.snippet), cjkChars),
          });
        }
      }
    }

    hits.sort((a, b) => {
      const aHint = rankHint.has(a.cbetaId.toUpperCase()) ? 0 : 1;
      const bHint = rankHint.has(b.cbetaId.toUpperCase()) ? 0 : 1;
      if (aHint !== bHint) return aHint - bHint;
      const wc = (b.wordcount ?? 0) - (a.wordcount ?? 0);
      if (wc !== 0) return wc;
      return compareSutraByCanonRank(a.cbetaId, b.cbetaId);
    });

    return hits.slice(0, limit);
  } catch {
    return [];
  }
}

export function listPopularSutras(limit = 12) {
  return listMvpSutras().slice(0, limit);
}
