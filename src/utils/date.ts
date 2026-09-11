/**
 * 时间 / 日期工具函数
 * 统一处理「目标日期字符串（YYYY-MM-DD）」的解析、格式化与天数差计算。
 * 所有日期均按「本地时区」计算，避免跨时区导致天数差为 0。
 */

/** 一天的毫秒数 */
const DAY_MS = 24 * 60 * 60 * 1000;

/** 数字补零到两位，如 3 -> '03' */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 把任意 Date 转成本地日期字符串 YYYY-MM-DD */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** 获取今天的日期字符串 YYYY-MM-DD */
export function getTodayKey(): string {
  return toDateKey(new Date());
}

/** 解析 YYYY-MM-DD 为本地时区「当天 0 点」的 Date */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * 计算目标日期距今天的天数差：diff = 目标日期 - 今天
 * 返回值 > 0 表示未来、= 0 表示今天、< 0 表示已过去
 */
export function getDaysDiff(targetKey: string): number {
  const target = parseDateKey(targetKey).getTime();
  const today = parseDateKey(getTodayKey()).getTime();
  return Math.round((target - today) / DAY_MS);
}

/**
 * 倒计时展示文案（固定规则，见 PRD 4.2）：
 * 未来「剩余 XX 天」；今天「今日」；过去「已过去 XX 天」
 */
export function formatCountdownLabel(diff: number): string {
  if (diff > 0) {
    return `剩余 ${diff} 天`;
  }
  if (diff === 0) {
    return '今日';
  }
  return `已过去 ${-diff} 天`;
}

/** 星期几标签，如 '星期五'；getDay() 返回 0=周日 1=周一 … 6=周六 */
const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function getWeekdayLabel(key: string): string {
  return WEEKDAY_NAMES[parseDateKey(key).getDay()];
}

/** 日期字符串转中文展示，如 2026-09-03 -> '2026年9月3日' */
export function formatDateKey(key: string): string {
  const d = parseDateKey(key);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 日期 + 星期，如 '2026年9月3日 星期四' */
export function formatDateWithWeekday(key: string): string {
  return `${formatDateKey(key)} ${getWeekdayLabel(key)}`;
}
