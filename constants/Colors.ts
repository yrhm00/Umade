// Palette Umade - Design Premium
export const Colors = {
  // Couleurs principales
  primary: {
    DEFAULT: '#5E4074',      // Violet principal
    light: '#7B5A94',
    dark: '#4A325C',
    50: '#F5F0F8',
    100: '#EBE1F1',
    200: '#D7C3E3',
    300: '#C3A5D5',
    400: '#9E79B4',
    500: '#5E4074',
    600: '#4A325C',
    700: '#362544',
    800: '#22172C',
    900: '#0E0A14',
  },
  
  // Couleur secondaire (crème)
  secondary: {
    DEFAULT: '#F7F9EC',
    dark: '#E8EBD9',
    darker: '#D9DDC6',
  },
  
  // Couleurs sémantiques
  success: {
    DEFAULT: '#10B981',
    light: '#D1FAE5',
    dark: '#059669',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
    dark: '#DC2626',
  },
  
  // Neutres
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Base
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F7F9EC',
    tertiary: '#F3F4F6',
  },
  
  // Text
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  
  // Glassmorphism
  glass: {
    background: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.3)',
    shadow: 'rgba(94, 64, 116, 0.1)',
  },
} as const;

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