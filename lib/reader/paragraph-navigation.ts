/**
 * 阅读器段落导航纯函数（hash、分卷 URL、滚动）
 * @author 代长亚
 */
import type { ParagraphRow } from "@/lib/sutra/queries";

const PARAGRAPH_HASH_RE = /^#p-(\d+)$/;

export function parseParagraphHash(hash: string): number | null {
  const match = PARAGRAPH_HASH_RE.exec(hash.trim());
  if (!match) return null;
  const seq = Number.parseInt(match[1], 10);
  return Number.isFinite(seq) && seq >= 0 ? seq : null;
}

export function buildParagraphHash(seq: number): string {
  return `#p-${seq}`;
}

export function buildChapterHref(slug: string, chapterSeq: number): string {
  if (chapterSeq === 0) return `/sutra/${slug}`;
  return `/sutra/${slug}?chapter=${chapterSeq}`;
}

export function findParagraphBySeq(
  paragraphs: ParagraphRow[],
  seq: number,
): ParagraphRow | undefined {
  return paragraphs.find((p) => p.seq === seq);
}

export function scrollToParagraphElement(
  seq: number,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition },
): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(`p-${seq}`);
  if (!el) return null;
  el.scrollIntoView({
    behavior: options?.behavior ?? "smooth",
    block: options?.block ?? "start",
  });
  return el;
}

export function navigateToParagraph(
  paragraphs: ParagraphRow[],
  seq: number,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition },
): string | undefined {
  const paragraph = findParagraphBySeq(paragraphs, seq);
  if (!paragraph) return undefined;
  scrollToParagraphElement(seq, options);
  return paragraph.id;
}
