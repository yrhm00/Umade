/**
 * Menu contextuel déclenché par long-press
 * Affiche un menu d'actions avec animations fluides
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { useColors } from '@/hooks/useColors';
import { LucideIcon } from 'lucide-react-native';

export interface LongPressMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface LongPressMenuProps {
  visible: boolean;
  onClose: () => void;
  items: LongPressMenuItem[];
  title?: string;
}

export function LongPressMenu({
  visible,
  onClose,
  items,
  title,
}: LongPressMenuProps) {
  const colors = useColors();
  const { height: screenHeight } = useWindowDimensions();

  const handleItemPress = useCallback(
    (item: LongPressMenuItem) => {
      if (item.disabled) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      // Small delay to allow menu to close before action
      setTimeout(() => {
        item.onPress();
      }, 150);
    },
    [onClose]
  );

  const handleBackdropPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={StyleSheet.absoluteFill}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        </Animated.View>
      </Pressable>

      {/* Menu */}
      <Animated.View
        entering={SlideInDown.duration(260)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.menuContainer, { maxHeight: screenHeight * 0.6 }]}
      >
        <View style={[styles.menu, { backgroundColor: colors.card }]}>
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Title */}
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}

          {/* Menu items */}
          <View style={styles.itemsContainer}>
            {items.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === items.length - 1;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  disabled={item.disabled}
                  style={({ pressed }) => [
                    styles.menuItem,
                    !isLast && [styles.menuItemBorder, { borderBottomColor: colors.border }],
                    pressed && { backgroundColor: colors.background },
                    item.disabled && styles.menuItemDisabled,
                  ]}
                >
                  <Icon
                    size={22}
                    color={
                      item.disabled
                        ? colors.textTertiary
                        : item.destructive
                        ? colors.error
                        : colors.text
                    }
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      {
                        color: item.disabled
                          ? colors.textTertiary
                          : item.destructive
                          ? colors.error
                          : colors.text,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Cancel button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelButton,
              { backgroundColor: pressed ? colors.background : colors.card },
            ]}
          >
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              Annuler
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ============================================
// Hook pour gérer facilement le menu
// ============================================

import { useState } from 'react';

export function useLongPressMenu() {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    visible,
    open,
    close,
  };
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  menu: {
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    paddingBottom: Layout.spacing.xl,
    ...Shadows.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  itemsContainer: {
    paddingHorizontal: Layout.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    flex: 1,
  },
  cancelButton: {
    marginTop: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
});
