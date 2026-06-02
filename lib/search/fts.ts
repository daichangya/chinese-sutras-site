/**
 * SQLite FTS5 全文检索
 * @author jingxin
 */
import { listMvpSutras } from "@/lib/canon/popular";
import { getSqlite } from "@/lib/db";
import { detectScript, t2s } from "@/lib/han";

export type SearchHit = {
  paragraphId: string;
  sutraId: string;
  sutraSlug: string;
  sutraTitle: string;
  snippet: string;
  seq: number;
};

function escapeFtsQuery(q: string): string {
  return q
    .trim()
    .replace(/['"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t}"`)
    .join(" ");
}

export function searchParagraphs(query: string, limit = 20): SearchHit[] {
  let trimmed = query.trim();
  if (!trimmed) return [];

  // FTS 索引简体文本，搜索词转为简体
  if (detectScript(trimmed) === "traditional") {
    trimmed = t2s(trimmed, { backend: "js" }).text;
  }

  const db = getSqlite();
  const ftsQuery = escapeFtsQuery(trimmed);
  if (!ftsQuery) return [];

  try {
    const rows = db
      .prepare(
        `
      SELECT
        p.id as paragraph_id,
        p.sutra_id,
        p.seq,
        s.slug as sutra_slug,
        s.title as sutra_title,
        snippet(paragraph_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
      FROM paragraph_fts f
      JOIN paragraph p ON p.id = f.paragraph_id
      JOIN sutra s ON s.id = p.sutra_id
      WHERE paragraph_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `,
      )
      .all(ftsQuery, limit) as Array<{
        paragraph_id: string;
        sutra_id: string;
        seq: number;
        sutra_slug: string;
        sutra_title: string;
        snippet: string;
      }>;

    return rows.map((r) => ({
      paragraphId: r.paragraph_id,
      sutraId: r.sutra_id,
      sutraSlug: r.sutra_slug,
      sutraTitle: r.sutra_title,
      snippet: r.snippet,
      seq: r.seq,
    }));
  } catch {
    return [];
  }
}

export function listPopularSutras(limit = 12) {
  return listMvpSutras().slice(0, limit);
}
