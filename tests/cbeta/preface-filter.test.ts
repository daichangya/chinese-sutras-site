/**
 * 序文剥离
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import { filterPrefaceParagraphs } from "@/lib/cbeta/preface-filter";

describe("filterPrefaceParagraphs", () => {
  it("strips Ming preface before 觀自在菩薩 anchor for xinjing", () => {
    const paragraphs = [
      { chapterSeq: 0, seq: 1, text: "朕特述此，使聰明者觀二儀之覆載" },
      { chapterSeq: 0, seq: 2, text: "夫法性無邊，豈藉心之所度" },
      { chapterSeq: 0, seq: 3, text: "觀自在菩薩行深般若波羅蜜多時" },
    ];
    const out = filterPrefaceParagraphs(paragraphs, "T08n0251", true);
    expect(out[0].text).toContain("觀自在菩薩");
    expect(out.some((p) => p.text.includes("朕特述此"))).toBe(false);
    expect(out[0].seq).toBe(1);
  });

  it("keeps all when strip disabled", () => {
    const paragraphs = [
      { chapterSeq: 0, seq: 1, text: "朕特述此" },
      { chapterSeq: 0, seq: 2, text: "觀自在菩薩" },
    ];
    const out = filterPrefaceParagraphs(paragraphs, "T08n0251", false);
    expect(out).toHaveLength(2);
  });
});
