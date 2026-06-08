/**
 * FTS 检索类型（无 DB 依赖，可供 client 引用）
 * @author 代长亚
 */
export type SearchHit = {
  paragraphId: string;
  sutraId: string;
  sutraSlug: string;
  sutraTitle: string;
  cbetaId: string;
  snippet: string;
  seq: number;
  /** 正文 snippet/原文中 query 汉字命中次数（server 排序用） */
  wordcount?: number;
};
