// Palette Umade - Premium UI Phase 7
export const Colors = {
  // Couleur principale - Violet profond
  primary: {
    50: '#F5F3F9',
    100: '#E8E3F2',
    200: '#D1C7E5',
    300: '#B3A4D4',
    400: '#8F77B8',
    500: '#5F4A8B',
    600: '#4E3D73',
    700: '#3D2F5A',
    800: '#2C2242',
    900: '#1B1529',
    DEFAULT: '#5F4A8B',
    light: '#8F77B8',
    dark: '#4E3D73',
  },

  // Couleur secondaire - Creme chaud
  cream: {
    50: '#FFFEF7',
    100: '#FEFCEB',
    200: '#FEFACD',
    300: '#FDF6A8',
    400: '#FCF283',
    DEFAULT: '#FEFACD',
  },

  // Secondary (alias for cream for backward compatibility)
  secondary: {
    DEFAULT: '#FEFACD',
    dark: '#FEFCEB',
    darker: '#FDF6A8',
  },

  // Couleurs semantiques
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    DEFAULT: '#10B981',
    light: '#D1FAE5',
    dark: '#059669',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
    dark: '#DC2626',
  },

  // Neutres (harmonise avec primary)
  gray: {
    50: '#FAFAF9',
    100: '#F5F3F9',
    200: '#E8E3F2',
    300: '#D1C7E5',
    400: '#B3A4D4',
    500: '#8F77B8',
    600: '#6B5A94',
    700: '#4E3D73',
    800: '#3D2F5A',
    900: '#2C2242',
  },

  // Base
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Backgrounds
  background: {
    primary: '#FFFEF7',
    secondary: '#FEFCEB',
    tertiary: '#F5F3F9',
  },

  // Text
  text: {
    primary: '#1B1529',
    secondary: '#4E3D73',
    tertiary: '#8F77B8',
    inverse: '#FFFEF7',
    muted: '#B3A4D4',
  },

  // Glassmorphism
  glass: {
    light: 'rgba(254, 250, 205, 0.7)',
    medium: 'rgba(254, 250, 205, 0.85)',
    dark: 'rgba(95, 74, 139, 0.8)',
    background: 'rgba(255, 254, 247, 0.85)',
    border: 'rgba(95, 74, 139, 0.15)',
    borderLight: 'rgba(254, 250, 205, 0.3)',
    shadow: 'rgba(95, 74, 139, 0.1)',
  },

  // Gradients (arrays pour LinearGradient)
  gradients: {
    primary: ['#5F4A8B', '#8F77B8'] as const,
    primaryReverse: ['#8F77B8', '#5F4A8B'] as const,
    cream: ['#FEFACD', '#FFFEF7'] as const,
    sunset: ['#5F4A8B', '#B3A4D4', '#FEFACD'] as const,
    card: ['rgba(254, 252, 235, 0.95)', 'rgba(255, 254, 247, 0.98)'] as const,
    shimmer: ['#E8E3F2', '#F5F3F9', '#E8E3F2'] as const,
  },

  // Ombres
  shadow: {
    color: '#5F4A8B',
    light: 'rgba(95, 74, 139, 0.08)',
    medium: 'rgba(95, 74, 139, 0.15)',
    dark: 'rgba(95, 74, 139, 0.25)',
  },
} as const;

// Type helper
export type ColorKey = keyof typeof Colors;

// Export pour usage avec useColorScheme
export default {
  light: {
    text: Colors.text.primary,
    textSecondary: Colors.text.secondary,
    background: Colors.background.primary,
    backgroundSecondary: Colors.background.secondary,
    tint: Colors.primary.DEFAULT,
    tabIconDefault: Colors.gray[400],
    tabIconSelected: Colors.primary.DEFAULT,
    border: Colors.gray[200],
    card: Colors.white,
  },
  dark: {
    text: Colors.white,
    textSecondary: Colors.gray[400],
    background: Colors.gray[900],
    backgroundSecondary: Colors.gray[800],
    tint: Colors.primary.light,
    tabIconDefault: Colors.gray[600],
    tabIconSelected: Colors.primary.light,
    border: Colors.gray[700],
    card: Colors.gray[800],
  },
};
