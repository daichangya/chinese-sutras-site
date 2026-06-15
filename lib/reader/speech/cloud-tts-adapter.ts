/**
 * 云端 TTS 适配器（HTMLAudioElement 播放）
 * @author 代长亚
 */
import type { SpeechAdapter, SpeechRate } from "@/lib/reader/speech/types";
import { SpeechCancelledError } from "@/lib/reader/speech/types";

export class CloudTtsAdapter implements SpeechAdapter {
  private audio: HTMLAudioElement | null = null;
  private objectUrl: string | null = null;
  private generation = 0;

  isSupported(): boolean {
    return typeof window !== "undefined" && typeof Audio !== "undefined";
  }

  private revokeUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  private assertActive(gen: number) {
    if (gen !== this.generation) {
      throw new SpeechCancelledError();
    }
  }

  async speak(text: string, rate: SpeechRate): Promise<void> {
    this.stop();
    const gen = this.generation;

    const res = await fetch("/api/reader/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, rate }),
    });

    this.assertActive(gen);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "高品质朗读不可用");
    }

    const blob = await res.blob();
    this.assertActive(gen);

    const url = URL.createObjectURL(blob);
    this.objectUrl = url;

    return new Promise((resolve, reject) => {
      this.assertActive(gen);

      const audio = new Audio(url);
      audio.playbackRate = 1;
      this.audio = audio;

      audio.onended = () => {
        if (gen !== this.generation) {
          resolve();
          return;
        }
        this.revokeUrl();
        this.audio = null;
        resolve();
      };
      audio.onerror = () => {
        this.revokeUrl();
        this.audio = null;
        reject(new Error("音频播放失败"));
      };

      void audio.play().catch((err) => {
        if (gen !== this.generation) {
          resolve();
          return;
        }
        reject(err);
      });
    });
  }

  pause(): void {
    this.audio?.pause();
  }

  resume(): void {
    void this.audio?.play();
  }

  stop(): void {
    this.generation += 1;
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio = null;
    }
    this.revokeUrl();
  }
}
