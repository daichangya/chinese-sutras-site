/**
 * 佛历月历网格
 * @author 代长亚
 */
import type { CalendarDay, FastingMode } from "@/lib/calendar/types";
import { CALENDAR_WEEKDAYS } from "./calendar-utils";
import { CalendarDayCell } from "./calendar-day-cell";

export function CalendarGrid({
  days,
  leadingBlanks,
  fastingMode,
  todayKey,
  selected,
  onSelect,
}: {
  days: CalendarDay[];
  leadingBlanks: number;
  fastingMode: FastingMode;
  todayKey: string;
  selected: string;
  onSelect: (isoDate: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-[var(--jx-muted-label)]">
        {CALENDAR_WEEKDAYS.map((w) => (
          <div key={w} className="py-2 font-medium">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} aria-hidden />
        ))}
        {days.map((day) => (
          <CalendarDayCell
            key={day.isoDate}
            day={day}
            fastingMode={fastingMode}
            isToday={day.isoDate === todayKey}
            isSelected={selected === day.isoDate}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
