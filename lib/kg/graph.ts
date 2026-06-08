/**
 * 知识图谱子图查询（server-only）
 * @author 代长亚
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import { normalizeUserZhQuery } from "@/lib/han/storage-normalize";
import { labelPredicate } from "@/lib/kg/labels";
import {
  entityIdToSlug,
  slugEntityTypeCandidates,
  slugToEntityId,
} from "@/lib/kg/slug";
import { HIDE_HEURISTIC_PERSON_SQL } from "@/lib/kg/visibility";
import {
  HAS_GEO_COORDS_SQL,
  PERSON_GEO_VISIBLE_SQL,
  parseKgLatLng,
  rowToKgGeoEntity,
  type KgGeoEntity,
} from "@/lib/kg/geo";
import type { KgGraphEdge, KgGraphNode, KgSubgraph } from "@/lib/kg/types";

export type { KgGraphEdge, KgGraphNode, KgSubgraph } from "@/lib/kg/types";
export type { KgGeoEntity } from "@/lib/kg/geo";
export { parseKgLatLng } from "@/lib/kg/geo";

function hasKgTables(): boolean {
  const db = getSqlite();
  return !!db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='kg_entity'`)
    .get();
}

/** 将用户输入（名称、slug 或 ID）解析为 kg_entity.id */
export function resolveKgCenterId(query: string, entityTypeHint?: string): string | undefined {
  return resolveEntityId(query, entityTypeHint);
}

