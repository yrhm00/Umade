/**
 * Payment Summary Bottom Sheet
 * Résumé complet des paiements + historique + bouton copier.
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { formatDate, formatPrice } from '@/lib/utils';
import { BookingFinanceSnapshot, BookingPayment } from '@/types/bookingAdvanced';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { CheckCircle2, Clock, Copy, CreditCard, Wallet } from 'lucide-react-native';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { toast } from '@/lib/toast';

interface PaymentSummarySheetProps {
  finance: BookingFinanceSnapshot;
  payments: BookingPayment[];
}

function formatDateTimeLabel(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortenPaymentReference(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (raw.length <= 16) return raw;
  return `${raw.slice(0, 8)}…${raw.slice(-6)}`;
}

function formatPaymentNoteForDisplay(
  note: string | null | undefined,
  transactionRef: string | null | undefined
): string | null {
  const raw = note?.trim();
  if (!raw) return null;

  if (/^Stripe Checkout\b/i.test(raw)) {
    const stripeRefMatch = raw.match(/^Stripe Checkout\s+([A-Za-z0-9_]+)/i);
    const reference = shortenPaymentReference(transactionRef || stripeRefMatch?.[1] || null);
    if (reference) {
      return `Paiement en ligne sécurisé (Stripe) · Réf ${reference}`;
    }
    return 'Paiement en ligne sécurisé (Stripe)';
  }

  return raw;
}

export const PaymentSummarySheet = forwardRef<BottomSheetModal, PaymentSummarySheetProps>(
  function PaymentSummarySheet({ finance, payments }, ref) {
    const colors = useColors();
    const isDark = useIsDarkTheme();

    const snapPoints = useMemo(() => ['55%', '85%'], []);

    const quoteAmount = finance.quote_amount || 0;
    const depositAmount = finance.deposit_amount || 0;
    const depositPaid = finance.deposit_paid_amount || 0;
    const balanceAmount = Math.max(quoteAmount - depositAmount, 0);
    const balancePaid = finance.balance_paid_amount || 0;
    const totalPaid = depositPaid + balancePaid;
    const remaining = Math.max(quoteAmount - totalPaid, 0);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.38}
        />
      ),
      []
    );

    const handleCopySummary = async () => {
      const lines = [
        `Résumé financier`,
        `—`,
        `Devis total : ${formatPrice(quoteAmount)}`,
        `Acompte demandé : ${formatPrice(depositAmount)}`,
        `Acompte payé : ${formatPrice(depositPaid)}`,
        `Solde demandé : ${formatPrice(balanceAmount)}`,
        `Solde payé : ${formatPrice(balancePaid)}`,
        `—`,
        `Total payé : ${formatPrice(totalPaid)}`,
        `Restant à payer : ${formatPrice(remaining)}`,
        `Statut : ${finance.payment_status || '—'}`,
      ];

      if (payments.length > 0) {
        lines.push('', 'Historique :');
        payments.forEach((p) => {
          const label = p.payment_type === 'deposit' ? 'Acompte' : p.payment_type === 'balance' ? 'Solde' : p.payment_type;
          const status = p.status === 'paid' ? 'payé' : p.status;
          lines.push(`  - ${label} (${status}) : ${formatPrice(p.amount)}`);
        });
      }

      await Clipboard.setStringAsync(lines.join('\n'));
      toast.success('Le résumé a été copié dans le presse-papier.');
    };

    const paymentStatusLabel = useMemo(() => {
      switch (finance.payment_status) {
        case 'paid':
          return { text: 'Payé', color: '#059669', bg: isDark ? '#064E3B' : '#ECFDF5' };
        case 'deposit_paid':
          return { text: 'Acompte reçu', color: '#F59E0B', bg: isDark ? '#78350F33' : '#FFFBEB' };
        case 'deposit_pending':
          return { text: 'Acompte attendu', color: '#F59E0B', bg: isDark ? '#78350F33' : '#FFFBEB' };
        case 'refunded':
          return { text: 'Remboursé', color: '#6B7280', bg: isDark ? colors.backgroundTertiary : '#F3F4F6' };
        case 'cancelled':
          return { text: 'Annulé', color: '#EF4444', bg: isDark ? '#7F1D1D33' : '#FEF2F2' };
        default:
          return { text: 'En attente', color: colors.textSecondary, bg: isDark ? colors.backgroundTertiary : '#F3F4F6' };
      }
    }, [finance.payment_status, isDark, colors]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Wallet size={20} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Résumé des paiements</Text>
          </View>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: paymentStatusLabel.bg }]}>
            <Text style={[styles.statusBadgeText, { color: paymentStatusLabel.color }]}>
              {paymentStatusLabel.text}
            </Text>
          </View>

          {/* Finance summary */}
          <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.background : '#F9FAFB', borderColor: colors.border }]}>
            <SummaryRow label="Devis total" value={formatPrice(quoteAmount)} color={colors.primary} isBold colors={colors} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SummaryRow label="Acompte demandé" value={formatPrice(depositAmount)} colors={colors} />
            <SummaryRow
              label="Acompte payé"
              value={formatPrice(depositPaid)}
              color={depositPaid >= depositAmount && depositAmount > 0 ? '#059669' : colors.text}
              colors={colors}
            />
            {finance.deposit_due_date && (
              <SummaryRow
                label="Échéance acompte"
                value={formatDate(finance.deposit_due_date)}
                colors={colors}
                isSmall
              />
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SummaryRow label="Solde demandé" value={formatPrice(balanceAmount)} colors={colors} />
            <SummaryRow
              label="Solde payé"
              value={formatPrice(balancePaid)}
              color={balancePaid >= balanceAmount && balanceAmount > 0 ? '#059669' : colors.text}
              colors={colors}
            />
            {finance.balance_due_date && (
              <SummaryRow
                label="Échéance solde"
                value={formatDate(finance.balance_due_date)}
                colors={colors}
                isSmall
              />
            )}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <SummaryRow label="Total payé" value={formatPrice(totalPaid)} isBold color="#059669" colors={colors} />
            <SummaryRow label="Restant à payer" value={formatPrice(remaining)} isBold color={remaining > 0 ? '#EF4444' : '#059669'} colors={colors} />
          </View>

          {/* Payment history */}
          {payments.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Historique des paiements
              </Text>
              {payments.map((payment) => {
                const noteForDisplay = formatPaymentNoteForDisplay(
                  payment.note,
                  payment.transaction_ref
                );

                return (
                  <View
                    key={payment.id}
                    style={[styles.paymentRow, { borderColor: colors.border }]}
                  >
                    <View style={styles.paymentIcon}>
                      {payment.status === 'paid' ? (
                        <CheckCircle2 size={16} color="#059669" />
                      ) : (
                        <Clock size={16} color="#F59E0B" />
                      )}
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={[styles.paymentLabel, { color: colors.text }]}>
                        {payment.payment_type === 'deposit'
                          ? 'Acompte'
                          : payment.payment_type === 'balance'
                            ? 'Solde'
                            : payment.payment_type === 'refund'
                              ? 'Remboursement'
                              : 'Paiement total'}
                        {' · '}
                        <Text style={{ color: payment.status === 'paid' ? '#059669' : '#F59E0B' }}>
                          {payment.status === 'paid' ? 'Payé' : payment.status === 'pending' ? 'En attente' : payment.status}
                        </Text>
                      </Text>
                      <Text style={[styles.paymentMeta, { color: colors.textSecondary }]}>
                        {payment.paid_at
                          ? `Payé le ${formatDateTimeLabel(payment.paid_at)}`
                          : payment.due_date
                            ? `Échéance ${formatDate(payment.due_date)}`
                            : 'Sans échéance'}
                      </Text>
                      {noteForDisplay && (
                        <Text style={[styles.paymentNote, { color: colors.textTertiary }]}>
                          {noteForDisplay}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.paymentAmount, { color: colors.primary }]}>
                      {formatPrice(payment.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Copy button */}
          <Pressable
            style={[styles.copyButton, { borderColor: colors.border }]}
            onPress={handleCopySummary}
          >
            <Copy size={16} color={colors.primary} />
            <Text style={[styles.copyButtonText, { color: colors.primary }]}>
              Copier le résumé
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

function SummaryRow({
  label,
  value,
  color,
  isBold,
  isSmall,
  colors,
}: {
  label: string;
  value: string;
  color?: string;
  isBold?: boolean;
  isSmall?: boolean;
  colors: any;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          isSmall ? styles.summaryLabelSmall : styles.summaryLabel,
          { color: colors.textSecondary },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          isSmall ? styles.summaryValueSmall : styles.summaryValue,
          { color: color || colors.text },
          isBold && { fontWeight: '700' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
    gap: Layout.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
  },
  statusBadgeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryCard: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    borderWidth: 1,
    gap: Layout.spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  summaryLabelSmall: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  summaryValueSmall: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: Layout.spacing.xs,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  paymentIcon: {
    marginTop: 2,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  paymentMeta: {
    fontSize: Layout.fontSize.xs,
    marginTop: 2,
  },
  paymentNote: {
    fontSize: Layout.fontSize.xs,
    fontStyle: 'italic',
    marginTop: 2,
  },
  paymentAmount: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    borderWidth: 1,
    borderRadius: Layout.radius.md,
    paddingVertical: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  copyButtonText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
});
