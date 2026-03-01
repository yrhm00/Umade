/**
 * Payment Notification Card (Chat)
 * Affiche une notification de paiement dans le chat.
 * Pattern: suit BookingStatusUpdateMessageCard.tsx.
 */

import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { formatPrice } from '@/lib/utils';
import { router } from 'expo-router';
import { Banknote, CreditCard, Wallet } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface PaymentNotificationData {
  type: 'payment_notification';
  booking_id: string;
  payment_type: 'deposit' | 'balance';
  amount: number;
  message?: string;
}

interface PaymentNotificationCardProps {
  data: PaymentNotificationData;
  isOwn: boolean;
}

export function parsePaymentNotification(
  content: string
): PaymentNotificationData | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.type !== 'payment_notification' || !parsed?.booking_id) {
      return null;
    }
    return parsed as PaymentNotificationData;
  } catch {
    return null;
  }
}

export function PaymentNotificationCard({
  data,
  isOwn,
}: PaymentNotificationCardProps) {
  const colors = useColors();

  const typeConfig = {
    deposit: {
      label: 'Acompte',
      Icon: CreditCard,
    },
    balance: {
      label: 'Solde',
      Icon: Banknote,
    },
  } as const;

  const config = typeConfig[data.payment_type] ?? typeConfig.deposit;
  const Icon = config.Icon;
  const amount = typeof data.amount === 'number' && data.amount > 0 ? formatPrice(data.amount) : null;

  const handleOpenDetails = () => {
    router.push(`/booking/${data.booking_id}/details` as any);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.success,
        },
        isOwn && styles.cardOwn,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.paymentChip, { backgroundColor: `${colors.success}1A` }]}>
          <Wallet size={12} color={colors.success} />
          <Text style={[styles.paymentChipText, { color: colors.success }]}>
            {config.label}
          </Text>
        </View>
        {amount && (
          <Text style={[styles.amount, { color: colors.primary }]}>{amount}</Text>
        )}
      </View>

      <View style={styles.infoRow}>
        <Icon size={14} color={colors.success} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={3}>
          {data.message || `Notification de paiement : ${config.label.toLowerCase()}.`}
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
  cardOwn: {},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  paymentChip: {
    borderRadius: Layout.radius.full,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  amount: {
    fontSize: Layout.fontSize.md,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
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
