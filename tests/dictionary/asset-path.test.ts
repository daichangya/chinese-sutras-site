/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { isAllowedDictAssetPath } from "@/lib/dictionaries/dict-asset-path";

describe("dict-asset-path", () => {
  it("allows foguang FGDCDZDB jpg", () => {
    expect(isAllowedDictAssetPath("foguang", ["FGDCDZDB", "w3-944.jpg"])).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isAllowedDictAssetPath("foguang", ["FGDCDZDB", "../secret.jpg"])).toBe(false);
  });

  it("rejects wrong source or depth", () => {
    expect(isAllowedDictAssetPath("dingfubao", ["FGDCDZDB", "a.jpg"])).toBe(false);
    expect(isAllowedDictAssetPath("foguang", ["FGDCDZDB"])).toBe(false);
    expect(isAllowedDictAssetPath("foguang", ["other", "a.jpg"])).toBe(false);
  });
});
