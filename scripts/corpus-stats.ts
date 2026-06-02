/**
 * 语料部类统计：以 vendor/xml-p5 为全藏基准，区分已生成 / 未生成
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { discoverCbetaXmlFiles } from "@/lib/cbeta/discover-xml";
import {
  canonDeptFromCbetaId,
  categoryFromCorpusDir,
  CORPUS_CATEGORIES,
  corpusDirName,
  isSeriesCodeCorpusDir,
  type CorpusCategory,
} from "@/lib/cbeta/corpus-category";
import { findSutraMetaFiles, loadSutraMeta } from "@/lib/corpus-v3/meta";

import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = resolveCorpusRoot();
const xmlRoot = process.env.CBETA_XML_DIR ?? "vendor/xml-p5";
const dbPath = process.env.DATABASE_URL ?? "data/jingxin.db";

function pad(n: number, w = 5): string {
  return String(n).padStart(w);
}

function printTable(title: string, counts: Map<CorpusCategory, number>): void {
  console.log(`\n## ${title}`);
  let sum = 0;
  for (const name of CORPUS_CATEGORIES) {
    const c = counts.get(name) ?? 0;
    sum += c;
    console.log(`${pad(c)}  ${name}`);
  }
  console.log(`${"-".repeat(40)}`);
  console.log(`${pad(sum)}  合计`);
}

function countByCategory(ids: Iterable<string>): Map<CorpusCategory, number> {
  const m = new Map<CorpusCategory, number>();
  for (const id of ids) {
    const cat = canonDeptFromCbetaId(id);
    m.set(cat, (m.get(cat) ?? 0) + 1);
  }
  return m;
}

const xmlList = fs.existsSync(xmlRoot) ? discoverCbetaXmlFiles(xmlRoot) : [];
const xmlIds = new Set(xmlList.map((x) => x.cbetaId));

const corpusMetaPaths = findSutraMetaFiles(corpusRoot);
const corpusIds = new Set<string>();
let categoryMismatch = 0;
const duplicateCheck = new Map<string, string>();
const generatedByCat = new Map<CorpusCategory, number>();

for (const metaPath of corpusMetaPaths) {
  const meta = loadSutraMeta(metaPath);
  if (duplicateCheck.has(meta.cbetaId)) {
    console.error(`重复 cbetaId: ${meta.cbetaId}`);
  } else {
    duplicateCheck.set(meta.cbetaId, metaPath);
  }
  corpusIds.add(meta.cbetaId);
  const cat = meta.category as CorpusCategory;
  generatedByCat.set(cat, (generatedByCat.get(cat) ?? 0) + 1);
  const canon = canonDeptFromCbetaId(meta.cbetaId, meta.title);
  if (meta.category !== canon) categoryMismatch += 1;
}

const missingIds = [...xmlIds].filter((id) => !corpusIds.has(id));
const corpusOnlyIds = [...corpusIds].filter((id) => !xmlIds.has(id));

const fullCanonByCat = countByCategory(xmlIds);

const legacyDirs: { name: string; count: number }[] = [];
if (fs.existsSync(corpusRoot)) {
  for (const entry of fs.readdirSync(corpusRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const name = entry.name;
    const isKnown =
      CORPUS_CATEGORIES.some((c) => corpusDirName(c) === name) ||
      categoryFromCorpusDir(name) != null;
    if (isSeriesCodeCorpusDir(name)) {
      const n = findSutraMetaFiles(path.join(corpusRoot, name)).length;
      legacyDirs.push({ name: `${name}（藏代码旧目录，应迁入 23 类）`, count: n });
      continue;
    }
    if (!isKnown) {
      const n = findSutraMetaFiles(path.join(corpusRoot, name)).length;
      if (n > 0) legacyDirs.push({ name, count: n });
    }
  }
}

let dbSutraCount: number | null = null;
if (fs.existsSync(dbPath)) {
  try {
    const db = new Database(dbPath, { readonly: true });
    const row = db.prepare("SELECT COUNT(*) AS c FROM sutra").get() as { c: number };
    dbSutraCount = row.c;
    db.close();
  } catch {
    dbSutraCount = null;
  }
}

console.log("# 语料部类统计");
console.log(`\nXML 根目录: ${xmlRoot}`);
console.log(`语料根目录: ${corpusRoot}`);
console.log(`数据库: ${dbPath}`);

console.log("\n## 总量");
console.log(`全藏（XML 可发现）:     ${pad(xmlIds.size, 6)}`);
console.log(`已生成语料（corpus）:   ${pad(corpusIds.size, 6)}`);
console.log(`未生成:                 ${pad(missingIds.length, 6)}`);
if (corpusOnlyIds.length) {
  console.log(`语料有、XML 无:         ${pad(corpusOnlyIds.length, 6)}`);
}
if (dbSutraCount != null) {
  console.log(`SQLite sutra 表:        ${pad(dbSutraCount, 6)}`);
}

printTable("23 部类 · 已生成语料", generatedByCat);
printTable("23 部类 · 全藏预估（XML）", fullCanonByCat);

console.log("\n## 数据质量");
console.log(`meta.category 与 canon 不一致: ${categoryMismatch}`);
console.log(`重复 cbetaId: ${corpusIds.size === duplicateCheck.size ? 0 : "有"}`);

if (legacyDirs.length) {
  console.log("\n## 非标准顶层目录（应迁移后为空）");
  for (const { name, count } of legacyDirs.sort((a, b) => b.count - a.count)) {
    console.log(`${pad(count)}  ${name}`);
  }
}

if (process.argv.includes("--missing-sample") && missingIds.length) {
  console.log("\n## 未生成样例（前 20）");
  for (const id of missingIds.slice(0, 20)) {
    console.log(`  ${id} → ${canonDeptFromCbetaId(id)}`);
  }
}
