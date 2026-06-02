/**
 * 经文查询
 * @author jingxin
 */
import { getMvpCbetaIdBySlug, getMvpSlugByCbetaId } from "@/lib/cbeta/mvp-canon";
import { getSqlite } from "@/lib/db";

export type SutraRow = {
  id: string;
  cbetaId: string;
  slug: string;
  title: string;
  translator: string | null;
  category: string | null;
  charCount: number;
};

export type ParagraphRow = {
  id: string;
  sutraId: string;
  /** 卷序号（DB: juan_seq） */
  chapterSeq: number;
  seq: number;
  text: string;
  colloquial: string | null;
};

export type ChapterRow = {
  id: string;
  sutraId: string;
  seq: number;
  title: string | null;
};

export function getSutraBySlug(slug: string): SutraRow | null {
  const db = getSqlite();
  const selectSql = `SELECT id, cbeta_id as cbetaId, slug, title, translator, category, char_count as charCount FROM sutra WHERE `;

  const row = db.prepare(`${selectSql} slug = ?`).get(slug) as SutraRow | undefined;
  if (row) return withPreferredSlug(row, slug);

  const mvpCbetaId = getMvpCbetaIdBySlug(slug);
  if (mvpCbetaId) {
    const byCbeta = db
      .prepare(`${selectSql} cbeta_id = ?`)
      .get(mvpCbetaId) as SutraRow | undefined;
    if (byCbeta) return withPreferredSlug(byCbeta, slug);
  }

  return null;
}

/** 若经目在 MVP 经目内，优先返回友好 slug */
function withPreferredSlug(row: SutraRow, requestedSlug?: string): SutraRow {
  const friendly = getMvpSlugByCbetaId(row.cbetaId);
  const slug = requestedSlug && getMvpCbetaIdBySlug(requestedSlug) ? requestedSlug : friendly ?? row.slug;
  return slug === row.slug ? row : { ...row, slug };
}

export function getParagraphsForSutra(sutraId: string, juanSeq?: number): ParagraphRow[] {
  const db = getSqlite();
  if (juanSeq !== undefined) {
    return db
      .prepare(
        `SELECT id, sutra_id as sutraId, juan_seq as chapterSeq, seq, text, colloquial FROM paragraph WHERE sutra_id = ? AND juan_seq = ? ORDER BY seq`,
      )
      .all(sutraId, juanSeq) as ParagraphRow[];
  }
  return db
    .prepare(
      `SELECT id, sutra_id as sutraId, juan_seq as chapterSeq, seq, text, colloquial FROM paragraph WHERE sutra_id = ? ORDER BY juan_seq, seq`,
    )
    .all(sutraId) as ParagraphRow[];
}

export function listChaptersForSutra(sutraId: string): ChapterRow[] {
  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT id, sutra_id as sutraId, seq, title FROM chapter WHERE sutra_id = ? ORDER BY seq`,
    )
    .all(sutraId) as ChapterRow[];
  if (rows.length > 0) return rows;
  return listChapterSeqsFromParagraphs(sutraId).map((seq) => ({
    id: `${sutraId}-juan-${String(seq).padStart(3, "0")}`,
    sutraId,
    seq,
    title: seq === 0 ? "全文" : `第${seq}卷`,
  }));
}

export function listChapterSeqsForSutra(sutraId: string): number[] {
  const fromChapter = listChaptersForSutra(sutraId).map((c) => c.seq);
  if (fromChapter.length > 0) return fromChapter;
  return listChapterSeqsFromParagraphs(sutraId);
}

function listChapterSeqsFromParagraphs(sutraId: string): number[] {
  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT DISTINCT juan_seq as chapterSeq FROM paragraph WHERE sutra_id = ? ORDER BY juan_seq`,
    )
    .all(sutraId) as Array<{ chapterSeq: number }>;
  return rows.map((r) => r.chapterSeq);
}

export function getRelatedSutras(sutraId: string): SutraRow[] {
  const db = getSqlite();
  return db
    .prepare(
      `
    SELECT DISTINCT s.id, s.cbeta_id as cbetaId, s.slug, s.title, s.translator, s.category, s.char_count as charCount
    FROM sutra_tag st1
    JOIN sutra_tag st2 ON st1.tag_id = st2.tag_id AND st2.sutra_id != ?
    JOIN sutra s ON s.id = st2.sutra_id
    WHERE st1.sutra_id = ?
    LIMIT 8
  `,
    )
    .all(sutraId, sutraId) as SutraRow[];
}

export function getDailyVerse(date: string) {
  const db = getSqlite();
  return db
    .prepare(
      `SELECT id, verse_date as verseDate, paragraph_id as paragraphId, custom_text as customText, ai_summary as aiSummary FROM daily_verse WHERE verse_date = ?`,
    )
    .get(date) as
    | {
        id: string;
        verseDate: string;
        paragraphId: string | null;
        customText: string | null;
        aiSummary: string | null;
      }
    | undefined;
}

export function countParagraphsForSutra(sutraId: string): number {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM paragraph WHERE sutra_id = ?`)
    .get(sutraId) as { c: number };
  return row.c;
}

export function getParagraphById(id: string): ParagraphRow | null {
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT id, sutra_id as sutraId, juan_seq as chapterSeq, seq, text, colloquial FROM paragraph WHERE id = ?`,
    )
    .get(id) as ParagraphRow | undefined;
  return row ?? null;
}
