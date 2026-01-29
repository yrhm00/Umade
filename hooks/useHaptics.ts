import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function useHaptics() {
  const isSupported = Platform.OS !== 'web';

  const light = useCallback(() => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isSupported]);

  const medium = useCallback(() => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [isSupported]);

  const heavy = useCallback(() => {
    if (!isSupported) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [isSupported]);

  const selection = useCallback(() => {
    if (!isSupported) return;
    Haptics.selectionAsync();
  }, [isSupported]);

  const success = useCallback(() => {
    if (!isSupported) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isSupported]);

  const warning = useCallback(() => {
    if (!isSupported) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [isSupported]);

  const error = useCallback(() => {
    if (!isSupported) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [isSupported]);

  const trigger = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error' = 'light') => {
      if (!isSupported) return;

      switch (type) {
        case 'light':
          light();
          break;
        case 'medium':
          medium();
          break;
        case 'heavy':
          heavy();
          break;
        case 'selection':
          selection();
          break;
        case 'success':
          success();
          break;
        case 'warning':
          warning();
          break;
        case 'error':
          error();
          break;
      }
    },
    [isSupported, light, medium, heavy, selection, success, warning, error]
  );

  return {
    light,
    medium,
    heavy,
    selection,
    success,
    warning,
    error,
    trigger,
    isSupported,
  };
}
