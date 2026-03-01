/**
 * Slider budget et détails optionnels (Phase 10)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MapPin, Users } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import {
  BudgetRange,
  BUDGET_OPTIONS,
  GUEST_COUNT_OPTIONS,
} from '@/types/preferences';

interface BudgetSliderProps {
  budgetRange: BudgetRange | null;
  onBudgetChange: (budget: BudgetRange | null) => void;
  guestCount: number | null;
  onGuestCountChange: (count: number | null) => void;
  location: string;
  onLocationChange: (location: string) => void;
}

export function BudgetSlider({
  budgetRange,
  onBudgetChange,
  guestCount,
  onGuestCountChange,
  location,
  onLocationChange,
}: BudgetSliderProps) {
  const colors = useColors();
  const [locationFocused, setLocationFocused] = useState(false);

  return (
    <View style={styles.container}>
      {/* Budget */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(260)}
        style={styles.section}
      >
        <Text style={[styles.label, { color: colors.text }]}>Budget estimé</Text>
        <View style={styles.optionsGrid}>
          {BUDGET_OPTIONS.map((option) => {
            const isSelected = budgetRange === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onBudgetChange(isSelected ? null : option.value);
                }}
                style={[
                  styles.budgetOption,
                  {
                    backgroundColor: isSelected ? `${colors.primary}10` : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.budgetLabel,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.budgetRange,
                    { color: isSelected ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {option.range}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Guest Count */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(260)}
        style={styles.section}
      >
        <View style={styles.labelRow}>
          <Users size={18} color={colors.textSecondary} />
          <Text style={[styles.label, { color: colors.text }]}>Nombre d'invités</Text>
        </View>
        <View style={styles.guestOptions}>
          {GUEST_COUNT_OPTIONS.map((option) => {
            const isSelected = guestCount === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onGuestCountChange(isSelected ? null : option.value);
                }}
                style={[
                  styles.guestOption,
                  {
                    backgroundColor: isSelected ? `${colors.primary}10` : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.guestLabel,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.guestRange,
                    { color: isSelected ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {option.range}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Location */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(260)}
        style={styles.section}
      >
        <View style={styles.labelRow}>
          <MapPin size={18} color={colors.textSecondary} />
          <Text style={[styles.label, { color: colors.text }]}>Ville / Région</Text>
        </View>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: locationFocused ? colors.primary : colors.border,
              color: colors.text,
            },
          ]}
          value={location}
          onChangeText={onLocationChange}
          placeholder="Ex: Bruxelles, Liège, Namur..."
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setLocationFocused(true)}
          onBlur={() => setLocationFocused(false)}
        />
      </Animated.View>

      {/* Skip hint */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(260)}
        style={styles.skipHint}
      >
        <Text style={[styles.skipText, { color: colors.textTertiary }]}>
          Ces informations sont optionnelles et t'aideront à recevoir des
          recommandations personnalisées.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.lg,
    gap: 28,
  },
  section: {
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  budgetOption: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Layout.radius.lg,
    borderWidth: 2,
  },
  budgetLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetRange: {
    fontSize: Layout.fontSize.xs,
  },
  guestOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  guestOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: Layout.radius.lg,
    borderWidth: 2,
  },
  guestLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  guestRange: {
    fontSize: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderRadius: Layout.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Layout.fontSize.md,
  },
  skipHint: {
    marginTop: 8,
  },
  skipText: {
    fontSize: Layout.fontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
