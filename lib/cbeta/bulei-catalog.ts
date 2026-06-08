/**
 * 解析 cbwork-bin cbreader2X bulei.txt（部类目录权威源）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import type { CorpusCategory } from "./corpus-category";
import { lookupTaishoCategory, normalizeCbetaId } from "./corpus-category";
import { corpusCategoryFromBuleiSection, BULEI_SECTION_TO_CATEGORY } from "./bulei-section-map";
import { buleiGroupDirName } from "./bulei-path";
import {
  expandShortSutraId,
  isFullCbetaIdForm,
  loadSutralistShortToFullMap,
} from "./sutralist-short-id";
import { getSutralistRowByCbetaId, loadSutralistRows } from "./sutralist-full";
import { loadBuleiAliasShortById } from "./bulei-aliases";
import {
  loadCatalogByCbetaId,
  normalizeCatalogTitle,
} from "./bulei-catalog-bridge";

export const BULEI_TXT_PATH = path.join(
  process.cwd(),
  "cbwork-bin/cbreader2X/bulei/bulei.txt",
);

export type BuleiNodeType = "" | "C" | "J" | "L";

export type BuleiCatalogEntry = {
  sectionCode: string;
  sectionLabel: string;
  groupLabel: string;
  breadcrumbs: string[];
  kind: "经" | "疏";
  /** hybrid 路径中间段目录名 */
  groupDir: string;
};

export type BuleiResolveSource =
  | "bulei.txt"
  | "juan"
  | "sutralist"
  | "short"
  | "catalog"
  | "alias"
  | "inferred";

export type ResolvedBuleiMeta = BuleiCatalogEntry & {
  source: BuleiResolveSource;
};

type ParsedRow = {
  level: number;
  data: string;
  type: BuleiNodeType;
  rawLine: string;
  link?: string;
};

type JuanRangeBinding = {
  workPrefix: string;
  startJuan: number;
  endJuan: number;
  entry: BuleiCatalogEntry;
};

const SECTION_HEADER_RE = /^(\d{2})\s+(\S+(?:部類|宗部類))\s/;
const LEAF_WORK_RE = /^([A-Z]+a?\d+[A-Za-z]?)\s/;
const LEAF_JUAN_RE = /^([A-Z]+a?\d+[A-Za-z]?_\d\d\d(?:\.\.\d\d\d)?)[ \t]+(.*)$/;
const LEAF_HTML_RE = /^(\S+\.html?)[ \t]+(.*)$/i;

let cachedIndex: Map<string, BuleiCatalogEntry> | null = null;
let cachedParseErrors = 0;
let cachedJuanRanges: JuanRangeBinding[] | null = null;
let cachedSutralistSupplement: Map<string, BuleiCatalogEntry> | null = null;
let cachedCatalogBridge: Map<string, BuleiCatalogEntry> | null = null;

function inferKindFromLine(line: string, commentarySubtree: boolean): "经" | "疏" {
  const titlePart = line.replace(/^[\t\s]*[A-Za-z]+\d+n(?:\d+[A-Za-z]?|[A-Za-z]\d+)\s*/, "");
  const beforeBracket = (titlePart.split("【")[0] ?? titlePart).split(/\d+卷/)[0] ?? titlePart;
  if (/(疏|鈔|義疏|義记|科|釋|释|记|記)/.test(beforeBracket)) return "疏";
  if (/【[^】]*譯】/.test(line)) return "经";
  if (/(經疏|義疏|／疏|\/疏)/.test(line)) return "疏";
  return commentarySubtree ? "疏" : "经";
}

function pickGroupLabel(stack: ParsedRow[]): string {
  for (let i = stack.length - 1; i >= 0; i--) {
    const row = stack[i]!;
    if (row.level === 2 || row.level === 3) {
      if (row.type === "" && row.data.trim()) return row.data.trim();
    }
  }
  const section = stack.find((r) => r.level === 1);
  return section?.data.trim() ?? "未分组";
}

