import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastState {
  visible: boolean;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  action?: ToastAction;
  show: (
    type: ToastType,
    title: string,
    options?: { message?: string; duration?: number; action?: ToastAction }
  ) => void;
  hide: () => void;
  success: (title: string, options?: { message?: string; duration?: number }) => void;
  error: (title: string, options?: { message?: string; duration?: number }) => void;
  warning: (title: string, options?: { message?: string; duration?: number }) => void;
  info: (title: string, options?: { message?: string; duration?: number }) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  type: 'info',
  title: '',
  message: undefined,
  duration: 4000,
  action: undefined,
  show: (type, title, options) =>
    set({
      visible: true,
      type,
      title,
      message: options?.message,
      duration: options?.duration ?? 4000,
      action: options?.action,
    }),
  hide: () => set({ visible: false }),
  success: (title, options) =>
    set({
      visible: true,
      type: 'success',
      title,
      message: options?.message,
      duration: options?.duration ?? 4000,
      action: undefined,
    }),
  error: (title, options) =>
    set({
      visible: true,
      type: 'error',
      title,
      message: options?.message,
      duration: options?.duration ?? 5000,
      action: undefined,
    }),
  warning: (title, options) =>
    set({
      visible: true,
      type: 'warning',
      title,
      message: options?.message,
      duration: options?.duration ?? 4000,
      action: undefined,
    }),
  info: (title, options) =>
    set({
      visible: true,
      type: 'info',
      title,
      message: options?.message,
      duration: options?.duration ?? 3000,
      action: undefined,
    }),
}));
