/**
 * 从 cbeta/static/zaijia.txt 解析在家目录：语料顶层类 + meta 子类
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import type { CorpusCategory } from "./corpus-category";
import { normalizeCbetaId } from "./corpus-category";

const ZAIJIA_PATH = path.join(process.cwd(), "cbeta/static/zaijia.txt");

/** T08n0236a、J31nB269 等经目 ID（与 normalizeCbetaId 一致） */
export const ZAIJIA_WORK_ID_RE = /([A-Za-z]+\d+n(?:\d+[A-Za-z]?|[A-Za-z]\d+))/gi;

const WORK_ID_RE = ZAIJIA_WORK_ID_RE;

/** 在家目录 meta 子类（不写磁盘路径，仅 meta.yaml） */
export type ZaijiaMeta = {
  sectionCode: string;
  sectionLabel: string;
  topicCode?: string;
  topicLabel?: string;
  /** 经＝目录主题下经目；疏＝疏钞/释论/发隐等子类 */
  kind: "经" | "疏";
};

/** 一级「部類」→ 23 类 */
const ZAIJIA_SECTION_TO_CATEGORY: Record<string, CorpusCategory> = {
  阿含部類: "阿含（小乘根本经典）",
  本緣部類: "本缘（佛本生、本事相关）",
  本缘部類: "本缘（佛本生、本事相关）",
  般若部類: "般若",
  法華部類: "法华",
  華嚴部類: "华严",
  华严部類: "华严",
  寶積部類: "宝积",
  宝积部類: "宝积",
  涅槃部類: "涅槃",
  大集部類: "大集",
  經集部類: "经集（零散大乘经典）",
  经集部類: "经集（零散大乘经典）",
  密教部類: "密教（真言宗、陀罗尼、仪轨）",
  律部類: "律部（戒律、僧制）",
  毘曇部類: "毗昙（小乘论说）",
  毗昙部類: "毗昙（小乘论说）",
  瑜伽部類: "瑜伽（唯识宗 / 法相宗）",
  論集部類: "论集（杂论、通论）",
  论集部類: "论集（杂论、通论）",
  淨土宗部類: "净土宗",
  净土宗部類: "净土宗",
  國圖善本部類: "国图善本（扩展类目）",
  国图善本部類: "国图善本（扩展类目）",
  漢譯南傳大藏經部類: "阿含（小乘根本经典）",
};

const SECTION_HEADER_RE = /^(\d{2})\s+(\S+部類|\S+宗部類)/;
const TOPIC_HEADER_RE = /^\t(\d{2})\s+(.+?)(?:\s+T|／|$)/;

export type ZaijiaIndexes = {
  categoryById: Map<string, CorpusCategory>;
  metaById: Map<string, ZaijiaMeta>;
  /** 在家目录一级编号 → 语料 23 类（导入时一次性对齐，不写入 meta 第二套名称） */
  sectionCodeToCategory: Map<string, CorpusCategory>;
};

let cached: ZaijiaIndexes | null = null;

function sectionCategory(sectionLabel: string): CorpusCategory | null {
  const key = sectionLabel.replace(/\s/g, "");
  return ZAIJIA_SECTION_TO_CATEGORY[key] ?? ZAIJIA_SECTION_TO_CATEGORY[sectionLabel] ?? null;
}

function isCommentaryHeader(line: string): boolean {
  if (!line.startsWith("\t")) return false;
  /** 「10 般若心經 …／疏」是主题行，不是疏钞目录行 */
  if (/^\t\d{2}\s/.test(line)) return false;
  if (/ etc .*(疏|鈔|註|注)/.test(line)) return true;
  if (/經疏|義疏|心經疏|疏 T\d|疏 X|／疏\s/.test(line)) return true;
  return false;
}

/** 纯经子目录行（如 T0262-65 法華經 T09a）→ 退出疏钞子树 */
export function isPureSutraSubtreeHeader(line: string): boolean {
  if (!line.startsWith("\t")) return false;
  if (/^\t+T\d{4}-\d+\s+[\u4e00-\u9fff·a-zA-Z]+經\s+T\d/i.test(line)) return true;
  if (/^\t\d{2}\s+.+經\s+T/i.test(line) && !/[／\/]疏|經疏|義疏|論\s+T|鈔/.test(line)) return true;
  return false;
}

/** 经目行题名启发式：疏钞题名优先；译本（譯】）→ 经；否则继承疏子树 */
export function inferKindFromWorkLine(
  line: string,
  commentarySubtree: boolean,
): ZaijiaMeta["kind"] {
  const titlePart = line.replace(/^[\t\s]*[A-Za-z]+\d+n(?:\d+[A-Za-z]?|[A-Za-z]\d+)\s*/, "");
  const beforeBracket = titlePart.split("【")[0] ?? titlePart;
  if (/(疏|鈔|義疏|義記|科|釋|释|记|記)/.test(beforeBracket)) {
    return "疏";
  }
  if (/【[^】]*譯】/.test(line)) {
    return "经";
  }
  return commentarySubtree ? "疏" : "经";
}

function isTopicHeader(line: string): boolean {
  return TOPIC_HEADER_RE.test(line) && !isCommentaryHeader(line);
}

