import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
  icon,
}: BadgeProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
    default: {
      bg: isDark ? colors.backgroundTertiary : Colors.gray[100],
      text: isDark ? colors.textSecondary : Colors.gray[700]
    },
    success: {
      bg: isDark ? 'rgba(34, 197, 94, 0.2)' : Colors.success.light,
      text: isDark ? '#4ade80' : Colors.success.dark
    },
    warning: {
      bg: isDark ? 'rgba(234, 179, 8, 0.2)' : Colors.warning.light,
      text: isDark ? '#facc15' : Colors.warning.dark
    },
    error: {
      bg: isDark ? 'rgba(239, 68, 68, 0.2)' : Colors.error.light,
      text: isDark ? '#f87171' : Colors.error.dark
    },
    info: {
      bg: isDark ? 'rgba(56, 189, 248, 0.2)' : Colors.primary[100],
      text: isDark ? '#38bdf8' : Colors.primary.DEFAULT
    },
  };

  const activeColors = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        styles[`size_${size}`],
        { backgroundColor: activeColors.bg },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.text,
          styles[`text_${size}`],
          { color: activeColors.text },
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
