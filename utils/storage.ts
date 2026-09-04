/**
 * 本地存储封装模块（AsyncStorage）
 * 提供事件列表的读取 / 写入，并在读取时逐条做结构校验，
 * 防止本地脏数据直接进入页面导致崩溃。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEY } from '../constants/storage';
import type { CountdownItem } from '../types/countdown';

/** 判断是否为普通对象 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 判断是否为合法的「目标日期字符串」（同时用作类型守卫） */
function isValidDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** 校验并规整一条原始记录，非法返回 null */
function normalizeItem(raw: Record<string, unknown>): CountdownItem | null {
  const { id, title, targetDate } = raw;
  if (
    typeof id !== 'string' ||
    typeof title !== 'string' ||
    !isValidDateKey(targetDate)
  ) {
    return null;
  }
  const now = Date.now();
  return {
    id,
    title,
    targetDate,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
    notificationId: typeof raw.notificationId === 'string' ? raw.notificationId : null,
  };
}

/** 读取本地事件列表；无数据或解析失败时返回空数组，绝不抛错 */
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
    return data.filter(isRecord).map(normalizeItem).filter(
      (item): item is CountdownItem => item !== null,
    );
  } catch (error) {
    console.warn('[storage] 读取本地事件失败：', error);
    return [];
  }
}

/** 将事件列表整体写入本地存储 */
export async function saveEvents(events: CountdownItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('[storage] 写入本地事件失败：', error);
  }
}
