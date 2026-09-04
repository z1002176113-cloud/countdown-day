/**
 * 本地通知封装模块（expo-notifications）
 * 1. initializeNotifications：前台展示 handler + Android 通知渠道 + 首次申请权限
 * 2. scheduleEventNotification：为「未来」事件在目标日期当天 REMIND_HOUR 点调度一次提醒
 * 3. cancelEventNotification / syncEventNotifications：编辑、删除、启动时校准提醒
 *
 * 设计说明：通知能力是附加能力，任何一步失败都只打印警告，不影响倒计时主流程。
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_NAME,
  REMIND_HOUR,
} from '../constants/storage';
import type { CountdownItem } from '../types/countdown';
import { getDaysDiff, parseDateKey } from './date';

/** App 处于前台时，通知也要以横幅 + 声音展示（否则前台收不到提醒） */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Android 8.0+ 必须为通知设置渠道，否则不会展示 */
export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: NOTIFICATION_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  } catch (error) {
    console.warn('[notifications] 创建通知渠道失败：', error);
  }
}

/**
 * 申请通知权限（首次打开时系统自动弹窗）。
 * 用户拒绝时仅返回 false，App 照常使用，只是不发提醒。
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      return true;
    }
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch (error) {
    console.warn('[notifications] 申请权限失败：', error);
    return false;
  }
}

/** 通知模块整体初始化（App 启动时调用一次） */
export async function initializeNotifications(): Promise<void> {
  setupNotificationHandler();
  await ensureNotificationChannel();
  await requestNotificationPermission();
}

/** 计算某事件的提醒触发时间；今日/已过期或提醒时刻已过则返回 null */
function buildTriggerDate(item: CountdownItem): Date | null {
  // 已到当天或已过去：提醒已无意义
  if (getDaysDiff(item.targetDate) <= 0) {
    return null;
  }
  const trigger = parseDateKey(item.targetDate); // 目标日当天本地 0 点
  trigger.setHours(REMIND_HOUR, 0, 0, 0); // 当天 REMIND_HOUR:00 提醒
  if (trigger.getTime() <= Date.now()) {
    return null;
  }
  return trigger;
}

/** 为单个事件调度「到期提醒」，成功返回通知 id；无需提醒/失败返回 null */
export async function scheduleEventNotification(
  item: CountdownItem,
): Promise<string | null> {
  const triggerDate = buildTriggerDate(item);
  if (!triggerDate) {
    return null;
  }
  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: '事件到期提醒',
        body: `「${item.title}」就是今天！`,
        sound: 'default',
        data: { eventId: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
  } catch (error) {
    console.warn('[notifications] 调度到期提醒失败：', item.id, error);
    return null;
  }
}

/** 取消一条已调度的通知（id 为空时静默跳过） */
export async function cancelEventNotification(
  notificationId: string | null | undefined,
): Promise<void> {
  if (!notificationId) {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('[notifications] 取消提醒失败：', notificationId, error);
  }
}

/**
 * 启动时校准全部到期提醒：
 * 先清空旧通知，再按当前事件列表重新逐个调度，
 * 返回携带最新 notificationId 的事件列表（调用方负责回写存储）。
 */
export async function syncEventNotifications(
  events: CountdownItem[],
): Promise<CountdownItem[]> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[notifications] 清空旧通知失败：', error);
  }
  const synced: CountdownItem[] = [];
  for (const event of events) {
    const notificationId = await scheduleEventNotification(event);
    synced.push({ ...event, notificationId });
  }
  return synced;
}
