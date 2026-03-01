import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { BookingStatus } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { router } from 'expo-router';
import { Calendar, CheckCircle2, Clock3, Info, XCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface BookingStatusUpdateMessageData {
  type: 'booking_status_update';
  booking_id: string;
  status: BookingStatus;
  service_name?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
  price?: number | null;
  message?: string;
}

interface BookingStatusUpdateMessageCardProps {
  data: BookingStatusUpdateMessageData;
  isOwn: boolean;
}

export function parseBookingStatusUpdateMessage(
  content: string
): BookingStatusUpdateMessageData | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.type !== 'booking_status_update' || !parsed?.booking_id) {
      return null;
    }
    return parsed as BookingStatusUpdateMessageData;
  } catch {
    return null;
  }
}

export function BookingStatusUpdateMessageCard({
  data,
  isOwn,
}: BookingStatusUpdateMessageCardProps) {
  const colors = useColors();

  const statusConfig = {
    pending: {
      label: 'En attente',
      borderColor: colors.warning,
      chipBg: `${colors.warning}1A`,
      chipText: colors.warning,
      Icon: Info,
    },
    confirmed: {
      label: 'Confirmée',
      borderColor: colors.success,
      chipBg: `${colors.success}1A`,
      chipText: colors.success,
      Icon: CheckCircle2,
    },
    cancelled: {
      label: 'Refusée',
      borderColor: colors.error,
      chipBg: `${colors.error}1A`,
      chipText: colors.error,
      Icon: XCircle,
    },
    completed: {
      label: 'Terminée',
      borderColor: colors.border,
      chipBg: `${colors.textTertiary}1A`,
      chipText: colors.textSecondary,
      Icon: CheckCircle2,
    },
  } as const;

  const config = statusConfig[data.status] ?? statusConfig.pending;
  const Icon = config.Icon;

  const handleOpenDetails = () => {
    router.push(`/booking/${data.booking_id}/details` as any);
  };

  const dateLabel = data.booking_date
    ? new Date(data.booking_date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : null;

  const timeLabel = data.start_time?.slice(0, 5) || null;
  const priceLabel =
    typeof data.price === 'number' && data.price > 0 ? formatPrice(data.price) : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: config.borderColor,
        },
        isOwn && styles.cardOwn,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.statusChip, { backgroundColor: config.chipBg }]}>
          <Text style={[styles.statusChipText, { color: config.chipText }]}>{config.label}</Text>
        </View>
        {priceLabel ? <Text style={[styles.price, { color: colors.primary }]}>{priceLabel}</Text> : null}
      </View>

      {data.service_name ? (
        <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
          {data.service_name}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        {dateLabel ? (
          <View style={styles.metaItem}>
            <Calendar size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
              {dateLabel}
            </Text>
          </View>
        ) : null}
        {timeLabel ? (
          <View style={styles.metaItem}>
            <Clock3 size={12} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{timeLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.infoRow}>
        <Icon size={13} color={config.chipText} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={2}>
          {data.message || `Mise à jour de réservation: ${config.label.toLowerCase()}.`}
        </Text>
      </View>

      <PressableScale
        onPress={handleOpenDetails}
        haptic="light"
        style={[
          styles.detailsButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.detailsButtonText, { color: colors.text }]}>Voir le détail</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.sm,
    gap: 6,
  },
  cardOwn: {
    // kept for future tweaks on own-message style
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  statusChip: {
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  price: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  serviceName: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
  },
  detailsButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 6,
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
