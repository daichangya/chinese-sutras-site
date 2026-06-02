/**
 * 审计经目目录名是否为简体（与 corpus:simplify 的 simplifyPathSegment 一致）
 * @author jingxin
 *
 * 用法:
 *   npm run corpus:audit-dir-jianti
 *   npm run corpus:audit-dir-jianti -- --dept 新编
 *   npm run corpus:audit-dir-jianti -- --fail
 *   npm run corpus:audit-dir-jianti -- --sample 20
 */
import fs from "fs";
import path from "path";
import { categoryFromCorpusDir, corpusDirName } from "@/lib/cbeta/corpus-category";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import { simplifyPathSegment } from "./corpus-simplify";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = path.resolve(resolveCorpusRoot());
const failOnMismatch = process.argv.includes("--fail");
const sampleN = (() => {
  const i = process.argv.indexOf("--sample");
  if (i < 0) return 10;
  const n = parseInt(process.argv[i + 1] ?? "10", 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
})();

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return undefined;
  return process.argv[i + 1];
}

const deptFilter = argValue("--dept");

function matchesDeptFilter(filter: string, topDir: string): boolean {
  if (topDir === filter) return true;
  if (topDir.startsWith(filter)) return true;
  const fromDir = categoryFromCorpusDir(topDir);
  const fromFilter = categoryFromCorpusDir(filter);
  if (fromDir && fromFilter && fromDir === fromFilter) return true;
  if (corpusDirName(filter) === topDir) return true;
  return false;
}

type Mismatch = { rel: string; current: string; expected: string };

function collectMismatches(): Mismatch[] {
  const out: Mismatch[] = [];
  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    const sutraDir = path.dirname(metaPath);
    const rel = path.relative(corpusRoot, sutraDir).replace(/\\/g, "/");
    const parts = rel.split("/");
    if (parts.length < 2) continue;

    const topDir = parts[0]!;
    if (deptFilter && !matchesDeptFilter(deptFilter, topDir)) continue;

    const basename = parts[parts.length - 1]!;
    const expected = simplifyPathSegment(basename);
    if (expected !== basename) {
      out.push({ rel, current: basename, expected });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel, "zh-Hans"));
}

const mismatches = collectMismatches();
console.log(
  `经目目录简体审计: needRename=${mismatches.length}${deptFilter ? ` dept=${deptFilter}` : ""}`,
);

if (mismatches.length > 0) {
  const show = mismatches.slice(0, sampleN);
  for (const m of show) {
    console.log(`  ${m.current} -> ${m.expected}`);
    console.log(`    ${m.rel}`);
  }
  if (mismatches.length > show.length) {
    console.log(`  … +${mismatches.length - show.length} more`);
  }
  console.log("修复: npm run corpus:simplify -- --dirs-only （或全量含 meta/白话）");
}

if (failOnMismatch && mismatches.length > 0) {
  process.exit(1);
}
