import { readFileSync, existsSync } from "fs";
import { describe, it, expect } from "vitest";
import { parseCbetaFile } from "@/lib/cbeta/parser";

const fixturePath = "tests/fixtures/T08n0251.xml";
const inlineFixturePath = "tests/fixtures/A091n1057-inline-p.xml";
const anchorFixturePath = "tests/fixtures/T01n0001-anchor.xml";
const titleHeaderFixturePath = "tests/fixtures/T01n0001-title-header.xml";

describe("parseCbetaFile", () => {
  it("parses heart sutra paragraphs from fixture", () => {
    if (!existsSync(fixturePath)) {
      console.warn("Skip: fixture missing, clone cbeta xml-p5 first");
      return;
    }
    const xml = readFileSync(fixturePath, "utf-8");
    const result = parseCbetaFile(xml, "T08n0251");
    expect(result.title.length).toBeGreaterThan(0);
    expect(result.paragraphs.length).toBeGreaterThan(0);
    expect(result.paragraphs[0].text.length).toBeGreaterThan(0);
    expect(result.paragraphs[0].seq).toBe(1);
  });

  it("extracts translator when present in byline", () => {
    if (!existsSync(fixturePath)) return;
    const xml = readFileSync(fixturePath, "utf-8");
    const result = parseCbetaFile(xml, "T08n0251");
    expect(result.translator).toBe("唐三藏法師玄奘譯");
  });

  it("extracts zh-Hant level=m title and author without concatenating catalog titles", () => {
    const xml = readFileSync(titleHeaderFixturePath, "utf-8");
    const result = parseCbetaFile(xml, "T01n0001", { stripPreface: false });
    expect(result.title).toBe("長阿含經");
    expect(result.title).not.toMatch(/Taishō|Electronic|數位版/);
    expect(result.translator).toBe("後秦 佛陀耶舍共竺佛念譯");
    expect(result.translator).not.toMatch(/non-commercial/i);
  });

  it("strips nested empty inline p anchors without leaking attributes", () => {
    const xml = readFileSync(inlineFixturePath, "utf-8");
    const result = parseCbetaFile(xml, "A091n1057", { stripPreface: false });

    expect(result.title).toContain("華嚴經音義");
    expect(result.paragraphs.length).toBeGreaterThanOrEqual(4);

    const yinyiEntry = result.paragraphs.find((p) => p.text.includes("冊，測革反"));
    expect(yinyiEntry).toBeDefined();
    expect(yinyiEntry!.text).toContain("《說文》");
    expect(yinyiEntry!.text).not.toMatch(/margin-left/i);
    expect(yinyiEntry!.text).not.toMatch(/pA091p0312/);

    const inlineWithText = result.paragraphs.find((p) => p.text.includes("云何眼識自性"));
    expect(inlineWithText).toBeDefined();
    expect(inlineWithText!.text).toContain("了別色");
    expect(inlineWithText!.text).not.toMatch(/pT30p0279/);

    const choicePara = result.paragraphs.find((p) => p.text.includes("勘誤示例"));
    expect(choicePara?.text).toContain("遲迴");
    expect(choicePara?.text).not.toContain("彽徊");
  });

  it("extracts start_ref/end_ref from pb/lb anchors when present", () => {
    const xml = readFileSync(anchorFixturePath, "utf-8");
    const result = parseCbetaFile(xml, "T01n0001", { stripPreface: false });
    expect(result.paragraphs.length).toBe(4);
    expect(result.paragraphs[0].startRef).toBe("p0001a01");
    expect(result.paragraphs[0].endRef).toBe("p0001a01");
    expect(result.paragraphs[3].startRef).toBe("p0001a12");
    expect(result.paragraphs[3].endRef).toBe("p0001a12");
    expect(result.paragraphs[0].xmlId).toBe("pT01p0001a0101");
  });
});
