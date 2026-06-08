/**
 * 知识图谱实体可见性规则（client/server 共享）
 * @author 代长亚
 */

import type { KgEntityType, KgSourceTier } from "./types";

/** heuristic 人物 ID 前缀 */
export function isHeuristicPersonId(id: string): boolean {
  return id.startsWith("kg:person:heuristic:");
}

export function isHeuristicPerson(
  entityType: string,
  sourceTier: string,
): boolean {
  return entityType === "person" && sourceTier === "heuristic";
}

/** 用户面向查询应排除 heuristic 人物 */
export const HIDE_HEURISTIC_PERSON_SQL = `NOT (e.entity_type = 'person' AND e.source_tier = 'heuristic')`;

export function isUserFacingEntity(
  entityType: KgEntityType | string,
  sourceTier: KgSourceTier | string,
): boolean {
  if (entityType === "person" && sourceTier === "heuristic") return false;
  return true;
}
