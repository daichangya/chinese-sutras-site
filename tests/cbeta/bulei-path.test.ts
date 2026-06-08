import { describe, expect, it } from "vitest";
import { buleiGroupDirName, stripBuleiPathNoise } from "@/lib/cbeta/bulei-path";

describe("bulei-path", () => {
  it("strips CBETA entities", () => {
    expect(stripBuleiPathNoise("佛開解梵志阿&CB02664;經")).toBe("佛開解梵志阿經");
  });

  it("replaces path separators", () => {
    expect(buleiGroupDirName("a/b c")).toBe("a／b c");
  });

  it("returns 未分组 for empty", () => {
    expect(buleiGroupDirName("   ")).toBe("未分组");
  });

  it("converts traditional labels to simplified", () => {
    expect(buleiGroupDirName("般若部類")).toBe("般若部类");
  });
});
