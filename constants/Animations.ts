import { Easing } from 'react-native-reanimated';

export const AnimationDurations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

export const AnimationEasings = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
} as const;

export const SpringConfigs = {
  // Tres reactif, peu de rebond
  stiff: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  // Equilibre
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  // Doux avec rebond
  bouncy: {
    damping: 10,
    stiffness: 100,
    mass: 1,
  },
  // Tres doux
  gentle: {
    damping: 20,
    stiffness: 80,
    mass: 1,
  },
  // Pour les gestures
  gesture: {
    damping: 50,
    stiffness: 300,
    mass: 0.5,
  },
} as const;

export const AnimationPresets = {
  // Press feedback
  pressScale: {
    toValue: 0.97,
    duration: AnimationDurations.fast,
  },
  // Card entry
  cardEntry: {
    initialOpacity: 0,
    initialTranslateY: 20,
    duration: AnimationDurations.slow,
    staggerDelay: 50,
  },
  // Skeleton shimmer
  shimmer: {
    duration: 1500,
    loop: true,
  },
  // Toast
  toast: {
    entryDuration: AnimationDurations.normal,
    exitDuration: AnimationDurations.fast,
    displayDuration: 3000,
  },
  // Floating label
  floatingLabel: {
    translateY: -24,
    scale: 0.85,
    duration: AnimationDurations.fast,
  },
} as const;

// Combined export for convenience
export const Animations = {
  duration: AnimationDurations,
  easing: AnimationEasings,
  spring: SpringConfigs,
  presets: AnimationPresets,
  // Scale values for press feedback
  scale: {
    pressed: 0.97,
    pressedSubtle: 0.98,
    pressedStrong: 0.95,
  },
  // Stagger delays for list animations
  stagger: {
    fast: 30,
    normal: 50,
    slow: 80,
  },
} as const;
