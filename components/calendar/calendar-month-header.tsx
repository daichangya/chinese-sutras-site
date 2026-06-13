/**
 * 佛历月历顶栏
 * @author 代长亚
 */
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarDay } from "@/lib/calendar/types";
import { prevMonth, nextMonth } from "./calendar-utils";

export function CalendarMonthHeader({
  year,
  month,
  first,
  last,
}: {
  year: number;
  month: number;
  first?: CalendarDay;
  last?: CalendarDay;
}) {
  const prev = prevMonth(year, month);
  const next = nextMonth(year, month);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="jx-section-label text-[var(--jx-gold)]">佛历</p>
        <h1 className="jx-hero-title mt-2 text-3xl md:text-4xl">
          {year}年{month}月
        </h1>
        {first && last && (
          <p className="mt-2 text-sm text-[var(--jx-muted-label)]">
            农历 {first.lunar.monthLabel}月{first.lunar.dayLabel}
            {first.lunar.month !== last.lunar.month || first.lunar.year !== last.lunar.year
              ? ` — ${last.lunar.monthLabel}月${last.lunar.dayLabel}`
              : ""}
            {" · "}
            佛历{first.buddhistYear}年
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/calendar?year=${prev.year}&month=${prev.month}`}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--jx-border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--jx-paper-deep)] cursor-pointer"
          aria-label="上月"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          上月
        </Link>
        <Link
          href={`/calendar?year=${next.year}&month=${next.month}`}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--jx-border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors duration-200 hover:bg-[var(--jx-paper-deep)] cursor-pointer"
          aria-label="下月"
        >
          下月
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
