/**
 * 全局状态管理（Zustand）——唯一数据源
 * 职责：
 *   - 事件列表的加载 / 新增 / 编辑 / 删除
 *   - 每次变更同步写入本地（AsyncStorage）
 *   - 与本地通知联动：新增/编辑时调度到期提醒，删除/改期时取消旧提醒
 *
 * 页面不直接用组件 state 保存全局数据，统一走本 store。
 */
import { create } from 'zustand';

import type { CountdownItem, EventFormValues } from '../types/countdown';
import { loadEvents, saveEvents } from '../utils/storage';
import {
  cancelEventNotification,
  scheduleEventNotification,
  syncEventNotifications,
} from '../utils/notifications';

/** 生成唯一 id：时间戳 36 进制 + 随机段，避免重名冲突 */
function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface CountdownState {
  /** 全部事件（未排序；页面展示时再排序，见 utils/sort） */
  events: CountdownItem[];
  /** 是否已完成首次本地加载（用于首页 loading 态） */
  hydrated: boolean;

  /** App 启动时调用：读取本地数据 → 校准到期提醒 → 回写存储 */
  init: () => Promise<void>;
  /** 新增事件 */
  addEvent: (values: EventFormValues) => Promise<void>;
  /** 编辑事件（名称/日期）；改期会取消旧通知并重新调度 */
  updateEvent: (id: string, values: EventFormValues) => Promise<void>;
  /** 删除事件（同时取消其到期提醒） */
  deleteEvent: (id: string) => Promise<void>;
}

export const useCountdownStore = create<CountdownState>((set, get) => ({
  events: [],
  hydrated: false,

  init: async () => {
    const loaded = await loadEvents();
    // 以「当前本地数据」为准重建全部到期提醒（清旧 + 重排）
    const events = await syncEventNotifications(loaded);
    // 回写最新 notificationId，保证下次编辑/删除能取消到正确的通知
    await saveEvents(events);
    set({ events, hydrated: true });
  },

  addEvent: async ({ title, targetDate }) => {
    const now = Date.now();
    const base: CountdownItem = {
      id: createId(),
      title: title.trim(),
      targetDate,
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

  updateEvent: async (id, { title, targetDate }) => {
    const prev = get().events.find((event) => event.id === id);
    if (!prev) {
      return;
    }
    // 日期或名称变化都先取消旧通知，再按新数据重新调度
    await cancelEventNotification(prev.notificationId);
    const nextBase: CountdownItem = {
      ...prev,
      title: title.trim(),
      targetDate,
      updatedAt: Date.now(),
      notificationId: null,
    };
    const notificationId = await scheduleEventNotification(nextBase);
    const next: CountdownItem = { ...nextBase, notificationId };
    const events = get().events.map((event) =>
      event.id === id ? next : event,
    );
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
}));
