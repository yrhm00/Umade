/**
 * Grille Masonry style Pinterest pour les inspirations (Phase 9)
 * Dark Mode Support
 */

import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { InspirationWithProvider } from '@/types/inspiration';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  CARD_GAP,
  InspirationCard,
  InspirationCardSkeleton,
} from './InspirationCard';

interface MasonryGridProps {
  data: InspirationWithProvider[];
  onItemPress?: (inspiration: InspirationWithProvider) => void;
  onEndReached?: () => void;
  onRefresh?: () => Promise<void>;
  onScroll?: (scrollY: number) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  isRefreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
}

export function MasonryGrid({
  data,
  onItemPress,
  onEndReached,
  onRefresh,
  onScroll: onScrollProp,
  isLoading = false,
  isLoadingMore = false,
  isRefreshing = false,
  ListHeaderComponent,
  ListEmptyComponent,
}: MasonryGridProps) {
  const colors = useColors();

  // Diviser les items en 2 colonnes avec equilibrage par hauteur estimee
  const { leftColumn, rightColumn } = useMemo(() => {
    const left: InspirationWithProvider[] = [];
    const right: InspirationWithProvider[] = [];
    let leftHeight = 0;
    let rightHeight = 0;

    data.forEach((item) => {
      // Estimer la hauteur basee sur l'aspect ratio de la premiere image
      const mainImage = item.inspiration_images?.[0];
      const aspectRatio =
        mainImage?.width && mainImage?.height
          ? mainImage.width / mainImage.height
          : 0.75;
      const estimatedHeight = 150 / aspectRatio + 8; // 8 pour le gap

      if (leftHeight <= rightHeight) {
        left.push(item);
        leftHeight += estimatedHeight;
      } else {
        right.push(item);
        rightHeight += estimatedHeight;
      }
    });

    return { leftColumn: left, rightColumn: right };
  }, [data]);

  const handleScroll = useCallback(
    (event: { nativeEvent: { layoutMeasurement: { height: number }; contentOffset: { y: number }; contentSize: { height: number } } }) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 200;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;

      if (isCloseToBottom && onEndReached && !isLoadingMore) {
        onEndReached();
      }

      // Report scroll position to parent
      onScrollProp?.(contentOffset.y);
    },
    [onEndReached, isLoadingMore, onScrollProp]
  );

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefresh]);

  // Loading state
  if (isLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {ListHeaderComponent}
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            {[0, 2, 4, 6].map((i) => (
              <InspirationCardSkeleton key={`left-${i}`} index={i} />
            ))}
          </View>
          <View style={styles.column}>
            {[1, 3, 5, 7].map((i) => (
              <InspirationCardSkeleton key={`right-${i}`} index={i} />
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  // Empty state
  if (data.length === 0 && ListEmptyComponent) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {ListHeaderComponent}
        {ListEmptyComponent}
      </ScrollView>
    );
  }

  return (
    <Animated.ScrollView
      entering={FadeIn.duration(300)}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {ListHeaderComponent}

      <View style={styles.columnsContainer}>
        {/* Colonne gauche */}
        <View style={styles.column}>
          {leftColumn.map((item, index) => (
            <InspirationCard
              key={item.id}
              inspiration={item}
              index={index * 2}
              onPress={() => onItemPress?.(item)}
            />
          ))}
        </View>

        {/* Colonne droite */}
        <View style={styles.column}>
          {rightColumn.map((item, index) => (
            <InspirationCard
              key={item.id}
              inspiration={item}
              index={index * 2 + 1}
              onPress={() => onItemPress?.(item)}
            />
          ))}
        </View>
      </View>

      {/* Loading more indicator */}
      {isLoadingMore && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Layout.spacing.md,
    paddingTop: Layout.spacing.xs,
  },
  emptyContainer: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.md,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  column: {
    flex: 1,
  },
  loadingMore: {
    paddingVertical: Layout.spacing.lg,
    alignItems: 'center',
  },
  bottomPadding: {
    height: Layout.tabBarHeight + Layout.spacing.xl,
  },
});
