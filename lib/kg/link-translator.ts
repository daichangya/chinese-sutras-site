/**
 * meta.yaml 译者字符串 → KG 人物实体匹配
 * @author 代长亚
 */
import { toSimplifiedZh } from "@/lib/han/storage-normalize";
import type { KgEntityRecord } from "./types";

/** 规范化译者名用于匹配（简体） */
export function normalizeTranslatorLabel(raw: string): string {
  return toSimplifiedZh(
    raw
      .replace(/[（(][^）)]*[）)]/g, "")
      .replace(/\s+/g, "")
      .replace(/三藏|大师|法师|比丘|尊者/g, "")
      .trim(),
  );
}

export function buildPersonNameIndex(entities: KgEntityRecord[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const e of entities) {
    if (e.entity_type !== "person") continue;
    const key = normalizeTranslatorLabel(e.name_zh);
    if (key && !index.has(key)) index.set(key, e.id);
    const alt = e.name_zh.replace(/\s/g, "");
    if (alt && !index.has(alt)) index.set(alt, e.id);
  }
  return index;
}

function matchFromIndex(label: string, index: Map<string, string>): string | null {
  const direct = index.get(label);
  if (direct) return direct;
  for (const [key, id] of index) {
    if (key.length >= 2 && label.includes(key)) return id;
  }
  return null;
}

export function matchTranslatorToPersonId(
  translator: string | undefined,
  index: Map<string, string>,
  authoritativeIndex?: Map<string, string>,
): string | null {
  if (!translator?.trim()) return null;
  const authIndex = authoritativeIndex ?? index;
  const parts = translator.split(/[、,，;；\/]/).map((p) => normalizeTranslatorLabel(p)).filter(Boolean);
  for (const p of parts) {
    const hit = matchFromIndex(p, authIndex) ?? matchFromIndex(p, index);
    if (hit) return hit;
  }
  const whole = normalizeTranslatorLabel(translator);
  return matchFromIndex(whole, authIndex) ?? matchFromIndex(whole, index) ?? null;
}
