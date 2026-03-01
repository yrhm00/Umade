import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { PressableScale } from '@/components/ui/PressableScale';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  delay?: number;
  animated?: boolean;
}

export function SectionHeader({
  title,
  actionLabel,
  onAction,
  style,
  delay = 0,
  animated = true,
}: SectionHeaderProps) {
  const colors = useColors();

  const content = (
    <>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {actionLabel && onAction && (
        <PressableScale onPress={onAction} haptic="light" scale={0.95}>
          <Animated.View style={styles.action}>
            <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
            <ChevronRight size={16} color={colors.primary} />
          </Animated.View>
        </PressableScale>
      )}
    </>
  );

  if (animated) {
    return (
      <Animated.View
        entering={FadeInDown.delay(delay).duration(260)}
        style={[styles.container, style]}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, style]}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  actionText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
});