function makeEntry(
  sectionCode: string,
  sectionLabel: string,
  stack: ParsedRow[],
  row: ParsedRow,
  commentarySubtree: boolean,
): BuleiCatalogEntry {
  const stackForGroup = [...stack, row];
  const groupLabel = pickGroupLabel(stack);
  const breadcrumbs = stackForGroup
    .filter((r) => r.level >= 1 && r.type === "")
    .map((r) => (r.level === 1 ? `${sectionCode} ${sectionLabel}` : r.data.trim()));
  const kind = inferKindFromLine(row.rawLine, commentarySubtree);
  return {
    sectionCode,
    sectionLabel,
    groupLabel,
    breadcrumbs,
    kind,
    groupDir: buleiGroupDirName(groupLabel),
  };
}

function parseBuleiRows(lines: string[]): ParsedRow[] {
  const rows: ParsedRow[] = [];
  for (const raw of lines) {
    if (!raw.trim()) continue;
    let level = 1;
    let content = raw;
    while (content.startsWith("\t")) {
      level += 1;
      content = content.slice(1);
    }
    content = content.replace(/\s+$/, "");
    rows.push({ level, data: content, type: "", rawLine: raw });
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const isLast = i === rows.length - 1;
    const nextLevel = isLast ? 0 : rows[i + 1]!.level;
    const isLeaf = isLast || row.level >= nextLevel;

    if (!isLeaf) {
      row.type = "";
      continue;
    }

    if (LEAF_WORK_RE.test(row.data)) {
      row.data = row.data.match(LEAF_WORK_RE)![1]!;
      row.type = "C";
    } else if (LEAF_JUAN_RE.test(row.data)) {
      const m = row.data.match(LEAF_JUAN_RE)!;
      row.link = m[1]!;
      row.data = m[2]!.trim();
      row.type = "J";
    } else if (LEAF_HTML_RE.test(row.data)) {
      const m = row.data.match(LEAF_HTML_RE)!;
      row.data = m[2]!.trim();
      row.type = "L";
    } else {
      row.type = "";
      cachedParseErrors += 1;
    }
  }

  return rows;
}

function parseJuanRangeLink(link: string): { workPrefix: string; startJuan: number; endJuan: number } | null {
  const m = link.match(/^([A-Z]+a?\d+[A-Za-z]?)_(\d\d\d)(?:\.\.(\d\d\d))?$/i);
  if (!m) return null;
  const start = parseInt(m[2]!, 10);
  const end = m[3] ? parseInt(m[3], 10) : start;
  return { workPrefix: m[1]!.toUpperCase(), startJuan: start, endJuan: end };
}

function buildBuleiIndex(filePath: string): {
  index: Map<string, BuleiCatalogEntry>;
  juanRanges: JuanRangeBinding[];
} {
  cachedParseErrors = 0;
  const index = new Map<string, BuleiCatalogEntry>();
  const juanRanges: JuanRangeBinding[] = [];
  if (!fs.existsSync(filePath)) return { index, juanRanges };

  const shortToFull = loadSutralistShortToFullMap();
  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/);
  const rows = parseBuleiRows(lines);

  let sectionCode = "";
  let sectionLabel = "";
  const stack: ParsedRow[] = [];
  let commentarySubtree = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    while (stack.length > 0 && stack[stack.length - 1]!.level >= row.level) {
      stack.pop();
    }

    if (row.level === 1) {
      const m = row.data.match(SECTION_HEADER_RE);
      if (m) {
        sectionCode = m[1]!;
        sectionLabel = m[2]!;
        commentarySubtree = false;
      }
      stack.push(row);
      continue;
    }

    if (row.type === "C") {
      const canonicalId = expandShortSutraId(row.data, shortToFull);
      if (!index.has(canonicalId)) {
        const entry = makeEntry(sectionCode, sectionLabel, stack, row, commentarySubtree);
        index.set(canonicalId, entry);
      }
    } else if (row.type === "J" && row.link) {
      const range = parseJuanRangeLink(row.link);
      if (range) {
        const entry = makeEntry(sectionCode, sectionLabel, stack, row, commentarySubtree);
        juanRanges.push({
          workPrefix: range.workPrefix,
          startJuan: range.startJuan,
          endJuan: range.endJuan,
          entry,
        });
      }
    }

    if (/(疏|鈔|釋|释|義疏)/.test(row.data) && row.type === "") {
      commentarySubtree = true;
    }
    if (/(部類|宗部類).*疏|疏钞|經疏/.test(pickGroupLabel(stack))) {
      commentarySubtree = true;
    }

    stack.push(row);
  }

  return { index, juanRanges };
}

