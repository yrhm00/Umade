/**
 * Composant Tooltip pour le tutoriel in-app
 * Affiche un tooltip animé pointant vers un élément
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';

interface TooltipProps {
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  targetX?: number;
  targetY?: number;
  targetWidth?: number;
  targetHeight?: number;
  onDismiss: () => void;
  visible: boolean;
}

export function Tooltip({
  title,
  description,
  position = 'bottom',
  targetX = 0,
  targetY = 0,
  targetWidth = 0,
  targetHeight = 0,
  onDismiss,
  visible,
}: TooltipProps) {
  const colors = useColors();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const translateY = useSharedValue(position === 'top' ? 10 : -10);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = withDelay(200, withTiming(1, { duration: 220 }));
      scale.value = withDelay(200, withTiming(1, { duration: 220 }));
      translateY.value = withDelay(200, withTiming(0, { duration: 220 }));

      // Pulse animation for the arrow
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.8, { duration: 150 });
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    opacity.value = withTiming(0, { duration: 150 });
    scale.value = withTiming(0.8, { duration: 150 }, () => {
      runOnJS(onDismiss)();
    });
  }, [onDismiss]);

  // Calculate tooltip position
  const getTooltipPosition = () => {
    const tooltipWidth = 280;
    const tooltipHeight = 100;
    const arrowSize = 10;
    const padding = 16;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = targetY - tooltipHeight - arrowSize - padding;
        left = targetX + targetWidth / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetY + targetHeight + arrowSize + padding;
        left = targetX + targetWidth / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetY + targetHeight / 2 - tooltipHeight / 2;
        left = targetX - tooltipWidth - arrowSize - padding;
        break;
      case 'right':
        top = targetY + targetHeight / 2 - tooltipHeight / 2;
        left = targetX + targetWidth + arrowSize + padding;
        break;
    }

    // Keep within screen bounds
    left = Math.max(padding, Math.min(left, screenWidth - tooltipWidth - padding));
    top = Math.max(padding, Math.min(top, screenHeight - tooltipHeight - padding));

    return { top, left };
  };

  const tooltipPosition = getTooltipPosition();

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={handleDismiss}>
      {/* Highlight target area */}
      {targetWidth > 0 && targetHeight > 0 && (
        <View
          style={[
            styles.highlight,
            {
              top: targetY - 4,
              left: targetX - 4,
              width: targetWidth + 8,
              height: targetHeight + 8,
              borderColor: colors.primary,
            },
          ]}
        />
      )}

      {/* Tooltip */}
      <Animated.View
        style={[
          styles.tooltip,
          {
            backgroundColor: colors.card,
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          },
          containerStyle,
        ]}
      >
        {/* Arrow */}
        <Animated.View
          style={[
            styles.arrow,
            position === 'top' && styles.arrowBottom,
            position === 'bottom' && styles.arrowTop,
            position === 'left' && styles.arrowRight,
            position === 'right' && styles.arrowLeft,
            { borderTopColor: colors.card },
            arrowStyle,
          ]}
        />

        {/* Close button */}
        <Pressable style={styles.closeButton} onPress={handleDismiss} hitSlop={10}>
          <X size={16} color={colors.textTertiary} />
        </Pressable>

        {/* Content */}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        {/* Got it button */}
        <Pressable
          style={[styles.gotItButton, { backgroundColor: colors.primary }]}
          onPress={handleDismiss}
        >
          <Text style={styles.gotItText}>Compris !</Text>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

// ============================================
// Hook pour faciliter l'utilisation des tooltips
// ============================================

import { useTutorialStore, TutorialStep, TUTORIAL_CONTENT } from '@/stores/tutorialStore';
import { useRef, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

export function useTutorialTooltip(step: TutorialStep) {
  const { activeTooltip, completeStep, shouldShowStep } = useTutorialStore();
  const [targetLayout, setTargetLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const ref = useRef<View>(null);

  const measureTarget = useCallback(() => {
    if (ref.current) {
      ref.current.measureInWindow((x, y, width, height) => {
        setTargetLayout({ x, y, width, height });
      });
    }
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    // Measure after layout
    setTimeout(measureTarget, 100);
  }, [measureTarget]);

  const handleDismiss = useCallback(() => {
    completeStep(step);
  }, [step, completeStep]);

  const content = TUTORIAL_CONTENT[step];
  const isVisible = activeTooltip === step;

  return {
    ref,
    onLayout,
    isVisible,
    shouldShow: shouldShowStep(step),
    tooltipProps: {
      title: content.title,
      description: content.description,
      position: content.position,
      targetX: targetLayout.x,
      targetY: targetLayout.y,
      targetWidth: targetLayout.width,
      targetHeight: targetLayout.height,
      onDismiss: handleDismiss,
      visible: isVisible,
    },
  };
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  highlight: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: Layout.radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tooltip: {
    position: 'absolute',
    width: 280,
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    ...Shadows.lg,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowTop: {
    top: -10,
    left: '50%',
    marginLeft: -10,
    transform: [{ rotate: '180deg' }],
  },
  arrowBottom: {
    bottom: -10,
    left: '50%',
    marginLeft: -10,
  },
  arrowLeft: {
    left: -15,
    top: '50%',
    marginTop: -10,
    transform: [{ rotate: '90deg' }],
  },
  arrowRight: {
    right: -15,
    top: '50%',
    marginTop: -10,
    transform: [{ rotate: '-90deg' }],
  },
  closeButton: {
    position: 'absolute',
    top: Layout.spacing.sm,
    right: Layout.spacing.sm,
    padding: 4,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    marginBottom: Layout.spacing.xs,
    paddingRight: Layout.spacing.lg,
  },
  description: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
    marginBottom: Layout.spacing.md,
  },
  gotItButton: {
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: Layout.radius.full,
    alignSelf: 'flex-start',
  },
  gotItText: {
    color: '#FFFFFF',
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
});
