import { create } from 'zustand';
import { AppNotification } from '@/types';

interface NotificationState {
  unreadCount: number;
  lastNotification: AppNotification | null;

  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
  setLastNotification: (notification: AppNotification | null) => void;
  clearLastNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  lastNotification: null,

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnread: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  setLastNotification: (notification) => set({ lastNotification: notification }),

  clearLastNotification: () => set({ lastNotification: null }),
}));
