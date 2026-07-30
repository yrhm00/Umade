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
  /** Translation verticale du geste de fermeture. */
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
  { origin, target, targetRadius = 0, progress, dragY, onExpanded },
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
    const drag = dragY?.value ?? 0;

    // Pendant le geste de fermeture, le visuel suit le doigt et retrecit.
    const dragScale = interpolate(
      Math.min(Math.max(drag, 0), 400),
      [0, 400],
      [1, 0.82]
    );

    const scale = interpolate(t, [0, 1], [startScale, 1]) * dragScale;
    const translateX = interpolate(t, [0, 1], [origin.x, 0]);
    const translateY = interpolate(t, [0, 1], [origin.y, 0]) + drag;

    return {
      transform: [{ translateX }, { translateY }, { scale }],
      // Rayon exprime dans l'espace non mis a l'echelle : divise par le scale,
      // il reste visuellement constant pendant la montee.
      borderRadius: interpolate(
        t,
        [0, 1],
        [origin.borderRadius / startScale, targetRadius]
      ),
      // L'ombre porte la carte au depart puis s'efface : a plein ecran il n'y a
      // plus de bord a detacher du fond.
      shadowOpacity: interpolate(t, [0, 1], [0.22, 0]),
      shadowRadius: interpolate(t, [0, 1], [16, 0]),
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
      {!!origin.imageUrl && (
        <Image
          source={{ uri: origin.imageUrl }}
          style={styles.image}
          contentFit="cover"
          // Pas de fondu d'apparition : l'image vient du cache de la grille et
          // doit etre a l'ecran des la premiere frame, sinon la continuite avec
          // la carte est rompue par un flash.
          transition={0}
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
});
