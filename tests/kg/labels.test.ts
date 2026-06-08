/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { labelPredicate, labelProperty, labelType } from "@/lib/kg/labels";

describe("labels", () => {
  it("localizes predicates", () => {
    expect(labelPredicate("teacher_of")).toBe("师承");
    expect(labelPredicate("translated")).toBe("翻译");
  });

  it("localizes properties", () => {
    expect(labelProperty("birth_year")).toBe("生年");
    expect(labelProperty("dynasty")).toBe("朝代");
  });

  it("localizes entity types", () => {
    expect(labelType("person")).toBe("人物");
    expect(labelType("text")).toBe("典籍");
  });
});
