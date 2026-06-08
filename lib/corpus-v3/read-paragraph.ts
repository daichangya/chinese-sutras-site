/**
 * 从语料 MD 读取段落正文（DB 仅存身份）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { corpusCacheMaxSutras, isLowMemoryDeploy } from "@/lib/deploy/profile";
import { buildImportBundle, type ImportParagraph } from "./import-align";
import { getCorpusDirIndex } from "./meta";
import { resolveCorpusRoot } from "./root-path";
import { resolveSutrasRoot } from "./paths";

export class CorpusNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CorpusNotAvailableError";
  }
}

export type ParagraphBody = {
  text: string;
  colloquial: string | null;
  commentary: string | null;
};

type BundleCacheEntry = {
  byId: Map<string, ParagraphBody>;
};

const bundleByCbeta = new Map<string, BundleCacheEntry>();
/** LRU 访问顺序（最久未用在前） */
const bundleAccessOrder: string[] = [];

function touchBundle(cbetaId: string): void {
  const idx = bundleAccessOrder.indexOf(cbetaId);
  if (idx >= 0) bundleAccessOrder.splice(idx, 1);
  bundleAccessOrder.push(cbetaId);
}

function evictCorpusBundlesIfNeeded(): void {
  if (!isLowMemoryDeploy()) return;
  const max = corpusCacheMaxSutras();
  if (!Number.isFinite(max)) return;
  while (bundleAccessOrder.length > max) {
    const oldest = bundleAccessOrder.shift();
    if (oldest) bundleByCbeta.delete(oldest);
  }
}

export function clearCorpusParagraphCache(): void {
  bundleByCbeta.clear();
  bundleAccessOrder.length = 0;
}

/** 当前语料缓存中的经目数（测试用） */
export function corpusBundleCacheSize(): number {
  return bundleByCbeta.size;
}

/** 语料根目录是否可读 */
export function isCorpusMounted(corpusRoot?: string): boolean {
  const root = corpusRoot ?? resolveCorpusRoot();
  const sutrasRoot = resolveSutrasRoot(root);
  return fs.existsSync(sutrasRoot);
}

function metaPathForCbetaId(corpusRoot: string, cbetaId: string): string | null {
  const rel = getCorpusDirIndex(corpusRoot).relByCbetaId.get(cbetaId);
  if (!rel) return null;
  const metaPath = path.join(resolveSutrasRoot(corpusRoot), rel, "meta.yaml");
  return fs.existsSync(metaPath) ? metaPath : null;
}

function paragraphBody(p: ImportParagraph): ParagraphBody {
  return {
    text: p.text,
    colloquial: p.colloquial,
    commentary: p.commentary,
  };
}

/** 加载一经全部段落正文（带内存缓存） */
export function loadParagraphBodiesForCbetaId(
  cbetaId: string,
  options?: { corpusRoot?: string; xmlRoot?: string },
): Map<string, ParagraphBody> {
  const cached = bundleByCbeta.get(cbetaId);
  if (cached) {
    touchBundle(cbetaId);
    return cached.byId;
  }

  const corpusRoot = options?.corpusRoot ?? resolveCorpusRoot();
  if (!isCorpusMounted(corpusRoot)) {
    throw new CorpusNotAvailableError(
      `语料目录不可用：请设置 CORPUS_DIR 并挂载 chinese-sutras-md（当前 ${corpusRoot}）`,
    );
  }

  const metaPath = metaPathForCbetaId(corpusRoot, cbetaId);
  if (!metaPath) {
    throw new CorpusNotAvailableError(`语料中未找到经目 ${cbetaId}`);
  }

  const bundle = buildImportBundle({
    corpusRoot,
    xmlRoot: options?.xmlRoot ?? process.env.CBETA_XML_DIR ?? "vendor/xml-p5",
    metaPath,
    stripPreface: true,
    mdOnly: true,
  });

  const byId = new Map<string, ParagraphBody>();
  for (const p of bundle.paragraphs) {
    byId.set(p.canonicalId, paragraphBody(p));
  }
  bundleByCbeta.set(cbetaId, { byId });
  touchBundle(cbetaId);
  evictCorpusBundlesIfNeeded();
  return byId;
}

/** 按 canonical_id 读取单段正文 */
export function readParagraphBody(
  cbetaId: string,
  canonicalId: string,
  options?: { corpusRoot?: string; xmlRoot?: string },
): ParagraphBody | null {
  const map = loadParagraphBodiesForCbetaId(cbetaId, options);
  return map.get(canonicalId) ?? null;
}

/** 从 paragraph id 提取 cbeta_id 前缀（T01n0001:p… → T01n0001） */
export function cbetaIdFromCanonicalId(canonicalId: string): string | null {
  const m = canonicalId.match(/^([A-Z]+\d+n\d+[A-Za-z]?):/);
  return m ? m[1]! : null;
}
