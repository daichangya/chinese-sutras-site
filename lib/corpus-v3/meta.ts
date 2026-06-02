/**
 * Corpus V3 meta.yaml 读写
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { blocksIndexPath } from "./blocks-index";
import type { SutraMeta, SutraZaijiaMeta } from "./types";
import { formatZaijiaSection, formatZaijiaTopic, getZaijiaMeta } from "@/lib/cbeta/zaijia-category";

/** 从 zaijia.txt 补全 meta 子类（不改变 category） */
export function zaijiaFieldsForCbetaId(cbetaId: string): SutraZaijiaMeta | undefined {
  const zm = getZaijiaMeta(cbetaId);
  if (!zm) return undefined;
  const topic = formatZaijiaTopic(zm);
  return {
    section: formatZaijiaSection(zm),
    ...(topic ? { topic } : {}),
    kind: zm.kind,
  };
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
    zaijia: meta.zaijia,
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

  const zaijiaRaw = obj.zaijia as Record<string, unknown> | undefined;
  const zaijia =
    zaijiaRaw && typeof zaijiaRaw === "object"
      ? {
          section: zaijiaRaw.section ? String(zaijiaRaw.section).trim() : undefined,
          topic: zaijiaRaw.topic ? String(zaijiaRaw.topic).trim() : undefined,
          kind:
            zaijiaRaw.kind === "疏" || zaijiaRaw.kind === "经"
              ? (zaijiaRaw.kind as "经" | "疏")
              : undefined,
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
    zaijia: zaijia?.section || zaijia?.topic || zaijia?.kind ? zaijia : undefined,
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
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "meta.yaml") onMeta(full);
    }
  };
  walk(corpusRoot);
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
  if (!fs.existsSync(corpusRoot)) return { relByCbetaId, cbetaIdByRel };

  walkMetaFiles(corpusRoot, (metaPath) => {
    const cbetaId = readCbetaIdFromMetaFile(metaPath);
    if (!cbetaId) return;
    const rel = path.relative(corpusRoot, path.dirname(metaPath)).replace(/\\/g, "/");
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
export type { SutraMeta, SutraZaijiaMeta } from "./types";

export function sutraRootFromMetaPath(metaPath: string): string {
  return path.dirname(metaPath);
}
