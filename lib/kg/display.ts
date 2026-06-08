/**
 * 知识图谱展示格式化（client/server 共享）
 * @author 代长亚
 */

export function personDisplayDates(
  props: Record<string, unknown> | null | undefined,
): string {
  if (!props || typeof props !== "object") return "";
  const birth =
    (props["birth_year"] as string | undefined) ||
    (props["birth"] as string | undefined);
  const death =
    (props["death_year"] as string | undefined) ||
    (props["death"] as string | undefined);
  if (birth && death) return `（${birth}–${death}）`;
  if (birth) return `（${birth}–）`;
  if (death) return `（–${death}）`;
  return "";
}

export function personDynasty(
  props: Record<string, unknown> | null | undefined,
): string {
  if (!props || typeof props !== "object") return "";
  return (
    ((props["dynasty"] as string | undefined) ||
      (props["era"] as string | undefined) ||
      "")
  ).trim();
}

export function personSchool(
  props: Record<string, unknown> | null | undefined,
): string {
  if (!props || typeof props !== "object") return "";
  return (
    ((props["school"] as string | undefined) ||
      (props["tradition"] as string | undefined) ||
      "")
  ).trim();
}

export function entityBioText(
  properties: Record<string, unknown> | null | undefined,
): string | null {
  if (!properties) return null;
  const raw =
    (properties["description"] as string | undefined) ||
    (properties["summary"] as string | undefined) ||
    (properties["bio"] as string | undefined);
  const t = raw?.trim();
  return t || null;
}

export function entityDescription(
  properties: Record<string, unknown> | null | undefined,
  maxLen = 120,
): string | null {
  const t = entityBioText(properties);
  if (!t) return null;
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

export function parseEntityProperties(
  propertiesJson: string | null | undefined,
): Record<string, unknown> {
  if (!propertiesJson) return {};
  try {
    return JSON.parse(propertiesJson) as Record<string, unknown>;
  } catch {
    return {};
  }
}
