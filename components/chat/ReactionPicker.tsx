/**
 * Picker rapide des réactions emoji
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { Ellipsis } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🎉'] as const;

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  onOpenMore?: () => void;
}

export function ReactionPicker({
  visible,
  onSelect,
  onClose,
  onOpenMore,
}: ReactionPickerProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={[
            styles.container,
            {
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.row}>
            {EMOJIS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => {
                  onSelect(emoji);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.emojiButton,
                  pressed && {
                    transform: [{ scale: 0.92 }],
                    backgroundColor: `${colors.primary}18`,
                  },
                ]}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </Pressable>
            ))}

            <Pressable
              onPress={() => {
                onClose();
                onOpenMore?.();
              }}
              style={({ pressed }) => [
                styles.moreButton,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? `${colors.primary}14` : 'transparent',
                },
              ]}
            >
              <Ellipsis size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 104,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  container: {
    borderRadius: Layout.radius.full,
    borderWidth: 1,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 21,
    lineHeight: 24,
  },
  moreButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
