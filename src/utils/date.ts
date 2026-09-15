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

/** 解析 HH:mm 为时分，非法输入回退为 00:00，并对越界值做钳制 */
export function parseTimeKey(timeKey: string): { hour: number; minute: number } {
  const h = Number.parseInt((timeKey || '00:00').split(':')[0] ?? '0', 10);
  const m = Number.parseInt((timeKey || '00:00').split(':')[1] ?? '0', 10);
  return {
    hour: Number.isFinite(h) ? Math.min(Math.max(h, 0), 23) : 0,
    minute: Number.isFinite(m) ? Math.min(Math.max(m, 0), 59) : 0,
  };
}

/**
 * 把「目标日期 + 目标时刻」合成完整的本地时间戳。
 * @param dateKey YYYY-MM-DD
 * @param timeKey HH:mm
 */
export function combineDateTimeKey(dateKey: string, timeKey: string): number {
  const { hour, minute } = parseTimeKey(timeKey);
  const date = parseDateKey(dateKey);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

/**
 * 目标时间戳与「当前时间」的差值分解。
 * sign = 1 未来 / -1 已过去 / 0 恰好到达（各分量均为 0）。
 * 天按 24 小时整块计数，便于展示「剩余 X天 X时 X分 X秒」。
 */
export interface TimeSpan {
  sign: 1 | -1 | 0;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getTimeSpan(targetTs: number, nowTs: number): TimeSpan {
  let diffMs = targetTs - nowTs;
  let sign: TimeSpan['sign'] = 0;
  if (diffMs > 0) {
    sign = 1;
  } else if (diffMs < 0) {
    sign = -1;
    diffMs = -diffMs;
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    sign,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * 倒计时展示文案：
 * 未来「剩余 X天 X时 X分[X秒]」；已过去「已过去 …」；恰好到达「已到达」
 * @param showSeconds 是否展示秒位（由全局设置控制）
 */
export function formatTimeSpan(span: TimeSpan, showSeconds: boolean): string {
  if (span.sign === 0) {
    return '已到达';
  }
  const prefix = span.sign > 0 ? '剩余' : '已过去';
  const parts = [`${span.days}天`, `${span.hours}时`, `${span.minutes}分`];
  if (showSeconds) {
    parts.push(`${span.seconds}秒`);
  }
  return `${prefix} ${parts.join(' ')}`;
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
