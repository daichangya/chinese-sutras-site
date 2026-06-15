/**
 * TTS 服务测试
 * @author 代长亚
 */
import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/reader/speech/edge-tts-provider", () => ({
  synthesizeEdgeSpeech: vi.fn(async () => Buffer.from("edge-audio")),
}));

import { synthesizeEdgeSpeech } from "@/lib/reader/speech/edge-tts-provider";
import {
  buildCacheKey,
  getActiveProvider,
  isCloudTtsAvailable,
  rateToProsody,
  synthesizeSpeech,
} from "@/lib/reader/speech/tts-server";
import {
  getCachedAudio,
  setTtsCacheRootForTests,
} from "@/lib/reader/speech/tts-disk-cache";

describe("tts-server", () => {
  let tmpDir: string;
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.mocked(synthesizeEdgeSpeech).mockClear();
    process.env = { ...envBackup };
    delete process.env.TTS_API_KEY;
    process.env.TTS_PROVIDER = "edge";
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "jx-tts-srv-"));
    setTtsCacheRootForTests(tmpDir);
  });

  afterEach(() => {
    process.env = envBackup;
    setTtsCacheRootForTests(null);
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("edge is available without API key", () => {
    expect(getActiveProvider()).toBe("edge");
    expect(isCloudTtsAvailable()).toBe(true);
  });

  it("azure without key is unavailable", () => {
    process.env.TTS_PROVIDER = "azure";
    expect(isCloudTtsAvailable()).toBe(false);
  });

  it("rateToProsody maps reader rates", () => {
    expect(rateToProsody(0.75)).toBe("-25%");
    expect(rateToProsody(1)).toBe("+0%");
    expect(rateToProsody(1.25)).toBe("+25%");
  });

  it("synthesizes via edge and writes disk cache", async () => {
    const text = "观自在菩萨";
    const buf = await synthesizeSpeech(text, 1);
    expect(buf.toString()).toBe("edge-audio");
    expect(synthesizeEdgeSpeech).toHaveBeenCalledTimes(1);

    const key = buildCacheKey("edge", "zh-CN-XiaoxiaoNeural", 1, text);
    expect(getCachedAudio(key)?.toString()).toBe("edge-audio");

    await synthesizeSpeech(text, 1);
    expect(synthesizeEdgeSpeech).toHaveBeenCalledTimes(1);
  });
});
