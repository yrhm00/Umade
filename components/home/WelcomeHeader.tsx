/**
 * Header d'accueil personnalisé (Phase 10)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/stores/authStore';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { getDaysUntilEvent, getEventTypeEmoji } from '@/types/preferences';

export function WelcomeHeader() {
  const colors = useColors();
  const profile = useAuthStore((s) => s.profile);
  const { data: preferences } = useUserPreferences();

  const firstName = profile?.full_name?.split(' ')[0] || 'toi';
  const daysUntil = getDaysUntilEvent(preferences?.event_date || null);
  const eventEmoji = preferences?.event_type
    ? getEventTypeEmoji(preferences.event_type)
    : '🎉';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getSubtitle = () => {
    if (daysUntil === null) {
      return 'Prêt(e) à trouver les meilleurs prestataires ?';
    }
    if (daysUntil < 0) {
      return 'J\'espère que ton événement s\'est bien passé ! 🎊';
    }
    if (daysUntil === 0) {
      return 'C\'est le grand jour ! Profite bien ! 🎉';
    }
    if (daysUntil === 1) {
      return 'C\'est demain ! Dernière ligne droite !';
    }
    if (daysUntil <= 7) {
      return `Plus que ${daysUntil} jours ! Tu es prêt(e) ? 💪`;
    }
    if (daysUntil <= 30) {
      return `J-${daysUntil} avant le grand jour !`;
    }
    return `Plus que ${daysUntil} jours avant le grand jour !`;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(0).duration(260)}
      style={styles.container}
    >
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: colors.text }]}>
          {getGreeting()} {firstName} {eventEmoji}
        </Text>
      </View>

      {preferences?.event_name && (
        <Text style={[styles.eventName, { color: colors.primary }]} numberOfLines={1}>
          {preferences.event_name}
        </Text>
      )}

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{getSubtitle()}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingText: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  eventName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    marginTop: 4,
  },
});
