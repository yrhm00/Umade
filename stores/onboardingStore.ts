/**
 * Store Zustand pour l'état de l'onboarding (Phase 10)
 */

import { create } from 'zustand';
import {
  EventType,
  EventTimeline,
  StylePreference,
  BudgetRange,
} from '@/types/preferences';

interface OnboardingState {
  // Step 1: Event Type
  eventType: EventType | null;

  // Step 2: Timeline & Event Name
  eventName: string;
  eventTimeline: EventTimeline | null;
  eventDate: Date | null;

  // Step 3: Styles
  preferredStyles: StylePreference[];

  // Step 4: Details (optional)
  budgetRange: BudgetRange | null;
  guestCount: number | null;
  location: string;

  // Navigation
  currentStep: number;
  totalSteps: number;

  // Actions
  setEventType: (type: EventType) => void;
  setEventName: (name: string) => void;
  setEventTimeline: (timeline: EventTimeline) => void;
  setEventDate: (date: Date | null) => void;
  toggleStyle: (style: StylePreference) => void;
  setBudgetRange: (budget: BudgetRange | null) => void;
  setGuestCount: (count: number | null) => void;
  setLocation: (location: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
  canProceed: () => boolean;
}

const initialState = {
  eventType: null,
  eventName: '',
  eventTimeline: null,
  eventDate: null,
  preferredStyles: [],
  budgetRange: null,
  guestCount: null,
  location: '',
  currentStep: 1,
  totalSteps: 4,
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  ...initialState,

  setEventType: (type) => set({ eventType: type }),

  setEventName: (name) => set({ eventName: name }),

  setEventTimeline: (timeline) => set({ eventTimeline: timeline }),

  setEventDate: (date) => set({ eventDate: date }),

  toggleStyle: (style) => {
    const current = get().preferredStyles;
    if (current.includes(style)) {
      // Remove style
      set({ preferredStyles: current.filter((s) => s !== style) });
    } else if (current.length < 3) {
      // Add style (max 3)
      set({ preferredStyles: [...current, style] });
    }
  },

  setBudgetRange: (budget) => set({ budgetRange: budget }),

  setGuestCount: (count) => set({ guestCount: count }),

  setLocation: (location) => set({ location }),

  nextStep: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps) {
      set({ currentStep: currentStep + 1 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (step) => {
    const { totalSteps } = get();
    if (step >= 1 && step <= totalSteps) {
      set({ currentStep: step });
    }
  },

  reset: () => set(initialState),

  canProceed: () => {
    const state = get();
    switch (state.currentStep) {
      case 1:
        return state.eventType !== null;
      case 2:
        return state.eventTimeline !== null;
      case 3:
        return state.preferredStyles.length > 0;
      case 4:
        return true; // Step 4 is optional
      default:
        return false;
    }
  },
}));
