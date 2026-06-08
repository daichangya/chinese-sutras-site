/**
 * KG 去重合并与冲突报告
 * @author 代长亚
 */
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import { mergeKgEntities, mergeKgRelations } from "@/lib/kg/extract-text-relations";
import {
  readEntitiesJsonl,
  readRelationsJsonl,
  writeEntitiesJsonl,
  writeNameCollisionReport,
  writeRelationsJsonl,
} from "@/lib/kg/io";

function main() {
  const root = resolveKgRoot();
  const entities = readEntitiesJsonl(root);
  const relations = readRelationsJsonl(root);

  const nameCollisions = new Map<string, string[]>();
  for (const e of entities) {
    if (e.entity_type !== "person") continue;
    const k = e.name_zh;
    const list = nameCollisions.get(k) ?? [];
    list.push(e.id);
    nameCollisions.set(k, list);
  }

  const collisionRows: Array<{ name_zh: string; ids: string[] }> = [];
  for (const [name, ids] of nameCollisions) {
    if (ids.length > 1) collisionRows.push({ name_zh: name, ids });
  }
  writeNameCollisionReport(collisionRows, root);
  const collisions = collisionRows.length;

  const mergedE = mergeKgEntities([], entities);
  const mergedR = mergeKgRelations([], relations);
  writeEntitiesJsonl(mergedE, root);
  writeRelationsJsonl(mergedR, root);
  console.log(
    `kg:merge entities=${mergedE.length} relations=${mergedR.length} name_collisions=${collisions}`,
  );
}

main();
