import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
  style?: ViewStyle;
}

export function RatingStars({
  rating,
  maxRating = 5,
  size = 16,
  showValue = true,
  reviewCount,
  style,
}: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            size={size}
            color={Colors.warning.DEFAULT}
            fill={Colors.warning.DEFAULT}
          />
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <View style={{ position: 'relative' }}>
            <Star size={size} color={Colors.gray[300]} />
            <View style={styles.halfStarOverlay}>
              <Star
                size={size}
                color={Colors.warning.DEFAULT}
                fill={Colors.warning.DEFAULT}
              />
            </View>
          </View>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} size={size} color={Colors.gray[300]} />
        ))}
      </View>

      {showValue && (
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      )}

      {reviewCount !== undefined && (
        <Text style={styles.reviewCount}>({reviewCount})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  halfStarOverlay: {
    position: 'absolute',
    overflow: 'hidden',
    width: '50%',
  },
  ratingText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  reviewCount: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
  },
});
