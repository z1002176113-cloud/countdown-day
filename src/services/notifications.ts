import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import {
  NOTIFICATION_CHANNEL_ID,
  NOTIFICATION_CHANNEL_NAME,
  REMIND_HOUR,
} from '@/constants/storage';
import type { CountdownItem } from '@/types/countdown';
import { getDaysDiff, parseDateKey } from '@/utils/date';

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

export async function initializeNotifications(): Promise<void> {
  setupNotificationHandler();
  await ensureNotificationChannel();
  await requestNotificationPermission();
}

function buildTriggerDate(item: CountdownItem): Date | null {
  if (getDaysDiff(item.targetDate) <= 0) {
    return null;
  }
  const trigger = parseDateKey(item.targetDate);
  trigger.setHours(REMIND_HOUR, 0, 0, 0);
  if (trigger.getTime() <= Date.now()) {
    return null;
  }
  return trigger;
}

export async function scheduleEventNotification(item: CountdownItem): Promise<string | null> {
  // 用户关闭了该事件的提醒开关：不调度，返回 null（通知服务的统一闸门）
  if (!item.notifyEnabled) {
    return null;
  }
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

export async function syncEventNotifications(events: CountdownItem[]): Promise<CountdownItem[]> {
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
