/**
 * Checkmark animé de succès (Phase 10)
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SuccessCheckmarkProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  delay?: number;
  onComplete?: () => void;
}

export function SuccessCheckmark({
  size = 80,
  color = Colors.success.DEFAULT,
  strokeWidth = 4,
  delay = 0,
  onComplete,
}: SuccessCheckmarkProps) {
  const circleScale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkProgress = useSharedValue(0);

  useEffect(() => {
    // Animate circle first
    circleScale.value = withDelay(
      delay,
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) })
    );

    // Then animate checkmark
    checkScale.value = withDelay(
      delay + 200,
      withSequence(
        withTiming(1.16, { duration: 170, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) })
      )
    );

    checkProgress.value = withDelay(
      delay + 200,
      withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
    );

    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, delay + 600);
    }
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleScale.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {/* Background circle */}
          <Animated.View style={circleStyle}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill={`${color}15`}
              stroke={color}
              strokeWidth={strokeWidth}
            />
          </Animated.View>
        </G>
      </Svg>

      {/* Checkmark */}
      <Animated.View style={[styles.checkContainer, checkStyle]}>
        <Svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
        >
          <Path
            d="M5 13l4 4L19 7"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
