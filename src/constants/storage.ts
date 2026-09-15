/**
 * 本地存储 / 通知相关的常量配置
 */

/** 事件列表在 AsyncStorage 中的存储键 */
export const STORAGE_KEY = 'countdown_day:events';

/** 全局设置（如是否显示秒数）在 AsyncStorage 中的存储键 */
export const SETTINGS_KEY = 'countdown_day:settings';

/** Android 通知渠道 ID（Android 8.0+ 必须存在渠道才会展示通知） */
export const NOTIFICATION_CHANNEL_ID = 'event-due';

/** Android 通知渠道展示名称 */
export const NOTIFICATION_CHANNEL_NAME = '事件到期提醒';

/** 事件默认目标时刻（HH:mm，24 小时制） */
export const DEFAULT_EVENT_TIME = '00:00';

/** 默认提醒时刻（HH:mm，24 小时制），对应用户可自定义的通知触发时间 */
export const DEFAULT_NOTIFY_TIME = '11:00';
