/**
 * 段落角色推断
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { inferBlockRolesForParagraphs } from "@/lib/corpus-v3/infer-block-role";

describe("inferBlockRolesForParagraphs", () => {
  it("marks paragraphs before 觀自在菩薩 anchor as preface for xinjing", () => {
    const paragraphs = [
      { text: "二儀久判，万物备周" },
      { text: "夫法性無邊，豈藉心之所度" },
      { text: "觀自在菩薩行深般若波羅蜜多時" },
      { text: "舍利子！色不异空" },
    ];
    const roles = inferBlockRolesForParagraphs(paragraphs, "T08n0251");
    expect(roles).toEqual(["preface", "preface", "body", "body"]);
  });

  it("respects explicit block_role from index", () => {
    const paragraphs = [
      { text: "序文", blockRole: "preface" as const },
      { text: "正文", blockRole: "body" as const },
    ];
    const roles = inferBlockRolesForParagraphs(paragraphs, "T08n0251");
    expect(roles).toEqual(["preface", "body"]);
  });
});
