/**
 * 心经正文展示：语料生成与导入角色
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll } from "vitest";
import { generateCorpusV3FromXml } from "@/lib/corpus-v3/gen";
import { buildImportBundle } from "@/lib/corpus-v3/import-align";
import { loadBlocksIndex } from "@/lib/corpus-v3/blocks-index";
import { DIR_YUANWEN } from "@/lib/corpus-v3/corpus-dirs";
import { listJuanMdFiles, parseReadableParagraphs } from "@/lib/corpus-v3/markdown";

const fixtureXml = "tests/fixtures/T08n0251.xml";

describe("xinjing body display pipeline", () => {
  const tmpRoot = path.join("tests", "tmp", "xinjing-body-display");
  let metaPath: string;

  beforeAll(() => {
    if (!fs.existsSync(fixtureXml)) {
      return;
    }
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    const gen = generateCorpusV3FromXml({
      cbetaId: "T08n0251",
      xmlPath: fixtureXml,
      xmlRoot: "tests/fixtures",
      corpusRoot: tmpRoot,
      stripPreface: true,
      cleanStale: true,
    });
    metaPath = gen.metaPath;
  });

  it("generates MD starting with 觀自在菩薩 when stripPreface=true", () => {
    if (!fs.existsSync(fixtureXml)) return;
    const sutraRoot = path.dirname(metaPath);
    const yuanwenFiles = listJuanMdFiles(path.join(sutraRoot, DIR_YUANWEN));
    expect(yuanwenFiles.length).toBeGreaterThan(0);
    const md = fs.readFileSync(yuanwenFiles[0]!, "utf-8");
    const paras = parseReadableParagraphs(md);
    expect(paras[0]).toMatch(/觀自在菩薩/);
    expect(paras.some((p) => p.includes("二儀久判"))).toBe(false);
  });

  it("writes block_role on index entries", () => {
    if (!fs.existsSync(fixtureXml)) return;
    const sutraRoot = path.dirname(metaPath);
    const entries = loadBlocksIndex(sutraRoot);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]!.block_role).toBe("body");
    expect(entries.every((e) => e.block_role === "body" || e.block_role === "verse")).toBe(true);
  });

  it("md-only import marks body paragraphs and excludes preface from reader roles", () => {
    if (!fs.existsSync(fixtureXml)) return;
    const bundle = buildImportBundle({
      corpusRoot: tmpRoot,
      xmlRoot: "tests/fixtures",
      metaPath,
      stripPreface: true,
      mdOnly: true,
    });
    expect(bundle.paragraphs.length).toBeGreaterThan(0);
    expect(bundle.paragraphs[0]!.text).toContain("观自在菩萨");
    expect(bundle.paragraphs[0]!.blockRole).toBe("body");
    expect(bundle.paragraphs.every((p) => p.blockRole !== "preface")).toBe(true);
  });
});
