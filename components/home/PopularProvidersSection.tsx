/**
 * Section prestataires populaires sur l'écran Home
 */

import { SectionHeader } from '@/components/common/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useTopProviders } from '@/hooks/useProviders';
import { useRouter } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ProviderCardSmall } from './ProviderCardSmall';

export function PopularProvidersSection() {
  const router = useRouter();
  const colors = useColors();
  const { data: providers, isLoading, isError, refetch } = useTopProviders(6);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SectionHeader title="Prestataires populaires" />
        <View style={styles.skeletonRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.skeletonItem}>
              <Skeleton.ProviderCard />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <SectionHeader title="Prestataires populaires" />
        <TouchableOpacity
          style={[styles.errorRow, { backgroundColor: `${colors.error}10` }]}
          onPress={() => refetch()}
          accessibilityLabel="Réessayer de charger les prestataires"
          accessibilityRole="button"
        >
          <AlertCircle size={16} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            Impossible de charger — Appuyer pour réessayer
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!providers || providers.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(260)} style={styles.container}>
      <SectionHeader
        title="Prestataires populaires"
        actionLabel="Voir tous"
        onAction={() => router.push('/(tabs)/search' as any)}
      />
      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: Layout.spacing.md }} />}
        snapToInterval={150 + Layout.spacing.md}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item }) => <ProviderCardSmall provider={item} />}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  listContent: {
    paddingLeft: Layout.spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingLeft: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  skeletonItem: {
    width: 140,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
});
