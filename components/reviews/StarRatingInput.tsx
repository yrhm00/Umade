import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function StarButton({
  star,
  isSelected,
  size,
  onPress,
  disabled,
}: {
  star: number;
  isSelected: boolean;
  size: number;
  onPress: () => void;
  disabled: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isSelected ? 1.1 : 1, {
            damping: 10,
            stiffness: 100,
          }),
        },
      ],
    };
  }, [isSelected]);

  return (
    <AnimatedTouchable
      style={[styles.starButton, animatedStyle]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Star
        size={size}
        color={isSelected ? Colors.warning.DEFAULT : Colors.gray[300]}
        fill={isSelected ? Colors.warning.DEFAULT : 'transparent'}
      />
    </AnimatedTouchable>
  );
}

export function StarRatingInput({
  value,
  onChange,
  size = 36,
  disabled = false,
}: StarRatingInputProps) {
  const handlePress = (rating: number) => {
    if (disabled) return;
    onChange(rating);
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarButton
          key={star}
          star={star}
          isSelected={star <= value}
          size={size}
          onPress={() => handlePress(star)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  starButton: {
    padding: Layout.spacing.xs,
  },
});