export function lookupKgEntityMeta(
  entityId: string,
): { id: string; entity_type: string; name_zh: string } | null {
  if (!hasKgTables()) return null;
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT id, entity_type, name_zh FROM kg_entity e
       WHERE e.id = ? AND ${HIDE_HEURISTIC_PERSON_SQL} LIMIT 1`,
    )
    .get(entityId) as { id: string; entity_type: string; name_zh: string } | undefined;
  return row ?? null;
}

function lookupEntityId(db: ReturnType<typeof getSqlite>, id: string): string | undefined {
  const row = db
    .prepare(
      `SELECT id FROM kg_entity e WHERE e.id = ? AND ${HIDE_HEURISTIC_PERSON_SQL} LIMIT 1`,
    )
    .get(id) as { id: string } | undefined;
  return row?.id;
}

export function resolveEntityId(query: string, entityType?: string): string | undefined {
  if (!hasKgTables()) return undefined;
  const db = getSqlite();
  const raw = decodeURIComponent(query.trim());
  if (!raw) return undefined;

  if (raw.startsWith("kg:")) {
    return lookupEntityId(db, raw);
  }

  for (const t of slugEntityTypeCandidates(raw, entityType)) {
    const candidate = slugToEntityId(raw, t);
    if (!candidate) continue;
    const found = lookupEntityId(db, candidate);
    if (found) return found;
  }

  const q = normalizeUserZhQuery(raw);
  if (!q) return undefined;
  const typeClause = entityType ? ` AND e.entity_type = ?` : "";
  const params: string[] = [q, `%${q}%`, `%${q}%`];
  if (entityType) params.push(entityType);
  const row = db
    .prepare(
      `SELECT e.id FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL}
         AND (e.name_zh = ? OR e.name_zh LIKE ? OR e.id LIKE ?)${typeClause}
       ORDER BY
         CASE e.entity_type
           WHEN 'school' THEN 0
           WHEN 'person' THEN 1
           WHEN 'concept' THEN 2
           ELSE 3
         END,
         (
           SELECT COUNT(*) FROM kg_relation r WHERE r.subject_id = e.id OR r.object_id = e.id
         ) DESC
       LIMIT 1`,
    )
    .get(...params) as { id: string } | undefined;
  return row?.id;
}

export function getKgSubgraph(options?: {
  centerId?: string;
  entityType?: string;
  limit?: number;
  depth?: number;
  predicates?: string[];
}): KgSubgraph & { truncated?: boolean } {
  if (!hasKgTables()) return { nodes: [], edges: [] };

  const db = getSqlite();
  const limit = options?.limit ?? 80;
  const depth = Math.min(Math.max(options?.depth ?? 1, 1), 4);
  const centerId = options?.centerId;
  const predicates = options?.predicates?.filter(Boolean);

  if (centerId) {
    return getBfsSubgraph(centerId, depth, limit, predicates);
  }

  const entityType = options?.entityType ?? "person";
  const nodes = db
    .prepare(
      `SELECT e.id, e.name_zh as label, e.entity_type as entityType
       FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL} AND e.entity_type = ?
       ORDER BY (
         SELECT COUNT(*) FROM kg_relation r WHERE r.subject_id = e.id OR r.object_id = e.id
       ) DESC, e.name_zh
       LIMIT ?`,
    )
    .all(entityType, Math.min(limit, 30)) as KgGraphNode[];

  if (nodes.length === 0) return { nodes: [], edges: [] };

  const ids = nodes.map((n) => n.id);
  const placeholders = ids.map(() => "?").join(",");
  let edgeSql = `SELECT subject_id as source, object_id as target, predicate, source as provenance
     FROM kg_relation
     WHERE (subject_id IN (${placeholders}) OR object_id IN (${placeholders}))`;
  const edgeParams: (string | number)[] = [...ids, ...ids];
  if (predicates?.length) {
    edgeSql += ` AND predicate IN (${predicates.map(() => "?").join(",")})`;
    edgeParams.push(...predicates);
  }
  edgeSql += ` LIMIT ?`;
  edgeParams.push(limit);

  const edges = db.prepare(edgeSql).all(...edgeParams) as KgGraphEdge[];
  return { nodes, edges };
}

function getBfsSubgraph(
  centerId: string,
  depth: number,
  limit: number,
  predicates?: string[],
): KgSubgraph & { truncated?: boolean } {
  const db = getSqlite();
  const center = db
    .prepare(
      `SELECT id, name_zh, entity_type FROM kg_entity e WHERE e.id = ? AND ${HIDE_HEURISTIC_PERSON_SQL} LIMIT 1`,
    )
    .get(centerId) as { id: string; name_zh: string; entity_type: string } | undefined;
  if (!center) return { nodes: [], edges: [] };

  const nodeIds = new Set<string>([centerId]);
  const allEdges: KgGraphEdge[] = [];
  const edgeKeys = new Set<string>();
  let frontier = [centerId];
  let truncated = false;

  for (let d = 0; d < depth; d++) {
    if (frontier.length === 0) break;
    const ph = frontier.map(() => "?").join(",");
    let sql = `SELECT subject_id as source, object_id as target, predicate, source as provenance
      FROM kg_relation WHERE (subject_id IN (${ph}) OR object_id IN (${ph}))`;
    const params: string[] = [...frontier, ...frontier];
    if (predicates?.length) {
      sql += ` AND predicate IN (${predicates.map(() => "?").join(",")})`;
      params.push(...predicates);
    }
    sql += ` LIMIT ?`;
    params.push(String(limit));

    const batch = db.prepare(sql).all(...params) as KgGraphEdge[];
    const candidateIds = new Set<string>();

    for (const e of batch) {
      const key = `${e.source}|${e.predicate}|${e.target}`;
      if (edgeKeys.has(key)) continue;
      if (allEdges.length >= limit) {
        truncated = true;
        break;
      }
      edgeKeys.add(key);
      allEdges.push(e);
      for (const nid of [e.source, e.target]) {
        if (!nodeIds.has(nid)) candidateIds.add(nid);
      }
    }

    const nextFrontier = new Set<string>();
    const toValidate = [...candidateIds];
    if (toValidate.length > 0) {
      const ph = toValidate.map(() => "?").join(",");
      const valid = db
        .prepare(
          `SELECT id FROM kg_entity e WHERE e.id IN (${ph}) AND ${HIDE_HEURISTIC_PERSON_SQL}`,
        )
        .all(...toValidate) as Array<{ id: string }>;
      for (const ent of valid) {
        nodeIds.add(ent.id);
        nextFrontier.add(ent.id);
      }
    }
    frontier = [...nextFrontier];
    if (truncated) break;
  }

  const placeholders = [...nodeIds].map(() => "?").join(",");
  const nodes = db
    .prepare(
      `SELECT id, name_zh as label, entity_type as entityType
       FROM kg_entity WHERE id IN (${placeholders})`,
    )
    .all(...nodeIds) as KgGraphNode[];

  return { nodes, edges: allEdges, truncated };
}

export function getKgStats(): {
  entityCounts: Record<string, number>;
  relationCount: number;
  relationCounts: Record<string, number>;
  totalEntities: number;
} {
  if (!hasKgTables()) {
    return { entityCounts: {}, relationCount: 0, relationCounts: {}, totalEntities: 0 };
  }
  const db = getSqlite();
  const entityCounts: Record<string, number> = {};
  const rows = db
    .prepare(
      `SELECT entity_type, COUNT(*) as c FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL}
       GROUP BY entity_type`,
    )
    .all() as Array<{ entity_type: string; c: number }>;
  let totalEntities = 0;
  for (const r of rows) {
    entityCounts[r.entity_type] = r.c;
    totalEntities += r.c;
  }
  const rel = db.prepare(`SELECT COUNT(*) as c FROM kg_relation`).get() as { c: number };
  const relationCounts: Record<string, number> = {};
  const predRows = db
    .prepare(`SELECT predicate, COUNT(*) as c FROM kg_relation GROUP BY predicate`)
    .all() as Array<{ predicate: string; c: number }>;
  for (const r of predRows) {
    relationCounts[r.predicate] = r.c;
  }
  return { entityCounts, relationCount: rel.c, relationCounts, totalEntities };
}

export type KgTimelineEntity = {
  id: string;
  slug: string;
  name_zh: string;
  entity_type: string;
  birth_year: number | null;
  death_year: number | null;
};

export function getKgTimeline(entityType?: string): KgTimelineEntity[] {
  if (!hasKgTables()) return [];
  const db = getSqlite();
  const types = entityType ? [entityType] : ["person", "dynasty"];
  const ph = types.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, name_zh, entity_type, properties FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL} AND e.entity_type IN (${ph})`,
    )
    .all(...types) as Array<{
    id: string;
    name_zh: string;
    entity_type: string;
    properties: string | null;
  }>;

  const out: KgTimelineEntity[] = [];
  for (const r of rows) {
    let birth: number | null = null;
    let death: number | null = null;
    if (r.properties) {
      try {
        const p = JSON.parse(r.properties) as Record<string, unknown>;
        const by = p.birth_year ?? p.birth ?? p.year_start;
        const dy = p.death_year ?? p.death ?? p.year_end;
        if (typeof by === "number") birth = by;
        else if (typeof by === "string" && /^-?\d+$/.test(by)) birth = parseInt(by, 10);
        if (typeof dy === "number") death = dy;
        else if (typeof dy === "string" && /^-?\d+$/.test(dy)) death = parseInt(dy, 10);
      } catch {
        /* ignore */
      }
    }
    if (birth !== null || death !== null || r.entity_type === "dynasty") {
      out.push({
        id: r.id,
        slug: entityIdToSlug(r.id),
        name_zh: r.name_zh,
        entity_type: r.entity_type,
        birth_year: birth,
        death_year: death,
      });
    }
  }
  return out;
}

