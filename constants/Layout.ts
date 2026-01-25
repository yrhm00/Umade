import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: {
    width,
    height,
  },
  
  // Breakpoints
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 414,
  isLargeDevice: width >= 414,
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Border radius
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  
  // Icon sizes
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  
  // Component heights
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  
  inputHeight: 48,
  tabBarHeight: 80,
  headerHeight: 56,
} as const;