/**
 * 辞典 JSONL / catalog 读写
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { resolveDictRoot } from "@/lib/corpus-v3/paths";
import { resolveDictSourceDir } from "./source-dir";
import type { DictionaryCatalog, DictionaryEntryRecord } from "./types";

export function dictCatalogPath(root = resolveDictRoot()): string {
  return path.join(root, "catalog.yaml");
}

export function dictSourceDir(source: string, root = resolveDictRoot()): string {
  return resolveDictSourceDir(source, root);
}

export function dictEntriesPath(source: string, root = resolveDictRoot()): string {
  return path.join(dictSourceDir(source, root), "entries.jsonl");
}

export function loadDictCatalog(root = resolveDictRoot()): DictionaryCatalog {
  const p = dictCatalogPath(root);
  if (!fs.existsSync(p)) {
    return { version: 1, sources: [] };
  }
  const raw = YAML.parse(fs.readFileSync(p, "utf-8")) as DictionaryCatalog;
  return raw;
}

export function writeDictCatalog(catalog: DictionaryCatalog, root = resolveDictRoot()): void {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(dictCatalogPath(root), YAML.stringify(catalog).trimEnd() + "\n", "utf-8");
}

export function appendEntriesJsonl(
  source: string,
  records: DictionaryEntryRecord[],
  root = resolveDictRoot(),
): number {
  const dir = dictSourceDir(source, root);
  fs.mkdirSync(dir, { recursive: true });
  const p = dictEntriesPath(source, root);
  const lines = records.map((r) => JSON.stringify(r));
  fs.appendFileSync(p, (fs.existsSync(p) && fs.statSync(p).size > 0 ? "\n" : "") + lines.join("\n") + (lines.length ? "\n" : ""), "utf-8");
  return records.length;
}

export function writeEntriesJsonl(
  source: string,
  records: DictionaryEntryRecord[],
  root = resolveDictRoot(),
): void {
  const dir = dictSourceDir(source, root);
  fs.mkdirSync(dir, { recursive: true });
  const p = dictEntriesPath(source, root);
  const body = records.map((r) => JSON.stringify(r)).join("\n");
  fs.writeFileSync(p, body ? body + "\n" : "", "utf-8");
}

export function readEntriesJsonl(source: string, root = resolveDictRoot()): DictionaryEntryRecord[] {
  const p = dictEntriesPath(source, root);
  if (!fs.existsSync(p)) return [];
  const out: DictionaryEntryRecord[] = [];
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    out.push(JSON.parse(t) as DictionaryEntryRecord);
  }
  return out;
}

export function countEntriesJsonl(source: string, root = resolveDictRoot()): number {
  const p = dictEntriesPath(source, root);
  if (!fs.existsSync(p)) return 0;
  let n = 0;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    if (line.trim()) n++;
  }
  return n;
}
