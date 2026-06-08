/**
 * 辞典相关性排序
 * @author 代长亚
 */
import { describe, it, expect } from "vitest";
import {
  relevanceScore,
  sortByRelevance,
  zhQueryVariants,
} from "@/lib/dictionaries/lookup-rank";

describe("lookup-rank", () => {
  it("ranks exact headword above prefix and substring", () => {
    const variants = zhQueryVariants("般若");
    expect(relevanceScore("般若", variants)).toBe(3);
    expect(relevanceScore("般若波罗蜜", variants)).toBe(2);
    expect(relevanceScore("妙般若", variants)).toBe(1);
  });

  it("sorts 般若 before 般若波罗蜜", () => {
    const variants = zhQueryVariants("般若");
    const sorted = sortByRelevance(
      [
        { headword: "般若波罗蜜" },
        { headword: "般若" },
        { headword: "妙般若心" },
      ],
      variants,
    );
    expect(sorted.map((r) => r.headword)).toEqual(["般若", "般若波罗蜜", "妙般若心"]);
  });

  it("includes simplified variant for traditional query", () => {
    const variants = zhQueryVariants("觀音");
    expect(variants).toContain("观音");
  });
});
