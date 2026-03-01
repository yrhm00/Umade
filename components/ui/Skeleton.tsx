import { Colors } from '@/constants/Colors';
import { Layout } from '@/constants/Layout';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'avatar';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  lines?: number;
  lineHeight?: number;
}

function SkeletonBase({
  width = '100%',
  height = 20,
  borderRadius = Layout.radius.md,
  style,
}: Omit<SkeletonProps, 'variant' | 'lines' | 'lineHeight'>) {
  const colors = useColors();
  const isDark = useIsDarkTheme();
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

  const gradientColors = isDark
    ? [colors.backgroundTertiary, colors.card, colors.backgroundTertiary]
    : [...Colors.gradients.shimmer];

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? colors.backgroundTertiary : Colors.gray[200],
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
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
  const colors = useColors();
  const isDark = useIsDarkTheme();
  return (
    <View style={[styles.providerCard, { backgroundColor: isDark ? colors.card : Colors.background.secondary }]}>
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

// Conversation/Chat list item skeleton
Skeleton.ConversationItem = function SkeletonConversationItem() {
  const colors = useColors();
  return (
    <View style={[styles.conversationItem, { borderBottomColor: colors.border }]}>
      <Skeleton.Circle size={52} />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Skeleton height={16} width={140} />
          <Skeleton height={12} width={50} />
        </View>
        <Skeleton height={14} width="85%" style={styles.textLine} />
      </View>
    </View>
  );
};

// Booking card skeleton
Skeleton.BookingCard = function SkeletonBookingCard() {
  const colors = useColors();
  return (
    <View style={[styles.bookingCard, { backgroundColor: colors.card }]}>
      <View style={styles.bookingHeader}>
        <Skeleton.Circle size={48} />
        <View style={styles.bookingHeaderText}>
          <Skeleton height={16} width={150} />
          <Skeleton height={12} width={100} style={styles.textLine} />
        </View>
        <Skeleton height={24} width={70} borderRadius={12} />
      </View>
      <View style={styles.bookingDetails}>
        <Skeleton height={14} width="60%" />
        <Skeleton height={14} width="40%" style={styles.textLine} />
      </View>
    </View>
  );
};

// Checklist item skeleton
Skeleton.ChecklistItem = function SkeletonChecklistItem() {
  const colors = useColors();
  return (
    <View style={[styles.checklistItem, { borderBottomColor: colors.border }]}>
      <Skeleton variant="rect" width={24} height={24} borderRadius={6} />
      <View style={styles.checklistContent}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={10} width={60} style={styles.textLine} />
      </View>
    </View>
  );
};

// Home header skeleton (Welcome + Countdown)
Skeleton.HomeHeader = function SkeletonHomeHeader() {
  const colors = useColors();
  return (
    <View style={styles.homeHeader}>
      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <Skeleton height={28} width={200} />
        <Skeleton height={16} width={160} style={styles.textLine} />
        <Skeleton height={14} width={240} style={styles.textLine} />
      </View>
      {/* Countdown card */}
      <View style={[styles.countdownCard, { backgroundColor: colors.primary }]}>
        <View style={styles.countdownContent}>
          <Skeleton.Circle size={40} style={{ opacity: 0.3 }} />
          <View style={styles.countdownText}>
            <Skeleton height={12} width={80} style={{ opacity: 0.3 }} />
            <Skeleton height={10} width={120} style={[styles.textLine, { opacity: 0.3 }]} />
          </View>
        </View>
        <View style={styles.countdownNumber}>
          <Skeleton height={32} width={50} style={{ opacity: 0.3 }} />
        </View>
      </View>
    </View>
  );
};

// Full screen list skeleton
Skeleton.List = function SkeletonList({
  count = 5,
  itemHeight = 80,
  gap = Layout.spacing.md,
}: {
  count?: number;
  itemHeight?: number;
  gap?: number;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="card" height={itemHeight} />
      ))}
    </View>
  );
};

