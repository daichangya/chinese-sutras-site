/**
 * Wikidata 人物地理 enrich（FoJin 思路简化版）
 * @author 代长亚
 */
import { getSqlite } from "@/lib/db/sqlite";
import { HIDE_HEURISTIC_PERSON_SQL } from "@/lib/kg/visibility";

function hasKgEntityTable(): boolean {
  const db = getSqlite();
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='kg_entity'`)
    .get() as { name: string } | undefined;
  return !!row;
}

const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const USER_AGENT = "JingxinBot/1.0 (Buddhist reader; local research)";

const SPARQL_BUDDHIST_PERSONS = `
SELECT ?item ?itemLabel ?itemLabelZh ?coord WHERE {
  {
    ?item wdt:P106/wdt:P279* wd:Q4263842 .
  } UNION {
    ?item wdt:P140 wd:Q748 .
    ?item wdt:P106/wdt:P279* wd:Q901 .
  }
  ?item wdt:P625 ?coord .
  OPTIONAL { ?item rdfs:label ?itemLabelZh FILTER(LANG(?itemLabelZh) = "zh") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT 8000
`;

export type WikidataGeoRow = {
  qid: string;
  nameZh: string;
  nameEn: string;
  lat: number;
  lng: number;
};

export function parseWikidataPoint(coord: string): { lat: number; lng: number } | null {
  if (!coord?.startsWith("Point(")) return null;
  const inner = coord.slice(6, -1);
  const parts = inner.split(/\s+/);
  if (parts.length !== 2) return null;
  const lng = parseFloat(parts[0]!);
  const lat = parseFloat(parts[1]!);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function parseWikidataSparqlResults(data: {
  results?: { bindings?: Array<Record<string, { value?: string }>> };
}): WikidataGeoRow[] {
  const rows: WikidataGeoRow[] = [];
  for (const b of data.results?.bindings ?? []) {
    const item = b.item?.value ?? "";
    const qid = item.split("/").pop() ?? "";
    const coord = b.coord?.value ?? "";
    const coords = parseWikidataPoint(coord);
    if (!qid || !coords) continue;
    const nameZh = (b.itemLabelZh?.value ?? b.itemLabel?.value ?? "").trim();
    if (!nameZh) continue;
    rows.push({
      qid,
      nameZh,
      nameEn: (b.itemLabel?.value ?? "").trim(),
      lat: coords.lat,
      lng: coords.lng,
    });
  }
  return rows;
}

export async function fetchWikidataPersonCoords(): Promise<WikidataGeoRow[]> {
  const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(SPARQL_BUDDHIST_PERSONS)}&format=json`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/sparql-results+json",
    },
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL failed: ${res.status}`);
  const data = (await res.json()) as Parameters<typeof parseWikidataSparqlResults>[0];
  return parseWikidataSparqlResults(data);
}

export function indexWikidataByName(rows: WikidataGeoRow[]): Map<string, WikidataGeoRow> {
  const map = new Map<string, WikidataGeoRow>();
  for (const row of rows) {
    const key = row.nameZh.trim();
    if (!map.has(key)) map.set(key, row);
  }
  return map;
}

export type PersonGeoEnrichResult = {
  scanned: number;
  matched: number;
  updated: number;
  skippedHasCoords: number;
};

export function enrichPersonGeoInSqlite(
  wikidataRows: WikidataGeoRow[],
  options?: { dryRun?: boolean; limit?: number },
): PersonGeoEnrichResult {
  const db = getSqlite();
  if (!hasKgEntityTable()) {
    return { scanned: 0, matched: 0, updated: 0, skippedHasCoords: 0 };
  }
  const byName = indexWikidataByName(wikidataRows);
  const limit = options?.limit ?? 50_000;
  const persons = db
    .prepare(
      `SELECT id, name_zh, properties FROM kg_entity e
       WHERE entity_type = 'person' AND ${HIDE_HEURISTIC_PERSON_SQL}
       LIMIT ?`,
    )
    .all(limit) as Array<{ id: string; name_zh: string; properties: string | null }>;

  const update = db.prepare(`UPDATE kg_entity SET properties = ? WHERE id = ?`);
  let matched = 0;
  let updated = 0;
  let skippedHasCoords = 0;

  const tx = db.transaction(() => {
    for (const p of persons) {
      let props: Record<string, unknown> = {};
      if (p.properties) {
        try {
          props = JSON.parse(p.properties) as Record<string, unknown>;
        } catch {
          props = {};
        }
      }
      if (props.lat != null || props.latitude != null) {
        skippedHasCoords++;
        continue;
      }
      const hit = byName.get(p.name_zh.trim());
      if (!hit) continue;
      matched++;
      if (options?.dryRun) continue;
      props.lat = hit.lat;
      props.lng = hit.lng;
      props.geo_source = `wikidata:${hit.qid}`;
      update.run(JSON.stringify(props), p.id);
      updated++;
    }
  });
  tx();

  return {
    scanned: persons.length,
    matched,
    updated,
    skippedHasCoords,
  };
}

export async function runPersonGeoEnrich(options?: {
  dryRun?: boolean;
  limit?: number;
}): Promise<PersonGeoEnrichResult> {
  const rows = await fetchWikidataPersonCoords();
  return enrichPersonGeoInSqlite(rows, options);
}
