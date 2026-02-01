/**
 * Hook useColors - Retourne les couleurs du thème actif
 */

import { DarkColors, LightColors, type ThemeColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';
import { useColorScheme } from 'react-native';

export type { ThemeColors };

/**
 * Hook pour obtenir les couleurs du thème actif
 * Prend en compte la préférence utilisateur et le thème système
 */
export function useColors(): ThemeColors {
    const mode = useThemeStore((state) => state.mode);
    const systemColorScheme = useColorScheme();

    // Déterminer le thème effectif
    const effectiveTheme = mode === 'system'
        ? (systemColorScheme ?? 'light')
        : mode;

    return effectiveTheme === 'dark' ? DarkColors : LightColors;
}

/**
 * Hook pour obtenir le thème actif (pour StatusBar, etc.)
 */
export function useTheme(): 'light' | 'dark' {
    const mode = useThemeStore((state) => state.mode);
    const systemColorScheme = useColorScheme();

    if (mode === 'system') {
        return systemColorScheme ?? 'light';
    }
    return mode;
}

/**
 * Hook pour vérifier si le thème sombre est actif
 */
export function useIsDarkTheme(): boolean {
    return useTheme() === 'dark';
}
