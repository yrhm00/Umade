/**
 * Ecran des inspirations favorites (Phase 9)
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { PressableScale } from '@/components/ui/PressableScale';
import { EmptyState } from '@/components/common/EmptyState';
import { MasonryGrid } from '@/components/inspirations';
import { useUserFavoriteInspirations } from '@/hooks/useInspirationFavorites';
import { InspirationWithProvider } from '@/types/inspiration';

export default function InspirationFavoritesScreen() {
  const { data: favorites, isLoading, refetch, isRefetching } =
    useUserFavoriteInspirations();

  const inspirations = useMemo(() => favorites ?? [], [favorites]);

  const handleItemPress = useCallback((inspiration: InspirationWithProvider) => {
    router.push(`/inspiration/${inspiration.id}` as any);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleExplore = useCallback(() => {
    router.replace('/(tabs)' as any);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={handleBack} haptic="light">
          <View style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text.primary} />
          </View>
        </PressableScale>
        <Text style={styles.title}>Mes favoris</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Grid */}
      <MasonryGrid
        data={inspirations}
        onItemPress={handleItemPress}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            icon="❤️"
            title="Aucun favori"
            description="Vous n'avez pas encore enregistre d'inspirations en favoris. Explorez le feed pour en ajouter!"
            actionLabel="Explorer"
            onAction={handleExplore}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  placeholder: {
    width: 44,
  },
});
