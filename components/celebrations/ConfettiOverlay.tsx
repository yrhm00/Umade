/**
 * Overlay de confettis pour les célébrations (Phase 10)
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

export interface ConfettiOverlayRef {
  fire: () => void;
}

interface ConfettiOverlayProps {
  count?: number;
  origin?: { x: number; y: number };
  fallSpeed?: number;
  fadeOut?: boolean;
  colors?: string[];
}

export const ConfettiOverlay = forwardRef<ConfettiOverlayRef, ConfettiOverlayProps>(
  (
    {
      count = 150,
      origin = { x: width / 2, y: -20 },
      fallSpeed = 3000,
      fadeOut = true,
      colors = [
        Colors.primary.DEFAULT,
        Colors.primary[300],
        Colors.secondary.DEFAULT,
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
      ],
    },
    ref
  ) => {
    const confettiRef = useRef<ConfettiCannon>(null);

    useImperativeHandle(ref, () => ({
      fire: () => {
        confettiRef.current?.start();
      },
    }));

    return (
      <View pointerEvents="none" style={styles.overlay}>
        <ConfettiCannon
          ref={confettiRef}
          count={count}
          origin={origin}
          autoStart={false}
          fadeOut={fadeOut}
          fallSpeed={fallSpeed}
          explosionSpeed={350}
          colors={colors}
        />
      </View>
    );
  }
);

ConfettiOverlay.displayName = 'ConfettiOverlay';

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
