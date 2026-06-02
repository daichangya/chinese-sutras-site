/**
 * ZW 藏外文献：同名冲突时在 title 追加（ZW第N卷）
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { corpusDirName } from "@/lib/cbeta/corpus-category";
import { toSimplifiedLabel } from "./sutra-labels";
import type { SutraMeta } from "./types";
import { findSutraMetaFiles, loadSutraMeta } from "./meta";

const ZW_CBETA_RE = /^ZW\d/i;
const ZW_VOL_SUFFIX_RE = /（ZW第\d+卷）$/;
const ZW_VOL_FROM_ID_RE = /^ZW(\d+)/i;
const ZW_CANON_VOL_XML_RE =
  /<idno[^>]*type="canon"[^>]*>\s*ZW\s*<\/idno>[\s\S]*?<idno[^>]*type="vol"[^>]*>\s*(\d+)\s*<\/idno>/i;
const ZW_VOL_XML_RE = /<idno[^>]*type="vol"[^>]*>\s*(\d+)\s*<\/idno>/i;

export type TitleCollisionIndex = Map<string, string[]>;

function collisionKey(deptDir: string, baseTitle: string): string {
  return `${deptDir}\0${baseTitle}`;
}

/** 去掉已追加的 ZW 卷标识，用于同名分组 */
export function stripZwVolumeTitleSuffix(title: string): string {
  return title.replace(ZW_VOL_SUFFIX_RE, "").trim();
}

/** 从 XML publicationStmt 或 cbetaId 提取「ZW第N卷」（简体） */
export function extractZwVolumeLabelFromXml(xml: string, cbetaId?: string): string | undefined {
  const mCanon = xml.match(ZW_CANON_VOL_XML_RE);
  const vol = mCanon?.[1] ?? xml.match(ZW_VOL_XML_RE)?.[1];
  if (vol) {
    const label = toSimplifiedLabel(`ZW第${parseInt(vol, 10)}卷`) ?? `ZW第${parseInt(vol, 10)}卷`;
    return label;
  }
  if (cbetaId) {
    const mId = cbetaId.match(ZW_VOL_FROM_ID_RE);
    if (mId) {
      const n = parseInt(mId[1]!, 10);
      return `ZW第${n}卷`;
    }
  }
  return undefined;
}

function readXmlForMeta(meta: SutraMeta, xmlRoot: string): string | undefined {
  for (const rel of meta.sourceXml ?? []) {
    const abs = path.isAbsolute(rel) ? rel : path.join(xmlRoot, rel);
    if (!fs.existsSync(abs)) continue;
    try {
      return fs.readFileSync(abs, "utf-8");
    } catch {
      continue;
    }
  }
  return undefined;
}

/** 扫描 corpus：同部类内 baseTitle 对应多个 cbetaId */
export function buildTitleCollisionIndex(corpusRoot: string): TitleCollisionIndex {
  const groups = new Map<string, string[]>();
  for (const metaPath of findSutraMetaFiles(corpusRoot)) {
    let meta: SutraMeta;
    try {
      meta = loadSutraMeta(metaPath);
    } catch {
      continue;
    }
    const rel = path.relative(corpusRoot, path.dirname(metaPath)).replace(/\\/g, "/");
    const deptDir = rel.split("/")[0] ?? "";
    if (!deptDir) continue;
    const baseTitle = stripZwVolumeTitleSuffix(meta.title);
    const key = collisionKey(deptDir, baseTitle);
    const list = groups.get(key) ?? [];
    if (!list.includes(meta.cbetaId)) list.push(meta.cbetaId);
    groups.set(key, list);
  }
  const out: TitleCollisionIndex = new Map();
  for (const [key, ids] of groups) {
    if (ids.length >= 2) out.set(key, ids);
  }
  return out;
}

