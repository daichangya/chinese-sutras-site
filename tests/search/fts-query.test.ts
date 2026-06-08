import { describe, it, expect } from "vitest";
import {
  buildParagraphFtsQuery,
  buildSutraFtsQuery,
} from "@/lib/search/fts-query";

describe("fts-query", () => {
  it("builds CJK prefix OR query for sutra FTS", () => {
    expect(buildSutraFtsQuery("金刚经")).toBe("金* OR 刚* OR 经*");
  });

  it("builds phrase query for contiguous CJK", () => {
    expect(buildParagraphFtsQuery("金刚经")).toBe('"金刚经"');
  });

  it("strips punctuation from queries", () => {
    expect(buildSutraFtsQuery("《金刚经》")).toBe("金* OR 刚* OR 经*");
  });

  it("returns null for blank", () => {
    expect(buildSutraFtsQuery("   ")).toBeNull();
  });
});
