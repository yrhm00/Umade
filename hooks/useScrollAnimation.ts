import {
  useAnimatedScrollHandler,
  useSharedValue,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

interface ScrollAnimationConfig {
  headerHeight?: number;
  collapseThreshold?: number;
}

interface ScrollAnimationReturn {
  scrollY: SharedValue<number>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  headerHeight: number;
  collapseThreshold: number;
  createInterpolation: (
    inputRange: number[],
    outputRange: number[],
    extrapolation?: Extrapolation
  ) => () => number;
}

export function useScrollAnimation(
  config: ScrollAnimationConfig = {}
): ScrollAnimationReturn {
  const { headerHeight = 100, collapseThreshold = 50 } = config;

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Helper to create interpolated values based on scroll
  const createInterpolation = (
    inputRange: number[],
    outputRange: number[],
    extrapolation: Extrapolation = Extrapolation.CLAMP
  ) => {
    return () => {
      'worklet';
      return interpolate(scrollY.value, inputRange, outputRange, extrapolation);
    };
  };

  return {
    scrollY,
    scrollHandler,
    createInterpolation,
    headerHeight,
    collapseThreshold,
  };
}
