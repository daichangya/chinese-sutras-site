import { describe, it, expect } from "vitest";
import { parseCbetaIdQuery, resolveSearchIntent } from "@/lib/search/query-intent";

describe("query-intent", () => {
  it("detects cbeta id queries", () => {
    expect(parseCbetaIdQuery("T08n0235")).toBe("T08n0235");
    expect(parseCbetaIdQuery("t08n0235")).toBe("T08n0235");
  });

  it("routes alias queries", () => {
    const intent = resolveSearchIntent("金刚经");
    expect(intent.mode).toBe("alias");
    expect(intent.canonicalTitle).toBe("金剛般若波羅蜜經");
    expect(intent.aliasCbetaId).toBe("T08n0235");
  });

  it("routes cbeta id mode", () => {
    const intent = resolveSearchIntent("T08n0235");
    expect(intent.mode).toBe("cbeta_id");
    expect(intent.cbetaId).toBe("T08n0235");
  });
});
