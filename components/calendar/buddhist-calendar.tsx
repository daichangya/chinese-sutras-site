"use client";

/**
 * 佛历月历（双栏仪式型布局）
 * @author 代长亚
 */
import { useMemo, useState } from "react";
import type { CalendarDay, FastingMode } from "@/lib/calendar/types";
import { getCalendarTodayKey } from "@/lib/calendar/today";
import { CalendarDayDetail } from "./calendar-day-detail";
import { CalendarFastingToggle } from "./calendar-fasting-toggle";
import { CalendarGrid } from "./calendar-grid";
import { CalendarMonthFestivals } from "./calendar-month-festivals";
import { CalendarMonthHeader } from "./calendar-month-header";

export function BuddhistCalendar({
  year,
  month,
  days,
  leadingBlanks,
  importedSutraSlugs,
}: {
  year: number;
  month: number;
  days: CalendarDay[];
  leadingBlanks: number;
  importedSutraSlugs: string[];
}) {
  const todayKey = getCalendarTodayKey();
  const [fastingMode, setFastingMode] = useState<FastingMode>("six");
  const [selected, setSelected] = useState<string>(todayKey);

  const selectedDay = useMemo(
    () => days.find((d) => d.isoDate === selected) ?? days[0],
    [days, selected],
  );

  const first = days[0];
  const last = days[days.length - 1];

  return (
    <div className="animate-jx-fade" data-testid="buddhist-calendar">
      <div className="share-card rounded-2xl border border-[var(--jx-border)] bg-gradient-to-br from-[var(--jx-paper-elevated)] via-[var(--jx-paper)] to-[rgb(139_37_0/0.03)] p-5 md:p-8 dark:from-[var(--jx-dark-surface)] dark:via-[var(--jx-dark-bg)] dark:to-stone-950">
        <CalendarMonthHeader year={year} month={month} first={first} last={last} />

        <div className="mt-6">
          <CalendarFastingToggle mode={fastingMode} onChange={setFastingMode} />
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)] lg:items-start">
          <CalendarGrid
            days={days}
            leadingBlanks={leadingBlanks}
            fastingMode={fastingMode}
            todayKey={todayKey}
            selected={selected}
            onSelect={setSelected}
          />

          {selectedDay && (
            <CalendarDayDetail
              day={selectedDay}
              isToday={selectedDay.isoDate === todayKey}
              importedSutraSlugs={importedSutraSlugs}
            />
          )}
        </div>

        <CalendarMonthFestivals days={days} selected={selected} onSelect={setSelected} />
      </div>
    </div>
  );
}
