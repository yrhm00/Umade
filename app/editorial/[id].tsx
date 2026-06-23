/**
 * Écran détail d'un article éditorial enrichi
 * Parallax header + bookmark + share + articles liés
 */

import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useArticleDetail, useEditorialArticles } from '@/hooks/useEditorialArticles';
import {
  useIsArticleBookmarked,
  useToggleArticleBookmark,
} from '@/hooks/useArticleBookmarks';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { EditorialArticle } from '@/types/editorial';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, BookOpen, Clock, Eye, Share2 } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';
import { toast } from '@/lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = 320;

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Some content rows in Supabase have literal "\n" sequences instead of
 * real newlines (e.g. imported from JSON). Convert them so markdown
 * heading and paragraph rules trigger as expected.
 */
function normalizeMarkdown(content: string | null | undefined): string {
  if (!content) return '';
  return content
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function ArticleDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: article, isLoading, error } = useArticleDetail(id);
  const isBookmarked = useIsArticleBookmarked(id || '');
  const { mutate: toggleBookmark } = useToggleArticleBookmark();

  // Parallax scroll
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const coverAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-COVER_HEIGHT, 0, COVER_HEIGHT],
          [-COVER_HEIGHT / 2, 0, COVER_HEIGHT * 0.4]
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-COVER_HEIGHT, 0],
          [2, 1],
          'clamp'
        ),
      },
    ],
  }));

  const headerOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [COVER_HEIGHT - 120, COVER_HEIGHT - 60],
      [0, 1],
      'clamp'
    ),
  }));

  // Articles liés (même catégorie)
  const { data: relatedData } = useEditorialArticles(article?.category || undefined);
  const relatedArticles = useMemo(() => {
    if (!relatedData || !article) return [];
    return relatedData.pages
      .flatMap((page) => page)
      .filter((a) => a.id !== article.id)
      .slice(0, 3);
  }, [relatedData, article]);

  const handleShare = useCallback(async () => {
    if (!article) return;
    try {
      await Share.share({
        title: article.title,
        message: `${article.title}\n\nLire sur Umade`,
      });
    } catch {
      // L'utilisateur a annulé le partage
    }
  }, [article]);

  const handleBookmark = useCallback(() => {
    if (!id) return;
    toggleBookmark(id);
    toast.success(isBookmarked ? 'Article retiré des favoris' : 'Article sauvegardé');
  }, [id, toggleBookmark, isBookmarked]);

  const handleRelatedPress = useCallback(
    (articleItem: EditorialArticle) => {
      router.push(`/editorial/${articleItem.id}` as any);
    },
    [router]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView bounces={false}>
          <Skeleton height={COVER_HEIGHT} width="100%" borderRadius={0} />
          <View style={{ padding: Layout.spacing.lg }}>
            <Skeleton height={12} width={80} borderRadius={Layout.radius.full} style={{ marginBottom: Layout.spacing.md }} />
            <Skeleton height={28} width="90%" style={{ marginBottom: Layout.spacing.sm }} />
            <Skeleton height={28} width="60%" style={{ marginBottom: Layout.spacing.lg }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm, marginBottom: Layout.spacing.xl }}>
              <Skeleton variant="circle" height={36} />
              <Skeleton height={14} width={100} />
              <Skeleton height={14} width={60} />
            </View>
            <Skeleton variant="text" lines={8} lineHeight={16} />
          </View>
        </ScrollView>
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10, backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.9)' }]}
          onPress={() => goBackOrFallback(router)}
          hitSlop={10}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  if (error || !article) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Article non trouvé
        </Text>
        <TouchableOpacity onPress={() => goBackOrFallback(router)}>
          <Text style={{ color: colors.primary, fontFamily: fontFamily.semiBold }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const publishedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr-BE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Parallax Cover Image */}
        <View style={styles.coverWrapper}>
          {article.cover_image_url ? (
            <Animated.Image
              source={{ uri: article.cover_image_url }}
              style={[styles.coverImage, coverAnimatedStyle]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.coverPlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
              <BookOpen size={48} color={colors.textTertiary} />
            </View>
          )}
        </View>

        {/* Content */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.content, { backgroundColor: colors.background }]}
        >
          {/* Category pill */}
          <View style={[styles.categoryPill, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.categoryPillText, { color: colors.primary }]}>
              {article.category}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>

          {/* Read time badge */}
          <View style={[styles.readTimeBadge, { backgroundColor: isDark ? colors.backgroundTertiary : '#F3F4F6' }]}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={[styles.readTimeText, { color: colors.textSecondary }]}>
              {estimateReadTime(article.content)} min de lecture
            </Text>
          </View>

          {/* Author & meta */}
          <View style={styles.metaRow}>
            {article.author_avatar_url ? (
              <Image
                source={{ uri: article.author_avatar_url }}
                style={styles.authorAvatar}
              />
            ) : (
              <View style={[styles.authorAvatar, { backgroundColor: colors.backgroundTertiary }]} />
            )}
            <View style={styles.metaInfo}>
              {article.author_name && (
                <Text style={[styles.authorName, { color: colors.text }]}>
                  {article.author_name}
                </Text>
              )}
              <View style={styles.metaDetails}>
                {publishedDate && (
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                    {publishedDate}
                  </Text>
                )}
                <View style={styles.metaDot} />
                <Eye size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {(article.view_count || 0) + 1} vues
                </Text>
              </View>
            </View>
          </View>

          {/* Separator */}
          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* Article body */}
          <Markdown
            style={{
              body: { ...styles.body, color: colors.textSecondary },
              heading1: { ...styles.h1Md, color: colors.text },
              heading2: { ...styles.h2Md, color: colors.text },
              heading3: { ...styles.h3Md, color: colors.text },
              paragraph: { ...styles.paragraphMd, color: colors.textSecondary },
              strong: { fontFamily: fontFamily.bold, color: colors.text },
              em: { fontFamily: fontFamily.medium, fontStyle: 'italic' },
              bullet_list: { marginVertical: 6 },
              ordered_list: { marginVertical: 6 },
              list_item: { marginVertical: 4 },
              link: { color: colors.primary, textDecorationLine: 'underline' },
              blockquote: {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.04)'
                  : 'rgba(17,24,39,0.04)',
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginVertical: 8,
              },
            }}
          >
            {normalizeMarkdown(article.content)}
          </Markdown>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {article.tags.map((tag, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: isDark ? colors.backgroundTertiary : '#F3F4F6' }]}
                >
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                    #{tag}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Related articles */}
          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
              <Text style={[styles.relatedTitle, { color: colors.text }]}>
                À lire aussi
              </Text>
              {relatedArticles.map((related) => (
                <PressableScale
                  key={related.id}
                  scale={0.98}
                  haptic="selection"
                  onPress={() => handleRelatedPress(related)}
                  style={[styles.relatedCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                >
                  {related.cover_image_url ? (
                    <Image
                      source={{ uri: related.cover_image_url }}
                      style={styles.relatedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.relatedImage, { backgroundColor: colors.backgroundTertiary }]} />
                  )}
                  <View style={styles.relatedContent}>
                    <Text style={[styles.relatedCategory, { color: colors.primary }]}>
                      {related.category}
                    </Text>
                    <Text style={[styles.relatedArticleTitle, { color: colors.text }]} numberOfLines={2}>
                      {related.title}
                    </Text>
                    <Text style={[styles.relatedMeta, { color: colors.textTertiary }]}>
                      {estimateReadTime(related.content)} min
                    </Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          )}

          {/* Bottom spacer for floating bar */}
          <View style={{ height: 100 }} />
        </Animated.View>
      </AnimatedScrollView>

      {/* Floating back button */}
      <TouchableOpacity
        style={[
          styles.backButton,
          {
            top: insets.top + 10,
            backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.9)',
          },
        ]}
        onPress={() => goBackOrFallback(router)}
        hitSlop={10}
      >
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>

      {/* Floating action bar — bookmark + share */}
      <View style={[styles.floatingBar, { backgroundColor: isDark ? colors.card : '#FFFFFF', bottom: insets.bottom + 16 }]}>
        <PressableScale
          scale={0.92}
          haptic="light"
          onPress={handleBookmark}
          style={styles.floatingBarButton}
        >
          <Bookmark
            size={22}
            color={isBookmarked ? colors.primary : colors.textSecondary}
            fill={isBookmarked ? colors.primary : 'transparent'}
          />
          <Text style={[styles.floatingBarLabel, { color: isBookmarked ? colors.primary : colors.textSecondary }]}>
            {isBookmarked ? 'Sauvegardé' : 'Sauvegarder'}
          </Text>
        </PressableScale>

        <View style={[styles.floatingBarDivider, { backgroundColor: colors.border }]} />

        <PressableScale
          scale={0.92}
          haptic="light"
          onPress={handleShare}
          style={styles.floatingBarButton}
        >
          <Share2 size={22} color={colors.textSecondary} />
          <Text style={[styles.floatingBarLabel, { color: colors.textSecondary }]}>
            Partager
          </Text>
        </PressableScale>
      </View>

      {/* Sticky header (appears on scroll) */}
      <Animated.View
        style={[
          styles.stickyHeader,
          headerOpacityStyle,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.stickyTitle, { color: colors.text }]} numberOfLines={1}>
          {article.title}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  coverWrapper: {
    height: COVER_HEIGHT,
    overflow: 'hidden',
  },
  coverImage: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
  },
  coverPlaceholder: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginTop: -Layout.radius.xl,
    borderTopLeftRadius: Layout.radius.xl,
    borderTopRightRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Layout.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: Layout.radius.full,
    marginBottom: Layout.spacing.md,
  },
  categoryPillText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.semiBold,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    lineHeight: 36,
    marginBottom: Layout.spacing.md,
  },
  readTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: 6,
    borderRadius: Layout.radius.full,
    marginBottom: Layout.spacing.lg,
  },
  readTimeText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.medium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  metaInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
    marginBottom: 2,
  },
  metaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.regular,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  separator: {
    height: 1,
    marginBottom: Layout.spacing.lg,
  },
  body: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.regular,
    lineHeight: 28,
    marginBottom: Layout.spacing.xl,
  },
  h1Md: {
    fontSize: 26,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.8,
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 32,
  },
  h2Md: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.6,
    marginTop: 18,
    marginBottom: 8,
    lineHeight: 28,
  },
  h3Md: {
    fontSize: 18,
    fontFamily: fontFamily.semiBold,
    letterSpacing: -0.4,
    marginTop: 14,
    marginBottom: 6,
    lineHeight: 24,
  },
  paragraphMd: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    lineHeight: 24,
    marginVertical: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.xl,
  },
  tag: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
  },
  tagText: {
    fontSize: Layout.fontSize.xs,
    fontFamily: fontFamily.medium,
  },
  relatedSection: {
    marginTop: Layout.spacing.md,
  },
  relatedTitle: {
    fontSize: Layout.fontSize.xl,
    fontFamily: fontFamily.bold,
    marginBottom: Layout.spacing.md,
  },
  relatedCard: {
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
  relatedImage: {
    width: 100,
    height: 90,
  },
  relatedContent: {
    flex: 1,
    padding: Layout.spacing.md,
    justifyContent: 'center',
  },
  relatedCategory: {
    fontSize: 11,
    fontFamily: fontFamily.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  relatedArticleTitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.semiBold,
    lineHeight: 20,
    marginBottom: 4,
  },
  relatedMeta: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
  },
  floatingBar: {
    position: 'absolute',
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radius.xl,
    paddingVertical: Layout.spacing.sm + 2,
    paddingHorizontal: Layout.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  floatingBarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  floatingBarLabel: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  floatingBarDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 4,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 60,
    paddingBottom: Layout.spacing.sm,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 50,
  },
  stickyTitle: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.semiBold,
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
    fontFamily: fontFamily.regular,
  },
  backButton: {
    position: 'absolute',
    left: Layout.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
