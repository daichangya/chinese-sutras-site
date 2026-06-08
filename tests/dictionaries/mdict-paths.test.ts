/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { mddKeyToAssetPath, mdictAssetBasename, normalizeMdxImageSrc } from "@/lib/dictionaries/mdict-paths";

describe("mdict-paths", () => {
  it("normalizes MDX img src", () => {
    expect(normalizeMdxImageSrc("/FGDCDZDB/s2-213.jpg")).toBe("assets/FGDCDZDB/s2-213.jpg");
    expect(normalizeMdxImageSrc("FGDCDZDB/foo.jpg")).toBe("assets/FGDCDZDB/foo.jpg");
  });

  it("normalizes MDD keys with backslashes", () => {
    expect(mddKeyToAssetPath("\\FGDCDZDB\\s2-213.jpg")).toBe("assets/FGDCDZDB/s2-213.jpg");
  });

  it("extracts basename", () => {
    expect(mdictAssetBasename("/FGDCDZDB/x.jpg")).toBe("x.jpg");
  });
});
