/**
 * Ecran Recherche - Combine l'accueil et la recherche de prestataires
 * Dark Mode Support
 */

import { CategoryPill } from '@/components/common/CategoryPill';
import { EmptyState } from '@/components/common/EmptyState';
import { SectionHeader } from '@/components/common/SectionHeader';
import { FiltersBottomSheet } from '@/components/providers/FiltersBottomSheet';
import { CompareBar } from '@/components/providers/CompareBar';
import { CARD_WIDTH, ProviderCard } from '@/components/providers/ProviderCard';
import { Avatar } from '@/components/ui/Avatar';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { VoiceSearchButton } from '@/components/ui/VoiceSearchButton';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useSearchProviders, useTopProviders } from '@/hooks/useProviders';
import { debounce } from '@/lib/utils';
import { useSearchStore } from '@/stores/searchStore';
import { ProviderFilters, ProviderListItem } from '@/types';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Grid,
  List,
  Search as SearchIcon,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const filtersSheetRef = useRef<BottomSheetModal>(null);
  const { profile } = useAuth();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    filters,
    viewMode,
    setFilters,
    resetFilters,
    setSearchQuery,
    setCategory,
    setViewMode,
  } = useSearchStore();

  const { data: categories, refetch: refetchCategories } = useCategories();
  const { data: topProviders, refetch: refetchProviders } = useTopProviders(10);

  const [searchText, setSearchText] = useState(filters.searchQuery || '');

  useEffect(() => {
    if (params.category && params.category !== filters.categorySlug) {
      setCategory(params.category);
      setIsSearchMode(true);
    }
  }, [params.category]);

  useEffect(() => {
    if (filters.categorySlug || filters.searchQuery) {
      setIsSearchMode(true);
    }
  }, [filters]);

  const {
    data,
    isLoading: searchLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSearchProviders(filters);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      if (query) setIsSearchMode(true);
    }, Config.searchDebounceMs),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    debouncedSearch(text);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSearchQuery('');
  };

  const handleVoiceResult = (text: string) => {
    setSearchText(text);
    setSearchQuery(text);
    setIsSearchMode(true);
  };

  const handleSearchFocus = () => {
    setIsSearchMode(true);
  };

  const handleBackToHome = () => {
    setIsSearchMode(false);
    resetFilters();
    setSearchText('');
  };

  const handleOpenFilters = () => {
    filtersSheetRef.current?.present();
  };

  const handleApplyFilters = (newFilters: ProviderFilters) => {
    setFilters(newFilters);
    setIsSearchMode(true);
  };

  const handleResetFilters = () => {
    resetFilters();
    setSearchText('');
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleCategoryPress = (slug: string) => {
    if (slug === '') {
      setCategory(undefined);
    } else {
      setCategory(filters.categorySlug === slug ? undefined : slug);
    }
    setIsSearchMode(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchProviders()]);
    setRefreshing(false);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'vous';
  const providers = data?.pages.flatMap((page) => page) || [];

  const activeFiltersCount = [
    filters.categorySlug,
    filters.city,
    filters.minRating,
    filters.maxPrice,
  ].filter(Boolean).length;

  // Theme-aware colors
  const cardBg = isDark ? colors.card : '#FFFFFF';
  const backButtonBg = isDark ? colors.backgroundTertiary : `${colors.primary}10`;

  const renderProvider = ({ item, index }: { item: ProviderListItem; index: number }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <ProviderCard provider={item} variant={viewMode} index={index} />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (searchLoading) return null;
    return (
      <EmptyState
        icon={<SearchIcon size={32} color={colors.primary} />}
        title="Aucun résultat"
        description="Essayez de modifier vos critères de recherche"
        actionLabel="Réinitialiser les filtres"
        onAction={handleResetFilters}
      />
    );
  };

  // Search mode UI
  if (isSearchMode) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <>
          <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleBackToHome}
                style={[styles.backButton, { backgroundColor: backButtonBg }]}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: colors.text }]}>Recherche</Text>
              <View style={styles.placeholder} />
            </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: cardBg }]}>
              <SearchIcon size={20} color={colors.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Rechercher un prestataire..."
                placeholderTextColor={colors.textTertiary}
                value={searchText}
                onChangeText={handleSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <X size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
              <VoiceSearchButton
                onResult={handleVoiceResult}
                size={32}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.filterButton,
                { backgroundColor: activeFiltersCount > 0 ? colors.primary : cardBg },
              ]}
              onPress={handleOpenFilters}
            >
              <SlidersHorizontal
                size={20}
                color={activeFiltersCount > 0 ? '#FFFFFF' : colors.primary}
              />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick category filters */}
          <View style={styles.quickFilters}>
            <FlatList
              horizontal
              data={[{ id: 'all', name: 'Tous', slug: '' }, ...(categories || [])]}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickFiltersList}
              renderItem={({ item }) => (
                <CategoryPill
                  label={item.name}
                  isSelected={
                    item.slug === ''
                      ? !filters.categorySlug
                      : filters.categorySlug === item.slug
                  }
                  onPress={() => handleCategoryPress(item.slug)}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.categoryGap} />}
            />
          </View>

          {/* View mode toggle + Results count */}
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
              {providers.length} résultat{providers.length > 1 ? 's' : ''}
            </Text>
            <View style={[styles.viewToggle, { backgroundColor: cardBg }]}>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  viewMode === 'grid' && { backgroundColor: `${colors.primary}15` },
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Grid
                  size={18}
                  color={viewMode === 'grid' ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  viewMode === 'list' && { backgroundColor: `${colors.primary}15` },
                ]}
                onPress={() => setViewMode('list')}
              >
                <List
                  size={18}
                  color={viewMode === 'list' ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Results */}
          {searchLoading ? (
            <View style={styles.skeletonContainer}>
              {viewMode === 'grid' ? (
                <View style={styles.skeletonGrid}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton.ProviderCard key={`skel-${i}`} />
                  ))}
                </View>
              ) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <View key={`skel-${i}`} style={styles.skeletonListItem}>
                    <Skeleton.ProviderCard />
                  </View>
                ))
              )}
            </View>
          ) : (
            <FlatList
              data={providers}
              keyExtractor={(item) => item.id}
              renderItem={renderProvider}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode}
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={renderEmpty}
            />
          )}

            <FiltersBottomSheet
              ref={filtersSheetRef}
              filters={filters}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
            />
          </SafeAreaView>
          <CompareBar />
        </>
      </GestureHandlerRootView>
    );
  }

  // Home mode UI
  return (
    <GestureHandlerRootView style={styles.container}>
      <>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          >
          {/* Header */}
          <View style={styles.homeHeader}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting()}</Text>
              <Text style={[styles.userName, { color: colors.text }]}>{firstName}</Text>
            </View>
            <View style={styles.headerRight}>
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: cardBg }]}
                  onPress={() => router.push('/notifications' as any)}
                >
                  <Bell size={24} color={colors.text} />
                </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
                <Avatar
                  source={profile?.avatar_url}
                  name={profile?.full_name || '?'}
                  size="md"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={[styles.searchBarHome, { backgroundColor: cardBg }]}
            onPress={handleSearchFocus}
            activeOpacity={0.7}
          >
            <SearchIcon size={20} color={colors.textTertiary} />
            <Text style={[styles.searchPlaceholder, { color: colors.textTertiary }]}>
              Rechercher un prestataire...
            </Text>
          </TouchableOpacity>

          {/* Categories Section */}
          <View style={styles.section}>
            <SectionHeader title="Catégories" delay={0} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {categories?.map((category) => (
                <CategoryPill
                  key={category.id}
                  label={category.name}
                  icon={category.icon || undefined}
                  onPress={() => handleCategoryPress(category.slug)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Top Providers Section */}
          <View style={styles.section}>
            <SectionHeader
              title="Top prestataires"
              actionLabel="Voir tout"
              onAction={() => setIsSearchMode(true)}
              delay={100}
            />

            {topProviders && topProviders.length > 0 ? (
              <FlatList
                data={topProviders}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <ProviderCard provider={item} variant="grid" index={index} />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.providersContainer}
                snapToInterval={CARD_WIDTH + Layout.spacing.md}
                decelerationRate="fast"
                ItemSeparatorComponent={() => (
                  <View style={styles.providerSeparator} />
                )}
              />
            ) : (
              <View style={styles.emptyProviders}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Aucun prestataire disponible pour le moment
                </Text>
              </View>
            )}
          </View>

          {/* Categories Grid */}
          <View style={styles.section}>
            <SectionHeader title="Explorer par catégorie" delay={200} />
            <View style={styles.categoryGrid}>
              {categories?.slice(0, 6).map((category, index) => (
                <Animated.View
                  key={category.id}
                  entering={FadeInUp.delay(200 + index * 60).duration(260)}
                >
                  <PressableScale
                    scale={0.95}
                    haptic="light"
                    onPress={() => handleCategoryPress(category.slug)}
                  >
                    <LinearGradient
                      colors={isDark ? [colors.card, colors.backgroundTertiary] : [Colors.white, Colors.primary[50]]}
                      style={styles.categoryGridItem}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.categoryGridIcon}>
                        {category.icon || '📌'}
                      </Text>
                      <Text style={[styles.categoryGridName, { color: colors.text }]} numberOfLines={2}>
                        {category.name}
                      </Text>
                    </LinearGradient>
                  </PressableScale>
                </Animated.View>
              ))}
            </View>
          </View>
        </ScrollView>

          <FiltersBottomSheet
            ref={filtersSheetRef}
            filters={filters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </SafeAreaView>
        <CompareBar />
      </>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: fontFamily.bold,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: Layout.fontSize.sm,
  },
  userName: {
    fontSize: Layout.fontSize['2xl'],
    fontFamily: fontFamily.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    height: 48,
    gap: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBarHome: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.spacing.lg,
    marginVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Layout.fontSize.md,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: Layout.fontSize.md,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: Layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.semiBold,
    color: '#FFFFFF',
  },
  section: {
    marginTop: Layout.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.semiBold,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  sectionTitleNoMargin: {
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.semiBold,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  seeAllText: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  categoriesContainer: {
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  quickFilters: {
    marginTop: Layout.spacing.md,
  },
  quickFiltersList: {
    paddingHorizontal: Layout.spacing.lg,
  },
  categoryGap: {
    width: Layout.spacing.sm,
  },
  providersContainer: {
    paddingHorizontal: Layout.spacing.lg,
  },
  providerSeparator: {
    width: Layout.spacing.md,
  },
  emptyProviders: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Layout.fontSize.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  categoryGridItem: {
    width: (Dimensions.get('window').width - Layout.spacing.lg * 2 - Layout.spacing.md * 2) / 3,
    aspectRatio: 1,
    borderRadius: Layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryGridIcon: {
    fontSize: 32,
    marginBottom: Layout.spacing.sm,
  },
  categoryGridName: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  resultsCount: {
    fontSize: Layout.fontSize.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: Layout.radius.md,
    padding: 2,
  },
  viewToggleButton: {
    padding: Layout.spacing.sm,
    borderRadius: Layout.radius.sm,
  },
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: 120,
    flexGrow: 1,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    marginBottom: Layout.spacing.md,
  },
  listItem: {
    marginBottom: Layout.spacing.md,
  },
  loadingMore: {
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Layout.spacing.md,
  },
  skeletonListItem: {
    marginBottom: Layout.spacing.md,
  },
});
