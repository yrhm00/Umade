/**
 * Ecran principal - Feed d'inspirations style Pinterest (Phase 9)
 * Liquid Glass Header + Option 2 + Dark Mode Support
 */

import { EmptyState } from '@/components/common/EmptyState';
import { FilterSheet, MasonryGrid } from '@/components/inspirations';
import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useInspirationFeed } from '@/hooks/useInspirations';
import {
  InspirationFilters,
  InspirationSortBy,
  InspirationWithProvider,
} from '@/types/inspiration';
import BottomSheet from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import {
  Heart,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SEARCH_BAR_HEIGHT = 56;
const SCROLL_THRESHOLD = 50;

export default function InspirationsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const [filters, setFilters] = useState<InspirationFilters>({});
  const [sortBy, setSortBy] = useState<InspirationSortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const filterSheetRef = useRef<BottomSheet>(null);
  const searchInputRef = useRef<TextInput>(null);

  const scrollY = useSharedValue(0);

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

  const handleScroll = useCallback((y: number) => {
    scrollY.value = y;
  }, [scrollY]);

  const handleHeaderSearchPress = useCallback(() => {
    setIsSearchExpanded(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
    if (!searchQuery.trim()) {
      setIsSearchExpanded(false);
    }
  }, [searchQuery]);

  const hasActiveFilters = (filters.event_types?.length ?? 0) > 0 || (filters.styles?.length ?? 0) > 0;
  const activeFilterCount =
    (filters.event_types?.length ?? 0) + (filters.styles?.length ?? 0);

  const headerHeight = insets.top + 52 + SEARCH_BAR_HEIGHT;

  // Theme-aware colors for glass effects
  const glassOverlayColor = isDark
    ? 'rgba(26, 22, 37, 0.7)'
    : 'rgba(255, 255, 255, 0.15)';

  const glassButtonBg = isDark
    ? 'rgba(95, 74, 139, 0.3)'
    : 'rgba(255, 255, 255, 0.6)';

  const glassButtonBorder = isDark
    ? 'rgba(143, 119, 184, 0.5)'
    : 'rgba(255, 255, 255, 0.8)';

  const searchBarBg = isDark
    ? 'rgba(38, 32, 51, 0.9)'
    : 'rgba(255, 255, 255, 0.8)';

  const searchBarBorder = isDark
    ? 'rgba(95, 74, 139, 0.4)'
    : 'rgba(255, 255, 255, 0.9)';

  const searchContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [1, 0],
      Extrapolation.CLAMP
    );
    const height = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [SEARCH_BAR_HEIGHT, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity: withTiming(opacity, { duration: 150 }),
      height: withTiming(height, { duration: 150 }),
      overflow: 'hidden' as const,
    };
  });

  const headerSearchStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: withTiming(opacity, { duration: 150 }),
    };
  });

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Content - scrolls under the glass header */}
      <MasonryGrid
        data={inspirations}
        onItemPress={handleItemPress}
        onEndReached={handleEndReached}
        onRefresh={handleRefresh}
        onScroll={handleScroll}
        isLoading={isLoading}
        isLoadingMore={isFetchingNextPage}
        isRefreshing={isRefetching}
        ListHeaderComponent={
          <View style={{ height: headerHeight - 8 }} />
        }
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

      {/* Liquid Glass Header */}
      <View style={[styles.glassHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <BlurView
          intensity={60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.glassBlur}
        />
        <View style={[styles.glassOverlay, { backgroundColor: glassOverlayColor }]} />

        {/* Header row */}
        <View style={styles.headerContent} pointerEvents="auto">
          <Text style={[styles.title, { color: colors.text }]}>Inspirations</Text>
          <View style={styles.headerActions}>
            {/* Search icon (visible when scrolled) */}
            <Animated.View style={headerSearchStyle}>
              <PressableScale onPress={handleHeaderSearchPress} haptic="light">
                <View style={[
                  styles.glassButton,
                  { backgroundColor: glassButtonBg, borderColor: glassButtonBorder }
                ]}>
                  <Search size={20} color={colors.primary} />
                </View>
              </PressableScale>
            </Animated.View>

            {/* Filters icon (visible when scrolled) */}
            <Animated.View style={headerSearchStyle}>
              <PressableScale onPress={handleOpenFilters} haptic="light">
                <View style={[
                  styles.glassButton,
                  { backgroundColor: glassButtonBg, borderColor: glassButtonBorder },
                  hasActiveFilters && styles.glassButtonActive
                ]}>
                  <SlidersHorizontal
                    size={20}
                    color={hasActiveFilters ? '#FFFFFF' : colors.primary}
                  />
                  {activeFilterCount > 0 && (
                    <View style={styles.headerBadge}>
                      <Text style={styles.headerBadgeText}>{activeFilterCount}</Text>
                    </View>
                  )}
                </View>
              </PressableScale>
            </Animated.View>

            {/* Favorites (always visible) */}
            <PressableScale onPress={handleFavoritesPress} haptic="light">
              <View style={[
                styles.glassButton,
                { backgroundColor: glassButtonBg, borderColor: glassButtonBorder }
              ]}>
                <Heart size={20} color={colors.primary} />
              </View>
            </PressableScale>
          </View>
        </View>

        {/* Search bar (visible by default, hides on scroll) */}
        {!isSearchExpanded && (
          <Animated.View style={[styles.searchContainer, searchContainerStyle]} pointerEvents="auto">
            <View style={[
              styles.searchBar,
              { backgroundColor: searchBarBg, borderColor: searchBarBorder },
              isSearchFocused && { borderColor: colors.primary }
            ]}>
              <Search size={20} color={colors.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher des inspirations..."
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={handleClearSearch} hitSlop={8}>
                  <X size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>

            <PressableScale onPress={handleOpenFilters} haptic="light">
              <View style={[
                styles.filterButton,
                { backgroundColor: searchBarBg, borderColor: searchBarBorder },
                hasActiveFilters && styles.filterButtonActive
              ]}>
                <SlidersHorizontal
                  size={20}
                  color={hasActiveFilters ? '#FFFFFF' : colors.text}
                />
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </View>
            </PressableScale>
          </Animated.View>
        )}
      </View>

      {/* Expanded search overlay */}
      {isSearchExpanded && (
        <View style={[styles.searchOverlay, { paddingTop: insets.top }]}>
          <BlurView
            intensity={90}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.searchOverlayContent}>
            <View style={[
              styles.searchBar,
              { backgroundColor: searchBarBg, borderColor: searchBarBorder },
              isSearchFocused && { borderColor: colors.primary }
            ]}>
              <Search size={20} color={colors.textTertiary} />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: colors.text }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher des inspirations..."
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={handleSearchBlur}
                returnKeyType="search"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={handleClearSearch} hitSlop={8}>
                  <X size={18} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
            <Pressable
              onPress={() => {
                setIsSearchExpanded(false);
                setSearchQuery('');
              }}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Filter Sheet */}
      <FilterSheet
        ref={filterSheetRef}
        filters={filters}
        onFiltersChange={setFilters}
        onClose={handleCloseFilters}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xs,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  glassButtonActive: {
    backgroundColor: '#5F4A8B',
    borderColor: '#5F4A8B',
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xs,
    gap: Layout.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radius.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderWidth: 1,
    gap: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    paddingVertical: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: Layout.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#5F4A8B',
    borderColor: '#5F4A8B',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  searchOverlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingTop: Layout.spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.sm,
  },
  cancelButtonText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
  },
});
