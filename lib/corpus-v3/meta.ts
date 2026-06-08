/**
 * Corpus V3 meta.yaml 读写
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { blocksIndexPath } from "./blocks-index";
import type { SutraMeta, SutraBuleiMeta } from "./types";
import { resolveBuleiMeta } from "@/lib/cbeta/bulei-catalog";
import { toSimplifiedLabel } from "./sutra-labels";
import { isReservedCorpusTopDir, resolveSutrasRoot } from "./paths";

/** meta.bulei 文本字段转简体 */
export function simplifyBuleiMetaFields(bulei: SutraBuleiMeta): SutraBuleiMeta {
  return {
    ...bulei,
    section: bulei.section ? (toSimplifiedLabel(bulei.section) ?? bulei.section) : bulei.section,
    group: bulei.group ? (toSimplifiedLabel(bulei.group) ?? bulei.group) : bulei.group,
    path: bulei.path?.map((p) => toSimplifiedLabel(p) ?? p),
  };
}

/** 从 bulei 解析链补全 meta.bulei（字段为简体） */
export function buleiFieldsForCbetaId(cbetaId: string): SutraBuleiMeta | undefined {
  const bm = resolveBuleiMeta(cbetaId);
  if (!bm) return undefined;
  return simplifyBuleiMetaFields({
    section_code: bm.sectionCode,
    section: bm.sectionLabel,
    group: bm.groupLabel,
    path: bm.breadcrumbs.length > 0 ? bm.breadcrumbs : undefined,
    kind: bm.kind,
    source: bm.source,
  });
}

export function writeSutraMeta(metaPath: string, meta: SutraMeta): void {
  const obj: Record<string, unknown> = {
    cbeta_id: meta.cbetaId,
    title: meta.title,
    slug: meta.slug,
    alias: meta.alias,
    translator: meta.translator,
    dynasty: meta.dynasty,
    category: meta.category,
    bulei: meta.bulei,
    juan_count: meta.juanCount,
    source_xml: meta.sourceXml,
    description: meta.description,
    dir_label: meta.dirLabel,
  };
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, YAML.stringify(obj).trimEnd() + "\n", "utf-8");
}

export function loadSutraMeta(metaPath: string): SutraMeta {
  const raw = fs.readFileSync(metaPath, "utf-8");
  const obj = YAML.parse(raw) as Record<string, unknown>;
  const cbetaId = String(obj.cbeta_id ?? obj.cbetaId ?? "").trim();
  const title = String(obj.title ?? "").trim();
  if (!cbetaId || !title) throw new Error(`Invalid meta.yaml: ${metaPath}`);
  const aliasRaw = obj.alias;
  const alias = Array.isArray(aliasRaw)
    ? aliasRaw.map(String)
    : aliasRaw
      ? [String(aliasRaw)]
      : undefined;
  const sourceRaw = obj.source_xml ?? obj.sourceXml;
  const sourceXml = Array.isArray(sourceRaw)
    ? sourceRaw.map(String)
    : sourceRaw
      ? [String(sourceRaw)]
      : [];

  const buleiRaw = obj.bulei as Record<string, unknown> | undefined;
  const bulei: SutraBuleiMeta | undefined =
    buleiRaw && typeof buleiRaw === "object"
      ? {
          section_code: String(buleiRaw.section_code ?? buleiRaw.sectionCode ?? "").trim(),
          section: String(buleiRaw.section ?? "").trim(),
          group: String(buleiRaw.group ?? "").trim(),
          path: Array.isArray(buleiRaw.path) ? buleiRaw.path.map(String) : undefined,
          kind:
            buleiRaw.kind === "疏" || buleiRaw.kind === "经"
              ? (buleiRaw.kind as "经" | "疏")
              : undefined,
          source: buleiRaw.source ? String(buleiRaw.source).trim() : undefined,
        }
      : undefined;

  return {
    cbetaId,
    title,
    slug: obj.slug ? String(obj.slug).trim() : undefined,
    alias,
    translator: obj.translator ? String(obj.translator) : undefined,
    dynasty: obj.dynasty ? String(obj.dynasty) : undefined,
    category: String(obj.category ?? "未分类"),
    bulei: bulei?.section && bulei?.group ? bulei : undefined,
    juanCount: obj.juan_count != null ? Number(obj.juan_count) : undefined,
    sourceXml,
    description: obj.description ? String(obj.description) : undefined,
    dirLabel: obj.dir_label ? String(obj.dir_label).trim() : undefined,
  };
}

export function findSutraMetaFiles(corpusRoot: string): string[] {
  const out: string[] = [];
  walkMetaFiles(corpusRoot, (p) => out.push(p));
  return out.sort();
}

function walkMetaFiles(corpusRoot: string, onMeta: (metaPath: string) => void): void {
  const sutrasRoot = resolveSutrasRoot(corpusRoot);
  const skipReservedAtTop = path.resolve(sutrasRoot) === path.resolve(corpusRoot);
  const walk = (dir: string, depth: number) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (depth === 0 && skipReservedAtTop && isReservedCorpusTopDir(entry.name)) continue;
        walk(full, depth + 1);
      } else if (entry.name === "meta.yaml") onMeta(full);
    }
  };
  walk(sutrasRoot, 0);
}

