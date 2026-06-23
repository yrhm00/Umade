import { PressableScale } from '@/components/ui/PressableScale';
import type { ThemeColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import {
  ArrowUpRight,
  CalendarDays,
  CheckSquare2,
  Heart,
  MapPin,
  Sparkles,
  Users,
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

interface QuickAction {
  icon: LucideIcon;
  label: string;
  accent: string;
  onPress: () => void;
}

export function HomeOverview({
  colors,
  isDark,
  firstName,
  eventName,
  eventLabel,
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
    eventName || (eventLabel === 'Événement' ? 'Ton événement' : eventLabel);
  const locationLabel = location?.trim() || 'Lieu à définir';
  const counter = getCounter(daysUntil);

  const surface = isDark ? colors.backgroundSecondary : '#FFFFFF';
  const subtle = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const borderColor = isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(17, 24, 39, 0.08)';
  const mutedText = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(17, 24, 39, 0.5)';

  const metaItems = [
    { icon: MapPin, label: locationLabel },
    typeof guestCount === 'number' && guestCount > 0
      ? { icon: Users, label: `${guestCount} invités` }
      : preferredStyle
        ? { icon: Sparkles, label: preferredStyle }
        : { icon: Sparkles, label: 'Style à définir' },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: CheckSquare2,
      label: 'Checklist',
      accent: '#10B981',
      onPress: onOpenChecklist,
    },
    {
      icon: CalendarDays,
      label: 'Événements',
      accent: '#F59E0B',
      onPress: onOpenEvents,
    },
    {
      icon: Heart,
      label: 'Favoris',
      accent: '#EF4444',
      onPress: onOpenFavorites,
    },
  ];

  return (
    <Animated.View
      entering={FadeInDown.duration(280)}
      style={styles.container}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={[styles.greetingHello, { color: mutedText }]}>
          Bonjour
        </Text>
        <Text style={[styles.greetingName, { color: colors.text }]} numberOfLines={1}>
          {firstName}
        </Text>
      </View>

      {/* Hero card */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: surface, borderColor },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroLeft}>
            <Text style={[styles.heroEyebrow, { color: mutedText }]}>
              {counter.eyebrow}
            </Text>
            <View style={styles.heroCounterRow}>
              <Text
                style={[
                  styles.heroCounter,
                  counter.isPlaceholder && styles.heroCounterPlaceholder,
                  { color: colors.text },
                ]}
                numberOfLines={1}
              >
                {counter.value}
              </Text>
              {counter.unit ? (
                <Text style={[styles.heroCounterUnit, { color: mutedText }]}>
                  {counter.unit}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroBody}>
          <Text style={[styles.heroTitle, { color: colors.text }]} numberOfLines={1}>
            {eventTitle}
          </Text>
          <View style={styles.heroMetaRow}>
            {metaItems.map((item, i) => (
              <View key={i} style={styles.heroMetaItem}>
                <item.icon size={13} color={mutedText} strokeWidth={2} />
                <Text
                  style={[styles.heroMetaText, { color: mutedText }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <PressableScale
          onPress={onFindProviders}
          haptic="light"
          accessibilityLabel="Trouver des prestataires"
          style={[styles.heroCta, { backgroundColor: colors.text }]}
        >
          <Text style={[styles.heroCtaLabel, { color: surface }]}>
            Trouver des prestataires
          </Text>
          <ArrowUpRight size={18} color={surface} strokeWidth={2.2} />
        </PressableScale>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        {quickActions.map((action) => (
          <QuickActionTile
            key={action.label}
            action={action}
            surface={surface}
            borderColor={borderColor}
            mutedText={mutedText}
            textColor={colors.text}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function QuickActionTile({
  action,
  surface,
  borderColor,
  mutedText,
  textColor,
}: {
  action: QuickAction;
  surface: string;
  borderColor: string;
  mutedText: string;
  textColor: string;
}) {
  const Icon = action.icon;
  return (
    <PressableScale
      onPress={action.onPress}
      haptic="light"
      accessibilityLabel={action.label}
      style={[styles.quickTile, { backgroundColor: surface, borderColor }]}
    >
      <View style={[styles.quickIconWrap, { backgroundColor: action.accent + '14' }]}>
        <Icon size={16} color={action.accent} strokeWidth={2.2} />
      </View>
      <Text style={[styles.quickLabel, { color: textColor }]} numberOfLines={1}>
        {action.label}
      </Text>
    </PressableScale>
  );
}

function getCounter(daysUntil: number | null) {
  if (daysUntil === null) {
    return { eyebrow: 'À PLANIFIER', value: '—', unit: 'date à définir', isPlaceholder: true };
  }
  if (daysUntil < 0) {
    return {
      eyebrow: 'SOUVENIR',
      value: String(Math.abs(daysUntil)),
      unit: Math.abs(daysUntil) === 1 ? 'jour passé' : 'jours passés',
      isPlaceholder: false,
    };
  }
  if (daysUntil === 0) {
    return { eyebrow: "AUJOURD'HUI", value: 'J', unit: 'jour J', isPlaceholder: false };
  }
  return {
    eyebrow: 'COMPTE À REBOURS',
    value: `J-${daysUntil}`,
    unit: daysUntil === 1 ? 'jour restant' : 'jours restants',
    isPlaceholder: false,
  };
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.md,
  },

  // Greeting
  greeting: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  greetingHello: {
    fontFamily: fontFamily.medium,
    fontSize: 22,
    letterSpacing: -0.4,
  },
  greetingName: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    letterSpacing: -0.6,
    flexShrink: 1,
  },

  // Hero card
  heroCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
  },
  heroEyebrow: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroCounterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroCounter: {
    fontFamily: fontFamily.bold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -2,
  },
  heroCounterPlaceholder: {
    fontSize: 32,
    fontStyle: 'italic',
  },
  heroCounterUnit: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.06)',
    marginVertical: 14,
  },

  // Hero body (event meta)
  heroBody: {
    marginBottom: 16,
    gap: 8,
  },
  heroTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 17,
    letterSpacing: -0.4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '48%',
  },
  heroMetaText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    letterSpacing: -0.1,
  },

  // CTA
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  heroCtaLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    letterSpacing: -0.2,
  },

  // Quick actions
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  quickIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
});
