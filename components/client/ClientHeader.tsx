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
    ? 'rgba(255,255,255,0.04)'
    : '#FFFFFF';
  const actionBorder = isDark
    ? 'rgba(255,255,255,0.10)'
    : 'rgba(17, 24, 39, 0.10)';
  const iconColor = actionTintColor ?? colors.text;

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
            },
          ]}
        >
          <LeadingIcon size={20} color={colors.text} strokeWidth={2} />
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
              opacity: actionDisabled ? 0.5 : 1,
            },
          ]}
        >
          <ActionIcon size={20} color={iconColor} strokeWidth={2} />
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
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    marginBottom: 6,
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 30,
    fontFamily: fontFamily.bold,
    lineHeight: 36,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  action: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