export type KgLineageArc = {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
};

let geoIndexEnsured = false;

function ensureKgGeoIndex(): void {
  if (geoIndexEnsured) return;
  const db = getSqlite();
  if (!hasKgTables()) return;
  db.exec(`CREATE INDEX IF NOT EXISTS idx_kg_entity_type ON kg_entity(entity_type)`);
  geoIndexEnsured = true;
}

export function getKgGeoEntities(options?: {
  types?: string[];
  limit?: number;
  bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}): KgGeoEntity[] {
  return listPlaceEntities(options);
}

export function getKgLineageArcs(limit = 8000): KgLineageArc[] {
  if (!hasKgTables()) return [];
  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT r.subject_id, r.object_id, s.name_zh as fromName, t.name_zh as toName,
              s.properties as fromProps, t.properties as toProps
       FROM kg_relation r
       JOIN kg_entity s ON s.id = r.subject_id
       JOIN kg_entity t ON t.id = r.object_id
       WHERE r.predicate = 'teacher_of'
         AND ${HIDE_HEURISTIC_PERSON_SQL.replace(/e\./g, "s.")}
         AND ${HIDE_HEURISTIC_PERSON_SQL.replace(/e\./g, "t.")}
         AND ${HAS_GEO_COORDS_SQL.replace(/e\./g, "s.")}
         AND ${HAS_GEO_COORDS_SQL.replace(/e\./g, "t.")}
         AND ${PERSON_GEO_VISIBLE_SQL.replace(/e\./g, "s.")}
         AND ${PERSON_GEO_VISIBLE_SQL.replace(/e\./g, "t.")}
       LIMIT ?`,
    )
    .all(limit) as Array<{
    subject_id: string;
    object_id: string;
    fromName: string;
    toName: string;
    fromProps: string | null;
    toProps: string | null;
  }>;

  const out: KgLineageArc[] = [];
  for (const r of rows) {
    const from = parseKgLatLng(r.fromProps);
    const to = parseKgLatLng(r.toProps);
    if (!from || !to) continue;
    out.push({
      fromId: r.subject_id,
      toId: r.object_id,
      fromName: r.fromName,
      toName: r.toName,
      fromLat: from.lat,
      fromLng: from.lng,
      toLat: to.lat,
      toLng: to.lng,
    });
  }
  return out;
}

export function getEntityDetail(entityId: string): {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string | null;
  entity_type: string;
  source_tier: string;
  source: string;
  properties: Record<string, unknown>;
  relations: Array<{
    predicate: string;
    predicateLabel: string;
    otherId: string;
    otherSlug: string;
    otherName: string;
    otherType: string;
    otherSutraSlug: string | null;
  }>;
  sutras: Array<{ cbetaId: string; title: string; slug: string }>;
} | null {
  if (!hasKgTables()) return null;
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT id, name_zh, name_en, entity_type, properties, source_tier, source
       FROM kg_entity e WHERE e.id = ? AND ${HIDE_HEURISTIC_PERSON_SQL} LIMIT 1`,
    )
    .get(entityId) as {
    id: string;
    name_zh: string;
    name_en: string | null;
    entity_type: string;
    properties: string | null;
    source_tier: string;
    source: string;
  } | undefined;
  if (!row) return null;

  let properties: Record<string, unknown> = {};
  if (row.properties) {
    try {
      properties = JSON.parse(row.properties) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }

  const relRows = getPersonRelations(entityId);
  const relations = relRows.map((r) => ({
    predicate: r.predicate,
    predicateLabel: labelPredicate(r.predicate),
    otherId: r.otherId,
    otherSlug: entityIdToSlug(r.otherId),
    otherName: r.otherName,
    otherType: r.otherType,
    otherSutraSlug: r.otherType === "text" ? getSutraSlugForTextEntity(r.otherId) : null,
  }));

  const sutras = row.entity_type === "person" ? getSutrasForPerson(entityId) : [];

  return {
    id: row.id,
    slug: entityIdToSlug(row.id),
    name_zh: row.name_zh,
    name_en: row.name_en,
    entity_type: row.entity_type,
    source_tier: row.source_tier,
    source: row.source,
    properties,
    relations,
    sutras,
  };
}

