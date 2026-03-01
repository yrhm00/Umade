/**
 * Store pour gérer le tutoriel in-app
 * Suit quels tooltips ont été vus par l'utilisateur
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type TutorialStep =
  | 'welcome'
  | 'home_search'
  | 'home_filters'
  | 'inspiration_like'
  | 'inspiration_save'
  | 'provider_book'
  | 'chat_intro'
  | 'profile_settings';

interface TutorialState {
  // Steps that have been completed
  completedSteps: TutorialStep[];

  // Whether the tutorial is enabled
  isEnabled: boolean;

  // Current active tooltip (if any)
  activeTooltip: TutorialStep | null;

  // Actions
  completeStep: (step: TutorialStep) => void;
  showTooltip: (step: TutorialStep) => void;
  hideTooltip: () => void;
  resetTutorial: () => void;
  disableTutorial: () => void;
  enableTutorial: () => void;

  // Helpers
  isStepCompleted: (step: TutorialStep) => boolean;
  shouldShowStep: (step: TutorialStep) => boolean;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      completedSteps: [],
      isEnabled: true,
      activeTooltip: null,

      completeStep: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
          activeTooltip: state.activeTooltip === step ? null : state.activeTooltip,
        })),

      showTooltip: (step) =>
        set((state) => {
          // Only show if enabled and not completed
          if (!state.isEnabled || state.completedSteps.includes(step)) {
            return state;
          }
          return { activeTooltip: step };
        }),

      hideTooltip: () => set({ activeTooltip: null }),

      resetTutorial: () =>
        set({
          completedSteps: [],
          isEnabled: true,
          activeTooltip: null,
        }),

      disableTutorial: () =>
        set({
          isEnabled: false,
          activeTooltip: null,
        }),

      enableTutorial: () => set({ isEnabled: true }),

      isStepCompleted: (step) => get().completedSteps.includes(step),

      shouldShowStep: (step) => {
        const state = get();
        return state.isEnabled && !state.completedSteps.includes(step);
      },
    }),
    {
      name: 'tutorial-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        completedSteps: state.completedSteps,
        isEnabled: state.isEnabled,
      }),
    }
  )
);

// Tutorial content for each step
export const TUTORIAL_CONTENT: Record<
  TutorialStep,
  {
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
  }
> = {
  welcome: {
    title: 'Bienvenue sur Umade !',
    description: 'Découvre les meilleurs prestataires pour ton événement.',
    position: 'bottom',
  },
  home_search: {
    title: 'Recherche',
    description: 'Tape ici pour rechercher des inspirations ou des prestataires.',
    position: 'bottom',
  },
  home_filters: {
    title: 'Filtres',
    description: 'Affine ta recherche avec les filtres par catégorie et style.',
    position: 'bottom',
  },
  inspiration_like: {
    title: 'Double-tap pour aimer',
    description: 'Double-tape sur une image pour l\'ajouter à tes favoris.',
    position: 'top',
  },
  inspiration_save: {
    title: 'Sauvegarde tes coups de cœur',
    description: 'Appuie sur le cœur pour sauvegarder cette inspiration.',
    position: 'left',
  },
  provider_book: {
    title: 'Réserve facilement',
    description: 'Appuie ici pour demander un devis ou réserver ce prestataire.',
    position: 'top',
  },
  chat_intro: {
    title: 'Discute directement',
    description: 'Pose tes questions et négocie directement avec le prestataire.',
    position: 'bottom',
  },
  profile_settings: {
    title: 'Personnalise ton expérience',
    description: 'Accède à tes paramètres et préférences ici.',
    position: 'left',
  },
};
