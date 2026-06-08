import { describe, it, expect } from "vitest";
import { retrieveRagContext } from "@/lib/ai/rag-retrieval";

describe("retrieveRagContext", () => {
  it("returns empty context for blank query", () => {
    const result = retrieveRagContext("");
    expect(result.citations).toEqual([]);
    expect(result.contextText).toBe("");
  });

  it("accepts sutra context without throwing", () => {
    const result = retrieveRagContext("什么是空", {
      sutraTitle: "心经",
      contextText: "色即是空",
      limit: 3,
    });
    expect(Array.isArray(result.citations)).toBe(true);
  });
});
