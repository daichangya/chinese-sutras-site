/**
 * KG JSONL / catalog 读写
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import type { KgCatalog, KgEntityRecord, KgRelationRecord } from "./types";

export function kgCatalogPath(root = resolveKgRoot()): string {
  return path.join(root, "catalog.yaml");
}

export function kgEntitiesPath(root = resolveKgRoot()): string {
  return path.join(root, "entities.jsonl");
}

export function kgRelationsPath(root = resolveKgRoot()): string {
  return path.join(root, "relations.jsonl");
}

export function kgLogsDir(root = resolveKgRoot()): string {
  return path.join(root, "logs");
}

export function loadKgCatalog(root = resolveKgRoot()): KgCatalog {
  const p = kgCatalogPath(root);
  if (!fs.existsSync(p)) return { version: 1, sources: [] };
  return YAML.parse(fs.readFileSync(p, "utf-8")) as KgCatalog;
}

export function writeKgCatalog(catalog: KgCatalog, root = resolveKgRoot()): void {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(kgCatalogPath(root), YAML.stringify(catalog).trimEnd() + "\n", "utf-8");
}

export function readEntitiesJsonl(root = resolveKgRoot()): KgEntityRecord[] {
  const p = kgEntitiesPath(root);
  if (!fs.existsSync(p)) return [];
  const out: KgEntityRecord[] = [];
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (t) out.push(JSON.parse(t) as KgEntityRecord);
  }
  return out;
}

export function readRelationsJsonl(root = resolveKgRoot()): KgRelationRecord[] {
  const p = kgRelationsPath(root);
  if (!fs.existsSync(p)) return [];
  const out: KgRelationRecord[] = [];
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (t) out.push(JSON.parse(t) as KgRelationRecord);
  }
  return out;
}

export function writeEntitiesJsonl(entities: KgEntityRecord[], root = resolveKgRoot(), append = false): void {
  fs.mkdirSync(root, { recursive: true });
  const p = kgEntitiesPath(root);
  const body = entities.map((e) => JSON.stringify(e)).join("\n");
  if (append && fs.existsSync(p) && fs.statSync(p).size > 0) {
    fs.appendFileSync(p, "\n" + body + (body ? "\n" : ""), "utf-8");
  } else {
    fs.writeFileSync(p, body ? body + "\n" : "", "utf-8");
  }
}

export function writeRelationsJsonl(relations: KgRelationRecord[], root = resolveKgRoot(), append = false): void {
  fs.mkdirSync(root, { recursive: true });
  const p = kgRelationsPath(root);
  const body = relations.map((r) => JSON.stringify(r)).join("\n");
  if (append && fs.existsSync(p) && fs.statSync(p).size > 0) {
    fs.appendFileSync(p, "\n" + body + (body ? "\n" : ""), "utf-8");
  } else {
    fs.writeFileSync(p, body ? body + "\n" : "", "utf-8");
  }
}

export function appendImportError(message: string, root = resolveKgRoot()): void {
  const dir = kgLogsDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({ at: new Date().toISOString(), message }) + "\n";
  fs.appendFileSync(path.join(dir, "import-errors.jsonl"), line, "utf-8");
}

/** 人物同名审计报告（每次 merge 覆盖写入，非导入失败） */
export function writeNameCollisionReport(
  collisions: Array<{ name_zh: string; ids: string[] }>,
  root = resolveKgRoot(),
): void {
  const dir = kgLogsDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const at = new Date().toISOString();
  const body = collisions
    .map((c) =>
      JSON.stringify({
        at,
        kind: "person_name_collision",
        name_zh: c.name_zh,
        ids: c.ids,
        count: c.ids.length,
      }),
    )
    .join("\n");
  fs.writeFileSync(
    path.join(dir, "name-collisions.jsonl"),
    body ? body + "\n" : "",
    "utf-8",
  );
}
