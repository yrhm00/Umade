/**
 * SocialPostCard - Carte d'un post social
 * Avec images, likes, commentaires
 */

import { Avatar } from '@/components/ui/Avatar';
import { DoubleTapLike } from '@/components/ui/DoubleTapLike';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useColors } from '@/hooks/useColors';
import { useFollowingIds, useToggleFollow } from '@/hooks/useFollows';
import { SocialPostWithDetails } from '@/types/social';
import { fontFamily } from '@/constants/Typography';
import { Image } from 'expo-image';
import { router } from 'expo-router';

const DEFAULT_BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';
import {
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH;

interface SocialPostCardProps {
  post: SocialPostWithDetails;
  isLiked: boolean;
  onLike: (postId: string, isLiked: boolean) => void;
  onComment?: () => void;
}

export function SocialPostCard({
  post,
  isLiked,
  onLike,
  onComment,
}: SocialPostCardProps) {
  const colors = useColors();
  const { userId } = useAuth();
  const { data: followingIds } = useFollowingIds();
  const { mutate: toggleFollow } = useToggleFollow();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  const isOwnPost = post.user_id === userId;
  const isFollowing = followingIds?.has(post.user_id) || false;

  const handleFollowPress = useCallback(() => {
    toggleFollow({ targetUserId: post.user_id, isCurrentlyFollowing: isFollowing });
  }, [toggleFollow, post.user_id, isFollowing]);

  const images = post.social_post_images || [];
  const hasMultipleImages = images.length > 1;

  const handleDoubleTap = useCallback(() => {
    if (!isLiked) {
      onLike(post.id, false);
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 1000);
    }
  }, [isLiked, onLike, post.id]);

  const handleLikePress = useCallback(() => {
    onLike(post.id, isLiked);
  }, [onLike, post.id, isLiked]);

  const handleCommentPress = useCallback(() => {
    if (onComment) {
      onComment();
    } else {
      router.push(`/social/${post.id}` as any);
    }
  }, [onComment, post.id]);

  const handleSharePress = useCallback(async () => {
    try {
      await Share.share({
        message: post.content || 'Découvrez cet événement sur Umade !',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [post.content]);

  const handleProfilePress = useCallback(() => {
    router.push(`/user/${post.user_id}` as any);
  }, [post.user_id]);

  const handleImageScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  }, []);

  const timeAgo = getTimeAgo(post.created_at);

  return (
    <Animated.View
      entering={FadeIn}
      style={[styles.container, { backgroundColor: colors.card }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleProfilePress} style={styles.userInfo}>
          <Avatar
            source={post.profiles?.avatar_url}
            name={post.profiles?.full_name || 'Utilisateur'}
            size="md"
          />
          <View style={styles.userText}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {post.profiles?.full_name || 'Utilisateur'}
            </Text>
            {post.location && (
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textTertiary} />
                <Text style={[styles.location, { color: colors.textTertiary }]}>
                  {post.location}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {!isOwnPost && (
          <Pressable
            onPress={handleFollowPress}
            style={[
              styles.followButton,
              {
                backgroundColor: isFollowing ? 'transparent' : colors.primary,
                borderColor: isFollowing ? colors.border : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.followButtonText,
                { color: isFollowing ? colors.textSecondary : '#FFFFFF' },
              ]}
            >
              {isFollowing ? 'Suivi' : 'Suivre'}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.moreButton}
          onPress={() => router.push(`/social/${post.id}` as any)}
          accessibilityLabel="Options du post"
          accessibilityRole="button"
        >
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Images */}
      {images.length > 0 && (
        <DoubleTapLike onDoubleTap={handleDoubleTap}>
          <View style={styles.imageContainer}>
            <Animated.ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleImageScroll}
              scrollEventThrottle={16}
            >
              {images.map((image) => (
                <Image
                  key={image.id}
                  source={{ uri: image.image_url }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                  placeholder={{ blurhash: DEFAULT_BLURHASH }}
                />
              ))}
            </Animated.ScrollView>

            {/* Image pagination */}
            {hasMultipleImages && (
              <View style={styles.pagination}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Heart animation */}
            {showHeartAnimation && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.heartAnimation}
              >
                <Heart size={80} color={Colors.white} fill={Colors.error.DEFAULT} />
              </Animated.View>
            )}
          </View>
        </DoubleTapLike>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Pressable
            onPress={handleLikePress}
            style={styles.actionButton}
            accessibilityLabel={isLiked ? 'Retirer le like' : 'Liker ce post'}
            accessibilityRole="button"
            accessibilityState={{ selected: isLiked }}
          >
            <Heart
              size={24}
              color={isLiked ? Colors.error.DEFAULT : colors.text}
              fill={isLiked ? Colors.error.DEFAULT : 'transparent'}
            />
          </Pressable>
          <Pressable
            onPress={handleCommentPress}
            style={styles.actionButton}
            accessibilityLabel={`Voir les commentaires`}
            accessibilityRole="button"
          >
            <MessageCircle size={24} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={handleSharePress}
            style={styles.actionButton}
            accessibilityLabel="Partager ce post"
            accessibilityRole="button"
          >
            <Share2 size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Likes count */}
      {post.like_count > 0 && (
        <Text style={[styles.likesCount, { color: colors.text }]}>
          {post.like_count} {post.like_count === 1 ? "J'aime" : "J'aimes"}
        </Text>
      )}

      {/* Content */}
      {post.content && (
        <View style={styles.content}>
          <Text style={[styles.userName, { color: colors.text }]}>
            {post.profiles?.full_name}
          </Text>
          <Text style={[styles.contentText, { color: colors.text }]}>
            {' '}{post.content}
          </Text>
        </View>
      )}

      {/* Comments preview */}
      {post.comment_count > 0 && (
        <Pressable onPress={handleCommentPress}>
          <Text style={[styles.viewComments, { color: colors.textSecondary }]}>
            Voir les {post.comment_count} commentaires
          </Text>
        </Pressable>
      )}

      {/* Timestamp */}
      <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
        {timeAgo}
      </Text>
    </Animated.View>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userText: {
    marginLeft: Layout.spacing.sm,
  },
  userName: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
  },
  followButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: Layout.spacing.xs,
  },
  followButtonText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  moreButton: {
    padding: Layout.spacing.xs,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  pagination: {
    position: 'absolute',
    bottom: Layout.spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: Colors.white,
  },
  heartAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  leftActions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
  },
  actionButton: {
    padding: 4,
  },
  likesCount: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  viewComments: {
    fontSize: 14,
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.xs,
  },
  timestamp: {
    fontSize: 11,
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
    textTransform: 'uppercase',
  },
});
