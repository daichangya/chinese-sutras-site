/**
 * CBETA 经目 → 语料顶层分类（委托 corpus-category）
 * @author 代长亚
 */
export {
  canonDeptFromCbetaId,
  categoryFromCorpusDir,
  categoryFromTitle,
  CORPUS_CATEGORIES,
  corpusDirName,
  isSeriesCodeCorpusDir,
  type CorpusCategory,
  loadTaishoCategoryIndex,
  resetTaishoCategoryIndexCache,
} from "./corpus-category";

/** 从译者串提取朝代前缀（如「後秦 佛陀…譯」→「後秦」） */
export function dynastyFromTranslator(translator?: string): string | undefined {
  if (!translator) return undefined;
  const m = translator.match(/^(.{1,4})\s+/);
  if (!m) return undefined;
  const prefix = m[1].trim();
  if (/[譯译撰著]$/.test(prefix)) return undefined;
  return prefix;
}
