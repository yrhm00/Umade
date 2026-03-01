/**
 * ReferralCodeCard - Affiche le code de parrainage avec options de partage
 */

import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useReferralCode, useReferralStats } from '@/hooks/useReferral';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Copy, Gift, Share2, Users } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function ReferralCodeCard() {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { data: referralCode, isLoading } = useReferralCode();
  const { data: stats } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!referralCode?.code) return;

    await Clipboard.setStringAsync(referralCode.code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode?.code]);

  const handleShare = useCallback(async () => {
    if (!referralCode?.code) return;

    try {
      await Share.share({
        message: `Rejoins Umade et obtiens 200 crédits de bienvenue avec mon code : ${referralCode.code}\n\nTélécharge l'app: https://umade.app`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [referralCode?.code]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Main card */}
      <LinearGradient
        colors={[Colors.primary.DEFAULT, '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.header}>
          <Gift size={24} color={Colors.white} />
          <Text style={styles.title}>Parrainez vos amis</Text>
        </View>

        <Text style={styles.description}>
          Gagnez 500 crédits pour chaque ami qui fait sa première réservation !
        </Text>

        {/* Code display */}
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Votre code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{referralCode?.code || '...'}</Text>
            <Pressable onPress={handleCopy} style={styles.copyButton}>
              <Copy size={20} color={Colors.white} />
              {copied && <Text style={styles.copiedText}>Copié !</Text>}
            </Pressable>
          </View>
        </View>

        {/* Share button */}
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Share2 size={20} color={Colors.primary.DEFAULT} />
          <Text style={styles.shareButtonText}>Partager mon code</Text>
        </Pressable>
      </LinearGradient>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Users size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats?.total_referrals || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Parrainages
          </Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

        <View style={styles.statItem}>
          <Gift size={20} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats?.total_earned || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Crédits gagnés
          </Text>
        </View>
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
    minHeight: 200,
  },
  gradientCard: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: Layout.spacing.lg,
  },
  codeContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  codeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Layout.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    padding: Layout.spacing.sm,
  },
  copiedText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.DEFAULT,
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginHorizontal: Layout.spacing.md,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
});
