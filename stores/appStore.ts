import { create } from 'zustand';

interface AppState {
  // État de l'interface
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Notifications
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;

  // Messages non lus
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // État par défaut
  isOnline: true,
  unreadNotifications: 0,
  unreadMessages: 0,

  // Actions
  setIsOnline: (online) => set({ isOnline: online }),
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  setUnreadMessages: (count) => set({ unreadMessages: count }),
}));
