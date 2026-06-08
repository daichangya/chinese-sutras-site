/**
 * 从 corpus meta.yaml 抽取 KG-2（经目、译者、朝代）
 * @author 代长亚
 */
import { findSutraMetaFiles, loadSutraMeta } from "@/lib/corpus-v3/meta";
import { normalizeKgEntityForStorage } from "@/lib/han/storage-normalize";
import type { KgEntityRecord, KgRelationRecord } from "./types";
import { buildPersonNameIndex, matchTranslatorToPersonId, normalizeTranslatorLabel } from "./link-translator";

export function extractKgFromCorpus(
  corpusRoot: string,
  seedPersons: KgEntityRecord[] = [],
): { entities: KgEntityRecord[]; relations: KgRelationRecord[] } {
  const entities: KgEntityRecord[] = [];
  const relations: KgRelationRecord[] = [];
  const entityIds = new Set<string>();
  for (const p of seedPersons.filter((e) => e.entity_type === "person")) {
    const norm = normalizeKgEntityForStorage(p);
    entities.push(norm);
    entityIds.add(norm.id);
  }
  const dynastyIds = new Map<string, string>();

  function ensureDynasty(name: string): string {
    const key = name.trim();
    let id = dynastyIds.get(key);
    if (!id) {
      id = `kg:dynasty:corpus:${key}`;
      dynastyIds.set(key, id);
      if (!entityIds.has(id)) {
        entities.push(
          normalizeKgEntityForStorage({
            id,
            entity_type: "dynasty",
            name_zh: key,
            source_tier: "derived",
            source: "corpus_meta",
          }),
        );
        entityIds.add(id);
      }
    }
    return id;
  }

  const personEntities = entities.filter((e) => e.entity_type === "person");
  const personIndex = buildPersonNameIndex(personEntities);
  const authoritativeIndex = buildPersonNameIndex(
    personEntities.filter((e) => e.source_tier === "authoritative"),
  );

  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    const meta = loadSutraMeta(metaPath);
    const textId = `kg:text:${meta.cbetaId}`;
    if (!entityIds.has(textId)) {
      entities.push(
        normalizeKgEntityForStorage({
          id: textId,
          entity_type: "text",
          name_zh: meta.title,
          source_tier: "derived",
          source: "corpus_meta",
          text_id: meta.cbetaId,
          properties: {
            slug: meta.slug,
            category: meta.category,
            translator: meta.translator,
            dynasty: meta.dynasty,
          },
        }),
      );
      entityIds.add(textId);
    }

    if (meta.dynasty?.trim()) {
      const dynId = ensureDynasty(meta.dynasty);
      relations.push({
        subject_id: textId,
        predicate: "composed_in",
        object_id: dynId,
        confidence: 0.9,
        source: "corpus_meta",
      });
    }

    const personId = matchTranslatorToPersonId(meta.translator, personIndex, authoritativeIndex);
    if (personId) {
      relations.push({
        subject_id: personId,
        predicate: "translated",
        object_id: textId,
        confidence: 0.85,
        source: "corpus_meta",
      });
    } else if (meta.translator?.trim()) {
      const primaryName = meta.translator.split(/[、,，]/)[0]!.trim();
      const normKey = normalizeTranslatorLabel(primaryName) || primaryName;
      const heuristicId = `kg:person:heuristic:name:${normKey}`;
      if (!entityIds.has(heuristicId)) {
        entities.push(
          normalizeKgEntityForStorage({
            id: heuristicId,
            entity_type: "person",
            name_zh: primaryName,
            source_tier: "heuristic",
            source: "corpus_meta",
            properties: { raw_translator: meta.translator },
          }),
        );
        entityIds.add(heuristicId);
        personIndex.set(normKey, heuristicId);
      }
      relations.push({
        subject_id: heuristicId,
        predicate: "translated",
        object_id: textId,
        confidence: 0.5,
        source: "corpus_meta",
      });
    }
  }

  return { entities, relations };
}