const META_CBETA_ID_RE = /^(?:cbeta_id|cbetaId):\s*(\S+)/m;

/** 只读 meta 头部取 cbeta_id，避免全量 YAML 解析 */
export function readCbetaIdFromMetaFile(metaPath: string): string | null {
  const head = fs.readFileSync(metaPath, "utf-8");
  const m = head.match(META_CBETA_ID_RE);
  return m ? m[1]! : null;
}

export type CorpusResumeIndex = {
  generatedIds: Set<string>;
  dirByCbetaId: Map<string, string>;
};

/** 一次扫描 corpus：已完整生成的 cbeta_id + 经目目录名（供 --resume 与 sutraDirName） */
export function buildCorpusResumeIndex(corpusRoot: string): CorpusResumeIndex {
  const generatedIds = new Set<string>();
  const dirByCbetaId = new Map<string, string>();
  if (!fs.existsSync(corpusRoot)) return { generatedIds, dirByCbetaId };

  walkMetaFiles(corpusRoot, (metaPath) => {
    const cbetaId = readCbetaIdFromMetaFile(metaPath);
    if (!cbetaId) return;
    const sutraDir = path.dirname(metaPath);
    const index = blocksIndexPath(sutraDir);
    if (!fs.existsSync(index) || fs.statSync(index).size === 0) return;
    generatedIds.add(cbetaId);
    dirByCbetaId.set(cbetaId, path.basename(sutraDir));
  });

  return { generatedIds, dirByCbetaId };
}

/** 一次扫描 corpus，返回已完整生成（meta + 非空 blocks.jsonl）的 cbeta_id 集合，供 --resume 快速跳过 */
export function buildGeneratedCbetaIdSet(corpusRoot: string): Set<string> {
  return buildCorpusResumeIndex(corpusRoot).generatedIds;
}

/** 经目目录索引（一次扫描，供 migrate / sutraDirName 避免 O(n²) 全树查找） */
export type CorpusDirIndex = {
  /** cbetaId → 相对 corpus 根的路径（如 般若/般若波羅蜜多心經_玄奘） */
  relByCbetaId: Map<string, string>;
  /** 相对路径 → cbetaId */
  cbetaIdByRel: Map<string, string>;
};

let corpusDirIndexCache: { root: string; index: CorpusDirIndex } | null = null;

/** 一次扫描 corpus 建立经目路径索引 */
export function buildCorpusDirIndex(corpusRoot: string): CorpusDirIndex {
  const relByCbetaId = new Map<string, string>();
  const cbetaIdByRel = new Map<string, string>();
  const sutrasRoot = resolveSutrasRoot(corpusRoot);
  if (!fs.existsSync(sutrasRoot)) return { relByCbetaId, cbetaIdByRel };

  walkMetaFiles(corpusRoot, (metaPath) => {
    const cbetaId = readCbetaIdFromMetaFile(metaPath);
    if (!cbetaId) return;
    const rel = path.relative(sutrasRoot, path.dirname(metaPath)).replace(/\\/g, "/");
    relByCbetaId.set(cbetaId, rel);
    cbetaIdByRel.set(rel, cbetaId);
  });

  return { relByCbetaId, cbetaIdByRel };
}

export function getCorpusDirIndex(corpusRoot: string): CorpusDirIndex {
  const resolved = path.resolve(corpusRoot);
  if (corpusDirIndexCache?.root === resolved) return corpusDirIndexCache.index;
  const index = buildCorpusDirIndex(resolved);
  corpusDirIndexCache = { root: resolved, index };
  return index;
}

export function clearCorpusDirIndexCache(): void {
  corpusDirIndexCache = null;
}

/** 按 cbeta_id 查找已有经目目录名（仅 basename） */
export function findSutraDirForCbetaId(corpusRoot: string, cbetaId: string): string | null {
  const rel = getCorpusDirIndex(corpusRoot).relByCbetaId.get(cbetaId);
  if (!rel) return null;
  return path.basename(rel);
}

export {
  compactCbetaVariantSuffix,
  extractDirDisambiguatorFromXml,
  extractHuiTitleFromXml,
  extractJuanRangeLabelFromXml,
} from "./dir-disambiguator";
export {
  authorLabelFromTranslator,
  canonicalSutraDirName,
  cbetaVariantLetter,
  isLegacyCbetaIdDirName,
  juanDirSuffix,
  migrateSutraDirName,
  preferredSutraDirName,
  sanitizeDirSegment,
  sutraDirName,
  sutraDirNameCandidates,
  sutraDirNameWithAuthor,
} from "./sutra-dir-name";
export {
  enrichMetaFromXml,
  enrichTranslatorFromXml,
  juanCountFromYuanwenDir,
  translatorFromSourceXml,
} from "./meta-from-xml";
export {
  buildTitleCollisionIndex,
  enrichTitleForZwCollision,
  extractZwVolumeLabelFromXml,
  refreshAuxMdTitles,
  resolveZwCollisionTitle,
  shouldEnrichZwTitle,
  stripZwVolumeTitleSuffix,
} from "./zw-title";
export type { SutraMeta } from "./types";

export function sutraRootFromMetaPath(metaPath: string): string {
  return path.dirname(metaPath);
}
