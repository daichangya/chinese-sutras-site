/**
 * 剥离 CBETA 经前序文、帝王跋等非正文段落
 * @author 代长亚
 */
import type { ParsedParagraph } from "./parser";
import { BODY_START_ANCHORS, PREFACE_MARKERS } from "./preface-filter-anchors";

export function filterPrefaceParagraphs(
  paragraphs: ParsedParagraph[],
  cbetaId: string,
  stripPreface: boolean,
): ParsedParagraph[] {
  if (!stripPreface || paragraphs.length === 0) return paragraphs;

  const anchor = BODY_START_ANCHORS[cbetaId];
  if (anchor) {
    const idx = paragraphs.findIndex((p) => p.text.includes(anchor));
    if (idx > 0) {
      const sliced = paragraphs.slice(idx);
      return renumberParagraphs(sliced);
    }
  }

  const filtered = paragraphs.filter((p) => !PREFACE_MARKERS.some((m) => p.text.includes(m)));
  if (filtered.length === paragraphs.length) return paragraphs;
  return renumberParagraphs(filtered);
}

function renumberParagraphs(paragraphs: ParsedParagraph[]): ParsedParagraph[] {
  return paragraphs.map((p, i) => ({
    ...p,
    seq: i + 1,
  }));
}
