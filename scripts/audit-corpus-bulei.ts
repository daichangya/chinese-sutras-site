/**
 * 审计 bulei.txt 与语料 / XML 的一致性
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { discoverCbetaXmlFiles } from "@/lib/cbeta/discover-xml";
import {
  classifyBuleiResolve,
  getBuleiCatalogIndex,
  getBuleiMetaExact,
  getBuleiParseErrorCount,
  resolveBuleiMeta,
} from "@/lib/cbeta/bulei-catalog";
import { canonDeptFromCbetaId } from "@/lib/cbeta/corpus-category";
import { findSutraMetaFiles, loadSutraMeta } from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";

const corpusRoot = resolveCorpusRoot();
const xmlRoot = process.env.CBETA_XML_DIR ?? "vendor/xml-p5";
const verbose = process.argv.includes("--verbose");

const buleiIndex = getBuleiCatalogIndex();
const xmlIds = [
  ...new Set(
    (fs.existsSync(xmlRoot) ? discoverCbetaXmlFiles(xmlRoot) : []).map((x) => x.cbetaId),
  ),
];
let metaMismatch = 0;
let metaMissingBulei = 0;
let metaInferredOnly = 0;
const missingBuckets = {
  index_hit_no_meta: [] as string[],
  resolver_miss: [] as string[],
};
const mismatchPaths: string[] = [];

const metaPaths = fs.existsSync(corpusRoot) ? findSutraMetaFiles(corpusRoot) : [];

for (const metaPath of metaPaths) {
  const meta = loadSutraMeta(metaPath);
  const rel = path.relative(corpusRoot, path.dirname(metaPath)).replace(/\\/g, "/");
  const canon = canonDeptFromCbetaId(meta.cbetaId, meta.title);
  if (meta.category !== canon) {
    metaMismatch += 1;
    if (verbose) mismatchPaths.push(`${rel} (${meta.cbetaId}) meta=${meta.category} canon=${canon}`);
  }
  if (!meta.bulei?.section) {
    metaMissingBulei += 1;
    const exact = getBuleiMetaExact(meta.cbetaId);
    if (exact) missingBuckets.index_hit_no_meta.push(`${rel} ${meta.cbetaId}`);
    else missingBuckets.resolver_miss.push(`${rel} ${meta.cbetaId}`);
  } else if (meta.bulei.source === "inferred") {
    metaInferredOnly += 1;
  }
}

const buleiIds = new Set(buleiIndex.keys());
const xmlNotInBulei = xmlIds.filter((id) => !buleiIds.has(id));
const buleiNotInXml = [...buleiIds].filter((id) => !xmlIds.includes(id));

let xmlResolveExact = 0;
let xmlResolveAny = 0;
let xmlResolveInferred = 0;
const xmlUnresolved: string[] = [];
for (const id of xmlIds) {
  const c = classifyBuleiResolve(id);
  if (c.exact) xmlResolveExact += 1;
  if (c.resolved) {
    xmlResolveAny += 1;
    if (c.source === "inferred") xmlResolveInferred += 1;
  } else if (verbose && xmlUnresolved.length < 20) {
    xmlUnresolved.push(id);
  }
}

console.log("# bulei 语料审计");
console.log(`bulei 经目数（精确 C 叶）: ${buleiIndex.size}`);
console.log(`bulei 解析告警行: ${getBuleiParseErrorCount()}`);
console.log(`XML 经目数: ${xmlIds.length}`);
console.log(`XML 未入 bulei 精确索引: ${xmlNotInBulei.length}`);
if (xmlNotInBulei.length > 0 && xmlNotInBulei.length <= 30) {
  console.log(xmlNotInBulei.join("\n"));
} else if (xmlNotInBulei.length > 30) {
  console.log(xmlNotInBulei.slice(0, 30).join("\n"));
  console.log(`… 另有 ${xmlNotInBulei.length - 30} 条`);
}
console.log(`bulei 无对应 XML: ${buleiNotInXml.length}`);
console.log(`语料 meta.category 与 canonDept 不一致: ${metaMismatch}`);
console.log(`语料缺 meta.bulei: ${metaMissingBulei}`);
console.log(`语料 meta.bulei 为推断级 (source=inferred): ${metaInferredOnly}`);
console.log(
  `XML resolve 覆盖: 精确=${xmlResolveExact} 任意=${xmlResolveAny}/${xmlIds.length} 推断=${xmlResolveInferred}`,
);

if (verbose) {
  console.log("\n## category 不一致");
  for (const line of mismatchPaths) console.log(line);

  console.log("\n## 缺 meta.bulei：索引有但未写入");
  for (const line of missingBuckets.index_hit_no_meta.slice(0, 30)) console.log(line);
  if (missingBuckets.index_hit_no_meta.length > 30) {
    console.log(`… 另有 ${missingBuckets.index_hit_no_meta.length - 30} 条`);
  }

  console.log("\n## 缺 meta.bulei：resolve 未命中（补录后应消失）");
  for (const line of missingBuckets.resolver_miss.slice(0, 30)) console.log(line);
  if (missingBuckets.resolver_miss.length > 30) {
    console.log(`… 另有 ${missingBuckets.resolver_miss.length - 30} 条`);
  }

  if (xmlUnresolved.length > 0) {
    console.log("\n## XML resolve 失败样例");
    for (const line of xmlUnresolved) console.log(line);
  }
}
