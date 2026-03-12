/**
 * Sélecteur de styles avec grille d'images (Phase 10)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { StylePreference, STYLE_OPTIONS } from '@/types/preferences';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - Layout.spacing.lg * 2 - 12) / 2;

interface StylePickerProps {
  selectedStyles: StylePreference[];
  onToggle: (style: StylePreference) => void;
  maxSelection?: number;
}

export function StylePicker({
  selectedStyles,
  onToggle,
  maxSelection = 3,
}: StylePickerProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        Sélectionne jusqu'à {maxSelection} styles ({selectedStyles.length}/{maxSelection})
      </Text>
      <View style={styles.grid}>
        {STYLE_OPTIONS.map((option, index) => (
          <StyleCard
            key={option.value}
            option={option}
            isSelected={selectedStyles.includes(option.value)}
            isDisabled={
              selectedStyles.length >= maxSelection &&
              !selectedStyles.includes(option.value)
            }
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(option.value);
            }}
            index={index}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
}

interface StyleCardProps {
  option: (typeof STYLE_OPTIONS)[number];
  isSelected: boolean;
  isDisabled: boolean;
  onPress: () => void;
  index: number;
  colors: ReturnType<typeof useColors>;
}

function StyleCard({
  option,
  isSelected,
  isDisabled,
  onPress,
  index,
  colors,
}: StyleCardProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withTiming(isSelected ? 0.985 : 1, { duration: 180, easing: Easing.out(Easing.cubic) }) },
      ],
      opacity: isDisabled ? 0.5 : 1,
    };
  }, [isSelected, isDisabled]);

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isSelected ? 1 : 0, { duration: 180, easing: Easing.out(Easing.cubic) }),
    };
  }, [isSelected]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(260)}
    >
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={styles.cardWrapper}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <Image
            source={{ uri: option.image }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4' }}
          />

          {/* Overlay when selected */}
          <Animated.View style={[styles.selectedOverlay, { backgroundColor: `${colors.primary}40` }, overlayStyle]}>
            <View style={[styles.checkContainer, { backgroundColor: colors.primary }]}>
              <Check size={24} color="#FFFFFF" strokeWidth={3} />
            </View>
          </Animated.View>

          {/* Label */}
          <View style={styles.labelContainer}>
            <Text style={styles.label}>
              {option.label}
            </Text>
          </View>

          {/* Border */}
          {isSelected && <View style={[styles.selectedBorder, { borderColor: colors.primary }]} />}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.spacing.lg,
  },
  hint: {
    fontSize: Layout.fontSize.sm,
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: CARD_SIZE,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.2,
    borderRadius: Layout.radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  selectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderRadius: Layout.radius.xl,
  },
});
