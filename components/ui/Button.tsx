import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
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
}

export function Button({
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
}: ButtonProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
    },
    secondary: {
      backgroundColor: Colors.secondary.DEFAULT, // Assuming secondary is constant for now
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    }
  };

  const textVariantStyles = {
    primary: {
      color: Colors.white,
    },
    secondary: {
      color: colors.primary,
    },
    outline: {
      color: colors.primary,
    },
    ghost: {
      color: colors.primary,
    }
  };

  const buttonStyles = [
    styles.base,
    variantStyles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    textVariantStyles[variant],
    styles[`text_${size}`],
    isDisabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
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
    </TouchableOpacity>
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