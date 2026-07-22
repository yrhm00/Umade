/**
 * Icônes de catégorie — pack Phosphor, variante « duotone ».
 *
 * Remplace les emojis système (📸 🍽️ 🎵…) qui étaient identiques dans toutes
 * les apps et rendaient l'interface générique. Le duotone donne une silhouette
 * pleine teintée de la couleur de marque, plus proche d'une illustration que
 * d'un pictogramme d'interface — et volontairement distinct de Lucide, qui
 * reste réservé aux icônes d'interface (flèches, cœur, réglages).
 */

import { useColors } from '@/hooks/useColors';
import {
  Armchair,
  Buildings,
  CalendarHeart,
  Camera,
  Confetti,
  Cake,
  FilmSlate,
  Flower,
  ForkKnife,
  HairDryer,
  MaskHappy,
  MusicNotes,
  PaintBrushBroad,
  type IconProps,
} from 'phosphor-react-native';
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type PhosphorIcon = React.ComponentType<IconProps>;

/** Correspondance slug -> icône. Les slugs viennent de la table `categories`. */
const ICON_BY_SLUG: Record<string, PhosphorIcon> = {
  photographie: Camera,
  videographie: FilmSlate,
  traiteur: ForkKnife,
  'dj-musique': MusicNotes,
  fleuriste: Flower,
  lieu: Buildings,
  'location-materiel': Armchair,
  beaute: HairDryer,
  patisserie: Cake,
  animation: MaskHappy,
  decoration: PaintBrushBroad,
  'wedding-planner': CalendarHeart,
};

/** Repli si une nouvelle catégorie apparaît sans correspondance. */
const FALLBACK: PhosphorIcon = Confetti;

interface CategoryIconProps {
  /** Slug de la catégorie (ex. "photographie"). */
  slug?: string | null;
  size?: number;
  /** Teinte de l'icône. Par défaut : la couleur primaire du thème. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function CategoryIcon({ slug, size = 28, color, style }: CategoryIconProps) {
  const colors = useColors();
  const Icon = (slug && ICON_BY_SLUG[slug]) || FALLBACK;
  const tint = color ?? colors.primary;

  return (
    <View style={style}>
      <Icon size={size} color={tint} weight="duotone" />
    </View>
  );
}

/**
 * Variante « pastille » : l'icône posée sur un fond teinté arrondi.
 * Utile dans les grilles où l'icône seule manquerait de présence.
 */
export function CategoryIconBadge({
  slug,
  size = 26,
  color,
  style,
}: CategoryIconProps) {
  const colors = useColors();
  const tint = color ?? colors.primary;
  const box = size * 1.85;

  return (
    <View
      style={[
        {
          width: box,
          height: box,
          borderRadius: box * 0.32,
          backgroundColor: `${tint}14`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <CategoryIcon slug={slug} size={size} color={tint} />
    </View>
  );
}
