import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookingStatus } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface BookingStatusBadgeProps {
  status: BookingStatus | null;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: {
    label: 'En attente',
    bg: Colors.warning.light,
    text: Colors.warning.dark,
  },
  confirmed: {
    label: 'Confirmé',
    bg: Colors.success.light,
    text: Colors.success.dark,
  },
  cancelled: {
    label: 'Annulé',
    bg: Colors.error.light,
    text: Colors.error.dark,
  },
  completed: {
    label: 'Terminé',
    bg: Colors.gray[100],
    text: Colors.gray[600],
  },
};

export const BookingStatusBadge = React.memo(function BookingStatusBadge({
  status,
  size = 'md',
}: BookingStatusBadgeProps) {
  const config = statusConfig[status || 'pending'];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg },
        size === 'sm' && styles.containerSm,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.text },
          size === 'sm' && styles.textSm,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
  },
  containerSm: {
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
  },
  text: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
});
