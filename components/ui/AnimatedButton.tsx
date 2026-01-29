import React from 'react';
import {
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { PressableScale } from './PressableScale';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { Animations } from '@/constants/Animations';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type HapticType = 'light' | 'medium' | 'none';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: HapticType;
}

export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  haptic = 'light',
}: AnimatedButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    variant === 'primary' && Shadows.primarySoft,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${variant}` as keyof typeof styles] as TextStyle,
    styles[`text_${size}` as keyof typeof styles] as TextStyle,
    isDisabled && styles.textDisabled,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      scale={Animations.scale.pressed}
      haptic={isDisabled ? 'none' : haptic}
      style={buttonStyles}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.primary.DEFAULT}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radius.md,
    gap: Layout.spacing.sm,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  secondary: {
    backgroundColor: Colors.secondary.DEFAULT,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary.DEFAULT,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
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

  // States
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Text
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: Colors.white,
  },
  text_secondary: {
    color: Colors.primary.DEFAULT,
  },
  text_outline: {
    color: Colors.primary.DEFAULT,
  },
  text_ghost: {
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
  textDisabled: {
    opacity: 0.7,
  },
});
