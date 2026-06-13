/**
 * 佛历单日解析
 * @author 代长亚
 */
import { toBuddhistYear } from "./era";
import { findFestivalsForLunar } from "./festivals";
import { isSixFastingDay, isTenFastingDay } from "./fasting";
import { getLunarInfo } from "./lunar";
import type { CalendarDay } from "./types";

export function resolveCalendarDay(isoDate: string): CalendarDay {
  const [y, m, d] = isoDate.split("-").map(Number);
  const lunar = getLunarInfo(isoDate);
  const festivals = findFestivalsForLunar(lunar);

  return {
    isoDate,
    gregorianYear: y!,
    gregorianMonth: m!,
    gregorianDay: d!,
    buddhistYear: toBuddhistYear(y!),
    lunar,
    festivals,
    isSixFastingDay: isSixFastingDay(lunar.day),
    isTenFastingDay: isTenFastingDay(lunar.day),
  };
}

export function resolveCalendarMonth(year: number, month: number): CalendarDay[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push(resolveCalendarDay(iso));
  }
  return days;
}
