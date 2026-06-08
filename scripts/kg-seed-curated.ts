/**
 * 写入 FoJin 0037/0094 curated seed 到 KG JSONL
 * @author 代长亚
 */
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import { mergeKgEntities, mergeKgRelations } from "@/lib/kg/extract-text-relations";
import {
  readEntitiesJsonl,
  readRelationsJsonl,
  writeEntitiesJsonl,
  writeRelationsJsonl,
} from "@/lib/kg/io";
import { buildFojinCuratedSeed } from "@/lib/kg/seed-fojin-curated";

function main() {
  const root = resolveKgRoot();
  const existing = readEntitiesJsonl(root);
  const existingRels = readRelationsJsonl(root);

  const { entities: seedEntities, relations: seedRelations } = buildFojinCuratedSeed(existing);
  const mergedEntities = mergeKgEntities(existing, seedEntities);
  const mergedRelations = mergeKgRelations(existingRels, seedRelations);

  writeEntitiesJsonl(mergedEntities, root);
  writeRelationsJsonl(mergedRelations, root);

  console.log(
    `kg:seed:curated added entities=${seedEntities.length} relations=${seedRelations.length} total_entities=${mergedEntities.length} total_relations=${mergedRelations.length}`,
  );
}

main();
