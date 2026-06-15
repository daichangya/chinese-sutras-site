/**
 * 阅读器朗读类型定义
 * @author 代长亚
 */

export type SpeechEngine = "browser" | "cloud";
export type SpeechRate = 0.75 | 1 | 1.25;
export type SpeechState = "idle" | "loading" | "playing" | "paused" | "error";

export type SpeechSegment = {
  paragraphId: string;
  seq: number;
  text: string;
  chunkIndex: number;
  chunkTotal: number;
};

export interface SpeechAdapter {
  speak(text: string, rate: SpeechRate): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  isSupported(): boolean;
}

export type SpeechControllerCallbacks = {
  onStateChange?: (state: SpeechState) => void;
  onParagraphChange?: (paragraphId: string) => void;
  onIndexChange?: (index: number, total: number) => void;
  onError?: (message: string) => void;
  onEngineFallback?: (from: SpeechEngine, to: SpeechEngine) => void;
};

/** 朗读被用户切换/跳段取消，非真实失败 */
export class SpeechCancelledError extends Error {
  constructor() {
    super("speech cancelled");
    this.name = "SpeechCancelledError";
  }
}

export function isSpeechCancelled(err: unknown): boolean {
  return err instanceof SpeechCancelledError;
}
