/**
 * 部署档案：高配（DB 正文）与低内存 VPS（slim + 语料 MD）
 * @author 代长亚
 */

/** 是否启用低内存部署（2G VPS：slim 主库 + 语料按需 + 受限缓存） */
export function isLowMemoryDeploy(): boolean {
  const v = process.env.JX_LOW_MEMORY;
  return v === "1" || v === "true";
}

/**
 * SQLite 页缓存上限（MB）。低内存默认 32；未设置且非 lowmem 时不限制。
 * 对应 PRAGMA cache_size = -(mb * 1024)（单位 KB）。
 */
export function sqliteCacheMb(): number | undefined {
  const raw = process.env.JX_SQLITE_CACHE_MB;
  if (raw !== undefined && raw !== "") {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  if (isLowMemoryDeploy()) return 32;
  return undefined;
}

/** 语料 MD 内存缓存经目数上限；低内存默认 3，高配无上限 */
export function corpusCacheMaxSutras(): number {
  const raw = process.env.JX_CORPUS_CACHE_SUTRAS;
  if (raw !== undefined && raw !== "") {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  if (isLowMemoryDeploy()) return 3;
  return Number.POSITIVE_INFINITY;
}
