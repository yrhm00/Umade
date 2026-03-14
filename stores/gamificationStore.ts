/**
 * Store Zustand pour la gamification
 * Gère le state de la célébration de badge débloqué
 */

import { Badge } from '@/types/badges';
import { create } from 'zustand';

interface GamificationState {
  /** Badge en attente de célébration */
  pendingBadge: Badge | null;
  /** Afficher la célébration */
  showCelebration: boolean;

  /** Définir un badge à célébrer */
  setPendingBadge: (badge: Badge) => void;
  /** Fermer la célébration */
  clearPendingBadge: () => void;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  pendingBadge: null,
  showCelebration: false,

  setPendingBadge: (badge) =>
    set({ pendingBadge: badge, showCelebration: true }),

  clearPendingBadge: () =>
    set({ pendingBadge: null, showCelebration: false }),
}));
