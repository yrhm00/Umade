import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { BookingStatus } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'expo-router';
import { AlertCircle, Calendar, Check, CheckCircle2, Clock, X, XCircle } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';

type ChatBooking = {
  id: string;
  status: BookingStatus | null;
  booking_date: string;
  start_time: string | null;
  services?: {
    name?: string | null;
    price?: number | null;
  } | null;
  profiles?: {
    full_name?: string | null;
  } | null;
  total_price?: number | null;
};

interface BookingActionCardProps {
  booking: ChatBooking;
  isProvider: boolean;
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  isUpdating: boolean;
}

const STATUS_COPY: Record<
  BookingStatus,
  {
    label: string;
    descriptionProvider: string;
    descriptionClient: string;
    tone: 'warning' | 'success' | 'error' | 'neutral';
  }
> = {
  pending: {
    label: 'En attente',
    descriptionProvider: 'Cette demande attend votre validation.',
    descriptionClient: 'Votre demande a été envoyée au prestataire.',
    tone: 'warning',
  },
  confirmed: {
    label: 'Confirmée',
    descriptionProvider: 'Réservation validée.',
    descriptionClient: 'Votre réservation est confirmée.',
    tone: 'success',
  },
  cancelled: {
    label: 'Refusée',
    descriptionProvider: 'Vous avez refusé cette demande.',
    descriptionClient: 'Le prestataire a refusé cette demande.',
    tone: 'error',
  },
  completed: {
    label: 'Terminée',
    descriptionProvider: 'Prestation terminée.',
    descriptionClient: 'Prestation terminée.',
    tone: 'neutral',
  },
};

export const BookingActionCard = ({
  booking,
  isProvider,
  onUpdateStatus,
  isUpdating,
}: BookingActionCardProps) => {
  const colors = useColors();
  const router = useRouter();

  if (!booking) return null;

  const copy = STATUS_COPY[booking.status ?? 'pending'];

  const toneStyles = {
    warning: {
      border: colors.primary,
      chipBg: `${colors.warning}1A`,
      chipText: colors.warning,
    },
    success: {
      border: colors.success,
      chipBg: `${colors.success}1A`,
      chipText: colors.success,
    },
    error: {
      border: colors.error,
      chipBg: `${colors.error}1A`,
      chipText: colors.error,
    },
    neutral: {
      border: colors.border,
      chipBg: `${colors.textTertiary}1A`,
      chipText: colors.textSecondary,
    },
  } as const;

  const tone = toneStyles[copy.tone];

  const date = new Date(booking.booking_date);
  const dateStr = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const serviceName = booking.services?.name || 'Prestation';
  const displayedPrice =
    typeof booking.total_price === 'number' && booking.total_price > 0
      ? booking.total_price
      : booking.services?.price;

  const priceLabel =
    typeof displayedPrice === 'number' ? formatPrice(displayedPrice) : 'Sur devis';

  const handleAccept = () => {
    Alert.alert(
      'Confirmer la réservation',
      'Voulez-vous confirmer cette demande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => onUpdateStatus(booking.id, 'confirmed'),
        },
      ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
      'Refuser la demande',
      'Voulez-vous refuser cette demande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => onUpdateStatus(booking.id, 'cancelled'),
        },
      ]
    );
  };

  const handleOpenDetails = () => {
    router.push(`/booking/${booking.id}/details` as any);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: tone.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.statusChip, { backgroundColor: tone.chipBg }]}> 
          <Text style={[styles.statusChipText, { color: tone.chipText }]}>{copy.label}</Text>
        </View>
        <Text style={[styles.price, { color: colors.primary }]}>{priceLabel}</Text>
      </View>

      <Text style={[styles.serviceName, { color: colors.text }]}>{serviceName}</Text>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Calendar size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{dateStr}</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {booking.start_time?.slice(0, 5) || 'Heure à définir'}
          </Text>
        </View>
      </View>

      {!!booking.profiles?.full_name && isProvider && (
        <Text style={[styles.clientLine, { color: colors.textSecondary }]}>Client: {booking.profiles.full_name}</Text>
      )}

      <View style={styles.infoRow}>
        {booking.status === 'pending' ? (
          <AlertCircle size={14} color={colors.warning} />
        ) : booking.status === 'confirmed' ? (
          <CheckCircle2 size={14} color={colors.success} />
        ) : booking.status === 'cancelled' ? (
          <XCircle size={14} color={colors.error} />
        ) : (
          <CheckCircle2 size={14} color={colors.textTertiary} />
        )}
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          {isProvider ? copy.descriptionProvider : copy.descriptionClient}
        </Text>
      </View>

      {isProvider && booking.status === 'pending' && (
        <View style={styles.actions}>
          <PressableScale
            onPress={handleDecline}
            haptic="light"
            disabled={isUpdating}
            style={[
              styles.actionButton,
              {
                borderColor: colors.error,
                backgroundColor: `${colors.error}14`,
                opacity: isUpdating ? 0.6 : 1,
              },
            ]}
          >
            <X size={16} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Refuser</Text>
          </PressableScale>

          <PressableScale
            onPress={handleAccept}
            haptic="light"
            disabled={isUpdating}
            style={[
              styles.actionButton,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primary,
                opacity: isUpdating ? 0.8 : 1,
              },
            ]}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={16} color="#FFFFFF" />
            )}
            <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Confirmer</Text>
          </PressableScale>
        </View>
      )}

      <PressableScale
        onPress={handleOpenDetails}
        haptic="light"
        style={[
          styles.detailsButton,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.detailsButtonText, { color: colors.text }]}>Voir le détail</Text>
      </PressableScale>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  statusChip: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.radius.full,
  },
  statusChipText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  price: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: Layout.fontSize.sm,
    textTransform: 'capitalize',
  },
  clientLine: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: Layout.spacing.md,
  },
  actionButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  detailsButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
  },
  detailsButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
});
