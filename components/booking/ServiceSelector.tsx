/**
 * Service Selector Component
 * Dark Mode Support
 */

import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { formatPrice } from '@/lib/utils';
import { Service } from '@/types';
import { Check, Clock } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ServiceSelectorProps {
  services: Service[];
  selectedId: string | null;
  onSelect: (service: Service) => void;
}

export function ServiceSelector({
  services,
  selectedId,
  onSelect,
}: ServiceSelectorProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  return (
    <View style={styles.container}>
      {services.map((service) => {
        const isSelected = selectedId === service.id;

        const cardBg = isSelected
          ? (isDark ? colors.backgroundTertiary : Colors.primary[50])
          : colors.card;

        const cardBorder = isSelected
          ? colors.primary
          : colors.border;

        return (
          <TouchableOpacity
            key={service.id}
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
            onPress={() => onSelect(service)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.info}>
                <Text
                  style={[
                    styles.name,
                    { color: colors.text },
                    isSelected && { color: colors.primary },
                  ]}
                >
                  {service.name}
                </Text>
                {service.description && (
                  <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                    {service.description}
                  </Text>
                )}
                {service.duration_minutes != null && (
                  <View style={styles.durationRow}>
                    <Clock size={14} color={colors.textTertiary} />
                    <Text style={[styles.durationText, { color: colors.textTertiary }]}>
                      {service.duration_minutes} min
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.priceAndCheck}>
                <Text
                  style={[
                    styles.price,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {formatPrice(service.price)}
                </Text>
                {isSelected && (
                  <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                    <Check size={16} color={Colors.white} />
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Layout.spacing.sm,
  },
  card: {
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    padding: Layout.spacing.md,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: Layout.spacing.md,
  },
  name: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  description: {
    fontSize: Layout.fontSize.sm,
    marginBottom: Layout.spacing.xs,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  durationText: {
    fontSize: Layout.fontSize.xs,
  },
  priceAndCheck: {
    alignItems: 'flex-end',
    gap: Layout.spacing.sm,
  },
  price: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
