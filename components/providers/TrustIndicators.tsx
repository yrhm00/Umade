/**
 * Indicateurs de confiance affichés sur la page prestataire
 * Temps de réponse, taux de réponse, réservations
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { ProviderPublicStats } from '@/hooks/useProviderPublicStats';
import { Calendar, MessageCircle, Zap } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface TrustIndicatorsProps {
  stats: ProviderPublicStats | null | undefined;
}

function formatResponseTime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return 'N/A';
  if (minutes < 60) return `~${Math.round(minutes)}min`;
  if (minutes < 1440) return `~${Math.round(minutes / 60)}h`;
  return `~${Math.round(minutes / 1440)}j`;
}

function getResponseTimeColor(
  minutes: number | null,
  colors: ReturnType<typeof useColors>
): string {
  if (!minutes) return colors.textTertiary;
  if (minutes < 120) return '#22C55E'; // vert — < 2h
  if (minutes < 720) return '#F59E0B'; // jaune — < 12h
  return '#EF4444'; // rouge — > 12h
}

function getResponseRateColor(
  rate: number | null,
  colors: ReturnType<typeof useColors>
): string {
  if (!rate) return colors.textTertiary;
  if (rate >= 90) return '#22C55E';
  if (rate >= 70) return '#F59E0B';
  return '#EF4444';
}

export function TrustIndicators({ stats }: TrustIndicatorsProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  if (!stats) return null;

  const cardBg = isDark ? colors.card : '#F9FAFB';
  const responseTimeColor = getResponseTimeColor(
    stats.avg_response_time,
    colors
  );
  const responseRateColor = getResponseRateColor(stats.response_rate, colors);

  const indicators = [
    {
      icon: <Zap size={20} color={responseTimeColor} />,
      value: formatResponseTime(stats.avg_response_time),
      label: 'Réponse',
      valueColor: responseTimeColor,
    },
    {
      icon: <MessageCircle size={20} color={responseRateColor} />,
      value: stats.response_rate ? `${Math.round(stats.response_rate)}%` : 'N/A',
      label: 'Taux',
      valueColor: responseRateColor,
    },
    {
      icon: <Calendar size={20} color={colors.primary} />,
      value: stats.bookings_this_month?.toString() || '0',
      label: 'Ce mois',
      valueColor: colors.primary,
    },
  ];

  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(260)}
      style={styles.container}
    >
      {indicators.map((indicator, index) => (
        <View
          key={index}
          style={[styles.card, { backgroundColor: cardBg }]}
        >
          <View style={styles.iconContainer}>{indicator.icon}</View>
          <Text
            style={[styles.value, { color: indicator.valueColor }]}
            numberOfLines={1}
          >
            {indicator.value}
          </Text>
          <Text
            style={[styles.label, { color: colors.textTertiary }]}
            numberOfLines={1}
          >
            {indicator.label}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  card: {
    flex: 1,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  iconContainer: {
    marginBottom: 2,
  },
  value: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
  },
  label: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
  },
});
