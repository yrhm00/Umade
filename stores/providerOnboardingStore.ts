/**
 * État local du tunnel d'inscription prestataire.
 * Volontairement séparé de onboardingStore (qui sert au parcours client).
 */

import { create } from 'zustand';

interface ProviderOnboardingState {
  // Étape 1 — métier
  categoryId: string | null;
  // Étape 2 — entreprise
  businessName: string;
  businessPhone: string;
  // Étape 3 — localisation
  city: string;
  postalCode: string;
  travelsNationwide: boolean;
  // Étape 4 — présentation
  description: string;

  currentStep: number;
  totalSteps: number;

  setCategoryId: (id: string | null) => void;
  setBusinessName: (v: string) => void;
  setBusinessPhone: (v: string) => void;
  setCity: (v: string) => void;
  setPostalCode: (v: string) => void;
  setTravelsNationwide: (v: boolean) => void;
  setDescription: (v: string) => void;
  setCurrentStep: (n: number) => void;
  reset: () => void;
}

const initialState = {
  categoryId: null as string | null,
  businessName: '',
  businessPhone: '',
  city: '',
  postalCode: '',
  travelsNationwide: false,
  description: '',
  currentStep: 1,
  totalSteps: 4,
};

export const useProviderOnboardingStore = create<ProviderOnboardingState>((set) => ({
  ...initialState,

  setCategoryId: (categoryId) => set({ categoryId }),
  setBusinessName: (businessName) => set({ businessName }),
  setBusinessPhone: (businessPhone) => set({ businessPhone }),
  setCity: (city) => set({ city }),
  setPostalCode: (postalCode) => set({ postalCode }),
  setTravelsNationwide: (travelsNationwide) => set({ travelsNationwide }),
  setDescription: (description) => set({ description }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  reset: () => set(initialState),
}));
