import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

interface AnimatedHeaderProps {
  scrollY: SharedValue<number>;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  rightAction?: React.ReactNode;
  expandedHeight?: number;
  collapsedHeight?: number;
  onBackPress?: () => void;
}

export function AnimatedHeader({
  scrollY,
  title,
  subtitle,
  showBackButton = true,
  rightAction,
  expandedHeight = 200,
  collapsedHeight = 56,
  onBackPress,
}: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const totalCollapsedHeight = collapsedHeight + insets.top;
  const collapseDistance = expandedHeight - collapsedHeight;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, collapseDistance],
      [expandedHeight + insets.top, totalCollapsedHeight],
      Extrapolation.CLAMP
    );

    return { height };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50, collapseDistance],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  const expandedTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, collapseDistance - 50],
      [1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, collapseDistance],
      [0, -20],
      Extrapolation.CLAMP
    );

    return { opacity, transform: [{ translateY }] };
  });

  const blurOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, collapseDistance - 20, collapseDistance],
      [0, 0, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      scrollY.value,
      [0, collapseDistance],
      [0, 0.1],
      Extrapolation.CLAMP
    );

    return { shadowOpacity };
  });

  return (
    <Animated.View
      style={[styles.container, headerAnimatedStyle, shadowStyle]}
    >
      {/* Background blur (appears on collapse) */}
      {Platform.OS === 'ios' && (
        <Animated.View style={[styles.blurContainer, blurOpacityStyle]}>
          <BlurView
            intensity={80}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Collapsed title bar */}
      <View style={[styles.collapsedBar, { paddingTop: insets.top }]}>
        {showBackButton && (
          <Pressable style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={28} color={Colors.text.primary} />
          </Pressable>
        )}

        <Animated.Text
          style={[styles.collapsedTitle, titleAnimatedStyle]}
          numberOfLines={1}
        >
          {title}
        </Animated.Text>

        {rightAction ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : (
          <View style={styles.rightActionPlaceholder} />
        )}
      </View>

      {/* Expanded title (at bottom) */}
      <Animated.View
        style={[styles.expandedTitleContainer, expandedTitleStyle]}
      >
        <Text style={styles.expandedTitle}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.background.primary,
    overflow: 'hidden',
    shadowColor: Colors.shadow.color,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  collapsedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.headerHeight,
    paddingHorizontal: Layout.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -Layout.spacing.sm,
  },
  collapsedTitle: {
    flex: 1,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  rightAction: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionPlaceholder: {
    width: 44,
  },
  expandedTitleContainer: {
    position: 'absolute',
    bottom: Layout.spacing.lg,
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
  },
  expandedTitle: {
    fontSize: Layout.fontSize['3xl'],
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.text.secondary,
    marginTop: Layout.spacing.xs,
  },
});
