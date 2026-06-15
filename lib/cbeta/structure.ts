/**
 * CBETA TEI 结构解析：卷 / 品目 / 段落 / 偈颂（Corpus V3）
 * @author 代长亚
 */
import crypto from "crypto";
import { XMLParser } from "fast-xml-parser";
import { extractDirDisambiguatorFromXml } from "@/lib/corpus-v3/dir-disambiguator";
import { deriveBlockRole, type BlockRole } from "./block-role";
import { BODY_START_ANCHORS, PREFACE_MARKERS } from "./preface-filter-anchors";
import {
  extractParagraphAnchorSpans,
  extractTeiTitle,
  extractTeiTranslator,
} from "./parser";

export type BlockKind = "prose" | "verse";

export type StructureBlock = {
  kind: BlockKind;
  text: string;
  startRef?: string;
  endRef?: string;
  xmlId?: string;
  /** 本块所属品目标题（仅在该品目首块上设置） */
  sectionTitle?: string;
  blockRole: BlockRole;
  canonicalId: string;
  contentHash: string;
  parserPid: string;
  seq: number;
};

export type StructureJuan = {
  juanNum: number;
  /** 卷内显示名，如「第一卷」 */
  label: string;
  blocks: StructureBlock[];
};

export type ParsedStructure = {
  cbetaId: string;
  title: string;
  translator?: string;
  dynasty?: string;
  juanCount?: number;
  sourceXmlRel?: string;
  /** 目录消歧标签（如「录文二」），供 corpus 经目目录命名 */
  dirDisambiguator?: string;
  /** 无 cb:juan 时仅 1 项，juanNum=0，输出为「全文」 */
  juans: StructureJuan[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  isArray: (name) => ["p", "lg", "l", "row", "cb:juan", "cb:mulu"].includes(name),
});

const SKIP_TAGS = new Set([
  "anchor",
  "lb",
  "pb",
  "milestone",
  "cb:mulu",
  "figure",
  "graphic",
  "space",
  "ref",
  "caesura",
]);

const CHOICE_PREFERRED = ["corr", "reg"] as const;
const CHOICE_FALLBACK = ["sic", "orig"] as const;

type BlockContext = { juan: number; section?: string; divType?: string };

function hashText(text: string): string {
  return crypto.createHash("sha1").update(text, "utf-8").digest("hex").slice(0, 12);
}

function canonicalIdBase(cbetaId: string, startRef?: string, endRef?: string): string {
  const s = startRef ?? "p0000a00";
  const e = endRef ?? s;
  return `${cbetaId}:${s}-${e}`;
}

function collectText(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (typeof node === "object") return collectTextFromObject(node as Record<string, unknown>);
  return "";
}

function collectTextFromChoice(val: unknown): string {
  const items = Array.isArray(val) ? val : [val];
  let out = "";
  for (const item of items) {
    if (item == null) continue;
    if (typeof item !== "object") {
      out += collectText(item);
      continue;
    }
    const obj = item as Record<string, unknown>;
    let picked = false;
    for (const key of CHOICE_PREFERRED) {
      if (obj[key] != null) {
        out += collectText(obj[key]);
        picked = true;
        break;
      }
    }
    if (picked) continue;
    for (const key of CHOICE_FALLBACK) {
      if (obj[key] != null) {
        out += collectText(obj[key]);
        picked = true;
        break;
      }
    }
    if (!picked) out += collectTextFromObject(obj);
  }
  return out;
}

function isEmptyInlineP(obj: Record<string, unknown>): boolean {
  const rend = obj["@_rend"];
  if (typeof rend !== "string" || !rend.includes("inline")) return false;
  return collectInlinePBodyText(obj).replace(/\s+/g, "").length === 0;
}

function collectInlinePBodyText(obj: Record<string, unknown>): string {
  let out = "";
  if (obj["#text"] != null) out += collectText(obj["#text"]);
  for (const [key, val] of Object.entries(obj)) {
    if (key === "#text" || key.startsWith("@_")) continue;
    if (SKIP_TAGS.has(key)) continue;
    if (key === "choice") {
      out += collectTextFromChoice(val);
      continue;
    }
    if (key === "p") {
      const items = Array.isArray(val) ? val : [val];
      for (const item of items) {
        if (typeof item === "object" && item !== null && isEmptyInlineP(item as Record<string, unknown>)) {
          continue;
        }
        out += collectText(item);
      }
      continue;
    }
    out += collectText(val);
  }
  return out;
}

