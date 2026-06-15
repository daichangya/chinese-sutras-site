/**
 * 阅读器朗读控制条（手机底栏 / 桌面 slim 条）
 * @author 代长亚
 */
"use client";

import { ChevronLeft, ChevronRight, Pause, Play, Square, Volume2 } from "lucide-react";
import type { SpeechEngine, SpeechRate, SpeechState } from "@/lib/reader/speech/types";
import { cn } from "@/lib/utils";

export function ReaderSpeechBar({
  visible,
  state,
  engine,
  rate,
  progress,
  fallbackNote,
  cloudAvailable,
  sutraTitle,
  onTogglePause,
  onStop,
  onSkipPrev,
  onSkipNext,
  onCycleRate,
  onSetEngine,
  fixed = true,
}: {
  visible: boolean;
  state: SpeechState;
  engine: SpeechEngine;
  rate: SpeechRate;
  progress: { index: number; total: number };
  fallbackNote: string | null;
  cloudAvailable: boolean;
  sutraTitle: string;
  onTogglePause: () => void;
  onStop: () => void;
  onSkipPrev: () => void;
  onSkipNext: () => void;
  onCycleRate: () => void;
  onSetEngine: (engine: SpeechEngine) => void;
  /** @deprecated 统一使用响应式定位，保留参数兼容 */
  fixed?: boolean;
}) {
  if (!visible) return null;

  const playing = state === "playing";
  const paused = state === "paused";
  const loading = state === "loading";
  const current = Math.min(progress.index + 1, progress.total || 1);

  return (
    <div
      data-testid="reader-speech-bar"
      className={cn(
        "jx-reader-speech-bar border-t border-[var(--jx-border)]/50 bg-[var(--jx-paper-elevated)]/95 backdrop-blur-md",
        "fixed bottom-0 left-0 right-0 z-50 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
      )}
      role="region"
      aria-label={`${sutraTitle} 朗读控制`}
    >
      {fallbackNote && (
        <p className="border-b border-[var(--jx-border)]/30 px-4 py-1 text-center text-[10px] text-[var(--jx-accent-cinnabar)]">
          {fallbackNote}
        </p>
      )}
      {engine === "cloud" && (
        <p className="border-b border-[var(--jx-border)]/20 px-4 py-0.5 text-center text-[10px] text-[var(--jx-muted-label)] md:hidden">
          高品质朗读：支持锁屏控制
        </p>
      )}
      {engine === "browser" && (
        <p className="border-b border-[var(--jx-border)]/20 px-4 py-0.5 text-center text-[10px] text-[var(--jx-muted-label)] md:hidden">
          浏览器朗读：锁屏后可能暂停
        </p>
      )}
      <div className="flex items-center gap-2 px-3 py-2 md:px-4">
        <Volume2 className="hidden h-4 w-4 shrink-0 text-[var(--jx-gold)] sm:block" aria-hidden />

        <button
          type="button"
          onClick={onSkipPrev}
          className="rounded-md p-2 text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
          aria-label="上一段"
          data-testid="reader-speech-prev"
        >
          <ChevronLeft className="size-4" />
        </button>

        <button
          type="button"
          onClick={onTogglePause}
          disabled={loading}
          className="rounded-full bg-[var(--jx-accent-cinnabar)] p-2.5 text-white hover:bg-[var(--jx-accent-cinnabar-hover)] disabled:opacity-60"
          aria-label={playing ? "暂停" : paused ? "继续" : "播放"}
          data-testid="reader-speech-play"
        >
          {playing || loading ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onStop}
          className="rounded-md p-2 text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
          aria-label="停止朗读"
          data-testid="reader-speech-stop"
        >
          <Square className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={onSkipNext}
          className="rounded-md p-2 text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
          aria-label="下一段"
          data-testid="reader-speech-next"
        >
          <ChevronRight className="size-4" />
        </button>

        <span className="min-w-[3.5rem] text-center text-xs text-[var(--jx-muted-label)]">
          {progress.total > 0 ? `${current}/${progress.total}` : "—"}
        </span>

        <button
          type="button"
          onClick={onCycleRate}
          className="rounded-full border border-[var(--jx-border)] px-2 py-0.5 text-[10px] text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
          aria-label="切换语速"
          data-testid="reader-speech-rate"
        >
          {rate}x
        </button>

        {cloudAvailable ? (
          <button
            type="button"
            onClick={() => onSetEngine(engine === "cloud" ? "browser" : "cloud")}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px]",
              engine === "cloud"
                ? "border-[var(--jx-gold)]/50 bg-[var(--jx-gold)]/10 text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)]"
                : "border-[var(--jx-border)] text-[var(--muted)]",
            )}
            aria-pressed={engine === "cloud"}
            data-testid="reader-speech-engine"
          >
            {engine === "cloud" ? "高品质" : "原生"}
          </button>
        ) : (
          <span className="text-[10px] text-[var(--jx-muted-label)]">原生</span>
        )}
      </div>
    </div>
  );
}
