/**
 * Écran liste des articles éditoriaux
 * Filtrage par catégorie + infinite scroll
 */

import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useEditorialArticles } from '@/hooks/useEditorialArticles';
import { EditorialArticle, EDITORIAL_CATEGORIES } from '@/types/editorial';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Clock, Eye } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

function estimateReadTime(content: string): number {
  return Math.max(1, Math.ceil(content.length / 1000));
}

interface ArticleCardProps {
  article: EditorialArticle;
  index: number;
  onPress: (article: EditorialArticle) => void;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}

function ArticleCard({ article, index, onPress, colors, isDark }: ArticleCardProps) {
  const cardBg = isDark ? colors.card : '#FFFFFF';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(260)}>
      <Pressable
        style={[styles.articleCard, { backgroundColor: cardBg }]}
        onPress={() => onPress(article)}
      >
        {article.cover_image_url ? (
          <Image
            source={{ uri: article.cover_image_url }}
            style={styles.articleImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.articleImagePlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
            <BookOpen size={32} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.articleContent}>
          <View style={[styles.categoryPill, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.categoryPillText, { color: colors.primary }]}>
              {article.category}
            </Text>
          </View>
          <Text style={[styles.articleTitle, { color: colors.text }]} numberOfLines={2}>
            {article.title}
          </Text>
          {article.excerpt && (
            <Text style={[styles.articleExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>
              {article.excerpt}
            </Text>
          )}
          <View style={styles.articleMeta}>
            {article.author_name && (
              <Text style={[styles.authorName, { color: colors.textTertiary }]}>
                {article.author_name}
              </Text>
            )}
            <View style={styles.metaRight}>
              <Clock size={12} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {estimateReadTime(article.content)} min
              </Text>
              <Eye size={12} color={colors.textTertiary} />
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {article.view_count || 0}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function EditorialListScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useEditorialArticles(selectedCategory);

  const articles = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data]
  );

  const handleArticlePress = useCallback(
    (article: EditorialArticle) => {
      router.push(`/editorial/${article.id}` as any);
    },
    [router]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item, index }: { item: EditorialArticle; index: number }) => (
      <ArticleCard
        article={item}
        index={index}
        onPress={handleArticlePress}
        colors={colors}
        isDark={isDark}
      />
    ),
    [handleArticlePress, colors, isDark]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOrFallback(router)} hitSlop={10}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Articles</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {EDITORIAL_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isActive ? colors.primary : isDark ? colors.card : '#F3F4F6',
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: isActive ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Articles list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Skeleton.List count={4} itemHeight={120} />
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<BookOpen size={36} color={colors.primary} />}
              title="Aucun article"
              description="Revenez bientôt pour découvrir nos conseils et tendances."
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <Skeleton height={120} borderRadius={Layout.radius.lg} />
              </View>
            ) : null
          }
        />
      )}
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
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
  },
  categoryList: {
    paddingHorizontal: Layout.spacing.lg,
    gap: Layout.spacing.sm,
    paddingBottom: Layout.spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: Layout.spacing.lg,
  },
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  articleCard: {
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    marginBottom: Layout.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  articleImage: {
    width: '100%',
    height: 180,
  },
  articleImagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleContent: {
    padding: Layout.spacing.md,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: Layout.radius.full,
    marginBottom: Layout.spacing.sm,
  },
  categoryPillText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
  articleTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: Layout.spacing.xs,
  },
  articleExcerpt: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
    marginBottom: Layout.spacing.sm,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Layout.fontSize.xs,
    marginRight: Layout.spacing.sm,
  },
  footerLoader: {
    padding: Layout.spacing.lg,
  },
});
