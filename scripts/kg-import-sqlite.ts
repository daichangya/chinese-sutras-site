/**
 * KG JSONL → SQLite
 * @author 代长亚
 */
import { closeDb, getSqlite } from "@/lib/db/sqlite";
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import { normalizeKgEntityForStorage } from "@/lib/han/storage-normalize";
import { readEntitiesJsonl, readRelationsJsonl } from "@/lib/kg/io";

function main() {
  const root = resolveKgRoot();
  const entities = readEntitiesJsonl(root);
  const relations = readRelationsJsonl(root);
  const db = getSqlite();

  const insEntity = db.prepare(
    `INSERT OR REPLACE INTO kg_entity (id, entity_type, name_zh, name_en, external_ids, properties, source_tier, source, text_id)
     VALUES (@id, @entity_type, @name_zh, @name_en, @external_ids, @properties, @source_tier, @source, @text_id)`,
  );
  const insRel = db.prepare(
    `INSERT OR REPLACE INTO kg_relation (subject_id, predicate, object_id, confidence, source)
     VALUES (@subject_id, @predicate, @object_id, @confidence, @source)`,
  );
  const insTextLink = db.prepare(
    `INSERT OR IGNORE INTO kg_entity_text (entity_id, cbeta_id) VALUES (?, ?)`,
  );

  const tx = db.transaction(() => {
    db.exec(`DELETE FROM kg_entity_text`);
    for (const raw of entities) {
      const e = normalizeKgEntityForStorage(raw);
      insEntity.run({
        id: e.id,
        entity_type: e.entity_type,
        name_zh: e.name_zh,
        name_en: e.name_en ?? null,
        external_ids: e.external_ids ? JSON.stringify(e.external_ids) : null,
        properties: e.properties ? JSON.stringify(e.properties) : null,
        source_tier: e.source_tier,
        source: e.source,
        text_id: e.text_id ?? null,
      });
      if (e.entity_type === "text" && e.text_id) {
        insTextLink.run(e.id, e.text_id);
      }
    }
    for (const r of relations) {
      insRel.run(r);
    }
  });

  tx();
  console.log(`KG SQLite: ${entities.length} entities, ${relations.length} relations`);
  closeDb();
}

main();