function collectTextFromObject(obj: Record<string, unknown>): string {
  let out = "";
  if (obj["#text"] != null) out += collectText(obj["#text"]);
  for (const [key, val] of Object.entries(obj)) {
    if (key === "#text" || key.startsWith("@_")) continue;
    if (SKIP_TAGS.has(key)) continue;
    if (key === "choice") {
      out += collectTextFromChoice(val);
      continue;
    }
    if (key === "p") {
      const items = Array.isArray(val) ? val : [val];
      for (const item of items) {
        if (typeof item === "object" && item !== null && isEmptyInlineP(item as Record<string, unknown>)) {
          continue;
        }
        out += collectText(item);
      }
      continue;
    }
    out += collectText(val);
  }
  return out;
}

/** 收集偈颂单行，保留 caesura 为「 / 」 */
function collectVerseLine(node: unknown): string {
  if (node == null || typeof node !== "object") return collectText(node).trim();
  const obj = node as Record<string, unknown>;
  let out = "";
  if (obj["#text"] != null) out += String(obj["#text"]);
  for (const [key, val] of Object.entries(obj)) {
    if (key === "#text" || key.startsWith("@_")) continue;
    if (key === "caesura") {
      out += " / ";
      continue;
    }
    if (SKIP_TAGS.has(key)) continue;
    if (key === "choice") {
      out += collectTextFromChoice(val);
      continue;
    }
    out += collectText(val);
  }
  return out.trim();
}

function collectVerseBlock(lg: unknown): string {
  const obj = lg && typeof lg === "object" ? (lg as Record<string, unknown>) : undefined;
  if (!obj) return "";
  const lines: string[] = [];
  const lNodes = obj.l ?? obj.row;
  if (lNodes) {
    const items = Array.isArray(lNodes) ? lNodes : [lNodes];
    for (const item of items) {
      const line = collectVerseLine(item);
      if (line) lines.push(line);
    }
  }
  return lines.join("\n");
}

