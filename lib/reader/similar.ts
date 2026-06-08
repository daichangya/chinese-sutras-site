/**
 * 同经相似段落（FTS 关键词召回，server-only）
 * @author 代长亚
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import { getParagraphFtsDb, paragraphFtsHasDenormColumns } from "@/lib/db/search-sqlite";
import { getParagraphById } from "@/lib/sutra/queries";

export type SimilarParagraph = {
  paragraphId: string;
  seq: number;
  snippet: string;
};

function extractTerms(text: string, max = 3): string[] {
  const cleaned = text.replace(/[^\u4e00-\u9fff]/g, "");
  const terms: string[] = [];
  for (let i = 0; i < cleaned.length && terms.length < max; i += 6) {
    const t = cleaned.slice(i, i + 4);
    if (t.length >= 2) terms.push(t);
  }
  return terms;
}

export function findSimilarParagraphs(
  paragraphId: string,
  limit = 6,
): SimilarParagraph[] {
  const p = getParagraphById(paragraphId);
  if (!p) return [];

  const terms = extractTerms(p.text);
  if (terms.length === 0) return [];

  const mainDb = getSqlite();
  const searchDb = getParagraphFtsDb(mainDb);
  const ftsQuery = terms.map((t) => `"${t}"`).join(" OR ");
  try {
    const denorm = paragraphFtsHasDenormColumns(searchDb);
    const textCol = denorm ? 6 : 2;
    const ftsRows = searchDb
      .prepare(
        `SELECT f.paragraph_id,
                ${denorm ? "CAST(f.seq AS INTEGER) as seq," : ""}
                snippet(paragraph_fts, ${textCol}, '', '', '…', 24) as snippet
         FROM paragraph_fts f
         WHERE paragraph_fts MATCH ?
         LIMIT ?`,
      )
      .all(ftsQuery, limit * 4) as Array<{ paragraph_id: string; seq?: number; snippet: string }>;

    const rows: SimilarParagraph[] = [];
    const needSeqLookup: Array<{ paragraph_id: string; snippet: string }> = [];

    for (const f of ftsRows) {
      if (f.paragraph_id === paragraphId) continue;
      if (denorm && typeof f.seq === "number") {
        rows.push({
          paragraphId: f.paragraph_id,
          seq: f.seq,
          snippet: f.snippet,
        });
      } else {
        needSeqLookup.push(f);
      }
      if (rows.length >= limit) break;
    }

    if (rows.length < limit && needSeqLookup.length > 0) {
      const ids = needSeqLookup.map((f) => f.paragraph_id);
      const placeholders = ids.map(() => "?").join(",");
      const metaRows = mainDb
        .prepare(
          `SELECT id, seq FROM paragraph WHERE id IN (${placeholders}) AND sutra_id = ?`,
        )
        .all(...ids, p.sutraId) as Array<{ id: string; seq: number }>;
      const seqById = new Map(metaRows.map((m) => [m.id, m.seq]));
      for (const f of needSeqLookup) {
        const seq = seqById.get(f.paragraph_id);
        if (seq === undefined) continue;
        rows.push({ paragraphId: f.paragraph_id, seq, snippet: f.snippet });
        if (rows.length >= limit) break;
      }
    }
    return rows;
  } catch {
    return [];
  }
}
