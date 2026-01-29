import React, { useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReviewCard, ProviderReviewStats } from '@/components/reviews';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  useProviderReviews,
  useProviderReviewStats,
} from '@/hooks/useReviews';
import { ReviewWithDetails } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

export default function ProviderReviewsScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useProviderReviews(providerId ?? '');

  const { data: stats, isLoading: isLoadingStats } = useProviderReviewStats(
    providerId ?? ''
  );

  // Flatten infinite query pages
  const reviews = useMemo(() => {
    return data?.pages.flat() ?? [];
  }, [data]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ReviewWithDetails }) => <ReviewCard review={item} />,
    []
  );

  const keyExtractor = useCallback(
    (item: ReviewWithDetails) => item.id,
    []
  );

  const ListHeader = useMemo(() => {
    if (!stats) return null;
    return <ProviderReviewStats stats={stats} />;
  }, [stats]);

  const ListFooter = useMemo(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={Colors.primary.DEFAULT} />
      </View>
    );
  }, [isFetchingNextPage]);

  const ListEmpty = useMemo(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        {/* Empty state handled by stats showing 0 */}
      </View>
    );
  }, [isLoading]);

  if (isLoading || isLoadingStats) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Avis clients',
            headerBackTitle: 'Retour',
          }}
        />
        <LoadingSpinner fullScreen message="Chargement des avis..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Avis clients',
          headerBackTitle: 'Retour',
        }}
      />
      <FlatList
        data={reviews}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary.DEFAULT}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
  },
  listContent: {
    padding: Layout.spacing.md,
  },
  loadingMore: {
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Layout.spacing.xl,
  },
});
