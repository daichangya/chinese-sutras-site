import fs from "fs";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { isMetaOnlySutraDir, mergeDirInto } from "@/lib/corpus-v3/dir-merge";

describe("dir-merge", () => {
  const tmp = path.join(process.cwd(), `.tmp-dir-merge-${Date.now()}`);

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("mergeDirInto 并入已有目录且不覆盖 meta", () => {
    const canonical = path.join(tmp, "canonical");
    const orphan = path.join(tmp, "orphan");
    fs.mkdirSync(path.join(canonical, "原文"), { recursive: true });
    fs.writeFileSync(path.join(canonical, "meta.yaml"), "cbeta_id: X\n");
    fs.mkdirSync(path.join(orphan, "白话"), { recursive: true });
    fs.writeFileSync(path.join(orphan, "白话", "第001卷.md"), "content\n");

    mergeDirInto(orphan, canonical);

    expect(fs.existsSync(orphan)).toBe(false);
    expect(fs.readFileSync(path.join(canonical, "meta.yaml"), "utf-8")).toContain("cbeta_id");
    expect(fs.readFileSync(path.join(canonical, "白话", "第001卷.md"), "utf-8")).toBe("content\n");
  });

  it("isMetaOnlySutraDir 识别仅 meta 的空壳", () => {
    const dir = path.join(tmp, "shell");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "meta.yaml"), "x\n");
    expect(isMetaOnlySutraDir(dir)).toBe(true);
    fs.mkdirSync(path.join(dir, "原文"));
    expect(isMetaOnlySutraDir(dir)).toBe(false);
  });
});
