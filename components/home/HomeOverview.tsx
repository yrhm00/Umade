import { PressableScale } from '@/components/ui/PressableScale';
import type { ThemeColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import {
  ArrowUpRight,
  CheckSquare2,
  Heart,
  Sparkles,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
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

const FESTIVE = {
  coral: '#FF5A5F',
  sunflower: '#F2B14A',
  mint: '#5CC9B0',
  blush: '#FFB6B6',
  cream: '#FBF6EC',
};

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })!;

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
    eventName || (eventLabel === 'Événement' ? 'Ton événement' : eventLabel);
  const locationLabel = location?.trim() || 'Lieu à choisir';
  const detailLabel =
    typeof guestCount === 'number' && guestCount > 0
      ? `${guestCount} invités`
      : preferredStyle || 'Style à choisir';

  const cream = isDark ? 'rgba(255, 250, 240, 0.04)' : FESTIVE.cream;
  const surfaceText = isDark ? colors.text : '#1A1626';
  const muted = isDark ? colors.textSecondary : 'rgba(26, 22, 38, 0.55)';

  const counter = getCounterParts(daysUntil);

  return (
    <Animated.View
      entering={FadeInDown.delay(40).duration(280)}
      style={styles.container}
    >
      {/* Greeting strip */}
      <View style={styles.greetingRow}>
        <View style={[styles.dot, { backgroundColor: FESTIVE.coral }]} />
        <Text style={[styles.greetingText, { color: muted }]} numberOfLines={1}>
          bonjour, {firstName.toLowerCase()}
        </Text>
      </View>

      {/* Hero — layered shapes + giant counter */}
      <View
        style={[
          styles.hero,
          {
            backgroundColor: cream,
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,22,38,0.06)',
          },
        ]}
      >
        {/* Decorative layered shapes */}
        <View style={[styles.blob, styles.blobMint]} pointerEvents="none" />
        <View style={[styles.blob, styles.blobSun]} pointerEvents="none" />
        <View style={[styles.blob, styles.blobBlush]} pointerEvents="none" />
        <View style={styles.confettiA} pointerEvents="none" />
        <View style={styles.confettiB} pointerEvents="none" />
        <View style={styles.confettiC} pointerEvents="none" />

        {/* Top tag */}
        <View style={styles.heroTopRow}>
          <View style={[styles.tag, { borderColor: surfaceText }]}>
            <Text style={[styles.tagText, { color: surfaceText }]}>
              {counter.tag}
            </Text>
          </View>
          <Text style={styles.heroEmoji}>{eventEmoji}</Text>
        </View>

        {/* Massive counter */}
        <View style={styles.counterRow}>
          {counter.isPlaceholder ? (
            <Text style={[styles.counterPlaceholder, { color: surfaceText }]}>
              {counter.value}
            </Text>
          ) : (
            <Text style={[styles.counterNumber, { color: surfaceText }]} numberOfLines={1}>
              {counter.value}
            </Text>
          )}
          {counter.unit ? (
            <Text style={[styles.counterUnit, { color: surfaceText }]}>
              {counter.unit}
            </Text>
          ) : null}
        </View>

        {/* Description */}
        <Text style={[styles.heroCaption, { color: muted }]} numberOfLines={2}>
          {counter.caption}
        </Text>
        <Text
          style={[styles.heroEventName, { color: surfaceText }]}
          numberOfLines={1}
        >
          {eventTitle.toUpperCase()}
        </Text>

        {/* Meta line */}
        <View style={styles.metaLine}>
          <Text style={[styles.metaText, { color: surfaceText }]} numberOfLines={1}>
            {locationLabel}
          </Text>
          <View style={[styles.metaSep, { backgroundColor: surfaceText }]} />
          <Text style={[styles.metaText, { color: surfaceText }]} numberOfLines={1}>
            {detailLabel}
          </Text>
        </View>

        {/* Split CTA: pill label + square arrow */}
        <View style={styles.ctaRow}>
          <PressableScale
            onPress={onFindProviders}
            haptic="light"
            accessibilityLabel="Trouver des prestataires"
            style={[
              styles.ctaPill,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(26,22,38,0.08)',
              },
            ]}
          >
            <Text style={[styles.ctaPillLabel, { color: surfaceText }]}>
              Trouve tes prestataires
            </Text>
            <Text style={[styles.ctaPillSub, { color: muted }]} numberOfLines={1}>
              photo · traiteur · DJ · fleurs
            </Text>
          </PressableScale>

          <PressableScale
            onPress={onFindProviders}
            haptic="medium"
            accessibilityLabel="Trouver des prestataires"
            style={[styles.ctaArrow, { backgroundColor: FESTIVE.coral }]}
          >
            <ArrowUpRight size={26} color="#FFFFFF" strokeWidth={2.6} />
          </PressableScale>
        </View>
      </View>

      {/* Festive quick actions */}
      <View style={styles.quickRow}>
        <QuickAction
          label="Checklist"
          icon={CheckSquare2}
          accent={FESTIVE.mint}
          onPress={onOpenChecklist}
          isDark={isDark}
        />
        <QuickAction
          label="Événements"
          icon={Sparkles}
          accent={FESTIVE.sunflower}
          onPress={onOpenEvents}
          isDark={isDark}
        />
        <QuickAction
          label="Favoris"
          icon={Heart}
          accent={FESTIVE.coral}
          onPress={onOpenFavorites}
          isDark={isDark}
        />
      </View>
    </Animated.View>
  );
}