function ensureBuilt(): void {
  if (cachedIndex && cachedJuanRanges) return;
  const { index, juanRanges } = buildBuleiIndex(BULEI_TXT_PATH);
  cachedIndex = index;
  cachedJuanRanges = juanRanges;
}

export function getBuleiCatalogIndex(
  filePath: string = BULEI_TXT_PATH,
): Map<string, BuleiCatalogEntry> {
  if (filePath === BULEI_TXT_PATH) {
    ensureBuilt();
    return cachedIndex!;
  }
  return buildBuleiIndex(filePath).index;
}

function getJuanRangeIndex(): JuanRangeBinding[] {
  ensureBuilt();
  return cachedJuanRanges!;
}

export function resetBuleiCatalogCache(): void {
  cachedIndex = null;
  cachedParseErrors = 0;
  cachedJuanRanges = null;
  cachedSutralistSupplement = null;
  cachedCatalogBridge = null;
}

export function getBuleiParseErrorCount(): number {
  getBuleiCatalogIndex();
  return cachedParseErrors;
}

/** 仅 bulei.txt C 叶节点精确索引（审计「XML 未入 bulei」用） */
export function getBuleiMetaExact(cbetaId: string): BuleiCatalogEntry | undefined {
  const id = normalizeCbetaId(cbetaId);
  return getBuleiCatalogIndex().get(id);
}

function buleiSectionLabelForCategory(category: CorpusCategory): string {
  for (const [section, cat] of Object.entries(BULEI_SECTION_TO_CATEGORY)) {
    if (cat === category) return section;
  }
  return "新編部類";
}

const INFER_SERIES_CATEGORY: Record<string, CorpusCategory> = {
  N: "阿含（小乘根本经典）",
  B: "新编（新增及近现代文献）",
  ZW: "新编（新增及近现代文献）",
  TX: "新编（新增及近现代文献）",
  LC: "新编（新增及近现代文献）",
  YP: "新编（新增及近现代文献）",
  GA: "新编（新增及近现代文献）",
  GB: "新编（新增及近现代文献）",
  X: "论集（杂论、通论）",
  A: "宗教（总类 / 总论）",
};

function inferCategoryWithoutBulei(cbetaId: string): CorpusCategory {
  const id = normalizeCbetaId(cbetaId);
  const tHit = lookupTaishoCategory(id);
  if (tHit) return tHit;
  const series = id.match(/^([A-Z]+)/)?.[1] ?? "";
  return INFER_SERIES_CATEGORY[series] ?? "宗教（总类 / 总论）";
}

function inferBuleiEntry(cbetaId: string): ResolvedBuleiMeta {
  const category = inferCategoryWithoutBulei(cbetaId);
  const sectionLabel = buleiSectionLabelForCategory(category);
  const sectionCode = "00";
  const groupLabel = "未入 bulei";
  return {
    sectionCode,
    sectionLabel,
    groupLabel,
    breadcrumbs: [`${sectionCode} ${sectionLabel}`, groupLabel],
    kind: "经",
    groupDir: buleiGroupDirName(groupLabel),
    source: "inferred",
  };
}

