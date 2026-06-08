/**
 * 统一搜索类型（client/server 共享）
 * @author 代长亚
 */
import type { SearchHit } from "@/lib/search/fts-types";

export type SutraSearchHit = {
  sutraId: string;
  sutraSlug: string;
  title: string;
  translator: string | null;
  category: string | null;
  cbetaId: string;
};

export type PersonSearchHit = {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string | null;
  relationCount: number;
  dynasty: string | null;
};

export type DictSearchHit = {
  id: string;
  source: string;
  headword: string;
  definition: string;
};

export type UnifiedSearchResult = {
  sutras: SutraSearchHit[];
  paragraphs: SearchHit[];
  dictionary: DictSearchHit[];
  persons: PersonSearchHit[];
};

export type GroupedParagraphHits = {
  sutraId: string;
  sutraSlug: string;
  sutraTitle: string;
  cbetaId: string;
  hits: SearchHit[];
};
