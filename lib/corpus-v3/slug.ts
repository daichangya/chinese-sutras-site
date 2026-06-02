/**
 * 经目 URL slug 解析
 * @author jingxin
 */
import { slugFromCbetaId } from "@/lib/cbeta/series-label";
import type { SutraMeta } from "./types";

export function resolveSutraSlug(meta: Pick<SutraMeta, "cbetaId" | "slug">): string {
  const explicit = meta.slug?.trim();
  if (explicit) return explicit;
  return slugFromCbetaId(meta.cbetaId);
}
