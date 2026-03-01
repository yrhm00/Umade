import React from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { PressableScale } from '@/components/ui/PressableScale';

interface CategoryPillProps {
  label: string;
  icon?: string;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CategoryPill({
  label,
  icon,
  isSelected = false,
  onPress,
  style,
}: CategoryPillProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const containerBg = isSelected
    ? colors.primary
    : isDark
    ? colors.backgroundTertiary
    : Colors.gray[100];

  const borderColor = isSelected
    ? colors.primary
    : isDark
    ? colors.border
    : 'transparent';

  const textColor = isSelected ? '#FFFFFF' : colors.text;

  return (
    <PressableScale
      scale={0.95}
      haptic="selection"
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: containerBg,
          borderColor,
        },
        style,
      ]}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, { color: textColor }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
    gap: Layout.spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
});
