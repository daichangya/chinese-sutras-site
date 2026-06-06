/**
 * 知识图谱子图查询（server-only）
 * @author jingxin
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import { normalizeUserZhQuery } from "@/lib/han/storage-normalize";
import { labelPredicate } from "@/lib/kg/labels";
import { entityIdToSlug, resolveEntityIdFromSlugOrId } from "@/lib/kg/slug";
import { HIDE_HEURISTIC_PERSON_SQL } from "@/lib/kg/visibility";
import type { KgGraphEdge, KgGraphNode, KgSubgraph } from "@/lib/kg/types";

export type { KgGraphEdge, KgGraphNode, KgSubgraph } from "@/lib/kg/types";

function hasKgTables(): boolean {
  const db = getSqlite();
  return !!db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='kg_entity'`)
    .get();
}

/** 将用户输入（名称、slug 或 ID）解析为 kg_entity.id */
export function resolveKgCenterId(query: string): string | undefined {
  const q = normalizeUserZhQuery(query);
  if (!q) return undefined;
  if (!hasKgTables()) return undefined;

  const db = getSqlite();
  const fromSlug = resolveEntityIdFromSlugOrId(q);
  if (fromSlug) {
    const row = db
      .prepare(
        `SELECT id FROM kg_entity e WHERE e.id = ? AND ${HIDE_HEURISTIC_PERSON_SQL} LIMIT 1`,
      )
      .get(fromSlug) as { id: string } | undefined;
    if (row) return row.id;
  }

  const row = db
    .prepare(
      `SELECT e.id
       FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL}
         AND e.entity_type = 'person'
         AND (e.name_zh = ? OR e.name_zh LIKE ? OR e.id LIKE ?)
       ORDER BY (
         SELECT COUNT(*) FROM kg_relation r
         WHERE r.subject_id = e.id OR r.object_id = e.id
       ) DESC, e.source_tier = 'authoritative' DESC, length(e.name_zh) ASC
       LIMIT 1`,
    )
    .get(q, `%${q}%`, `%${q}%`) as { id: string } | undefined;

  return row?.id;
}

export function resolveEntityId(query: string, entityType?: string): string | undefined {
  if (!hasKgTables()) return undefined;
  const db = getSqlite();
  const fromSlug = resolveEntityIdFromSlugOrId(query, entityType);
  if (fromSlug) {
    const row = db
      .prepare(`SELECT id FROM kg_entity e WHERE e.id = ? AND ${HIDE_HEURISTIC_PERSON_SQL} LIMIT 1`)
      .get(fromSlug) as { id: string } | undefined;
    if (row) return row.id;
  }
  const q = normalizeUserZhQuery(query);
  if (!q) return undefined;
  const typeClause = entityType ? ` AND e.entity_type = ?` : "";
  const params: string[] = [q, `%${q}%`, `%${q}%`];
  if (entityType) params.push(entityType);
  const row = db
    .prepare(
      `SELECT e.id FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL}
         AND (e.name_zh = ? OR e.name_zh LIKE ? OR e.id LIKE ?)${typeClause}
       ORDER BY (
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
    const nextFrontier = new Set<string>();

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
        if (!nodeIds.has(nid)) {
          const ent = db
            .prepare(
              `SELECT id FROM kg_entity e WHERE e.id = ? AND ${HIDE_HEURISTIC_PERSON_SQL} LIMIT 1`,
            )
            .get(nid) as { id: string } | undefined;
          if (ent) {
            nodeIds.add(nid);
            nextFrontier.add(nid);
          }
        }
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

export type KgGeoEntity = {
  id: string;
  slug: string;
  name_zh: string;
  entity_type: string;
  lat: number;
  lng: number;
};

export function getKgGeoEntities(options?: {
  types?: string[];
  limit?: number;
}): KgGeoEntity[] {
  const types = options?.types?.length
    ? options.types
    : ["place", "monastery", "person", "school"];
  const limit = options?.limit ?? 500;
  const places = listPlaceEntities(limit * 2);
  return places
    .filter((p) => types.includes(p.entityType))
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      slug: entityIdToSlug(p.id),
      name_zh: p.nameZh,
      entity_type: p.entityType,
      lat: p.lat,
      lng: p.lng,
    }));
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

export function getKgLineageArcs(limit = 200): KgLineageArc[] {
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
    const from = parseLatLng(r.fromProps);
    const to = parseLatLng(r.toProps);
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

function parseLatLng(properties: string | null): { lat: number; lng: number } | null {
  if (!properties) return null;
  try {
    const p = JSON.parse(properties) as Record<string, unknown>;
    const lat = (p.lat ?? p.latitude) as number | undefined;
    const lng = (p.lng ?? p.longitude) as number | undefined;
    if (typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  } catch {
    /* ignore */
  }
  return null;
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

export function listPlaceEntities(limit = 100): Array<{
  id: string;
  nameZh: string;
  entityType: string;
  lat: number;
  lng: number;
}> {
  const db = getSqlite();
  if (!hasKgTables()) return [];

  const rows = db
    .prepare(
      `SELECT id, name_zh as nameZh, entity_type as entityType, properties
       FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL}
         AND entity_type IN ('place', 'monastery', 'person', 'school')
       LIMIT ?`,
    )
    .all(limit * 3) as Array<{
    id: string;
    nameZh: string;
    entityType: string;
    properties: string | null;
  }>;

  const out: Array<{
    id: string;
    nameZh: string;
    entityType: string;
    lat: number;
    lng: number;
  }> = [];

  for (const r of rows) {
    const coords = parseLatLng(r.properties);
    if (!coords) continue;
    out.push({
      id: r.id,
      nameZh: r.nameZh,
      entityType: r.entityType,
      lat: coords.lat,
      lng: coords.lng,
    });
    if (out.length >= limit) break;
  }

  return out;
}
