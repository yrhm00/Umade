/**
 * Composant ProviderCard - Carte pour afficher un prestataire
 * Supporte deux modes: grid (compact) et list (horizontal)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Camera, Heart, MapPin, Scale, Star } from 'lucide-react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { useToast } from '@/components/ui/Toast';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { ProviderListItem } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useCompareStore } from '@/stores/compareStore';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = (width - Layout.spacing.lg * 2 - Layout.spacing.md) / 2;

interface ProviderCardProps {
  provider: ProviderListItem;
  variant?: 'grid' | 'list';
  onPress?: () => void;
  showFavorite?: boolean;
  index?: number;
}

export function ProviderCard({
  provider,
  variant = 'grid',
  onPress,
  showFavorite = true,
  index = 0,
}: ProviderCardProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const { mutate: toggleFavorite, isPending: isFavoriteLoading } = useToggleFavorite();
  const compareIds = useCompareStore((state) => state.compareIds);
  const addToCompare = useCompareStore((state) => state.addToCompare);
  const removeFromCompare = useCompareStore((state) => state.removeFromCompare);
  const { warning, ToastComponent } = useToast();

  const isFavorite = favoriteIds.includes(provider.id);
  const isCompared = compareIds.includes(provider.id);
  const cardBackground = isDark ? colors.card : Colors.white;
  const cardBorderColor = isDark ? colors.cardBorder : Colors.gray[200];
  const secondaryTextColor = colors.textSecondary;
  const tertiaryTextColor = colors.textTertiary;
  const categoryBadgeBg = isDark ? `${colors.primary}22` : Colors.primary[50];
  const categoryTextColor = isDark ? colors.primaryLight : Colors.primary.DEFAULT;
  const ratingBadgeBg = isDark ? 'rgba(13,11,18,0.88)' : Colors.white;
  const favoriteInactiveColor = isDark ? colors.textTertiary : Colors.gray[400];

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/provider/${provider.id}`);
    }
  };

  const handleFavoritePress = () => {
    if (!isFavoriteLoading) {
      toggleFavorite(provider.id);
    }
  };

  const handleComparePress = () => {
    if (isCompared) {
      removeFromCompare(provider.id);
      return;
    }

    const result = addToCompare(provider.id);
    if (!result.ok && result.reason === 'limit') {
      warning('Maximum 3 prestataires', {
        message: 'Retire un prestataire avant d’en ajouter un nouveau.',
      });
    }
  };

  // Format du prix
  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat('fr-BE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderPlaceholder = (style: any) => (
    <LinearGradient
      colors={isDark ? [colors.backgroundTertiary, colors.backgroundSecondary] : [Colors.gray[200], Colors.gray[100]]}
      style={[style, styles.placeholderImage]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Camera size={24} color={colors.textTertiary} />
    </LinearGradient>
  );

  if (variant === 'list') {
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(260)}>
        <PressableScale
          scale={0.97}
          haptic="light"
          onPress={handlePress}
          style={[
            styles.listContainer,
            { backgroundColor: cardBackground, borderColor: cardBorderColor, borderWidth: 1 },
          ]}
        >
          {/* Image */}
          <View style={styles.listImageContainer}>
            {provider.portfolio_image ? (
              <Image
                source={{ uri: provider.portfolio_image }}
                style={styles.listImage}
                contentFit="cover"
                transition={300}
              />
            ) : (
              renderPlaceholder(styles.listImage)
            )}
          </View>

          {/* Content */}
          <View style={styles.listContent}>
            <View style={styles.listHeader}>
              <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
                {provider.business_name}
              </Text>
              <View style={styles.trailingActions}>
                <PressableScale
                  scale={0.9}
                  haptic="selection"
                  onPress={handleComparePress}
                  style={[
                    styles.compareButton,
                    isCompared && { backgroundColor: `${colors.primary}1F`, borderColor: colors.primary },
                  ]}
                >
                  <Scale size={17} color={isCompared ? colors.primary : colors.textTertiary} />
                </PressableScale>
                {showFavorite && (
                  <PressableScale
                    scale={0.85}
                    haptic="selection"
                    onPress={handleFavoritePress}
                    style={styles.favoriteButton}
                  >
                    <Heart
                      size={20}
                      color={isFavorite ? Colors.error.DEFAULT : favoriteInactiveColor}
                      fill={isFavorite ? Colors.error.DEFAULT : 'transparent'}
                    />
                  </PressableScale>
                )}
              </View>
            </View>

            <View style={[styles.categoryBadge, { backgroundColor: categoryBadgeBg }]}>
              <Text style={[styles.categoryText, { color: categoryTextColor }]} numberOfLines={1}>
                {provider.category_name}
              </Text>
            </View>

            {provider.city && (
              <View style={styles.locationRow}>
                <MapPin size={14} color={tertiaryTextColor} />
                <Text style={[styles.locationText, { color: secondaryTextColor }]} numberOfLines={1}>
                  {provider.city}
                </Text>
              </View>
            )}

            <View style={styles.listFooter}>
              {provider.average_rating ? (
                <View style={styles.ratingContainer}>
                  <Star
                    size={14}
                    color={Colors.warning.DEFAULT}
                    fill={Colors.warning.DEFAULT}
                  />
                  <Text style={[styles.ratingText, { color: colors.text }]}>
                    {provider.average_rating.toFixed(1)}
                  </Text>
                  {provider.review_count && provider.review_count > 0 && (
                    <Text style={[styles.reviewCount, { color: tertiaryTextColor }]}>
                      ({provider.review_count})
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.newBadge, { color: colors.primary }]}>Nouveau</Text>
              )}

              {provider.min_price && (
                <Text style={[styles.price, { color: colors.primary }]}>
                  Dès {formatPrice(provider.min_price)}
                </Text>
              )}
            </View>
          </View>
        </PressableScale>
        <ToastComponent />
      </Animated.View>
    );
  }

  // Grid variant (default)
  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(260)}>
      <PressableScale
        scale={0.97}
        haptic="light"
        onPress={handlePress}
        style={[
          styles.gridContainer,
          { backgroundColor: cardBackground, borderColor: cardBorderColor, borderWidth: 1 },
        ]}
      >
        {/* Image */}
        <View style={styles.gridImageContainer}>
          {provider.portfolio_image ? (
            <Image
              source={{ uri: provider.portfolio_image }}
              style={styles.gridImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            renderPlaceholder(styles.gridImage)
          )}

          <PressableScale
            scale={0.85}
            haptic="selection"
            onPress={handleComparePress}
            style={[
              styles.gridCompareButton,
              isCompared && { backgroundColor: `${colors.primary}95` },
            ]}
          >
            <Scale size={15} color={Colors.white} />
          </PressableScale>

          {/* Favorite button */}
          {showFavorite && (
            <PressableScale
              scale={0.85}
              haptic="selection"
              onPress={handleFavoritePress}
              style={styles.gridFavoriteButton}
            >
              <Heart
                size={18}
                color={isFavorite ? Colors.error.DEFAULT : Colors.white}
                fill={isFavorite ? Colors.error.DEFAULT : 'transparent'}
              />
            </PressableScale>
          )}

          {/* Rating badge */}
          {provider.average_rating && (
            <View style={[styles.ratingBadge, { backgroundColor: ratingBadgeBg }]}>
              <Star
                size={12}
                color={Colors.warning.DEFAULT}
                fill={Colors.warning.DEFAULT}
              />
              <Text style={[styles.ratingBadgeText, { color: colors.text }]}>
                {provider.average_rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.gridContent}>
          <Text style={[styles.businessName, { color: colors.text }]} numberOfLines={1}>
            {provider.business_name}
          </Text>

          <Text style={[styles.categoryName, { color: secondaryTextColor }]} numberOfLines={1}>
            {provider.category_name}
          </Text>

          {provider.city && (
            <View style={styles.locationRowSmall}>
              <MapPin size={12} color={tertiaryTextColor} />
              <Text style={[styles.locationTextSmall, { color: tertiaryTextColor }]} numberOfLines={1}>
                {provider.city}
              </Text>
            </View>
          )}

          {provider.min_price && (
            <Text style={[styles.priceSmall, { color: colors.primary }]}>
              Dès {formatPrice(provider.min_price)}
            </Text>
          )}
        </View>
      </PressableScale>
      <ToastComponent />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Grid variant
  gridContainer: {
    width: CARD_WIDTH,
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gridImageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: CARD_WIDTH * 0.8,
  },
  gridFavoriteButton: {
    position: 'absolute',
    top: Layout.spacing.sm,
    right: Layout.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCompareButton: {
    position: 'absolute',
    top: Layout.spacing.sm,
    left: Layout.spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: Layout.spacing.sm,
    left: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
  gridContent: {
    padding: Layout.spacing.md,
    gap: 4,
  },

  // List variant
  listContainer: {
    flexDirection: 'row',
    borderRadius: Layout.radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  listImageContainer: {
    width: 120,
  },
  listImage: {
    width: '100%',
    height: 120,
  },
  listContent: {
    flex: 1,
    padding: Layout.spacing.md,
    gap: 6,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trailingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  compareButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    padding: Layout.spacing.xs,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },

  // Shared styles
  businessName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
  },
  categoryText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
  },
  categoryName: {
    fontSize: Layout.fontSize.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  locationText: {
    fontSize: Layout.fontSize.sm,
    flex: 1,
  },
  locationRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTextSmall: {
    fontSize: Layout.fontSize.xs,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: Layout.fontSize.xs,
  },
  newBadge: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
  },
  price: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  priceSmall: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    marginTop: 4,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
