/**
 * 朗读偏好默认值
 * @author 代长亚
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSpeechEngine, saveSpeechEngine } from "@/lib/reader/speech/prefs";

describe("speech prefs", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to cloud (Edge TTS) when unset", () => {
    expect(loadSpeechEngine()).toBe("cloud");
  });

  it("respects browser override", () => {
    saveSpeechEngine("browser");
    expect(loadSpeechEngine()).toBe("browser");
  });
});
