import { describe, expect, it } from "vitest";
import {
  resolveContextParagraphId,
  resolveContextText,
} from "@/lib/reader/context-actions";

describe("context-actions", () => {
  it("prefers selection text over paragraph fallback", () => {
    expect(resolveContextText("观自在菩萨", "般若波罗蜜多心经")).toBe(
      "观自在菩萨",
    );
  });

  it("falls back to paragraph excerpt when selection empty", () => {
    expect(resolveContextText("", "般若波罗蜜多心经全文")).toBe(
      "般若波罗蜜多心经全文".slice(0, 80),
    );
  });

  it("resolves paragraph id from selection or active", () => {
    expect(resolveContextParagraphId("sel-id", "active-id")).toBe("sel-id");
    expect(resolveContextParagraphId(undefined, "active-id")).toBe("active-id");
  });
});
