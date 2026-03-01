/**
 * Écran principal de parrainage
 */

import { CreditsBalance, ReferralCodeCard } from '@/components/referral';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useReferrals } from '@/hooks/useReferral';
import { ReferralWithUser } from '@/types/referral';
import { Avatar } from '@/components/ui/Avatar';
import { router } from 'expo-router';
import { ChevronLeft, Clock, CheckCircle, Gift } from 'lucide-react-native';
import React from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { goBackOrFallback } from '@/lib/navigation';

export default function ReferralScreen() {
  const colors = useColors();
  const { data: referrals } = useReferrals();

  const renderReferral = ({ item }: { item: ReferralWithUser }) => {
    const isPending = item.status === 'pending';
    const isCompleted = item.status === 'completed' || item.status === 'rewarded';

    return (
      <View style={[styles.referralItem, { backgroundColor: colors.card }]}>
        <Avatar
          source={item.referred?.avatar_url}
          name={item.referred?.full_name || 'Utilisateur'}
          size="md"
        />
        <View style={styles.referralInfo}>
          <Text style={[styles.referralName, { color: colors.text }]}>
            {item.referred?.full_name || 'Utilisateur'}
          </Text>
          <Text style={[styles.referralDate, { color: colors.textSecondary }]}>
            Inscrit le {new Date(item.created_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: isPending ? Colors.warning.light : Colors.success.light }
        ]}>
          {isPending ? (
            <Clock size={14} color={Colors.warning.DEFAULT} />
          ) : (
            <CheckCircle size={14} color={Colors.success.DEFAULT} />
          )}
          <Text style={[
            styles.statusText,
            { color: isPending ? Colors.warning.DEFAULT : Colors.success.DEFAULT }
          ]}>
            {isPending ? 'En attente' : 'Validé'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Parrainage</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Referral code card */}
        <ReferralCodeCard />

        {/* Credits balance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Mes crédits
          </Text>
          <CreditsBalance showHistory />
        </View>

        {/* Referrals list */}
        {referrals && referrals.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Mes filleuls ({referrals.length})
            </Text>
            {referrals.map((referral) => (
              <View key={referral.id}>
                {renderReferral({ item: referral })}
              </View>
            ))}
          </View>
        )}

        {/* How it works */}
        <View style={[styles.howItWorks, { backgroundColor: colors.card }]}>
          <Text style={[styles.howItWorksTitle, { color: colors.text }]}>
            Comment ça marche ?
          </Text>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Partagez votre code avec vos amis
            </Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Ils s'inscrivent avec votre code et reçoivent 200 crédits
            </Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.textSecondary }]}>
              Quand ils font leur première réservation, vous gagnez 500 crédits !
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.spacing.lg,
    gap: Layout.spacing.xl,
  },
  section: {
    gap: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 15,
    fontWeight: '500',
  },
  referralDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  howItWorks: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.md,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
