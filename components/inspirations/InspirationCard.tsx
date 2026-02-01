/**
 * Carte d'inspiration pour le feed Pinterest-style (Phase 9)
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { Animations } from '@/constants/Animations';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  InspirationWithProvider,
} from '@/types/inspiration';
import {
  useInspirationFavoriteActions,
} from '@/hooks/useInspirationFavorites';

interface InspirationCardProps {
  inspiration: InspirationWithProvider;
  onPress?: () => void;
  style?: ViewStyle;
  index?: number;
}

const CARD_GAP = 8;
const CARD_WIDTH = (Layout.window.width - Layout.spacing.md * 2 - CARD_GAP) / 2;

export const InspirationCard = memo(function InspirationCard({
  inspiration,
  onPress,
  style,
  index = 0,
}: InspirationCardProps) {
  const { isFavorite, toggleFavorite, isLoading } = useInspirationFavoriteActions();
  const isInspFavorite = isFavorite(inspiration.id);

  // Premiere image
  const mainImage = inspiration.inspiration_images?.[0];

  // Calculer la hauteur basee sur le ratio d'image
  const aspectRatio = mainImage?.width && mainImage?.height
    ? mainImage.width / mainImage.height
    : 0.75;
  const imageHeight = CARD_WIDTH / aspectRatio;
  // Limiter la hauteur entre 120 et 280
  const clampedHeight = Math.max(120, Math.min(280, imageHeight));

  const handleFavoritePress = () => {
    if (!isLoading) {
      toggleFavorite(inspiration.id);
    }
  };

  const delay = (index % 10) * Animations.stagger.normal;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(15)}
      style={[styles.container, { width: CARD_WIDTH }, style]}
    >
      <PressableScale
        onPress={onPress}
        scale={Animations.scale.pressedSubtle}
        haptic="light"
        style={styles.card}
      >
        {/* Image principale avec titre en overlay */}
        <View style={[styles.imageContainer, { height: clampedHeight }]}>
          <Image
            source={{ uri: mainImage?.thumbnail_url || mainImage?.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            placeholder={Colors.gray[200]}
          />

          {/* Bouton favori */}
          <Pressable
            onPress={handleFavoritePress}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Animated.View entering={FadeIn.duration(200)}>
              <Heart
                size={18}
                color={isInspFavorite ? Colors.error.DEFAULT : Colors.white}
                fill={isInspFavorite ? Colors.error.DEFAULT : 'transparent'}
                strokeWidth={2}
              />
            </Animated.View>
          </Pressable>

          {/* Titre en overlay sur l'image */}
          {inspiration.title && (
            <Text style={styles.title} numberOfLines={1}>
              {inspiration.title}
            </Text>
          )}
        </View>
      </PressableScale>
    </Animated.View>
  );
});

// ============================================
// Skeleton pour le chargement
// ============================================

export function InspirationCardSkeleton({ index = 0 }: { index?: number }) {
  const height = 160 + (index % 3) * 40;
  const delay = (index % 10) * Animations.stagger.normal;

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(15)}
      style={[styles.container, { width: CARD_WIDTH }]}
    >
      <View style={[styles.card, styles.skeleton]}>
        <View style={[styles.skeletonImage, { height }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: CARD_GAP,
  },
  card: {
    borderRadius: Layout.radius.md,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: Layout.radius.md,
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    maxWidth: '85%',
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
  },
  // Skeleton styles
  skeleton: {
    backgroundColor: Colors.gray[100],
  },
  skeletonImage: {
    backgroundColor: Colors.gray[200],
    borderRadius: Layout.radius.md,
  },
});

export { CARD_WIDTH, CARD_GAP };
