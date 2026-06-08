import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll } from "vitest";
import { DIR_YUANWEN } from "@/lib/corpus-v3/corpus-dirs";
import { generateCorpusV3FromXml } from "@/lib/corpus-v3/gen";
import { buildImportBundle } from "@/lib/corpus-v3/import-align";
import { blocksIndexPath, loadBlocksIndex } from "@/lib/corpus-v3/blocks-index";
import { listJuanMdFiles, parseReadableParagraphs } from "@/lib/corpus-v3/markdown";
import { resolveSutraSlug } from "@/lib/corpus-v3/slug";
import { loadSutraMeta } from "@/lib/corpus-v3/meta";
import { t2s } from "@/lib/han";

describe("corpus-v3 import-align", () => {
  const tmpRoot = path.join("tests", "tmp", "corpus-v3-import-suite");
  let metaPath: string;

  beforeAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    const gen = generateCorpusV3FromXml({
      cbetaId: "T01n0001",
      xmlPath: "tests/fixtures/T01n0001-anchor.xml",
      xmlRoot: "tests/fixtures",
      corpusRoot: tmpRoot,
      stripPreface: false,
      cleanStale: true,
    });
    metaPath = gen.metaPath;
  });

  it("writes blocks.jsonl on gen", () => {
    const sutraRoot = path.dirname(metaPath);
    expect(fs.existsSync(blocksIndexPath(sutraRoot))).toBe(true);
    expect(loadBlocksIndex(sutraRoot).length).toBe(4);
  });

  it("slug derives from cbeta_id", () => {
    const meta = loadSutraMeta(metaPath);
    expect(resolveSutraSlug(meta)).toBe("t01n0001");
  });

  it("aligns with XML + index (default)", () => {
    const bundle = buildImportBundle({
      corpusRoot: tmpRoot,
      xmlRoot: "tests/fixtures",
      metaPath,
      stripPreface: false,
      mdOnly: false,
    });
    expect(bundle.slug).toBe("t01n0001");
    expect(bundle.paragraphs.length).toBe(4);
    expect(bundle.chapters.length).toBeGreaterThan(0);
    expect(bundle.paragraphs[0]!.canonicalId).toContain("T01n0001:p0001a01");
    expect(bundle.paragraphs[0]!.juanSeq).toBeDefined();
  });

  it("aligns with --md-only using _index only", () => {
    const bundle = buildImportBundle({
      corpusRoot: tmpRoot,
      xmlRoot: "tests/fixtures",
      metaPath,
      stripPreface: false,
      mdOnly: true,
    });
    expect(bundle.paragraphs.length).toBe(4);
    expect(bundle.paragraphs[0]!.text).toContain("如是我闻");
  });

  it("md-only and xml modes produce same paragraph count for fixture", () => {
    const withXml = buildImportBundle({
      corpusRoot: tmpRoot,
      xmlRoot: "tests/fixtures",
      metaPath,
      stripPreface: false,
      mdOnly: false,
    });
    const mdOnly = buildImportBundle({
      corpusRoot: tmpRoot,
      xmlRoot: "tests/fixtures",
      metaPath,
      stripPreface: false,
      mdOnly: true,
    });
    expect(mdOnly.paragraphs.length).toBe(withXml.paragraphs.length);
    expect(mdOnly.paragraphs.map((p) => p.canonicalId)).toEqual(
      withXml.paragraphs.map((p) => p.canonicalId),
    );
  });

  it("stores t2s simplified text from 原文 on import", () => {
    const sutraRoot = path.dirname(metaPath);
    const yuanwenFiles = listJuanMdFiles(path.join(sutraRoot, DIR_YUANWEN));
    expect(yuanwenFiles.length).toBeGreaterThan(0);
    const yuanwenMd = fs.readFileSync(yuanwenFiles[0]!, "utf-8");
    const paras = parseReadableParagraphs(yuanwenMd);
    paras[1] = "一時佛在舍衛國。";
    const updatedMd = `# 长阿含经\n\n${paras.join("\n\n")}\n`;
    fs.writeFileSync(yuanwenFiles[0]!, updatedMd, "utf-8");

    const bundle = buildImportBundle({
      corpusRoot: tmpRoot,
      xmlRoot: "tests/fixtures",
      metaPath,
      stripPreface: false,
      mdOnly: true,
    });
    expect(bundle.paragraphs[1]!.text).toBe(
      t2s("一時佛在舍衛國。", { backend: "js" }).text,
    );
    expect(bundle.paragraphs[1]!.text).not.toContain("舍衛");
  });

  it("preserves 白话 auxiliary layer as-is on import", () => {
    const sutraRoot = path.dirname(metaPath);
    const baihuaDir = path.join(sutraRoot, "白话");
    fs.mkdirSync(baihuaDir, { recursive: true });
    const yuanwenFiles = listJuanMdFiles(path.join(sutraRoot, DIR_YUANWEN));
    const juanName = path.basename(yuanwenFiles[0]!);
    fs.writeFileSync(
      path.join(baihuaDir, juanName),
      "# 白话\n\n佛於舍衛國說法。\n",
      "utf-8",
    );
    const bundle = buildImportBundle({
      corpusRoot: tmpRoot,
      xmlRoot: "tests/fixtures",
      metaPath,
      stripPreface: false,
      mdOnly: true,
    });
    const withColloquial = bundle.paragraphs.find((p) => p.colloquial);
    expect(withColloquial?.colloquial).toBe("佛於舍衛國說法。");
  });
});
