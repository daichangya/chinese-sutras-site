/**
 * DILA person.rdf 解析（KG-1）
 * @author 代长亚
 */
import { normalizeKgEntityForStorage, toSimplifiedZh } from "@/lib/han/storage-normalize";
import type { KgEntityRecord, KgRelationRecord } from "./types";

const RDF_URL = "https://raw.githubusercontent.com/DILA-edu/lod/master/rdf/person.rdf";

const DEATH_KW = /(圓寂|圆寂|示寂|逝世|辭世|辞世|去世|卒於|卒于|病逝|往生於|往生于|示滅|示灭|年卒|逝於)/;
const BORN_POST_1920 = /(生於|出生於|生于|出生于)(19[2-9][0-9]|20[0-2][0-9])/;

function isContemporary(desc: string, birthYear: number | null, deathYear: number | null): boolean {
  if (deathYear) return false;
  if (DEATH_KW.test(desc)) return false;
  if (birthYear && birthYear >= 1920) return true;
  if (BORN_POST_1920.test(desc)) return true;
  return false;
}

export async function fetchDilaPersonRdf(): Promise<string> {
  const res = await fetch(RDF_URL, { headers: { "User-Agent": "JingxinCorpus/1.0" } });
  if (!res.ok) throw new Error(`RDF download failed: ${res.status}`);
  return res.text();
}

export function parseDilaPersonRdf(content: string, limit = 0): {
  entities: KgEntityRecord[];
  relations: KgRelationRecord[];
} {
  const blocks = [...content.matchAll(
    /<rdf:Description rdf:about="http:\/\/purl\.dila\.edu\.tw\/resource\/(A\d+)">([\s\S]*?)<\/rdf:Description>/g,
  )];
  const entities: KgEntityRecord[] = [];
  const relations: KgRelationRecord[] = [];
  const idByAid = new Map<string, string>();

  for (const [, aid, block] of blocks) {
    if (limit > 0 && entities.length >= limit) break;
    let nameZh = "";
    for (const lang of ["zh-Hant", "zh"]) {
      const m = block.match(new RegExp(`<skos:prefLabel xml:lang="${lang}">(.+?)</skos:prefLabel>`));
      if (m) {
        nameZh = m[1]!.trim();
        break;
      }
    }
    if (!nameZh) continue;

    let nameEn = "";
    for (const lang of ["sa-x-iast", "en", "pi-x-iast"]) {
      const m = block.match(new RegExp(`<skos:prefLabel xml:lang="${lang}">(.+?)</skos:prefLabel>`));
      if (m) {
        nameEn = m[1]!.trim();
        break;
      }
    }

    let desc = "";
    const dm = block.match(/<bdo:noteText>([\s\S]*?)<\/bdo:noteText>/);
    if (dm) desc = dm[1]!.replace(/<[^>]+>/g, "").trim();

    let birthYear: number | null = null;
    let deathYear: number | null = null;
    const bm = block.match(/PersonBirth[\s\S]*?onYear[^>]*>([+-]?\d+)</);
    if (bm) birthYear = parseInt(bm[1]!, 10);
    const dm2 = block.match(/PersonDeath[\s\S]*?onYear[^>]*>([+-]?\d+)</);
    if (dm2) deathYear = parseInt(dm2[1]!, 10);

    if (isContemporary(desc, birthYear, deathYear)) continue;

    const entityId = `kg:person:dila:${aid}`;
    idByAid.set(aid!, entityId);
    entities.push(
      normalizeKgEntityForStorage({
        id: entityId,
        entity_type: "person",
        name_zh: nameZh,
        name_en: nameEn || undefined,
        external_ids: { dila: aid! },
        properties: {
          ...(birthYear != null ? { birth_year: birthYear } : {}),
          ...(deathYear != null ? { death_year: deathYear } : {}),
          ...(desc ? { description: toSimplifiedZh(desc) } : {}),
        },
        source_tier: "authoritative",
        source: "dila_lod",
      }),
    );

    const teacherMatches = block.matchAll(
      /<bdo:personTeacher rdf:resource="http:\/\/purl\.dila\.edu\.tw\/resource\/(A\d+)"\/>/g,
    );
    for (const tm of teacherMatches) {
      const tid = tm[1]!;
      relations.push({
        subject_id: `kg:person:dila:${tid}`,
        predicate: "teacher_of",
        object_id: entityId,
        confidence: 1,
        source: "dila_lod",
      });
    }
  }

  const validIds = new Set(entities.map((e) => e.id));
  const filteredRelations = relations.filter(
    (r) => validIds.has(r.subject_id) && validIds.has(r.object_id),
  );

  return { entities, relations: filteredRelations };
}
