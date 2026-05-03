import { PressableScale } from '@/components/ui/PressableScale';
import type { ThemeColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

interface ClientHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  colors: ThemeColors;
  isDark: boolean;
  leadingIcon?: LucideIcon;
  onLeading?: () => void;
  leadingLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionTintColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function ClientHeader({
  eyebrow,
  title,
  subtitle,
  colors,
  isDark,
  leadingIcon: LeadingIcon,
  onLeading,
  leadingLabel,
  actionIcon: ActionIcon,
  onAction,
  actionLabel,
  actionDisabled = false,
  actionTintColor,
  style,
}: ClientHeaderProps) {
  const actionBackground = isDark
    ? 'rgba(143, 119, 184, 0.18)'
    : '#FFFFFF';
  const actionBorder = isDark
    ? 'rgba(143, 119, 184, 0.28)'
    : 'rgba(95, 74, 139, 0.12)';
  const iconColor = actionTintColor ?? colors.primary;

  return (
    <View style={[styles.container, style]}>
      {LeadingIcon && onLeading ? (
        <PressableScale
          onPress={onLeading}
          haptic="light"
          accessibilityLabel={leadingLabel}
          style={[
            styles.action,
            {
              backgroundColor: actionBackground,
              borderColor: actionBorder,
              shadowColor: isDark ? '#000000' : '#5F4A8B',
            },
          ]}
        >
          <LeadingIcon size={22} color={colors.text} strokeWidth={2.4} />
        </PressableScale>
      ) : null}

      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>
          {eyebrow}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {ActionIcon && onAction ? (
        <PressableScale
          onPress={onAction}
          haptic="light"
          accessibilityLabel={actionLabel}
          disabled={actionDisabled}
          style={[
            styles.action,
            {
              backgroundColor: actionBackground,
              borderColor: actionBorder,
              shadowColor: isDark ? '#000000' : '#5F4A8B',
              opacity: actionDisabled ? 0.5 : 1,
            },
          ]}
        >
          <ActionIcon size={22} color={iconColor} strokeWidth={2.4} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    marginBottom: 4,
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Layout.fontSize['3xl'],
    fontFamily: fontFamily.bold,
    lineHeight: 36,
  },
  subtitle: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.medium,
    lineHeight: 22,
  },
  action: {
    width: 44,
    height: 44,
    borderRadius: Layout.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
  },
});
