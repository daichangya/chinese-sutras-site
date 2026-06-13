/**
 * 节日关联经目解析（服务端：DB 查段落）
 * @author 代长亚
 */
import "server-only";

import { getMvpCbetaIdBySlug } from "@/lib/cbeta/mvp-canon";
import { getSqlite } from "@/lib/db";
import { getSutraBySlug } from "@/lib/sutra/queries";
import {
  FESTIVAL_SUTRA_REGISTRY,
  getFestivalSutraRef,
  type FestivalSutraRef,
} from "./festival-sutra-registry";

export type { FestivalSutraRef };
export { FESTIVAL_SUTRA_REGISTRY, getFestivalSutraRef };

function findSutraRowByCbetaId(cbetaId: string) {
  const db = getSqlite();
  return db
    .prepare(
      `SELECT id, cbeta_id as cbetaId, slug, title FROM sutra WHERE cbeta_id = ? COLLATE NOCASE LIMIT 1`,
    )
    .get(cbetaId) as { id: string; cbetaId: string; slug: string; title: string } | undefined;
}

function findFirstParagraph(
  sutraId: string,
  opts?: { juanSeq?: number; paragraphHint?: string },
): { id: string; text: string } | undefined {
  const db = getSqlite();
  if (opts?.paragraphHint) {
    const sql = opts.juanSeq !== undefined
      ? `SELECT id, text FROM paragraph WHERE sutra_id = ? AND juan_seq = ? AND text LIKE ? ORDER BY seq LIMIT 1`
      : `SELECT id, text FROM paragraph WHERE sutra_id = ? AND text LIKE ? ORDER BY seq LIMIT 1`;
    const params =
      opts.juanSeq !== undefined
        ? [sutraId, opts.juanSeq, `%${opts.paragraphHint}%`]
        : [sutraId, `%${opts.paragraphHint}%`];
    return db.prepare(sql).get(...params) as { id: string; text: string } | undefined;
  }

  const sql =
    opts?.juanSeq !== undefined
      ? `SELECT id, text FROM paragraph WHERE sutra_id = ? AND juan_seq = ? ORDER BY seq LIMIT 1`
      : `SELECT id, text FROM paragraph WHERE sutra_id = ? ORDER BY seq LIMIT 1`;
  const params = opts?.juanSeq !== undefined ? [sutraId, opts.juanSeq] : [sutraId];
  return db.prepare(sql).get(...params) as { id: string; text: string } | undefined;
}

export type ResolvedFestivalSutra = {
  slug: string;
  title: string;
  paragraphId: string;
  verseText: string;
};

/**
 * 将 festivals.yaml 中的友好 slug 解析为可读段落。
 * 优先 MVP 友好 slug，其次 CBETA 编号查库。
 */
export function resolveFestivalSutraExcerpt(slug: string): ResolvedFestivalSutra | null {
  const ref = getFestivalSutraRef(slug);
  if (!ref) {
    const direct = getSutraBySlug(slug);
    if (!direct) return null;
    const p = findFirstParagraph(direct.id);
    if (!p) return null;
    return {
      slug,
      title: direct.title,
      paragraphId: p.id,
      verseText: p.text.slice(0, 80),
    };
  }

  const mvpSlug = getMvpCbetaIdBySlug(ref.slug) ? ref.slug : undefined;
  const sutra =
    (mvpSlug ? getSutraBySlug(mvpSlug) : null) ??
    (() => {
      const row = findSutraRowByCbetaId(ref.cbetaId);
      return row ? { id: row.id, title: row.title, slug: ref.slug } : null;
    })();

  if (!sutra) return null;

  const paragraph = findFirstParagraph(sutra.id, {
    juanSeq: ref.juanSeq,
    paragraphHint: ref.paragraphHint,
  });
  if (!paragraph) return null;

  return {
    slug: ref.slug,
    title: ref.title,
    paragraphId: paragraph.id,
    verseText: paragraph.text.slice(0, 80),
  };
}

/** 已导入经藏的节日关联 slug（供佛历页链接展示） */
export function listImportedFestivalSutraSlugs(): string[] {
  return Object.keys(FESTIVAL_SUTRA_REGISTRY).filter((slug) => resolveFestivalSutraExcerpt(slug) !== null);
}
