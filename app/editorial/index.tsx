/**
 * Écran liste des articles éditoriaux
 * Filtrage par catégorie + infinite scroll
 */

import { ClientHeader } from '@/components/client/ClientHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useEditorialArticles } from '@/hooks/useEditorialArticles';
import { useBookmarkedArticleIds, useToggleArticleBookmark } from '@/hooks/useArticleBookmarks';
import { EditorialArticle, EDITORIAL_CATEGORIES } from '@/types/editorial';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, BookOpen, Clock, Eye } from 'lucide-react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

function estimateReadTime(content: string): number {
  return Math.max(1, Math.ceil(content.length / 1000));
}

interface ArticleCardProps {
  article: EditorialArticle;
  index: number;
  onPress: (article: EditorialArticle) => void;
  onToggleBookmark: (articleId: string) => void;
  isBookmarked: boolean;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
  isHero?: boolean;
}

function ArticleCard({ article, index, onPress, onToggleBookmark, isBookmarked, colors, isDark, isHero }: ArticleCardProps) {
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
            style={[styles.articleImage, isHero && styles.heroImage]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.articleImagePlaceholder, { backgroundColor: colors.backgroundTertiary }, isHero && styles.heroImage]}>
            <BookOpen size={32} color={colors.textTertiary} />
          </View>
        )}
        {/* Bookmark button overlay */}
        <TouchableOpacity
          style={[styles.bookmarkOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)' }]}
          onPress={() => onToggleBookmark(article.id)}
          hitSlop={8}
        >
          <Bookmark
            size={18}
            color={isBookmarked ? colors.primary : colors.textTertiary}
            fill={isBookmarked ? colors.primary : 'transparent'}
          />
        </TouchableOpacity>
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

// Catégories avec "Pour vous" en premier
const CATEGORIES_WITH_POUR_VOUS = [
  { key: 'pour_vous', label: 'Pour vous' },
  ...EDITORIAL_CATEGORIES,
] as const;

export default function EditorialListScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('pour_vous');
  const eventType = useOnboardingStore((s) => s.eventType);

  // Pour la catégorie "Pour vous", on ne filtre pas par catégorie mais par event_types
  const queryCategory = selectedCategory === 'pour_vous' ? undefined : selectedCategory;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useEditorialArticles(queryCategory);

  const { data: bookmarkedIds } = useBookmarkedArticleIds();
  const { mutate: toggleBookmark } = useToggleArticleBookmark();

  const articles = useMemo(() => {
    const all = data?.pages.flatMap((page) => page) ?? [];
    // Pour "Pour vous", filtrer par event_type si disponible
    if (selectedCategory === 'pour_vous' && eventType) {
      return all.filter(
        (a) => a.event_types?.includes(eventType) || a.featured
      );
    }
    return all;
  }, [data, selectedCategory, eventType]);

  const handleArticlePress = useCallback(
    (article: EditorialArticle) => {
      router.push(`/editorial/${article.id}` as any);
    },
    [router]
  );

  const handleToggleBookmark = useCallback(
    (articleId: string) => {
      toggleBookmark(articleId);
    },
    [toggleBookmark]
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
        onToggleBookmark={handleToggleBookmark}
        isBookmarked={bookmarkedIds?.has(item.id) ?? false}
        colors={colors}
        isDark={isDark}
        isHero={index === 0 && selectedCategory === 'pour_vous'}
      />
    ),
    [handleArticlePress, handleToggleBookmark, bookmarkedIds, colors, isDark, selectedCategory]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundSecondary }]} edges={['top']}>
      <ClientHeader
        eyebrow="Conseils"
        title="Articles"
        subtitle="Des repères courts pour avancer sans te disperser."
        colors={colors}
        isDark={isDark}
        leadingIcon={ArrowLeft}
        leadingLabel="Retour"
        onLeading={() => goBackOrFallback(router)}
        actionIcon={Bookmark}
        actionLabel="Articles sauvegardés"
        onAction={() => router.push('/editorial/saved' as any)}
      />

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >
        {CATEGORIES_WITH_POUR_VOUS.map((cat) => {
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
  categoryList: {
    paddingLeft: Layout.spacing.lg,
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
    fontFamily: fontFamily.semiBold,
  },
  loadingContainer: {
    padding: Layout.spacing.lg,
  },
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  articleCard: {
    borderRadius: Layout.radius.sm,
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
  heroImage: {
    height: 240,
  },
  articleImagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkOverlay: {
    position: 'absolute',
    top: Layout.spacing.sm,
    right: Layout.spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
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
