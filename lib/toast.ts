import { useToastStore } from '@/stores/toastStore';

/**
 * Global toast helper — can be called from anywhere, even outside React components.
 */
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().success(title, { message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().error(title, { message }),
  warning: (title: string, message?: string) =>
    useToastStore.getState().warning(title, { message }),
  info: (title: string, message?: string) =>
    useToastStore.getState().info(title, { message }),
};
