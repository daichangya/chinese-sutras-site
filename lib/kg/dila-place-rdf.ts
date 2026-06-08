/**
 * DILA place.rdf 解析（地名 + 经纬度）
 * @author 代长亚
 */
import { normalizeKgEntityForStorage, toSimplifiedZh } from "@/lib/han/storage-normalize";
import type { KgEntityRecord } from "./types";

const PLACE_RDF_URL =
  "https://raw.githubusercontent.com/DILA-edu/lod/master/rdf/place.rdf";

/** BDRC 寺院/伽蓝类 placeType 前缀（PT0053 朝圣地仍为 place，与 FoJin 一致） */
const MONASTERY_PLACE_TYPES = new Set([
  "bdr:PT0032",
  "bdr:PT0033",
  "bdr:PT0034",
  "bdr:PT0035",
  "bdr:PT0037",
  "bdr:PT0038",
  "bdr:PT0040",
  "bdr:PT0050",
  "bdr:PT0064",
]);

export async function fetchDilaPlaceRdf(): Promise<string> {
  const res = await fetch(PLACE_RDF_URL, {
    headers: { "User-Agent": "JingxinCorpus/1.0" },
  });
  if (!res.ok) throw new Error(`place.rdf download failed: ${res.status}`);
  return res.text();
}

function parseCoord(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseFloat(raw.trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

function entityTypeForPlaceType(placeType: string | undefined): "place" | "monastery" {
  if (placeType && MONASTERY_PLACE_TYPES.has(placeType)) return "monastery";
  return "place";
}

export function parseDilaPlaceRdf(content: string, limit = 0): KgEntityRecord[] {
  const blocks = [
    ...content.matchAll(
      /<rdf:Description rdf:about="http:\/\/purl\.dila\.edu\.tw\/resource\/(PL[^"]+)">([\s\S]*?)<\/rdf:Description>/g,
    ),
  ];
  const entities: KgEntityRecord[] = [];

  for (const [, plId, block] of blocks) {
    if (limit > 0 && entities.length >= limit) break;

    let nameZh = "";
    for (const lang of ["zh-Hant", "zh"]) {
      const m = block.match(
        new RegExp(`<skos:prefLabel xml:lang="${lang}">(.+?)</skos:prefLabel>`),
      );
      if (m) {
        nameZh = m[1]!.trim();
        break;
      }
    }
    if (!nameZh) continue;

    let nameEn = "";
    const enM = block.match(/<skos:prefLabel xml:lang="en">(.+?)<\/skos:prefLabel>/);
    if (enM) nameEn = enM[1]!.trim();

    const lat = parseCoord(
      block.match(/<bdo:placeLat>([^<]*)<\/bdo:placeLat>/)?.[1],
    );
    const lng = parseCoord(
      block.match(/<bdo:placeLong>([^<]*)<\/bdo:placeLong>/)?.[1],
    );
    if (lat == null || lng == null) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

    let desc = "";
    const dm = block.match(/<bdo:noteText>([\s\S]*?)<\/bdo:noteText>/);
    if (dm) desc = dm[1]!.replace(/<[^>]+>/g, "").trim();

    const placeType = block.match(/<bdo:placeType>([^<]+)<\/bdo:placeType>/)?.[1];

    entities.push(
      normalizeKgEntityForStorage({
        id: `kg:place:dila:${plId}`,
        entity_type: entityTypeForPlaceType(placeType),
        name_zh: nameZh,
        name_en: nameEn || undefined,
        external_ids: { dila: plId! },
        properties: {
          lat,
          lng,
          ...(placeType ? { place_type: placeType } : {}),
          ...(desc ? { description: toSimplifiedZh(desc) } : {}),
        },
        source_tier: "authoritative",
        source: "dila_lod",
      }),
    );
  }

  return entities;
}
