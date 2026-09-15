import AsyncStorage from '@react-native-async-storage/async-storage';

import { SETTINGS_KEY, STORAGE_KEY, DEFAULT_EVENT_TIME, DEFAULT_NOTIFY_TIME } from '@/constants/storage';
import type { CountdownItem } from '@/types/countdown';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTimeKey(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeItem(raw: Record<string, unknown>): CountdownItem | null {
  const { id, title, targetDate, calendarType } = raw;
  if (typeof id !== 'string' || typeof title !== 'string' || !isValidDateKey(targetDate)) {
    return null;
  }
  const now = Date.now();
  return {
    id,
    title,
    targetDate,
    // 兼容旧版本数据：历史存储没有目标时刻，回退为 00:00
    targetTime: isValidTimeKey(raw.targetTime) ? raw.targetTime : DEFAULT_EVENT_TIME,
    // 兼容旧版本数据：历史存储没有历法类型，回退为公历
    calendarType: calendarType === 'lunar' ? 'lunar' : 'solar',
    // 兼容旧版本数据：历史事件原本都启用了提醒，回退为开启
    notifyEnabled: typeof raw.notifyEnabled === 'boolean' ? raw.notifyEnabled : true,
    // 兼容旧版本数据：历史存储没有自定义提醒时刻，回退为默认 11:00
    notifyTime: isValidTimeKey(raw.notifyTime) ? raw.notifyTime : DEFAULT_NOTIFY_TIME,
    // 兼容旧版本数据：历史事件没有置顶标记，回退为不置顶
    isPinned: typeof raw.isPinned === 'boolean' ? raw.isPinned : false,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
    notificationId: typeof raw.notificationId === 'string' ? raw.notificationId : null,
  };
}

export async function loadEvents(): Promise<CountdownItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    return data
      .filter(isRecord)
      .map(normalizeItem)
      .filter((item): item is CountdownItem => item !== null);
  } catch (error) {
    console.warn('[storage] 读取本地事件失败：', error);
    return [];
  }
}

export async function saveEvents(events: CountdownItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('[storage] 写入本地事件失败：', error);
  }
}

/** 全局设置存取对象：目前仅「是否展示秒数」 */
export interface AppSettings {
  showSeconds: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  showSeconds: true,
};

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) {
      return { ...DEFAULT_SETTINGS };
    }
    return {
      showSeconds: typeof data.showSeconds === 'boolean' ? data.showSeconds : DEFAULT_SETTINGS.showSeconds,
    };
  } catch (error) {
    console.warn('[storage] 读取设置失败：', error);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('[storage] 写入设置失败：', error);
  }
}
