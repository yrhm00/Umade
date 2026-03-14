/**
 * Indicateur "MAINTENANT" pour la timeline live du Jour J
 * Ligne rouge pulsante avec heure actuelle
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { fontFamily } from '@/constants/Typography';
import { Layout } from '@/constants/Layout';

interface TimelineNowIndicatorProps {
  currentTime: string;
}

export function TimelineNowIndicator({ currentTime }: TimelineNowIndicatorProps) {
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, pulseStyle]} />
      <View style={styles.line} />
      <View style={styles.labelContainer}>
        <Text style={styles.label}>MAINTENANT</Text>
        <Text style={styles.time}>{currentTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    marginLeft: 28,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: -1,
    zIndex: 1,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: '#EF4444',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: Layout.spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Layout.radius.sm,
    marginLeft: Layout.spacing.sm,
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    color: 'rgba(255,255,255,0.9)',
  },
});
