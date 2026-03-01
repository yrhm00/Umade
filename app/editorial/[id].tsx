/**
 * Écran détail d'un article éditorial
 * Cover image plein écran + contenu
 */

import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useArticleDetail } from '@/hooks/useEditorialArticles';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, Eye } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { goBackOrFallback } from '@/lib/navigation';

function estimateReadTime(content: string): number {
  return Math.max(1, Math.ceil(content.length / 1000));
}

export default function ArticleDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: article, isLoading, error } = useArticleDetail(id);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView bounces={false}>
          <Skeleton height={280} width="100%" borderRadius={0} />
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
        {/* Back button */}
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
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Retour</Text>
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
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Cover image */}
        {article.cover_image_url ? (
          <Image
            source={{ uri: article.cover_image_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: colors.backgroundTertiary }]} />
        )}

        {/* Content */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[styles.content, { backgroundColor: colors.background }]}
        >
          {/* Category */}
          <View style={[styles.categoryPill, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.categoryPillText, { color: colors.primary }]}>
              {article.category}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>

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
                <Clock size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {estimateReadTime(article.content)} min
                </Text>
                <View style={styles.metaDot} />
                <Eye size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                  {(article.view_count || 0) + 1}
                </Text>
              </View>
            </View>
          </View>

          {/* Separator */}
          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* Article body */}
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {article.content}
          </Text>

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

          {/* Bottom spacer */}
          <View style={{ height: Layout.spacing.xxl }} />
        </Animated.View>
      </ScrollView>

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
  coverImage: {
    width: '100%',
    height: 280,
  },
  coverPlaceholder: {
    width: '100%',
    height: 280,
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
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 3,
    borderRadius: Layout.radius.full,
    marginBottom: Layout.spacing.md,
  },
  categoryPillText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: Layout.fontSize['3xl'],
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: Layout.spacing.lg,
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
    fontWeight: '600',
    marginBottom: 2,
  },
  metaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Layout.fontSize.xs,
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
    lineHeight: 28,
    marginBottom: Layout.spacing.xl,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  tag: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
  },
  tagText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
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
