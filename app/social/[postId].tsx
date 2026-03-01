/**
 * Écran de détail d'un post social
 */

import { CommentSection, SocialPostCard } from '@/components/social';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { useSocialPost, useSocialPostLike, useSocialPostLikeIds } from '@/hooks/useSocialFeed';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { goBackOrFallback } from '@/lib/navigation';

export default function SocialPostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const colors = useColors();

  const { data: post, isLoading } = useSocialPost(postId);
  const { data: likedIds } = useSocialPostLikeIds();
  const { mutate: toggleLike } = useSocialPostLike();

  const isLiked = likedIds?.has(postId || '') || false;

  const handleLike = useCallback(
    (id: string, currentlyLiked: boolean) => {
      toggleLike({ postId: id, isLiked: currentlyLiked });
    },
    [toggleLike]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Publication</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
            Publication introuvable
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => goBackOrFallback(router)} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Publication</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView style={styles.postContainer}>
          <SocialPostCard
            post={post}
            isLiked={isLiked}
            onLike={handleLike}
          />
        </ScrollView>

        {/* Comments */}
        <View style={styles.commentsContainer}>
          <CommentSection postId={postId!} />
        </View>
      </View>
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
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  postContainer: {
    maxHeight: '50%',
  },
  commentsContainer: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
  },
});
