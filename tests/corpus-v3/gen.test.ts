import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll } from "vitest";
import { resetTaishoCategoryIndexCache } from "@/lib/cbeta/corpus-category";
import { generateCorpusV3FromXml } from "@/lib/corpus-v3/gen";
import { buildGeneratedCbetaIdSet, loadSutraMeta } from "@/lib/corpus-v3/meta";
import { parseReadableParagraphs } from "@/lib/corpus-v3/markdown";

describe("corpus-v3 gen", () => {
  beforeAll(() => {
    resetTaishoCategoryIndexCache();
  });

  it("generates readable layout for anchor fixture", () => {
    const tmpRoot = path.join("tests", "tmp", "corpus-v3");
    fs.rmSync(tmpRoot, { recursive: true, force: true });

    const result = generateCorpusV3FromXml({
      cbetaId: "T01n0001",
      xmlPath: "tests/fixtures/T01n0001-anchor.xml",
      xmlRoot: "tests/fixtures",
      corpusRoot: tmpRoot,
      stripPreface: false,
      cleanStale: true,
    });

    expect(result.blockCount).toBe(4);
    expect(result.juanFiles.length).toBe(1);
    expect(fs.existsSync(result.metaPath)).toBe(true);

    const meta = loadSutraMeta(result.metaPath);
    expect(meta.title).toBe("长阿含经");
    expect(meta.category).toBe("阿含（小乘根本经典）");
    expect(path.basename(result.sutraDir)).toBe("长阿含经_T01n0001");
    expect(path.basename(result.sutraDir)).not.toMatch(/[經長]/);

    const yuanwen = fs.readFileSync(result.juanFiles[0]!.yuanwen, "utf-8");
    expect(yuanwen).toMatch(/長阿含經/);
    expect(yuanwen).not.toMatch(/canonical_id/);
    expect(parseReadableParagraphs(yuanwen).length).toBe(4);

    const indexPath = path.join(path.dirname(result.metaPath), "_index", "blocks.jsonl");
    expect(fs.existsSync(indexPath)).toBe(true);

    const generated = buildGeneratedCbetaIdSet(tmpRoot);
    expect(generated.has("T01n0001")).toBe(true);
    expect(generated.has("T99n9999")).toBe(false);
  });
});
