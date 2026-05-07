/**
 * Aperçu de la checklist sur la home (Phase 10)
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { ChevronRight, Check, Clock, Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { PressableScale } from '@/components/ui/PressableScale';
import { useChecklist, useUpdateChecklistItem, getStatusColor } from '@/hooks/useChecklist';
import { ChecklistItem, ChecklistStatus } from '@/types/preferences';

const MAX_ITEMS = 4;

export function ChecklistPreview() {
  const colors = useColors();
  const { data: items = [], isLoading } = useChecklist();
  const { mutate: updateItem } = useUpdateChecklistItem();

  // Sort: in_progress first, then todo, then done (limited)
  const sortedItems = [...items].sort((a, b) => {
    const order: Record<ChecklistStatus, number> = {
      in_progress: 0,
      todo: 1,
      done: 2,
    };
    return order[a.status] - order[b.status];
  });

  const displayItems = sortedItems.slice(0, MAX_ITEMS);
  const completedCount = items.filter((i) => i.status === 'done').length;
  const progress = items.length > 0 ? completedCount / items.length : 0;

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/checklist' as any);
  };

  const handleToggleItem = (item: ChecklistItem) => {
    const newStatus: ChecklistStatus =
      item.status === 'done' ? 'todo' : 'done';
    updateItem({ itemId: item.id, updates: { status: newStatus } });
  };

  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(260)}
      style={[styles.container, { backgroundColor: colors.card }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>📋</Text>
          <Text style={[styles.title, { color: colors.text }]}>Ta checklist</Text>
        </View>
        <PressableScale onPress={handleSeeAll} haptic="light">
          <View style={styles.seeAllButton}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Voir tout</Text>
            <ChevronRight size={16} color={colors.primary} />
          </View>
        </PressableScale>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%`, backgroundColor: colors.success },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {completedCount}/{items.length} réservés
        </Text>
      </View>

      {/* Items */}
      <View style={styles.itemsList}>
        {displayItems.map((item, index) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={() => handleToggleItem(item)}
            index={index}
            colors={colors}
          />
        ))}
      </View>

      {items.length > MAX_ITEMS && (
        <Pressable onPress={handleSeeAll} style={styles.moreButton}>
          <Text style={[styles.moreText, { color: colors.primary }]}>
            +{items.length - MAX_ITEMS} autres éléments
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: () => void;
  index: number;
  colors: ReturnType<typeof useColors>;
}

function ChecklistItemRow({ item, onToggle, index, colors }: ChecklistItemRowProps) {
  const isDone = item.status === 'done';
  const isInProgress = item.status === 'in_progress';

  const checkboxStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isDone ? colors.success : 'transparent',
        { duration: 180 }
      ),
      borderColor: withTiming(
        isDone
          ? colors.success
          : isInProgress
          ? colors.warning
          : colors.border,
        { duration: 180 }
      ),
    };
  }, [isDone, isInProgress, colors]);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)}
      style={styles.itemRow}
    >
      <Pressable onPress={onToggle} hitSlop={8}>
        <Animated.View style={[styles.checkbox, checkboxStyle]}>
          {isDone ? (
            <Check size={14} color="#FFFFFF" strokeWidth={3} />
          ) : isInProgress ? (
            <Clock size={14} color={colors.warning} />
          ) : null}
        </Animated.View>
      </Pressable>

      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemTitle,
            { color: colors.text },
            isDone && { textDecorationLine: 'line-through', color: colors.textTertiary },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {isDone && item.provider?.business_name
            ? item.provider.business_name
            : isInProgress
            ? 'En cours'
            : 'À trouver'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.lg,
    borderRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Layout.spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '500',
    minWidth: 70,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: Layout.fontSize.xs,
  },
  moreButton: {
    marginTop: Layout.spacing.md,
    alignItems: 'center',
  },
  moreText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
});
