import React, { useCallback } from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'none';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scale?: number;
  haptic?: HapticType;
  disabled?: boolean;
}

export function PressableScale({
  children,
  style,
  scale = 0.985,
  haptic = 'light',
  disabled = false,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: PressableScaleProps) {
  const scaleValue = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const triggerHaptic = useCallback(() => {
    if (haptic === 'none') return;

    switch (haptic) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        Haptics.selectionAsync();
        break;
    }
  }, [haptic]);

  const handlePressIn = useCallback(
    (e: any) => {
      scaleValue.value = withTiming(scale, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      });
      onPressIn?.(e);
    },
    [scale, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scaleValue.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
      onPressOut?.(e);
    },
    [onPressOut]
  );

  const handlePress = useCallback(
    (e: any) => {
      triggerHaptic();
      onPress?.(e);
    },
    [triggerHaptic, onPress]
  );

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
