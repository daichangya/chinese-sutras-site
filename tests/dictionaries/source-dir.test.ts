/**
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { dictSourceDirName, resolveDictSourceDir } from "@/lib/dictionaries/source-dir";

describe("dict source dir", () => {
  let tmp: string;
  const prev = process.env.DICT_DIR;

  afterEach(() => {
    if (prev !== undefined) process.env.DICT_DIR = prev;
    else delete process.env.DICT_DIR;
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("uses Chinese folder name", () => {
    expect(dictSourceDirName("dingfubao")).toBe("丁福保佛学大辞典");
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dict-zh-dir-"));
    process.env.DICT_DIR = path.join(tmp, "辞典");
    fs.mkdirSync(path.join(tmp, "辞典", "sources", "丁福保佛学大辞典"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "辞典", "sources", "丁福保佛学大辞典", "entries.jsonl"),
      "",
    );
    expect(resolveDictSourceDir("dingfubao")).toContain("丁福保佛学大辞典");
  });
});
