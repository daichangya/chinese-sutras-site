/**
 * 经文查询（高配直读 DB 正文；低内存 / slim 从语料 MD hydrate）
 * @author 代长亚
 */
import type { BlockRole } from "@/lib/cbeta/block-role";
import { isAuxiliaryBlockRole, isReaderBodyRole } from "@/lib/cbeta/block-role";
import { getMvpCbetaIdBySlug, getMvpSlugByCbetaId } from "@/lib/cbeta/mvp-canon";
import { getSqlite } from "@/lib/db";
import { isLowMemoryDeploy } from "@/lib/deploy/profile";
import {
  paragraphHasTextColumn,
  paragraphIdentitySelectSql,
  paragraphSelectSql,
  requireParagraphTextColumn,
} from "@/lib/db/paragraph-schema";
import { inferBlockRolesForParagraphs } from "@/lib/corpus-v3/infer-block-role";
import {
  cbetaIdFromCanonicalId,
  CorpusNotAvailableError,
  loadParagraphBodiesForCbetaId,
  readParagraphBody,
} from "@/lib/corpus-v3/read-paragraph";

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
  blockRole: BlockRole | null;
};

export type GetParagraphsOptions = {
  /** 是否包含序跋等辅助段落（默认 false，仅正文/偈） */
  includeAuxiliary?: boolean;
};

export type ChapterRow = {
  id: string;
  sutraId: string;
  seq: number;
  title: string | null;
};

type ParagraphIdentityRow = {
  id: string;
  sutraId: string;
  chapterSeq: number;
  seq: number;
  colloquial: string | null;
  blockRole?: string | null;
  text?: string;
};

function shouldUseDbTextPath(db: ReturnType<typeof getSqlite>): boolean {
  return !isLowMemoryDeploy() && paragraphHasTextColumn(db);
}

function paragraphRowFromIdentity(r: ParagraphIdentityRow): ParagraphRow {
  return {
    id: r.id,
    sutraId: r.sutraId,
    chapterSeq: r.chapterSeq,
    seq: r.seq,
    text: r.text ?? "",
    colloquial: r.colloquial,
    blockRole: (r.blockRole as BlockRole | null) ?? null,
  };
}

function paragraphHasBlockRoleColumn(db: ReturnType<typeof getSqlite>): boolean {
  const cols = db.prepare(`PRAGMA table_info(paragraph)`).all() as Array<{ name: string }>;
  return cols.some((c) => c.name === "block_role");
}

function filterParagraphsForReader(
  rows: ParagraphRow[],
  options?: GetParagraphsOptions,
): ParagraphRow[] {
  if (options?.includeAuxiliary) return rows;
  return rows.filter((p) => isReaderBodyRole(p.blockRole));
}

function paragraphColsSql(db: ReturnType<typeof getSqlite>): string {
  const hasRole = paragraphHasBlockRoleColumn(db);
  const identity = hasRole
    ? paragraphIdentitySelectSql()
    : `id, sutra_id as sutraId, juan_seq as chapterSeq, seq, colloquial, NULL as blockRole`;
  const withText = `${identity}, text`;
  return shouldUseDbTextPath(db) ? withText : identity;
}

function fetchParagraphRows(sutraId: string, juanSeq?: number): ParagraphIdentityRow[] {
  return juanSeq !== undefined
    ? selectParagraphRows(
        `SELECT PARAGRAPH_COLS FROM paragraph WHERE sutra_id = ? AND juan_seq = ? ORDER BY seq`,
        sutraId,
        juanSeq,
      )
    : selectParagraphRows(
        `SELECT PARAGRAPH_COLS FROM paragraph WHERE sutra_id = ? ORDER BY juan_seq, seq`,
        sutraId,
      );
}

function ensureBlockRoles(rows: ParagraphRow[], cbetaId: string | null): ParagraphRow[] {
  if (!cbetaId || rows.length === 0) return rows;
  if (rows.every((r) => r.blockRole)) return rows;
  const roles = inferBlockRolesForParagraphs(
    rows.map((r) => ({ text: r.text, blockRole: r.blockRole })),
    cbetaId,
  );
  return rows.map((r, i) => ({
    ...r,
    blockRole: r.blockRole ?? roles[i] ?? "body",
  }));
}

function mapParagraphRows(
  rows: ParagraphIdentityRow[],
  sutraId: string,
  db: ReturnType<typeof getSqlite>,
): ParagraphRow[] {
  const cbetaId = getCbetaIdForSutra(sutraId);
  const mapped = shouldUseDbTextPath(db)
    ? rows.map((r) => paragraphRowFromIdentity(r))
    : hydrateParagraphs(rows, cbetaId);
  return ensureBlockRoles(mapped, cbetaId);
}

