/**
 * KG entities.jsonl + SQLite properties 简体归一化迁移
 * @author 代长亚
 */
import { closeDb, getSqlite } from "@/lib/db/sqlite";
import { detectScript } from "@/lib/han";
import { normalizeKgEntityForStorage } from "@/lib/han/storage-normalize";
import { readEntitiesJsonl, writeEntitiesJsonl } from "@/lib/kg/io";
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import type { KgEntityRecord } from "@/lib/kg/types";

function descriptionScript(entity: KgEntityRecord): string | null {
  const desc = entity.properties?.description;
  return typeof desc === "string" && desc.trim() ? desc : null;
}

function countTraditionalDescriptions(entities: KgEntityRecord[]): number {
  let n = 0;
  for (const e of entities) {
    const desc = descriptionScript(e);
    if (!desc) continue;
    const script = detectScript(desc);
    if (script === "traditional" || script === "mixed") n += 1;
  }
  return n;
}

function main() {
  const root = resolveKgRoot();
  const entities = readEntitiesJsonl(root);
  const beforeTraditional = countTraditionalDescriptions(entities);
  const normalized = entities.map((e) => normalizeKgEntityForStorage(e));
  writeEntitiesJsonl(normalized, root);
  const afterTraditional = countTraditionalDescriptions(normalized);

  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT id, entity_type, name_zh, name_en, external_ids, properties, source_tier, source, text_id
       FROM kg_entity`,
    )
    .all() as Array<{
    id: string;
    entity_type: string;
    name_zh: string;
    name_en: string | null;
    external_ids: string | null;
    properties: string | null;
    source_tier: string;
    source: string;
    text_id: string | null;
  }>;

  const update = db.prepare(`UPDATE kg_entity SET name_zh = ?, properties = ? WHERE id = ?`);
  let dbUpdated = 0;

  const tx = db.transaction(() => {
    for (const row of rows) {
      let properties: Record<string, unknown> | undefined;
      if (row.properties) {
        try {
          properties = JSON.parse(row.properties) as Record<string, unknown>;
        } catch {
          properties = undefined;
        }
      }

      const entity = normalizeKgEntityForStorage({
        id: row.id,
        entity_type: row.entity_type as KgEntityRecord["entity_type"],
        name_zh: row.name_zh,
        name_en: row.name_en ?? undefined,
        external_ids: row.external_ids ? (JSON.parse(row.external_ids) as KgEntityRecord["external_ids"]) : undefined,
        properties,
        source_tier: row.source_tier as KgEntityRecord["source_tier"],
        source: row.source,
        text_id: row.text_id ?? undefined,
      });

      const nextProps = entity.properties ? JSON.stringify(entity.properties) : null;
      if (entity.name_zh !== row.name_zh || nextProps !== row.properties) {
        update.run(entity.name_zh, nextProps, row.id);
        dbUpdated += 1;
      }
    }
  });

  tx();

  const xuanzang = db
    .prepare(`SELECT properties FROM kg_entity WHERE id = 'kg:person:dila:A000294'`)
    .get() as { properties: string } | undefined;

  console.log(`KG simplify: JSONL ${entities.length} entities`);
  console.log(`  description traditional: ${beforeTraditional} → ${afterTraditional}`);
  console.log(`  SQLite updated rows: ${dbUpdated}`);
  if (xuanzang?.properties) {
    const desc = (JSON.parse(xuanzang.properties) as { description?: string }).description ?? "";
    console.log(`  玄奘 sample: ${desc.slice(0, 40)}…`);
  }

  closeDb();
}

main();
