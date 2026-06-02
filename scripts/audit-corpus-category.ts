/**
 * 对比 meta.yaml 的 category 与 canonDeptFromCbetaId 规则结果
 * @author jingxin
 *
 * 用法:
 *   npm run corpus:audit-category
 *   npm run corpus:audit-category -- --dept 新编
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { canonDeptFromCbetaId } from "@/lib/cbeta/corpus-category";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = path.resolve(resolveCorpusRoot());
const deptFilter = (() => {
  const i = process.argv.indexOf("--dept");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

type Mismatch = { rel: string; cbetaId: string; title: string; meta: string; expected: string };

const mismatches: Mismatch[] = [];

for (const metaPath of findSutraMetaFiles(corpusRoot)) {
  const sutraDir = path.dirname(metaPath);
  const rel = path.relative(corpusRoot, sutraDir).replace(/\\/g, "/");
  if (deptFilter && !rel.startsWith(deptFilter) && !rel.includes(deptFilter)) continue;

  const raw = YAML.parse(fs.readFileSync(metaPath, "utf-8")) as Record<string, unknown>;
  const cbetaId = String(raw.cbeta_id ?? "").trim();
  const title = String(raw.title ?? "").trim();
  const metaCat = String(raw.category ?? "").trim();
  if (!cbetaId) continue;

  const expected = canonDeptFromCbetaId(cbetaId, title);
  if (metaCat !== expected) {
    mismatches.push({ rel, cbetaId, title, meta: metaCat, expected });
  }
}

console.log(`Mismatches: ${mismatches.length}${deptFilter ? ` (filter: ${deptFilter})` : ""}`);
for (const m of mismatches.slice(0, 50)) {
  console.log(`  ${m.cbetaId}  meta=${m.meta}  expected=${m.expected}`);
  console.log(`    ${m.rel}`);
}
if (mismatches.length > 50) console.log(`  … and ${mismatches.length - 50} more`);

process.exit(mismatches.length > 0 ? 1 : 0);
