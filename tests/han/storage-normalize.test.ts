/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  normalizeDictionaryEntryForStorage,
  normalizeKgEntityForStorage,
  normalizeUserZhQuery,
  toSimplifiedZh,
} from "@/lib/han/storage-normalize";

describe("storage-normalize", () => {
  it("toSimplifiedZh converts traditional characters", () => {
    expect(toSimplifiedZh("舍衛國")).toBe("舍卫国");
  });

  it("normalizeDictionaryEntryForStorage simplifies zh fields", () => {
    const out = normalizeDictionaryEntryForStorage({
      id: "x:1",
      source: "test",
      headword: "觀音",
      definition: "佛國土",
      lang: "zh",
    });
    expect(out.headword).toBe("观音");
    expect(out.definition).toBe("佛国土");
  });

  it("normalizeKgEntityForStorage simplifies name_zh", () => {
    const out = normalizeKgEntityForStorage({
      id: "kg:person:1",
      entity_type: "person",
      name_zh: "玄奘",
      source_tier: "authoritative",
      source: "test",
    });
    expect(out.name_zh).toBe("玄奘");
  });

  it("normalizeKgEntityForStorage simplifies properties.description", () => {
    const out = normalizeKgEntityForStorage({
      id: "kg:person:dila:A000294",
      entity_type: "person",
      name_zh: "玄奘",
      source_tier: "authoritative",
      source: "dila_lod",
      properties: {
        description: "俗姓陳，唯識宗創始人",
        dynasty: "唐",
      },
    });
    expect(out.properties?.description).toBe("俗姓陈，唯识宗创始人");
    expect(out.properties?.dynasty).toBe("唐");
  });

  it("normalizeUserZhQuery matches storage normalization", () => {
    expect(normalizeUserZhQuery(" 觀音 ")).toBe("观音");
  });
});
