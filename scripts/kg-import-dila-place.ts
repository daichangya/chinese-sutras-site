/**
 * DILA place.rdf 导入（追加地名实体，不覆盖人物）
 * @author 代长亚
 */
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import { fetchDilaPlaceRdf, parseDilaPlaceRdf } from "@/lib/kg/dila-place-rdf";
import { mergeKgEntities } from "@/lib/kg/extract-text-relations";
import {
  loadKgCatalog,
  readEntitiesJsonl,
  writeEntitiesJsonl,
  writeKgCatalog,
} from "@/lib/kg/io";

function parseLimit(argv: string[]): number {
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--limit" && argv[i + 1]) return parseInt(argv[++i]!, 10) || 0;
  }
  return 0;
}

async function main() {
  const limit = parseLimit(process.argv);
  const root = resolveKgRoot();
  const catalog = loadKgCatalog(root);
  const sources = catalog.sources ?? [];
  if (!sources.some((s) => s.code === "dila_lod_place")) {
    sources.push({
      code: "dila_lod_place",
      name_zh: "DILA LOD 地名",
      license: "CC",
    });
  }
  writeKgCatalog(
    { ...catalog, version: catalog.version ?? 1, updated_at: new Date().toISOString().slice(0, 10), sources },
    root,
  );

  const rdf = await fetchDilaPlaceRdf();
  const places = parseDilaPlaceRdf(rdf, limit);
  const existing = readEntitiesJsonl(root);
  const kept = existing.filter(
    (e) =>
      !(
        e.source === "dila_lod" &&
        (e.entity_type === "place" || e.entity_type === "monastery")
      ),
  );
  const merged = mergeKgEntities(kept, places);
  writeEntitiesJsonl(merged, root);
  console.log(
    `KG place: +${places.length} places (coords) → ${root} (total entities ${merged.length})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
