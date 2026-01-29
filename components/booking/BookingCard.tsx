import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, ChevronRight } from 'lucide-react-native';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { BookingWithDetails } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatDate, formatPrice } from '@/lib/utils';

interface BookingCardProps {
  booking: BookingWithDetails;
}

export const BookingCard = React.memo(function BookingCard({
  booking,
}: BookingCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.container}
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
          <Text style={styles.providerName} numberOfLines={1}>
            {booking.providers?.business_name}
          </Text>
          <Text style={styles.serviceName} numberOfLines={1}>
            {booking.services?.name}
          </Text>
        </View>
        <BookingStatusBadge status={booking.status} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>
            {formatDate(booking.booking_date)}
          </Text>
        </View>
        {booking.start_time && (
          <View style={styles.detailRow}>
            <Clock size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText}>
              {booking.start_time.slice(0, 5)}
              {booking.end_time ? ` - ${booking.end_time.slice(0, 5)}` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{formatPrice(booking.total_price)}</Text>
        <ChevronRight size={20} color={Colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    color: Colors.text.primary,
  },
  serviceName: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  details: {
    backgroundColor: Colors.gray[50],
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
    color: Colors.text.secondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  price: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
});
