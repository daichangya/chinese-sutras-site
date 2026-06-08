/**
 * sutralist.txt 全量行（支持同短号多册、起始卷）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { normalizeCbetaId } from "./corpus-category";

export const SUTRALIST_TXT_PATH = path.join(
  process.cwd(),
  "cbwork-bin/cbreader2X/sutralist/sutralist.txt",
);

export type SutralistRow = {
  cbetaId: string;
  book: string;
  vol: string;
  sutraNum: string;
  shortKey: string;
  juanCount: number;
  startJuan: number;
  title: string;
};

let cachedRows: SutralistRow[] | null = null;
let cachedById: Map<string, SutralistRow> | null = null;
let cachedByShortKey: Map<string, SutralistRow[]> | null = null;

function fullIdFromCols(book: string, vol: string, sutraNum: string): string {
  const volPart = vol.length <= 2 ? vol.padStart(2, "0") : vol;
  return normalizeCbetaId(`${book}${volPart}n${sutraNum}`);
}

/** 加载 sutralist 全部行（不 dedupe 短号） */
export function loadSutralistRows(filePath: string = SUTRALIST_TXT_PATH): SutralistRow[] {
  if (cachedRows && filePath === SUTRALIST_TXT_PATH) return cachedRows;

  const rows: SutralistRow[] = [];
  if (!fs.existsSync(filePath)) return rows;

  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const cols = trimmed.split(",");
    if (cols.length < 7) continue;
    const book = cols[0]!.trim().toUpperCase();
    const vol = cols[1]!.trim();
    const sutraNum = cols[2]!.trim();
    const juanCount = parseInt(cols[3]!.trim(), 10) || 0;
    const startJuan = parseInt(cols[4]!.trim(), 10) || 1;
    const title = cols[6]!.trim();
    const shortKey = `${book}${sutraNum}`.toUpperCase();
    rows.push({
      cbetaId: fullIdFromCols(book, vol, sutraNum),
      book,
      vol,
      sutraNum,
      shortKey,
      juanCount,
      startJuan,
      title,
    });
  }

  if (filePath === SUTRALIST_TXT_PATH) cachedRows = rows;
  return rows;
}

export function getSutralistRowByCbetaId(cbetaId: string): SutralistRow | undefined {
  const id = normalizeCbetaId(cbetaId);
  if (!cachedById) {
    cachedById = new Map();
    for (const row of loadSutralistRows()) {
      cachedById.set(row.cbetaId, row);
    }
  }
  return cachedById.get(id);
}

export function getSutralistRowsByShortKey(shortKey: string): SutralistRow[] {
  const key = shortKey.trim().toUpperCase();
  if (!cachedByShortKey) {
    cachedByShortKey = new Map();
    for (const row of loadSutralistRows()) {
      const list = cachedByShortKey.get(row.shortKey) ?? [];
      list.push(row);
      cachedByShortKey.set(row.shortKey, list);
    }
  }
  return cachedByShortKey.get(key) ?? [];
}

export function resetSutralistFullCache(): void {
  cachedRows = null;
  cachedById = null;
  cachedByShortKey = null;
}
