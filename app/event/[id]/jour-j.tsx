/**
 * Écran Jour J — Tableau de bord live pour le jour de l'événement
 * Timeline en temps réel avec indicateur "maintenant", progress bar, contacts rapides
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BottomSheet from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, PartyPopper } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { EmptyState } from '@/components/common/EmptyState';
import { JourJTimelineItem } from '@/components/jour-j/JourJTimelineItem';
import { TimelineNowIndicator } from '@/components/jour-j/TimelineNowIndicator';
import { VendorContactSheet } from '@/components/jour-j/VendorContactSheet';
import { PressableScale } from '@/components/ui/PressableScale';
import { Layout } from '@/constants/Layout';
import { fontFamily } from '@/constants/Typography';
import { useColors, useIsDarkTheme } from '@/hooks/useColors';
import { useEventDetail } from '@/hooks/useEvents';
import { useJourJTimeline, useJourJVendors } from '@/hooks/useJourJ';
import { useToggleTimelineItemComplete } from '@/hooks/useTimeline';
import { TimelineItem } from '@/types/eventFeatures';
import { goBackOrFallback } from '@/lib/navigation';
import { toast } from '@/lib/toast';

type TimelineItemState = 'past' | 'current' | 'future';

interface TimelineListItem {
  type: 'item' | 'now_indicator';
  item?: TimelineItem;
  state?: TimelineItemState;
  minutesUntil?: number | null;
}

export default function JourJScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDarkTheme();
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const { data: event } = useEventDetail(eventId);
  const timeline = useJourJTimeline(eventId, event?.event_date || undefined);
  const { data: vendors = [] } = useJourJVendors(eventId);
  const { mutate: toggleComplete } = useToggleTimelineItemComplete();

  const handleToggleComplete = useCallback(
    (item: TimelineItem) => {
      if (!eventId) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleComplete({
        id: item.id,
        eventId,
        isCompleted: !item.is_completed,
      });
      if (!item.is_completed) {
        toast.success(`${item.title} terminé !`);
      }
    },
    [eventId, toggleComplete]
  );

  const handleOpenContacts = useCallback(() => {
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  // Construire la liste avec l'indicateur "maintenant" inséré au bon endroit
  const listData = useMemo((): TimelineListItem[] => {
    if (timeline.items.length === 0) return [];

    const result: TimelineListItem[] = [];
    let nowInserted = false;

    const parseTime = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    for (const item of timeline.items) {
      const startMin = parseTime(item.start_time);
      const endMin = item.end_time
        ? parseTime(item.end_time)
        : startMin + (item.duration_minutes || 30);

      let state: TimelineItemState = 'future';
      let minutesUntil: number | null = null;

      if (timeline.isEventDay) {
        if (currentMinutes >= startMin && currentMinutes < endMin) {
          state = 'current';
        } else if (currentMinutes >= endMin) {
          state = 'past';
        } else {
          state = 'future';
          minutesUntil = startMin - currentMinutes;
        }

        // Insérer l'indicateur "maintenant" avant le premier item futur
        if (!nowInserted && state === 'future') {
          result.push({ type: 'now_indicator' });
          nowInserted = true;
        }
        // Ou si c'est l'item en cours, insérer avant lui
        if (!nowInserted && state === 'current') {
          result.push({ type: 'now_indicator' });
          nowInserted = true;
        }
      }

      result.push({
        type: 'item',
        item,
        state: timeline.isEventDay ? state : 'future',
        minutesUntil,
      });
    }

    // Si tous les items sont passés, insérer l'indicateur à la fin
    if (timeline.isEventDay && !nowInserted) {
      result.push({ type: 'now_indicator' });
    }

    return result;
  }, [timeline]);

  // Countdown J-X si l'événement est dans le futur
  const daysUntil = useMemo(() => {
    if (!event?.event_date) return null;
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return null;
    return diff;
  }, [event]);

  const renderItem = useCallback(
    ({ item: listItem, index }: { item: TimelineListItem; index: number }) => {
      if (listItem.type === 'now_indicator') {
        return <TimelineNowIndicator currentTime={timeline.currentTimeFormatted} />;
      }

      if (listItem.item) {
        return (
          <JourJTimelineItem
            item={listItem.item}
            state={listItem.state || 'future'}
            minutesUntil={listItem.minutesUntil}
            index={index}
            onToggleComplete={handleToggleComplete}
          />
        );
      }

      return null;
    },
    [timeline.currentTimeFormatted, handleToggleComplete]
  );

  const progressPercent = Math.round(timeline.progress * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale scale={0.9} haptic="light" onPress={() => goBackOrFallback(router)}>
          <ArrowLeft size={24} color={colors.text} />
        </PressableScale>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {timeline.isEventDay ? 'Jour J' : 'Programme'}
          </Text>
          {event?.title && (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {event.title}
            </Text>
          )}
        </View>
        {vendors.length > 0 && (
          <PressableScale scale={0.9} haptic="light" onPress={handleOpenContacts}>
            <View style={[styles.contactsButton, { backgroundColor: `${colors.primary}15` }]}>
              <Phone size={18} color={colors.primary} />
            </View>
          </PressableScale>
        )}
      </View>

      {/* Countdown or Live mode */}
      {daysUntil != null && daysUntil > 0 && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.countdownBanner}>
          <Text style={[styles.countdownText, { color: colors.primary }]}>
            J-{daysUntil}
          </Text>
          <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>
            {daysUntil === 1 ? "C'est demain !" : `dans ${daysUntil} jours`}
          </Text>
        </Animated.View>
      )}

      {/* Progress bar */}
      {timeline.totalCount > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(260)} style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {timeline.completedCount}/{timeline.totalCount} moments complétés
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {progressPercent}%
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: isDark ? colors.backgroundTertiary : '#F3F4F6' }]}>
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: colors.primary, width: `${progressPercent}%` },
              ]}
            />
          </View>
        </Animated.View>
      )}

      {/* Current time (live mode) */}
      {timeline.isEventDay && (
        <View style={styles.liveIndicator}>
          <View style={[styles.liveDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.liveText, { color: colors.textSecondary }]}>
            LIVE — {timeline.currentTimeFormatted}
          </Text>
        </View>
      )}

      {/* Timeline */}
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.type === 'now_indicator' ? `now-${index}` : item.item?.id || `item-${index}`
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<PartyPopper size={36} color={colors.primary} />}
            title="Aucun moment planifié"
            description="Ajoutez des moments à votre timeline depuis l'onglet Planification."
          />
        }
      />

      {/* Vendor contact sheet */}
      {vendors.length > 0 && (
        <VendorContactSheet ref={bottomSheetRef} vendors={vendors} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontFamily: fontFamily.bold,
  },
  headerSubtitle: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.regular,
    marginTop: 1,
  },
  contactsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownBanner: {
    alignItems: 'center',
    paddingVertical: Layout.spacing.lg,
  },
  countdownText: {
    fontSize: 48,
    fontFamily: fontFamily.bold,
  },
  countdownLabel: {
    fontSize: Layout.fontSize.md,
    fontFamily: fontFamily.medium,
    marginTop: 4,
  },
  progressSection: {
    paddingHorizontal: Layout.spacing.lg,
    marginBottom: Layout.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  progressLabel: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.medium,
  },
  progressPercent: {
    fontSize: Layout.fontSize.sm,
    fontFamily: fontFamily.bold,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Layout.spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 10,
  },
  liveText: {
    fontSize: 12,
    fontFamily: fontFamily.semiBold,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: Layout.spacing.xxl + 60,
    paddingTop: Layout.spacing.sm,
  },
});
