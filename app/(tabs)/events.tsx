import { BookingCard } from '@/components/booking/BookingCard';
import { ClientHeader } from '@/components/client/ClientHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { EventCard } from '@/components/events/EventCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useBookings } from '@/hooks/useBookings';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useUserEvents } from '@/hooks/useEvents';
import { EventWithBookings } from '@/types';
import { useRouter } from 'expo-router';
import { Calendar, ClipboardList, Plus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'events' | 'bookings';
type FilterType = 'upcoming' | 'past';

export default function EventsScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [filter, setFilter] = useState<FilterType>('upcoming');

  const {
    data: events,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useUserEvents();

  const {
    data: bookings,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useBookings();

  const isLoading = activeTab === 'events' ? eventsLoading : bookingsLoading;

  const now = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (filter === 'upcoming') {
      return events.filter((e) => e.event_date >= now);
    }
    return events.filter((e) => e.event_date < now);
  }, [events, filter, now]);

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (filter === 'upcoming') {
      return bookings.filter(
        (b) => b.booking_date >= now && b.status !== 'cancelled'
      );
    }
    return bookings.filter(
      (b) => b.booking_date < now || b.status === 'cancelled'
    );
  }, [bookings, filter, now]);

  const handleRefresh = () => {
    if (activeTab === 'events') {
      refetchEvents();
    } else {
      refetchBookings();
    }
  };

  const renderEventItem = ({ item }: { item: EventWithBookings }) => (
    <EventCard event={item} />
  );

  const renderBookingItem = ({ item }: { item: any }) => (
    <BookingCard booking={item} />
  );

  // Theme-aware colors
  const surface = isDark ? colors.card : '#FFFFFF';
  const softSurface = isDark ? colors.backgroundTertiary : '#F8F5F0';
  const tabInactiveBg = isDark ? colors.backgroundTertiary : 'transparent';
  const tabActiveBg = colors.primary;
  const visibleEventsCount = filteredEvents.length;
  const visibleBookingsCount = filteredBookings.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ClientHeader
        eyebrow="Planning"
        title="Événements & réservations"
        subtitle="Garde tes dates, prestataires et confirmations au même endroit."
        colors={colors}
        isDark={isDark}
        actionIcon={Plus}
        actionLabel="Créer un événement"
        onAction={() => router.push('/event/create' as any)}
      />

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{visibleEventsCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>événements</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{visibleBookingsCount}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>réservations</Text>
        </View>
      </View>

      {/* Main Tabs: Events / Bookings */}
      <View style={[styles.mainTabs, { backgroundColor: softSurface }]}>
        <TouchableOpacity
          style={[
            styles.mainTab,
            { backgroundColor: activeTab === 'events' ? tabActiveBg : tabInactiveBg }
          ]}
          onPress={() => setActiveTab('events')}
        >
          <Text
            style={[
              styles.mainTabText,
              { color: activeTab === 'events' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Événements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mainTab,
            { backgroundColor: activeTab === 'bookings' ? tabActiveBg : tabInactiveBg }
          ]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text
            style={[
              styles.mainTabText,
              { color: activeTab === 'bookings' ? '#FFFFFF' : colors.textSecondary },
            ]}
          >
            Réservations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs: Upcoming / Past */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { borderBottomColor: filter === 'upcoming' ? colors.primary : colors.border },
          ]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: filter === 'upcoming' ? colors.primary : colors.textSecondary },
            ]}
          >
            À venir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            { borderBottomColor: filter === 'past' ? colors.primary : colors.border },
          ]}
          onPress={() => setFilter('past')}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: filter === 'past' ? colors.primary : colors.textSecondary },
            ]}
          >
            Passés
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner fullScreen message="Chargement..." />
      ) : activeTab === 'events' ? (
        filteredEvents.length > 0 ? (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={eventsLoading}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        ) : (
          <EmptyState
            icon={filter === 'upcoming' ? <Calendar size={32} color={colors.primary} /> : <ClipboardList size={32} color={colors.primary} />}
            title={
              filter === 'upcoming'
                ? 'Aucun événement à venir'
                : 'Aucun événement passé'
            }
            description={
              filter === 'upcoming'
                ? 'Créez votre premier événement pour organiser vos prestataires.'
                : 'Vos événements terminés apparaîtront ici.'
            }
            actionLabel={
              filter === 'upcoming' ? 'Créer un événement' : undefined
            }
            onAction={
              filter === 'upcoming'
                ? () => router.push('/event/create' as any)
                : undefined
            }
          />
        )
      ) : filteredBookings.length > 0 ? (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={bookingsLoading}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : (
        <EmptyState
          icon={filter === 'upcoming' ? <Calendar size={32} color={colors.primary} /> : <ClipboardList size={32} color={colors.primary} />}
          title={
            filter === 'upcoming'
              ? 'Aucune réservation à venir'
              : 'Aucune réservation passée'
          }
          description={
            filter === 'upcoming'
              ? 'Réservez un prestataire pour votre prochain événement.'
              : 'Vos réservations terminées apparaîtront ici.'
          }
          actionLabel={
            filter === 'upcoming' ? 'Trouver un prestataire' : undefined
          }
          onAction={
            filter === 'upcoming'
              ? () => router.push('/(tabs)/search')
              : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Layout.radius.sm,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  summaryValue: {
    fontSize: Layout.fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.medium,
    textTransform: 'uppercase',
  },
  mainTabs: {
    flexDirection: 'row',
    marginHorizontal: Layout.spacing.lg,
    padding: 4,
    marginBottom: Layout.spacing.sm,
    borderRadius: Layout.radius.sm,
  },
  mainTab: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    borderRadius: Layout.radius.sm,
  },
  mainTabText: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  filterTabText: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
  },
  list: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 120,
  },
});
