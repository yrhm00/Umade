import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { Animations } from '@/constants/Animations';

type GradientPreset = 'primary' | 'primaryReverse' | 'cream' | 'sunset';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  gradient?: GradientPreset;
  customColors?: readonly string[];
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function GradientButton({
  title,
  onPress,
  gradient = 'primary',
  customColors,
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: GradientButtonProps) {
  const isDisabled = disabled || loading;
  const colors = customColors || Colors.gradients[gradient];
  const isLightGradient = gradient === 'cream';

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      scale={Animations.scale.pressed}
      haptic={isDisabled ? 'none' : 'medium'}
      style={[styles.container, fullWidth && styles.fullWidth, style]}
    >
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          styles[`size_${size}` as keyof typeof styles] as ViewStyle,
          Shadows.primary,
          isDisabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={isLightGradient ? Colors.primary.DEFAULT : Colors.white}
            size="small"
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <Text
              style={[
                styles.text,
                styles[`text_${size}` as keyof typeof styles] as TextStyle,
                isLightGradient && styles.textDark,
                textStyle,
              ]}
            >
              {title}
            </Text>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radius.md,
    gap: Layout.spacing.sm,
  },
  size_sm: {
    height: Layout.buttonHeight.sm,
    paddingHorizontal: Layout.spacing.md,
  },
  size_md: {
    height: Layout.buttonHeight.md,
    paddingHorizontal: Layout.spacing.lg,
  },
  size_lg: {
    height: Layout.buttonHeight.lg,
    paddingHorizontal: Layout.spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.white,
    fontWeight: '600',
  },
  textDark: {
    color: Colors.primary.DEFAULT,
  },
  text_sm: {
    fontSize: Layout.fontSize.sm,
  },
  text_md: {
    fontSize: Layout.fontSize.md,
  },
  text_lg: {
    fontSize: Layout.fontSize.lg,
  },
});