/** 是否应对 title 追加 ZW 卷标识 */
export function shouldEnrichZwTitle(
  meta: SutraMeta,
  deptDir: string,
  collisionIndex: TitleCollisionIndex,
  corpusRoot: string,
): boolean {
  if (!ZW_CBETA_RE.test(meta.cbetaId)) return false;
  if (ZW_VOL_SUFFIX_RE.test(meta.title)) return false;
  const baseTitle = stripZwVolumeTitleSuffix(meta.title);
  const ids = collisionIndex.get(collisionKey(deptDir, baseTitle));
  if (ids && ids.length >= 2 && ids.includes(meta.cbetaId)) return true;
  return (
    findCbetaIdsWithSameBaseTitleInDept(corpusRoot, deptDir, baseTitle, meta.cbetaId).length >= 1
  );
}

/** 同部类同名 ZW 经目：在 title 末尾追加（ZW第N卷） */
export function enrichTitleForZwCollision(
  meta: SutraMeta,
  deptDir: string,
  collisionIndex: TitleCollisionIndex,
  xmlRoot: string,
  corpusRoot: string,
): string {
  if (!shouldEnrichZwTitle(meta, deptDir, collisionIndex, corpusRoot)) return meta.title;

  const baseTitle = stripZwVolumeTitleSuffix(meta.title);
  const xml = readXmlForMeta(meta, xmlRoot);
  const volLabel =
    (xml ? extractZwVolumeLabelFromXml(xml, meta.cbetaId) : undefined) ??
    extractZwVolumeLabelFromXml("", meta.cbetaId);
  if (!volLabel) return meta.title;

  return `${baseTitle}（${volLabel}）`;
}

/** 更新 拼音/白话/注释/简体 首行 # 标题（原文/ 保留 XML 繁体题） */
export function refreshAuxMdTitles(sutraDir: string, oldTitle: string, newTitle: string): number {
  if (oldTitle === newTitle) return 0;
  const subdirs = ["拼音", "白话", "注释", "简体"];
  let n = 0;
  const prefix = `# ${oldTitle}`;
  const replacement = `# ${newTitle}`;

  for (const sub of subdirs) {
    const dir = path.join(sutraDir, sub);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const fp = path.join(dir, file);
      const raw = fs.readFileSync(fp, "utf-8");
      if (!raw.startsWith(prefix)) continue;
      fs.writeFileSync(fp, replacement + raw.slice(prefix.length), "utf-8");
      n += 1;
    }
  }
  return n;
}

/** 从 meta 路径推导部类目录名 */
export function deptDirFromMetaPath(corpusRoot: string, metaPath: string): string {
  const rel = path.relative(corpusRoot, path.dirname(metaPath)).replace(/\\/g, "/");
  return rel.split("/")[0] ?? "";
}

/** 同部类内与 baseTitle 相同的其它经目 cbetaId（不含自身） */
export function findCbetaIdsWithSameBaseTitleInDept(
  corpusRoot: string,
  deptDir: string,
  baseTitle: string,
  excludeCbetaId?: string,
): string[] {
  const out: string[] = [];
  const deptRoot = path.join(corpusRoot, deptDir);
  if (!fs.existsSync(deptRoot)) return out;

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "meta.yaml") {
        try {
          const meta = loadSutraMeta(full);
          if (excludeCbetaId && meta.cbetaId === excludeCbetaId) continue;
          if (stripZwVolumeTitleSuffix(meta.title) === baseTitle) {
            out.push(meta.cbetaId);
          }
        } catch {
          /* skip */
        }
      }
    }
  };
  walk(deptRoot);
  return out;
}

/** 生成/迁移时判断是否应追加 ZW 卷标识 */
export function resolveZwCollisionTitle(
  meta: SutraMeta,
  deptDir: string,
  corpusRoot: string,
  xmlRoot: string,
  collisionIndex?: TitleCollisionIndex,
): string {
  const index = collisionIndex ?? buildTitleCollisionIndex(corpusRoot);
  return enrichTitleForZwCollision(meta, deptDir, index, xmlRoot, corpusRoot);
}
