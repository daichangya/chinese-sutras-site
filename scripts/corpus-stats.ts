/**
 * 语料部类统计：以 vendor/xml-p5 为全藏基准，区分已生成 / 未生成
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { discoverCbetaXmlFiles } from "@/lib/cbeta/discover-xml";
import { getBuleiMeta } from "@/lib/cbeta/bulei-catalog";
import {
  canonDeptFromCbetaId,
  categoryFromCorpusDir,
  CORPUS_CATEGORIES,
  corpusDirName,
  isSeriesCodeCorpusDir,
  type CorpusCategory,
} from "@/lib/cbeta/corpus-category";
import { findSutraMetaFiles, loadSutraMeta } from "@/lib/corpus-v3/meta";

import { isReservedCorpusTopDir, resolveSutrasRoot } from "@/lib/corpus-v3/paths";
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
const scanLegacyTopDirs = (root: string, labelPrefix: string) => {
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const name = entry.name;
    const isKnown =
      CORPUS_CATEGORIES.some((c) => corpusDirName(c) === name) ||
      categoryFromCorpusDir(name) != null;
    if (isSeriesCodeCorpusDir(name)) {
      const n = findSutraMetaFiles(path.join(root, name)).length;
      legacyDirs.push({ name: `${labelPrefix}${name}（藏代码旧目录，应迁入 23 类）`, count: n });
      continue;
    }
    if (!isKnown) {
      const n = findSutraMetaFiles(path.join(root, name)).length;
      if (n > 0) legacyDirs.push({ name: `${labelPrefix}${name}`, count: n });
    }
  }
};
if (fs.existsSync(corpusRoot)) {
  const sutrasRoot = resolveSutrasRoot(corpusRoot);
  scanLegacyTopDirs(sutrasRoot, "");
  if (path.resolve(sutrasRoot) !== path.resolve(corpusRoot)) {
    for (const entry of fs.readdirSync(corpusRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || isReservedCorpusTopDir(entry.name)) {
        continue;
      }
      const isKnown =
        CORPUS_CATEGORIES.some((c) => corpusDirName(c) === entry.name) ||
        categoryFromCorpusDir(entry.name) != null;
      if (isKnown || isSeriesCodeCorpusDir(entry.name)) {
        const n = findSutraMetaFiles(path.join(corpusRoot, entry.name)).length;
        if (n > 0) {
          legacyDirs.push({
            name: `根目录遗留 ${entry.name}/（应位于 经藏/）`,
            count: n,
          });
        }
      }
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

const buleiGroupCounts = new Map<string, number>();
for (const id of corpusIds) {
  const g = getBuleiMeta(id)?.groupDir;
  if (g) buleiGroupCounts.set(g, (buleiGroupCounts.get(g) ?? 0) + 1);
}

console.log("\n## 数据质量");
console.log(`meta.category 与 canon 不一致: ${categoryMismatch}`);
console.log(`重复 cbetaId: ${corpusIds.size === duplicateCheck.size ? 0 : "有"}`);
if (buleiGroupCounts.size > 0) {
  console.log(`\n## bulei 分组（已生成语料，前 15）`);
  const top = [...buleiGroupCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  for (const [g, c] of top) console.log(`${pad(c)}  ${g}`);
}

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
