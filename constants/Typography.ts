import { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

/**
 * Maps fontWeight strings to actual font families.
 * On Android, explicit fontFamily per weight is required for custom fonts.
 */
export function getFontFamily(
  weight: '400' | '500' | '600' | '700' | 'normal' | 'bold'
): string {
  switch (weight) {
    case '700':
    case 'bold':
      return fontFamily.bold;
    case '600':
      return fontFamily.semiBold;
    case '500':
      return fontFamily.medium;
    case '400':
    case 'normal':
    default:
      return fontFamily.regular;
  }
}

export const Typography = {
  fontFamily,
  hero: { fontFamily: fontFamily.bold, fontSize: 36, lineHeight: 44 } as TextStyle,
  h1: { fontFamily: fontFamily.bold, fontSize: 30, lineHeight: 38 } as TextStyle,
  h2: { fontFamily: fontFamily.bold, fontSize: 24, lineHeight: 32 } as TextStyle,
  h3: { fontFamily: fontFamily.semiBold, fontSize: 20, lineHeight: 28 } as TextStyle,
  h4: { fontFamily: fontFamily.semiBold, fontSize: 18, lineHeight: 26 } as TextStyle,
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 24 } as TextStyle,
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 24 } as TextStyle,
  bodySemiBold: { fontFamily: fontFamily.semiBold, fontSize: 16, lineHeight: 24 } as TextStyle,
  small: { fontFamily: fontFamily.regular, fontSize: 14, lineHeight: 20 } as TextStyle,
  smallMedium: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 } as TextStyle,
  caption: { fontFamily: fontFamily.regular, fontSize: 12, lineHeight: 16 } as TextStyle,
  captionMedium: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 } as TextStyle,
  button: { fontFamily: fontFamily.semiBold, fontSize: 16, lineHeight: 24 } as TextStyle,
  buttonSmall: { fontFamily: fontFamily.semiBold, fontSize: 14, lineHeight: 20 } as TextStyle,
  label: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 } as TextStyle,
  tabLabel: { fontFamily: fontFamily.semiBold, fontSize: 10, lineHeight: 14 } as TextStyle,
} as const;
