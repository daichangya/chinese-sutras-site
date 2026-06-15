/**
 * 朗读文本规范化测试
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  buildSpeechQueue,
  getParagraphDisplayText,
  normalizeSpeechText,
  splitSpeechChunks,
} from "@/lib/reader/speech/text-normalizer";
import type { ParagraphRow } from "@/lib/sutra/queries";

const baseParagraph = (overrides: Partial<ParagraphRow> = {}): ParagraphRow => ({
  id: "p1",
  sutraId: "s1",
  chapterSeq: 1,
  seq: 1,
  text: "观自在菩萨[CB12345]行深般若波罗蜜多时。",
  colloquial: "观音菩萨深入智慧时。",
  blockRole: "body",
  ...overrides,
});

describe("normalizeSpeechText", () => {
  it("strips gaiji markers", () => {
    expect(normalizeSpeechText("观自在菩萨[CB12345]行深。")).toBe("观自在菩萨行深。");
    expect(normalizeSpeechText("缺字□测试〓")).toBe("缺字测试");
  });
});

describe("getParagraphDisplayText", () => {
  it("follows vernacular view", () => {
    const p = baseParagraph();
    expect(
      getParagraphDisplayText(p, {
        vernacular: true,
        showTraditional: false,
        traditionalTexts: {},
      }),
    ).toBe("观音菩萨深入智慧时。");
  });

  it("returns empty when vernacular missing", () => {
    const p = baseParagraph({ colloquial: null });
    expect(
      getParagraphDisplayText(p, {
        vernacular: true,
        showTraditional: false,
        traditionalTexts: {},
      }),
    ).toBe("");
  });

  it("uses traditional cache", () => {
    const p = baseParagraph();
    expect(
      getParagraphDisplayText(p, {
        vernacular: false,
        showTraditional: true,
        traditionalTexts: { p1: "觀自在菩薩行深。" },
      }),
    ).toBe("觀自在菩薩行深。");
  });
});

describe("splitSpeechChunks", () => {
  it("splits long text", () => {
    const long = "。".repeat(400);
    const chunks = splitSpeechChunks(long, 300);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toBe(long);
  });
});

describe("buildSpeechQueue", () => {
  it("builds continuous queue from start paragraph", () => {
    const paragraphs = [
      baseParagraph({ id: "p1", seq: 1 }),
      baseParagraph({ id: "p2", seq: 2, text: "第二段。" }),
    ];
    const queue = buildSpeechQueue(paragraphs, "p2", {
      vernacular: false,
      showTraditional: false,
      traditionalTexts: {},
    });
    expect(queue).toHaveLength(1);
    expect(queue[0]?.paragraphId).toBe("p2");
  });

  it("skips empty vernacular paragraphs", () => {
    const paragraphs = [
      baseParagraph({ id: "p1", colloquial: null }),
      baseParagraph({ id: "p2", seq: 2, text: "有内容。" }),
    ];
    const queue = buildSpeechQueue(paragraphs, "p1", {
      vernacular: true,
      showTraditional: false,
      traditionalTexts: {},
    });
    expect(queue).toHaveLength(1);
    expect(queue[0]?.paragraphId).toBe("p2");
  });
});
