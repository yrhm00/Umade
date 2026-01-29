import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react-native';
import { EventStatusBadge } from './EventStatusBadge';
import { EventWithBookings } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface EventCardProps {
  event: EventWithBookings;
}

export const EventCard = React.memo(function EventCard({ event }: EventCardProps) {
  const router = useRouter();

  const formattedDate = new Date(event.event_date).toLocaleDateString('fr-BE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const bookingsCount = event.bookings_count || 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/event/${event.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <EventStatusBadge eventType={event.event_type} />
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Calendar size={16} color={Colors.text.secondary} />
          <Text style={styles.detailText}>{formattedDate}</Text>
        </View>

        {event.location && (
          <View style={styles.detailRow}>
            <MapPin size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}

        {event.guest_count != null && (
          <View style={styles.detailRow}>
            <Users size={16} color={Colors.text.secondary} />
            <Text style={styles.detailText}>
              {event.guest_count} invité{event.guest_count > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.bookingsCount}>
          {bookingsCount} réservation{bookingsCount !== 1 ? 's' : ''}
        </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
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
    color: Colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[100],
  },
  bookingsCount: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
});
