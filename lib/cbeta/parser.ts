/**
 * CBETA TEI P5 解析（段落级）
 * @author jingxin
 */
import { XMLParser } from "fast-xml-parser";
import { filterPrefaceParagraphs } from "./preface-filter";

export type ParsedParagraph = {
  chapterSeq: number;
  seq: number;
  text: string;
  /** 该段落起止 CBETA 页栏行坐标（用于 V2 canonical_id） */
  startRef?: string;
  endRef?: string;
  /** 原始 xml:id（若存在，可用于审计/溯源） */
  xmlId?: string;
};

export type ParsedSutra = {
  cbetaId: string;
  title: string;
  translator?: string;
  category?: string;
  paragraphs: ParsedParagraph[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  isArray: (name) => ["p", "lg", "row"].includes(name),
});

/** 纯结构节点，不含可读正文（itertext 语义下跳过） */
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
]);

const CHOICE_PREFERRED = ["corr", "reg"] as const;
const CHOICE_FALLBACK = ["sic", "orig"] as const;

function normalizeRef(n: string, pb?: string): string | undefined {
  const raw = n.trim();
  // e.g. 0001a01 / 0279a26 / 0312b05
  const m1 = raw.match(/^(\d{4})([A-Za-z])(\d{2})$/);
  if (m1) return `p${m1[1]}${m1[2].toLowerCase()}${m1[3]}`;
  // e.g. a01 / b12
  const m2 = raw.match(/^([A-Za-z])(\d{2})$/);
  if (m2 && pb) return `p${pb}${m2[1].toLowerCase()}${m2[2]}`;
  return undefined;
}

type AnchorSpan = { startRef?: string; endRef?: string };

/**
 * 从原始 XML 字符串顺序抽取段落（<p>）的 start/end ref。
 * 注意：fast-xml-parser 的对象模型会丢失同级节点顺序，因此锚点必须基于原始 XML 顺序扫描。
 */
