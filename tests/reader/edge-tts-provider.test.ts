/**
 * Edge TTS 提供商集成（需外网）
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { synthesizeEdgeSpeech } from "@/lib/reader/speech/edge-tts-provider";

describe("edge-tts-provider", () => {
  it(
    "synthesizes mp3 audio",
    async () => {
      const buf = await synthesizeEdgeSpeech(
        "观自在菩萨",
        "zh-CN-XiaoxiaoNeural",
        "+0%",
      );
      expect(buf.length).toBeGreaterThan(1000);
      expect(buf[0]).toBe(0xff);
      expect((buf[1] & 0xe0) === 0xe0 || buf.toString("ascii", 0, 3) === "ID3").toBe(true);
    },
    15_000,
  );
});
