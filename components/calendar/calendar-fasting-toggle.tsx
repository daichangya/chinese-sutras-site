/**
 * 六斋 / 十斋分段切换
 * @author 代长亚
 */
import type { FastingMode } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

export function CalendarFastingToggle({
  mode,
  onChange,
}: {
  mode: FastingMode;
  onChange: (mode: FastingMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]/80 p-0.5"
      data-testid="fasting-mode-toggle"
      role="group"
      aria-label="斋日显示模式"
    >
      {(["six", "ten"] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs tracking-wide transition-colors duration-200 cursor-pointer",
            mode === value
              ? "bg-[var(--jx-accent-cinnabar)]/10 text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)] shadow-sm"
              : "text-[var(--jx-muted-label)] hover:text-[var(--foreground)]",
          )}
          aria-pressed={mode === value}
        >
          {value === "six" ? "六斋日" : "十斋日"}
        </button>
      ))}
    </div>
  );
}
