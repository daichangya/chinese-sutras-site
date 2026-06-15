/**
 * 朗读控制器测试
 * @author 代长亚
 */
import { describe, expect, it, vi } from "vitest";
import { ReaderSpeechController } from "@/lib/reader/speech/reader-speech-controller";
import type { SpeechAdapter, SpeechRate } from "@/lib/reader/speech/types";
import type { ParagraphRow } from "@/lib/sutra/queries";

class MockAdapter implements SpeechAdapter {
  calls: string[] = [];
  stops = 0;
  delay = 0;

  isSupported() {
    return true;
  }

  speak(text: string, _rate: SpeechRate) {
    this.calls.push(text);
    return new Promise<void>((resolve) => {
      setTimeout(resolve, this.delay);
    });
  }

  pause() {}
  resume() {}
  stop() {
    this.stops += 1;
  }
}

const paragraphs: ParagraphRow[] = [
  {
    id: "a",
    sutraId: "s",
    chapterSeq: 1,
    seq: 1,
    text: "第一段。",
    colloquial: null,
    blockRole: "body",
  },
  {
    id: "b",
    sutraId: "s",
    chapterSeq: 1,
    seq: 2,
    text: "第二段。",
    colloquial: null,
    blockRole: "body",
  },
];

describe("ReaderSpeechController", () => {
  it("plays queue continuously", async () => {
    const adapter = new MockAdapter();
    const onParagraphChange = vi.fn();
    const controller = new ReaderSpeechController({ onParagraphChange });
    controller.setEngine("browser");
    (controller as unknown as { adapter: SpeechAdapter }).adapter = adapter;

    await controller.play(paragraphs, "a", {
      vernacular: false,
      showTraditional: false,
      traditionalTexts: {},
    }, "心经");

    expect(adapter.calls).toEqual(["第一段。", "第二段。"]);
    expect(onParagraphChange).toHaveBeenCalled();
    expect(controller.getState()).toBe("idle");
  });

  it("skipNext jumps to next paragraph", async () => {
    const adapter = new MockAdapter();
    adapter.delay = 50;
    const controller = new ReaderSpeechController({});
    (controller as unknown as { adapter: SpeechAdapter }).adapter = adapter;

    const playPromise = controller.play(paragraphs, "a", {
      vernacular: false,
      showTraditional: false,
      traditionalTexts: {},
    }, "心经");

    await new Promise((r) => setTimeout(r, 10));
    controller.skipNext();
    await playPromise;

    expect(adapter.calls[0]).toBe("第一段。");
    expect(adapter.calls.at(-1)).toBe("第二段。");
  });

  it("setEngine stops both adapters while playing", async () => {
    const browser = new MockAdapter();
    browser.delay = 100;
    const cloud = new MockAdapter();
    cloud.delay = 100;
    const controller = new ReaderSpeechController({});
    const ctl = controller as unknown as {
      browserAdapter: MockAdapter;
      cloudAdapter: MockAdapter;
      adapter: SpeechAdapter;
    };
    ctl.browserAdapter = browser;
    ctl.cloudAdapter = cloud;
    controller.setEngine("cloud");
    ctl.adapter = cloud;

    void controller.play(paragraphs, "a", {
      vernacular: false,
      showTraditional: false,
      traditionalTexts: {},
    }, "心经");

    await new Promise((r) => setTimeout(r, 10));
    controller.setEngine("browser");
    await new Promise((r) => setTimeout(r, 150));

    expect(cloud.stops).toBeGreaterThan(0);
    expect(browser.stops).toBeGreaterThan(0);
    expect(controller.getEngine()).toBe("browser");
  });
});
