/**
 * MVP 热门经目（固定顺序，不依赖 char_count 排序）
 * @author 代长亚
 */
import { MVP_CANON } from "@/lib/cbeta/mvp-canon";
import { getSqlite } from "@/lib/db";

export type PopularSutra = {
  id: string;
  slug: string;
  title: string;
  translator: string | null;
  charCount: number;
};

export function listMvpSutras(): PopularSutra[] {
  const db = getSqlite();
  const cbetaIds = MVP_CANON.map((e) => e.cbetaId);
  const placeholders = cbetaIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, cbeta_id as cbetaId, slug, title, translator, char_count as charCount
       FROM sutra WHERE cbeta_id IN (${placeholders})`,
    )
    .all(...cbetaIds) as Array<PopularSutra & { cbetaId: string }>;
  const byCbeta = new Map(rows.map((r) => [r.cbetaId.toUpperCase(), r]));

  const out: PopularSutra[] = [];
  for (const entry of MVP_CANON) {
    const row = byCbeta.get(entry.cbetaId.toUpperCase());
    if (row) {
      out.push({
        id: row.id,
        slug: entry.slug,
        title: row.title,
        translator: row.translator,
        charCount: row.charCount,
      });
    }
  }
  return out;
}
