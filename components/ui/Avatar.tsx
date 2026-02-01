import { Colors } from '@/constants/Colors';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  showBorder?: boolean;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 20,
  xl: 28,
};

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({
  source,
  name = '',
  size = 'md',
  style,
  showBorder = false,
}: AvatarProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    ...(showBorder && {
      borderWidth: 2,
      borderColor: isDark ? colors.background : Colors.white,
    }),
  };

  if (source) {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <Image
          source={{ uri: source }}
          style={[styles.image, { borderRadius: dimension / 2 }]}
        />
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      containerStyle,
      { backgroundColor: isDark ? colors.backgroundTertiary : Colors.primary[100] },
      style
    ]}>
      <Text style={[styles.initials, { fontSize, color: colors.primary }]}>
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontWeight: '600',
  },
});
