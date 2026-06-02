/**
 * MVP 热门经目（固定顺序，不依赖 char_count 排序）
 * @author jingxin
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
  const out: PopularSutra[] = [];
  for (const entry of MVP_CANON) {
    const row = db
      .prepare(
        `SELECT id, slug, title, translator, char_count as charCount FROM sutra WHERE cbeta_id = ?`,
      )
      .get(entry.cbetaId) as PopularSutra | undefined;
    if (row) {
      out.push({
        ...row,
        slug: entry.slug,
      });
    }
  }
  return out;
}
