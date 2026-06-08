/**
 * CBReader sutralist 短经号 → CBETA 正式 cbeta_id（T0001 → T01n0001）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { normalizeCbetaId } from "./corpus-category";

export const SUTRALIST_TXT_PATH = path.join(
  process.cwd(),
  "cbwork-bin/cbreader2X/sutralist/sutralist.txt",
);

/** 已是 T01n0001 / YP00na001 等形式 */
export function isFullCbetaIdForm(id: string): boolean {
  return /^\w+\d+n/i.test(id.trim());
}

/**
 * 将 bulei / sutralist 短号规范为正式 cbeta_id；无法解析时返回 normalize 后原串。
 * @author 代长亚
 */
export function expandShortSutraId(
  shortId: string,
  shortToFull: Map<string, string>,
): string {
  const trimmed = shortId.trim();
  if (isFullCbetaIdForm(trimmed)) {
    return normalizeCbetaId(trimmed);
  }
  const upper = trimmed.toUpperCase();
  const hit = shortToFull.get(upper);
  if (hit) return normalizeCbetaId(hit);
  return normalizeCbetaId(upper);
}

let cachedMap: Map<string, string> | null = null;

/** 加载 sutralist.txt（首行 per key 与 CBReader SutraList 一致） */
export function loadSutralistShortToFullMap(
  filePath: string = SUTRALIST_TXT_PATH,
): Map<string, string> {
  if (cachedMap && filePath === SUTRALIST_TXT_PATH) return cachedMap;

  const map = new Map<string, string>();
  if (!fs.existsSync(filePath)) return map;

  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const cols = trimmed.split(",");
    if (cols.length < 3) continue;
    const book = cols[0]!.trim().toUpperCase();
    const vol = cols[1]!.trim();
    const sutraNum = cols[2]!.trim();
    const key = `${book}${sutraNum}`.toUpperCase();
    if (map.has(key)) continue;
    const volPart = vol.length <= 2 ? vol.padStart(2, "0") : vol;
    const full = `${book}${volPart}n${sutraNum}`;
    map.set(key, normalizeCbetaId(full));
  }

  if (filePath === SUTRALIST_TXT_PATH) cachedMap = map;
  return map;
}

export function resetSutralistShortIdCache(): void {
  cachedMap = null;
}
