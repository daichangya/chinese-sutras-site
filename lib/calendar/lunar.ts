/**
 * 农历换算（lunar-javascript 封装）
 * @author 代长亚
 */
import { Solar } from "lunar-javascript";
import type { LunarInfo } from "./types";
import { parseIsoDate } from "./today";

export function getLunarInfo(isoDate: string): LunarInfo {
  const [y, m, d] = isoDate.split("-").map(Number);
  const solar = Solar.fromYmd(y!, m!, d!);
  const lunar = solar.getLunar();
  const rawMonth = lunar.getMonth();
  const month = Math.abs(rawMonth);
  const day = lunar.getDay();

  return {
    year: lunar.getYear(),
    month,
    day,
    isLeapMonth: rawMonth < 0,
    monthLabel: lunar.getMonthInChinese(),
    dayLabel: lunar.getDayInChinese(),
    label: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
  };
}

export function formatGregorianLabel(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return date.toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
  });
}

export function getDaysInGregorianMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
