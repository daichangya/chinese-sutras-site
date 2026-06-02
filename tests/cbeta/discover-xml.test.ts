/**
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import { cbetaIdFromXmlFilename, discoverCbetaXmlFiles } from "@/lib/cbeta/discover-xml";
import { existsSync } from "fs";

describe("discover-xml", () => {
  it("parses standard CBETA xml filename", () => {
    expect(cbetaIdFromXmlFilename("T08n0251.xml")).toBe("T08n0251");
    expect(cbetaIdFromXmlFilename("X11n0047a.xml")).toBe("X11n0047a");
    expect(cbetaIdFromXmlFilename("J31nB269.xml")).toBe("J31nB269");
    expect(cbetaIdFromXmlFilename("readme.xml")).toBeNull();
  });

  it("discovers at least one xml under vendor or fixtures", () => {
    const root = existsSync("vendor/xml-p5") ? "vendor/xml-p5" : "tests/fixtures";
    const found = discoverCbetaXmlFiles(root);
    if (!existsSync("vendor/xml-p5") && found.length === 0) {
      console.warn("Skip: no xml-p5 and no discoverable fixtures");
      return;
    }
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].cbetaId).toMatch(/^[A-Z]+\d+n\d+/);
  });
});
