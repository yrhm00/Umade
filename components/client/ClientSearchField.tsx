import { PressableScale } from '@/components/ui/PressableScale';
import type { ThemeColors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { Search, X } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface ClientSearchFieldProps {
  colors: ThemeColors;
  isDark: boolean;
  value?: string;
  placeholder: string;
  onPress?: () => void;
  onChangeText?: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  trailing?: React.ReactNode;
}

export function ClientSearchField({
  colors,
  isDark,
  value,
  placeholder,
  onPress,
  onChangeText,
  onClear,
  onFocus,
  trailing,
}: ClientSearchFieldProps) {
  const backgroundColor = isDark ? colors.backgroundTertiary : '#FFFFFF';
  const borderColor = isDark
    ? 'rgba(143, 119, 184, 0.25)'
    : 'rgba(95, 74, 139, 0.10)';

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          shadowColor: isDark ? '#000000' : '#5F4A8B',
        },
      ]}
    >
      <Search size={20} color={colors.primary} strokeWidth={2.4} />
      {onChangeText ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={[styles.input, { color: colors.text }]}
        />
      ) : (
        <Text style={[styles.placeholder, { color: colors.textTertiary }]} numberOfLines={1}>
          {placeholder}
        </Text>
      )}
      {Boolean(value) && onClear ? (
        <Pressable onPress={onClear} hitSlop={8}>
          <X size={18} color={colors.textTertiary} />
        </Pressable>
      ) : null}
      {trailing}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <PressableScale onPress={onPress} haptic="light" style={styles.pressable}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  container: {
    flex: 1,
    minHeight: 52,
    borderRadius: Layout.radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.medium,
    paddingVertical: 0,
  },
  placeholder: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.medium,
  },
});
