/**
 * 书签与经目元数据合并
 * @author 代长亚
 */
import { getMvpSlugByCbetaId } from "@/lib/cbeta/mvp-canon";

export type BookmarkSutraMeta = {
  sutraSlug: string;
  sutraTitle: string;
};

/** 优先 MVP 友好 slug，否则回退 DB slug */
export function resolveBookmarkSutraMeta(
  sutraSlug: string | null | undefined,
  sutraTitle: string | null | undefined,
  sutraCbetaId?: string | null,
): BookmarkSutraMeta {
  const friendly = sutraCbetaId ? getMvpSlugByCbetaId(sutraCbetaId) : undefined;
  return {
    sutraSlug: friendly ?? sutraSlug ?? "",
    sutraTitle: sutraTitle ?? "",
  };
}