// Provider detail page skeleton
Skeleton.ProviderDetail = function SkeletonProviderDetail() {
  const colors = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gallery */}
      <SkeletonBase width="100%" height={300} borderRadius={0} />

      <View style={{ padding: Layout.spacing.lg }}>
        {/* Business name */}
        <SkeletonBase width="65%" height={24} style={{ marginBottom: Layout.spacing.sm }} />

        {/* Category + Follow */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm, marginBottom: Layout.spacing.md }}>
          <SkeletonBase width={110} height={28} borderRadius={Layout.radius.full} />
          <SkeletonBase width={70} height={28} borderRadius={Layout.radius.full} />
        </View>

        {/* Rating row */}
        <View style={{ flexDirection: 'row', gap: Layout.spacing.sm, marginBottom: Layout.spacing.sm }}>
          <SkeletonBase width={90} height={16} />
          <SkeletonBase width={50} height={16} />
        </View>

        {/* Location */}
        <SkeletonBase width="40%" height={14} style={{ marginBottom: Layout.spacing.lg }} />

        {/* Trust indicators (3 cards) */}
        <View style={{ flexDirection: 'row', gap: Layout.spacing.sm, marginBottom: Layout.spacing.xl }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: colors.card, borderRadius: Layout.radius.lg, padding: Layout.spacing.md, alignItems: 'center', gap: Layout.spacing.xs }}>
              <SkeletonBase width={32} height={32} borderRadius={16} />
              <SkeletonBase width={50} height={14} />
              <SkeletonBase width={70} height={10} />
            </View>
          ))}
        </View>

        {/* Description section */}
        <SkeletonBase width={100} height={18} style={{ marginBottom: Layout.spacing.md }} />
        <Skeleton variant="text" lines={3} lineHeight={14} />

        {/* Services section */}
        <SkeletonBase width={80} height={18} style={{ marginTop: Layout.spacing.xl, marginBottom: Layout.spacing.md }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={{ backgroundColor: colors.card, borderRadius: Layout.radius.lg, padding: Layout.spacing.md, marginBottom: Layout.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, gap: Layout.spacing.xs }}>
                <SkeletonBase width="60%" height={16} />
                <SkeletonBase width="80%" height={12} />
                <SkeletonBase width={60} height={12} />
              </View>
              <SkeletonBase width={60} height={18} />
            </View>
          </View>
        ))}

        {/* Reviews section */}
        <SkeletonBase width={50} height={18} style={{ marginTop: Layout.spacing.xl, marginBottom: Layout.spacing.md }} />
        {Array.from({ length: 2 }).map((_, i) => (
          <View key={i} style={{ backgroundColor: colors.card, borderRadius: Layout.radius.lg, padding: Layout.spacing.md, marginBottom: Layout.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm, marginBottom: Layout.spacing.sm }}>
              <SkeletonBase width={40} height={40} borderRadius={20} />
              <View style={{ flex: 1, gap: Layout.spacing.xs }}>
                <SkeletonBase width={100} height={14} />
                <SkeletonBase width={70} height={12} />
              </View>
              <SkeletonBase width={60} height={12} />
            </View>
            <Skeleton variant="text" lines={2} lineHeight={12} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  // Conversation item
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 1,
  },
  conversationContent: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Booking card
  bookingCard: {
    borderRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingHeaderText: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  bookingDetails: {
    marginTop: Layout.spacing.md,
    paddingTop: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  // Checklist item
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    gap: Layout.spacing.md,
  },
  checklistContent: {
    flex: 1,
  },
  // Home header
  homeHeader: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  welcomeSection: {
    marginBottom: Layout.spacing.lg,
  },
  countdownCard: {
    borderRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.lg,
  },
  countdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },
  countdownText: {
    gap: 4,
  },
  countdownNumber: {
    alignItems: 'center',
  },
});
