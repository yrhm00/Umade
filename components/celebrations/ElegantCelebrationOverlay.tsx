import { useColors } from '@/hooks/useColors';
import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PetalConfig = {
  startX: number;
  endX: number;
  delay: number;
  size: number;
  rotationStart: number;
  rotationEnd: number;
  opacity: number;
};

const buildPetalConfigs = (): PetalConfig[] => {
  const configs: PetalConfig[] = [];
  const perSide = 7;

  for (let i = 0; i < perSide; i += 1) {
    const yDelay = i * 0.06;
    const size = 11 + (i % 3) * 3;
    const opacity = 0.75 - i * 0.05;

    configs.push({
      startX: 12 + (i % 2) * 12,
      endX: 62 + (i % 3) * 10,
      delay: yDelay,
      size,
      rotationStart: -18 - i * 4,
      rotationEnd: 24 + i * 6,
      opacity,
    });

    configs.push({
      startX: SCREEN_WIDTH - 12 - (i % 2) * 14,
      endX: SCREEN_WIDTH - 62 - (i % 3) * 10,
      delay: yDelay + 0.03,
      size,
      rotationStart: 16 + i * 4,
      rotationEnd: -24 - i * 5,
      opacity,
    });
  }

  return configs;
};

const PETAL_COLORS = ['#F8F4FF', '#F2E9FF', '#EFE2FF', '#EBDDFB'];

interface PetalProps {
  config: PetalConfig;
  progress: SharedValue<number>;
  color: string;
}

function Petal({ config, progress, color }: PetalProps) {
  const style = useAnimatedStyle(() => {
    const localProgress = Math.min(
      1,
      Math.max(0, (progress.value - config.delay) / (1 - config.delay))
    );

    return {
      opacity: interpolate(localProgress, [0, 0.14, 0.88, 1], [0, config.opacity, config.opacity, 0]),
      transform: [
        { translateX: interpolate(localProgress, [0, 1], [config.startX, config.endX]) },
        { translateY: interpolate(localProgress, [0, 1], [-54, SCREEN_HEIGHT + 72]) },
        { rotate: `${interpolate(localProgress, [0, 1], [config.rotationStart, config.rotationEnd])}deg` },
        { scale: interpolate(localProgress, [0, 0.2, 1], [0.9, 1, 0.86]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.petal,
        {
          width: config.size,
          height: config.size * 1.5,
          borderRadius: config.size,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export interface ElegantCelebrationOverlayRef {
  fire: () => void;
}

export const ElegantCelebrationOverlay = forwardRef<ElegantCelebrationOverlayRef>(function ElegantCelebrationOverlay(
  _props,
  ref
) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const progress = useSharedValue(0);
  const glow = useSharedValue(0);
  const petals = useMemo(() => buildPetalConfigs(), []);

  useImperativeHandle(ref, () => ({
    fire: () => {
      setVisible(true);
      progress.value = 0;
      glow.value = 0;

      glow.value = withTiming(1, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      }, () => {
        glow.value = withTiming(0, {
          duration: 980,
          easing: Easing.out(Easing.quad),
        });
      });

      progress.value = withTiming(
        1,
        {
          duration: 2300,
          easing: Easing.out(Easing.quad),
        },
        (finished) => {
          if (finished) {
            runOnJS(setVisible)(false);
          }
        }
      );
    },
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.9]),
    transform: [
      { scale: interpolate(glow.value, [0, 1], [0.7, 1.14]) },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.48]),
    transform: [
      { scale: interpolate(glow.value, [0, 1], [0.82, 1.22]) },
    ],
  }));

  if (!visible) {
    return null;
  }

  return (
    <Animated.View pointerEvents="none" style={styles.overlay}>
      <Animated.View style={[styles.centerGlow, { backgroundColor: `${colors.primary}24` }, glowStyle]} />
      <Animated.View style={[styles.ring, { borderColor: `${colors.primary}44` }, ringStyle]} />
      {petals.map((petal, index) => (
        <Petal
          key={`${petal.startX}-${index}`}
          config={petal}
          progress={progress}
          color={PETAL_COLORS[index % PETAL_COLORS.length]}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  centerGlow: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.21,
    left: SCREEN_WIDTH * 0.5 - 86,
    width: 172,
    height: 172,
    borderRadius: 86,
  },
  ring: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: SCREEN_WIDTH * 0.5 - 98,
    width: 196,
    height: 196,
    borderRadius: 98,
    borderWidth: 1.5,
  },
  petal: {
    position: 'absolute',
  },
});

