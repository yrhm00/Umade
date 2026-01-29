import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { Animations } from '@/constants/Animations';

type GlassVariant = 'light' | 'dark';
type GlassPadding = 'none' | 'sm' | 'md' | 'lg';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  blur?: number;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: GlassPadding;
  animated?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  variant = 'light',
  blur = 20,
  style,
  onPress,
  padding = 'md',
  animated = true,
  delay = 0,
}: GlassCardProps) {
  const isLight = variant === 'light';
  const isBlurSupported = Platform.OS === 'ios';

  const containerStyle: ViewStyle = {
    backgroundColor: isBlurSupported
      ? 'transparent'
      : isLight
      ? Colors.glass.light
      : Colors.glass.dark,
    borderWidth: 1,
    borderColor: isLight ? Colors.glass.border : Colors.glass.borderLight,
    borderRadius: Layout.radius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  };

  const contentStyle = [
    styles.content,
    padding !== 'none' && (styles[`padding_${padding}` as keyof typeof styles] as ViewStyle),
  ].filter(Boolean);

  const content = (
    <>
      {isBlurSupported && (
        <BlurView
          intensity={blur}
          tint={isLight ? 'light' : 'dark'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={contentStyle}>{children}</View>
    </>
  );

  const enteringAnimation = animated
    ? FadeIn.delay(delay).duration(400)
    : undefined;

  if (onPress) {
    return (
      <Animated.View entering={enteringAnimation}>
        <PressableScale
          onPress={onPress}
          scale={Animations.scale.pressedSubtle}
          haptic="light"
          style={[containerStyle, style]}
        >
          {content}
        </PressableScale>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[containerStyle, style]}
      entering={enteringAnimation}
    >
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {},
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