function wrap(entry: BuleiCatalogEntry, source: BuleiResolveSource): ResolvedBuleiMeta {
  return { ...entry, source };
}

function shortWorkIdFromCbetaId(cbetaId: string): string | null {
  const id = normalizeCbetaId(cbetaId);
  const m = id.match(/^([A-Z]+)\d+n(\d+[A-Za-z]?)$/i);
  if (!m) return null;
  const book = m[1]!.toUpperCase();
  const num = m[2]!;
  if (book === "B" || book === "GA" || book === "GB") {
    const padded = /^\d+$/.test(num) ? num.padStart(4, "0") : num;
    return `${book}${padded}`;
  }
  return `${book}${num}`.toUpperCase();
}

function resolveViaShortId(cbetaId: string): ResolvedBuleiMeta | undefined {
  const short = shortWorkIdFromCbetaId(cbetaId);
  if (!short) return undefined;
  const hit = lookupBuleiByAnyId(short);
  if (hit) return wrap(hit, "short");
  return undefined;
}

function resolveViaSutralistSupplement(cbetaId: string): ResolvedBuleiMeta | undefined {
  if (!cachedSutralistSupplement) {
    cachedSutralistSupplement = new Map();
    const index = getBuleiCatalogIndex();
    const shortToFull = loadSutralistShortToFullMap();
    for (const row of loadSutralistRows()) {
      if (index.has(row.cbetaId) || cachedSutralistSupplement.has(row.cbetaId)) continue;
      const firstFull = expandShortSutraId(row.shortKey, shortToFull);
      const entry = index.get(firstFull);
      if (entry) cachedSutralistSupplement.set(row.cbetaId, entry);
    }
  }
  const hit = cachedSutralistSupplement.get(normalizeCbetaId(cbetaId));
  return hit ? wrap(hit, "sutralist") : undefined;
}

function resolveViaJuanRange(cbetaId: string): ResolvedBuleiMeta | undefined {
  const row = getSutralistRowByCbetaId(cbetaId);
  if (!row) return undefined;

  for (const binding of getJuanRangeIndex()) {
    const prefix = binding.workPrefix.toUpperCase();
    const matches =
      row.shortKey.startsWith(prefix) ||
      row.shortKey === prefix ||
      row.sutraNum.toUpperCase().startsWith(prefix.slice(1)) ||
      (prefix === "T0220" && row.book === "T" && /^0220/i.test(row.sutraNum));

    if (
      matches &&
      row.startJuan >= binding.startJuan &&
      row.startJuan <= binding.endJuan
    ) {
      return wrap(binding.entry, "juan");
    }
  }

  return undefined;
}

function buildCatalogBridgeIndex(): Map<string, BuleiCatalogEntry> {
  if (cachedCatalogBridge) return cachedCatalogBridge;

  const index = new Map<string, BuleiCatalogEntry>();
  const exact = getBuleiCatalogIndex();
  const titleToEntry = new Map<string, BuleiCatalogEntry>();

  for (const [, entry] of exact) {
    const last = entry.breadcrumbs[entry.breadcrumbs.length - 1] ?? "";
    const titlePart = last.replace(/^[^\s]+\s+/, "").split(/\d+卷/)[0] ?? last;
    const key = normalizeCatalogTitle(titlePart);
    if (key.length >= 4 && !titleToEntry.has(key)) {
      titleToEntry.set(key, entry);
    }
  }

  for (const [id, row] of loadCatalogByCbetaId()) {
    if (exact.has(id)) continue;
    const key = normalizeCatalogTitle(row.title);
    if (key.length >= 4) {
      const hit = titleToEntry.get(key);
      if (hit) {
        index.set(id, hit);
        continue;
      }
      for (const [tKey, entry] of titleToEntry) {
        if (tKey.length >= 6 && (key.includes(tKey) || tKey.includes(key))) {
          index.set(id, entry);
          break;
        }
      }
    }
    if (!index.has(id) && ["ZW", "TX", "LC", "YP"].includes(row.book)) {
      const zw = lookupBuleiByAnyId("ZW0001");
      if (zw) index.set(id, zw);
    }
  }

  cachedCatalogBridge = index;
  return index;
}

