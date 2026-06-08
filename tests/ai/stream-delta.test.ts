/**
 * 流式 SSE delta 解析测试
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { extractStreamDelta } from "@/lib/ai/gateway";

describe("extractStreamDelta", () => {
  it("parses internal jingxin SSE format", () => {
    expect(extractStreamDelta({ delta: "你好", done: false })).toBe("你好");
  });

  it("parses OpenAI-compatible streaming chunks", () => {
    expect(
      extractStreamDelta({
        choices: [{ index: 0, delta: { role: "assistant", content: "您好" } }],
      }),
    ).toBe("您好");
  });

  it("returns empty for done-only or malformed payloads", () => {
    expect(extractStreamDelta({ delta: "", done: true })).toBe("");
    expect(extractStreamDelta(null)).toBe("");
    expect(extractStreamDelta({ choices: [{ delta: {} }] })).toBe("");
  });
});
