import { describe, it, expect } from "vitest";
import { slugFromCbetaId } from "@/lib/cbeta/series-label";
import { resolveSutraSlug } from "@/lib/corpus-v3/slug";

describe("sutra slug", () => {
  it("derives from cbeta_id", () => {
    expect(slugFromCbetaId("T01n0001")).toBe("t01n0001");
    expect(resolveSutraSlug({ cbetaId: "T08n0251" })).toBe("t08n0251");
  });

  it("allows meta override", () => {
    expect(resolveSutraSlug({ cbetaId: "T01n0001", slug: "chang-a-han" })).toBe("chang-a-han");
  });
});
