/**
 * 阅读器正文划选工具测试
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { isNodeInReaderContent } from "@/lib/reader/reader-selection";

describe("isNodeInReaderContent", () => {
  it("returns false when node is null", () => {
    expect(isNodeInReaderContent(null)).toBe(false);
  });
});
