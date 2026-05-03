import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';

export function EmptyNotifications() {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isDark ? colors.backgroundTertiary : `${colors.primary}10` },
        ]}
      >
        <Bell size={48} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>Aucune notification</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tu recevras ici les notifications concernant tes réservations,
        messages et avis.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.xxl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: Layout.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
