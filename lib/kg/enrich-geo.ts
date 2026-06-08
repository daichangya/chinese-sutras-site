/**
 * KG-4：地理/寺庙 enrich（占位：写入 catalog 与 geo README）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { resolveKgRoot } from "@/lib/corpus-v3/paths";
import type { KgEntityRecord } from "./types";

export function ensureGeoPlaceholder(dryRun = false): { geoDir: string; created: boolean } {
  const root = resolveKgRoot();
  const geoDir = path.join(root, "geo");
  if (dryRun) return { geoDir, created: false };
  fs.mkdirSync(geoDir, { recursive: true });
  const readme = path.join(geoDir, "README.md");
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      "# Geo assets\n\nPlace monastery/place GeoJSON here. Run `kg:enrich:geo` after Wikidata/OSM adapters are added.\n",
      "utf-8",
    );
  }
  return { geoDir, created: true };
}

/** 从实体 properties 中带 lat/lng 的条目生成最小 GeoJSON FeatureCollection */
export function entitiesToGeoJson(entities: KgEntityRecord[]): object {
  const features = entities
    .filter((e) => {
      const p = e.properties ?? {};
      return typeof p.lat === "number" && typeof p.lng === "number";
    })
    .map((e) => ({
      type: "Feature",
      properties: { id: e.id, name_zh: e.name_zh, entity_type: e.entity_type },
      geometry: {
        type: "Point",
        coordinates: [e.properties!.lng, e.properties!.lat],
      },
    }));
  return { type: "FeatureCollection", features };
}
