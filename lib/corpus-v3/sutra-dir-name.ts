/**
 * 经目目录名：书名_作者_N卷 + 可选消歧段；cbetaId 仅最后兜底
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { dynastyFromTranslator } from "@/lib/cbeta/canon-dept";
import {
  cbetaVariantLetter,
  compactCbetaVariantSuffix,
} from "./dir-disambiguator";
import type { CorpusDirIndex } from "./meta";
import { findSutraDirForCbetaId, getCorpusDirIndex, readCbetaIdFromMetaFile } from "./meta";

const INVALID_DIR_CHARS = /[/\\:*?"<>|]/g;
const LEGACY_CBETA_SUFFIX = /_([A-Za-z]+\d+n\d+[A-Za-z]?)$/;

export type SutraDirNameInput = {
  title: string;
  cbetaId: string;
  translator?: string;
  juanCount?: number;
  dynasty?: string;
  /** XML 语义消歧（如「录文二」） */
  dirDisambiguator?: string;
};

export { cbetaVariantLetter, compactCbetaVariantSuffix } from "./dir-disambiguator";

/** 文件名非法字符 */
export function sanitizeDirSegment(name: string): string {
  return name.replace(INVALID_DIR_CHARS, "_").replace(/\s+/g, "").trim();
}

/** 从译者/作者串提取目录用作者名（如「唐 玄奘譯」→「玄奘」） */
export function authorLabelFromTranslator(translator?: string): string | undefined {
  if (!translator?.trim()) return undefined;
  const normalized = translator.replace(/[　\s]+/g, " ").trim();
  const m = normalized.match(
    /(.+?)(?:譯|译|造|撰|集|重譯|重译|奉詔譯|奉敕譯|奉诏译|注|箋|笺|疏|著|编|編|整理)$/,
  );
  if (!m) return sanitizeDirSegment(normalized) || undefined;

  let author = m[1]!.trim();
  const dynasty = dynastyFromTranslator(translator);
  if (dynasty && author.startsWith(dynasty)) {
    author = author.slice(dynasty.length).trim();
  }
  const label = sanitizeDirSegment(author);
  return label || undefined;
}

/** 卷数后缀：仅 N卷，不含经号变体字母 */
export function juanDirSuffix(juanCount?: number): string | undefined {
  if (juanCount == null || juanCount < 1) return undefined;
  return `${juanCount}卷`;
}

function joinSegments(...parts: (string | undefined)[]): string {
  return parts.filter((p): p is string => !!p && p.length > 0).join("_");
}

/** 录文、或 extent=1卷 时的物理卷号：替代误导性 N卷 后缀 */
function shouldReplaceExtentJuan(input: SutraDirNameInput, semantic?: string): boolean {
  if (!semantic) return false;
  if (/^录文/.test(semantic)) return true;
  if (input.juanCount === 1 && /^第\d+卷$/.test(semantic)) return true;
  return false;
}

function pushVariantCandidates(
  out: string[],
  title: string,
  author: string | undefined,
  input: SutraDirNameInput,
  juan: string | undefined,
  semantic: string | undefined,
  compact: string | undefined,
): void {
  const variant = cbetaVariantLetter(input.cbetaId);
  if (!variant) {
    if (author && juan) out.push(joinSegments(title, author, juan));
    else if (author) out.push(joinSegments(title, author));
    else if (juan) out.push(joinSegments(title, juan));
    return;
  }

  if (author) {
    if (semantic && shouldReplaceExtentJuan(input, semantic)) {
      out.push(joinSegments(title, author, semantic));
      if (compact && compact !== semantic) out.push(joinSegments(title, author, compact));
    } else {
      if (juan) out.push(joinSegments(title, author, juan));
      if (semantic) out.push(joinSegments(title, author, semantic));
      if (compact && compact !== semantic) out.push(joinSegments(title, author, compact));
    }
    out.push(joinSegments(title, author));
    return;
  }

  if (semantic && shouldReplaceExtentJuan(input, semantic)) {
    out.push(joinSegments(title, semantic));
    if (compact && compact !== semantic) out.push(joinSegments(title, compact));
  } else {
    if (juan) out.push(joinSegments(title, juan));
    if (semantic) out.push(joinSegments(title, semantic));
    if (compact && compact !== semantic) out.push(joinSegments(title, compact));
  }
}

