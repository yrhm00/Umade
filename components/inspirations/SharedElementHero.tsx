/**
 * Transition d'element partage : la carte de la grille devient l'ecran de detail.
 *
 * Reanimated 4 a retire `sharedTransitionTag` (experimental en v3, limite a
 * l'ancienne architecture) : la continuite est donc reconstruite a la main.
 *
 * Le calque a la taille finale et n'est deplace que par `transform`. Animer
 * `left/top/width/height` imposerait un relayout a chaque frame et ne
 * s'affichait pas de maniere fiable sous Fabric.
 */

import type { SharedTransitionOrigin } from '@/stores/sharedTransitionStore';
import { Image } from 'expo-image';
import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export interface SharedElementHeroHandle {
  /** Rejoue l'animation a l'envers, puis appelle `onClosed`. */
  collapse: (onClosed: () => void) => void;
}

interface SharedElementHeroProps {
  origin: SharedTransitionOrigin;
  /** Cadre d'arrivee : le visuel principal de l'ecran de detail. */
  target: { width: number; height: number };
  /** Rayon du visuel de detail (0 : il touche les bords de l'ecran). */
  targetRadius?: number;
  /** Progression 0 -> 1, partagee avec l'ecran pour synchroniser les fondus. */
  progress: SharedValue<number>;
  /** Translation du geste de fermeture : la photo suit le doigt librement. */
  dragX?: SharedValue<number>;
  dragY?: SharedValue<number>;
  onExpanded: () => void;
}

// Fenetre courte, comme Pinterest : au-dela, le geste parait mou.
const OPEN_DURATION = 340;
const CLOSE_DURATION = 260;

export const SharedElementHero = React.forwardRef<
  SharedElementHeroHandle,
  SharedElementHeroProps
>(function SharedElementHero(
  { origin, target, targetRadius = 0, progress, dragX, dragY, onExpanded },
  ref
) {
  // Echelle uniforme calee sur la largeur : la hauteur suit, puisque la carte et
  // le visuel de detail derivent tous deux du ratio de la meme photo. Un scale
  // non uniforme deformerait l'image.
  const startScale = useMemo(
    () => (target.width > 0 ? origin.width / target.width : 1),
    [origin.width, target.width]
  );

  // Une seule montee par montage. Toute dependance instable (l'objet `target`,
  // par exemple) relancerait l'animation depuis la valeur courante a chaque
  // re-rendu du parent, ce qui la faisait repartir en cours de route.
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    progress.value = withTiming(
      1,
      // Ease-out : l'objet part vite puis se pose, ce qui donne l'impression
      // qu'il vient vers le lecteur plutot qu'il ne se deplace.
      { duration: OPEN_DURATION, easing: Easing.out(Easing.cubic) },
      (finished) => {
        // `onExpanded` est passe tel quel : une fonction creee dans le worklet,
        // ou une ref mutee apres capture, fait planter le runtime Worklets.
        if (finished) runOnJS(onExpanded)();
      }
    );
    // `onExpanded` est stable cote parent (useCallback sans dependance).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useImperativeHandle(ref, () => ({
    collapse: (onClosed: () => void) => {
      progress.value = withTiming(
        0,
        { duration: CLOSE_DURATION, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(onClosed)();
        }
      );
    },
  }));

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const dx = dragX?.value ?? 0;
    const dy = dragY?.value ?? 0;
    // Distance parcourue, toutes directions confondues : le retrecissement doit
    // suivre l'eloignement reel du doigt, pas seulement sa composante verticale.
    const dragDistance = Math.min(Math.sqrt(dx * dx + dy * dy), 500);

    // Pendant le geste, la photo suit le doigt et retrecit.
    const dragScale = interpolate(dragDistance, [0, 500], [1, 0.62]);

    const scale = interpolate(t, [0, 1], [startScale, 1]) * dragScale;
    // Ancrage haut-gauche : sans compensation, le retrecissement du geste
    // collerait le visuel au bord gauche au lieu de rester centre.
    const dragCenterShift = ((1 - dragScale) * target.width) / 2;
    const translateX = interpolate(t, [0, 1], [origin.x, 0]) + dragCenterShift + dx;
    const translateY = interpolate(t, [0, 1], [origin.y, 0]) + dy;

    // Rayon exprime dans l'espace non mis a l'echelle : divise par le scale, il
    // reste visuellement constant. Pendant le geste, la photo reprend des coins
    // arrondis sur ses quatre angles, comme la carte de la grille.
    const openRadius = interpolate(
      t,
      [0, 1],
      [origin.borderRadius / startScale, targetRadius]
    );
    const dragRadius = interpolate(dragDistance, [0, 220], [0, 26]) / scale;

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      borderRadius: Math.max(openRadius, dragRadius),
      // L'ombre porte la carte au depart, s'efface en plein ecran, et revient
      // pendant le geste pour detacher la photo du fil derriere elle.
      shadowOpacity: Math.max(
        interpolate(t, [0, 1], [0.22, 0]),
        interpolate(dragDistance, [0, 220], [0, 0.3])
      ),
      shadowRadius: Math.max(
        interpolate(t, [0, 1], [16, 0]),
        interpolate(dragDistance, [0, 220], [0, 22])
      ),
    };
  });

  return (
    <Animated.View
      style={[
        styles.hero,
        { width: target.width, height: target.height },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      {/* Miniature : deja en cache cote grille, donc presente des la premiere
          frame. Elle assure la continuite mais serait floue etiree en plein
          ecran, d'ou la pleine resolution posee par-dessus. */}
      {!!origin.imageUrl && (
        <Image
          source={{ uri: origin.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
      )}
      {!!origin.fullImageUrl && origin.fullImageUrl !== origin.imageUrl && (
        <Image
          source={{ uri: origin.fullImageUrl }}
          style={[styles.image, styles.imageOverlay]}
          contentFit="cover"
          // Court fondu : la releve de la miniature ne doit pas se voir comme
          // un remplacement brutal.
          transition={120}
          cachePolicy="memory-disk"
        />
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
    // Ancrage haut-gauche : sans cela le scale partirait du centre et la carte
    // apparaitrait a cote de sa position reelle.
    transformOrigin: 'top left',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
