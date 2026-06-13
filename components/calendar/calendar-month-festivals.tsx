/**
 * 本月节日一览
 * @author 代长亚
 */
import type { CalendarDay } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";
import { collectMonthFestivals } from "./calendar-utils";
import { FestivalTierBadge } from "./festival-tier-badge";

export function CalendarMonthFestivals({
  days,
  selected,
  onSelect,
}: {
  days: CalendarDay[];
  selected: string;
  onSelect: (isoDate: string) => void;
}) {
  const items = collectMonthFestivals(days);
  if (items.length === 0) return null;

  return (
    <section className="mt-8" data-testid="calendar-month-festivals">
      <p className="jx-section-label text-[var(--jx-gold)]">本月节日</p>
      <ul className="mt-4 divide-y divide-[var(--jx-border)]/60 rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]/40">
        {items.map(({ day, festival }) => (
          <li key={`${day.isoDate}-${festival.id}`}>
            <button
              type="button"
              onClick={() => onSelect(day.isoDate)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer hover:bg-[var(--jx-paper-deep)]/60",
                selected === day.isoDate && "bg-[var(--jx-paper-deep)]",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--foreground)]">{festival.name}</p>
                <p className="mt-0.5 text-xs text-[var(--jx-muted-label)]">
                  {day.gregorianMonth}月{day.gregorianDay}日 · 农历{day.lunar.monthLabel}
                  {day.lunar.dayLabel}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <FestivalTierBadge tier={festival.tier} />
                <span className="text-xs tabular-nums text-[var(--jx-muted-label)]">
                  {day.gregorianDay}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
