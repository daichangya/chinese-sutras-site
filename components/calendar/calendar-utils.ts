/**
 * 佛历 UI 工具函数
 * @author 代长亚
 */
import type { CalendarDay, FastingMode, FestivalEntry } from "@/lib/calendar/types";

export const CALENDAR_WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"] as const;

export function prevMonth(year: number, month: number) {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

export function nextMonth(year: number, month: number) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export function isFastingDay(day: CalendarDay, mode: FastingMode): boolean {
  return mode === "six" ? day.isSixFastingDay : day.isTenFastingDay;
}

export function hasMajorFestival(day: CalendarDay): boolean {
  return day.festivals.some((f) => f.tier === "major");
}

export function primaryFestival(day: CalendarDay): FestivalEntry | undefined {
  return day.festivals.find((f) => f.tier === "major") ?? day.festivals[0];
}

export function collectMonthFestivals(days: CalendarDay[]) {
  const items: Array<{ day: CalendarDay; festival: FestivalEntry }> = [];
  for (const day of days) {
    for (const festival of day.festivals) {
      items.push({ day, festival });
    }
  }
  return items.sort((a, b) => a.day.gregorianDay - b.day.gregorianDay);
}
