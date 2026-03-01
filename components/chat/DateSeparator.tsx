import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';

interface DateSeparatorProps {
  date: string;
}

function formatDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const messageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (messageDay.getTime() === today.getTime()) {
    return "Aujourd'hui";
  }
  if (messageDay.getTime() === yesterday.getTime()) {
    return 'Hier';
  }
  return date.toLocaleDateString('fr-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export const DateSeparator = React.memo(function DateSeparator({
  date,
}: DateSeparatorProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
      <Text style={[styles.text, { color: colors.textTertiary }]}>{formatDateLabel(date)}</Text>
      <View style={[styles.line, { backgroundColor: colors.border }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    fontSize: Layout.fontSize.xs,
    paddingHorizontal: Layout.spacing.md,
    textTransform: 'capitalize',
  },
});
