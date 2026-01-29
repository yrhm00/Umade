import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { ReviewStats } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface ProviderReviewStatsProps {
  stats: ReviewStats;
}

export function ProviderReviewStats({ stats }: ProviderReviewStatsProps) {
  const { average_rating, total_count, distribution } = stats;

  // Calculate percentages for distribution bars
  const getPercentage = (count: number) => {
    if (total_count === 0) return 0;
    return (count / total_count) * 100;
  };

  return (
    <View style={styles.container}>
      {/* Average Rating */}
      <View style={styles.averageSection}>
        <Text style={styles.averageValue}>
          {average_rating > 0 ? average_rating.toFixed(1) : '-'}
        </Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={20}
              color={
                star <= Math.round(average_rating)
                  ? Colors.warning.DEFAULT
                  : Colors.gray[300]
              }
              fill={
                star <= Math.round(average_rating)
                  ? Colors.warning.DEFAULT
                  : 'transparent'
              }
            />
          ))}
        </View>
        <Text style={styles.totalCount}>
          {total_count} {total_count === 1 ? 'avis' : 'avis'}
        </Text>
      </View>

      {/* Distribution Bars */}
      <View style={styles.distributionSection}>
        {([5, 4, 3, 2, 1] as const).map((rating) => (
          <View key={rating} style={styles.distributionRow}>
            <Text style={styles.ratingLabel}>{rating}</Text>
            <Star size={12} color={Colors.warning.DEFAULT} fill={Colors.warning.DEFAULT} />
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.barFill,
                  { width: `${getPercentage(distribution[rating])}%` },
                ]}
              />
            </View>
            <Text style={styles.countLabel}>{distribution[rating]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  averageSection: {
    alignItems: 'center',
    paddingRight: Layout.spacing.lg,
    borderRightWidth: 1,
    borderRightColor: Colors.gray[200],
    minWidth: 100,
  },
  averageValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: Layout.spacing.xs,
  },
  totalCount: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.xs,
  },
  distributionSection: {
    flex: 1,
    paddingLeft: Layout.spacing.lg,
    justifyContent: 'center',
    gap: Layout.spacing.xs,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  ratingLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    width: 12,
    textAlign: 'right',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.warning.DEFAULT,
    borderRadius: 4,
  },
  countLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
    width: 24,
    textAlign: 'right',
  },
});
