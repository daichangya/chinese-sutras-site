/**
 * 刷新性能预计算表（corpus_stats / sutra_colloquial / kg_geo_flat）
 * @author 代长亚
 */
import { getSqlite, closeDb } from "@/lib/db/sqlite";
import { entityIdToSlug } from "@/lib/kg/slug";
import {
  HAS_GEO_COORDS_SQL,
  PERSON_GEO_VISIBLE_SQL,
  parseKgGeoProperties,
} from "@/lib/kg/geo";
import { HIDE_HEURISTIC_PERSON_SQL } from "@/lib/kg/visibility";

const db = getSqlite();

function hasTable(name: string): boolean {
  return !!db.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`).get(name);
}

const sutraCount = (db.prepare(`SELECT COUNT(*) as c FROM sutra`).get() as { c: number }).c;
const paragraphCount = (db.prepare(`SELECT COUNT(*) as c FROM paragraph`).get() as { c: number }).c;
const dictEntryCount = hasTable("dict_entry")
  ? (db.prepare(`SELECT COUNT(*) as c FROM dict_entry`).get() as { c: number }).c
  : 0;
const kgEntityCount = hasTable("kg_entity")
  ? (db.prepare(`SELECT COUNT(*) as c FROM kg_entity`).get() as { c: number }).c
  : 0;

db.prepare(
  `INSERT INTO corpus_stats (id, sutra_count, paragraph_count, dict_entry_count, kg_entity_count, updated_at)
   VALUES ('main', ?, ?, ?, ?, datetime('now'))
   ON CONFLICT(id) DO UPDATE SET
     sutra_count = excluded.sutra_count,
     paragraph_count = excluded.paragraph_count,
     dict_entry_count = excluded.dict_entry_count,
     kg_entity_count = excluded.kg_entity_count,
     updated_at = excluded.updated_at`,
).run(sutraCount, paragraphCount, dictEntryCount, kgEntityCount);
console.log(
  `corpus_stats: sutras=${sutraCount} paragraphs=${paragraphCount} dict=${dictEntryCount} kg=${kgEntityCount}`,
);

db.exec(`DELETE FROM sutra_colloquial`);
const colloquialRows = db
  .prepare(
    `SELECT DISTINCT sutra_id as sutraId FROM paragraph
     WHERE colloquial IS NOT NULL AND trim(colloquial) != ''`,
  )
  .all() as Array<{ sutraId: string }>;
const insertColloquial = db.prepare(`INSERT OR IGNORE INTO sutra_colloquial (sutra_id) VALUES (?)`);
const insertColloquialBatch = db.transaction((ids: string[]) => {
  for (const id of ids) insertColloquial.run(id);
});
insertColloquialBatch(colloquialRows.map((r) => r.sutraId));
console.log(`sutra_colloquial: ${colloquialRows.length} sutras`);

if (hasTable("kg_entity")) {
  db.exec(`DELETE FROM kg_geo_flat`);
  const types = ["place", "monastery", "person", "school"];
  const placeholders = types.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT id, name_zh as nameZh, entity_type as entityType, properties
       FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL}
         AND ${HAS_GEO_COORDS_SQL}
         AND ${PERSON_GEO_VISIBLE_SQL}
         AND entity_type IN (${placeholders})`,
    )
    .all(...types) as Array<{
    id: string;
    nameZh: string;
    entityType: string;
    properties: string | null;
  }>;

  const insertGeo = db.prepare(`
    INSERT INTO kg_geo_flat (
      entity_id, entity_type, name_zh, lat, lng, geo_source, slug,
      province, city, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let geoCount = 0;
  const insertGeoBatch = db.transaction((batch: typeof rows) => {
    for (const r of batch) {
      const geo = parseKgGeoProperties(r.properties);
      if (!geo) continue;
      insertGeo.run(
        r.id,
        r.entityType,
        r.nameZh,
        geo.lat,
        geo.lng,
        geo.geo_source,
        entityIdToSlug(r.id),
        geo.province,
        geo.city,
        geo.description,
      );
      geoCount += 1;
    }
  });
  insertGeoBatch(rows);
  console.log(`kg_geo_flat: ${geoCount} entities`);
}

closeDb();
console.log("refresh-perf-cache done");
