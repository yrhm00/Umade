/**
 * Hook useColors — Umade est en thème clair uniquement.
 *
 * Les thèmes sombre et OLED ont été retirés : l'app doit avoir un rendu
 * unique et maîtrisé. Plutôt que de supprimer les centaines de conditions
 * `isDark ? … : …` disséminées dans les écrans (long et propice aux
 * régressions), ces hooks renvoient désormais toujours le thème clair :
 * chaque condition existante retombe donc naturellement sur sa branche
 * claire, sans qu'aucun écran n'ait à être modifié.
 *
 * Pour réintroduire un jour le mode sombre, il suffit de rebrancher
 * useThemeStore ici — le reste du code est déjà prêt à le gérer.
 */

import { LightColors, type ThemeColors } from '@/constants/Colors';

export type { ThemeColors };

/** Couleurs du thème — toujours claires. */
export function useColors(): ThemeColors {
    return LightColors;
}

/** Thème actif (StatusBar, etc.) — toujours clair. */
export function useTheme(): 'light' | 'dark' {
    return 'light';
}

/** Toujours faux : le thème sombre n'existe plus. */
export function useIsDarkTheme(): boolean {
    return false;
}
