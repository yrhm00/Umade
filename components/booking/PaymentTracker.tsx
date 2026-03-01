/**
 * Payment Tracker Component
 * Stepper vertical 4 étapes + barre de progression animée.
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { formatDate, formatPrice } from '@/lib/utils';
import { BookingFinanceSnapshot, BookingPayment } from '@/types/bookingAdvanced';
import { Check, Circle, CreditCard, Receipt, Shield, Wallet } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface PaymentTrackerProps {
  finance: BookingFinanceSnapshot;
  payments: BookingPayment[];
}

type StepStatus = 'completed' | 'current' | 'pending';

interface Step {
  label: string;
  description: string;
  status: StepStatus;
  icon: React.ReactNode;
}

export function PaymentTracker({ finance, payments }: PaymentTrackerProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const quoteAmount = finance.quote_amount || 0;
  const depositAmount = finance.deposit_amount || 0;
  const depositPaid = finance.deposit_paid_amount || 0;
  const balancePaid = finance.balance_paid_amount || 0;
  const balanceAmount = Math.max(quoteAmount - depositAmount, 0);
  const totalPaid = depositPaid + balancePaid;
  const progressPercent = quoteAmount > 0 ? Math.min((totalPaid / quoteAmount) * 100, 100) : 0;

  const depositDueDate = finance.deposit_due_date;
  const balanceDueDate = finance.balance_due_date;
  const isDepositLate = depositDueDate && new Date(depositDueDate) < new Date() && depositPaid < depositAmount;
  const isBalanceLate = balanceDueDate && new Date(balanceDueDate) < new Date() && balancePaid < balanceAmount;

  // Animated progress bar
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(progressPercent, { duration: 800 });
  }, [progressPercent, progressWidth]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const steps = useMemo<Step[]>(() => {
    const quoteAccepted = quoteAmount > 0;
    const depositDone = depositPaid >= depositAmount && depositAmount > 0;
    const balanceDone = balancePaid >= balanceAmount && balanceAmount > 0;
    const fullyPaid = finance.payment_status === 'paid';

    return [
      {
        label: 'Devis accepté',
        description: quoteAccepted
          ? `${formatPrice(quoteAmount)} accepté`
          : 'En attente du devis',
        status: quoteAccepted ? 'completed' : 'current',
        icon: <Receipt size={16} color={quoteAccepted ? '#FFFFFF' : colors.textTertiary} />,
      },
      {
        label: 'Acompte',
        description: depositAmount > 0
          ? depositDone
            ? `${formatPrice(depositPaid)} payé`
            : `${formatPrice(depositPaid)} / ${formatPrice(depositAmount)}${depositDueDate ? ` · Échéance ${formatDate(depositDueDate)}` : ''}`
          : 'Pas d\'acompte requis',
        status: depositAmount <= 0
          ? 'completed'
          : depositDone
            ? 'completed'
            : quoteAccepted
              ? 'current'
              : 'pending',
        icon: <CreditCard size={16} color={
          depositAmount <= 0 || depositDone ? '#FFFFFF' : colors.textTertiary
        } />,
      },
      {
        label: 'Solde',
        description: balanceAmount > 0
          ? balanceDone
            ? `${formatPrice(balancePaid)} payé`
            : `${formatPrice(balancePaid)} / ${formatPrice(balanceAmount)}${balanceDueDate ? ` · Échéance ${formatDate(balanceDueDate)}` : ''}`
          : 'Pas de solde restant',
        status: balanceAmount <= 0
          ? 'completed'
          : balanceDone
            ? 'completed'
            : (depositDone || depositAmount <= 0) && quoteAccepted
              ? 'current'
              : 'pending',
        icon: <Wallet size={16} color={
          balanceAmount <= 0 || balanceDone ? '#FFFFFF' : colors.textTertiary
        } />,
      },
      {
        label: 'Paiement complet',
        description: fullyPaid
          ? `${formatPrice(totalPaid)} reçus`
          : `Restant : ${formatPrice(Math.max(quoteAmount - totalPaid, 0))}`,
        status: fullyPaid ? 'completed' : 'pending',
        icon: <Shield size={16} color={fullyPaid ? '#FFFFFF' : colors.textTertiary} />,
      },
    ];
  }, [finance, quoteAmount, depositAmount, depositPaid, balancePaid, balanceAmount, totalPaid, depositDueDate, balanceDueDate, colors]);

  const getStepColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return '#059669';
      case 'current':
        return colors.primary;
      case 'pending':
        return isDark ? colors.backgroundTertiary : '#E5E7EB';
    }
  };

  const getStepTextColor = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return '#059669';
      case 'current':
        return colors.primary;
      case 'pending':
        return colors.textTertiary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Progression des paiements
          </Text>
          <Text style={[styles.progressValue, { color: colors.primary }]}>
            {Math.round(progressPercent)}%
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: isDark ? colors.backgroundTertiary : '#E5E7EB' }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { backgroundColor: progressPercent >= 100 ? '#059669' : colors.primary },
              progressBarStyle,
            ]}
          />
        </View>
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        {steps.map((step, index) => {
          const stepColor = getStepColor(step.status);
          const isLast = index === steps.length - 1;
          const isLate =
            (index === 1 && isDepositLate) || (index === 2 && isBalanceLate);

          return (
            <View key={index} style={styles.stepRow}>
              {/* Dot + line */}
              <View style={styles.stepIndicatorCol}>
                <View
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: isLate ? '#EF4444' : stepColor,
                    },
                  ]}
                >
                  {step.status === 'completed' ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    step.icon
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.stepLine,
                      {
                        backgroundColor:
                          step.status === 'completed' ? '#059669' : isDark ? colors.backgroundTertiary : '#E5E7EB',
                      },
                    ]}
                  />
                )}
              </View>

              {/* Content */}
              <View style={styles.stepContent}>
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: isLate ? '#EF4444' : getStepTextColor(step.status),
                      fontWeight: step.status === 'current' ? '700' : '600',
                    },
                  ]}
                >
                  {step.label}
                  {isLate ? ' ⚠️' : ''}
                </Text>
                <Text
                  style={[
                    styles.stepDescription,
                    { color: isLate ? '#EF4444' : colors.textSecondary },
                  ]}
                >
                  {step.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Layout.spacing.lg,
  },
  progressContainer: {
    gap: Layout.spacing.xs,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepper: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
  stepContent: {
    flex: 1,
    paddingBottom: Layout.spacing.md,
  },
  stepLabel: {
    fontSize: Layout.fontSize.sm,
  },
  stepDescription: {
    fontSize: Layout.fontSize.xs,
    marginTop: 2,
    lineHeight: 18,
  },
});
