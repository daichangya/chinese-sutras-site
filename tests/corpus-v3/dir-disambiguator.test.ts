import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  compactCbetaVariantSuffix,
  extractDirDisambiguatorFromXml,
  extractHuiTitleFromXml,
  extractJuanRangeLabelFromXml,
} from "@/lib/corpus-v3/dir-disambiguator";

const xmlRoot = path.join(process.cwd(), "vendor/xml-p5");

describe("compactCbetaVariantSuffix", () => {
  it("strips canon prefix and keeps n + digits + letter", () => {
    expect(compactCbetaVariantSuffix("T25n1510b")).toBe("n1510b");
    expect(compactCbetaVariantSuffix("ZW09n0073c")).toBe("n0073c");
    expect(compactCbetaVariantSuffix("T08n0251")).toBeUndefined();
  });
});

describe("extractJuanRangeLabelFromXml", () => {
  it("extracts single physical juan for T07n0220h", () => {
    const xml = fs.readFileSync(path.join(xmlRoot, "T/T07/T07n0220h.xml"), "utf-8");
    expect(extractJuanRangeLabelFromXml(xml)).toBe("第577卷");
  });

  it("extracts juan range for T07n0220j", () => {
    const xml = fs.readFileSync(path.join(xmlRoot, "T/T07/T07n0220j.xml"), "utf-8");
    expect(extractJuanRangeLabelFromXml(xml)).toBe("第579-583卷");
  });

  it("ignores generic n=001 single-juan sutras", () => {
    const xml = fs.readFileSync(path.join(xmlRoot, "T/T08/T08n0236a.xml"), "utf-8");
    expect(extractJuanRangeLabelFromXml(xml)).toBeUndefined();
  });
});

describe("extractHuiTitleFromXml", () => {
  it("extracts 第九能断金刚分 from T07n0220h", () => {
    const xml = fs.readFileSync(path.join(xmlRoot, "T/T07/T07n0220h.xml"), "utf-8");
    expect(extractHuiTitleFromXml(xml)).toBe("第九能断金刚分");
  });
});

describe("extractDirDisambiguatorFromXml", () => {
  it("prefers juan over hui for T220", () => {
    const xml = fs.readFileSync(path.join(xmlRoot, "T/T07/T07n0220h.xml"), "utf-8");
    expect(extractDirDisambiguatorFromXml(xml)).toBe("第577卷");
  });

  it("extracts 第578卷 from T07n0220i", () => {
    const xml = fs.readFileSync(path.join(xmlRoot, "T/T07/T07n0220i.xml"), "utf-8");
    expect(extractDirDisambiguatorFromXml(xml)).toBe("第578卷");
  });

  it("extracts 录文二 from ZW09n0073b", () => {
    const xml = fs.readFileSync(path.join(xmlRoot, "ZW/ZW09/ZW09n0073b.xml"), "utf-8");
    expect(extractDirDisambiguatorFromXml(xml)).toBe("录文二");
  });

  it("falls back to hui when no cb:juan", () => {
    const xml = `<TEI><text><body>
      <cb:div type="hui"><head><title>大般若經</title>第十會般若理趣分</head></cb:div>
    </body></text></TEI>`;
    expect(extractDirDisambiguatorFromXml(xml)).toBe("第十般若理趣分");
  });

  it("returns undefined for plain head without markers", () => {
    const xml = `<TEI><text><body><head>第一卷</head><p>正文</p></body></text></TEI>`;
    expect(extractDirDisambiguatorFromXml(xml)).toBeUndefined();
  });
});
