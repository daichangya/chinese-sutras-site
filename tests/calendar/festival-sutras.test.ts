/**
 * 节日经目 slug 解析
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb } from "@/lib/db/sqlite";
import {
  FESTIVAL_SUTRA_REGISTRY,
  getFestivalSutraRef,
} from "@/lib/calendar/festival-sutra-registry";
import { resolveFestivalSutraExcerpt } from "@/lib/calendar/festival-sutras";

describe("festival sutra slugs", () => {
  it("registers all canonical slugs", () => {
    expect(Object.keys(FESTIVAL_SUTRA_REGISTRY).sort()).toEqual(
      [
        "amituo-jing",
        "famen-pin",
        "fo-benxing-jing",
        "niepan-jing",
        "xinjing",
        "yaoshi-jing",
        "yulanpen-jing",
      ].sort(),
    );
    expect(getFestivalSutraRef("amituo-jing")?.cbetaId).toBe("T12n0366");
    expect(getFestivalSutraRef("famen-pin")?.juanSeq).toBe(7);
  });

  describe("resolve against corpus db", () => {
    let tmpDir: string;
    let prevDataDir: string | undefined;
    let hasCorpusDb: boolean;

    beforeEach(() => {
      hasCorpusDb = fs.existsSync(path.join(process.cwd(), "data/jingxin.db"));
      if (!hasCorpusDb) return;
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-fest-sutra-"));
      prevDataDir = process.env.DATA_DIR;
      process.env.DATA_DIR = tmpDir;
      fs.copyFileSync(path.join(process.cwd(), "data/jingxin.db"), path.join(tmpDir, "jingxin.db"));
      closeDb();
    });

    afterEach(() => {
      if (!hasCorpusDb) return;
      process.env.DATA_DIR = prevDataDir;
      closeDb();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("resolves amituo-jing via cbeta id", () => {
      if (!hasCorpusDb) return;
      const excerpt = resolveFestivalSutraExcerpt("amituo-jing");
      expect(excerpt?.title).toContain("阿弥陀");
      expect(excerpt?.verseText.length).toBeGreaterThan(0);
    });

    it("resolves famen-pin within lotus sutra", () => {
      if (!hasCorpusDb) return;
      const excerpt = resolveFestivalSutraExcerpt("famen-pin");
      expect(excerpt?.title).toContain("普门");
      expect(excerpt?.verseText).toContain("观世音");
    });
  });
});
