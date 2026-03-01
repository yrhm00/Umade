/**
 * Utilitaires pour le haptic feedback
 * Centralise tous les retours haptiques de l'app
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Types de feedback disponibles
export type HapticType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'soft'
  | 'rigid';

// Mapping vers les types Expo
const IMPACT_MAP: Record<string, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
  soft: Haptics.ImpactFeedbackStyle.Soft,
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
};

const NOTIFICATION_MAP: Record<string, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

/**
 * Déclenche un retour haptique
 */
export async function haptic(type: HapticType = 'light'): Promise<void> {
  // Les haptics ne fonctionnent pas sur Android dans tous les cas
  if (Platform.OS === 'web') return;

  try {
    if (type === 'selection') {
      await Haptics.selectionAsync();
    } else if (type in NOTIFICATION_MAP) {
      await Haptics.notificationAsync(NOTIFICATION_MAP[type]);
    } else if (type in IMPACT_MAP) {
      await Haptics.impactAsync(IMPACT_MAP[type]);
    }
  } catch (error) {
    // Silently fail - haptics not available
  }
}

/**
 * Haptics pour différentes actions de l'app
 */
export const AppHaptics = {
  // Navigation
  tabPress: () => haptic('light'),
  buttonPress: () => haptic('light'),
  backPress: () => haptic('light'),

  // Interactions
  toggle: () => haptic('selection'),
  slider: () => haptic('selection'),
  swipe: () => haptic('light'),
  longPress: () => haptic('medium'),
  doubleTap: () => haptic('medium'),

  // Actions
  like: () => haptic('success'),
  unlike: () => haptic('light'),
  save: () => haptic('success'),
  delete: () => haptic('warning'),
  send: () => haptic('medium'),
  refresh: () => haptic('light'),

  // Feedback
  success: () => haptic('success'),
  error: () => haptic('error'),
  warning: () => haptic('warning'),

  // UI Elements
  modalOpen: () => haptic('medium'),
  modalClose: () => haptic('light'),
  sheetOpen: () => haptic('medium'),
  sheetClose: () => haptic('light'),
  pickerChange: () => haptic('selection'),

  // Special
  celebration: async () => {
    // Pattern de célébration
    await haptic('success');
    await new Promise((r) => setTimeout(r, 100));
    await haptic('light');
    await new Promise((r) => setTimeout(r, 100));
    await haptic('medium');
  },
};

export default AppHaptics;
