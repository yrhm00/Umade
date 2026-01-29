import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { SpringConfigs, AnimationDurations } from '@/constants/Animations';
import { useHaptics } from '@/hooks/useHaptics';

const AnimatedView = Animated.createAnimatedComponent(View);

interface AnimatedInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  floatingLabel?: boolean;
  shakeOnError?: boolean;
}

export const AnimatedInput = React.memo(function AnimatedInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  secureTextEntry,
  containerStyle,
  style,
  onFocus,
  onBlur,
  value,
  floatingLabel = false,
  shakeOnError = true,
  ...props
}: AnimatedInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { error: hapticError } = useHaptics();

  // Animation values
  const focusProgress = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const labelPosition = useSharedValue(value ? 1 : 0);

  const isPassword = secureTextEntry !== undefined;
  const showPassword = isPassword && isPasswordVisible;

  // Trigger shake animation on error
  React.useEffect(() => {
    if (error && shakeOnError) {
      hapticError();
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [error, shakeOnError]);

  // Update label position when value changes
  React.useEffect(() => {
    if (floatingLabel) {
      labelPosition.value = withSpring(
        value || isFocused ? 1 : 0,
        SpringConfigs.gentle
      );
    }
  }, [value, isFocused, floatingLabel]);

  const handleFocus = useCallback(
    (event: any) => {
      onFocus?.(event);
      if (focusTimer.current) clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => {
        setIsFocused(true);
        focusProgress.value = withSpring(1, SpringConfigs.gentle);
      }, 150);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (event: any) => {
      if (focusTimer.current) {
        clearTimeout(focusTimer.current);
        focusTimer.current = null;
      }
      setIsFocused(false);
      focusProgress.value = withSpring(0, SpringConfigs.gentle);
      onBlur?.(event);
    },
    [onBlur]
  );

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const inputContainerAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? Colors.error.DEFAULT
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [Colors.gray[200], Colors.primary.DEFAULT]
        );

    return {
      borderColor,
      shadowOpacity: focusProgress.value * 0.1,
    };
  });

  const floatingLabelStyle = useAnimatedStyle(() => {
    if (!floatingLabel) return {};

    const translateY = labelPosition.value * -24;
    const scale = 1 - labelPosition.value * 0.15;
    const color = interpolateColor(
      labelPosition.value,
      [0, 1],
      [Colors.gray[400], Colors.primary.DEFAULT]
    );

    return {
      transform: [{ translateY }, { scale }],
      color,
    };
  });

  return (
    <AnimatedView
      style={[styles.container, containerAnimatedStyle, containerStyle]}
    >
      {label && !floatingLabel && <Text style={styles.label}>{label}</Text>}

      <AnimatedView
        style={[styles.inputContainer, inputContainerAnimatedStyle]}
      >
        {floatingLabel && label && (
          <Animated.Text style={[styles.floatingLabel, floatingLabelStyle]}>
            {label}
          </Animated.Text>
        )}

        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon || isPassword ? styles.inputWithRightIcon : null,
            floatingLabel ? styles.inputWithFloatingLabel : null,
            style,
          ].filter(Boolean)}
          placeholderTextColor={Colors.gray[400]}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.gray[500]} />
            ) : (
              <Eye size={20} color={Colors.gray[500]} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </AnimatedView>

      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </AnimatedView>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  floatingLabel: {
    position: 'absolute',
    left: Layout.spacing.md,
    top: 14,
    fontSize: Layout.fontSize.md,
    backgroundColor: Colors.white,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.gray[200],
    height: Layout.inputHeight,
    shadowColor: Colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 4,
    elevation: 0,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.text.primary,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  inputWithFloatingLabel: {
    paddingTop: 8,
  },
  iconLeft: {
    paddingLeft: Layout.spacing.md,
  },
  iconRight: {
    paddingRight: Layout.spacing.md,
  },
  error: {
    fontSize: Layout.fontSize.xs,
    color: Colors.error.DEFAULT,
    marginTop: Layout.spacing.xs,
  },
  hint: {
    fontSize: Layout.fontSize.xs,
    color: Colors.text.tertiary,
    marginTop: Layout.spacing.xs,
  },
});
