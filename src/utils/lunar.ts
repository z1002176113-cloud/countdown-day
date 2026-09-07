/**
 * 农历工具函数
 * 基于 lunar-typescript 实现公历 ↔ 农历转换、格式化。
 * 农历月份用带符号整数表示：正数 = 正常月，负数 = 闰月（如 -6 = 闰六月）。
 */
import { Lunar, LunarMonth, LunarYear, Solar } from 'lunar-typescript';

import type { CalendarType } from '@/types/countdown';
import { formatDateKey, getWeekdayLabel } from '@/utils/date';

/** 农历月份中文名（下标 1~12，0 占位） */
const MONTH_NAMES = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

/** 农历日中文名（1~30） */
const DAY_NAMES = [
  '',
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

/**
 * 生成某年份可用的农历月份列表，按历法顺序排列。
 * 闰月紧跟在其对应正月之后（如 [6, -6, 7]）。
 * 返回值：数字数组，正数为正常月，负数为闰月。
 */
export function getLunarMonthOptions(year: number): number[] {
  const leapMonth = LunarYear.fromYear(year).getLeapMonth(); // 0 表示无闰月
  const months: number[] = [];
  for (let m = 1; m <= 12; m++) {
    months.push(m);
    if (m === leapMonth) {
      months.push(-m); // 闰月紧随其后
    }
  }
  return months;
}

/**
 * 返回指定农历月份的天数（29 或 30）。
 * @param year 农历年
 * @param month 月份数字（正数或负数闰月）
 */
export function getLunarMonthDayCount(year: number, month: number): number {
  const lm = LunarMonth.fromYm(year, month);
  return lm ? lm.getDayCount() : 30; // 保守回退
}

/**
 * 将公历 YYYY-MM-DD 转为农历各字段（供选择器初始化用）。
 * 注意：库的 getMonth() 对闰月已返回负数（如闰六月 = -6），直接透传即可。
 */
export function solarToLunarFields(solarKey: string) {
  const [y, m, d] = solarKey.split('-').map(Number);
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(), // 闰月为负数
    day: lunar.getDay(),
  };
}

/** 将农历字段转为公历 YYYY-MM-DD（供选择器每次变更后调用） */
export function lunarToSolarKey(year: number, month: number, day: number): string {
  const lunar = Lunar.fromYmd(year, month, day);
  const s = lunar.getSolar();
  return `${s.getYear()}-${String(s.getMonth()).padStart(2, '0')}-${String(s.getDay()).padStart(2, '0')}`;
}

/**
 * 格式化农历日期展示。
 * @param solarKey  公历 YYYY-MM-DD
 * @param calendarType  历法类型（lunar 时返回农历，solar 时返回公历+星期）
 */
export function formatLunarDate(solarKey: string): string {
  const [y, m, d] = solarKey.split('-').map(Number);
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  const monthName = `${MONTH_NAMES[Math.abs(lunar.getMonth())]}月`;
  const leapPrefix = lunar.getMonth() < 0 || lunar.getMonthInChinese().startsWith('闰') ? '闰' : '';
  return `农历${lunar.getYearInGanZhi()}年${leapPrefix}${monthName}${DAY_NAMES[lunar.getDay()]}`;
}

/**
 * 按历法类型统一格式化「日期 + 星期几」。
 * 公历：'2026年9月4日 星期五'
 * 农历：'农历丙午年七月廿三 星期五'
 */
export function formatDisplayDate(solarKey: string, calendarType: CalendarType): string {
  const weekday = getWeekdayLabel(solarKey);
  return calendarType === 'lunar'
    ? `${formatLunarDate(solarKey)} ${weekday}`
    : `${formatDateKey(solarKey)} ${weekday}`;
}
