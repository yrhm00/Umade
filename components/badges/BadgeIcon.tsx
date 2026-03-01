/**
 * Icône circulaire pour un badge
 * Supporte les états earned/locked
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type BadgeIconSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<BadgeIconSize, { container: number; icon: number; name: number }> = {
  sm: { container: 44, icon: 20, name: 10 },
  md: { container: 56, icon: 26, name: 12 },
  lg: { container: 72, icon: 34, name: 14 },
};

interface BadgeIconProps {
  icon: string;
  name: string;
  earned?: boolean;
  size?: BadgeIconSize;
}

export function BadgeIcon({ icon, name, earned = true, size = 'md' }: BadgeIconProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const dims = SIZE_MAP[size];

  return (
    <View style={[styles.container, { opacity: earned ? 1 : 0.35 }]}>
      <View
        style={[
          styles.iconCircle,
          {
            width: dims.container,
            height: dims.container,
            borderRadius: dims.container / 2,
            backgroundColor: earned
              ? isDark ? `${colors.primary}30` : `${colors.primary}15`
              : isDark ? colors.backgroundTertiary : '#F3F4F6',
          },
        ]}
      >
        <Text style={{ fontSize: dims.icon }}>{icon}</Text>
      </View>
      <Text
        style={[styles.name, { fontSize: dims.name, color: colors.textSecondary }]}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Layout.spacing.xs,
    width: 80,
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
