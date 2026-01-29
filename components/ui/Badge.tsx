import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.gray[100], text: Colors.gray[700] },
  success: { bg: Colors.success.light, text: Colors.success.dark },
  warning: { bg: Colors.warning.light, text: Colors.warning.dark },
  error: { bg: Colors.error.light, text: Colors.error.dark },
  info: { bg: Colors.primary[100], text: Colors.primary.DEFAULT },
};

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
  icon,
}: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        styles[`size_${size}`],
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          styles[`text_${size}`],
          { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radius.full,
  },

  // Sizes
  size_sm: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
  },

  // Text
  text: {
    fontWeight: '500',
  },
  text_sm: {
    fontSize: Layout.fontSize.xs,
  },
  text_md: {
    fontSize: Layout.fontSize.sm,
  },

  icon: {
    marginRight: 4,
  },
});
