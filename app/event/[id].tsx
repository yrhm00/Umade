/**
 * Event Detail Screen
 * Dark Mode Support
 */

import { BookingCard } from '@/components/booking/BookingCard';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useDeleteEvent, useEventDetail } from '@/hooks/useEvents';
import { formatDate, formatPrice } from '@/lib/utils';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  FileText,
  MapPin,
  Plus,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EventDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Événement non trouvé</Text>
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
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
              <Trash2 size={22} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Title & Badge */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
          <EventStatusBadge eventType={event.event_type} />
        </View>

        {/* Details */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <View style={styles.detailRow}>
            <Calendar size={18} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>{formatDate(event.event_date)}</Text>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <MapPin size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>{event.location}</Text>
            </View>
          )}

          {event.guest_count != null && (
            <View style={styles.detailRow}>
              <Users size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {event.guest_count} invité{event.guest_count > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {(event.budget_min != null || event.budget_max != null) && (
            <View style={styles.detailRow}>
              <Wallet size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {event.budget_min != null && formatPrice(event.budget_min)}
                {event.budget_min != null && event.budget_max != null && ' — '}
                {event.budget_max != null && formatPrice(event.budget_max)}
              </Text>
            </View>
          )}

          {event.notes && (
            <View style={styles.detailRow}>
              <FileText size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>{event.notes}</Text>
            </View>
          )}
        </View>

        {/* Bookings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Réservations ({bookings.length})
            </Text>
            {!isPast && (
              <TouchableOpacity
                style={styles.addBookingButton}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Plus size={18} color={colors.primary} />
                <Text style={[styles.addBookingText, { color: colors.primary }]}>Ajouter</Text>
              </TouchableOpacity>
            )}
          </View>

          {bookings.length > 0 ? (
            bookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <View style={[styles.emptyBookings, { backgroundColor: colors.card }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
  },
  detailsCard: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
    shadowColor: '#000',
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
  },
  addBookingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  addBookingText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  emptyBookings: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.xl,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
  },
  emptyText: {
    fontSize: Layout.fontSize.md,
    marginBottom: Layout.spacing.md,
  },
  findButton: {
    minWidth: 180,
  },
});
