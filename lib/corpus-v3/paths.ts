/**
 * 语料根目录及经藏、辞典、知识图谱子路径
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { DEFAULT_CORPUS_DIR, resolveCorpusRoot } from "./root-path";

export { DEFAULT_CORPUS_DIR, resolveCorpusRoot };

/** 23 部类经目所在子目录 */
export const CORPUS_SUTRAS_SUBDIR = "经藏";

/** 辞典 / 知识图谱真相源目录（简体中文） */
export const CORPUS_DICT_SUBDIR = "辞典";
export const CORPUS_KG_SUBDIR = "知识图谱";

/** 旧版英文目录名（迁移兼容） */
export const LEGACY_CORPUS_DICT_SUBDIR = "dictionaries";
export const LEGACY_CORPUS_KG_SUBDIR = "knowledge-graph";

/** 语料库根下保留目录，corpus 扫描须跳过 */
export const CORPUS_RESERVED_TOP_DIRS = new Set([
  CORPUS_SUTRAS_SUBDIR,
  CORPUS_DICT_SUBDIR,
  CORPUS_KG_SUBDIR,
  LEGACY_CORPUS_DICT_SUBDIR,
  LEGACY_CORPUS_KG_SUBDIR,
]);

function resolveNamedSubdir(
  envOverride: string | undefined,
  zhName: string,
  legacyName: string,
  root: string,
): string {
  if (envOverride) return envOverride;
  const zh = path.join(root, zhName);
  const legacy = path.join(root, legacyName);
  if (fs.existsSync(zh)) return zh;
  if (fs.existsSync(legacy)) return legacy;
  return zh;
}

export function resolveDictRoot(): string {
  return resolveNamedSubdir(
    process.env.DICT_DIR,
    CORPUS_DICT_SUBDIR,
    LEGACY_CORPUS_DICT_SUBDIR,
    resolveCorpusRoot(),
  );
}

export function resolveKgRoot(): string {
  return resolveNamedSubdir(
    process.env.KG_DIR,
    CORPUS_KG_SUBDIR,
    LEGACY_CORPUS_KG_SUBDIR,
    resolveCorpusRoot(),
  );
}

export function nestedSutrasRootHasContent(root: string): boolean {
  const nested = path.join(root, CORPUS_SUTRAS_SUBDIR);
  if (!fs.existsSync(nested) || !fs.statSync(nested).isDirectory()) return false;
  return fs.readdirSync(nested).some((name) => !name.startsWith("."));
}

/** 经目 Markdown 树：优先非空的 `{corpus}/经藏/`，否则兼容旧版扁平 `{corpus}/{部类}/` */
export function resolveSutrasRoot(corpusRoot?: string): string {
  const root = path.resolve(corpusRoot ?? resolveCorpusRoot());
  if (nestedSutrasRootHasContent(root)) {
    return path.join(root, CORPUS_SUTRAS_SUBDIR);
  }
  return root;
}

/** 拼接经目路径：{经藏?}/{部类}/… */
export function joinSutraPath(corpusRoot: string, ...segments: string[]): string {
  return path.join(resolveSutrasRoot(corpusRoot), ...segments);
}

export function isReservedCorpusTopDir(name: string): boolean {
  return CORPUS_RESERVED_TOP_DIRS.has(name);
}
