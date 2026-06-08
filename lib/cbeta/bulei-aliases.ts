/**
 * bulei 经号别名表（build-bulei-aliases 生成，resolve 时加载）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { normalizeCbetaId } from "./corpus-category";

export const BULEI_ALIASES_PATH = path.join(process.cwd(), "data/bulei-id-aliases.json");

export type BuleiAliasEntry = {
  cbeta_id: string;
  bulei_short?: string;
  reason?: string;
  confidence?: "high" | "medium" | "low";
};

type AliasFile = {
  version?: number;
  aliases?: BuleiAliasEntry[];
};

let cachedShortById: Map<string, string> | null = null;

export function loadBuleiAliasShortById(
  filePath: string = BULEI_ALIASES_PATH,
): Map<string, string> {
  if (cachedShortById && filePath === BULEI_ALIASES_PATH) return cachedShortById;

  const map = new Map<string, string>();
  if (!fs.existsSync(filePath)) {
    if (filePath === BULEI_ALIASES_PATH) cachedShortById = map;
    return map;
  }

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as AliasFile;
  for (const row of raw.aliases ?? []) {
    const id = normalizeCbetaId(row.cbeta_id);
    const short = row.bulei_short?.trim();
    if (id && short) map.set(id, short);
  }

  if (filePath === BULEI_ALIASES_PATH) cachedShortById = map;
  return map;
}

export function resetBuleiAliasCache(): void {
  cachedShortById = null;
}
