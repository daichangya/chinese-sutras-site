import { describe, expect, it, beforeAll, beforeEach } from "vitest";
import {
  BULEI_TXT_PATH,
  classifyBuleiResolve,
  getBuleiCatalogIndex,
  getBuleiCategory,
  getBuleiMeta,
  getBuleiMetaExact,
  lookupBuleiByAnyId,
  resetBuleiCatalogCache,
  resolveBuleiMeta,
} from "@/lib/cbeta/bulei-catalog";
import { resetCatalogBridgeCache } from "@/lib/cbeta/bulei-catalog-bridge";
import { resetBuleiAliasCache } from "@/lib/cbeta/bulei-aliases";
import { expandShortSutraId, loadSutralistShortToFullMap } from "@/lib/cbeta/sutralist-short-id";
import { resetSutralistFullCache } from "@/lib/cbeta/sutralist-full";
import fs from "fs";

describe("bulei-catalog", () => {
  beforeEach(() => {
    resetBuleiCatalogCache();
    resetSutralistFullCache();
    resetCatalogBridgeCache();
    resetBuleiAliasCache();
  });

  beforeAll(() => {
    expect(fs.existsSync(BULEI_TXT_PATH)).toBe(true);
    const idx = getBuleiCatalogIndex();
    expect(idx.size).toBeGreaterThan(3000);
  });

  it("maps T0002 short id to T01n0002 and 阿含部類", () => {
    const meta = lookupBuleiByAnyId("T0002");
    expect(meta?.sectionLabel).toBe("阿含部類");
    expect(getBuleiCategory("T01n0002")).toBe("阿含（小乘根本经典）");
  });

  it("maps T01n0001 from bulei", () => {
    expect(getBuleiCategory("T01n0001")).toBe("阿含（小乘根本经典）");
    const m = getBuleiMeta("T01n0001");
    expect(m?.sectionCode).toBe("01");
    expect(m?.groupDir.length).toBeGreaterThan(0);
    expect(resolveBuleiMeta("T01n0001")?.source).toBe("bulei.txt");
  });

  it("resolves T05n0220a via juan range", () => {
    const m = resolveBuleiMeta("T05n0220a");
    expect(m?.source).toBe("juan");
    expect(m?.sectionLabel).toBe("般若部類");
    expect(m?.groupLabel).toMatch(/上品般若/);
  });

  it("resolves N32n0018 via sutralist supplement or short", () => {
    const m = resolveBuleiMeta("N32n0018");
    expect(m?.sectionLabel).toBe("南傳大藏經部類");
    expect(["sutralist", "short", "bulei.txt"]).toContain(m?.source);
  });

  it("resolves B02n0001 to 新編部類", () => {
    const m = resolveBuleiMeta("B02n0001");
    expect(m?.sectionLabel).toBe("新編部類");
  });

  it("resolves GA089n0089 via GA short id", () => {
    const m = resolveBuleiMeta("GA089n0089");
    expect(m?.sectionLabel).toBe("新編部類");
    expect(m?.source).toBe("short");
  });

  it("resolves ZW01na001 with catalog or bulei", () => {
    const m = resolveBuleiMeta("ZW01na001");
    expect(m?.sectionLabel).toBeTruthy();
    expect(m?.source).not.toBe("inferred");
  });

  it("always returns resolved meta for unknown xml id (inferred fallback)", () => {
    const m = resolveBuleiMeta("B99n9999");
    expect(m?.source).toBe("inferred");
    expect(m?.sectionLabel).toBeTruthy();
  });

  it("classifyBuleiResolve distinguishes exact vs inferred", () => {
    expect(classifyBuleiResolve("T01n0001").exact).toBe(true);
    expect(classifyBuleiResolve("T05n0220a").exact).toBe(false);
    expect(classifyBuleiResolve("T05n0220a").resolved).toBe(true);
  });

  it("expandShortSutraId via sutralist", () => {
    const map = loadSutralistShortToFullMap();
    expect(map.size).toBeGreaterThan(3000);
    expect(expandShortSutraId("T0001", map)).toBe("T01n0001");
  });

  it("getBuleiMetaExact only hits C leaves", () => {
    expect(getBuleiMetaExact("T05n0220a")).toBeUndefined();
    expect(getBuleiMeta("T05n0220a")?.groupLabel).toMatch(/上品般若/);
  });
});
