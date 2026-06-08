/**
 * 知识图谱类型（client/server 共享）
 * @author 代长亚
 */

export type KgEntityType =
  | "person"
  | "place"
  | "monastery"
  | "text"
  | "concept"
  | "dynasty"
  | "school";

export type KgSourceTier = "authoritative" | "derived" | "heuristic";

export type KgEntityRecord = {
  id: string;
  entity_type: KgEntityType;
  name_zh: string;
  name_en?: string;
  external_ids?: Record<string, string>;
  properties?: Record<string, unknown>;
  source_tier: KgSourceTier;
  source: string;
  text_id?: string;
};

export type KgRelationRecord = {
  subject_id: string;
  predicate: string;
  object_id: string;
  confidence: number;
  source: string;
};

export type KgSourceMeta = {
  code: string;
  name_zh: string;
  license?: string;
};

export type KgCatalog = {
  version: number;
  updated_at?: string;
  sources: KgSourceMeta[];
};

/** 图谱可视化节点 */
export type KgGraphNode = {
  id: string;
  label: string;
  entityType: string;
};

/** 图谱可视化边 */
export type KgGraphEdge = {
  source: string;
  target: string;
  predicate: string;
  provenance?: string;
  confidence?: number;
};

export type KgSubgraph = {
  nodes: KgGraphNode[];
  edges: KgGraphEdge[];
};

/**
 * kg_entity.properties 地理 enrich 字段（DILA / Wikidata / 高德等）
 * @see docs/admin-guide/03-dictionary-and-kg.md
 */
export type KgGeoProperties = {
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  geo_source?: string;
  year_start?: number;
  year_end?: number;
  description?: string;
  place_type?: string;
  country?: string;
};