export function getPersonRelations(personId: string): Array<{
  predicate: string;
  otherId: string;
  otherName: string;
  otherType: string;
}> {
  const db = getSqlite();
  const rows = db
    .prepare(
      `SELECT r.predicate, r.object_id as otherId, e.name_zh as otherName, e.entity_type as otherType
       FROM kg_relation r
       JOIN kg_entity e ON e.id = r.object_id
       WHERE r.subject_id = ? AND ${HIDE_HEURISTIC_PERSON_SQL.replace(/e\./g, "e.")}
       UNION
       SELECT r.predicate, r.subject_id as otherId, e.name_zh as otherName, e.entity_type as otherType
       FROM kg_relation r
       JOIN kg_entity e ON e.id = r.subject_id
       WHERE r.object_id = ? AND ${HIDE_HEURISTIC_PERSON_SQL.replace(/e\./g, "e.")}
       LIMIT 50`,
    )
    .all(personId, personId) as Array<{
    predicate: string;
    otherId: string;
    otherName: string;
    otherType: string;
  }>;
  return rows;
}

export function getSutraSlugForTextEntity(textEntityId: string): string | null {
  const db = getSqlite();
  if (!hasKgTables()) return null;
  const row = db
    .prepare(
      `SELECT s.slug FROM kg_entity te
       JOIN sutra s ON s.cbeta_id = te.text_id
       WHERE te.id = ? AND te.entity_type = 'text'
       LIMIT 1`,
    )
    .get(textEntityId) as { slug: string } | undefined;
  return row?.slug ?? null;
}

