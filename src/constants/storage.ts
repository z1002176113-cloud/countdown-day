/**
 * 本地存储 / 通知相关的常量配置
 */

/** 事件列表在 AsyncStorage 中的存储键 */
export const STORAGE_KEY = 'countdown_day:events';

/** Android 通知渠道 ID（Android 8.0+ 必须存在渠道才会展示通知） */
export const NOTIFICATION_CHANNEL_ID = 'event-due';

/** Android 通知渠道展示名称 */
export const NOTIFICATION_CHANNEL_NAME = '事件到期提醒';

/** 到期提醒触发时刻（目标日期当天的小时，本地时间） */
export const REMIND_HOUR = 9;
