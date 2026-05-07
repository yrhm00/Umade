/**
 * Indicateur de progression pour l'onboarding (Phase 10)
 * Dark Mode Support
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <ProgressDot
          key={index}
          isActive={index + 1 === currentStep}
          isCompleted={index + 1 < currentStep}
          activeColor={colors.primary}
          inactiveColor={colors.border}
        />
      ))}
    </View>
  );
}

interface ProgressDotProps {
  isActive: boolean;
  isCompleted: boolean;
  activeColor: string;
  inactiveColor: string;
}

function ProgressDot({ isActive, isCompleted, activeColor, inactiveColor }: ProgressDotProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isActive ? 24 : 8, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      }),
      backgroundColor: isActive || isCompleted ? activeColor : inactiveColor,
    };
  }, [isActive, isCompleted, activeColor, inactiveColor]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 10,
  },
});