export function getSutrasForPerson(personId: string): Array<{
  cbetaId: string;
  title: string;
  slug: string;
}> {
  const db = getSqlite();
  return db
    .prepare(
      `SELECT s.cbeta_id as cbetaId, s.title, s.slug
       FROM kg_relation r
       JOIN kg_entity te ON te.id = r.object_id AND te.entity_type = 'text'
       JOIN sutra s ON s.cbeta_id = te.text_id
       WHERE r.subject_id = ? AND r.predicate = 'translated'
       UNION
       SELECT s.cbeta_id as cbetaId, s.title, s.slug
       FROM kg_relation r
       JOIN kg_entity te ON te.id = r.subject_id AND te.entity_type = 'text'
       JOIN sutra s ON s.cbeta_id = te.text_id
       WHERE r.object_id = ? AND r.predicate = 'translated'
       LIMIT 20`,
    )
    .all(personId, personId) as Array<{ cbetaId: string; title: string; slug: string }>;
}

function hasKgGeoFlatTable(): boolean {
  const db = getSqlite();
  return !!db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='kg_geo_flat'`)
    .get();
}

function listPlaceEntitiesFromFlat(options?: {
  types?: string[];
  limit?: number;
  bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}): KgGeoEntity[] {
  const types = options?.types?.length
    ? options.types
    : ["place", "monastery", "person", "school"];
  const limit = options?.limit ?? 5000;
  const db = getSqlite();
  const placeholders = types.map(() => "?").join(", ");
  let sql = `
    SELECT entity_id as id, name_zh as nameZh, entity_type as entityType,
           lat, lng, geo_source as geoSource, slug,
           province, city, description
    FROM kg_geo_flat
    WHERE entity_type IN (${placeholders})`;
  const params: Array<string | number> = [...types];

  if (options?.bbox) {
    sql += ` AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?`;
    params.push(
      options.bbox.minLat,
      options.bbox.maxLat,
      options.bbox.minLng,
      options.bbox.maxLng,
    );
  }
  sql += ` LIMIT ?`;
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as Array<{
    id: string;
    nameZh: string;
    entityType: string;
    lat: number;
    lng: number;
    geoSource: string | null;
    slug: string | null;
    province: string | null;
    city: string | null;
    description: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug ?? entityIdToSlug(r.id),
    name_zh: r.nameZh,
    name_en: null,
    entity_type: r.entityType,
    lat: r.lat,
    lng: r.lng,
    province: r.province,
    city: r.city,
    district: null,
    description: r.description,
    year_start: null,
    year_end: null,
    geo_source: r.geoSource,
  }));
}

export function listPlaceEntities(options?: {
  types?: string[];
  limit?: number;
  bbox?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}): KgGeoEntity[] {
  const types = options?.types?.length
    ? options.types
    : ["place", "monastery", "person", "school"];
  const limit = options?.limit ?? 5000;
  const db = getSqlite();
  if (!hasKgTables()) return [];

  if (hasKgGeoFlatTable()) {
    const flatCount = (
      db.prepare(`SELECT COUNT(*) as c FROM kg_geo_flat`).get() as { c: number }
    ).c;
    if (flatCount > 0) {
      return listPlaceEntitiesFromFlat({ types, limit, bbox: options?.bbox });
    }
  }

  ensureKgGeoIndex();
  const placeholders = types.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT id, name_zh as nameZh, name_en as nameEn, entity_type as entityType, properties
       FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL}
         AND ${HAS_GEO_COORDS_SQL}
         AND ${PERSON_GEO_VISIBLE_SQL}
         AND entity_type IN (${placeholders})
       LIMIT ?`,
    )
    .all(...types, limit) as Array<{
    id: string;
    nameZh: string;
    nameEn: string | null;
    entityType: string;
    properties: string | null;
  }>;

  const out: KgGeoEntity[] = [];
  for (const r of rows) {
    const entity = rowToKgGeoEntity(r, entityIdToSlug);
    if (entity) out.push(entity);
  }
  return out;
}
