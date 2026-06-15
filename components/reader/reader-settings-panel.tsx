"use client";

/**
 * 阅读设置面板（字号、显示、朗读偏好）
 * @author 代长亚
 */
import { useEffect, useState, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { stepFontSize } from "@/components/reader/reader-preferences";
import { updateReaderPrefs, loadReaderPrefs } from "@/components/reader/reader-preferences";
import {
  cycleSpeechRate,
  loadSpeechEngine,
  loadSpeechRate,
  saveSpeechEngine,
  saveSpeechRate,
} from "@/lib/reader/speech/prefs";
import type { SpeechEngine, SpeechRate } from "@/lib/reader/speech/types";
import { cn } from "@/lib/utils";

const LEADING_LABELS = {
  normal: "紧凑",
  relaxed: "宽松",
  loose: "更宽",
} as const;

const LEADING_ORDER = ["normal", "relaxed", "loose"] as const;

function SettingsRow({
  label,
  children,
  testId,
}: {
  label: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg px-1 py-2"
      data-testid={testId}
    >
      <span className="text-sm text-[var(--foreground)]">{label}</span>
      {children}
    </div>
  );
}

function ToggleChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1 text-xs transition-colors",
        active
          ? "border-[var(--jx-accent-cinnabar)] bg-[var(--jx-accent-cinnabar)]/10 text-[var(--jx-accent-cinnabar)]"
          : "border-[var(--jx-border)] text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]",
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function ReaderSettingsPanel({
  open,
  onOpenChange,
  onFontChange,
  onPinyinChange,
  showTraditional,
  onToggleTraditional,
  hasColloquial,
  vernacular,
  onToggleVernacular,
  cloudAvailable = false,
  speechEngine: speechEngineProp,
  speechRate: speechRateProp,
  onSpeechEngineChange,
  onSpeechRateChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFontChange?: () => void;
  onPinyinChange?: (enabled: boolean) => void;
  showTraditional?: boolean;
  onToggleTraditional?: () => void;
  hasColloquial?: boolean;
  vernacular?: boolean;
  onToggleVernacular?: () => void;
  cloudAvailable?: boolean;
  speechEngine?: SpeechEngine;
  speechRate?: SpeechRate;
  onSpeechEngineChange?: (engine: SpeechEngine) => void;
  onSpeechRateChange?: (rate: SpeechRate) => void;
}) {
  const [leading, setLeading] = useState<"normal" | "relaxed" | "loose">("relaxed");
  const [pinyin, setPinyin] = useState(false);
  const [speechEngine, setSpeechEngine] = useState<SpeechEngine>("browser");
  const [speechRate, setSpeechRate] = useState<SpeechRate>(1);

  useEffect(() => {
    const prefs = loadReaderPrefs();
    setLeading(prefs.leading);
    setPinyin(prefs.pinyin);
    onPinyinChange?.(prefs.pinyin);
    setSpeechEngine(loadSpeechEngine());
    setSpeechRate(loadSpeechRate());
  }, [onPinyinChange, open]);

  useEffect(() => {
    if (speechEngineProp) setSpeechEngine(speechEngineProp);
  }, [speechEngineProp]);

  useEffect(() => {
    if (speechRateProp) setSpeechRate(speechRateProp);
  }, [speechRateProp]);

  function cycleLeading() {
    const idx = LEADING_ORDER.indexOf(leading);
    const next = LEADING_ORDER[(idx + 1) % LEADING_ORDER.length];
    setLeading(next);
    updateReaderPrefs({ leading: next });
  }

  function togglePinyin() {
    const next = !pinyin;
    setPinyin(next);
    updateReaderPrefs({ pinyin: next });
    onPinyinChange?.(next);
  }

  function toggleSpeechEngine() {
    const next: SpeechEngine = speechEngine === "cloud" ? "browser" : "cloud";
    setSpeechEngine(next);
    saveSpeechEngine(next);
    onSpeechEngineChange?.(next);
  }

  function cycleRate() {
    const next = cycleSpeechRate(speechRate);
    setSpeechRate(next);
    saveSpeechRate(next);
    onSpeechRateChange?.(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-md:top-auto max-md:bottom-0 max-md:max-h-[85vh] max-md:translate-y-0 max-md:rounded-b-none max-md:data-[state=open]:slide-in-from-bottom-full"
        data-testid="reader-settings-panel"
      >
        <DialogHeader>
          <DialogTitle>阅读设置</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <p className="jx-section-label mb-2">显示</p>
          <SettingsRow label="字号">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="缩小字号"
                data-testid="reader-tool-font-down"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--jx-border)] text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
                onClick={() => {
                  stepFontSize(-1);
                  onFontChange?.();
                }}
              >
                <Minus className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="放大字号"
                data-testid="reader-tool-font-up"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--jx-border)] text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
                onClick={() => {
                  stepFontSize(1);
                  onFontChange?.();
                }}
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </SettingsRow>

          <SettingsRow label="行距">
            <button
              type="button"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={cycleLeading}
            >
              {LEADING_LABELS[leading]}
            </button>
          </SettingsRow>

          <SettingsRow label="拼音">
            <ToggleChip active={pinyin} label={pinyin ? "开" : "关"} onClick={togglePinyin} />
          </SettingsRow>

          {onToggleTraditional && (
            <SettingsRow label="繁体">
              <ToggleChip
                active={!!showTraditional}
                label={showTraditional ? "繁" : "简"}
                onClick={onToggleTraditional}
              />
            </SettingsRow>
          )}

          {hasColloquial && onToggleVernacular && (
            <SettingsRow label="白话">
              <ToggleChip
                active={!!vernacular}
                label={vernacular ? "白话" : "原文"}
                onClick={onToggleVernacular}
              />
            </SettingsRow>
          )}
        </div>

        <div className="space-y-1 border-t border-[var(--jx-border)]/40 pt-4">
          <p className="jx-section-label mb-2">朗读</p>
          <SettingsRow label="语速" testId="reader-settings-speech-rate">
            <button
              type="button"
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={cycleRate}
            >
              {speechRate}x
            </button>
          </SettingsRow>
          {cloudAvailable && (
            <SettingsRow label="引擎" testId="reader-settings-speech-engine">
              <ToggleChip
                active={speechEngine === "cloud"}
                label={speechEngine === "cloud" ? "高品质" : "浏览器"}
                onClick={toggleSpeechEngine}
              />
            </SettingsRow>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