export function extractParagraphAnchorSpans(xml: string): Map<string, AnchorSpan> {
  const map = new Map<string, AnchorSpan>();
  let pb: string | undefined;
  let lastRef: string | undefined;
  let openXmlId: string | undefined;
  let openStart: string | undefined;

  const tagRe = /<[^>]+>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(xml))) {
    const tag = m[0];

    // <pb n="0001" .../>
    if (tag.startsWith("<pb")) {
      const n = tag.match(/\bn=\"([^\"]+)\"/)?.[1];
      if (n) pb = n;
      continue;
    }

    // <lb n="a01" .../>  or <lb n="0001a01" .../>
    if (tag.startsWith("<lb")) {
      const n = tag.match(/\bn=\"([^\"]+)\"/)?.[1];
      if (n) {
        const ref = normalizeRef(n, pb);
        if (ref) lastRef = ref;
      }
      continue;
    }

    // <p ... xml:id="..."> or self closing
    if (tag.startsWith("<p")) {
      const xmlId = tag.match(/\bxml:id=\"([^\"]+)\"/)?.[1];
      if (!xmlId) continue;
      const selfClosing = tag.endsWith("/>");
      const start = lastRef;
      if (selfClosing) {
        map.set(xmlId, { startRef: start, endRef: start });
      } else {
        openXmlId = xmlId;
        openStart = start;
      }
      continue;
    }

    if (tag.startsWith("</p")) {
      if (openXmlId) {
        map.set(openXmlId, { startRef: openStart, endRef: lastRef ?? openStart });
      }
      openXmlId = undefined;
      openStart = undefined;
      continue;
    }
  }

  return map;
}

function collectText(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (typeof node === "object") {
    return collectTextFromObject(node as Record<string, unknown>);
  }
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

/** inline 且子树无文本的空锚点 <p>（音义类页码标记） */
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

function walkBody(
  body: unknown,
  chapterSeq: number,
  out: ParsedParagraph[],
  seqRef: { n: number },
  anchorSpans: Map<string, AnchorSpan>,
) {
  if (!body || typeof body !== "object") return;
  const b = body as Record<string, unknown>;

  for (const key of Object.keys(b)) {
    if (key.startsWith("@_")) continue;
    const val = b[key];
    if (key === "head" || key === "trailer" || key === "note") {
      continue;
    }
    if (key === "p") {
      const items = Array.isArray(val) ? val : [val];
      for (const item of items) {
        const itemObj = item && typeof item === "object" ? (item as Record<string, unknown>) : undefined;
        const xmlId = itemObj?.["@_xml:id"];
        const span = typeof xmlId === "string" ? anchorSpans.get(xmlId) : undefined;

        const text = collectText(item).replace(/\s+/g, "");
        if (text.length > 0) {
          seqRef.n += 1;
          out.push({
            chapterSeq,
            seq: seqRef.n,
            text,
            startRef: span?.startRef,
            endRef: span?.endRef,
            xmlId: typeof xmlId === "string" ? xmlId : undefined,
          });
        }
      }
    } else if (key === "lg") {
      const items = Array.isArray(val) ? val : [val];
      for (const lg of items) {
        const rows = (lg as Record<string, unknown>)?.row;
        const rowList = rows ? (Array.isArray(rows) ? rows : [rows]) : [];
        for (const row of rowList) {
          const text = collectText(row).replace(/\s+/g, "");
          if (text.length > 0) {
            seqRef.n += 1;
            out.push({
              chapterSeq,
              seq: seqRef.n,
              text,
            });
          }
        }
      }
    } else if (typeof val === "object") {
      walkBody(val, chapterSeq, out, seqRef, anchorSpans);
    }
  }
}

export type ParseCbetaOptions = {
  stripPreface?: boolean;
};

function teiAttr(obj: Record<string, unknown>, name: string): string | undefined {
  const v = obj[`@_${name}`] ?? obj[`@_xml:${name}`];
  return typeof v === "string" ? v : undefined;
}

function listTeiTitles(titleStmt: unknown): Record<string, unknown>[] {
  if (!titleStmt || typeof titleStmt !== "object") return [];
  const raw = (titleStmt as Record<string, unknown>).title;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null);
  }
  if (typeof raw === "object") return [raw as Record<string, unknown>];
  if (typeof raw === "string") return [{ "#text": raw }];
  return [];
}

/** CBETA 丛书/版权类长标题，不应作为经名 */
function isCatalogTitleText(text: string): boolean {
  return /Electronic version|數位版|Taishō Tripiṭaka|大正新脩大藏經(?:數位版)?(?:,|$)/.test(text);
}

function isLicenseBoilerplate(text: string): boolean {
  return /non-commercial|copyright|Available for/i.test(text);
}

/**
 * 从 titleStmt 抽取经名：优先 level="m" 且 xml:lang="zh-Hant"，避免拼接全部 title。
 */
export function extractTeiTitle(titleStmt: unknown, fallback: string): string {
  const items = listTeiTitles(titleStmt);
  if (items.length === 0) return fallback;

  const pick = (pred: (obj: Record<string, unknown>, text: string) => boolean): string | undefined => {
    for (const obj of items) {
      const text = collectText(obj).trim();
      if (!text || isCatalogTitleText(text)) continue;
      if (pred(obj, text)) return text;
    }
    return undefined;
  };

  let title = pick((obj) => {
    const level = teiAttr(obj, "level");
    const lang = teiAttr(obj, "xml:lang") ?? teiAttr(obj, "lang");
    return level === "m" && (lang === "zh-Hant" || lang === "zh-TW" || !lang);
  });
  if (title) return title;

  title = pick((obj) => teiAttr(obj, "level") === "m");
  if (title) return title;

  title = pick((obj) => {
    const level = teiAttr(obj, "level");
    const lang = teiAttr(obj, "xml:lang") ?? teiAttr(obj, "lang");
    return level !== "s" && (lang === "zh-Hant" || lang === "zh-TW");
  });
  if (title) return title;

  if (items.length === 1) {
    const text = collectText(items[0]).trim();
    if (text && !isCatalogTitleText(text)) return text;
  }

  const candidates = items
    .map((obj) => collectText(obj).trim())
    .filter((text) => text && !isCatalogTitleText(text));
  if (candidates.length === 0) return fallback;
  return candidates.reduce((a, b) => (a.length <= b.length ? a : b));
}

/** 译者/作者：优先 titleStmt/author，其次 publicationStmt 中的译撰信息 */
export function extractTeiTranslator(titleStmt: unknown, publicationStmt: unknown): string | undefined {
  if (titleStmt && typeof titleStmt === "object") {
    const author = collectText((titleStmt as Record<string, unknown>).author).trim();
    if (author) return author;
  }
  if (!publicationStmt || typeof publicationStmt !== "object") return undefined;
  const ps = publicationStmt as Record<string, unknown>;
  for (const node of [ps.p, ps.byline]) {
    const text = collectText(node).trim();
    if (!text || isLicenseBoilerplate(text)) continue;
    if (/[譯撰著造編註注]/.test(text)) return text;
  }
  return undefined;
}

export function parseCbetaFile(
  xml: string,
  cbetaId: string,
  options: ParseCbetaOptions = {},
): ParsedSutra {
  const doc = parser.parse(xml);
  const tei = doc.TEI ?? doc.tei ?? doc;
  const teiHeader = tei.teiHeader ?? tei.TEIHeader;
  const fileDesc = teiHeader?.fileDesc;
  const titleStmt = fileDesc?.titleStmt;
  const title = extractTeiTitle(titleStmt, cbetaId);

  const publicationStmt = fileDesc?.publicationStmt;
  const byline = extractTeiTranslator(titleStmt, publicationStmt);

  const text = tei.text ?? tei.TEXT;
  const body = text?.body ?? text?.BODY;
  const paragraphs: ParsedParagraph[] = [];
  const seqRef = { n: 0 };
  const anchorSpans = extractParagraphAnchorSpans(xml);
  walkBody(body, 0, paragraphs, seqRef, anchorSpans);

  const stripPreface = options.stripPreface ?? true;
  const filtered = filterPrefaceParagraphs(paragraphs, cbetaId, stripPreface);

  return {
    cbetaId,
    title: title || cbetaId,
    translator: byline || undefined,
    paragraphs: filtered,
  };
}
