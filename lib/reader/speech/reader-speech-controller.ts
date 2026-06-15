/**
 * 阅读器连续朗读控制器
 * @author 代长亚
 */
import { CloudTtsAdapter } from "@/lib/reader/speech/cloud-tts-adapter";
import {
  buildSpeechQueue,
  type SpeechViewContext,
} from "@/lib/reader/speech/text-normalizer";
import type {
  SpeechAdapter,
  SpeechControllerCallbacks,
  SpeechEngine,
  SpeechRate,
  SpeechSegment,
  SpeechState,
} from "@/lib/reader/speech/types";
import { isSpeechCancelled } from "@/lib/reader/speech/types";
import { WebSpeechAdapter } from "@/lib/reader/speech/web-speech-adapter";
import {
  clearMediaSession,
  setMediaSessionPlaybackState,
  setupMediaSession,
} from "@/lib/reader/speech/media-session";
import type { ParagraphRow } from "@/lib/sutra/queries";

export class ReaderSpeechController {
  private queue: SpeechSegment[] = [];
  private index = 0;
  private state: SpeechState = "idle";
  private engine: SpeechEngine = "browser";
  private rate: SpeechRate = 1;
  private adapter: SpeechAdapter;
  private browserAdapter = new WebSpeechAdapter();
  private cloudAdapter = new CloudTtsAdapter();
  private callbacks: SpeechControllerCallbacks;
  private sutraTitle = "";
  private generation = 0;
  private loopRunning = false;

  constructor(callbacks: SpeechControllerCallbacks = {}) {
    this.callbacks = callbacks;
    this.adapter = this.browserAdapter;
  }

  getState(): SpeechState {
    return this.state;
  }

  getEngine(): SpeechEngine {
    return this.engine;
  }

  getRate(): SpeechRate {
    return this.rate;
  }

  getCurrentParagraphId(): string | undefined {
    return this.queue[this.index]?.paragraphId;
  }

  getProgress(): { index: number; total: number } {
    return { index: this.index, total: this.queue.length };
  }

  isActive(): boolean {
    return this.state !== "idle";
  }

  setEngine(engine: SpeechEngine) {
    if (this.engine === engine) return;

    const resume =
      this.state !== "idle" &&
      this.state !== "error" &&
      this.queue.length > 0;
    const idx = this.index;
    const queue = this.queue;
    const title = this.sutraTitle;

    this.engine = engine;
    this.adapter = engine === "cloud" ? this.cloudAdapter : this.browserAdapter;
    this.stopAllOutputs();

    if (!resume) return;

    this.generation += 1;
    this.queue = queue;
    this.index = idx;
    this.sutraTitle = title;
    this.loopRunning = false;
    void this.runLoop();
  }

  setRate(rate: SpeechRate) {
    this.rate = rate;
  }

  private stopAllOutputs() {
    this.browserAdapter.stop();
    this.cloudAdapter.stop();
  }

  private setState(state: SpeechState) {
    this.state = state;
    this.callbacks.onStateChange?.(state);
    if (this.engine === "cloud") {
      if (state === "playing") setMediaSessionPlaybackState("playing");
      else if (state === "paused") setMediaSessionPlaybackState("paused");
      else setMediaSessionPlaybackState("none");
    }
  }

  private bumpGeneration() {
    this.generation += 1;
    this.stopAllOutputs();
  }

  private findParagraphStart(targetId: string): number {
    return this.queue.findIndex((s) => s.paragraphId === targetId);
  }

  private findNextParagraphIndex(from: number): number {
    const currentId = this.queue[from]?.paragraphId;
    let i = from + 1;
    while (i < this.queue.length && this.queue[i]?.paragraphId === currentId) i += 1;
    return i;
  }

  private findPrevParagraphIndex(from: number): number {
    if (from <= 0) return 0;
    const currentId = this.queue[from]?.paragraphId;
    let i = from - 1;
    while (i > 0 && this.queue[i]?.paragraphId === currentId) i -= 1;
    const targetId = this.queue[i]?.paragraphId;
    while (i > 0 && this.queue[i - 1]?.paragraphId === targetId) i -= 1;
    return i;
  }

