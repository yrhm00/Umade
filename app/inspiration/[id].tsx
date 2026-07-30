/**
 * Ecran de detail d'une inspiration.
 *
 * Arrive par un agrandissement de la carte d'origine : la pile ne joue aucune
 * animation (`animation: 'none'` cote Stack), c'est le calque hero qui assure la
 * continuite visuelle, a l'aller comme au retour.
 */

import { EmptyState } from '@/components/common/EmptyState';
import { InspirationDetail } from '@/components/inspirations';
import { getHeroHeight, HERO_WIDTH } from '@/components/inspirations/heroLayout';
import {
  SharedElementHero,
  type SharedElementHeroHandle,
} from '@/components/inspirations/SharedElementHero';
import { useColors } from '@/hooks/useColors';
import { useInspiration } from '@/hooks/useInspirations';
import { goBackOrFallback } from '@/lib/navigation';
import {
  consumeTransitionOrigin,
  useSharedTransitionStore,
  type SharedTransitionOrigin,
} from '@/stores/sharedTransitionStore';
import { router, useLocalSearchParams } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Au-dela de ce glissement, le geste ferme l'ecran.
const DISMISS_THRESHOLD = 140;

export default function InspirationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: inspiration, isLoading, error } = useInspiration(id);

  // L'origine est lue une seule fois, au montage : la garder en state evite que
  // l'animation reparte si le store change entre-temps.
  const [origin] = useState<SharedTransitionOrigin | null>(() =>
    consumeTransitionOrigin(id)
  );
  const hasHero = !!origin;

  const [isExpanding, setIsExpanding] = useState(hasHero);
  // Vrai a partir du relachement : le contenu reel s'efface, le calque hero
  // prend le relais jusqu'a la carte.
  const [isHandedOverToHero, setIsHandedOverToHero] = useState(false);
  const heroRef = useRef<SharedElementHeroHandle>(null);
  // Progression partagee : 0 = carte, 1 = plein ecran.
  const progress = useSharedValue(hasHero ? 0 : 1);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  // Le calque hero doit rester monte pendant tout le geste : c'est lui, et non
  // le contenu reel, qui suit le doigt. Transformer l'ecran entier laissait
  // apparaitre le bloc d'infos et son fond sous la photo.
  const [isDragging, setIsDragging] = useState(false);
  // Le geste cohabite avec le defilement : il ne part que si le contenu est en
  // haut, sinon lire les infos fermerait l'ecran.
  const scrollRef = useRef<React.ComponentRef<typeof Animated.ScrollView>>(null);
  const contentScrollY = useSharedValue(0);
  const dragAllowed = useSharedValue(true);
  // Une seule fermeture a la fois : sans ce garde, un second geste ou un second
  // appui declencherait deux `goBack`. En SharedValue plutot qu'en ref, car une
  // ref mutee apres avoir ete capturee par un worklet est interdite.
  const isClosing = useSharedValue(false);

  // Action Zustand : deja stable, elle peut etre capturee par un worklet.
  const clearTransition = useSharedTransitionStore((state) => state.clear);

  // Le store ne doit pas rester charge : une arrivee ulterieure par lien profond
  // rejouerait un agrandissement depuis une position perimee.
  useEffect(() => {
    if (!hasHero) clearTransition();
  }, [clearTransition, hasHero]);

  const handleExpanded = useCallback(() => {
    setIsExpanding(false);
    clearTransition();
  }, [clearTransition]);

  const finishClose = useCallback(() => {

    goBackOrFallback(router);
  }, []);

  // Retour : on rejoue l'animation a l'envers pour que la publication regagne sa
  // place dans la liste, puis seulement ensuite on depile.
  const handleRequestClose = useCallback(() => {
    if (isClosing.value) return;
    isClosing.value = true;

    if (!hasHero || !origin) {
      finishClose();
      return;
    }

    // Le calque doit etre remonte avant de redescendre : il a pu etre retire a
    // la fin de l'ouverture.
    setIsExpanding(true);
    requestAnimationFrame(() => {
      const handle = heroRef.current;
      if (handle) {
        handle.collapse(finishClose);
      } else {
        finishClose();
      }
    });
  }, [finishClose, hasHero, isClosing, origin]);

  // Relachement au-dela du seuil : on repasse la main au calque hero, seul
  // capable de viser exactement le cadre de la carte. Cette fonction est appelee
  // depuis un worklet via `runOnJS`, donc elle ne capture aucune ref : une ref
  // mutee apres capture fait planter le runtime Worklets. Le collapse est
  // declenche par l'effet ci-dessous.
  const handleDragRelease = useCallback(() => {

    setIsExpanding(true);
    setIsHandedOverToHero(true);
  }, []);

  // Le calque doit etre monte avant qu'on puisse lui demander de redescendre.
  useEffect(() => {
    if (!isHandedOverToHero) return;

    const handle = heroRef.current;
    if (!handle) {
      finishClose();
      return;
    }
    // Le decalage du doigt se resorbe pendant la descente, sinon le visuel
    // atterrirait a cote de la carte.
    dragX.value = withTiming(0, { duration: 260 });
    dragY.value = withTiming(0, { duration: 260 });
    handle.collapse(finishClose);
  }, [dragX, dragY, finishClose, isHandedOverToHero]);

  // Memoise : une nouvelle reference a chaque rendu relancerait l'animation.
  const heroTarget = useMemo(
    () => ({ width: HERO_WIDTH, height: getHeroHeight(origin?.aspectRatio ?? null) }),
    [origin?.aspectRatio]
  );

  // Geste de fermeture vers le bas. `activeOffsetY` positif et `failOffsetY`
  // negatif : le geste ne prend la main que sur un mouvement vers le bas, ce qui
  // laisse le defilement du contenu intact.
  const dismissGesture = Gesture.Pan()
    .enabled(hasHero)
    // Ne se declenche que vers le bas, pour laisser le defilement du contenu
    // intact. Passe ce seuil, la photo suit ensuite le doigt librement.
    .activeOffsetY(18)
    .failOffsetY(-14)
    // Coexiste avec le defilement au lieu de l'emporter : sans cela, le geste
    // devait etre rattache a la seule zone de la photo, trop petite sur une
    // image paysage — d'ou un glissement qui ne prenait pas sur toutes les
    // publications.
    // Cast : la signature attend `RefObject<ComponentType | undefined>` la ou
    // React fournit `| null`. La ref reste bien celle du ScrollView.
    .simultaneousWithExternalGesture(
      scrollRef as unknown as React.RefObject<React.ComponentType | undefined>
    )
    .onStart(() => {
      dragAllowed.value = contentScrollY.value <= 2;
      if (dragAllowed.value) runOnJS(setIsDragging)(true);
    })
    .onUpdate((event) => {
      if (!dragAllowed.value) return;
      // Les deux axes : la photo doit pouvoir etre promenee n'importe ou, pas
      // seulement verticalement.
      dragX.value = event.translationX;
      dragY.value = event.translationY;
    })
    .onEnd((event) => {
      if (!dragAllowed.value) return;
      if (event.translationY > DISMISS_THRESHOLD && !isClosing.value) {
        isClosing.value = true;
        // Au-dela du seuil : la photo rejoint son emplacement dans la grille.
        runOnJS(handleDragRelease)();
        return;
      }
      // En dessous : la photo revient se poser en plein ecran.
      dragX.value = withSpring(0, { damping: 22, stiffness: 220 });
      dragY.value = withSpring(0, { damping: 22, stiffness: 220 }, (done) => {
        if (done) runOnJS(setIsDragging)(false);
      });
    });

  // Le fond apparait avec l'agrandissement et s'estompe pendant le geste : sans
  // cela, l'ecran precedent resterait masque par un bloc opaque.
  const backdropStyle = useAnimatedStyle(() => {
    const dx = dragX.value;
    const dy = dragY.value;
    const dragDistance = Math.sqrt(dx * dx + dy * dy);
    // Le fond s'efface vite et presque totalement : des les premiers pixels de
    // glissement, on doit retrouver l'accueil tel qu'on l'avait laisse.
    const dragFade = 1 - Math.min(dragDistance / (DISMISS_THRESHOLD * 0.7), 0.96);
    return { opacity: progress.value * dragFade };
  });

  // Contenu : fondu decale, il arrive apres le visuel.
  // Contenu reel : fondu decale a l'ouverture. Des que le geste demarre, il
  // s'effiace d'un coup et laisse la place au calque hero — il ne doit plus
  // rester que la photo dans la main.
  const contentStyle = useAnimatedStyle(() => ({
    opacity:
      isDragging || isHandedOverToHero ? 0 : progress.value * progress.value,
  }), [isDragging, isHandedOverToHero]);

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (error || !inspiration) {
      return (
        <View style={styles.container}>
          <EmptyState
            icon={<AlertCircle size={32} color={colors.primary} />}
            title="Inspiration introuvable"
            description="Cette inspiration n'existe pas ou a ete supprimee."
          />
        </View>
      );
    }

    return (
      <InspirationDetail
        inspiration={inspiration}
        onClose={handleRequestClose}
        dismissGesture={hasHero ? dismissGesture : undefined}
        scrollRef={scrollRef}
        contentScrollY={contentScrollY}
      />
    );
  };

  // Sans transition d'origine (lien profond, notification), l'ecran s'affiche
  // directement : rien a animer.
  if (!hasHero || !origin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderBody()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.backdrop,
          { backgroundColor: colors.background },
          backdropStyle,
        ]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.container, styles.contentClip, contentStyle]}>
        {renderBody()}
      </Animated.View>

      {(isExpanding || isDragging) && (
        <SharedElementHero
          ref={heroRef}
          origin={origin}
          target={heroTarget}
          progress={progress}
          dragX={dragX}
          dragY={dragY}
          onExpanded={handleExpanded}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  // Necessaire pour que les coins arrondis du geste soient effectivement coupes.
  contentClip: {
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
