/**
 * Modal de célébration (Phase 10)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { Button } from '@/components/ui/Button';
import { ConfettiOverlay, ConfettiOverlayRef } from './ConfettiOverlay';

const { width } = Dimensions.get('window');

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  emoji?: string;
  buttonText?: string;
  showConfetti?: boolean;
}

export function CelebrationModal({
  visible,
  onClose,
  title,
  subtitle,
  emoji = '🎉',
  buttonText = 'Super !',
  showConfetti = true,
}: CelebrationModalProps) {
  const colors = useColors();
  const confettiRef = useRef<ConfettiOverlayRef>(null);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate emoji
      emojiScale.value = withSequence(
        withTiming(1.16, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) })
      );

      // Fire confetti after a short delay
      if (showConfetti) {
        setTimeout(() => {
          confettiRef.current?.fire();
        }, 300);
      }
    } else {
      emojiScale.value = 0;
    }
  }, [visible]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          entering={ZoomIn.duration(240)}
          style={styles.content}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Animated.Text style={[styles.emoji, emojiStyle]}>
              {emoji}
            </Animated.Text>

            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            )}

            <View style={styles.buttonContainer}>
              <Button
                title={buttonText}
                onPress={onClose}
                size="lg"
                fullWidth
              />
            </View>
          </View>
        </Animated.View>

        {showConfetti && <ConfettiOverlay ref={confettiRef} />}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    width: width - 48,
    maxWidth: 340,
  },
  card: {
    borderRadius: 24,
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    marginTop: Layout.spacing.md,
  },
});
