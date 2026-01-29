import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'avatar';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  lines?: number;
  lineHeight?: number;
}

function SkeletonBase({
  width = '100%',
  height = 20,
  borderRadius = Layout.radius.md,
  style,
}: Omit<SkeletonProps, 'variant' | 'lines' | 'lineHeight'>) {
  const translateX = useSharedValue(-1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(translateX.value, [-1, 1], [-200, 200]),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={[...Colors.gradients.shimmer] as [string, string, ...string[]]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

export function Skeleton({
  variant = 'rect',
  width,
  height,
  borderRadius,
  style,
  lines = 1,
  lineHeight = 16,
}: SkeletonProps) {
  const getVariantStyles = (): {
    width: number | string;
    height: number;
    borderRadius: number;
  } => {
    switch (variant) {
      case 'circle':
        const circleSize = height || 40;
        return {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
        };
      case 'avatar':
        const avatarSize = height || 48;
        return {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        };
      case 'card':
        return {
          width: width || '100%',
          height: height || 120,
          borderRadius: borderRadius || Layout.radius.lg,
        };
      case 'text':
        return {
          width: width || '100%',
          height: lineHeight,
          borderRadius: borderRadius || 4,
        };
      default:
        return {
          width: width || '100%',
          height: height || 20,
          borderRadius: borderRadius || Layout.radius.sm,
        };
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <View style={styles.textContainer}>
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonBase
            key={index}
            height={lineHeight}
            width={index === lines - 1 ? '70%' : '100%'}
            borderRadius={4}
            style={index > 0 ? styles.textLine : undefined}
          />
        ))}
      </View>
    );
  }

  const variantStyles = getVariantStyles();
  return (
    <SkeletonBase
      width={variantStyles.width}
      height={variantStyles.height}
      borderRadius={variantStyles.borderRadius}
      style={style}
    />
  );
}

// Compound components for convenience
Skeleton.Text = function SkeletonText({
  lines = 1,
  lineHeight = 16,
  style,
}: {
  lines?: number;
  lineHeight?: number;
  style?: ViewStyle;
}) {
  return (
    <Skeleton
      variant="text"
      lines={lines}
      lineHeight={lineHeight}
      style={style}
    />
  );
};

Skeleton.Circle = function SkeletonCircle({
  size = 40,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return <Skeleton variant="circle" height={size} style={style} />;
};

Skeleton.Avatar = function SkeletonAvatar({
  size = 48,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return <Skeleton variant="avatar" height={size} style={style} />;
};

Skeleton.Card = function SkeletonCard({
  height = 120,
  style,
}: {
  height?: number;
  style?: ViewStyle;
}) {
  return <Skeleton variant="card" height={height} style={style} />;
};

// Complex skeleton for provider cards
Skeleton.ProviderCard = function SkeletonProviderCard() {
  return (
    <View style={styles.providerCard}>
      <Skeleton variant="card" height={160} />
      <View style={styles.providerCardContent}>
        <Skeleton height={18} width="70%" />
        <Skeleton height={14} width="50%" style={styles.providerCardLine} />
        <Skeleton height={14} width="30%" style={styles.providerCardLine} />
      </View>
    </View>
  );
};

// Avatar with text (for list items)
Skeleton.AvatarWithText = function SkeletonAvatarWithText({
  avatarSize = 44,
}: {
  avatarSize?: number;
}) {
  return (
    <View style={styles.avatarRow}>
      <Skeleton.Circle size={avatarSize} />
      <View style={styles.avatarText}>
        <Skeleton height={16} width={120} />
        <Skeleton height={12} width={80} style={styles.textLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gray[200],
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: 200,
  },
  gradient: {
    flex: 1,
    width: 200,
  },
  textContainer: {
    gap: Layout.spacing.xs,
  },
  textLine: {
    marginTop: Layout.spacing.xs,
  },
  providerCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Layout.radius.xl,
    overflow: 'hidden',
  },
  providerCardContent: {
    padding: Layout.spacing.md,
  },
  providerCardLine: {
    marginTop: Layout.spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarText: {
    marginLeft: Layout.spacing.md,
    flex: 1,
  },
});
