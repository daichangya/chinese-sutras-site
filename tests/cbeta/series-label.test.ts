import { describe, expect, it } from "vitest";
import {
  categoryFromCbetaId,
  CBETA_SERIES_LABELS,
  seriesCodeFromCbetaId,
} from "@/lib/cbeta/series-label";

describe("seriesCodeFromCbetaId", () => {
  it("matches two-letter codes before single-letter", () => {
    expect(seriesCodeFromCbetaId("GA015n0013")).toBe("GA");
    expect(seriesCodeFromCbetaId("GB078n0109")).toBe("GB");
    expect(seriesCodeFromCbetaId("G160n2619")).toBe("G");
    expect(seriesCodeFromCbetaId("CC006n1234")).toBe("CC");
  });

  it("covers I and U series", () => {
    expect(seriesCodeFromCbetaId("I01n0098")).toBe("I");
    expect(seriesCodeFromCbetaId("U205n0001")).toBe("U");
  });
});

describe("categoryFromCbetaId", () => {
  it("maps GA/GB/I to Chinese dept names", () => {
    expect(categoryFromCbetaId("GA015n0013")).toBe("佛寺史志汇刊");
    expect(categoryFromCbetaId("GB078n0109")).toBe("佛寺志丛刊");
    expect(categoryFromCbetaId("I01n0098")).toBe("北朝佛拓");
  });

  it("maps series codes to canon collection labels", () => {
    expect(categoryFromCbetaId("A120n1561")).toBe("赵城藏");
    expect(categoryFromCbetaId("G160n2619")).toBe("佛教大藏");
    expect(categoryFromCbetaId("D64n9031")).toBe("国图藏");
  });

  it("has label for every discovered xml-p5 prefix", () => {
    const prefixes = [
      "A",
      "B",
      "C",
      "CC",
      "D",
      "F",
      "G",
      "GA",
      "GB",
      "I",
      "J",
      "K",
      "L",
      "LC",
      "M",
      "N",
      "P",
      "S",
      "T",
      "TX",
      "U",
      "X",
      "Y",
      "YP",
      "ZS",
      "ZW",
    ];
    for (const p of prefixes) {
      expect(CBETA_SERIES_LABELS[p], `missing label for ${p}`).toBeTruthy();
      expect(categoryFromCbetaId(`${p}01n0001`)).not.toBe(p);
    }
  });
});