/** 按 XML 文档顺序建立块级上下文（卷号、品目） */
function buildBlockContextMap(xml: string): {
  byXmlId: Map<string, BlockContext>;
  defaultJuan: number;
} {
  const byXmlId = new Map<string, BlockContext>();
  let juan = 0;
  let section: string | undefined;
  let divType: string | undefined;
  const tagRe = /<[^>]+>/g;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(xml))) {
    const tag = m[0];

    if (tag.startsWith("<cb:juan")) {
      const fun = tag.match(/\bfun=\"([^\"]+)\"/)?.[1];
      const n = tag.match(/\bn=\"(\d+)\"/)?.[1];
      if (fun === "open" && n) juan = parseInt(n, 10);
      continue;
    }

    if (tag.startsWith("<milestone") && tag.includes('unit="juan"')) {
      const n = tag.match(/\bn=\"(\d+)\"/)?.[1];
      if (n) juan = parseInt(n, 10);
      continue;
    }

    if (tag.startsWith("<cb:div")) {
      const type = tag.match(/\btype=\"([^\"]+)\"/)?.[1];
      if (type) divType = type;
      continue;
    }

    if (tag.startsWith("<cb:mulu")) {
      const inner = tag.match(/>([^<]+)</)?.[1]?.trim();
      const n = tag.match(/\bn=\"([^\"]+)\"/)?.[1];
      const type = tag.match(/\btype=\"([^\"]+)\"/)?.[1];
      if (inner) section = inner;
      else if (n && type) section = `${n}`;
      continue;
    }

    if (tag.startsWith("<head")) {
      const closeIdx = xml.indexOf("</head>", m.index);
      if (closeIdx > m.index) {
        const inner = xml.slice(m.index + tag.length, closeIdx).replace(/<[^>]+>/g, "").trim();
        if (inner) section = inner;
      }
      continue;
    }

    if (tag.startsWith("<p")) {
      const xmlId = tag.match(/\bxml:id=\"([^\"]+)\"/)?.[1];
      if (xmlId) byXmlId.set(xmlId, { juan, section, divType });
      continue;
    }

    if (tag.startsWith("<l") && !tag.startsWith("<lb") && !tag.startsWith("<lg")) {
      const xmlId = tag.match(/\bxml:id=\"([^\"]+)\"/)?.[1];
      if (xmlId) byXmlId.set(xmlId, { juan, section, divType });
    }
  }

  return { byXmlId, defaultJuan: juan };
}

function juanLabel(n: number): string {
  return `第${n}卷`;
}

function extractJuanCount(fileDesc: unknown): number | undefined {
  if (!fileDesc || typeof fileDesc !== "object") return undefined;
  const extent = collectText((fileDesc as Record<string, unknown>).extent);
  const m = extent.match(/(\d+)\s*卷/);
  return m ? parseInt(m[1], 10) : undefined;
}

type RawBlock = {
  kind: BlockKind;
  text: string;
  startRef?: string;
  endRef?: string;
  xmlId?: string;
  juan: number;
  section?: string;
  divType?: string;
};

function walkBodyForBlocks(
  body: unknown,
  ctxMap: Map<string, BlockContext>,
  defaultJuan: number,
  anchorSpans: ReturnType<typeof extractParagraphAnchorSpans>,
  out: RawBlock[],
) {
  if (!body || typeof body !== "object") return;
  const b = body as Record<string, unknown>;

  for (const key of Object.keys(b)) {
    if (key.startsWith("@_")) continue;
    const val = b[key];
    if (key === "head" || key === "trailer" || key === "note" || key === "cb:jhead") continue;

    if (key === "p") {
      const items = Array.isArray(val) ? val : [val];
      for (const item of items) {
        const itemObj = item && typeof item === "object" ? (item as Record<string, unknown>) : undefined;
        if (itemObj && isEmptyInlineP(itemObj)) continue;
        const xmlId = itemObj?.["@_xml:id"];
        const idStr = typeof xmlId === "string" ? xmlId : undefined;
        const bc = idStr ? ctxMap.get(idStr) : undefined;
        const text = collectText(item).replace(/\s+/g, "");
        if (text.length === 0) continue;
        const span = idStr ? anchorSpans.get(idStr) : undefined;
        out.push({
          kind: "prose",
          text,
          startRef: span?.startRef,
          endRef: span?.endRef,
          xmlId: idStr,
          juan: bc?.juan ?? defaultJuan,
          section: bc?.section,
          divType: bc?.divType,
        });
      }
    } else if (key === "lg") {
      const items = Array.isArray(val) ? val : [val];
      for (const lg of items) {
        const lgObj = lg && typeof lg === "object" ? (lg as Record<string, unknown>) : undefined;
        const xmlId = lgObj?.["@_xml:id"];
        const idStr = typeof xmlId === "string" ? xmlId : undefined;
        const bc = idStr ? ctxMap.get(idStr) : undefined;
        const text = collectVerseBlock(lg);
        if (text.length === 0) continue;
        out.push({
          kind: "verse",
          text,
          xmlId: idStr,
          juan: bc?.juan ?? defaultJuan,
          section: bc?.section,
          divType: bc?.divType,
        });
      }
    } else if (key === "l") {
      const items = Array.isArray(val) ? val : [val];
      for (const l of items) {
        const lObj = l && typeof l === "object" ? (l as Record<string, unknown>) : undefined;
        const xmlId = lObj?.["@_xml:id"];
        const idStr = typeof xmlId === "string" ? xmlId : undefined;
        const bc = idStr ? ctxMap.get(idStr) : undefined;
        const text = collectVerseLine(l);
        if (text.length === 0) continue;
        out.push({
          kind: "verse",
          text,
          xmlId: idStr,
          juan: bc?.juan ?? defaultJuan,
          section: bc?.section,
          divType: bc?.divType,
        });
      }
    } else if (key === "item") {
      const items = Array.isArray(val) ? val : [val];
      for (const item of items) {
        const text = collectText(item).replace(/\s+/g, "");
        if (text.length === 0) continue;
        const itemObj = item && typeof item === "object" ? (item as Record<string, unknown>) : undefined;
        const xmlId = itemObj?.["@_xml:id"];
        const idStr = typeof xmlId === "string" ? xmlId : undefined;
        const bc = idStr ? ctxMap.get(idStr) : undefined;
        const juan = (bc?.juan ?? defaultJuan) || 1;
        out.push({
          kind: "prose",
          text,
          xmlId: idStr,
          juan,
          section: bc?.section,
          divType: bc?.divType,
        });
      }
    } else if (typeof val === "object") {
      walkBodyForBlocks(val, ctxMap, defaultJuan, anchorSpans, out);
    }
  }
}


export type ParseStructureOptions = {
  stripPreface?: boolean;
  sourceXmlRel?: string;
};

export function parseCbetaStructure(
  xml: string,
  cbetaId: string,
  options: ParseStructureOptions = {},
): ParsedStructure {
  const doc = parser.parse(xml);
  const tei = doc.TEI ?? doc.tei ?? doc;
  const teiHeader = tei.teiHeader ?? tei.TEIHeader;
  const fileDesc = teiHeader?.fileDesc;
  const titleStmt = fileDesc?.titleStmt;
  const title = extractTeiTitle(titleStmt, cbetaId);
  const translator = extractTeiTranslator(titleStmt, fileDesc?.publicationStmt);
  const dynasty = translator?.match(/^(.{1,4})\s+/)?.[1];
  const juanCount = extractJuanCount(fileDesc);

  const text = tei.text ?? tei.TEXT;
  const body = text?.body ?? text?.BODY;
  const anchorSpans = extractParagraphAnchorSpans(xml);
  const { byXmlId: ctxMap, defaultJuan } = buildBlockContextMap(xml);

  const rawBlocks: RawBlock[] = [];
  walkBodyForBlocks(body, ctxMap, defaultJuan, anchorSpans, rawBlocks);

  // stripPreface：按正文锚点或序文标记剔除（勿用 filter 重排后的 seq 作块索引）
  let filteredRaw = rawBlocks;
  if (options.stripPreface !== false) {
    const anchor = BODY_START_ANCHORS[cbetaId];
    if (anchor) {
      const idx = rawBlocks.findIndex((b) => b.text.includes(anchor));
      if (idx > 0) filteredRaw = rawBlocks.slice(idx);
    } else if (rawBlocks.some((b) => PREFACE_MARKERS.some((m) => b.text.includes(m)))) {
      filteredRaw = rawBlocks.filter(
        (b) => !PREFACE_MARKERS.some((m) => b.text.includes(m)),
      );
    }
  }

  const juansMap = new Map<number, RawBlock[]>();
  for (const b of filteredRaw) {
    const j = b.juan > 0 ? b.juan : 0;
    if (!juansMap.has(j)) juansMap.set(j, []);
    juansMap.get(j)!.push(b);
  }

  const juanNums = [...juansMap.keys()].sort((a, b) => a - b);
  const hasRealJuan = juanNums.some((n) => n > 0);

  const canonicalCounts = new Map<string, number>();
  let globalSeq = 0;

  const juans: StructureJuan[] = juanNums.map((juanNum) => {
    let lastSection: string | undefined;
    const rawList = juansMap.get(juanNum) ?? [];
    const blocks: StructureBlock[] = [];

    for (const b of rawList) {
      globalSeq += 1;
      const sectionTitle = b.section && b.section !== lastSection ? b.section : undefined;
      if (b.section) lastSection = b.section;

      const baseCanon = canonicalIdBase(cbetaId, b.startRef, b.endRef);
      const count = (canonicalCounts.get(baseCanon) ?? 0) + 1;
      canonicalCounts.set(baseCanon, count);
      const canonicalId = count === 1 ? baseCanon : `${baseCanon}~${count}`;

      blocks.push({
        kind: b.kind,
        text: b.text,
        startRef: b.startRef,
        endRef: b.endRef,
        xmlId: b.xmlId,
        sectionTitle,
        blockRole: deriveBlockRole({
          divType: b.divType,
          section: b.section,
          kind: b.kind,
        }),
        canonicalId,
        contentHash: hashText(b.text),
        parserPid: `p${String(globalSeq).padStart(6, "0")}`,
        seq: globalSeq,
      });
    }

    return {
      juanNum,
      label: hasRealJuan && juanNum > 0 ? juanLabel(juanNum) : "全文",
      blocks,
    };
  });

  return {
    cbetaId,
    title,
    translator,
    dynasty: dynasty && !/[譯撰著]$/.test(dynasty) ? dynasty : undefined,
    juanCount,
    sourceXmlRel: options.sourceXmlRel,
    dirDisambiguator: extractDirDisambiguatorFromXml(xml),
    juans,
  };
}

export function normalizeTextForCompare(text: string): string {
  return text.replace(/\s+/g, "").trim();
}
