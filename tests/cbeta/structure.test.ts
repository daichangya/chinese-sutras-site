import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { parseCbetaStructure } from "@/lib/cbeta/structure";

const anchorFixture = "tests/fixtures/T01n0001-anchor.xml";
const titleFixture = "tests/fixtures/T01n0001-title-header.xml";
const t01Xml = "vendor/xml-p5/T/T01/T01n0001.xml";

describe("parseCbetaStructure", () => {
  it("groups anchor fixture as single 全文 juan", () => {
    const xml = fs.readFileSync(anchorFixture, "utf-8");
    const result = parseCbetaStructure(xml, "T01n0001", { stripPreface: false });
    expect(result.title).toBe("長阿含經");
    expect(result.juans.length).toBe(1);
    expect(result.juans[0]!.label).toBe("全文");
    expect(result.juans[0]!.blocks.length).toBe(4);
    expect(result.juans[0]!.blocks[0]!.startRef).toBe("p0001a01");
    expect(result.juans[0]!.blocks[0]!.canonicalId).toContain("T01n0001:p0001a01");
  });

  it("extracts title and translator from multi-title header", () => {
    const xml = fs.readFileSync(titleFixture, "utf-8");
    const result = parseCbetaStructure(xml, "T01n0001", { stripPreface: false });
    expect(result.title).toBe("長阿含經");
    expect(result.translator).toBe("後秦 佛陀耶舍共竺佛念譯");
  });

  it("splits T01n0001 into multiple juans when vendor xml present", () => {
    if (!fs.existsSync(t01Xml)) {
      console.warn("Skip: vendor T01n0001.xml missing");
      return;
    }
    const xml = fs.readFileSync(t01Xml, "utf-8");
    const result = parseCbetaStructure(xml, "T01n0001", { stripPreface: true });
    expect(result.juanCount).toBe(22);
    expect(result.juans.length).toBeGreaterThan(1);
    expect(result.juans.some((j) => j.juanNum === 1)).toBe(true);
    const j1 = result.juans.find((j) => j.juanNum === 1);
    expect(j1?.blocks.some((b) => b.text.includes("如是我聞"))).toBe(true);
    expect(j1?.blocks.some((b) => b.sectionTitle)).toBe(true);
  });

  it("extracts blocks from list/item 科判 structure (X24n0463)", () => {
    const xmlPath = "vendor/xml-p5/X/X24/X24n0463.xml";
    if (!fs.existsSync(xmlPath)) {
      console.warn("Skip: vendor X24n0463.xml missing");
      return;
    }
    const xml = fs.readFileSync(xmlPath, "utf-8");
    const result = parseCbetaStructure(xml, "X24n0463", { stripPreface: true });
    expect(result.juans.length).toBeGreaterThan(0);
    const blocks = result.juans.reduce((n, j) => n + j.blocks.length, 0);
    expect(blocks).toBeGreaterThan(0);
  });

  it("preserves verse line breaks", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader><fileDesc><titleStmt><title>測試</title></titleStmt></fileDesc></teiHeader>
  <text><body>
    <lg><l>佛日光普照，<caesura/>分別法界義；</l><l>名號、姓、種族，<caesura/>受生分亦知；</l></lg>
  </body></text>
</TEI>`;
    const result = parseCbetaStructure(xml, "T99n9999", { stripPreface: false });
    const verse = result.juans[0]?.blocks[0]?.text ?? "";
    expect(verse).toContain("\n");
    expect(verse).toMatch(/ \//);
    expect(verse).not.toMatch(/分別法界義；名號/);
  });
});