function selectParagraphRows(
  sql: string,
  ...params: unknown[]
): ParagraphIdentityRow[] {
  const db = getSqlite();
  if (shouldUseDbTextPath(db)) {
    requireParagraphTextColumn(db);
  }
  const fullSql = sql.replace("PARAGRAPH_COLS", paragraphColsSql(db));
  return db.prepare(fullSql).all(...params) as ParagraphIdentityRow[];
}

function getCbetaIdForSutra(sutraId: string): string | null {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT cbeta_id as cbetaId FROM sutra WHERE id = ?`)
    .get(sutraId) as { cbetaId: string } | undefined;
  return row?.cbetaId ?? null;
}

function hydrateParagraphs(
  rows: ParagraphIdentityRow[],
  cbetaId: string | null,
): ParagraphRow[] {
  if (!cbetaId) return rows.map((r) => paragraphRowFromIdentity(r));

  let bodies: ReturnType<typeof loadParagraphBodiesForCbetaId>;
  try {
    bodies = loadParagraphBodiesForCbetaId(cbetaId);
  } catch (e) {
    if (e instanceof CorpusNotAvailableError) {
      return rows.map((r) => paragraphRowFromIdentity(r));
    }
    throw e;
  }

  return rows.map((r) => {
    const body = bodies.get(r.id);
    return {
      id: r.id,
      sutraId: r.sutraId,
      chapterSeq: r.chapterSeq,
      seq: r.seq,
      text: body?.text ?? r.text ?? "",
      colloquial: r.colloquial ?? body?.colloquial ?? null,
      blockRole: (r.blockRole as BlockRole | null) ?? null,
    };
  });
}

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

export function getParagraphsForSutra(
  sutraId: string,
  juanSeq?: number,
  options?: GetParagraphsOptions,
): ParagraphRow[] {
  const db = getSqlite();
  const rows = mapParagraphRows(fetchParagraphRows(sutraId, juanSeq), sutraId, db);
  return filterParagraphsForReader(rows, options);
}

export function getAuxiliaryParagraphsForSutra(
  sutraId: string,
  juanSeq?: number,
): ParagraphRow[] {
  const db = getSqlite();
  const rows = mapParagraphRows(fetchParagraphRows(sutraId, juanSeq), sutraId, db);
  return rows.filter((p) => isAuxiliaryBlockRole(p.blockRole));
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
      `SELECT id, verse_date as verseDate, paragraph_id as paragraphId, custom_text as customText,
              ai_summary as aiSummary, snippet_text as snippetText, source_title as sourceTitle
       FROM daily_verse WHERE verse_date = ?`,
    )
    .get(date) as
    | {
        id: string;
        verseDate: string;
        paragraphId: string | null;
        customText: string | null;
        aiSummary: string | null;
        snippetText: string | null;
        sourceTitle: string | null;
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
  const hasRole = paragraphHasBlockRoleColumn(db);

  if (shouldUseDbTextPath(db)) {
    requireParagraphTextColumn(db);
    const cols = hasRole
      ? paragraphSelectSql()
      : `id, sutra_id as sutraId, juan_seq as chapterSeq, seq, colloquial, NULL as blockRole, text`;
    const row = db.prepare(`SELECT ${cols} FROM paragraph WHERE id = ?`).get(id) as
      | ParagraphIdentityRow
      | undefined;
    if (!row) return null;
    const mapped = paragraphRowFromIdentity(row);
    const cbetaId = cbetaIdFromCanonicalId(id) ?? getCbetaIdForSutra(row.sutraId);
    return ensureBlockRoles([mapped], cbetaId)[0] ?? null;
  }

  const identityCols = hasRole
    ? paragraphIdentitySelectSql()
    : `id, sutra_id as sutraId, juan_seq as chapterSeq, seq, colloquial, NULL as blockRole`;
  const row = db
    .prepare(`SELECT ${identityCols} FROM paragraph WHERE id = ?`)
    .get(id) as ParagraphIdentityRow | undefined;
  if (!row) return null;

  const cbetaId = cbetaIdFromCanonicalId(id) ?? getCbetaIdForSutra(row.sutraId);
  if (!cbetaId) return paragraphRowFromIdentity(row);

  try {
    const body = readParagraphBody(cbetaId, id);
    const mapped: ParagraphRow = {
      id: row.id,
      sutraId: row.sutraId,
      chapterSeq: row.chapterSeq,
      seq: row.seq,
      text: body?.text ?? "",
      colloquial: row.colloquial ?? body?.colloquial ?? null,
      blockRole: (row.blockRole as BlockRole | null) ?? null,
    };
    return ensureBlockRoles([mapped], cbetaId)[0] ?? null;
  } catch (e) {
    if (e instanceof CorpusNotAvailableError) {
      return ensureBlockRoles([paragraphRowFromIdentity(row)], cbetaId)[0] ?? null;
    }
    throw e;
  }
}

export { CorpusNotAvailableError, isCorpusMounted } from "@/lib/corpus-v3/read-paragraph";
