/**
 * 抄经文本工具测试
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import {
  COPYBOOK_CHAR_LIMIT,
  extractHanChars,
  mergeParagraphTexts,
  truncateHan,
} from "@/components/copybook/text-utils";

describe("extractHanChars", () => {
  it("保留汉字并去掉标点与空白", () => {
    expect(extractHanChars("观自在菩萨，行深般若。")).toBe("观自在菩萨行深般若");
  });

  it("空字符串返回空", () => {
    expect(extractHanChars("  ，。 ")).toBe("");
  });
});

describe("truncateHan", () => {
  it("未超限时不截断", () => {
    const text = "abcdef";
    expect(truncateHan(text, 10)).toEqual({
      text,
      truncated: false,
      originalCount: 6,
    });
  });

  it("超限时截断并标记", () => {
    const text = "一二三四五";
    const result = truncateHan(text, 3);
    expect(result.text).toBe("一二三");
    expect(result.truncated).toBe(true);
    expect(result.originalCount).toBe(5);
  });

  it("默认上限为 2000", () => {
    expect(COPYBOOK_CHAR_LIMIT).toBe(2000);
  });
});

describe("mergeParagraphTexts", () => {
  it("仅合并选中段落", () => {
    const paragraphs = [
      { id: "a", text: "第一句。" },
      { id: "b", text: "第二句。" },
      { id: "c", text: "第三句。" },
    ];
    expect(mergeParagraphTexts(paragraphs, new Set(["a", "c"]))).toBe(
      "第一句。第三句。",
    );
  });
});
