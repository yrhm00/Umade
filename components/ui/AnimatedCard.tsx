import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  Layout as ReanimatedLayout,
} from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { Animations } from '@/constants/Animations';

type CardVariant = 'default' | 'elevated' | 'outlined';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: CardVariant;
  padding?: CardPadding;
  // Animation props
  entering?: boolean;
  enteringDelay?: number;
  staggerIndex?: number;
}

export function AnimatedCard({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
  entering = true,
  enteringDelay = 0,
  staggerIndex = 0,
}: AnimatedCardProps) {
  const delay = enteringDelay + staggerIndex * Animations.stagger.normal;

  const cardStyles: ViewStyle[] = [
    styles.base,
    styles[variant],
    padding !== 'none' && (styles[`padding_${padding}` as keyof typeof styles] as ViewStyle),
    style,
  ].filter(Boolean) as ViewStyle[];

  // Calculate entering animation
  const enteringAnimation = entering
    ? FadeInDown.delay(delay).springify().damping(15)
    : undefined;

  if (onPress) {
    return (
      <Animated.View
        entering={enteringAnimation}
        layout={ReanimatedLayout.springify()}
      >
        <PressableScale
          onPress={onPress}
          scale={Animations.scale.pressedSubtle}
          haptic="light"
          style={cardStyles}
        >
          {children}
        </PressableScale>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={cardStyles}
      entering={enteringAnimation}
      layout={ReanimatedLayout.springify()}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: Colors.white,
  },
  elevated: {
    backgroundColor: Colors.white,
    ...Shadows.md,
  },
  outlined: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  padding_sm: {
    padding: Layout.spacing.sm,
  },
  padding_md: {
    padding: Layout.spacing.md,
  },
  padding_lg: {
    padding: Layout.spacing.lg,
  },
});
