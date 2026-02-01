/**
 * Booking Details Screen
 * Dark Mode Support
 */

import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useBooking, useUpdateBookingStatus } from '@/hooks/useBookings';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { formatDate, formatPrice } from '@/lib/utils';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, FileText } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BookingDetailsScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Réservation non trouvée</Text>
          <Button title="Retour" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const canCancel =
    booking.status === 'pending' || booking.status === 'confirmed';

  const responseBoxBg = isDark ? colors.backgroundTertiary : `${colors.primary}10`;
  const cancelBoxBg = isDark ? `${colors.error}20` : `${colors.error}10`;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Détail réservation',
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.backgroundSecondary },
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
        {/* Status */}
        <View style={styles.statusRow}>
          <BookingStatusBadge status={booking.status} />
        </View>

        {/* Provider info */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.providerRow}>
            <Avatar
              source={(booking as any).providers?.profiles?.avatar_url ?? undefined}
              name={(booking as any).providers?.business_name || '?'}
              size="lg"
            />
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: colors.text }]}>
                {(booking as any).providers?.business_name}
              </Text>
              <Text style={[styles.serviceName, { color: colors.textSecondary }]}>
                {(booking as any).services?.name}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Détails</Text>

          <View style={styles.detailRow}>
            <Calendar size={18} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {formatDate(booking.booking_date)}
            </Text>
          </View>

          {booking.start_time && (
            <View style={styles.detailRow}>
              <Clock size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>
                {booking.start_time.slice(0, 5)}
                {booking.end_time ? ` - ${booking.end_time.slice(0, 5)}` : ''}
              </Text>
            </View>
          )}

          {booking.client_message && (
            <View style={styles.detailRow}>
              <FileText size={18} color={colors.primary} />
              <Text style={[styles.detailText, { color: colors.text }]}>{booking.client_message}</Text>
            </View>
          )}

          {booking.provider_response && (
            <View style={[styles.responseBox, { backgroundColor: responseBoxBg }]}>
              <Text style={[styles.responseLabel, { color: colors.primary }]}>Réponse du prestataire</Text>
              <Text style={[styles.responseText, { color: colors.text }]}>
                {booking.provider_response}
              </Text>
            </View>
          )}

          {booking.cancellation_reason && (
            <View style={[styles.cancelBox, { backgroundColor: cancelBoxBg }]}>
              <Text style={[styles.cancelLabel, { color: colors.error }]}>Raison d'annulation</Text>
              <Text style={[styles.cancelText, { color: colors.text }]}>
                {booking.cancellation_reason}
              </Text>
            </View>
          )}
        </View>

        {/* Price */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.text }]}>Prix total</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
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
            style={[styles.cancelButton, { borderColor: colors.error }]}
            textStyle={{ color: colors.error }}
          />
        )}
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
  statusRow: {
    alignItems: 'flex-start',
    marginBottom: Layout.spacing.lg,
  },
  card: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: Layout.spacing.md,
  },
  cardTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
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
  },
  serviceName: {
    fontSize: Layout.fontSize.md,
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
  responseBox: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
  },
  responseLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  responseText: {
    fontSize: Layout.fontSize.sm,
    fontStyle: 'italic',
  },
  cancelBox: {
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
  },
  cancelLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  cancelText: {
    fontSize: Layout.fontSize.sm,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: Layout.spacing.md,
  },
});