function QuickAction({
  label,
  icon: Icon,
  accent,
  onPress,
  isDark,
}: {
  label: string;
  icon: LucideIcon;
  accent: string;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      accessibilityLabel={label}
      style={[
        styles.quickAction,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,22,38,0.06)',
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: accent }]}>
        <Icon size={16} color="#FFFFFF" strokeWidth={2.6} />
      </View>
      <Text
        style={[
          styles.quickLabel,
          { color: isDark ? '#FFFFFF' : '#1A1626' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

function getCounterParts(daysUntil: number | null) {
  if (daysUntil === null) {
    return {
      tag: 'À PLANIFIER',
      value: 'bientôt',
      unit: '',
      caption: 'Pose la date pour démarrer le compte à rebours.',
      isPlaceholder: true,
    };
  }
  if (daysUntil < 0) {
    return {
      tag: 'SOUVENIR',
      value: String(Math.abs(daysUntil)),
      unit: 'j après',
      caption: 'Garde tes contacts et inspirations en mémoire.',
      isPlaceholder: false,
    };
  }
  if (daysUntil === 0) {
    return {
      tag: "C'EST AUJOURD'HUI",
      value: 'J',
      unit: 'JOUR',
      caption: 'Profite à fond, tout est prêt.',
      isPlaceholder: false,
    };
  }
  return {
    tag: 'COMPTE À REBOURS',
    value: String(daysUntil),
    unit: daysUntil === 1 ? 'jour' : 'jours',
    caption: 'avant ton',
    isPlaceholder: false,
  };
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.lg,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Layout.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  greetingText: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  hero: {
    position: 'relative',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
    overflow: 'hidden',
  },
  // Decorative layered shapes
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
  blobMint: {
    width: 160,
    height: 160,
    backgroundColor: FESTIVE.mint,
    opacity: 0.16,
    top: -60,
    right: -50,
  },
  blobSun: {
    width: 120,
    height: 120,
    backgroundColor: FESTIVE.sunflower,
    opacity: 0.2,
    top: 40,
    right: -30,
  },
  blobBlush: {
    width: 140,
    height: 140,
    backgroundColor: FESTIVE.blush,
    opacity: 0.24,
    bottom: -50,
    left: -40,
  },
  confettiA: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: FESTIVE.coral,
    transform: [{ rotate: '20deg' }],
    top: 80,
    right: 40,
  },
  confettiB: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FESTIVE.sunflower,
    top: 160,
    right: 90,
  },
  confettiC: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: FESTIVE.mint,
    transform: [{ rotate: '40deg' }],
    bottom: 90,
    left: 30,
    opacity: 0.6,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1.4,
  },
  heroEmoji: {
    fontSize: 28,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: Layout.spacing.lg,
    gap: 8,
  },
  counterNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 110,
    lineHeight: 110,
    letterSpacing: -4,
    includeFontPadding: false,
  },
  counterUnit: {
    fontFamily: fontFamily.medium,
    fontSize: 18,
    marginBottom: 18,
  },
  counterPlaceholder: {
    fontFamily: fontFamily.bold,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -2,
    fontStyle: 'italic',
  },
  heroCaption: {
    marginTop: 4,
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
  heroEventName: {
    marginTop: 2,
    fontFamily: fontFamily.bold,
    fontSize: 22,
    letterSpacing: 1.5,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Layout.spacing.md,
  },
  metaText: {
    fontFamily: MONO,
    fontSize: 12,
    flexShrink: 1,
  },
  metaSep: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.lg,
  },
  ctaPill: {
    flex: 1,
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  ctaPillLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
  },
  ctaPillSub: {
    marginTop: 2,
    fontFamily: MONO,
    fontSize: 11,
  },
  ctaArrow: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: FESTIVE.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
  },
  quickAction: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  quickIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
  },
});
