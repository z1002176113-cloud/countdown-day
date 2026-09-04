import { create } from 'zustand';

import type { CountdownItem, EventFormValues } from '@/types/countdown';
import { loadEvents, saveEvents } from '@/services/storage';
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

  init: () => Promise<void>;
  addEvent: (values: EventFormValues) => Promise<void>;
  updateEvent: (id: string, values: EventFormValues) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useCountdownStore = create<CountdownState>((set, get) => ({
  events: [],
  hydrated: false,

  init: async () => {
    const loaded = await loadEvents();
    const events = await syncEventNotifications(loaded);
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
}));
