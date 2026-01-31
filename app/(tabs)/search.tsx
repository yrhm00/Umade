import { CategoryPill } from '@/components/common/CategoryPill';
import { EmptyState } from '@/components/common/EmptyState';
import { FiltersBottomSheet } from '@/components/providers/FiltersBottomSheet';
import { ProviderCard } from '@/components/providers/ProviderCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Colors } from '@/constants/Colors';
import { Config } from '@/constants/Config';
import { Layout } from '@/constants/Layout';
import { useCategories } from '@/hooks/useCategories';
import { useSearchProviders } from '@/hooks/useProviders';
import { debounce } from '@/lib/utils';
import { useSearchStore } from '@/stores/searchStore';
import { ProviderFilters, ProviderListItem } from '@/types';
import BottomSheet from '@gorhom/bottom-sheet';
import { useLocalSearchParams } from 'expo-router';
import {
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const filtersSheetRef = useRef<BottomSheet>(null);

  const {
    filters,
    viewMode,
    setFilters,
    resetFilters,
    setSearchQuery,
    setCategory,
    setViewMode,
  } = useSearchStore();

  const { data: categories } = useCategories();

  const [searchText, setSearchText] = useState(filters.searchQuery || '');

  // Initialiser la catégorie depuis les params URL
  useEffect(() => {
    if (params.category && params.category !== filters.categorySlug) {
      setCategory(params.category);
    }
  }, [params.category]);

  // Recherche avec les filtres actuels
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSearchProviders(filters);

  // Debounce la recherche texte
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
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

  const handleOpenFilters = () => {
    filtersSheetRef.current?.expand();
  };

  const handleApplyFilters = (newFilters: ProviderFilters) => {
    setFilters(newFilters);
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
    setCategory(filters.categorySlug === slug ? undefined : slug);
  };

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
    if (isLoading) return null;
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

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Recherche</Text>
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
                onPress={() =>
                  handleCategoryPress(item.slug === '' ? '' : item.slug)
                }
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
        {isLoading ? (
          <LoadingSpinner fullScreen message="Recherche en cours..." />
        ) : (
          <FlatList
            data={providers}
            keyExtractor={(item) => item.id}
            renderItem={renderProvider}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode} // Force re-render on view mode change
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize['2xl'],
    fontWeight: '700',
    color: Colors.text.primary,
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
  searchInput: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
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
  quickFilters: {
    marginTop: Layout.spacing.md,
  },
  quickFiltersList: {
    paddingHorizontal: Layout.spacing.lg,
  },
  categoryGap: {
    width: Layout.spacing.sm,
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
