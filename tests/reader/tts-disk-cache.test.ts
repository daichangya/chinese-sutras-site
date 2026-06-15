/**
 * TTS 磁盘缓存测试
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getCachedAudio,
  putCachedAudio,
  resolveCachePath,
  setTtsCacheRootForTests,
} from "@/lib/reader/speech/tts-disk-cache";

describe("tts-disk-cache", () => {
  let tmpDir: string;

  afterEach(() => {
    setTtsCacheRootForTests(null);
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("stores and reads audio by hash key with sharded path", () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-tts-"));
    setTtsCacheRootForTests(tmpDir);

    const key = "a".repeat(64);
    const data = Buffer.from("fake-mp3");
    expect(getCachedAudio(key)).toBeNull();

    putCachedAudio(key, data);
    const filePath = resolveCachePath(key);
    expect(filePath).toContain(path.join("aa", `${key}.mp3`));
    expect(fs.existsSync(filePath)).toBe(true);
    expect(getCachedAudio(key)?.equals(data)).toBe(true);
  });
});
