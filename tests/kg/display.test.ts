/**
 * KG 展示格式化
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { entityBioText, entityDescription } from "@/lib/kg/display";

describe("entityBioText", () => {
  it("returns full description without truncation", () => {
    const bio = "俗姓陈，大慈恩寺僧人，唯识宗创始人。";
    expect(entityBioText({ description: bio })).toBe(bio);
  });

  it("prefers description over summary", () => {
    expect(
      entityBioText({ description: "简介", summary: "摘要" }),
    ).toBe("简介");
  });
});

describe("entityDescription", () => {
  it("truncates long text for list previews", () => {
    const long = "a".repeat(150);
    expect(entityDescription({ description: long }, 120)?.endsWith("…")).toBe(true);
  });
});
