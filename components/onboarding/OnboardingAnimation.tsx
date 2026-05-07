/**
 * Animations pour l'onboarding (Phase 10 - UX Enhancement)
 * Utilise Reanimated pour des animations fluides
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';

interface OnboardingAnimationProps {
  type: 'event' | 'timeline' | 'style' | 'details';
  size?: number;
}

export function OnboardingAnimation({ type, size = 200 }: OnboardingAnimationProps) {
  const colors = useColors();

  switch (type) {
    case 'event':
      return <EventAnimation size={size} colors={colors} />;
    case 'timeline':
      return <TimelineAnimation size={size} colors={colors} />;
    case 'style':
      return <StyleAnimation size={size} colors={colors} />;
    case 'details':
      return <DetailsAnimation size={size} colors={colors} />;
    default:
      return null;
  }
}

// ============================================
// Animation: Event Type (confettis + cake)
// ============================================

function EventAnimation({ size, colors }: { size: number; colors: any }) {
  const bounce = useSharedValue(0);
  const confetti1 = useSharedValue(0);
  const confetti2 = useSharedValue(0);
  const confetti3 = useSharedValue(0);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    // Main bounce animation
    bounce.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Confetti animations with different delays
    confetti1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 0 })
      ),
      -1
    );
    confetti2.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );
    confetti3.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 0 })
        ),
        -1
      )
    );

    // Sparkle effect
    sparkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1
    );
  }, []);

  const mainStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(bounce.value, [0, 1], [1, 1.1]) },
      { translateY: interpolate(bounce.value, [0, 1], [0, -10]) },
    ],
  }));

  const confettiStyle1 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(confetti1.value, [0, 1], [-20, size]) },
      { translateX: interpolate(confetti1.value, [0, 0.5, 1], [0, 15, -10]) },
      { rotate: `${interpolate(confetti1.value, [0, 1], [0, 360])}deg` },
    ],
    opacity: interpolate(confetti1.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));

  const confettiStyle2 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(confetti2.value, [0, 1], [-30, size]) },
      { translateX: interpolate(confetti2.value, [0, 0.5, 1], [0, -20, 5]) },
      { rotate: `${interpolate(confetti2.value, [0, 1], [0, -360])}deg` },
    ],
    opacity: interpolate(confetti2.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));

  const confettiStyle3 = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(confetti3.value, [0, 1], [-25, size]) },
      { translateX: interpolate(confetti3.value, [0, 0.5, 1], [0, 25, 15]) },
      { rotate: `${interpolate(confetti3.value, [0, 1], [0, 270])}deg` },
    ],
    opacity: interpolate(confetti3.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0]),
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkle.value,
    transform: [{ scale: interpolate(sparkle.value, [0, 1], [0.8, 1.2]) }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Confetti pieces */}
      <Animated.View style={[styles.confetti, { left: '20%', backgroundColor: colors.primary }, confettiStyle1]} />
      <Animated.View style={[styles.confetti, { left: '50%', backgroundColor: colors.secondary || '#FF6B6B' }, confettiStyle2]} />
      <Animated.View style={[styles.confetti, { left: '75%', backgroundColor: colors.success }, confettiStyle3]} />

      {/* Main emoji with bounce */}
      <Animated.Text style={[styles.mainEmoji, { fontSize: size * 0.5 }, mainStyle]}>
        🎊
      </Animated.Text>

      {/* Sparkles */}
      <Animated.Text style={[styles.sparkle, { top: '15%', left: '15%' }, sparkleStyle]}>
        ✨
      </Animated.Text>
      <Animated.Text style={[styles.sparkle, { top: '20%', right: '20%' }, sparkleStyle]}>
        ⭐
      </Animated.Text>
    </View>
  );
}

// ============================================
// Animation: Timeline (calendar + clock)
// ============================================

function TimelineAnimation({ size, colors }: { size: number; colors: any }) {
  const rotate = useSharedValue(0);
  const pulse = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    // Clock hand rotation
    rotate.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1
    );

    // Pulse effect
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1
    );

    // Float effect
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);

  const mainStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float.value, [0, 1], [0, -15]) },
    ],
  }));

  const clockStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.3]) }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: size * 0.35,
            borderColor: colors.primary,
          },
          ringStyle,
        ]}
      />

      {/* Main calendar */}
      <Animated.Text style={[styles.mainEmoji, { fontSize: size * 0.45 }, mainStyle]}>
        📅
      </Animated.Text>

      {/* Small clock */}
      <Animated.View style={[styles.smallIcon, { bottom: '15%', right: '20%' }]}>
        <Animated.Text style={[{ fontSize: size * 0.2 }, clockStyle]}>
          ⏰
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

