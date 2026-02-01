import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = React.memo(function Input({
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
  ...props
}: InputProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPassword = secureTextEntry !== undefined;
  const showPassword = isPassword && isPasswordVisible;

  // Le style focus est appliqué APRÈS que le clavier soit ouvert.
  // Appliquer un changement de shadow iOS pendant l'ouverture du clavier
  // force la création d'un nouveau CALayer natif, ce qui fait perdre le
  // firstResponder (focus) au TextInput et ferme le clavier.
  const handleFocus = useCallback((event: any) => {
    onFocus?.(event);
    // Defer : attendre que le clavier soit complètement ouvert
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => {
      setIsFocused(true);
    }, 150);
  }, [onFocus]);

  const handleBlur = useCallback((event: any) => {
    if (focusTimer.current) {
      clearTimeout(focusTimer.current);
      focusTimer.current = null;
    }
    setIsFocused(false);
    onBlur?.(event);
  }, [onBlur]);

  const inputContainerStyles = [
    styles.inputContainer,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      shadowColor: isDark ? colors.primary : Colors.primary.DEFAULT,
    },
    isFocused && {
      borderColor: colors.primary,
      shadowOpacity: 0.1,
      elevation: 2,
    },
    error && {
      borderColor: colors.error,
    },
    // Fix for multiline inputs (textarea)
    props.multiline && {
      height: undefined,
      minHeight: Layout.inputHeight,
      alignItems: 'flex-start' as const,
      paddingVertical: Layout.spacing.sm
    }
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      <View style={inputContainerStyles}>
        {leftIcon && (
          <View style={[styles.iconLeft, props.multiline && { paddingTop: Layout.spacing.xs }]}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            leftIcon ? styles.inputWithLeftIcon : undefined,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : undefined,
            props.multiline && { height: undefined, textAlignVertical: 'top' }, // Reset height: 100% for auto-grow
            style,
          ]}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
          <View style={[styles.iconRight, props.multiline && { paddingTop: Layout.spacing.xs }]}>
            {rightIcon}
          </View>
        )}
      </View>

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}
      {hint && !error && <Text style={[styles.hint, { color: colors.textTertiary }]}>{hint}</Text>}
    </View>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Layout.radius.md,
    borderWidth: 1.5,
    height: Layout.inputHeight,
    // Shadow toujours présente sur iOS (avec opacité 0) pour que le CALayer
    // existe dès le départ. Changer UNIQUEMENT shadowOpacity au focus
    // évite la restructuration native qui tue le firstResponder.
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
