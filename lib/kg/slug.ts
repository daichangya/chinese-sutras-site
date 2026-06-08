/**
 * 知识图谱实体友好 URL slug（client/server 共享）
 * @author 代长亚
 */

/** kg:person:dila:A000294 → dila-A000294 */
export function entityIdToSlug(id: string): string {
  if (!id.startsWith("kg:")) return encodeURIComponent(id);
  const parts = id.split(":");
  if (parts.length >= 4) {
    const source = parts[2];
    const key = parts.slice(3).join("-");
    return `${source}-${key}`;
  }
  return parts.slice(1).join("-");
}

/** dila-A000294 → kg:person:dila:A000294（需 entityType 提示） */
export function slugToEntityId(slug: string, entityType = "person"): string | null {
  const decoded = decodeURIComponent(slug.trim());
  if (decoded.startsWith("kg:")) return decoded;

  const dash = decoded.indexOf("-");
  if (dash <= 0) return null;
  const source = decoded.slice(0, dash);
  const key = decoded.slice(dash + 1);
  if (!source || !key) return null;
  // kg:text:T08n0254 → text-T08n0254（三段 ID，首段即 entityType）
  if (source === entityType) {
    return `kg:${entityType}:${key}`;
  }
  return `kg:${entityType}:${source}:${key}`;
}

/** slug 解析时按 source 前缀尝试的 entity_type 顺序 */
export function slugEntityTypeCandidates(slug: string, hint?: string): string[] {
  if (hint) return [hint];
  const decoded = decodeURIComponent(slug.trim());
  if (decoded.startsWith("kg:")) return [];
  const dash = decoded.indexOf("-");
  const source = dash > 0 ? decoded.slice(0, dash) : "";
  if (source === "seed") return ["school", "concept", "place", "person"];
  if (source === "dila") return ["person", "place"];
  if (source === "text") return ["text", "person", "school", "concept", "place", "monastery", "dynasty"];
  return ["person", "school", "concept", "place", "monastery", "dynasty", "text"];
}

/** 尝试从 slug 或完整 ID 解析实体 ID（单类型，不含 DB 校验） */
export function resolveEntityIdFromSlugOrId(
  input: string,
  entityType?: string,
): string | null {
  const trimmed = decodeURIComponent(input.trim());
  if (!trimmed) return null;
  if (trimmed.startsWith("kg:")) return trimmed;
  return slugToEntityId(trimmed, entityType ?? "person");
}

export function personPath(slugOrId: string): string {
  const slug = slugOrId.startsWith("kg:") ? entityIdToSlug(slugOrId) : slugOrId;
  return `/person/${encodeURIComponent(slug)}`;
}

/** 按实体类型生成详情页路径（非人物勿链到 /person） */
export function entityDetailPath(
  entityId: string,
  entityType: string,
  options?: { sutraSlug?: string | null },
): string {
  const slug = entityIdToSlug(entityId);
  if (entityType === "person") return personPath(slug);
  if (entityType === "text") {
    if (options?.sutraSlug) return `/sutra/${encodeURIComponent(options.sutraSlug)}`;
    return `/kg?slug=${encodeURIComponent(slug)}`;
  }
  if (entityType === "place" || entityType === "monastery") {
    return `/places?focus=${encodeURIComponent(slug)}`;
  }
  return `/kg?slug=${encodeURIComponent(slug)}`;
}
