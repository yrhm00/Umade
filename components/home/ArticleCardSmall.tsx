/**
 * Card compacte pour un article éditorial (section Home)
 */

import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { EditorialArticle } from '@/types/editorial';
import { useRouter } from 'expo-router';
import { BookOpen, Clock } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface ArticleCardSmallProps {
  article: EditorialArticle;
}

export function ArticleCardSmall({ article }: ArticleCardSmallProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const readTime = Math.max(1, Math.ceil(article.content.length / 1000));

  return (
    <PressableScale
      scale={0.97}
      haptic="selection"
      onPress={() => router.push(`/editorial/${article.id}` as any)}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          shadowColor: isDark ? 'transparent' : '#000',
        },
      ]}
    >
      {article.cover_image_url ? (
        <Image
          source={{ uri: article.cover_image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.backgroundTertiary }]}>
          <BookOpen size={24} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.content}>
        <View style={[styles.categoryPill, { backgroundColor: `${colors.primary}15` }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]} numberOfLines={1}>
            {article.category}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {article.title}
        </Text>
        <View style={styles.metaRow}>
          <Clock size={11} color={colors.textTertiary} />
          <Text style={[styles.metaText, { color: colors.textTertiary }]}>
            {readTime} min
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 120,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Layout.spacing.sm,
    gap: 4,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Layout.radius.full,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  title: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10,
  },
});
