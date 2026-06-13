/**
 * 六斋日 / 十斋日判定
 * @author 代长亚
 */

const SIX_FASTING_DAYS = new Set([8, 14, 15, 23, 29, 30]);
const TEN_FASTING_DAYS = new Set([1, 8, 14, 15, 18, 23, 24, 28, 29, 30]);

export function isSixFastingDay(lunarDay: number): boolean {
  return SIX_FASTING_DAYS.has(lunarDay);
}

export function isTenFastingDay(lunarDay: number): boolean {
  return TEN_FASTING_DAYS.has(lunarDay);
}
