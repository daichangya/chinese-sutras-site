/**
 * 审计「新编」目录：列出应迁出条目及按目标部类统计
 * @author jingxin
 *
 * 用法:
 *   npm run corpus:audit-xinbian
 *   npm run corpus:audit-xinbian -- --csv out.csv
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";
import {
  canonDeptFromCbetaId,
  isModernXinbianCorpus,
  lookupAuxiliaryCanonCategory,
  lookupTaishoCategory,
  lookupXuzangCategory,
  categoryFromTitle,
} from "@/lib/cbeta/corpus-category";
import { seriesCodeFromCbetaId } from "@/lib/cbeta/series-label";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import { corpusDirName } from "@/lib/cbeta/corpus-category";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = path.resolve(resolveCorpusRoot());
const xinbianDir = corpusDirName("新编（新增及近现代文献）");
const csvPath = (() => {
  const i = process.argv.indexOf("--csv");
  return i >= 0 ? process.argv[i + 1] : undefined;
})();

type Row = {
  rel: string;
  cbetaId: string;
  title: string;
  meta: string;
  expected: string;
  reason: string;
};

const xinbianCategory = "新编（新增及近现代文献）";

function classifyReason(cbetaId: string, title: string, expected: string): string {
  if (lookupTaishoCategory(cbetaId) && expected !== xinbianCategory) return "t_sch";
  if (lookupXuzangCategory(cbetaId)) return "x_sch";
  if (lookupAuxiliaryCanonCategory(cbetaId)) return "aux_sch";
  const series = seriesCodeFromCbetaId(cbetaId);
  if (series === "X" || series === "F" || series === "T" || series === "A") {
    if (categoryFromTitle(title)) return "title";
  }
  if (isModernXinbianCorpus(cbetaId, title)) return "modern";
  return "other";
}

const rows: Row[] = [];
const byExpected = new Map<string, number>();

for (const metaPath of findSutraMetaFiles(corpusRoot)) {
  const sutraDir = path.dirname(metaPath);
  const rel = path.relative(corpusRoot, sutraDir).replace(/\\/g, "/");
  if (!rel.startsWith(xinbianDir)) continue;

  const raw = YAML.parse(fs.readFileSync(metaPath, "utf-8")) as Record<string, unknown>;
  const cbetaId = String(raw.cbeta_id ?? "").trim();
  const title = String(raw.title ?? "").trim();
  const metaCat = String(raw.category ?? "").trim();
  if (!cbetaId) continue;

  const expected = canonDeptFromCbetaId(cbetaId, title);
  if (expected === xinbianCategory) continue;

  const reason = classifyReason(cbetaId, title, expected);
  rows.push({ rel, cbetaId, title, meta: metaCat, expected, reason });
  byExpected.set(expected, (byExpected.get(expected) ?? 0) + 1);
}

console.log(`新编目录应迁出: ${rows.length} 部`);
console.log("按目标部类:");
for (const [cat, n] of [...byExpected.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${n}`);
}

console.log("\n按原因:");
const byReason = new Map<string, number>();
for (const r of rows) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + 1);
for (const [reason, n] of [...byReason.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${reason}: ${n}`);
}

console.log("\n样例（前 30）:");
for (const r of rows.slice(0, 30)) {
  console.log(`  ${r.cbetaId}  ${r.meta} → ${r.expected}  (${r.reason})`);
  console.log(`    ${r.title.slice(0, 40)}`);
  console.log(`    ${r.rel}`);
}

if (csvPath) {
  const header = "cbeta_id,title,meta,expected,reason,rel\n";
  const body = rows
    .map(
      (r) =>
        `${r.cbetaId},"${r.title.replace(/"/g, '""')}",${r.meta},${r.expected},${r.reason},"${r.rel}"`,
    )
    .join("\n");
  fs.writeFileSync(csvPath, header + body, "utf-8");
  console.log(`\n已写入 ${csvPath}`);
}

process.exit(0);
