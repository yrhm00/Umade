import React from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { PressableScale } from '@/components/ui/PressableScale';

interface CategoryPillProps {
  label: string;
  /** Emoji hérité — utilisé seulement si categorySlug n'est pas fourni. */
  icon?: string;
  /** Slug de catégorie : affiche l'icône Phosphor plutôt qu'un emoji. */
  categorySlug?: string | null;
  isSelected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CategoryPill({
  label,
  icon,
  categorySlug,
  isSelected = false,
  onPress,
  style,
}: CategoryPillProps) {
  const colors = useColors();
  const isDark = useIsDarkTheme();

  const containerBg = isSelected
    ? colors.primary
    : isDark
    ? colors.backgroundTertiary
    : Colors.gray[100];

  const borderColor = isSelected
    ? colors.primary
    : isDark
    ? colors.border
    : 'transparent';

  const textColor = isSelected ? '#FFFFFF' : colors.text;

  return (
    <PressableScale
      scale={0.95}
      haptic="selection"
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: containerBg,
          borderColor,
        },
        style,
      ]}
    >
      {categorySlug ? (
        // Pas de style : le conteneur applique déjà un `gap`.
        <CategoryIcon slug={categorySlug} size={16} color={textColor} />
      ) : icon ? (
        <Text style={styles.icon}>{icon}</Text>
      ) : null}
      <Text style={[styles.label, { color: textColor }]}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
    gap: Layout.spacing.xs,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
});