/** 按优先级生成候选目录名（去重保序） */
export function sutraDirNameCandidates(input: SutraDirNameInput): string[] {
  const title = sanitizeDirSegment(input.title) || input.title;
  const author = authorLabelFromTranslator(input.translator);
  const juan = juanDirSuffix(input.juanCount);
  const variant = cbetaVariantLetter(input.cbetaId);
  const semantic = input.dirDisambiguator?.trim()
    ? sanitizeDirSegment(input.dirDisambiguator)
    : undefined;
  const compact = variant ? compactCbetaVariantSuffix(input.cbetaId) : undefined;
  const dynasty = input.dynasty?.trim()
    ? sanitizeDirSegment(input.dynasty)
    : dynastyFromTranslator(input.translator);

  const out: string[] = [];

  if (author || juan || (variant && (semantic || compact))) {
    pushVariantCandidates(out, title, author, input, juan, semantic, compact);
  } else if (dynasty) {
    out.push(joinSegments(title, dynasty));
    if (variant && compact) out.push(joinSegments(title, dynasty, compact));
  } else if (variant && semantic) {
    out.push(joinSegments(title, semantic));
    if (compact && compact !== semantic) out.push(joinSegments(title, compact));
  } else if (variant && compact) {
    out.push(joinSegments(title, compact));
  }

  out.push(joinSegments(title, input.cbetaId));

  const seen = new Set<string>();
  return out.filter((name) => {
    if (seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

/** 书名 + 作者 + 卷 的目录名（无卷数则退化为书名_作者） */
export function sutraDirNameWithAuthor(
  title: string,
  translator?: string,
  juanCount?: number,
): string {
  const author = authorLabelFromTranslator(translator);
  const juan = juanDirSuffix(juanCount);
  if (author && juan) return `${title}_${author}_${juan}`;
  if (author) return `${title}_${author}`;
  if (juan) return `${title}_${juan}`;
  return title;
}

/** 首选目录名（不考虑占用） */
export function preferredSutraDirName(
  title: string,
  translator?: string,
  cbetaId?: string,
  juanCount?: number,
  dynasty?: string,
  dirDisambiguator?: string,
): string {
  const candidates = sutraDirNameCandidates({
    title,
    cbetaId: cbetaId ?? "",
    translator,
    juanCount,
    dynasty,
    dirDisambiguator,
  });
  return candidates[0] ?? title;
}

function dirExists(corpusRoot: string, dept: string, dirName: string): boolean {
  return fs.existsSync(path.join(corpusRoot, dept, dirName));
}

function cbetaIdAtDir(
  corpusRoot: string,
  dept: string,
  dirName: string,
  index?: CorpusDirIndex,
): string | null {
  const rel = `${dept}/${dirName}`.replace(/\\/g, "/");
  if (index) return index.cbetaIdByRel.get(rel) ?? null;
  return readCbetaIdFromMetaFile(path.join(corpusRoot, dept, dirName, "meta.yaml"));
}

function pickDirName(
  candidates: string[],
  dept: string,
  cbetaId: string,
  index: CorpusDirIndex,
  corpusRoot?: string,
): string {
  for (const name of candidates) {
    const rel = `${dept}/${name}`.replace(/\\/g, "/");
    const occupant = index.cbetaIdByRel.get(rel);
    if (!occupant || occupant === cbetaId) return name;
    if (corpusRoot && !dirExists(corpusRoot, dept, name)) return name;
  }
  return candidates[candidates.length - 1]!;
}

export function sutraDirName(
  title: string,
  cbetaId: string,
  corpusRoot: string,
  dept: string,
  knownDir?: string | null,
  translator?: string,
  index?: CorpusDirIndex,
  juanCount?: number,
  dynasty?: string,
  dirDisambiguator?: string,
): string {
  const idx = index ?? getCorpusDirIndex(corpusRoot);
  const candidates = sutraDirNameCandidates({
    title,
    cbetaId,
    translator,
    juanCount,
    dynasty,
    dirDisambiguator,
  });
  const picked = pickDirName(candidates, dept, cbetaId, idx, corpusRoot);

  const existing = knownDir ?? findSutraDirForCbetaId(corpusRoot, cbetaId);
  if (existing) {
    const id = cbetaIdAtDir(corpusRoot, dept, existing, idx);
    if (id === cbetaId && existing === picked) return existing;
  }

  return picked;
}

/** 目录名是否以 cbetaId 结尾（兜底名） */
export function isLegacyCbetaIdDirName(dirName: string): boolean {
  return LEGACY_CBETA_SUFFIX.test(dirName);
}

export function migrateSutraDirName(
  title: string,
  cbetaId: string,
  dept: string,
  translator: string | undefined,
  index: CorpusDirIndex,
  juanCount?: number,
  dynasty?: string,
  dirDisambiguator?: string,
): string {
  const candidates = sutraDirNameCandidates({
    title,
    cbetaId,
    translator,
    juanCount,
    dynasty,
    dirDisambiguator,
  });
  return pickDirName(candidates, dept, cbetaId, index);
}

export function canonicalSutraDirName(
  title: string,
  cbetaId: string,
  corpusRoot: string,
  dept: string,
  translator?: string,
  index?: CorpusDirIndex,
  juanCount?: number,
  dynasty?: string,
  dirDisambiguator?: string,
): string {
  if (index) {
    return migrateSutraDirName(
      title,
      cbetaId,
      dept,
      translator,
      index,
      juanCount,
      dynasty,
      dirDisambiguator,
    );
  }
  return sutraDirName(
    title,
    cbetaId,
    corpusRoot,
    dept,
    null,
    translator,
    undefined,
    juanCount,
    dynasty,
    dirDisambiguator,
  );
}
