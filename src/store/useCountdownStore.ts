import { create } from 'zustand';

import { DEFAULT_EVENT_TIME, DEFAULT_NOTIFY_TIME } from '@/constants/storage';
import type { CountdownItem, EventFormValues } from '@/types/countdown';
import {
  loadEvents,
  loadSettings,
  saveEvents,
  saveSettings,
} from '@/services/storage';
import {
  cancelEventNotification,
  scheduleEventNotification,
  syncEventNotifications,
} from '@/services/notifications';

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface CountdownState {
  events: CountdownItem[];
  hydrated: boolean;
  triggeredEventId: string | null;
  setTriggeredEvent: (id: string | null) => void;
  /** 全局设置：倒计时是否展示秒位 */
  showSeconds: boolean;
  setShowSeconds: (value: boolean) => void;

  init: () => Promise<void>;
  addEvent: (values: EventFormValues) => Promise<void>;
  updateEvent: (id: string, values: EventFormValues) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  togglePinned: (id: string) => void;
  toggleNotify: (id: string) => Promise<void>;
}

export const useCountdownStore = create<CountdownState>((set, get) => ({
  events: [],
  hydrated: false,
  triggeredEventId: null,
  setTriggeredEvent: (id) => set({ triggeredEventId: id }),
  showSeconds: true,
  setShowSeconds: (value) => {
    set({ showSeconds: value });
    void saveSettings({ showSeconds: value });
  },

  init: async () => {
    const loaded = await loadEvents();
    const events = await syncEventNotifications(loaded);
    await saveEvents(events);
    const settings = await loadSettings();
    set({ events, showSeconds: settings.showSeconds, hydrated: true });
  },

  addEvent: async ({
    title,
    targetDate,
    targetTime,
    calendarType,
    notifyEnabled,
    notifyTime,
    isPinned,
  }) => {
    const now = Date.now();
    const base: CountdownItem = {
      id: createId(),
      title: title.trim(),
      targetDate,
      targetTime: targetTime ?? DEFAULT_EVENT_TIME,
      calendarType,
      notifyEnabled,
      notifyTime: notifyTime ?? DEFAULT_NOTIFY_TIME,
      isPinned,
      createdAt: now,
      updatedAt: now,
      notificationId: null,
    };
    const notificationId = await scheduleEventNotification(base);
    const item: CountdownItem = { ...base, notificationId };
    const events = [...get().events, item];
    set({ events });
    await saveEvents(events);
  },

  updateEvent: async (
    id,
    { title, targetDate, targetTime, calendarType, notifyEnabled, notifyTime, isPinned },
  ) => {
    const prev = get().events.find((event) => event.id === id);
    if (!prev) {
      return;
    }
    await cancelEventNotification(prev.notificationId);
    const nextBase: CountdownItem = {
      ...prev,
      title: title.trim(),
      targetDate,
      targetTime: targetTime ?? DEFAULT_EVENT_TIME,
      calendarType,
      notifyEnabled,
      notifyTime: notifyTime ?? DEFAULT_NOTIFY_TIME,
      isPinned,
      updatedAt: Date.now(),
      notificationId: null,
    };
    const notificationId = await scheduleEventNotification(nextBase);
    const next: CountdownItem = { ...nextBase, notificationId };
    const events = get().events.map((event) => (event.id === id ? next : event));
    set({ events });
    await saveEvents(events);
  },

  deleteEvent: async (id) => {
    const target = get().events.find((event) => event.id === id);
    if (target?.notificationId) {
      await cancelEventNotification(target.notificationId);
    }
    const events = get().events.filter((event) => event.id !== id);
    set({ events });
    await saveEvents(events);
  },

  /** 管理模式下直接切换置顶，不重新调度通知 */
  togglePinned: (id) => {
    const events = get().events.map((event) =>
      event.id === id ? { ...event, isPinned: !event.isPinned, updatedAt: Date.now() } : event,
    );
    set({ events });
    void saveEvents(events);
  },

  /** 管理模式下直接切换通知开关：先取消旧通知，再按新开关状态决定是否重排 */
  toggleNotify: async (id) => {
    const target = get().events.find((event) => event.id === id);
    if (!target) {
      return;
    }
    await cancelEventNotification(target.notificationId);
    const notifyEnabled = !target.notifyEnabled;
    const base: CountdownItem = {
      ...target,
      notifyEnabled,
      updatedAt: Date.now(),
      notificationId: null,
    };
    const notificationId = await scheduleEventNotification(base);
    const next: CountdownItem = { ...base, notificationId };
    const events = get().events.map((event) => (event.id === id ? next : event));
    set({ events });
    await saveEvents(events);
  },
}));
