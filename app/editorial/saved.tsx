/**
 * Écran des articles sauvegardés (bookmarks)
 */

import { EmptyState } from '@/components/common/EmptyState';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useArticleBookmarks, useToggleArticleBookmark } from '@/hooks/useArticleBookmarks';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { EditorialArticle } from '@/types/editorial';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, BookOpen, Clock, Trash2 } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';
import { toast } from '@/lib/toast';

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

interface SavedArticleCardProps {
  article: EditorialArticle;
  index: number;
  onPress: (article: EditorialArticle) => void;
  onRemove: (articleId: string) => void;
  colors: ReturnType<typeof useColors>;
  isDark: boolean;
}

function SavedArticleCard({ article, index, onPress, onRemove, colors, isDark }: SavedArticleCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(220)}>
      <PressableScale
        scale={0.98}
        haptic="selection"
        onPress={() => onPress(article)}
        style={[styles.card, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
      >
        {article.cover_image_url ? (
          <Image
            source={{ uri: article.cover_image_url }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, { backgroundColor: colors.backgroundTertiary, justifyContent: 'center', alignItems: 'center' }]}>
            <BookOpen size={24} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={[styles.cardCategory, { color: colors.primary }]}>
            {article.category}
          </Text>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {article.title}
          </Text>
          <View style={styles.cardMeta}>
            <Clock size={12} color={colors.textTertiary} />
            <Text style={[styles.cardMetaText, { color: colors.textTertiary }]}>
              {estimateReadTime(article.content)} min
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => onRemove(article.id)}
          hitSlop={10}
          style={styles.removeButton}
        >
          <Bookmark size={20} color={colors.primary} fill={colors.primary} />
        </TouchableOpacity>
      </PressableScale>
    </Animated.View>
  );
}

export default function SavedArticlesScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const { data: articles = [], isLoading, refetch, isRefetching } = useArticleBookmarks();
  const { mutate: toggleBookmark } = useToggleArticleBookmark();

  const handleArticlePress = useCallback(
    (article: EditorialArticle) => {
      router.push(`/editorial/${article.id}` as any);
    },
    [router]
  );

  const handleRemoveBookmark = useCallback(
    (articleId: string) => {
      toggleBookmark(articleId);
      toast.success('Article retiré des favoris');
    },
    [toggleBookmark]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: EditorialArticle; index: number }) => (
      <SavedArticleCard
        article={item}
        index={index}
        onPress={handleArticlePress}
        onRemove={handleRemoveBookmark}
        colors={colors}
        isDark={isDark}
      />
    ),
    [handleArticlePress, handleRemoveBookmark, colors, isDark]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOrFallback(router)} hitSlop={10}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Articles sauvegardés</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Skeleton.List count={5} itemHeight={100} />
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Bookmark size={36} color={colors.primary} />}
              title="Aucun article sauvegardé"
              description="Explorez nos conseils et tendances, et sauvegardez vos articles préférés !"
            />
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
    fontFamily: fontFamily.bold,
  },
  loadingContainer: {
    padding: Layout.spacing.lg,
  },
  listContent: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    marginBottom: Layout.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardImage: {
    width: 100,
    height: 100,
  },
  cardContent: {
    flex: 1,
    padding: Layout.spacing.md,
    justifyContent: 'center',
  },
  cardCategory: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
    lineHeight: 20,
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
  },
  removeButton: {
    padding: Layout.spacing.md,
    justifyContent: 'center',
  },
});
