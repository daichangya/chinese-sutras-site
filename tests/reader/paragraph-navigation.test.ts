import { describe, expect, it } from "vitest";
import {
  buildChapterHref,
  buildParagraphHash,
  findParagraphBySeq,
  navigateToParagraph,
  parseParagraphHash,
  scrollToParagraphElement,
} from "@/lib/reader/paragraph-navigation";
import type { ParagraphRow } from "@/lib/sutra/queries";

const sampleParagraphs: ParagraphRow[] = [
  {
    id: "p1",
    sutraId: "s1",
    chapterSeq: 0,
    seq: 1,
    text: "观自在菩萨",
    colloquial: null,
    blockRole: "body",
  },
  {
    id: "p2",
    sutraId: "s1",
    chapterSeq: 0,
    seq: 5,
    text: "色不异空",
    colloquial: null,
    blockRole: "body",
  },
];

describe("paragraph-navigation", () => {
  it("parses paragraph hash", () => {
    expect(parseParagraphHash("#p-1")).toBe(1);
    expect(parseParagraphHash("#p-5")).toBe(5);
    expect(parseParagraphHash("")).toBeNull();
    expect(parseParagraphHash("#section-1")).toBeNull();
  });

  it("builds paragraph hash and chapter href", () => {
    expect(buildParagraphHash(3)).toBe("#p-3");
    expect(buildChapterHref("xinjing", 0)).toBe("/sutra/xinjing");
    expect(buildChapterHref("xinjing", 2)).toBe("/sutra/xinjing?chapter=2");
  });

  it("finds paragraph by seq", () => {
    expect(findParagraphBySeq(sampleParagraphs, 5)?.id).toBe("p2");
    expect(findParagraphBySeq(sampleParagraphs, 99)).toBeUndefined();
  });

  it("scrollToParagraphElement returns null without DOM target", () => {
    expect(scrollToParagraphElement(99)).toBeNull();
  });

  it("navigateToParagraph returns paragraph id without scrolling when element missing", () => {
    expect(navigateToParagraph(sampleParagraphs, 1)).toBe("p1");
    expect(navigateToParagraph(sampleParagraphs, 99)).toBeUndefined();
  });
});
