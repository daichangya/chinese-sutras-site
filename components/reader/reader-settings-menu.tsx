"use client";

/**
 * 阅读设置下拉（行距、拼音）
 * @author 代长亚
 */
import { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateReaderPrefs, loadReaderPrefs } from "@/components/reader/reader-preferences";

const LEADING_LABELS = {
  normal: "紧凑",
  relaxed: "宽松",
  loose: "更宽",
} as const;

const LEADING_ORDER = ["normal", "relaxed", "loose"] as const;

export function ReaderSettingsMenu({
  onPinyinChange,
}: {
  onPinyinChange?: (enabled: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [leading, setLeading] = useState<"normal" | "relaxed" | "loose">("relaxed");
  const [pinyin, setPinyin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = loadReaderPrefs();
    setLeading(p.leading);
    setPinyin(p.pinyin);
    onPinyinChange?.(p.pinyin);
  }, [onPinyinChange]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

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

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 border-[var(--jx-border)] px-2.5 text-xs text-[var(--muted)]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="阅读设置"
        data-testid="reader-settings-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Settings2 className="size-3.5" aria-hidden="true" />
        设置
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-2 shadow-[var(--jx-card-shadow)]"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--jx-paper-deep)]"
            onClick={cycleLeading}
          >
            <span>行距</span>
            <span className="text-[var(--muted)]">{LEADING_LABELS[leading]}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--jx-paper-deep)]"
            onClick={togglePinyin}
            aria-pressed={pinyin}
          >
            <span>拼音</span>
            <span className={pinyin ? "text-[var(--jx-accent-cinnabar)]" : "text-[var(--muted)]"}>
              {pinyin ? "开" : "关"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
