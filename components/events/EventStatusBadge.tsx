import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface EventStatusBadgeProps {
  eventType: string;
  size?: 'sm' | 'md';
}

const typeConfig: Record<string, { label: string; bg: string; text: string }> = {
  mariage: { label: 'Mariage', bg: Colors.primary[50], text: Colors.primary.DEFAULT },
  anniversaire: { label: 'Anniversaire', bg: Colors.warning.light, text: Colors.warning.dark },
  corporate: { label: 'Corporate', bg: '#E0F2FE', text: '#0369A1' },
  soiree: { label: 'Soirée', bg: Colors.success.light, text: Colors.success.dark },
  conference: { label: 'Conférence', bg: Colors.gray[100], text: Colors.gray[600] },
  autre: { label: 'Autre', bg: Colors.gray[100], text: Colors.gray[600] },
};

export const EventStatusBadge = React.memo(function EventStatusBadge({
  eventType,
  size = 'md',
}: EventStatusBadgeProps) {
  const config = typeConfig[eventType.toLowerCase()] || typeConfig.autre;

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
