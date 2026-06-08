/**
 * 经藏浏览：按部类聚合已导入经目（server-only）
 * @author 代长亚
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import type { SutraRow } from "@/lib/sutra/queries";
import type { CanonCategoryGroup } from "@/lib/canon/types";

export type { CanonCategoryGroup } from "@/lib/canon/types";

export function listSutrasGroupedByCategory(): CanonCategoryGroup[] {
  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT id, cbeta_id as cbetaId, slug, title, translator, category, char_count as charCount
       FROM sutra
       ORDER BY category, title`,
    )
    .all() as SutraRow[];

  const map = new Map<string, SutraRow[]>();
  for (const row of rows) {
    const cat = row.category?.trim() || "未分类";
    const list = map.get(cat) ?? [];
    list.push(row);
    map.set(cat, list);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "zh-CN"))
    .map(([category, sutras]) => ({ category, sutras }));
}

export function countImportedSutras(): number {
  const db = getSqlite();
  return (db.prepare(`SELECT COUNT(*) as c FROM sutra`).get() as { c: number }).c;
}
