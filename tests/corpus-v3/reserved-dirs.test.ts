/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import { CORPUS_DICT_SUBDIR, CORPUS_KG_SUBDIR, CORPUS_SUTRAS_SUBDIR } from "@/lib/corpus-v3/paths";

describe("corpus reserved top dirs", () => {
  let tmp: string;

  afterEach(() => {
    if (tmp && fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("skips dictionaries and knowledge-graph at corpus root", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "corpus-reserved-"));
    fs.mkdirSync(path.join(tmp, "dictionaries", "sources", "soothill"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "dictionaries", "sources", "soothill", "meta.yaml"),
      "cbeta_id: FAKE\n",
      "utf-8",
    );
    fs.mkdirSync(path.join(tmp, "knowledge-graph"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "knowledge-graph", "meta.yaml"), "cbeta_id: FAKE2\n", "utf-8");

    fs.mkdirSync(path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经_T01n0220"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经_T01n0220", "meta.yaml"),
      "cbeta_id: T0220\n",
      "utf-8",
    );

    const files = findSutraMetaFiles(tmp);
    expect(files).toHaveLength(1);
    expect(files[0]).toContain("心经_T01n0220");
  });

  it("skips 辞典 and 知识图谱 at corpus root", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "corpus-reserved-zh-"));
    fs.mkdirSync(path.join(tmp, CORPUS_DICT_SUBDIR), { recursive: true });
    fs.writeFileSync(path.join(tmp, CORPUS_DICT_SUBDIR, "meta.yaml"), "cbeta_id: FAKE\n", "utf-8");
    fs.mkdirSync(path.join(tmp, CORPUS_KG_SUBDIR), { recursive: true });
    fs.mkdirSync(path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经", "meta.yaml"),
      "cbeta_id: T0220\n",
      "utf-8",
    );
    expect(findSutraMetaFiles(tmp)).toHaveLength(1);
  });

  it("skips dictionaries and knowledge-graph under nested 经藏 layout", () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "corpus-nested-reserved-"));
    fs.mkdirSync(path.join(tmp, "dictionaries"), { recursive: true });
    fs.writeFileSync(path.join(tmp, "dictionaries", "meta.yaml"), "cbeta_id: FAKE\n", "utf-8");
    fs.mkdirSync(path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, CORPUS_SUTRAS_SUBDIR, "般若", "心经", "meta.yaml"),
      "cbeta_id: T0220\n",
      "utf-8",
    );

    const files = findSutraMetaFiles(tmp);
    expect(files).toHaveLength(1);
  });
});
