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
  const backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const borderColor = isDark
    ? 'rgba(255,255,255,0.10)'
    : 'rgba(17, 24, 39, 0.10)';

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Search size={18} color={colors.textSecondary} strokeWidth={2} />
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
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    letterSpacing: -0.1,
    paddingVertical: 0,
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    letterSpacing: -0.1,
  },
});
