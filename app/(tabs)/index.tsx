/**
 * Ecran principal - Home personnalisée + Feed d'inspirations (Phase 10)
 * Liquid Glass Header + Dark Mode Support
 */

import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeader } from '@/components/common/SectionHeader';
import {
  HomeOverview,
  CountdownCard,
  ChecklistPreview,
  ArticlesSection,
  PopularProvidersSection,
  RecommendedProvidersSection,
} from '@/components/home';
import { FilterSheet, MasonryGrid } from '@/components/inspirations';
import { StoriesStrip } from '@/components/stories';
import { PressableScale } from '@/components/ui/PressableScale';
import { VoiceSearchButton } from '@/components/ui/VoiceSearchButton';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useInspirationFeed } from '@/hooks/useInspirations';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuthStore } from '@/stores/authStore';
import {
  InspirationFilters,
  InspirationSortBy,
  InspirationWithProvider,
} from '@/types/inspiration';
import {
  getDaysUntilEvent,
  getEventTypeEmoji,
  getEventTypeLabel,
  getStyleLabel,
} from '@/types/preferences';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import {
  Heart,
  Palette,
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const { data: preferences } = useUserPreferences();
  const profile = useAuthStore((s) => s.profile);

  const [filters, setFilters] = useState<InspirationFilters>({});
  const [sortBy, setSortBy] = useState<InspirationSortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const filterSheetRef = useRef<BottomSheetModal>(null);
  const searchInputRef = useRef<TextInput>(null);

  const scrollY = useSharedValue(0);

  // Apply preferred styles to inspiration filters
  const activeFilters = useMemo(
    () => ({
      ...filters,
      searchQuery: searchQuery.trim() || undefined,
      // Filter by preferred styles if no manual filter is set
      styles: filters.styles?.length
        ? filters.styles
        : preferences?.preferred_styles?.length
        ? (preferences.preferred_styles as any)
        : undefined,
    }),
    [filters, searchQuery, preferences?.preferred_styles]
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

  const firstName = profile?.full_name?.split(' ')[0] || 'toi';
  const daysUntil = getDaysUntilEvent(preferences?.event_date || null);
  const eventLabel = preferences?.event_type
    ? getEventTypeLabel(preferences.event_type)
    : 'Événement';
  const eventEmoji = preferences?.event_type
    ? getEventTypeEmoji(preferences.event_type)
    : '✨';
  const firstPreferredStyle = preferences?.preferred_styles?.[0];
  const preferredStyleLabel = firstPreferredStyle
    ? getStyleLabel(firstPreferredStyle)
    : null;

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
    filterSheetRef.current?.present();
  }, []);

  const handleCloseFilters = useCallback(() => {
    filterSheetRef.current?.dismiss();
  }, []);

  const handleFavoritesPress = useCallback(() => {
    router.push('/inspiration/favorites' as any);
  }, []);

  const handleFindProvidersPress = useCallback(() => {
    router.push('/(tabs)/search' as any);
  }, []);

  const handleEventsPress = useCallback(() => {
    router.push('/(tabs)/events' as any);
  }, []);

  const handleChecklistPress = useCallback(() => {
    router.push('/checklist' as any);
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

  const handleVoiceResult = useCallback((text: string) => {
    setSearchQuery(text);
    setIsSearchExpanded(false);
  }, []);

  const hasActiveFilters = (filters.event_types?.length ?? 0) > 0 || (filters.styles?.length ?? 0) > 0;
  const activeFilterCount =
    (filters.event_types?.length ?? 0) + (filters.styles?.length ?? 0);

  const headerHeight = insets.top + 52 + SEARCH_BAR_HEIGHT;

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
          <View style={{ paddingTop: headerHeight - 8 }}>
            <HomeOverview
              colors={colors}
              isDark={isDark}
              firstName={firstName}
              eventName={preferences?.event_name}
              eventLabel={eventLabel}
              eventEmoji={eventEmoji}
              daysUntil={daysUntil}
              location={preferences?.location}
              guestCount={preferences?.guest_count}
              preferredStyle={preferredStyleLabel}
              onFindProviders={handleFindProvidersPress}
              onOpenEvents={handleEventsPress}
              onOpenChecklist={handleChecklistPress}
              onOpenFavorites={handleFavoritesPress}
            />

            <StoriesStrip />

            <CountdownCard />
            <ChecklistPreview />

            <RecommendedProvidersSection />
            <PopularProvidersSection />
            <ArticlesSection />

            <SectionHeader title="Inspirations pour toi" delay={100} />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Palette size={32} color={colors.primary} />}
            title="Aucune inspiration"
            description="Aucune inspiration ne correspond à vos critères. Essayez de modifier vos filtres."
            actionLabel="Effacer les filtres"
            onAction={() => {
              setFilters({});
              setSearchQuery('');
            }}
          />
        }
      />

      {/* Liquid Glass Header */}
      <View
        style={[
          styles.glassHeader,
          {
            paddingTop: insets.top,
          },
        ]}
        pointerEvents="box-none"
      >
        <BlurView
          intensity={28}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {/* Uniform tint overlay (no gradient line) */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(15,13,22,0.25)' : 'rgba(255,255,255,0.18)' },
          ]}
          pointerEvents="none"
        />

        {/* Header row */}
        <View style={styles.headerContent} pointerEvents="auto">
          <Text style={[styles.title, { color: colors.text }]}>Accueil</Text>
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
              <VoiceSearchButton
                onResult={handleVoiceResult}
                size={32}
              />
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: fontFamily.bold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.sm,
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
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.xs,
    gap: Layout.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radius.sm,
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
    borderRadius: Layout.radius.sm,
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
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: Layout.spacing.md,
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
    fontFamily: fontFamily.medium,
  },
  sectionHeader: {
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.sm,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.bold,
  },
});
