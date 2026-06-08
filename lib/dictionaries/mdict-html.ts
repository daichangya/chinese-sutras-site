/**
 * MDict HTML 释义处理（剥离纯文本、重写插图路径）
 * @author 代长亚
 */
import type { DictionaryEntryRecord } from "./types";
import { toSimplifiedZh } from "@/lib/han/storage-normalize";
import { normalizeMdxImageSrc } from "./mdict-paths";

const IMG_SRC_RE = /<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
const ENTRY_LINK_RE = /<a\b[^>]*\bhref=["']entry:\/\/([^"']+)["'][^>]*>/gi;
const CORPUS_ASSET_SRC_RE = /(["'])assets\/FGDCDZDB\/([^"']+)\1/gi;
const DUPLICATE_TITLE_RE =
  /^(?:\s|<(?:html|body)[^>]*>)*\s*<span[^>]*>[\s\S]*?<\/span>\s*<hr[^>]*>\s*/i;

const FOGUANG_ASSET_BASE = "/api/dictionary/assets/foguang/FGDCDZDB";

const INVISIBLE_PREFIX = /^[\uFEFF\uFFFE\u200B]+/;

/** 去掉 MDX 释义开头的 BOM / 零宽字符（U+FEFF 等） */
export function stripMdictBom(text: string): string {
  return text.replace(INVISIBLE_PREFIX, "");
}

/** 解码常见 HTML 实体（含数字实体） */
export function decodeHtmlEntities(text: string): string {
  let s = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  s = s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return s;
}

/** 剥离 HTML 标签，产出 FTS 用纯文本 */
export function stripMdictHtml(html: string): string {
  if (!html) return "";
  let s = html.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, "");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeHtmlEntities(s);
  const lines = s.split("\n").map((line) => line.trim()).filter(Boolean);
  return stripMdictBom(lines.join("\n").trim());
}

export type RewriteMdictImagesOptions = {
  /** 语料内相对路径前缀，默认 assets/FGDCDZDB */
  assetBase?: string;
  /** 已知存在的 asset 相对路径集合（如 assets/FGDCDZDB/x.jpg） */
  knownAssets?: Set<string>;
  onMissing?: (src: string, resolved: string) => void;
};

/** 将 MDX 内 /FGDCDZDB/… 重写为语料相对路径；缺失资源时移除 img */
export function rewriteMdictImages(html: string, opts: RewriteMdictImagesOptions = {}): string {
  const known = opts.knownAssets;
  return html.replace(IMG_SRC_RE, (full, src: string) => {
    const resolved = normalizeMdxImageSrc(src);
    if (known && !known.has(resolved)) {
      opts.onMissing?.(src, resolved);
      return "";
    }
    return full.replace(src, resolved);
  });
}

/** 简化 HTML：仅保留常用块级/插图标签（阶段 A 真相源存储） */
export function sanitizeDefinitionHtml(html: string): string {
  return html.replace(/<\/?(?!br|hr|img|span|p|div|li|tr|td|th|table|tbody|thead|font|b|i|u|strong|em|a)\w+[^>]*>/gi, "");
}

/** 去掉外层 html/body 包裹 */
function stripOuterHtmlWrapper(html: string): string {
  return html
    .replace(/^\s*<html[^>]*>\s*<body[^>]*>/i, "")
    .replace(/<\/body>\s*<\/html>\s*$/i, "")
    .trim();
}

/** entry:// 内链 → 辞典页查询 */
export function rewriteMdictEntryLinks(html: string): string {
  return html.replace(ENTRY_LINK_RE, (_full, headword: string) => {
    const q = encodeURIComponent(headword.trim());
    return `<a href="/dictionary?q=${q}">`;
  });
}

/** 语料相对路径 assets/FGDCDZDB/… → API 可访问 URL */
export function rewriteMdictAssetUrlsForApi(html: string, source = "foguang"): string {
  const base = `/api/dictionary/assets/${source}/FGDCDZDB`;
  return html.replace(CORPUS_ASSET_SRC_RE, (_m, quote: string, file: string) => {
    return `${quote}${base}/${file}${quote}`;
  });
}

/** 去掉与卡片标题重复的 MDict 大号标题 + hr */
export function stripDuplicateDefinitionTitle(html: string): string {
  return html.replace(DUPLICATE_TITLE_RE, "");
}

/**
 * 佛光大辞典 definition_html 入库/展示前预处理
 * @author 代长亚
 */
export function prepareFoguangDefinitionHtml(html: string, _headword?: string): string {
  if (!html) return "";
  let s = stripMdictBom(html);
  s = stripOuterHtmlWrapper(s);
  s = stripDuplicateDefinitionTitle(s);
  s = rewriteMdictEntryLinks(s);
  s = rewriteMdictAssetUrlsForApi(s);
  s = toSimplifiedZh(s);
  s = sanitizeDefinitionHtml(s);
  return s.trim();
}

/** foguang 词条 entry_data 预处理（SQLite 导入用） */
export function prepareFoguangEntryForStorage(entry: DictionaryEntryRecord): DictionaryEntryRecord {
  const raw = entry.entry_data?.definition_html;
  if (typeof raw !== "string" || !raw.trim()) return entry;
  const definition_html = prepareFoguangDefinitionHtml(raw, entry.headword);
  return {
    ...entry,
    entry_data: {
      ...entry.entry_data,
      definition_html,
    },
  };
}
