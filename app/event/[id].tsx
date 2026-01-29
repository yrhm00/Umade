import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  MapPin,
  Users,
  Wallet,
  FileText,
  Trash2,
  Plus,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useEventDetail, useDeleteEvent } from '@/hooks/useEvents';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { BookingCard } from '@/components/booking/BookingCard';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate, formatPrice } from '@/lib/utils';

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading, refetch } = useEventDetail(id);
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  const handleDelete = () => {
    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ? Les réservations liées ne seront pas supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteEvent(id!, {
              onSuccess: () => router.back(),
              onError: (error) => {
                Alert.alert('Erreur', error.message);
              },
            });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Événement non trouvé</Text>
          <Button title="Retour" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const bookings = event.bookings || [];
  const isPast = new Date(event.event_date) < new Date();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTintColor: Colors.text.primary,
          headerStyle: { backgroundColor: Colors.background.secondary },
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
              <Trash2 size={22} color={Colors.error.DEFAULT} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={() => refetch()} />
        }
      >
        {/* Title & Badge */}
        <View style={styles.header}>
          <Text style={styles.title}>{event.title}</Text>
          <EventStatusBadge eventType={event.event_type} />
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Calendar size={18} color={Colors.primary.DEFAULT} />
            <Text style={styles.detailText}>{formatDate(event.event_date)}</Text>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <MapPin size={18} color={Colors.primary.DEFAULT} />
              <Text style={styles.detailText}>{event.location}</Text>
            </View>
          )}

          {event.guest_count != null && (
            <View style={styles.detailRow}>
              <Users size={18} color={Colors.primary.DEFAULT} />
              <Text style={styles.detailText}>
                {event.guest_count} invité{event.guest_count > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {(event.budget_min != null || event.budget_max != null) && (
            <View style={styles.detailRow}>
              <Wallet size={18} color={Colors.primary.DEFAULT} />
              <Text style={styles.detailText}>
                {event.budget_min != null && formatPrice(event.budget_min)}
                {event.budget_min != null && event.budget_max != null && ' — '}
                {event.budget_max != null && formatPrice(event.budget_max)}
              </Text>
            </View>
          )}

          {event.notes && (
            <View style={styles.detailRow}>
              <FileText size={18} color={Colors.primary.DEFAULT} />
              <Text style={styles.detailText}>{event.notes}</Text>
            </View>
          )}
        </View>

        {/* Bookings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Réservations ({bookings.length})
            </Text>
            {!isPast && (
              <TouchableOpacity
                style={styles.addBookingButton}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Plus size={18} color={Colors.primary.DEFAULT} />
                <Text style={styles.addBookingText}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>

          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <View style={styles.emptyBookings}>
              <Text style={styles.emptyText}>
                Aucune réservation pour cet événement
              </Text>
              {!isPast && (
                <Button
                  title="Trouver un prestataire"
                  onPress={() => router.push('/(tabs)/search')}
                  variant="outline"
                  size="sm"
                  style={styles.findButton}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.xl,
    gap: Layout.spacing.lg,
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
    color: Colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  title: {
    flex: 1,
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.md,
  },
  detailText: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  addBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  addBookingText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.primary.DEFAULT,
  },
  emptyBookings: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
  },
  emptyText: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.md,
  },
  findButton: {
    minWidth: 180,
  },
});
