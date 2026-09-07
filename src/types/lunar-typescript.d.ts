declare module 'lunar-typescript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Solar;
    static fromDate(date: Date): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    toYmd(): string;
    toYmdHms(): string;
    getWeek(): number;
    getWeekInChinese(): string;
    getLunar(): Lunar;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    static fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): Lunar;
    static fromSolar(solar: Solar): Lunar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getYearInChinese(): string;
    getYearInGanZhi(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getWeekInChinese(): string;
    getSolar(): Solar;
    toString(): string;
  }

  export class LunarYear {
    static fromYear(year: number): LunarYear;
    getYear(): number;
    getLeapMonth(): number;
    getMonths(): LunarMonth[];
    getMonthsInYear(): LunarMonth[];
    toString(): string;
  }

  export class LunarMonth {
    static fromYm(year: number, month: number): LunarMonth | null;
    getYear(): number;
    getMonth(): number;
    isLeap(): boolean;
    getDayCount(): number;
    getFirstJulianDay(): number;
    toString(): string;
  }
}
