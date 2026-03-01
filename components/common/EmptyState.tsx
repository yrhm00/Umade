import { Button } from '@/components/ui/Button';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const colors = useColors();

  const renderIcon = () => {
    if (!icon) return null;

    // Legacy emoji string support
    if (typeof icon === 'string') {
      return (
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}10` }]}>
          <Text style={styles.iconEmoji}>{icon}</Text>
        </View>
      );
    }

    // Lucide icon or React node
    return (
      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}10` }]}>
        {icon}
      </View>
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={[styles.container, style]}
    >
      {renderIcon()}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          size="md"
          style={styles.button}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.lg,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  description: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
    opacity: 0.8,
  },
  button: {
    minWidth: 150,
  },
});
