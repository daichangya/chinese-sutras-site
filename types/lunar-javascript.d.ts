/**
 * lunar-javascript 类型声明
 * @author 代长亚
 */
declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    getYear(): number;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getMonth(): number;
    getDay(): number;
    isLeap(): boolean;
    getYearInGanZhi(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
  }
}
