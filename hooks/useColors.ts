/**
 * Hook useColors - Retourne les couleurs du thème actif
 */

import { DarkColors, LightColors, OLEDColors, type ThemeColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';
import { useColorScheme } from 'react-native';

export type { ThemeColors };

type EffectiveTheme = 'light' | 'dark' | 'oled';

/**
 * Hook pour obtenir les couleurs du thème actif
 * Prend en compte la préférence utilisateur et le thème système
 */
export function useColors(): ThemeColors {
    const mode = useThemeStore((state) => state.mode);
    const systemColorScheme = useColorScheme();

    // Déterminer le thème effectif
    let effectiveTheme: EffectiveTheme;

    if (mode === 'system') {
        effectiveTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
    } else if (mode === 'oled') {
        effectiveTheme = 'oled';
    } else {
        effectiveTheme = mode;
    }

    switch (effectiveTheme) {
        case 'oled':
            return OLEDColors;
        case 'dark':
            return DarkColors;
        default:
            return LightColors;
    }
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
    // OLED is considered 'dark' for StatusBar purposes
    if (mode === 'oled') {
        return 'dark';
    }
    return mode;
}

/**
 * Hook pour vérifier si le thème sombre est actif
 * (inclut OLED)
 */
export function useIsDarkTheme(): boolean {
    const mode = useThemeStore((state) => state.mode);
    const systemColorScheme = useColorScheme();

    if (mode === 'system') {
        return systemColorScheme === 'dark';
    }
    return mode === 'dark' || mode === 'oled';
}
