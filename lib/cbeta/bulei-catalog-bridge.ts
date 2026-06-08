/**
 * catalog.txt 题名加载（供 bulei resolve 桥接）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { normalizeCbetaId } from "./corpus-category";

export const CATALOG_TXT_PATH = path.join(process.cwd(), "cbwork-bin/catalog/catalog.txt");

export type CatalogRow = {
  cbetaId: string;
  book: string;
  title: string;
};

let cachedCatalog: Map<string, CatalogRow> | null = null;

export function normalizeCatalogTitle(title: string): string {
  return title
    .replace(/\s/g, "")
    .replace(/[()（）【】\[\]「」『』、，。；：！？]/g, "")
    .trim();
}

export function loadCatalogByCbetaId(
  filePath: string = CATALOG_TXT_PATH,
): Map<string, CatalogRow> {
  if (cachedCatalog && filePath === CATALOG_TXT_PATH) return cachedCatalog;

  const map = new Map<string, CatalogRow>();
  if (!fs.existsSync(filePath)) return map;

  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const cols = trimmed.split(",");
    if (cols.length < 7) continue;
    const cbetaId = normalizeCbetaId(cols[0]!.trim());
    map.set(cbetaId, {
      cbetaId,
      book: cols[1]!.trim().toUpperCase(),
      title: cols[6]!.trim(),
    });
  }

  if (filePath === CATALOG_TXT_PATH) cachedCatalog = map;
  return map;
}

export function resetCatalogBridgeCache(): void {
  cachedCatalog = null;
}
