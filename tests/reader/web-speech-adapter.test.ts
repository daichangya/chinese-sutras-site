/**
 * Web Speech 语音选择测试
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { pickZhVoice } from "@/lib/reader/speech/web-speech-adapter";

function voice(
  name: string,
  lang: string,
  localService: boolean,
): SpeechSynthesisVoice {
  return { name, lang, localService } as SpeechSynthesisVoice;
}

describe("pickZhVoice", () => {
  it("prefers local zh-CN voice over network voice", () => {
    const picked = pickZhVoice([
      voice("Google 普通话", "zh-CN", false),
      voice("Tingting", "zh-CN", true),
    ]);
    expect(picked?.name).toBe("Tingting");
  });

  it("falls back to any zh-CN voice", () => {
    const picked = pickZhVoice([voice("Google 普通话", "zh-CN", false)]);
    expect(picked?.name).toBe("Google 普通话");
  });

  it("falls back to other zh voices", () => {
    const picked = pickZhVoice([voice("Meijia", "zh-TW", true)]);
    expect(picked?.name).toBe("Meijia");
  });
});
