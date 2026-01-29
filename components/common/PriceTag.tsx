import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface PriceTagProps {
  price: number;
  currency?: string;
  period?: string;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function PriceTag({
  price,
  currency = '€',
  period,
  originalPrice,
  size = 'md',
  style,
}: PriceTagProps) {
  const hasDiscount = originalPrice && originalPrice > price;

  const formatPrice = (value: number) => {
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={[styles.container, style]}>
      {hasDiscount && (
        <Text style={[styles.originalPrice, styles[`originalPrice_${size}`]]}>
          {formatPrice(originalPrice)}{currency}
        </Text>
      )}
      <View style={styles.priceRow}>
        <Text style={[styles.price, styles[`price_${size}`]]}>
          {formatPrice(price)}{currency}
        </Text>
        {period && (
          <Text style={[styles.period, styles[`period_${size}`]]}>
            /{period}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontWeight: '700',
    color: Colors.text.primary,
  },
  price_sm: {
    fontSize: Layout.fontSize.md,
  },
  price_md: {
    fontSize: Layout.fontSize.xl,
  },
  price_lg: {
    fontSize: Layout.fontSize['2xl'],
  },
  period: {
    color: Colors.text.secondary,
    fontWeight: '400',
  },
  period_sm: {
    fontSize: Layout.fontSize.xs,
  },
  period_md: {
    fontSize: Layout.fontSize.sm,
  },
  period_lg: {
    fontSize: Layout.fontSize.md,
  },
  originalPrice: {
    color: Colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  originalPrice_sm: {
    fontSize: Layout.fontSize.xs,
  },
  originalPrice_md: {
    fontSize: Layout.fontSize.sm,
  },
  originalPrice_lg: {
    fontSize: Layout.fontSize.md,
  },
});
