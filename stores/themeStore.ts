/**
 * Theme Store - Gestion du mode clair/sombre/système
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            mode: 'system', // Défaut : s'adapte au système
            setMode: (mode) => set({ mode }),
        }),
        {
            name: 'umade-theme',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

// Sélecteurs pour optimiser les re-renders
export const selectThemeMode = (state: ThemeState) => state.mode;
export const selectSetThemeMode = (state: ThemeState) => state.setMode;
