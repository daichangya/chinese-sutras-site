/**
 * 汉传佛历纪年（公历 + 1027）
 * @author 代长亚
 */

export const BUDDHIST_ERA_OFFSET = 1027;

export function toBuddhistYear(gregorianYear: number): number {
  return gregorianYear + BUDDHIST_ERA_OFFSET;
}
