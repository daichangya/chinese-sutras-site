/**
 * 初始化 dictionaries/catalog.yaml
 * @author 代长亚
 */
import { writeDictCatalog } from "./io";
import { HAN_DICTIONARY_SOURCES } from "./sources";
import type { DictionaryCatalog } from "./types";

export function ensureDictCatalog(root?: string): void {
  const catalog: DictionaryCatalog = {
    version: 1,
    updated_at: new Date().toISOString().slice(0, 10),
    sources: HAN_DICTIONARY_SOURCES,
  };
  writeDictCatalog(catalog, root);
}