function parseTopicHeader(line: string): { code: string; label: string } | null {
  const m = line.match(TOPIC_HEADER_RE);
  if (!m) return null;
  return { code: m[1]!, label: m[2]!.trim() };
}

/** 由在家目录编号取语料部类名（与 category 同体系）；仅展示/检索用 */
export function categoryFromZaijiaSectionCode(sectionCode: string): CorpusCategory | null {
  const code = sectionCode.trim();
  if (!code) return null;
  return ensureCache().sectionCodeToCategory.get(code) ?? null;
}

/** meta 用：一级部类名（如 般若部類） */
export function formatZaijiaSection(meta: ZaijiaMeta): string {
  return meta.sectionLabel;
}

/** meta 用：二级主题名（如 其他般若） */
export function formatZaijiaTopic(meta: ZaijiaMeta): string | undefined {
  if (!meta.topicLabel) return undefined;
  return meta.topicLabel;
}

/** 一次解析 zaijia.txt */
/** 从目录行提取经目 ID（供测试与审计复用） */
export function extractZaijiaWorkIds(line: string): string[] {
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(ZAIJIA_WORK_ID_RE.source, "gi");
  while ((m = re.exec(line)) !== null) {
    ids.push(normalizeCbetaId(m[1]!));
  }
  return ids;
}

/** 按 sectionCode（如 03）筛选 zaijia 经目 */
export function listZaijiaIdsBySectionCode(sectionCode: string): string[] {
  const code = sectionCode.trim();
  const { metaById } = loadZaijiaIndexes();
  return [...metaById.entries()]
    .filter(([, meta]) => meta.sectionCode === code)
    .map(([id]) => id);
}

/** 全部在家目录 section 编号（如 01、03） */
export function listZaijiaSectionCodes(): string[] {
  const { metaById } = loadZaijiaIndexes();
  return [...new Set([...metaById.values()].map((m) => m.sectionCode))].sort();
}

export function loadZaijiaIndexes(zaijiaPath = ZAIJIA_PATH): ZaijiaIndexes {
  const categoryById = new Map<string, CorpusCategory>();
  const metaById = new Map<string, ZaijiaMeta>();
  const sectionCodeToCategory = new Map<string, CorpusCategory>();

  if (!fs.existsSync(zaijiaPath)) {
    return { categoryById, metaById, sectionCodeToCategory };
  }

  let sectionCode = "";
  let sectionLabel = "";
  let sectionCat: CorpusCategory | null = null;
  let topicCode: string | undefined;
  let topicLabel: string | undefined;
  let commentarySubtree = false;

  for (const rawLine of fs.readFileSync(zaijiaPath, "utf-8").split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const sectionMatch = line.match(SECTION_HEADER_RE);
    if (sectionMatch) {
      sectionCode = sectionMatch[1]!;
      sectionLabel = sectionMatch[2]!;
      sectionCat = sectionCategory(sectionLabel);
      if (sectionCat) sectionCodeToCategory.set(sectionCode, sectionCat);
      topicCode = undefined;
      topicLabel = undefined;
      commentarySubtree = false;
      continue;
    }

    if (!sectionCat) continue;

    const isWorkLine = WORK_ID_RE.test(line);
    WORK_ID_RE.lastIndex = 0;
    if (!isWorkLine) {
      if (isTopicHeader(line)) {
        commentarySubtree = false;
        const topic = parseTopicHeader(line);
        if (topic) {
          topicCode = topic.code;
          topicLabel = topic.label;
        }
      } else if (isPureSutraSubtreeHeader(line)) {
        commentarySubtree = false;
      } else if (isCommentaryHeader(line)) {
        commentarySubtree = true;
      }
      continue;
    }

    const kind = inferKindFromWorkLine(line, commentarySubtree);
    const cat: CorpusCategory =
      kind === "疏" && sectionCat ? sectionCat : sectionCat ?? "论集（杂论、通论）";
    const zm: ZaijiaMeta = {
      sectionCode,
      sectionLabel,
      topicCode,
      topicLabel,
      kind,
    };

    let m: RegExpExecArray | null;
    WORK_ID_RE.lastIndex = 0;
    while ((m = WORK_ID_RE.exec(line)) !== null) {
      const id = normalizeCbetaId(m[1]!);
      if (!metaById.has(id)) {
        metaById.set(id, zm);
        categoryById.set(id, cat);
      }
    }
  }

  return { categoryById, metaById, sectionCodeToCategory };
}

function ensureCache(): ZaijiaIndexes {
  if (!cached) cached = loadZaijiaIndexes();
  return cached;
}

export function getZaijiaCategoryIndex(): Map<string, CorpusCategory> {
  return ensureCache().categoryById;
}

export function getZaijiaMeta(cbetaId: string): ZaijiaMeta | undefined {
  const id = normalizeCbetaId(cbetaId);
  return ensureCache().metaById.get(id);
}

export function resetZaijiaCategoryIndexCache(): void {
  cached = null;
}

/** @deprecated 使用 loadZaijiaIndexes */
export function loadZaijiaCategoryIndex(zaijiaPath = ZAIJIA_PATH): Map<string, CorpusCategory> {
  return loadZaijiaIndexes(zaijiaPath).categoryById;
}
