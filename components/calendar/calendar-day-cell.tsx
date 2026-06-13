/**
 * 佛历单日格
 * @author 代长亚
 */
import type { CalendarDay, FastingMode } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";
import { hasMajorFestival, isFastingDay } from "./calendar-utils";

export function CalendarDayCell({
  day,
  fastingMode,
  isToday,
  isSelected,
  onSelect,
}: {
  day: CalendarDay;
  fastingMode: FastingMode;
  isToday: boolean;
  isSelected: boolean;
  onSelect: (isoDate: string) => void;
}) {
  const fasting = isFastingDay(day, fastingMode);
  const major = hasMajorFestival(day);
  const hasMinorOnly = day.festivals.length > 0 && !major;

  return (
    <button
      type="button"
      id={isToday ? "today" : undefined}
      data-testid={isToday ? "calendar-today" : undefined}
      onClick={() => onSelect(day.isoDate)}
      aria-selected={isSelected}
      aria-current={isToday ? "date" : undefined}
      className={cn(
        "relative min-h-[76px] rounded-lg border p-2 text-left transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jx-gold)]/60",
        isSelected && "jx-calendar-selected border-l-2 border-l-[var(--jx-accent-cinnabar)]",
        !isSelected && "border-[var(--jx-border)]/60 hover:bg-[var(--jx-paper-deep)]/60",
        isToday && "jx-calendar-today ring-1 ring-[var(--jx-gold)]/50",
        major && "jx-calendar-major-day",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-sm font-medium tabular-nums text-[var(--foreground)]">
          {day.gregorianDay}
        </span>
        {fasting && (
          <span
            className="rounded px-1 text-[9px] font-medium text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)]"
            aria-label="斋日"
          >
            斋
          </span>
        )}
      </div>
      <div className="mt-1 text-[10px] text-[var(--jx-muted-label)]">{day.lunar.dayLabel}</div>
      {(major || hasMinorOnly) && (
        <div className="mt-2 flex items-center gap-1" aria-hidden>
          {major && <span className="h-1.5 w-1.5 rounded-full bg-[var(--jx-gold)]" />}
          {hasMinorOnly && <span className="h-1 w-1 rounded-full bg-[var(--jx-muted-label)]/70" />}
        </div>
      )}
    </button>
  );
}
