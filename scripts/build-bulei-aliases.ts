/**
 * 为 XML 经目生成 bulei-id-aliases.json（resolve 仍失败时写入别名建议）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { discoverCbetaXmlFiles } from "@/lib/cbeta/discover-xml";
import {
  classifyBuleiResolve,
  getBuleiCatalogIndex,
  resetBuleiCatalogCache,
} from "@/lib/cbeta/bulei-catalog";
import { resetCatalogBridgeCache } from "@/lib/cbeta/bulei-catalog-bridge";
import { resetBuleiAliasCache } from "@/lib/cbeta/bulei-aliases";
import { resetSutralistFullCache } from "@/lib/cbeta/sutralist-full";
import { BULEI_ALIASES_PATH, type BuleiAliasEntry } from "@/lib/cbeta/bulei-aliases";

const xmlRoot = process.env.CBETA_XML_DIR ?? "vendor/xml-p5";
const dryRun = process.argv.includes("--dry-run");

resetBuleiCatalogCache();
resetSutralistFullCache();
resetCatalogBridgeCache();
resetBuleiAliasCache();

const exactIds = new Set(getBuleiCatalogIndex().keys());
const xmlIds = fs.existsSync(xmlRoot)
  ? [...new Set(discoverCbetaXmlFiles(xmlRoot).map((x) => x.cbetaId))]
  : [];

const aliases: BuleiAliasEntry[] = [];
let inferred = 0;
let resolvedNonExact = 0;

for (const id of xmlIds) {
  const c = classifyBuleiResolve(id);
  if (c.exact) continue;
  if (c.resolved && c.source !== "inferred") {
    resolvedNonExact += 1;
    continue;
  }
  if (c.source === "inferred") {
    inferred += 1;
    continue;
  }
  aliases.push({
    cbeta_id: id,
    reason: "resolve_failed_at_build",
    confidence: "low",
  });
}

const out = {
  version: 1,
  generated_at: new Date().toISOString(),
  stats: {
    xml_total: xmlIds.length,
    exact_index: exactIds.size,
    resolved_non_exact: resolvedNonExact,
    inferred,
    alias_candidates: aliases.length,
  },
  aliases,
};

console.log(JSON.stringify(out.stats, null, 2));

if (!dryRun) {
  fs.mkdirSync(path.dirname(BULEI_ALIASES_PATH), { recursive: true });
  fs.writeFileSync(BULEI_ALIASES_PATH, JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${BULEI_ALIASES_PATH}`);
} else {
  console.log("[dry-run] would write", aliases.length, "alias candidates");
}
