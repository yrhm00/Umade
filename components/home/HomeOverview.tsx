import { PressableScale } from '@/components/ui/PressableScale';
import type { ThemeColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import {
  ArrowRight,
  CalendarDays,
  CheckSquare2,
  Heart,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface HomeOverviewProps {
  colors: ThemeColors;
  isDark: boolean;
  firstName: string;
  eventName?: string | null;
  eventLabel: string;
  eventEmoji: string;
  daysUntil: number | null;
  location?: string | null;
  guestCount?: number | null;
  preferredStyle: string | null;
  onFindProviders: () => void;
  onOpenEvents: () => void;
  onOpenChecklist: () => void;
  onOpenFavorites: () => void;
}

interface MetaItem {
  icon: LucideIcon;
  label: string;
  accent: string;
}

interface QuickAction {
  icon: LucideIcon;
  label: string;
  accent: string;
  backgroundColor: string;
  borderColor: string;
  onPress: () => void;
}

export function HomeOverview({
  colors,
  isDark,
  firstName,
  eventName,
  eventLabel,
  eventEmoji,
  daysUntil,
  location,
  guestCount,
  preferredStyle,
  onFindProviders,
  onOpenEvents,
  onOpenChecklist,
  onOpenFavorites,
}: HomeOverviewProps) {
  const eventTitle =
    eventName || (eventLabel === 'Événement' ? 'Prépare ton événement' : eventLabel);
  const locationLabel = location?.trim() || 'Lieu à choisir';
  const dateLabel = getDateLabel(daysUntil);
  const detailLabel =
    typeof guestCount === 'number' && guestCount > 0
      ? `${guestCount} invités`
      : preferredStyle || 'Style à choisir';

  const surface = isDark ? colors.backgroundSecondary : '#FFFFFF';
  const softSurface = isDark ? 'rgba(255,255,255,0.06)' : '#F8F5F0';
  const borderColor = isDark
    ? 'rgba(143, 119, 184, 0.26)'
    : 'rgba(95, 74, 139, 0.12)';

  const metaItems: MetaItem[] = [
    { icon: CalendarDays, label: dateLabel, accent: colors.primary },
    { icon: MapPin, label: locationLabel, accent: '#2563EB' },
    { icon: Sparkles, label: detailLabel, accent: '#059669' },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: CheckSquare2,
      label: 'Checklist',
      accent: '#059669',
      backgroundColor: isDark ? 'rgba(5, 150, 105, 0.14)' : '#ECFDF5',
      borderColor: isDark ? 'rgba(5, 150, 105, 0.24)' : '#A7F3D0',
      onPress: onOpenChecklist,
    },
    {
      icon: CalendarDays,
      label: 'Événement',
      accent: '#D97706',
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.14)' : '#FFFBEB',
      borderColor: isDark ? 'rgba(217, 119, 6, 0.24)' : '#FDE68A',
      onPress: onOpenEvents,
    },
    {
      icon: Heart,
      label: 'Favoris',
      accent: '#E11D48',
      backgroundColor: isDark ? 'rgba(225, 29, 72, 0.14)' : '#FFF1F2',
      borderColor: isDark ? 'rgba(225, 29, 72, 0.24)' : '#FECDD3',
      onPress: onOpenFavorites,
    },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(40).duration(260)}
      style={styles.container}
    >
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>
            Ton espace
          </Text>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            Bonjour {firstName}
          </Text>
        </View>
        <View style={[styles.emojiBadge, { backgroundColor: softSurface }]}>
          <Text style={styles.emoji}>{eventEmoji}</Text>
        </View>
      </View>

      <Text
        style={[styles.subtitle, { color: colors.textSecondary }]}
        numberOfLines={2}
      >
        {getHomeSubtitle(daysUntil)}
      </Text>

      <View
        style={[
          styles.focusCard,
          {
            backgroundColor: surface,
            borderColor,
            shadowColor: isDark ? '#000000' : '#5F4A8B',
          },
        ]}
      >
        <View style={styles.focusHeader}>
          <View style={[styles.focusIcon, { backgroundColor: softSurface }]}>
            <CalendarDays size={20} color={colors.primary} strokeWidth={2.4} />
          </View>
          <View style={styles.focusCopy}>
            <Text style={[styles.focusTitle, { color: colors.text }]} numberOfLines={1}>
              {eventTitle}
            </Text>
            <Text
              style={[styles.focusSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {getFocusLine(daysUntil, locationLabel)}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {metaItems.map((item) => (
            <MetaChip
              key={item.label}
              item={item}
              colors={colors}
              isDark={isDark}
            />
          ))}
        </View>

        <PressableScale
          onPress={onFindProviders}
          haptic="light"
          accessibilityLabel="Trouver des prestataires"
          style={[styles.primaryAction, { backgroundColor: colors.primary }]}
        >
          <View style={styles.primaryActionIcon}>
            <Search size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View style={styles.primaryActionCopy}>
            <Text style={styles.primaryActionLabel}>Trouver des prestataires</Text>
            <Text style={styles.primaryActionCaption} numberOfLines={1}>
              Photo, traiteur, DJ...
            </Text>
          </View>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
        </PressableScale>
      </View>

      <View style={styles.quickActionsRow}>
        {quickActions.map((action) => (
          <QuickActionPill key={action.label} action={action} />
        ))}
      </View>
    </Animated.View>
  );
}

function MetaChip({
  item,
  colors,
  isDark,
}: {
  item: MetaItem;
  colors: ThemeColors;
  isDark: boolean;
}) {
  const Icon = item.icon;
  return (
    <View
      style={[
        styles.metaChip,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8F5F0',
        },
      ]}
    >
      <Icon size={13} color={item.accent} strokeWidth={2.4} />
      <Text style={[styles.metaText, { color: colors.text }]} numberOfLines={1}>
        {item.label}
      </Text>
    </View>
  );
}

