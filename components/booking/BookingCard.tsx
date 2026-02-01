/**
 * Booking Card Component
 * Dark Mode Support
 */

import { Avatar } from '@/components/ui/Avatar';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { formatDate, formatPrice } from '@/lib/utils';
import { BookingWithDetails } from '@/types';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Clock } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BookingStatusBadge } from './BookingStatusBadge';

interface BookingCardProps {
  booking: BookingWithDetails;
}

export const BookingCard = React.memo(function BookingCard({
  booking,
}: BookingCardProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          shadowColor: isDark ? colors.primary : '#000000',
          shadowOpacity: isDark ? 0.3 : 0.05,
        },
      ]}
      onPress={() => router.push(`/booking/${booking.id}/details` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Avatar
          source={booking.providers?.profiles?.avatar_url ?? undefined}
          name={booking.providers?.business_name || '?'}
          size="md"
        />
        <View style={styles.info}>
          <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>
            {booking.providers?.business_name}
          </Text>
          <Text style={[styles.serviceName, { color: colors.textSecondary }]} numberOfLines={1}>
            {booking.services?.name}
          </Text>
        </View>
        <BookingStatusBadge status={booking.status} />
      </View>

      <View style={[styles.details, { backgroundColor: colors.backgroundTertiary }]}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatDate(booking.booking_date)}
          </Text>
        </View>
        {booking.start_time && (
          <View style={styles.detailRow}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {booking.start_time.slice(0, 5)}
              {booking.end_time ? ` - ${booking.end_time.slice(0, 5)}` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.price, { color: colors.text }]}>{formatPrice(booking.total_price)}</Text>
        <ChevronRight size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  info: {
    flex: 1,
  },
  providerName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: Layout.fontSize.sm,
  },
  details: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  detailText: {
    fontSize: Layout.fontSize.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
  },
  price: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
});
