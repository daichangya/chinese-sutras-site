/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import {
  CORPUS_SUTRAS_SUBDIR,
  joinSutraPath,
  resolveSutrasRoot,
} from "@/lib/corpus-v3/paths";

describe("resolveSutrasRoot", () => {
  let tmp: string;

  afterEach(() => {
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("uses flat layout when 经藏 is missing", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sutras-flat-"));
    fs.mkdirSync(path.join(tmp, "般若", "心经"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "般若", "心经", "meta.yaml"), "cbeta_id: T0220\n", "utf-8");
    expect(resolveSutrasRoot(tmp)).toBe(path.resolve(tmp));
    expect(findSutraMetaFiles(tmp)).toHaveLength(1);
  });

  it("uses nested 经藏 when it has dept dirs", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sutras-nest-"));
    fs.mkdirSync(path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经", "meta.yaml"),
      "cbeta_id: T0220\n",
      "utf-8",
    );
    fs.mkdirSync(path.join(tmp, "辞典"), { recursive: true });
    expect(resolveSutrasRoot(tmp)).toBe(path.join(tmp, CORPUS_SUTRAS_SUBDIR));
    expect(joinSutraPath(tmp, "般若", "心经")).toBe(
      path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经"),
    );
    expect(findSutraMetaFiles(tmp)).toHaveLength(1);
  });
});
