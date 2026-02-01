import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  // Dynamic background and border based on theme
  const variantStyles: ViewStyle = {
    default: {
      backgroundColor: colors.card,
    },
    elevated: {
      backgroundColor: colors.card,
      shadowColor: isDark ? colors.primary : '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    outlined: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
  }[variant];

  const paddingStyles: ViewStyle = {
    none: {},
    sm: { padding: Layout.spacing.sm },
    md: { padding: Layout.spacing.md },
    lg: { padding: Layout.spacing.lg },
  }[padding];

  const cardStyles: ViewStyle[] = [
    styles.base,
    variantStyles,
    paddingStyles,
    style as ViewStyle,
  ].filter(Boolean);

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
  },
});
