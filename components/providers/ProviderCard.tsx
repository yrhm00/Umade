/**
 * Composant ProviderCard - Carte pour afficher un prestataire
 * Supporte deux modes: grid (compact) et list (horizontal)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MapPin, Star } from 'lucide-react-native';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { ProviderListItem } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Layout.spacing.lg * 2 - Layout.spacing.md) / 2;

interface ProviderCardProps {
  provider: ProviderListItem;
  variant?: 'grid' | 'list';
  onPress?: () => void;
  showFavorite?: boolean;
}

export function ProviderCard({
  provider,
  variant = 'grid',
  onPress,
  showFavorite = true,
}: ProviderCardProps) {
  const router = useRouter();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const { mutate: toggleFavorite, isPending: isFavoriteLoading } = useToggleFavorite();

  const isFavorite = favoriteIds.includes(provider.id);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/provider/${provider.id}`);
    }
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    if (!isFavoriteLoading) {
      toggleFavorite(provider.id);
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

  if (variant === 'list') {
    return (
      <TouchableOpacity
        style={styles.listContainer}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Image */}
        <View style={styles.listImageContainer}>
          {provider.portfolio_image ? (
            <Image
              source={{ uri: provider.portfolio_image }}
              style={styles.listImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.listImage, styles.placeholderImage]}>
              <Text style={styles.placeholderEmoji}>📸</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.businessName} numberOfLines={1}>
              {provider.business_name}
            </Text>
            {showFavorite && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavoritePress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={20}
                  color={isFavorite ? Colors.error.DEFAULT : Colors.gray[400]}
                  fill={isFavorite ? Colors.error.DEFAULT : 'transparent'}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {provider.category_name}
            </Text>
          </View>

          {provider.city && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={Colors.text.secondary} />
              <Text style={styles.locationText} numberOfLines={1}>
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
                <Text style={styles.ratingText}>
                  {provider.average_rating.toFixed(1)}
                </Text>
                {provider.review_count && provider.review_count > 0 && (
                  <Text style={styles.reviewCount}>
                    ({provider.review_count})
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.newBadge}>Nouveau</Text>
            )}

            {provider.min_price && (
              <Text style={styles.price}>
                Dès {formatPrice(provider.min_price)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Grid variant (default)
  return (
    <TouchableOpacity
      style={styles.gridContainer}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Image */}
      <View style={styles.gridImageContainer}>
        {provider.portfolio_image ? (
          <Image
            source={{ uri: provider.portfolio_image }}
            style={styles.gridImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.gridImage, styles.placeholderImage]}>
            <Text style={styles.placeholderEmoji}>📸</Text>
          </View>
        )}

        {/* Favorite button */}
        {showFavorite && (
          <TouchableOpacity
            style={styles.gridFavoriteButton}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={18}
              color={isFavorite ? Colors.error.DEFAULT : Colors.white}
              fill={isFavorite ? Colors.error.DEFAULT : 'transparent'}
            />
          </TouchableOpacity>
        )}

        {/* Rating badge */}
        {provider.average_rating && (
          <View style={styles.ratingBadge}>
            <Star
              size={12}
              color={Colors.warning.DEFAULT}
              fill={Colors.warning.DEFAULT}
            />
            <Text style={styles.ratingBadgeText}>
              {provider.average_rating.toFixed(1)}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.gridContent}>
        <Text style={styles.businessName} numberOfLines={1}>
          {provider.business_name}
        </Text>

        <Text style={styles.categoryName} numberOfLines={1}>
          {provider.category_name}
        </Text>

        {provider.city && (
          <View style={styles.locationRowSmall}>
            <MapPin size={12} color={Colors.text.tertiary} />
            <Text style={styles.locationTextSmall} numberOfLines={1}>
              {provider.city}
            </Text>
          </View>
        )}

        {provider.min_price && (
          <Text style={styles.priceSmall}>
            Dès {formatPrice(provider.min_price)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Grid variant
  gridContainer: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
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
  ratingBadge: {
    position: 'absolute',
    bottom: Layout.spacing.sm,
    left: Layout.spacing.sm,
    backgroundColor: Colors.white,
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
    color: Colors.text.primary,
  },
  gridContent: {
    padding: Layout.spacing.md,
    gap: 4,
  },

  // List variant
  listContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
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
    color: Colors.text.primary,
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingVertical: 2,
    paddingHorizontal: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
  },
  categoryText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
  categoryName: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.secondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  locationText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    flex: 1,
  },
  locationRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTextSmall: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
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
    color: Colors.text.primary,
  },
  reviewCount: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.secondary,
  },
  newBadge: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
  price: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  priceSmall: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
    marginTop: 4,
  },
  placeholderImage: {
    backgroundColor: Colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
});
