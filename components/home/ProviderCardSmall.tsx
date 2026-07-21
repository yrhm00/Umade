/**
 * Card compacte pour un prestataire (section Home)
 */

import { RatingStars } from '@/components/common/RatingStars';
import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { ProviderListItem } from '@/types';
import { useRouter } from 'expo-router';
import { BadgeCheck, User } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ProviderCardSmallProps {
  provider: ProviderListItem;
}

export function ProviderCardSmall({ provider }: ProviderCardSmallProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  return (
    <PressableScale
      scale={0.97}
      haptic="selection"
      onPress={() => router.push(`/provider/${provider.id}` as any)}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderColor: isDark ? colors.border : '#F3F4F6',
          shadowColor: isDark ? 'transparent' : '#000',
        },
      ]}
    >
      {/* Avatar */}
      {provider.portfolio_image ? (
        <Image
          source={{ uri: provider.portfolio_image }}
          style={styles.avatar}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
          <User size={28} color={colors.textTertiary} />
        </View>
      )}

      {/* Business name */}
      <View style={styles.nameRow}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {provider.business_name}
        </Text>
        {provider.is_verified ? (
          <BadgeCheck size={14} color={colors.primary} fill={`${colors.primary}22`} />
        ) : null}
      </View>

      {/* Category */}
      <Text style={[styles.category, { color: colors.textSecondary }]} numberOfLines={1}>
        {provider.category_name}
      </Text>

      {/* Rating */}
      {provider.average_rating ? (
        <RatingStars
          rating={provider.average_rating}
          reviewCount={provider.review_count || 0}
          size={11}
        />
      ) : (
        <Text style={[styles.newBadge, { color: colors.primary }]}>Nouveau</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Layout.spacing.sm,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
    maxWidth: '100%',
  },
  name: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  category: {
    fontSize: Layout.fontSize.xs,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  newBadge: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
});
