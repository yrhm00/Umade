import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

interface NotificationBadgeProps {
  count: number;
  size?: 'sm' | 'md';
}

export function NotificationBadge({
  count,
  size = 'sm',
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        isSmall ? styles.containerSm : styles.containerMd,
      ]}
    >
      <Text style={[styles.text, isSmall ? styles.textSm : styles.textMd]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.error.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  containerSm: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    top: -4,
    right: -4,
  },
  containerMd: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    top: -6,
    right: -6,
  },
  text: {
    color: Colors.white,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
