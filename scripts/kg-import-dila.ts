/**
 * KG-1：DILA person.rdf 导入
 * @author 代长亚
 */
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import { fetchDilaPersonRdf, parseDilaPersonRdf } from "@/lib/kg/dila-rdf";
import { mergeKgEntities, mergeKgRelations } from "@/lib/kg/extract-text-relations";
import {
  readEntitiesJsonl,
  readRelationsJsonl,
  writeEntitiesJsonl,
  writeKgCatalog,
  writeRelationsJsonl,
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
  writeKgCatalog({
    version: 1,
    updated_at: new Date().toISOString().slice(0, 10),
    sources: [{ code: "dila_lod", name_zh: "DILA LOD 人物", license: "CC" }],
  }, root);

  const rdf = await fetchDilaPersonRdf();
  const { entities, relations } = parseDilaPersonRdf(rdf, limit);
  const existingEntities = readEntitiesJsonl(root);
  const existingRelations = readRelationsJsonl(root);
  const keptEntities = existingEntities.filter(
    (e) => !(e.entity_type === "person" && e.source === "dila_lod"),
  );
  const keptRelations = existingRelations.filter((r) => r.source !== "dila_lod");
  writeEntitiesJsonl(mergeKgEntities(keptEntities, entities), root);
  writeRelationsJsonl(mergeKgRelations(keptRelations, relations), root);
  console.log(`KG-1: ${entities.length} entities, ${relations.length} relations → ${root}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