  private notifyProgress() {
    const seg = this.queue[this.index];
    if (seg) this.callbacks.onParagraphChange?.(seg.paragraphId);
    this.callbacks.onIndexChange?.(this.index, this.queue.length);
  }

  private setupSession(seg: SpeechSegment) {
    if (this.engine !== "cloud") return;
    setupMediaSession({
      title: this.sutraTitle,
      artist: `第 ${seg.seq} 段`,
      onPlay: () => this.resume(),
      onPause: () => this.pause(),
    });
  }

  async play(
    paragraphs: ParagraphRow[],
    startParagraphId: string | undefined,
    ctx: SpeechViewContext,
    sutraTitle: string,
  ) {
    this.stop();
    this.sutraTitle = sutraTitle;
    this.queue = buildSpeechQueue(paragraphs, startParagraphId, ctx);

    if (this.queue.length === 0) {
      this.setState("error");
      this.callbacks.onError?.("当前视图没有可朗读的内容");
      return;
    }

    this.index = 0;
    this.notifyProgress();
    await this.runLoop();
  }

  private async speakSegment(seg: SpeechSegment, gen: number): Promise<boolean> {
    this.setState("loading");
    this.setupSession(seg);

    try {
      this.setState("playing");
      await this.adapter.speak(seg.text, this.rate);
      return gen === this.generation;
    } catch (err) {
      if (isSpeechCancelled(err) || gen !== this.generation) return false;

      if (this.engine === "cloud") {
        this.callbacks.onEngineFallback?.("cloud", "browser");
        this.stopAllOutputs();
        this.engine = "browser";
        this.adapter = this.browserAdapter;
        try {
          await this.adapter.speak(seg.text, this.rate);
          return gen === this.generation;
        } catch (inner) {
          if (isSpeechCancelled(inner) || gen !== this.generation) return false;
          this.setState("error");
          this.callbacks.onError?.(
            inner instanceof Error ? inner.message : "朗读失败",
          );
          return false;
        }
      }

      this.setState("error");
      this.callbacks.onError?.(err instanceof Error ? err.message : "朗读失败");
      return false;
    }
  }

  private async runLoop() {
    if (this.loopRunning) return;
    this.loopRunning = true;
    const gen = this.generation;

    while (this.index < this.queue.length && gen === this.generation) {
      const seg = this.queue[this.index];
      if (!seg) break;

      if (seg.chunkIndex === 0) {
        this.callbacks.onParagraphChange?.(seg.paragraphId);
      }

      const ok = await this.speakSegment(seg, gen);
      if (!ok || gen !== this.generation) break;

      this.index += 1;
      this.callbacks.onIndexChange?.(this.index, this.queue.length);
    }

    this.loopRunning = false;
    if (gen === this.generation && this.index >= this.queue.length) {
      this.setState("idle");
      clearMediaSession();
      this.queue = [];
      this.index = 0;
    }
  }

  pause() {
    if (this.state !== "playing") return;
    this.adapter.pause();
    this.setState("paused");
  }

  resume() {
    if (this.state !== "paused") return;
    this.adapter.resume();
    this.setState("playing");
  }

  togglePause() {
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
  }

  stop() {
    this.bumpGeneration();
    this.queue = [];
    this.index = 0;
    this.loopRunning = false;
    this.setState("idle");
    clearMediaSession();
  }

  skipNext() {
    if (this.queue.length === 0) return;
    const next = this.findNextParagraphIndex(this.index);
    this.bumpGeneration();
    this.loopRunning = false;
    if (next >= this.queue.length) {
      this.stop();
      return;
    }
    this.index = next;
    this.notifyProgress();
    void this.runLoop();
  }

  skipPrev() {
    if (this.queue.length === 0) return;
    const prev = this.findPrevParagraphIndex(this.index);
    this.bumpGeneration();
    this.loopRunning = false;
    this.index = prev;
    this.notifyProgress();
    void this.runLoop();
  }
}