// ============================================
// Animation: Style (palette + sparkles)
// ============================================

function StyleAnimation({ size, colors }: { size: number; colors: any }) {
  const wave = useSharedValue(0);
  const colorShift = useSharedValue(0);
  const brush = useSharedValue(0);

  useEffect(() => {
    wave.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );

    colorShift.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1
    );

    brush.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0, { duration: 800 })
      ),
      -1
    );
  }, []);

  const mainStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(wave.value, [0, 1], [-5, 5])}deg` },
      { scale: interpolate(wave.value, [0, 0.5, 1], [1, 1.05, 1]) },
    ],
  }));

  const brushStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(brush.value, [0, 1], [-20, 20]) },
      { rotate: `${interpolate(brush.value, [0, 1], [-15, 15])}deg` },
    ],
  }));

  const dotStyle = (delay: number) => useAnimatedStyle(() => ({
    opacity: interpolate(
      (colorShift.value + delay) % 1,
      [0, 0.5, 1],
      [0.5, 1, 0.5]
    ),
    transform: [
      { scale: interpolate((colorShift.value + delay) % 1, [0, 0.5, 1], [0.8, 1.2, 0.8]) },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Color dots */}
      <Animated.View style={[styles.colorDot, { top: '10%', left: '25%', backgroundColor: '#FF6B6B' }, dotStyle(0)]} />
      <Animated.View style={[styles.colorDot, { top: '15%', right: '25%', backgroundColor: '#4ECDC4' }, dotStyle(0.33)]} />
      <Animated.View style={[styles.colorDot, { top: '25%', left: '15%', backgroundColor: '#FFE66D' }, dotStyle(0.66)]} />

      {/* Main palette */}
      <Animated.Text style={[styles.mainEmoji, { fontSize: size * 0.45 }, mainStyle]}>
        🎨
      </Animated.Text>

      {/* Paint brush */}
      <Animated.View style={[styles.smallIcon, { bottom: '10%', right: '15%' }, brushStyle]}>
        <Animated.Text style={{ fontSize: size * 0.2 }}>
          🖌️
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

// ============================================
// Animation: Details (form + checkmarks)
// ============================================

function DetailsAnimation({ size, colors }: { size: number; colors: any }) {
  const check1 = useSharedValue(0);
  const check2 = useSharedValue(0);
  const check3 = useSharedValue(0);
  const writing = useSharedValue(0);

  useEffect(() => {
    // Staggered checkmarks
    check1.value = withDelay(
      0,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
          withDelay(2000, withTiming(0, { duration: 300 }))
        ),
        -1
      )
    );
    check2.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
          withDelay(2000, withTiming(0, { duration: 300 }))
        ),
        -1
      )
    );
    check3.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
          withDelay(2000, withTiming(0, { duration: 300 }))
        ),
        -1
      )
    );

    // Writing animation
    writing.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1
    );
  }, []);

  const mainStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(writing.value, [0, 1], [1, 1.02]) },
    ],
  }));

  const checkStyle = (progress: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [
        { scale: progress.value },
        { translateX: interpolate(progress.value, [0, 1], [10, 0]) },
      ],
    }));

  const penStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(writing.value, [0, 1], [-10, 10])}deg` },
      { translateX: interpolate(writing.value, [0, 1], [-5, 5]) },
    ],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Checkmarks appearing */}
      <Animated.Text style={[styles.checkmark, { top: '20%', right: '20%' }, checkStyle(check1)]}>
        ✓
      </Animated.Text>
      <Animated.Text style={[styles.checkmark, { top: '35%', right: '15%' }, checkStyle(check2)]}>
        ✓
      </Animated.Text>
      <Animated.Text style={[styles.checkmark, { top: '50%', right: '22%' }, checkStyle(check3)]}>
        ✓
      </Animated.Text>

      {/* Main clipboard */}
      <Animated.Text style={[styles.mainEmoji, { fontSize: size * 0.45 }, mainStyle]}>
        📋
      </Animated.Text>

      {/* Pen */}
      <Animated.View style={[styles.smallIcon, { bottom: '10%', right: '20%' }, penStyle]}>
        <Animated.Text style={{ fontSize: size * 0.18 }}>
          ✏️
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainEmoji: {
    textAlign: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 2,
    top: 0,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 24,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 3,
    opacity: 0.3,
  },
  smallIcon: {
    position: 'absolute',
  },
  colorDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 14,
  },
  checkmark: {
    position: 'absolute',
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
