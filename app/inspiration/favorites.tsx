/**
 * Ecran des inspirations favorites
 * Dark Mode Support
 */

import { EmptyState } from '@/components/common/EmptyState';
import { MasonryGrid } from '@/components/inspirations';
import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useUserFavoriteInspirations } from '@/hooks/useInspirationFavorites';
import { InspirationWithProvider } from '@/types/inspiration';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InspirationFavoritesScreen() {
  const colors = useColors();
  const isDark = useIsDarkTheme();
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

  const backButtonBg = isDark ? colors.backgroundTertiary : `${colors.primary}10`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={handleBack} haptic="light">
          <View style={[styles.backButton, { backgroundColor: backButtonBg }]}>
            <ChevronLeft size={24} color={colors.text} />
          </View>
        </PressableScale>
        <Text style={[styles.title, { color: colors.text }]}>Mes favoris</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
});
