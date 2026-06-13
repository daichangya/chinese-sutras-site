/**
 * 佛历「今日」键（Asia/Shanghai）
 * @author 代长亚
 */

const TZ = "Asia/Shanghai";

/** 将 Date 格式化为 YYYY-MM-DD（上海时区） */
export function formatIsoDateInShanghai(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

/** 当前上海时区的今日键 */
export function getCalendarTodayKey(now = new Date()): string {
  return formatIsoDateInShanghai(now);
}

/** 解析 YYYY-MM-DD 为上海时区正午的 Date（用于农历换算） */
export function parseIsoDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, 4, 0, 0));
}
