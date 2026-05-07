/**
 * Item de timeline pour le Jour J
 * 3 états visuels : passé, en cours, à venir
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors } from '@/hooks/useColors';
import { TimelineItem, TIMELINE_ITEM_TYPES, TimelineItemType } from '@/types/eventFeatures';
import { Check, Clock, MapPin, User } from 'lucide-react-native';

type TimelineItemState = 'past' | 'current' | 'future';

interface JourJTimelineItemProps {
  item: TimelineItem;
  state: TimelineItemState;
  minutesUntil?: number | null;
  index: number;
  onToggleComplete: (item: TimelineItem) => void;
}

export function JourJTimelineItem({
  item,
  state,
  minutesUntil,
  index,
  onToggleComplete,
}: JourJTimelineItemProps) {
  const colors = useColors();
  const typeInfo = TIMELINE_ITEM_TYPES[item.type as TimelineItemType] || TIMELINE_ITEM_TYPES.other;

  const isPast = state === 'past';
  const isCurrent = state === 'current';
  const isFuture = state === 'future';

  const cardOpacity = isPast && item.is_completed ? 0.6 : 1;
  const borderColor = isCurrent ? typeInfo.color : 'transparent';
  const borderWidth = isCurrent ? 2 : 0;

  const formatTimeRange = () => {
    const start = item.start_time;
    const end = item.end_time;
    if (end) return `${start} — ${end}`;
    return start;
  };

  const formatMinutesUntil = (mins: number) => {
    if (mins < 60) return `dans ${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `dans ${h}h${m}` : `dans ${h}h`;
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(220)}>
      <PressableScale
        scale={0.98}
        haptic="selection"
        onPress={() => onToggleComplete(item)}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            opacity: cardOpacity,
            borderColor,
            borderWidth,
          },
          isCurrent && styles.currentCard,
        ]}
      >
        {/* Left — type icon + time */}
        <View style={styles.leftColumn}>
          <View style={[styles.iconCircle, { backgroundColor: `${typeInfo.color}20` }]}>
            <Text style={styles.iconEmoji}>{typeInfo.icon}</Text>
          </View>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatTimeRange()}
          </Text>
        </View>

        {/* Center — content */}
        <View style={styles.centerColumn}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: colors.text },
                isPast && item.is_completed && styles.completedTitle,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {isCurrent && (
              <View style={[styles.liveBadge, { backgroundColor: typeInfo.color }]}>
                <Text style={styles.liveBadgeText}>EN COURS</Text>
              </View>
            )}
          </View>

          {/* Meta info */}
          <View style={styles.metaRow}>
            {item.location && (
              <View style={styles.metaItem}>
                <MapPin size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            )}
            {item.responsible_person && (
              <View style={styles.metaItem}>
                <User size={12} color={colors.textTertiary} />
                <Text style={[styles.metaText, { color: colors.textTertiary }]} numberOfLines={1}>
                  {item.responsible_person}
                </Text>
              </View>
            )}
          </View>

          {/* Countdown for future items */}
          {isFuture && minutesUntil != null && minutesUntil > 0 && (
            <View style={styles.countdownRow}>
              <Clock size={12} color={colors.primary} />
              <Text style={[styles.countdownText, { color: colors.primary }]}>
                {formatMinutesUntil(minutesUntil)}
              </Text>
            </View>
          )}
        </View>

        {/* Right — completion indicator */}
        <View style={styles.rightColumn}>
          <View
            style={[
              styles.checkCircle,
              {
                backgroundColor: item.is_completed ? '#10B981' : 'transparent',
                borderColor: item.is_completed ? '#10B981' : colors.border,
              },
            ]}
          >
            {item.is_completed && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    marginHorizontal: Layout.spacing.lg,
  },
  currentCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  leftColumn: {
    alignItems: 'center',
    marginRight: Layout.spacing.md,
    width: 56,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconEmoji: {
    fontSize: 18,
  },
  time: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: 4,
  },
  title: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.semiBold,
    flex: 1,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  liveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  liveBadgeText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    maxWidth: 120,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  countdownText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
  },
  rightColumn: {
    justifyContent: 'center',
    marginLeft: Layout.spacing.sm,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
