/**
 * Overlay plein écran de célébration quand un badge est débloqué.
 * Utilise CelebrationModal + ConfettiOverlay existants.
 */

import React, { useEffect, useRef } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ConfettiOverlay, ConfettiOverlayRef } from '@/components/celebrations/ConfettiOverlay';
import { Button } from '@/components/ui/Button';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors } from '@/hooks/useColors';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useMarkBadgeSeen, useUnseenBadgeCount } from '@/hooks/useBadges';

const { width } = Dimensions.get('window');

export function BadgeUnlockOverlay() {
  const colors = useColors();
  const { pendingBadge, showCelebration, clearPendingBadge } = useGamificationStore();
  const confettiRef = useRef<ConfettiOverlayRef>(null);

  // Animations
  const emojiScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const pointsScale = useSharedValue(0);

  useEffect(() => {
    if (showCelebration && pendingBadge) {
      // Haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Emoji scale bounce
      emojiScale.value = withSequence(
        withTiming(1.2, { duration: 200, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) })
      );

      // Title slide up + fade in
      titleOpacity.value = withDelay(
        200,
        withTiming(1, { duration: 300 })
      );
      titleTranslateY.value = withDelay(
        200,
        withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) })
      );

      // Points pop
      pointsScale.value = withDelay(
        400,
        withSequence(
          withTiming(1.15, { duration: 150, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 100, easing: Easing.out(Easing.cubic) })
        )
      );

      // Confetti
      setTimeout(() => {
        confettiRef.current?.fire();
      }, 300);
    } else {
      // Reset
      emojiScale.value = 0;
      titleOpacity.value = 0;
      titleTranslateY.value = 20;
      pointsScale.value = 0;
    }
  }, [showCelebration, pendingBadge]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const pointsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pointsScale.value }],
  }));

  const handleClose = () => {
    clearPendingBadge();
  };

  if (!pendingBadge) return null;

  return (
    <Modal
      visible={showCelebration}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          entering={ZoomIn.duration(280)}
          style={styles.content}
        >
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Badge Emoji */}
            <Animated.Text style={[styles.emoji, emojiStyle]}>
              {pendingBadge.icon}
            </Animated.Text>

            {/* Titre */}
            <Animated.View style={titleStyle}>
              <Text style={[styles.unlockLabel, { color: colors.primary }]}>
                Badge débloqué !
              </Text>
              <Text style={[styles.badgeName, { color: colors.text }]}>
                {pendingBadge.name}
              </Text>
              <Text style={[styles.badgeDescription, { color: colors.textSecondary }]}>
                {pendingBadge.description}
              </Text>
            </Animated.View>

            {/* Points */}
            <Animated.View style={[styles.pointsBadge, { backgroundColor: `${colors.primary}15` }, pointsStyle]}>
              <Text style={[styles.pointsText, { color: colors.primary }]}>
                +{pendingBadge.points} points
              </Text>
            </Animated.View>

            {/* Bouton */}
            <View style={styles.buttonContainer}>
              <Button
                title="Super !"
                onPress={handleClose}
                size="lg"
                fullWidth
              />
            </View>
          </View>
        </Animated.View>

        <ConfettiOverlay ref={confettiRef} />
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    fontSize: 72,
    marginBottom: Layout.spacing.md,
  },
  unlockLabel: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Layout.spacing.xs,
  },
  badgeName: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  badgeDescription: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  pointsBadge: {
    marginTop: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
  },
  pointsText: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.bold,
  },
  buttonContainer: {
    width: '100%',
    marginTop: Layout.spacing.xl,
  },
});
