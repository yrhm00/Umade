/**
 * Bottom sheet affichant les détails d'un badge
 */

import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { Badge } from '@/types/badges';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeDetailSheetProps {
  badge: Badge | null;
  earnedAt?: string | null;
  onDismiss?: () => void;
}

export const BadgeDetailSheet = forwardRef<BottomSheet, BadgeDetailSheetProps>(
  function BadgeDetailSheet({ badge, earnedAt, onDismiss }, ref) {
    const colors = useColors();
    const snapPoints = useMemo(() => ['40%'], []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.4}
        />
      ),
      []
    );

    if (!badge) return null;

    const formattedDate = earnedAt
      ? new Date(earnedAt).toLocaleDateString('fr-BE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card }}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
      >
        <BottomSheetView style={styles.content}>
          {/* Badge icon large */}
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={styles.iconEmoji}>{badge.icon}</Text>
          </View>

          {/* Name */}
          <Text style={[styles.name, { color: colors.text }]}>{badge.name}</Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {badge.description}
          </Text>

          {/* Meta info */}
          <View style={styles.metaRow}>
            {badge.points != null && badge.points > 0 && (
              <View style={[styles.metaPill, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[styles.metaPillText, { color: colors.primary }]}>
                  {badge.points} pts
                </Text>
              </View>
            )}
            {badge.category && (
              <View style={[styles.metaPill, { backgroundColor: colors.backgroundTertiary }]}>
                <Text style={[styles.metaPillText, { color: colors.textSecondary }]}>
                  {badge.category}
                </Text>
              </View>
            )}
          </View>

          {/* Earned date */}
          {formattedDate && (
            <Text style={[styles.earnedDate, { color: colors.textTertiary }]}>
              Obtenu le {formattedDate}
            </Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    padding: Layout.spacing.xl,
    paddingTop: Layout.spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  iconEmoji: {
    fontSize: 40,
  },
  name: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  metaPill: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
  },
  metaPillText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  earnedDate: {
    fontSize: Layout.fontSize.sm,
  },
});
