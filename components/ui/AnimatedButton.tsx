import { Animations } from '@/constants/Animations';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Shadows } from '@/constants/Shadows';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { PressableScale } from './PressableScale';

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
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const isDisabled = disabled || loading;

  const getVariantStyle = (variant: ButtonVariant): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'secondary':
        return { backgroundColor: Colors.secondary.DEFAULT };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary
        };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      default:
        return {};
    }
  };

  const getTextStyle = (variant: ButtonVariant): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: Colors.white };
      case 'secondary':
        return { color: colors.primary };
      case 'outline':
        return { color: colors.primary };
      case 'ghost':
        return { color: colors.primary };
      default:
        return {};
    }
  };


  const buttonStyles: ViewStyle[] = [
    styles.base,
    getVariantStyle(variant),
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    variant === 'primary' && Shadows.primarySoft,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    getTextStyle(variant),
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
          color={variant === 'primary' ? Colors.white : colors.primary}
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
