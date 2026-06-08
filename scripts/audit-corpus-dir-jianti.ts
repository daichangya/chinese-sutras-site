/**
 * 审计语料路径：扁平两层 + 全路径段简体
 * @author 代长亚
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
const EXPECTED_DEPTH = 2;
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

type SegmentMismatch = { rel: string; segment: string; expected: string };
type DepthMismatch = { rel: string; depth: number };

function collectIssues(): { segments: SegmentMismatch[]; depths: DepthMismatch[] } {
  const segments: SegmentMismatch[] = [];
  const depths: DepthMismatch[] = [];

  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    const sutraDir = path.dirname(metaPath);
    const rel = path.relative(corpusRoot, sutraDir).replace(/\\/g, "/");
    const parts = rel.split("/").filter(Boolean);
    if (parts.length < 1) continue;

    const topDir = parts[0]!;
    if (deptFilter && !matchesDeptFilter(deptFilter, topDir)) continue;

    if (parts.length !== EXPECTED_DEPTH) {
      depths.push({ rel, depth: parts.length });
    }

    for (const segment of parts) {
      const expected = simplifyPathSegment(segment);
      if (expected !== segment) {
        segments.push({ rel, segment, expected });
      }
    }
  }

  segments.sort((a, b) => a.rel.localeCompare(b.rel, "zh-Hans"));
  depths.sort((a, b) => a.rel.localeCompare(b.rel, "zh-Hans"));
  return { segments, depths };
}

const { segments, depths } = collectIssues();
console.log(
  `语料路径审计 (flat${EXPECTED_DEPTH}): segmentNeedRename=${segments.length} wrongDepth=${depths.length}${deptFilter ? ` dept=${deptFilter}` : ""}`,
);

if (segments.length > 0) {
  console.log("\n## 路径段非简体");
  const show = segments.slice(0, sampleN);
  for (const m of show) {
    console.log(`  ${m.segment} -> ${m.expected}`);
    console.log(`    ${m.rel}`);
  }
  if (segments.length > show.length) {
    console.log(`  … +${segments.length - show.length} more`);
  }
  console.log("修复: npm run corpus:simplify -- --dirs-only （或 corpus:migrate-dept）");
}

if (depths.length > 0) {
  console.log(`\n## 路径深度应为 ${EXPECTED_DEPTH}（部类/经目）`);
  const show = depths.slice(0, sampleN);
  for (const m of show) {
    console.log(`  depth=${m.depth}  ${m.rel}`);
  }
  if (depths.length > show.length) {
    console.log(`  … +${depths.length - show.length} more`);
  }
  console.log("修复: npm run corpus:migrate-dept （勿加 --layout bulei）");
}

const totalIssues = segments.length + depths.length;
if (failOnMismatch && totalIssues > 0) {
  process.exit(1);
}
