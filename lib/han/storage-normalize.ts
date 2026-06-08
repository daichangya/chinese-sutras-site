/**
 * 入库与用户查询用的简体归一化
 * @author 代长亚
 */
import { t2s } from "./converter";
import type { DictionaryEntryRecord } from "@/lib/dictionaries/types";
import type { KgEntityRecord } from "@/lib/kg/types";

const CJK_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;

/** 将文本转为入库/检索用简体 */
export function toSimplifiedZh(text: string): string {
  if (!text) return text;
  return t2s(text, { backend: "js" }).text;
}

export function toSimplifiedZhOptional(text: string | null | undefined): string | null {
  const t = text?.trim();
  if (!t) return null;
  return toSimplifiedZh(t);
}

/** 含汉字则 t2s，否则原样（拉丁转写等） */
export function toSimplifiedZhIfCjk(text: string | null | undefined): string | null {
  const t = text?.trim();
  if (!t) return null;
  if (!CJK_RE.test(t)) return t;
  return toSimplifiedZh(t);
}

export function normalizeDictionaryEntryForStorage(
  entry: DictionaryEntryRecord,
): DictionaryEntryRecord {
  if (entry.lang !== "zh") return entry;
  return {
    ...entry,
    headword: toSimplifiedZh(entry.headword),
    definition: toSimplifiedZh(entry.definition),
    reading: toSimplifiedZhIfCjk(entry.reading) ?? undefined,
  };
}

const KG_PROPERTY_ZH_KEYS = [
  "description",
  "summary",
  "bio",
  "dynasty",
  "school",
  "tradition",
  "province",
  "raw_translator",
] as const;

/** KG entity.properties 内已知中文字段归一化为简体 */
export function normalizeKgPropertiesForStorage(
  properties: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!properties) return properties;
  const out: Record<string, unknown> = { ...properties };
  for (const key of KG_PROPERTY_ZH_KEYS) {
    const value = out[key];
    if (typeof value !== "string") continue;
    const simplified = toSimplifiedZhIfCjk(value);
    if (simplified != null) out[key] = simplified;
  }
  return out;
}

export function normalizeKgEntityForStorage(entity: KgEntityRecord): KgEntityRecord {
  return {
    ...entity,
    name_zh: toSimplifiedZh(entity.name_zh),
    properties: normalizeKgPropertiesForStorage(entity.properties),
  };
}

/** 用户查询词归一化为简体（与 DB 存储一致） */
export function normalizeUserZhQuery(query: string): string {
  return toSimplifiedZh(query.trim());
}
