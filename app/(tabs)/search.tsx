/**
 * Ecran Recherche - Combine l'accueil et la recherche de prestataires
 */

import { CategoryPill } from '@/components/common/CategoryPill';
import { EmptyState } from '@/components/common/EmptyState';
import { FiltersBottomSheet } from '@/components/providers/FiltersBottomSheet';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { Avatar } from '@/components/ui/Avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useSearchProviders, useTopProviders } from '@/hooks/useProviders';
import { debounce } from '@/lib/utils';
import { useSearchStore } from '@/stores/searchStore';
import { ProviderFilters, ProviderListItem } from '@/types';
import BottomSheet from '@gorhom/bottom-sheet';
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const filtersSheetRef = useRef<BottomSheet>(null);
  const { profile } = useAuth();

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

  // Initialiser la catégorie depuis les params URL
  useEffect(() => {
    if (params.category && params.category !== filters.categorySlug) {
      setCategory(params.category);
      setIsSearchMode(true);
    }
  }, [params.category]);

  // Activer le mode recherche si des filtres sont actifs
  useEffect(() => {
    if (filters.categorySlug || filters.searchQuery) {
      setIsSearchMode(true);
    }
  }, [filters]);

  // Recherche avec les filtres actuels
  const {
    data,
    isLoading: searchLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSearchProviders(filters);

  // Debounce la recherche texte
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

  const handleSearchFocus = () => {
    setIsSearchMode(true);
  };

  const handleBackToHome = () => {
    setIsSearchMode(false);
    resetFilters();
    setSearchText('');
  };

  const handleOpenFilters = () => {
    filtersSheetRef.current?.expand();
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

  // Flatten des pages pour FlatList
  const providers = data?.pages.flatMap((page) => page) || [];

  // Nombre de filtres actifs (hors recherche texte)
  const activeFiltersCount = [
    filters.categorySlug,
    filters.city,
    filters.minRating,
    filters.maxPrice,
  ].filter(Boolean).length;

  const renderProvider = ({ item }: { item: ProviderListItem }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <ProviderCard provider={item} variant={viewMode} />
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (searchLoading) return null;
    return (
      <EmptyState
        icon="🔍"
        title="Aucun résultat"
        description="Essayez de modifier vos critères de recherche"
        actionLabel="Réinitialiser les filtres"
        onAction={handleResetFilters}
      />
    );
  };

  // Mode recherche - affiche les résultats
  if (isSearchMode) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
              <X size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.title}>Recherche</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <SearchIcon size={20} color={Colors.gray[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un prestataire..."
                placeholderTextColor={Colors.gray[400]}
                value={searchText}
                onChangeText={handleSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch}>
                  <X size={20} color={Colors.gray[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filters button */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFiltersCount > 0 && styles.filterButtonActive,
              ]}
              onPress={handleOpenFilters}
            >
              <SlidersHorizontal
                size={20}
                color={
                  activeFiltersCount > 0 ? Colors.white : Colors.primary.DEFAULT
                }
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
            <Text style={styles.resultsCount}>
              {providers.length} résultat{providers.length > 1 ? 's' : ''}
            </Text>
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  viewMode === 'grid' && styles.viewToggleButtonActive,
                ]}
                onPress={() => setViewMode('grid')}
              >
                <Grid
                  size={18}
                  color={
                    viewMode === 'grid'
                      ? Colors.primary.DEFAULT
                      : Colors.gray[400]
                  }
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewToggleButton,
                  viewMode === 'list' && styles.viewToggleButtonActive,
                ]}
                onPress={() => setViewMode('list')}
              >
                <List
                  size={18}
                  color={
                    viewMode === 'list'
                      ? Colors.primary.DEFAULT
                      : Colors.gray[400]
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Results */}
          {searchLoading ? (
            <LoadingSpinner fullScreen message="Recherche en cours..." />
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

          {/* Filters Bottom Sheet */}
          <FiltersBottomSheet
            ref={filtersSheetRef}
            filters={filters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // Mode accueil - affiche les catégories et top prestataires
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary.DEFAULT}
            />
          }
        >
          {/* Header */}
          <View style={styles.homeHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting()}</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push('/notifications/index')}
              >
                <Bell size={24} color={Colors.text.primary} />
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
            style={styles.searchBarHome}
            onPress={handleSearchFocus}
            activeOpacity={0.7}
          >
            <SearchIcon size={20} color={Colors.gray[400]} />
            <Text style={styles.searchPlaceholder}>
              Rechercher un prestataire...
            </Text>
          </TouchableOpacity>

          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Catégories</Text>

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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleNoMargin}>Top prestataires</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => setIsSearchMode(true)}
              >
                <Text style={styles.seeAllText}>Voir tout</Text>
                <ChevronRight size={16} color={Colors.primary.DEFAULT} />
              </TouchableOpacity>
            </View>

            {topProviders && topProviders.length > 0 ? (
              <FlatList
                data={topProviders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ProviderCard provider={item} variant="grid" />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.providersContainer}
                ItemSeparatorComponent={() => (
                  <View style={styles.providerSeparator} />
                )}
              />
            ) : (
              <View style={styles.emptyProviders}>
                <Text style={styles.emptyText}>
                  Aucun prestataire disponible pour le moment
                </Text>
              </View>
            )}
          </View>

          {/* Categories Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explorer par catégorie</Text>

            <View style={styles.categoryGrid}>
              {categories?.slice(0, 6).map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryGridItem}
                  onPress={() => handleCategoryPress(category.slug)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.categoryGridIcon}>
                    {category.icon || '📌'}
                  </Text>
                  <Text style={styles.categoryGridName} numberOfLines={2}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Filters Bottom Sheet */}
        <FiltersBottomSheet
          ref={filtersSheetRef}
          filters={filters}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },

  // Home header
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
    color: Colors.text.secondary,
  },
  userName: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
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
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    height: 48,
    gap: Layout.spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchBarHome: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Layout.spacing.lg,
    marginVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.gray[400],
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: Layout.radius.lg,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },

  // Sections
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
    fontWeight: '600',
    color: Colors.text.primary,
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  sectionTitleNoMargin: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  seeAllText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },

  // Categories
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

  // Providers
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
    color: Colors.text.secondary,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  categoryGridItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    shadowColor: Colors.black,
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
    fontWeight: '500',
    color: Colors.text.primary,
    textAlign: 'center',
  },

  // Results
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  resultsCount: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.md,
    padding: 2,
  },
  viewToggleButton: {
    padding: Layout.spacing.sm,
    borderRadius: Layout.radius.sm,
  },
  viewToggleButtonActive: {
    backgroundColor: Colors.primary[50],
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
});
