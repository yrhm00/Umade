import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Clock } from 'lucide-react-native';
import { Service } from '@/types';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { formatPrice } from '@/lib/utils';

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
  return (
    <View style={styles.container}>
      {services.map((service) => {
        const isSelected = selectedId === service.id;

        return (
          <TouchableOpacity
            key={service.id}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelect(service)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <View style={styles.info}>
                <Text style={[styles.name, isSelected && styles.nameSelected]}>
                  {service.name}
                </Text>
                {service.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {service.description}
                  </Text>
                )}
                {service.duration_minutes != null && (
                  <View style={styles.durationRow}>
                    <Clock size={14} color={Colors.text.tertiary} />
                    <Text style={styles.durationText}>
                      {service.duration_minutes} min
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.priceAndCheck}>
                <Text
                  style={[styles.price, isSelected && styles.priceSelected]}
                >
                  {formatPrice(service.price)}
                </Text>
                {isSelected && (
                  <View style={styles.checkCircle}>
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
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    padding: Layout.spacing.md,
  },
  cardSelected: {
    borderColor: Colors.primary.DEFAULT,
    backgroundColor: Colors.primary[50],
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
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  nameSelected: {
    color: Colors.primary.DEFAULT,
  },
  description: {
    fontSize: Layout.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.xs,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  durationText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
  },
  priceAndCheck: {
    alignItems: 'flex-end',
    gap: Layout.spacing.sm,
  },
  price: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary.DEFAULT,
  },
  priceSelected: {
    color: Colors.primary.dark,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
