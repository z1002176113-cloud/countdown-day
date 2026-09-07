import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEY } from '@/constants/storage';
import type { CountdownItem } from '@/types/countdown';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
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
    // 兼容旧版本数据：历史存储没有 calendarType，回退为公历
    calendarType: calendarType === 'lunar' ? 'lunar' : 'solar',
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