function resolveViaCatalogBridge(cbetaId: string): ResolvedBuleiMeta | undefined {
  const hit = buildCatalogBridgeIndex().get(normalizeCbetaId(cbetaId));
  return hit ? wrap(hit, "catalog") : undefined;
}

function resolveViaAlias(cbetaId: string): ResolvedBuleiMeta | undefined {
  const id = normalizeCbetaId(cbetaId);
  const short = loadBuleiAliasShortById().get(id);
  if (!short) return undefined;
  const hit = lookupBuleiByAnyId(short);
  return hit ? wrap(hit, "alias") : undefined;
}

/**
 * 完整 bulei 解析链（精确索引 → 短号 → sutralist 分册 → 卷段 → catalog → 别名 → 推断）
 * @author 代长亚
 */
export function resolveBuleiMeta(cbetaId: string): ResolvedBuleiMeta | undefined {
  const id = normalizeCbetaId(cbetaId);

  const exact = getBuleiMetaExact(id);
  if (exact) return wrap(exact, "bulei.txt");

  const strategies = [
    () => resolveViaShortId(id),
    () => resolveViaSutralistSupplement(id),
    () => resolveViaJuanRange(id),
    () => resolveViaCatalogBridge(id),
    () => resolveViaAlias(id),
  ];

  for (const fn of strategies) {
    const hit = fn();
    if (hit) return hit;
  }

  const aggregate = id.match(/^(T\d+n0220)$/i);
  if (aggregate) {
    const sibling = resolveBuleiMeta(`${id}a`);
    if (sibling && sibling.source !== "inferred") {
      return { ...sibling, source: sibling.source === "bulei.txt" ? "juan" : sibling.source };
    }
  }

  return inferBuleiEntry(id);
}

export function getBuleiMeta(cbetaId: string): BuleiCatalogEntry | undefined {
  const resolved = resolveBuleiMeta(cbetaId);
  if (!resolved) return undefined;
  const { source: _s, ...entry } = resolved;
  return entry;
}

export function getBuleiCategory(cbetaId: string): CorpusCategory | null {
  const resolved = resolveBuleiMeta(cbetaId);
  if (!resolved || resolved.source === "inferred") return null;
  return corpusCategoryFromBuleiSection(resolved.sectionLabel);
}

/** 将任意经号规范后查 bulei（支持短号 T0001） */
export function lookupBuleiByAnyId(workId: string): BuleiCatalogEntry | undefined {
  const trimmed = workId.trim();
  if (isFullCbetaIdForm(trimmed)) {
    return getBuleiMetaExact(normalizeCbetaId(trimmed));
  }
  const shortToFull = loadSutralistShortToFullMap();
  const full = expandShortSutraId(trimmed, shortToFull);
  return getBuleiMetaExact(full);
}

export function loadBuleiCategoryIndex(): Map<string, CorpusCategory> {
  const out = new Map<string, CorpusCategory>();
  for (const [id, entry] of getBuleiCatalogIndex()) {
    const cat = corpusCategoryFromBuleiSection(entry.sectionLabel);
    if (cat) out.set(id, cat);
  }
  return out;
}

/** 审计：解析来源统计 */
export function classifyBuleiResolve(cbetaId: string): {
  exact: boolean;
  resolved: boolean;
  source?: BuleiResolveSource;
} {
  const id = normalizeCbetaId(cbetaId);
  const exact = !!getBuleiMetaExact(id);
  const resolved = resolveBuleiMeta(id);
  return {
    exact,
    resolved: !!resolved,
    source: resolved?.source,
  };
}
