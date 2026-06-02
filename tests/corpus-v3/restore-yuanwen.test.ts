import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll } from "vitest";
import { resetTaishoCategoryIndexCache } from "@/lib/cbeta/corpus-category";
import { generateCorpusV3FromXml } from "@/lib/corpus-v3/gen";
import { restoreYuanwenFromXml } from "@/lib/corpus-v3/restore-yuanwen";
import { t2s } from "@/lib/han";

describe("restore-yuanwen", () => {
  beforeAll(() => {
    resetTaishoCategoryIndexCache();
  });

  it("rewrites 原文 from XML without touching 白话", () => {
    const tmpRoot = path.join("tests", "tmp", "restore-yuanwen");
    fs.rmSync(tmpRoot, { recursive: true, force: true });

    const result = generateCorpusV3FromXml({
      cbetaId: "T01n0001",
      xmlPath: "tests/fixtures/T01n0001-anchor.xml",
      xmlRoot: "tests/fixtures",
      corpusRoot: tmpRoot,
      stripPreface: false,
      cleanStale: true,
    });

    const yuanwenPath = result.juanFiles[0]!.yuanwen;
    const baihuaPath = result.juanFiles[0]!.baihua;

    const corrupted = t2s(fs.readFileSync(yuanwenPath, "utf-8"), { backend: "js" }).text;
    fs.writeFileSync(yuanwenPath, corrupted, "utf-8");
    expect(corrupted).toContain("长阿含经");

    const baihuaMarker = "<!-- human baihua marker -->\n";
    fs.writeFileSync(baihuaPath, baihuaMarker, "utf-8");

    const restored = restoreYuanwenFromXml({
      metaPath: result.metaPath,
      corpusRoot: tmpRoot,
      xmlRoot: "tests/fixtures",
      stripPreface: false,
    });

    expect(restored.status).toBe("ok");
    expect(restored.juanCount).toBe(1);

    const yuanwenAfter = fs.readFileSync(yuanwenPath, "utf-8");
    expect(yuanwenAfter).toContain("長阿含經");
    expect(yuanwenAfter).not.toContain("长阿含经");

    expect(fs.readFileSync(baihuaPath, "utf-8")).toBe(baihuaMarker);
    expect(fs.existsSync(path.join(path.dirname(result.metaPath), "_index", "blocks.jsonl"))).toBe(
      true,
    );
  });
});
