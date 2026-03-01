/**
 * CreditsBalance - Affiche le solde de crédits
 */

import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useCredits, useCreditHistory } from '@/hooks/useReferral';
import { CreditTransaction } from '@/types/referral';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowDown, ArrowUp, Coins, History } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface CreditsBalanceProps {
  showHistory?: boolean;
}

export function CreditsBalance({ showHistory = false }: CreditsBalanceProps) {
  const colors = useColors();
  const { data: credits, isLoading } = useCredits();
  const { data: history } = useCreditHistory();

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Balance card */}
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceHeader}>
          <Coins size={24} color={Colors.white} />
          <Text style={styles.balanceLabel}>Mes crédits</Text>
        </View>

        <Text style={styles.balanceValue}>
          {credits?.balance || 0}
        </Text>

        <Text style={styles.lifetimeText}>
          Total gagné: {credits?.lifetime_earned || 0} crédits
        </Text>
      </LinearGradient>

      {/* History */}
      {showHistory && history && history.length > 0 && (
        <View style={[styles.historyContainer, { backgroundColor: colors.card }]}>
          <View style={styles.historyHeader}>
            <History size={18} color={colors.textSecondary} />
            <Text style={[styles.historyTitle, { color: colors.text }]}>
              Historique
            </Text>
          </View>

          <FlatList
            data={history.slice(0, 10)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TransactionItem transaction={item} />
            )}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

function TransactionItem({ transaction }: { transaction: CreditTransaction }) {
  const colors = useColors();
  const isPositive = transaction.amount > 0;

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'referral_bonus':
        return 'Bonus parrainage';
      case 'referee_bonus':
        return 'Bonus bienvenue';
      case 'booking_reward':
        return 'Récompense réservation';
      case 'spent':
        return 'Utilisé';
      case 'expired':
        return 'Expiré';
      default:
        return 'Transaction';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <View style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
      <View style={[
        styles.transactionIcon,
        { backgroundColor: isPositive ? Colors.success.light : Colors.error.light }
      ]}>
        {isPositive ? (
          <ArrowDown size={16} color={Colors.success.DEFAULT} />
        ) : (
          <ArrowUp size={16} color={Colors.error.DEFAULT} />
        )}
      </View>

      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionType, { color: colors.text }]}>
          {getTypeLabel(transaction.type)}
        </Text>
        {transaction.description && (
          <Text style={[styles.transactionDescription, { color: colors.textSecondary }]} numberOfLines={1}>
            {transaction.description}
          </Text>
        )}
      </View>

      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: isPositive ? Colors.success.DEFAULT : Colors.error.DEFAULT }
        ]}>
          {isPositive ? '+' : ''}{transaction.amount}
        </Text>
        <Text style={[styles.transactionDate, { color: colors.textTertiary }]}>
          {formatDate(transaction.created_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Layout.spacing.md,
  },
  container: {
    padding: Layout.spacing.xl,
    borderRadius: Layout.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  balanceCard: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    alignItems: 'center',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Layout.spacing.xs,
  },
  lifetimeText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  historyContainer: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    gap: Layout.spacing.sm,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 11,
    marginTop: 2,
  },
});
