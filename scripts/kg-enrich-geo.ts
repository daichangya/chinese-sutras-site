/**
 * KG-4：地理 enrich 占位
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import { entitiesToGeoJson, ensureGeoPlaceholder } from "@/lib/kg/enrich-geo";
import { readEntitiesJsonl } from "@/lib/kg/io";

function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { geoDir } = ensureGeoPlaceholder(dryRun);
  if (dryRun) {
    console.log(`[dry-run] would write geo under ${geoDir}`);
    return;
  }
  const entities = readEntitiesJsonl();
  const geo = entitiesToGeoJson(entities);
  const out = path.join(geoDir, "entities.geojson");
  fs.writeFileSync(out, JSON.stringify(geo, null, 2) + "\n", "utf-8");
  console.log(`KG-4: ${(geo as { features: unknown[] }).features.length} features → ${out}`);
}

main();
