/**
 * 知识图谱描述提及扫描（UI 层软关联）
 * @author jingxin
 */
import "server-only";

import { getSqlite } from "@/lib/db";
import { entityDescription } from "@/lib/kg/display";
import { entityIdToSlug } from "@/lib/kg/slug";
import { HIDE_HEURISTIC_PERSON_SQL } from "@/lib/kg/visibility";
import { resolveEntityId } from "@/lib/kg/graph";

export type KgMentionItem = {
  id: string;
  slug: string;
  name_zh: string;
  entity_type: string;
};

const MIN_NAME_LEN = 2;
const MAX_MENTIONS = 20;

function hasKgTables(): boolean {
  const db = getSqlite();
  return !!db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='kg_entity'`)
    .get();
}

/**
 * 扫描实体 description/summary 中出现的其它已知实体名称
 */
export function getKgEntityMentions(slugOrId: string): KgMentionItem[] {
  if (!hasKgTables()) return [];

  const entityId = resolveEntityId(slugOrId);
  if (!entityId) return [];

  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT id, name_zh, entity_type, properties FROM kg_entity e
       WHERE e.id = ? AND ${HIDE_HEURISTIC_PERSON_SQL} LIMIT 1`,
    )
    .get(entityId) as {
    id: string;
    name_zh: string;
    entity_type: string;
    properties: string | null;
  } | undefined;

  if (!row) return [];

  let properties: Record<string, unknown> = {};
  if (row.properties) {
    try {
      properties = JSON.parse(row.properties) as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }

  const text = entityDescription(properties);
  if (!text || text.length < MIN_NAME_LEN) return [];

  const candidates = db
    .prepare(
      `SELECT id, name_zh, entity_type FROM kg_entity e
       WHERE ${HIDE_HEURISTIC_PERSON_SQL}
         AND e.id != ?
         AND length(e.name_zh) >= ?
       ORDER BY length(e.name_zh) DESC
       LIMIT 500`,
    )
    .all(entityId, MIN_NAME_LEN) as Array<{
    id: string;
    name_zh: string;
    entity_type: string;
  }>;

  const seen = new Set<string>();
  const mentions: KgMentionItem[] = [];

  for (const c of candidates) {
    if (seen.has(c.id)) continue;
    if (c.name_zh === row.name_zh) continue;
    if (!text.includes(c.name_zh)) continue;
    seen.add(c.id);
    mentions.push({
      id: c.id,
      slug: entityIdToSlug(c.id),
      name_zh: c.name_zh,
      entity_type: c.entity_type,
    });
    if (mentions.length >= MAX_MENTIONS) break;
  }

  return mentions;
}
