/**
 * 剥离 CBETA 经前序文、帝王跋等非正文段落
 * @author 代长亚
 */
import type { ParsedParagraph } from "./parser";

const PREFACE_MARKERS = ["朕特述此", "二儀久判", "夫法性無邊，豈藉心之所度"];

/** 各经正文起始锚点（cbeta_id → 首段应含子串） */
const BODY_START_ANCHORS: Record<string, string> = {
  T01n0001: "如是我聞",
  T08n0251: "觀自在菩薩",
  T08n0235: "如是我聞",
  T12n0366: "如是我聞",
  T13n0412: "如是我聞",
};

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
