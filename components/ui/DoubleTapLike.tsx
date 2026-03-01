/**
 * Composant wrapper pour double-tap to like
 * Affiche un cœur animé au centre lors du double-tap
 */

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Heart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface DoubleTapLikeProps {
  children: React.ReactNode;
  onDoubleTap: () => void;
  onSingleTap?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
}

export function DoubleTapLike({
  children,
  onDoubleTap,
  onSingleTap,
  onLongPress,
  disabled = false,
}: DoubleTapLikeProps) {
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const lastTap = useRef<number>(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  const triggerHeart = useCallback(() => {
    'worklet';
    heartScale.value = 0;
    heartOpacity.value = 1;
    heartScale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 170 }),
      withTiming(1, { duration: 300 }),
      withTiming(0, { duration: 200 })
    );
    heartOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 200 })
    );
  }, []);

  const handleDoubleTap = useCallback(() => {
    if (disabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    triggerHeart();
    onDoubleTap();
  }, [disabled, onDoubleTap, triggerHeart]);

  const handleSingleTap = useCallback(() => {
    if (disabled || !onSingleTap) return;
    onSingleTap();
  }, [disabled, onSingleTap]);

  const handleLongPress = useCallback(() => {
    if (disabled || !onLongPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  }, [disabled, onLongPress]);

  // Create gestures
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      runOnJS(handleSingleTap)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      runOnJS(handleLongPress)();
    });

  // Combine gestures - double tap takes priority
  const composedGesture = Gesture.Exclusive(
    doubleTap,
    longPress,
    singleTap
  );

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        {children}

        {/* Heart overlay */}
        <Animated.View style={[styles.heartContainer, heartStyle]} pointerEvents="none">
          <Heart size={80} color="#FFFFFF" fill="#FFFFFF" />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  heartContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