function QuickActionPill({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <PressableScale
      onPress={action.onPress}
      haptic="light"
      accessibilityLabel={action.label}
      style={[
        styles.quickAction,
        {
          backgroundColor: action.backgroundColor,
          borderColor: action.borderColor,
        },
      ]}
    >
      <Icon size={16} color={action.accent} strokeWidth={2.4} />
      <Text style={[styles.quickActionText, { color: action.accent }]} numberOfLines={1}>
        {action.label}
      </Text>
    </PressableScale>
  );
}

function getDateLabel(daysUntil: number | null) {
  if (daysUntil === null) return 'Date à fixer';
  if (daysUntil < 0) return 'Événement passé';
  if (daysUntil === 0) return 'Aujourd’hui';
  if (daysUntil === 1) return 'Demain';
  return `J-${daysUntil}`;
}

function getFocusLine(daysUntil: number | null, locationLabel: string) {
  if (daysUntil === null) {
    if (locationLabel === 'Lieu à choisir') {
      return 'Date, lieu et style à définir';
    }
    return `Date à fixer · ${locationLabel}`;
  }
  if (daysUntil < 0) {
    return 'Garde les contacts qui ont compté';
  }
  if (daysUntil === 0) {
    return `Aujourd’hui · ${locationLabel}`;
  }
  if (daysUntil === 1) {
    return `Demain · ${locationLabel}`;
  }
  return `J-${daysUntil} · ${locationLabel}`;
}

function getHomeSubtitle(daysUntil: number | null) {
  if (daysUntil === null) {
    return 'Pose les bases, puis avance vers les bons prestataires.';
  }
  if (daysUntil < 0) {
    return 'Retrouve tes contacts, avis et inspirations en un coup d’œil.';
  }
  if (daysUntil <= 7) {
    return 'Priorise les confirmations et les derniers échanges.';
  }
  return 'Inspire-toi, compare et avance sur les réservations clés.';
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Layout.spacing.md,
  },
  headingCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    marginBottom: 3,
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: Layout.fontSize['3xl'],
    fontFamily: fontFamily.bold,
    lineHeight: 36,
  },
  emojiBadge: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  subtitle: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.medium,
    lineHeight: 22,
  },
  focusCard: {
    marginTop: Layout.spacing.md,
    borderWidth: 1,
    borderRadius: Layout.radius.sm,
    padding: Layout.spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  focusIcon: {
    width: 42,
    height: 42,
    borderRadius: Layout.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusCopy: {
    flex: 1,
    minWidth: 0,
  },
  focusTitle: {
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.bold,
  },
  focusSubtitle: {
    marginTop: 2,
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  metaChip: {
    minHeight: 30,
    maxWidth: '100%',
    borderRadius: Layout.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Layout.spacing.sm,
  },
  metaText: {
    maxWidth: 190,
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
  },
  primaryAction: {
    minHeight: 58,
    borderRadius: Layout.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
  },
  primaryActionIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionCopy: {
    flex: 1,
    minWidth: 0,
  },
  primaryActionLabel: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  primaryActionCaption: {
    marginTop: 2,
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.medium,
    color: 'rgba(255,255,255,0.78)',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  quickAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: Layout.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
  },
  quickActionText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.bold,
  },
});
