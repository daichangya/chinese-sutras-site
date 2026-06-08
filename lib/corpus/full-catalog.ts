/**
 * 全藏语料 catalog.json 读写
 * @author 代长亚
 */
import fs from "fs";
import path from "path";

export type CatalogEntryStatus = "ok" | "error" | "skipped";

export type CatalogEntry = {
  cbetaId: string;
  slug: string;
  title: string;
  status: CatalogEntryStatus;
  files: string[];
  paragraphCount: number;
  error?: string;
  updatedAt: string;
};

export type FullCatalog = {
  version: 1;
  generatedAt: string;
  xmlRoot: string;
  corpusRoot: string;
  entries: CatalogEntry[];
};

export function catalogPath(corpusFullRoot: string): string {
  return path.join(corpusFullRoot, "catalog.json");
}

export function loadCatalog(corpusFullRoot: string): FullCatalog | null {
  const p = catalogPath(corpusFullRoot);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8")) as FullCatalog;
}

export function saveCatalog(corpusFullRoot: string, catalog: FullCatalog): void {
  fs.mkdirSync(corpusFullRoot, { recursive: true });
  fs.writeFileSync(catalogPath(corpusFullRoot), `${JSON.stringify(catalog, null, 2)}\n`, "utf-8");
}

export function upsertCatalogEntry(catalog: FullCatalog, entry: CatalogEntry): void {
  const idx = catalog.entries.findIndex((e) => e.cbetaId === entry.cbetaId);
  if (idx >= 0) catalog.entries[idx] = entry;
  else catalog.entries.push(entry);
}

export function entryByCbetaId(
  catalog: FullCatalog,
  cbetaId: string,
): CatalogEntry | undefined {
  return catalog.entries.find((e) => e.cbetaId === cbetaId);
}
