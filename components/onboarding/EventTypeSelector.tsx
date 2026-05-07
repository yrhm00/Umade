/**
 * Sélecteur de type d'événement pour l'onboarding (Phase 10)
 * Dark Mode Support
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { EventType, EVENT_TYPE_OPTIONS } from '@/types/preferences';

interface EventTypeSelectorProps {
  selectedType: EventType | null;
  onSelect: (type: EventType) => void;
}

export function EventTypeSelector({
  selectedType,
  onSelect,
}: EventTypeSelectorProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {EVENT_TYPE_OPTIONS.map((option, index) => (
        <EventTypeCard
          key={option.value}
          option={option}
          isSelected={selectedType === option.value}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(option.value);
          }}
          index={index}
          colors={colors}
        />
      ))}
    </View>
  );
}

interface EventTypeCardProps {
  option: (typeof EVENT_TYPE_OPTIONS)[number];
  isSelected: boolean;
  onPress: () => void;
  index: number;
  colors: ReturnType<typeof useColors>;
}

function EventTypeCard({
  option,
  isSelected,
  onPress,
  index,
  colors,
}: EventTypeCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withTiming(isSelected ? 1.02 : 1, { duration: 180, easing: Easing.out(Easing.cubic) }) },
      ],
    };
  }, [isSelected]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(260)}
      style={styles.cardWrapper}
    >
      <Pressable onPress={onPress}>
        <Animated.View
          style={[
            styles.card,
            animatedStyle,
            {
              backgroundColor: isSelected ? `${colors.primary}15` : colors.card,
              borderColor: isSelected ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={styles.emoji}>{option.emoji}</Text>
          <Text
            style={[
              styles.label,
              { color: isSelected ? colors.primary : colors.text },
            ]}
          >
            {option.label}
          </Text>
          {isSelected && (
            <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.md,
  },
  cardWrapper: {
    width: '45%',
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: Layout.radius.xl,
    borderWidth: 2,
    position: 'relative',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  label: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
