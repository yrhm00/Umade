/**
 * Carte de compte à rebours (Phase 10)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { getDaysUntilEvent, getEventTypeLabel } from '@/types/preferences';

export function CountdownCard() {
  const colors = useColors();
  const { data: preferences } = useUserPreferences();
  const daysUntil = getDaysUntilEvent(preferences?.event_date || null);

  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (daysUntil !== null && daysUntil <= 30 && daysUntil > 0) {
      // Pulse animation for urgency
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );

      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 }),
          withTiming(0.5, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [daysUntil]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  if (daysUntil === null || daysUntil < 0) {
    return null;
  }

  const isUrgent = daysUntil <= 7;
  const isClose = daysUntil <= 30;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-BE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getGradientColors = (): [string, string] => {
    if (isUrgent) {
      return ['#EF4444', '#DC2626']; // Red gradient for urgent
    }
    if (isClose) {
      return ['#F59E0B', '#D97706']; // Orange gradient for close
    }
    return [colors.primary, colors.primaryDark]; // Default violet
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Glow effect for urgent dates */}
      {isClose && (
        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={[...getGradientColors(), 'transparent']}
            style={styles.glowGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>
      )}

      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.content}>
          <View style={styles.left}>
            <View style={styles.iconContainer}>
              <Calendar size={20} color={'#FFFFFF'} />
            </View>
            <View>
              <Text style={styles.label}>
                {preferences?.event_type
                  ? getEventTypeLabel(preferences.event_type)
                  : 'Événement'}
              </Text>
              {preferences?.event_date && (
                <Text style={styles.date}>
                  {formatDate(preferences.event_date)}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.countdown}>
            <Text style={styles.daysNumber}>{daysUntil}</Text>
            <Text style={styles.daysLabel}>
              {daysUntil === 0 ? 'Jour J!' : daysUntil === 1 ? 'jour' : 'jours'}
            </Text>
          </View>
        </View>

        {isUrgent && (
          <View style={styles.urgentBadge}>
            <Clock size={12} color={'#FFFFFF'} />
            <Text style={styles.urgentText}>Dernière ligne droite !</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: Layout.radius.xl + 10,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
  },
  card: {
    borderRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  date: {
    fontSize: Layout.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    maxWidth: 150,
  },
  countdown: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Layout.radius.lg,
  },
  daysNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  daysLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Layout.radius.full,
  },
  urgentText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
