/**
 * 经藏浏览类型（client/server 共享）
 * @author 代长亚
 */
import type { SutraRow } from "@/lib/sutra/queries";

export type CanonCategoryGroup = {
  category: string;
  sutras: SutraRow[];
};
