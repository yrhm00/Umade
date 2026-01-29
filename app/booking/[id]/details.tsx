import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, FileText, User } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useBooking, useUpdateBookingStatus } from '@/hooks/useBookings';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatDate, formatPrice } from '@/lib/utils';

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: booking, isLoading, refetch } = useBooking(id);
  const { mutate: updateStatus, isPending } = useUpdateBookingStatus();

  const handleCancel = () => {
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler la réservation',
          style: 'destructive',
          onPress: () => {
            updateStatus(
              { bookingId: id!, status: 'cancelled' },
              {
                onSuccess: () => refetch(),
                onError: (error) => Alert.alert('Erreur', error.message),
              }
            );
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement..." />;
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Réservation non trouvée</Text>
          <Button title="Retour" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const canCancel =
    booking.status === 'pending' || booking.status === 'confirmed';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Détail réservation',
          headerTintColor: Colors.text.primary,
          headerStyle: { backgroundColor: Colors.background.secondary },
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
        {/* Status */}
        <View style={styles.statusRow}>
          <BookingStatusBadge status={booking.status} />
        </View>

        {/* Provider info */}
        <View style={styles.card}>
          <View style={styles.providerRow}>
            <Avatar
              source={(booking as any).providers?.profiles?.avatar_url ?? undefined}
              name={(booking as any).providers?.business_name || '?'}
              size="lg"
            />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>
                {(booking as any).providers?.business_name}
              </Text>
              <Text style={styles.serviceName}>
                {(booking as any).services?.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails</Text>

          <View style={styles.detailRow}>
            <Calendar size={18} color={Colors.primary.DEFAULT} />
            <Text style={styles.detailText}>
              {formatDate(booking.booking_date)}
            </Text>
          </View>

          {booking.start_time && (
            <View style={styles.detailRow}>
              <Clock size={18} color={Colors.primary.DEFAULT} />
              <Text style={styles.detailText}>
                {booking.start_time.slice(0, 5)}
                {booking.end_time ? ` - ${booking.end_time.slice(0, 5)}` : ''}
              </Text>
            </View>
          )}

          {booking.client_message && (
            <View style={styles.detailRow}>
              <FileText size={18} color={Colors.primary.DEFAULT} />
              <Text style={styles.detailText}>{booking.client_message}</Text>
            </View>
          )}

          {booking.provider_response && (
            <View style={styles.responseBox}>
              <Text style={styles.responseLabel}>Réponse du prestataire</Text>
              <Text style={styles.responseText}>
                {booking.provider_response}
              </Text>
            </View>
          )}

          {booking.cancellation_reason && (
            <View style={styles.cancelBox}>
              <Text style={styles.cancelLabel}>Raison d'annulation</Text>
              <Text style={styles.cancelText}>
                {booking.cancellation_reason}
              </Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Prix total</Text>
            <Text style={styles.priceValue}>
              {formatPrice(booking.total_price)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {canCancel && (
          <Button
            title="Annuler la réservation"
            onPress={handleCancel}
            variant="outline"
            loading={isPending}
            disabled={isPending}
            fullWidth
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
          />
        )}
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
  statusRow: {
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: Layout.spacing.md,
  },
  cardTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  serviceName: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
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
  responseBox: {
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
  },
  responseLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
    marginBottom: Layout.spacing.xs,
  },
  responseText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.primary,
    fontStyle: 'italic',
  },
  cancelBox: {
    backgroundColor: Colors.error.light,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
  },
  cancelLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    color: Colors.error.DEFAULT,
    marginBottom: Layout.spacing.xs,
  },
  cancelText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.primary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  priceValue: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  cancelButton: {
    marginTop: Layout.spacing.md,
    borderColor: Colors.error.DEFAULT,
  },
  cancelButtonText: {
    color: Colors.error.DEFAULT,
  },
});
