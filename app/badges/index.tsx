/**
 * Écran galerie des badges
 * Sections "Obtenus" et "À débloquer"
 */

import { BadgeDetailSheet } from '@/components/badges/BadgeDetailSheet';
import { BadgeIcon } from '@/components/badges/BadgeIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { Layout } from '@/constants/Layout';
import { useAllBadges, useUserBadges, useMarkBadgeSeen } from '@/hooks/useBadges';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { Badge } from '@/types/badges';
import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { ArrowLeft, Award } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

export default function BadgesScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const { data: userBadges = [], isLoading: userBadgesLoading } = useUserBadges();
  const { data: allBadges = [], isLoading: allBadgesLoading } = useAllBadges();
  const { mutate: markSeen } = useMarkBadgeSeen();

  const sheetRef = useRef<BottomSheet>(null);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedEarnedAt, setSelectedEarnedAt] = useState<string | null>(null);

  // IDs des badges obtenus
  const earnedBadgeIds = useMemo(
    () => new Set(userBadges.map((ub) => ub.badge_id)),
    [userBadges]
  );

  // Badges non encore obtenus
  const lockedBadges = useMemo(
    () => allBadges.filter((b) => !earnedBadgeIds.has(b.id)),
    [allBadges, earnedBadgeIds]
  );

  const handleBadgePress = useCallback(
    (badge: Badge, earnedAt?: string | null, userBadgeId?: string) => {
      setSelectedBadge(badge);
      setSelectedEarnedAt(earnedAt || null);
      sheetRef.current?.snapToIndex(0);

      // Marquer comme vu si non vu
      if (userBadgeId) {
        const ub = userBadges.find((b) => b.id === userBadgeId);
        if (ub && !ub.seen_at) {
          markSeen(userBadgeId);
        }
      }
    },
    [userBadges, markSeen]
  );

  const isLoading = userBadgesLoading || allBadgesLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOrFallback(router)} hitSlop={10}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mes badges</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Badges obtenus */}
        {userBadges.length > 0 && (
          <Animated.View entering={FadeInDown.duration(260)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Obtenus ({userBadges.length})
            </Text>
            <View style={styles.badgesGrid}>
              {userBadges.map((ub, index) => (
                <Animated.View
                  key={ub.id}
                  entering={FadeInDown.delay(index * 50).duration(260)}
                >
                  <Pressable
                    onPress={() => handleBadgePress(ub.badges, ub.earned_at, ub.id)}
                  >
                    <BadgeIcon
                      icon={ub.badges.icon}
                      name={ub.badges.name}
                      earned
                      size="md"
                    />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Badges à débloquer */}
        {lockedBadges.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(260)}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              À débloquer ({lockedBadges.length})
            </Text>
            <View style={styles.badgesGrid}>
              {lockedBadges.map((badge, index) => (
                <Animated.View
                  key={badge.id}
                  entering={FadeInDown.delay((userBadges.length + index) * 50).duration(260)}
                >
                  <Pressable onPress={() => handleBadgePress(badge)}>
                    <BadgeIcon
                      icon={badge.icon}
                      name={badge.name}
                      earned={false}
                      size="md"
                    />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Empty state */}
        {!isLoading && userBadges.length === 0 && allBadges.length === 0 && (
          <EmptyState
            icon={<Award size={36} color={colors.primary} />}
            title="Aucun badge disponible"
            description="Les badges seront bientôt disponibles. Restez à l'affût !"
          />
        )}
      </ScrollView>

      {/* Badge detail sheet */}
      <BadgeDetailSheet
        ref={sheetRef}
        badge={selectedBadge}
        earnedAt={selectedEarnedAt}
        onDismiss={() => setSelectedBadge(null)}
      />
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
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    marginBottom: Layout.spacing.md,
    marginTop: Layout.spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
  },
});
