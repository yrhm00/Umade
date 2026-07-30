/**
 * Origine d'une transition d'element partage.
 *
 * Reanimated 4 a retire `sharedTransitionTag` (experimental en v3, et limite a
 * l'ancienne architecture). La continuite visuelle est donc reconstruite a la
 * main : la carte mesure sa position a l'ecran avant de naviguer, et l'ecran de
 * destination reprend l'animation depuis ces coordonnees.
 */

import { create } from 'zustand';

export interface SharedTransitionOrigin {
  /** Coordonnees absolues de la carte au moment du tap. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rayon de depart, pour l'interpoler vers 0 en plein ecran. */
  borderRadius: number;
  /** Visuel affiche pendant l'agrandissement : deja en cache cote carte. */
  imageUrl: string | null;
  /** Ratio largeur/hauteur de la photo, pour viser la bonne hauteur finale. */
  aspectRatio: number | null;
  /** Horodatage du tap, pour ne pas rejouer une origine perimee. */
  createdAt: number;
}

interface SharedTransitionState {
  /** Identifiant de l'element attendu par l'ecran de destination. */
  targetId: string | null;
  origin: SharedTransitionOrigin | null;
  begin: (targetId: string, origin: SharedTransitionOrigin) => void;
  /**
   * A appeler une fois l'agrandissement termine. L'origine ne doit pas
   * survivre a la transition : sinon un retour arriere puis une arrivee par un
   * autre chemin (lien profond, notification) rejouerait une animation depuis
   * une position qui n'a plus de sens.
   */
  clear: () => void;
}

export const useSharedTransitionStore = create<SharedTransitionState>((set) => ({
  targetId: null,
  origin: null,
  begin: (targetId, origin) => set({ targetId, origin }),

  clear: () => set({ targetId: null, origin: null }),
}));

// Au-dela de ce delai, l'origine ne vient pas du tap qui a ouvert cet ecran.
const MAX_ORIGIN_AGE_MS = 1200;

/**
 * Origine a consommer au montage de l'ecran de destination.
 *
 * Le filtrage ne peut pas reposer sur l'identifiant : `useLocalSearchParams`
 * renvoie parfois `undefined` au premier rendu, et l'origine etait alors
 * rejetee a tort — l'animation ne partait jamais. On se fie donc a la fraicheur
 * de l'origine, et a l'identifiant seulement lorsqu'il est deja disponible.
 */
export function consumeTransitionOrigin(id: string | undefined) {
  const { targetId, origin } = useSharedTransitionStore.getState();
  if (!origin) return null;
  if (id && targetId && targetId !== id) return null;
  if (Date.now() - origin.createdAt > MAX_ORIGIN_AGE_MS) return null;
  return origin;
}
