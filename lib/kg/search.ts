/**
 * 知识图谱实体搜索（server-only）
 * @author 代长亚
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import { s2t, t2s } from "@/lib/han/converter";
import { normalizeUserZhQuery } from "@/lib/han/storage-normalize";
import { entityDescription, parseEntityProperties } from "@/lib/kg/display";
import { entityIdToSlug } from "@/lib/kg/slug";
import { HIDE_HEURISTIC_PERSON_SQL } from "@/lib/kg/visibility";
import type { KgEntityType } from "@/lib/kg/types";

export type KgSearchHit = {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string | null;
  entity_type: KgEntityType | string;
  relation_count: number;
  description: string | null;
  source_tier: string;
  dynasty: string | null;
  region_hint: string | null;
};

const TEMPLE_NAME_SUFFIXES = ["寺", "院", "庵"];

/** 生成简繁 query 变体（FoJin _zh_variants 子集） */
export function zhQueryVariants(q: string): string[] {
  const variants = new Set<string>([q]);
  const simplified = t2s(q, { backend: "js" }).text.trim();
  const traditional = s2t(q, { backend: "js" }).text.trim();
  if (simplified) variants.add(simplified);
  if (traditional) variants.add(traditional);
  return [...variants];
}

function regionHintFromProperties(
  entityType: string,
  props: Record<string, unknown>,
): string | null {
  if (entityType !== "place" && entityType !== "monastery") return null;
  const province = (props["province"] as string | undefined)?.trim();
  if (province) return province;
  const region = (props["region"] as string | undefined)?.trim();
  if (region) return region;
  const country = (props["country"] as string | undefined)?.trim();
  if (country && country !== "CN") return country;
  const lat = props["lat"] ?? props["latitude"];
  const lng = props["lng"] ?? props["longitude"];
  if (typeof lat === "number" && typeof lng === "number") {
    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  }
  return null;
}

function isTemplePlaceName(name: string): boolean {
  return TEMPLE_NAME_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

function buildNameMatchClause(variants: string[]): { clause: string; params: string[] } {
  const parts: string[] = [];
  const params: string[] = [];
  for (const v of variants) {
    parts.push(`e.name_zh = ? OR e.name_zh LIKE ? OR e.name_en LIKE ? OR e.id LIKE ?`);
    params.push(v, `%${v}%`, `%${v}%`, `%${v}%`);
  }
  return { clause: `(${parts.join(" OR ")})`, params };
}

function buildTypeFilterClause(typeFilter: string | undefined): { clause: string; params: string[] } {
  if (!typeFilter) return { clause: "", params: [] };
  if (typeFilter === "monastery") {
    const suffixChecks = TEMPLE_NAME_SUFFIXES.map(() => `e.name_zh LIKE ?`).join(" OR ");
    return {
      clause: ` AND (e.entity_type = 'monastery' OR (e.entity_type = 'place' AND (${suffixChecks})))`,
      params: TEMPLE_NAME_SUFFIXES.map((s) => `%${s}`),
    };
  }
  return { clause: ` AND e.entity_type = ?`, params: [typeFilter] };
}

function runSearchQuery(options: {
  variants: string[];
  entityType?: string;
  limit: number;
}): KgSearchHit[] {
  const db = getSqlite();
  const { clause: nameClause, params: nameParams } = buildNameMatchClause(options.variants);
  const { clause: typeClause, params: typeParams } = buildTypeFilterClause(options.entityType);

  const exactVariant = options.variants[0] ?? "";
  const prefixVariant = options.variants[0] ?? "";

  let sql = `
    SELECT e.id, e.name_zh, e.name_en, e.entity_type, e.properties, e.source_tier,
      (SELECT COUNT(*) FROM kg_relation r
       WHERE r.subject_id = e.id OR r.object_id = e.id) AS relation_count
    FROM kg_entity e
    WHERE ${HIDE_HEURISTIC_PERSON_SQL}
      AND ${nameClause}
      ${typeClause}
    ORDER BY
      CASE WHEN e.name_zh = ? THEN 0 WHEN e.name_zh LIKE ? THEN 1 ELSE 2 END,
      CASE e.entity_type
        WHEN 'school' THEN 0
        WHEN 'person' THEN 1
        WHEN 'concept' THEN 2
        WHEN 'monastery' THEN 3
        WHEN 'place' THEN 4
        WHEN 'dynasty' THEN 5
        WHEN 'text' THEN 6
        ELSE 7
      END,
      relation_count DESC,
      e.source_tier = 'authoritative' DESC,
      length(e.name_zh) ASC
    LIMIT ?
  `;
  const params: (string | number)[] = [
    ...nameParams,
    ...typeParams,
    exactVariant,
    `${prefixVariant}%`,
    options.limit,
  ];

  const rows = db.prepare(sql).all(...params) as Array<{
    id: string;
    name_zh: string;
    name_en: string | null;
    entity_type: string;
    properties: string | null;
    source_tier: string;
    relation_count: number;
  }>;

  return rows.map((r) => {
    const props = parseEntityProperties(r.properties);
    return {
      id: r.id,
      slug: entityIdToSlug(r.id),
      name_zh: r.name_zh,
      name_en: r.name_en,
      entity_type: r.entity_type,
      relation_count: r.relation_count,
      description: entityDescription(props),
      source_tier: r.source_tier,
      dynasty:
        ((props["dynasty"] as string | undefined) ||
          (props["era"] as string | undefined) ||
          null) ?? null,
      region_hint: regionHintFromProperties(r.entity_type, props),
    };
  });
}

export function searchKgEntities(options: {
  q: string;
  entityType?: string;
  limit?: number;
  /** 为 true 时不放宽 entityType（统一搜索人物分组等场景） */
  strictType?: boolean;
}): { total: number; results: KgSearchHit[]; relaxedType?: boolean } {
  const q = normalizeUserZhQuery(options.q);
  if (!q) return { total: 0, results: [] };

  const db = getSqlite();
  const hasTable = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='kg_entity'`)
    .get();
  if (!hasTable) return { total: 0, results: [] };

  const limit = options.limit ?? 20;
  const typeFilter = options.entityType?.trim() || undefined;
  const variants = zhQueryVariants(q);

  let results = runSearchQuery({ variants, entityType: typeFilter, limit });
  let relaxedType = false;

  if (!options.strictType && typeFilter && results.length === 0) {
    results = runSearchQuery({ variants, limit });
    relaxedType = results.length > 0;
  }

  return { total: results.length, results, ...(relaxedType ? { relaxedType: true } : {}) };
}

export { isTemplePlaceName };
