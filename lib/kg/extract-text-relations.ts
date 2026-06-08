/**
 * KG-3：经目题名规则抽取平行/同本异译关系（轻量）
 * @author 代长亚
 */
import { findSutraMetaFiles, loadSutraMeta } from "@/lib/corpus-v3/meta";
import type { KgEntityRecord, KgRelationRecord } from "./types";

function titleCore(title: string): string {
  return title
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/第\d+卷.*$/g, "")
    .replace(/\d+卷/g, "")
    .replace(/\s/g, "")
    .trim()
    .slice(0, 12);
}

export function extractTextRelationsFromCorpus(corpusRoot: string): KgRelationRecord[] {
  const byCore = new Map<string, Array<{ cbetaId: string; title: string }>>();
  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    const meta = loadSutraMeta(metaPath);
    const core = titleCore(meta.title);
    if (core.length < 4) continue;
    const list = byCore.get(core) ?? [];
    list.push({ cbetaId: meta.cbetaId, title: meta.title });
    byCore.set(core, list);
  }

  const relations: KgRelationRecord[] = [];
  for (const group of byCore.values()) {
    if (group.length < 2 || group.length > 8) continue;
    const sorted = [...group].sort((a, b) => a.cbetaId.localeCompare(b.cbetaId));
    for (let i = 0; i < sorted.length - 1; i++) {
      relations.push({
        subject_id: `kg:text:${sorted[i]!.cbetaId}`,
        predicate: "parallel_to",
        object_id: `kg:text:${sorted[i + 1]!.cbetaId}`,
        confidence: 0.6,
        source: "auto:title_pattern",
      });
    }
  }
  return relations;
}

export function mergeKgEntities(existing: KgEntityRecord[], incoming: KgEntityRecord[]): KgEntityRecord[] {
  const byId = new Map(existing.map((e) => [e.id, e]));
  for (const e of incoming) {
    if (!byId.has(e.id)) byId.set(e.id, e);
  }
  return [...byId.values()];
}

export function mergeKgRelations(existing: KgRelationRecord[], incoming: KgRelationRecord[]): KgRelationRecord[] {
  const seen = new Set(existing.map((r) => `${r.subject_id}|${r.predicate}|${r.object_id}`));
  const out = [...existing];
  for (const r of incoming) {
    const key = `${r.subject_id}|${r.predicate}|${r.object_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}
