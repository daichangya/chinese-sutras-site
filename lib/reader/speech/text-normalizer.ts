/**
 * 朗读文本规范化（跟随阅读视图）
 * @author 代长亚
 */
import type { ParagraphRow } from "@/lib/sutra/queries";
import type { SpeechSegment } from "@/lib/reader/speech/types";

const GAIJI_PATTERN = /\[?CB\d{5}\]?|□|〓/g;
const MAX_CHUNK_LEN = 300;

export type SpeechViewContext = {
  vernacular: boolean;
  showTraditional: boolean;
  traditionalTexts: Record<string, string>;
};

export function getParagraphDisplayText(p: ParagraphRow, ctx: SpeechViewContext): string {
  if (ctx.vernacular) {
    if (!p.colloquial?.trim()) return "";
    const raw = p.colloquial;
    if (ctx.showTraditional) return ctx.traditionalTexts[p.id] ?? raw;
    return raw;
  }
  const raw = p.text;
  if (ctx.showTraditional) return ctx.traditionalTexts[p.id] ?? raw;
  return raw;
}

export function normalizeSpeechText(text: string): string {
  return text
    .replace(GAIJI_PATTERN, "")
    .replace(/\s+/g, "")
    .trim();
}

/** 按标点切分超长段，便于 Web Speech 稳定朗读 */
export function splitSpeechChunks(text: string, maxLen = MAX_CHUNK_LEN): string[] {
  if (text.length <= maxLen) return text ? [text] : [];

  const chunks: string[] = [];
  let buffer = "";

  for (const char of text) {
    buffer += char;
    const atBoundary = /[。！？；，、：]/.test(char);
    if (buffer.length >= maxLen && atBoundary) {
      chunks.push(buffer);
      buffer = "";
    }
  }
  if (buffer) chunks.push(buffer);

  if (chunks.length === 0) {
    for (let i = 0; i < text.length; i += maxLen) {
      chunks.push(text.slice(i, i + maxLen));
    }
  }

  return chunks;
}

export function buildSpeechQueue(
  paragraphs: ParagraphRow[],
  startParagraphId: string | undefined,
  ctx: SpeechViewContext,
): SpeechSegment[] {
  const startIdx = Math.max(
    0,
    paragraphs.findIndex((p) => p.id === startParagraphId),
  );
  const slice = startIdx >= 0 ? paragraphs.slice(startIdx) : paragraphs;
  const segments: SpeechSegment[] = [];

  for (const p of slice) {
    const display = getParagraphDisplayText(p, ctx);
    const normalized = normalizeSpeechText(display);
    if (!normalized) continue;

    const chunks = splitSpeechChunks(normalized);
    chunks.forEach((text, chunkIndex) => {
      segments.push({
        paragraphId: p.id,
        seq: p.seq,
        text,
        chunkIndex,
        chunkTotal: chunks.length,
      });
    });
  }

  return segments;
}
