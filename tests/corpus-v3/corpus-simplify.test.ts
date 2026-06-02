import fs from "fs";
import path from "path";
import { describe, it, expect, beforeAll } from "vitest";
import { resetTaishoCategoryIndexCache } from "@/lib/cbeta/corpus-category";
import { DIR_JIANTI_LEGACY, DIR_YUANWEN } from "@/lib/corpus-v3/corpus-dirs";
import { generateCorpusV3FromXml } from "@/lib/corpus-v3/gen";
import { collectSimplifyMdFiles } from "@/lib/corpus-v3/simplify-md";
import { t2s } from "@/lib/han";

describe("corpus-simplify", () => {
  beforeAll(() => {
    resetTaishoCategoryIndexCache();
  });

  it("collectSimplifyMdFiles excludes 原文 and 简体", () => {
    const tmpRoot = path.join("tests", "tmp", "corpus-simplify");
    fs.rmSync(tmpRoot, { recursive: true, force: true });

    const result = generateCorpusV3FromXml({
      cbetaId: "T01n0001",
      xmlPath: "tests/fixtures/T01n0001-anchor.xml",
      xmlRoot: "tests/fixtures",
      corpusRoot: tmpRoot,
      stripPreface: false,
      cleanStale: true,
    });

    const sutraRoot = path.dirname(result.metaPath);
    const yuanwenPath = result.juanFiles[0]!.yuanwen;
    const yuanwenBefore = fs.readFileSync(yuanwenPath, "utf-8");
    expect(yuanwenBefore).toContain("長阿含經");

    const jiantiDir = path.join(sutraRoot, DIR_JIANTI_LEGACY);
    fs.mkdirSync(jiantiDir, { recursive: true });
    fs.writeFileSync(path.join(jiantiDir, "第001卷.md"), "# placeholder\n", "utf-8");

    const collected = collectSimplifyMdFiles(sutraRoot);
    expect(collected.some((p) => p.includes(`/${DIR_YUANWEN}/`))).toBe(false);
    expect(collected.some((p) => p.includes(`/${DIR_JIANTI_LEGACY}/`))).toBe(false);
    expect(collected.some((p) => p.includes("/白话/"))).toBe(true);

    const toSimplified = (raw: string) => t2s(raw, { backend: "js" }).text;
    for (const fp of collected) {
      const raw = fs.readFileSync(fp, "utf-8");
      fs.writeFileSync(fp, toSimplified(raw), "utf-8");
    }

    expect(fs.readFileSync(yuanwenPath, "utf-8")).toBe(yuanwenBefore);
    expect(fs.existsSync(jiantiDir)).toBe(true);
  });
});
