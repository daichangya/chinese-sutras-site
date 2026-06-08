/**
 * 辞典真相源类型
 * @author 代长亚
 */

export type DictionaryEntryRecord = {
  id: string;
  source: string;
  headword: string;
  reading?: string;
  definition: string;
  lang: string;
  license?: string;
  entry_data?: Record<string, unknown>;
};

export type DictionarySourceMeta = {
  code: string;
  /** sources/ 下文件夹名（简体中文） */
  dir_name?: string;
  name_zh: string;
  name_en?: string;
  base_url?: string;
  license?: string;
  zip_filename?: string;
  /** tsv | dila-tei-* | mdict | pending-buddhaspace */
  parser: string;
  lang: string;
};

export type DictionaryCatalog = {
  version: number;
  updated_at?: string;
  sources: DictionarySourceMeta[];
};
