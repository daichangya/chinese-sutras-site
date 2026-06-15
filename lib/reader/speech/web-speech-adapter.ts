/**
 * 浏览器 Web Speech API 适配器
 * @author 代长亚
 */
import type { SpeechAdapter, SpeechRate } from "@/lib/reader/speech/types";
import { SpeechCancelledError } from "@/lib/reader/speech/types";

/** 优先本地中文语音，避免选用不可用的网络语音导致无声 */
export function pickZhVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  return (
    voices.find((v) => v.lang.startsWith("zh-CN") && v.localService) ??
    voices.find((v) => v.lang.startsWith("zh-CN")) ??
    voices.find((v) => v.lang.startsWith("zh") && v.localService) ??
    voices.find((v) => v.lang.startsWith("zh"))
  );
}

/** 等待 voices 列表就绪（Chrome / Safari 首次常为 []） */
export function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  const synth = window.speechSynthesis;
  const cached = synth.getVoices();
  if (cached.length > 0) return Promise.resolve(cached);

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(synth.getVoices());
    };

    synth.addEventListener("voiceschanged", finish, { once: true });
    synth.getVoices();
    window.setTimeout(finish, 300);
  });
}

/** 页面加载后预热语音列表，降低首次点击无声概率 */
export function primeSpeechSynthesis(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  void loadSpeechVoices();
}

export class WebSpeechAdapter implements SpeechAdapter {
  private utterance: SpeechSynthesisUtterance | null = null;
  private startTimer: number | null = null;
  private keepAliveTimer: number | null = null;
  private generation = 0;

  isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  private clearTimers() {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private assertActive(gen: number) {
    if (gen !== this.generation) {
      throw new SpeechCancelledError();
    }
  }

  async speak(text: string, rate: SpeechRate): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("当前浏览器不支持语音合成");
    }

    this.stop();
    const gen = this.generation;

    const voices = await loadSpeechVoices();
    this.assertActive(gen);
    const voice = pickZhVoice(voices);

    return new Promise((resolve, reject) => {
      this.startTimer = window.setTimeout(() => {
        this.startTimer = null;
        if (gen !== this.generation) {
          resolve();
          return;
        }

        let settled = false;

        const finish = (ok: boolean, err?: Error) => {
          if (settled) return;
          settled = true;
          this.clearTimers();
          this.utterance = null;
          if (gen !== this.generation) {
            resolve();
            return;
          }
          if (ok) resolve();
          else reject(err ?? new Error("语音合成失败"));
        };

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = rate;
        utterance.volume = 1;
        if (voice) utterance.voice = voice;

        utterance.onend = () => finish(true);
        utterance.onerror = (e) => {
          if (e.error === "interrupted" || e.error === "canceled") {
            finish(true);
            return;
          }
          finish(false, new Error(e.error || "语音合成失败"));
        };

        this.utterance = utterance;
        window.speechSynthesis.speak(utterance);

        // Chrome 偶发 cancel 后首句不播：短暂未 speaking 则重试一次
        window.setTimeout(() => {
          if (settled || gen !== this.generation) return;
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            window.speechSynthesis.speak(utterance);
          }
        }, 150);

        // 防止 Chrome 长时间朗读中途静默
        this.keepAliveTimer = window.setInterval(() => {
          if (gen !== this.generation) return;
          if (!window.speechSynthesis.speaking || window.speechSynthesis.paused) return;
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }, 10_000);
      }, 40);
    });
  }

  pause(): void {
    if (this.isSupported()) window.speechSynthesis.pause();
  }

  resume(): void {
    if (this.isSupported()) window.speechSynthesis.resume();
  }

  stop(): void {
    this.generation += 1;
    this.clearTimers();
    if (this.isSupported()) window.speechSynthesis.cancel();
    this.utterance = null;
  }
}
