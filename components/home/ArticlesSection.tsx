/**
 * Section articles éditoriaux sur l'écran Home
 * Affiche les articles mis en avant en scroll horizontal
 */

import { SectionHeader } from '@/components/common/SectionHeader';
import { Layout } from '@/constants/Layout';
import { useFeaturedArticles } from '@/hooks/useEditorialArticles';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArticleCardSmall } from './ArticleCardSmall';

export function ArticlesSection() {
  const router = useRouter();
  const { data: articles } = useFeaturedArticles(5);

  // Ne rien afficher s'il n'y a pas d'articles
  if (!articles || articles.length === 0) return null;

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(260)} style={styles.container}>
      <SectionHeader
        title="Conseils & Tendances"
        actionLabel="Voir tous"
        onAction={() => router.push('/editorial' as any)}
      />
      <FlatList
        data={articles.slice(0, 5)}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: Layout.spacing.md }} />}
        renderItem={({ item }) => <ArticleCardSmall article={item} />}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  listContent: {
    paddingLeft: Layout.spacing.lg,
  },
});
