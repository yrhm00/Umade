import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

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
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, isSelected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
    backgroundColor: Colors.gray[100],
    gap: Layout.spacing.xs,
  },
  containerSelected: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  labelSelected: {
    color: Colors.white,
  },
});
