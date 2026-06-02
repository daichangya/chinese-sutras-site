/**
 * 拼音结果 SQLite 缓存
 * @author jingxin
 */
import { getSqlite } from "@/lib/db";
import type { CharReading, PinyinScript } from "./types";
import { hashText } from "./segment";
import { getDictVersion } from "./dict";

export function buildCacheKey(
  text: string,
  script: PinyinScript,
  canonicalId?: string,
): string {
  const version = getDictVersion();
  const base = canonicalId ? `${canonicalId}\0${text}` : text;
  return hashText(base, script, version);
}

export function getCachedReadings(cacheKey: string): CharReading[] | null {
  try {
    const db = getSqlite();
    const row = db
      .prepare(`SELECT readings FROM pinyin_cache WHERE cache_key = ?`)
      .get(cacheKey) as { readings: string } | undefined;
    if (!row) return null;
    return JSON.parse(row.readings) as CharReading[];
  } catch {
    return null;
  }
}

export function setCachedReadings(cacheKey: string, readings: CharReading[]): void {
  try {
    const db = getSqlite();
    db.prepare(
      `INSERT INTO pinyin_cache (cache_key, readings, dict_version, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET
         readings = excluded.readings,
         dict_version = excluded.dict_version,
         created_at = excluded.created_at`,
    ).run(cacheKey, JSON.stringify(readings), getDictVersion(), Date.now());
  } catch {
    /* table may not exist in test env */
  }
}

export function segmentWithCache(
  text: string,
  script: PinyinScript,
  canonicalId: string | undefined,
  compute: () => CharReading[],
): { readings: CharReading[]; cached: boolean } {
  const cacheKey = buildCacheKey(text, script, canonicalId);
  const hit = getCachedReadings(cacheKey);
  if (hit) return { readings: hit, cached: true };
  const readings = compute();
  setCachedReadings(cacheKey, readings);
  return { readings, cached: false };
}
