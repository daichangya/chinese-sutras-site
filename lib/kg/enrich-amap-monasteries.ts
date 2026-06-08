/**
 * 高德寺院 POI enrich（FoJin import_amap_temples_v3 对齐）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { getSqlite } from "@/lib/db/sqlite";
import { mergeKgEntities } from "@/lib/kg/extract-text-relations";
import { normalizeKgEntityForStorage } from "@/lib/han/storage-normalize";
import { readEntitiesJsonl, writeEntitiesJsonl } from "@/lib/kg/io";
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import type { KgEntityRecord } from "@/lib/kg/types";

function hasKgEntityTable(): boolean {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='kg_entity'`)
    .get() as { name: string } | undefined;
  return !!row;
}

export type AmapTemplePoi = {
  amap_id: string;
  name: string;
  latitude: number;
  longitude: number;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
};

export function parseAmapTemplesJson(raw: unknown): AmapTemplePoi[] {
  if (!Array.isArray(raw)) return [];
  const out: AmapTemplePoi[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const amap_id = String(o.amap_id ?? o.id ?? "").trim();
    const name = String(o.name ?? "").trim();
    const latitude = Number(o.latitude ?? o.lat);
    const longitude = Number(o.longitude ?? o.lng);
    if (!amap_id || !name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    out.push({
      amap_id,
      name,
      latitude,
      longitude,
      province: typeof o.province === "string" ? o.province : undefined,
      city: typeof o.city === "string" ? o.city : undefined,
      district: typeof o.district === "string" ? o.district : undefined,
      address: typeof o.address === "string" ? o.address : undefined,
    });
  }
  return out;
}

export function amapPoiToEntity(poi: AmapTemplePoi): KgEntityRecord {
  return normalizeKgEntityForStorage({
    id: `kg:monastery:amap:${poi.amap_id}`,
    entity_type: "monastery",
    name_zh: poi.name,
    external_ids: { amap: poi.amap_id },
    properties: {
      lat: poi.latitude,
      lng: poi.longitude,
      latitude: poi.latitude,
      longitude: poi.longitude,
      geo_source: "amap:CN",
      country: "CN",
      province: poi.province ?? "",
      city: poi.city ?? "",
      district: poi.district ?? "",
      address: poi.address ?? "",
    },
    source_tier: "derived",
    source: "amap_v3",
  });
}

export type AmapEnrichResult = {
  loaded: number;
  insertedJsonl: number;
  insertedSqlite: number;
  skippedExisting: number;
};

export function enrichAmapMonasteries(
  pois: AmapTemplePoi[],
  options?: { dryRun?: boolean },
): AmapEnrichResult {
  const db = getSqlite();

  const existingAmap = new Set<string>();
  const coordNames = new Set<string>();
  if (hasKgEntityTable()) {
    const rows = db
      .prepare(
        `SELECT name_zh, properties, external_ids FROM kg_entity WHERE entity_type = 'monastery'`,
      )
      .all() as Array<{
      name_zh: string;
      properties: string | null;
      external_ids: string | null;
    }>;
    for (const r of rows) {
      if (r.external_ids) {
        try {
          const ext = JSON.parse(r.external_ids) as Record<string, string>;
          if (ext.amap) existingAmap.add(ext.amap);
        } catch {
          /* ignore */
        }
      }
      if (r.properties) {
        try {
          const p = JSON.parse(r.properties) as Record<string, unknown>;
          const lat = Number(p.lat ?? p.latitude);
          const lng = Number(p.lng ?? p.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            coordNames.add(`${r.name_zh}|${lat.toFixed(4)}|${lng.toFixed(4)}`);
          }
        } catch {
          /* ignore */
        }
      }
    }
  }

  const newEntities: KgEntityRecord[] = [];
  let skippedExisting = 0;
  for (const poi of pois) {
    if (existingAmap.has(poi.amap_id)) {
      skippedExisting++;
      continue;
    }
    const key = `${poi.name}|${poi.latitude.toFixed(4)}|${poi.longitude.toFixed(4)}`;
    if (coordNames.has(key)) {
      skippedExisting++;
      continue;
    }
    newEntities.push(amapPoiToEntity(poi));
    coordNames.add(key);
    existingAmap.add(poi.amap_id);
  }

  if (options?.dryRun) {
    return {
      loaded: pois.length,
      insertedJsonl: newEntities.length,
      insertedSqlite: newEntities.length,
      skippedExisting,
    };
  }

  const root = resolveKgRoot();
  const existing = readEntitiesJsonl(root);
  const merged = mergeKgEntities(existing, newEntities);
  writeEntitiesJsonl(merged, root);
  const insertedJsonl = merged.length - existing.length;

  let insertedSqlite = 0;
  if (hasKgEntityTable() && newEntities.length > 0) {
    const ins = db.prepare(
      `INSERT OR REPLACE INTO kg_entity (id, entity_type, name_zh, name_en, external_ids, properties, source_tier, source, text_id)
       VALUES (@id, @entity_type, @name_zh, @name_en, @external_ids, @properties, @source_tier, @source, @text_id)`,
    );
    const tx = db.transaction(() => {
      for (const e of newEntities) {
        ins.run({
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
        insertedSqlite++;
      }
    });
    tx();
  }

  return {
    loaded: pois.length,
    insertedJsonl,
    insertedSqlite,
    skippedExisting,
  };
}

export function loadAmapTemplesFromFile(filePath: string): AmapTemplePoi[] {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
  return parseAmapTemplesJson(raw);
}

export function defaultAmapTemplesPath(): string {
  return path.join(process.cwd(), "data", "amap_temples_v3.json");
}
