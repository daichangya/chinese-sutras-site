/**
 * 经目目录消歧标签：物理卷号 / 会名 / 录文 / 紧凑经号（n0073b）
 * @author jingxin
 */
import { toSimplifiedLabel } from "./sutra-labels";

const INVALID_DIR_CHARS = /[/\\:*?"<>|]/g;
const SNIPPET_LEN = 64_000;
const LUWEN_RE = /[录錄]文[一二三四五六七八九十百千\d]+/;
const JUAN_N_RE = /<cb:juan[^>]*\sn="(\d+)"/g;

function sanitizeDisambLabel(label: string): string | undefined {
  const s = label.replace(INVALID_DIR_CHARS, "_").replace(/\s+/g, "").trim();
  if (!s) return undefined;
  return s.length > 16 ? s.slice(0, 16) : s;
}

function stripXmlTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, "").trim();
}

/** cbeta 经目末尾变体字母（T08n0236a → a） */
export function cbetaVariantLetter(cbetaId: string): string | undefined {
  const m = cbetaId.match(/n\d+([A-Za-z])$/i);
  return m ? m[1]!.toLowerCase() : undefined;
}

/** T25n1510b → n1510b；无字母变体则 undefined */
export function compactCbetaVariantSuffix(cbetaId: string): string | undefined {
  const letter = cbetaVariantLetter(cbetaId);
  if (!letter) return undefined;
  const m = cbetaId.match(/n(\d+)[A-Za-z]$/i);
  if (!m) return undefined;
  return `n${m[1]}${letter}`;
}

/** 从 cb:juan n 属性提取物理卷号范围（如 第577卷、第579-583卷） */
export function extractJuanRangeLabelFromXml(xml: string): string | undefined {
  const nums: number[] = [];
  const re = new RegExp(JUAN_N_RE.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    nums.push(parseInt(m[1]!, 10));
  }
  if (nums.length === 0) return undefined;

  const min = Math.min(...nums);
  const max = Math.max(...nums);
  /** 排除普通经目 n="001" 单卷；大般若等用 >=100 或跨卷范围 */
  if (max <= min && min < 100) return undefined;

  const label = max === min ? `第${min}卷` : `第${min}-${max}卷`;
  return sanitizeDisambLabel(toSimplifiedLabel(label) ?? label);
}

function normalizeHuiTitle(label: string): string {
  return label.replace(/第([一二三四五六七八九十百千\d]+)[会會]/, "第$1");
}

/** 从首个 cb:div type="hui" 的 head 提取会/品名 */
export function extractHuiTitleFromXml(xml: string): string | undefined {
  const snippet = xml.slice(0, SNIPPET_LEN);
  const huiMatch = snippet.match(
    /<cb:div[^>]*\btype="hui"[^>]*>[\s\S]*?<head>([\s\S]*?)<\/head>/,
  );
  if (!huiMatch) return undefined;

  const raw = stripXmlTags(huiMatch[1]!);
  if (!raw || raw === "序") return undefined;

  const cleaned = raw.replace(/^大般若[经經]?/, "").trim();
  if (!cleaned) return undefined;

  const simplified = toSimplifiedLabel(cleaned) ?? cleaned;
  return sanitizeDisambLabel(normalizeHuiTitle(simplified));
}

function extractLuwenLabelFromXml(snippet: string): string | undefined {
  const mulu = snippet.match(/<cb:mulu[^>]*>([^<]+)<\/cb:mulu>/);
  const head = snippet.match(/<head[^>]*>([^<]+)<\/head>/);
  const raw = (mulu?.[1] ?? head?.[1])?.trim();
  if (!raw) return undefined;

  const inner = raw.replace(/^[〔【\[\(]+|[〕】\]\)]+$/g, "").trim();
  const luwen = inner.match(LUWEN_RE);
  if (!luwen) return undefined;

  const label = luwen[0]!;
  return sanitizeDisambLabel(toSimplifiedLabel(label) ?? label);
}

/**
 * 目录消歧标签，优先级：物理卷号 → 会名 → 录文
 * 无结果时由 sutra-dir-name 用 compactCbetaVariantSuffix 兜底
 */
export function extractDirDisambiguatorFromXml(xml: string): string | undefined {
  return (
    extractJuanRangeLabelFromXml(xml) ??
    extractHuiTitleFromXml(xml) ??
    extractLuwenLabelFromXml(xml.slice(0, SNIPPET_LEN))
  );
}
