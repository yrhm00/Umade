import { SpringConfigs } from '@/constants/Animations';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useHaptics } from '@/hooks/useHaptics';
import { Eye, EyeOff } from 'lucide-react-native';
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
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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
  const colors = useColors();
  const isDark = useIsDarkTheme();
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
        [isDark ? colors.border : Colors.gray[200], colors.primary]
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
      [colors.textTertiary, colors.primary]
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
      {label && !floatingLabel && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      <AnimatedView
        style={[
          styles.inputContainer,
          { backgroundColor: colors.card, shadowColor: colors.primary },
          inputContainerAnimatedStyle
        ]}
      >
        {floatingLabel && label && (
          <Animated.Text style={[styles.floatingLabel, { backgroundColor: colors.card }, floatingLabelStyle]}>
            {label}
          </Animated.Text>
        )}

        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon || isPassword ? styles.inputWithRightIcon : null,
            floatingLabel ? styles.inputWithFloatingLabel : null,
            style,
          ].filter(Boolean)}
          placeholderTextColor={colors.textTertiary}
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
              <EyeOff size={20} color={colors.textTertiary} />
            ) : (
              <Eye size={20} color={colors.textTertiary} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </AnimatedView>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {hint && !error && <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>}
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
    marginBottom: Layout.spacing.xs,
  },
  floatingLabel: {
    position: 'absolute',
    left: Layout.spacing.md,
    top: 14,
    fontSize: Layout.fontSize.md,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    height: Layout.inputHeight,
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
    marginTop: Layout.spacing.xs,
  },
  hint: {
    fontSize: Layout.fontSize.xs,
    marginTop: Layout.spacing.xs,
  },
});
