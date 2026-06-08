/**
 * 知识图谱地理查询与 properties 解析（client/server 共享）
 * @author 代长亚
 */

/** SQL：properties 中含 lat 或 latitude */
export const HAS_GEO_COORDS_SQL = `(
  json_extract(e.properties, '$.lat') IS NOT NULL
  OR json_extract(e.properties, '$.latitude') IS NOT NULL
)`;

/**
 * FoJin 对齐：person 仅展示经 Wikidata / 地址匹配 / desc_match_v3 验证的坐标
 */
export const PERSON_GEO_VISIBLE_SQL = `(
  e.entity_type != 'person'
  OR json_extract(e.properties, '$.geo_source') LIKE 'desc_match_v3:%'
  OR (
    COALESCE(json_extract(e.properties, '$.lat'), json_extract(e.properties, '$.latitude')) BETWEEN 18 AND 54
    AND COALESCE(json_extract(e.properties, '$.lng'), json_extract(e.properties, '$.longitude')) BETWEEN 73 AND 135
    AND (
      json_extract(e.properties, '$.geo_source') LIKE 'wikidata%'
      OR json_extract(e.properties, '$.geo_source') LIKE 'city_match%'
      OR json_extract(e.properties, '$.geo_source') LIKE 'province_match%'
    )
  )
)`;

export type KgGeoEntity = {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string | null;
  entity_type: string;
  lat: number;
  lng: number;
  province: string | null;
  city: string | null;
  district: string | null;
  description: string | null;
  year_start: number | null;
  year_end: number | null;
  geo_source: string | null;
};

export function parseKgLatLng(
  properties: string | null,
): { lat: number; lng: number } | null {
  if (!properties) return null;
  try {
    const p = JSON.parse(properties) as Record<string, unknown>;
    const lat = (p.lat ?? p.latitude) as number | undefined;
    const lng = (p.lng ?? p.longitude) as number | undefined;
    if (
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    ) {
      return { lat, lng };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readString(p: Record<string, unknown>, key: string): string | null {
  const v = p[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function readInt(p: Record<string, unknown>, key: string): number | null {
  const v = p[key];
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && /^-?\d+$/.test(v.trim())) return parseInt(v, 10);
  return null;
}

export function parseKgGeoProperties(properties: string | null): {
  lat: number;
  lng: number;
  province: string | null;
  city: string | null;
  district: string | null;
  description: string | null;
  year_start: number | null;
  year_end: number | null;
  geo_source: string | null;
} | null {
  if (!properties) return null;
  try {
    const p = JSON.parse(properties) as Record<string, unknown>;
    const coords = parseKgLatLng(properties);
    if (!coords) return null;
    return {
      ...coords,
      province: readString(p, "province"),
      city: readString(p, "city"),
      district: readString(p, "district"),
      description: readString(p, "description"),
      year_start: readInt(p, "year_start"),
      year_end: readInt(p, "year_end"),
      geo_source: readString(p, "geo_source"),
    };
  } catch {
    return null;
  }
}

export function rowToKgGeoEntity(
  row: {
    id: string;
    nameZh: string;
    nameEn: string | null;
    entityType: string;
    properties: string | null;
  },
  slugFn: (id: string) => string,
): KgGeoEntity | null {
  const geo = parseKgGeoProperties(row.properties);
  if (!geo) return null;
  return {
    id: row.id,
    slug: slugFn(row.id),
    name_zh: row.nameZh,
    name_en: row.nameEn,
    entity_type: row.entityType,
    lat: geo.lat,
    lng: geo.lng,
    province: geo.province,
    city: geo.city,
    district: geo.district,
    description: geo.description,
    year_start: geo.year_start,
    year_end: geo.year_end,
    geo_source: geo.geo_source,
  };
}

/** Deck.GL / 地图专用高对比色（FoJin 对齐） */
export const MAP_TYPE_COLORS: Record<string, string> = {
  person: "#dc2626",
  monastery: "#22c55e",
  place: "#7c3aed",
  school: "#2563eb",
};
