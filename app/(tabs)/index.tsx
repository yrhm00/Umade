/**
 * Ecran principal - Feed d'inspirations style Pinterest (Phase 9)
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import {
  Search,
  SlidersHorizontal,
  Heart,
  X,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { EmptyState } from '@/components/common/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { MasonryGrid, FilterSheet } from '@/components/inspirations';
import { useInspirationFeed } from '@/hooks/useInspirations';
import {
  InspirationFilters,
  InspirationSortBy,
  InspirationWithProvider,
  SORT_OPTIONS,
} from '@/types/inspiration';

export default function InspirationsScreen() {
  const [filters, setFilters] = useState<InspirationFilters>({});
  const [sortBy, setSortBy] = useState<InspirationSortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const filterSheetRef = useRef<BottomSheet>(null);

  // Appliquer le searchQuery aux filtres avec debounce
  const activeFilters = useMemo(
    () => ({
      ...filters,
      searchQuery: searchQuery.trim() || undefined,
    }),
    [filters, searchQuery]
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInspirationFeed(activeFilters, sortBy);

  // Flatten pages
  const inspirations = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data]
  );

  const handleItemPress = useCallback((inspiration: InspirationWithProvider) => {
    router.push(`/inspiration/${inspiration.id}` as any);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleOpenFilters = useCallback(() => {
    filterSheetRef.current?.expand();
  }, []);

  const handleCloseFilters = useCallback(() => {
    filterSheetRef.current?.close();
  }, []);

  const handleFavoritesPress = useCallback(() => {
    router.push('/inspiration/favorites' as any);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const hasActiveFilters = filters.event_type || filters.style;
  const activeFilterCount =
    (filters.event_type ? 1 : 0) + (filters.style ? 1 : 0);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Inspirations</Text>
          <PressableScale onPress={handleFavoritesPress} haptic="light">
            <View style={styles.headerButton}>
              <Heart size={22} color={Colors.primary.DEFAULT} />
            </View>
          </PressableScale>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              isSearchFocused && styles.searchBarFocused,
            ]}
          >
            <Search size={20} color={Colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher des inspirations..."
              placeholderTextColor={Colors.text.muted}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={handleClearSearch} hitSlop={8}>
                <X size={18} color={Colors.text.tertiary} />
              </Pressable>
            )}
          </View>

          <PressableScale onPress={handleOpenFilters} haptic="light">
            <View
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
            >
              <SlidersHorizontal
                size={20}
                color={hasActiveFilters ? Colors.white : Colors.text.primary}
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </View>
          </PressableScale>
        </View>

        {/* Sort tabs */}
        <View style={styles.sortTabs}>
          {(Object.keys(SORT_OPTIONS) as InspirationSortBy[]).map((option) => (
            <Pressable
              key={option}
              onPress={() => setSortBy(option)}
              style={[
                styles.sortTab,
                sortBy === option && styles.sortTabActive,
              ]}
            >
              <Text
                style={[
                  styles.sortTabText,
                  sortBy === option && styles.sortTabTextActive,
                ]}
              >
                {SORT_OPTIONS[option]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Masonry Grid */}
        <MasonryGrid
          data={inspirations}
          onItemPress={handleItemPress}
          onEndReached={handleEndReached}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          isLoadingMore={isFetchingNextPage}
          isRefreshing={isRefetching}
          ListEmptyComponent={
            <EmptyState
              icon="🎨"
              title="Aucune inspiration"
              description="Aucune inspiration ne correspond a vos criteres. Essayez de modifier vos filtres."
              actionLabel="Effacer les filtres"
              onAction={() => {
                setFilters({});
                setSearchQuery('');
              }}
            />
          }
        />

        {/* Filter Sheet */}
        <FilterSheet
          ref={filterSheetRef}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={handleCloseFilters}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
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
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: Layout.spacing.sm,
  },
  searchBarFocused: {
    borderColor: Colors.primary.DEFAULT,
  },
  searchInput: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
    paddingVertical: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: Layout.radius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[200],
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
    borderColor: Colors.primary.DEFAULT,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
  },
  sortTabs: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  sortTab: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
    backgroundColor: Colors.gray[100],
  },
  sortTabActive: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  sortTabText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  sortTabTextActive: {
    color: Colors.white,
  },
});
