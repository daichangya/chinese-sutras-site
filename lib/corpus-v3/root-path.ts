/**
 * 语料 Markdown 根目录（Corpus V3）
 * @author 代长亚
 */
export const DEFAULT_CORPUS_DIR = "chinese-sutras-md";

export function resolveCorpusRoot(): string {
  return process.env.CORPUS_DIR ?? DEFAULT_CORPUS_DIR;
}
