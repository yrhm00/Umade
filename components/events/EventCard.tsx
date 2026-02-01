import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { EventWithBookings } from '@/types';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, MapPin, Users } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EventStatusBadge } from './EventStatusBadge';

interface EventCardProps {
  event: EventWithBookings;
}

export const EventCard = React.memo(function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const formattedDate = new Date(event.event_date).toLocaleDateString('fr-BE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const bookingsCount = event.bookings_count || 0;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/event/${event.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {event.title}
        </Text>
        <EventStatusBadge eventType={event.event_type} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{formattedDate}</Text>
        </View>

        {event.location && (
          <View style={styles.detailRow}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}

        {event.guest_count != null && (
          <View style={styles.detailRow}>
            <Users size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {event.guest_count} invité{event.guest_count > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.bookingsCount, { color: colors.primary }]}>
          {bookingsCount} réservation{bookingsCount !== 1 ? 's' : ''}
        </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginRight: Layout.spacing.sm,
  },
  details: {
    gap: Layout.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  detailText: {
    fontSize: Layout.fontSize.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
  },
  bookingsCount: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
});
