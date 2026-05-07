/**
 * Écran Timeline Jour J
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import {
  Plus,
  Clock,
  MapPin,
  User,
  Check,
  Trash2,
  GripVertical,
} from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  useTimeline,
  useCreateTimelineItem,
  useToggleTimelineItemComplete,
  useDeleteTimelineItem,
  useTimelineDuration,
} from '@/hooks/useTimeline';
import {
  TimelineItem,
  TimelineItemType,
  TIMELINE_ITEM_TYPES,
} from '@/types/eventFeatures';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';

export default function TimelineScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: items = [], isLoading, refetch, isRefetching } = useTimeline(eventId);
  const duration = useTimelineDuration(eventId);
  const { mutate: createItem, isPending: isCreating } = useCreateTimelineItem();
  const { mutate: toggleComplete } = useToggleTimelineItemComplete();
  const { mutate: deleteItem } = useDeleteTimelineItem();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    type: 'other' as TimelineItemType,
    start_time: '',
    end_time: '',
    location: '',
    responsible_person: '',
  });

  const handleAddItem = useCallback(() => {
    if (!newItem.title || !newItem.start_time) {
      toast.error('Veuillez remplir le titre et l\'heure de début.');
      return;
    }

    createItem(
      {
        event_id: eventId!,
        title: newItem.title,
        type: newItem.type,
        start_time: newItem.start_time,
        end_time: newItem.end_time || undefined,
        location: newItem.location || undefined,
        responsible_person: newItem.responsible_person || undefined,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setNewItem({ title: '', type: 'other', start_time: '', end_time: '', location: '', responsible_person: '' });
          setShowAddForm(false);
        },
      }
    );
  }, [newItem, eventId, createItem]);

  const handleToggleComplete = useCallback((item: TimelineItem) => {
    toggleComplete(
      { id: item.id, eventId: eventId!, isCompleted: !item.is_completed },
      {
        onSuccess: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }
    );
  }, [eventId, toggleComplete]);

  const handleDelete = useCallback((item: TimelineItem) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${item.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteItem({ id: item.id, eventId: eventId! });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [eventId, deleteItem]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement de la timeline..." />;
  }

  const completedCount = items.filter((i) => i.is_completed).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Timeline Jour J',
          headerStyle: { backgroundColor: colors.backgroundSecondary },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Duration Summary */}
        {duration && (
          <Animated.View
            entering={FadeInDown}
            style={[styles.durationCard, { backgroundColor: colors.card }]}
          >
            <Clock size={24} color={colors.primary} />
            <View>
              <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>Durée totale</Text>
              <Text style={[styles.durationValue, { color: colors.text }]}>
                {duration.startTime} - {duration.endTime} ({duration.durationFormatted})
              </Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressText, { color: colors.primary }]}>
                {completedCount}/{items.length}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Add Button */}
        <PressableScale
          onPress={() => setShowAddForm(!showAddForm)}
          haptic="light"
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ajouter un moment</Text>
        </PressableScale>

        {/* Add Form */}
        {showAddForm && (
          <Animated.View
            entering={FadeInDown}
            style={[styles.addForm, { backgroundColor: colors.card }]}
          >
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Titre du moment"
              placeholderTextColor={colors.textTertiary}
              value={newItem.title}
              onChangeText={(text) => setNewItem({ ...newItem, title: text })}
            />

            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Début (HH:MM)"
                placeholderTextColor={colors.textTertiary}
                value={newItem.start_time}
                onChangeText={(text) => setNewItem({ ...newItem, start_time: text })}
              />
              <TextInput
                style={[styles.input, styles.timeInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Fin (HH:MM)"
                placeholderTextColor={colors.textTertiary}
                value={newItem.end_time}
                onChangeText={(text) => setNewItem({ ...newItem, end_time: text })}
              />
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Lieu (optionnel)"
              placeholderTextColor={colors.textTertiary}
              value={newItem.location}
              onChangeText={(text) => setNewItem({ ...newItem, location: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Responsable (optionnel)"
              placeholderTextColor={colors.textTertiary}
              value={newItem.responsible_person}
              onChangeText={(text) => setNewItem({ ...newItem, responsible_person: text })}
            />

            {/* Type Selector */}
            <View style={styles.typesGrid}>
              {Object.entries(TIMELINE_ITEM_TYPES).map(([key, { label, icon }]) => (
                <Pressable
                  key={key}
                  onPress={() => setNewItem({ ...newItem, type: key as TimelineItemType })}
                  style={[
                    styles.typeChip,
                    { borderColor: colors.border },
                    newItem.type === key && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{icon}</Text>
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: newItem.type === key ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AnimatedButton
              title="Ajouter"
              onPress={handleAddItem}
              loading={isCreating}
              fullWidth
            />
          </Animated.View>
        )}

        {/* Timeline Items */}
        <View style={styles.timeline}>
          {items.map((item, index) => {
            const typeInfo = TIMELINE_ITEM_TYPES[item.type] || TIMELINE_ITEM_TYPES.other;
            const isLast = index === items.length - 1;

            return (
              <Animated.View
                key={item.id}
                entering={FadeInLeft.delay(index * 50)}
                style={styles.timelineItem}
              >
                {/* Time */}
                <View style={styles.timeColumn}>
                  <Text style={[styles.timeText, { color: colors.primary }]}>
                    {item.start_time}
                  </Text>
                  {item.end_time && (
                    <Text style={[styles.timeEndText, { color: colors.textTertiary }]}>
                      {item.end_time}
                    </Text>
                  )}
                </View>

                {/* Line */}
                <View style={styles.lineColumn}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: item.is_completed ? '#10B981' : typeInfo.color },
                    ]}
                  >
                    {item.is_completed && <Check size={12} color="#FFFFFF" />}
                  </View>
                  {!isLast && (
                    <View style={[styles.line, { backgroundColor: colors.border }]} />
                  )}
                </View>

                {/* Content */}
                <View
                  style={[
                    styles.contentCard,
                    { backgroundColor: colors.card },
                    item.is_completed && styles.completedCard,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>{typeInfo.icon}</Text>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.text },
                        item.is_completed && styles.completedText,
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>

                  {item.location && (
                    <View style={styles.cardRow}>
                      <MapPin size={14} color={colors.textTertiary} />
                      <Text style={[styles.cardRowText, { color: colors.textSecondary }]}>
                        {item.location}
                      </Text>
                    </View>
                  )}

                  {item.responsible_person && (
                    <View style={styles.cardRow}>
                      <User size={14} color={colors.textTertiary} />
                      <Text style={[styles.cardRowText, { color: colors.textSecondary }]}>
                        {item.responsible_person}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardActions}>
                    <PressableScale
                      onPress={() => handleToggleComplete(item)}
                      haptic="light"
                      style={[
                        styles.actionBtn,
                        { backgroundColor: item.is_completed ? '#10B98120' : `${colors.primary}20` },
                      ]}
                    >
                      <Check size={16} color={item.is_completed ? '#10B981' : colors.primary} />
                      <Text style={{ color: item.is_completed ? '#10B981' : colors.primary, fontSize: Layout.fontSize.sm }}>
                        {item.is_completed ? 'Fait' : 'Marquer fait'}
                      </Text>
                    </PressableScale>

                    <PressableScale
                      onPress={() => handleDelete(item)}
                      haptic="light"
                      style={[styles.actionBtn, { backgroundColor: `${colors.error}20` }]}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </PressableScale>
                  </View>
                </View>
              </Animated.View>
            );
          })}

          {items.length === 0 && !showAddForm && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>⏰</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun moment planifié</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Créez le planning de votre journée
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: Layout.spacing.lg, paddingBottom: Layout.spacing.xxl },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  durationLabel: { fontSize: Layout.fontSize.sm },
  durationValue: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  progressInfo: { marginLeft: 'auto' },
  progressText: { fontSize: Layout.fontSize.lg, fontWeight: '700' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  addButtonText: { color: '#FFFFFF', fontSize: Layout.fontSize.md, fontWeight: '600' },
  addForm: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
    gap: Layout.spacing.md,
  },
  input: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
    fontSize: Layout.fontSize.md,
  },
  timeRow: { flexDirection: 'row', gap: Layout.spacing.sm },
  timeInput: { flex: 1 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.spacing.sm },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.full,
    borderWidth: 1,
  },
  typeChipText: { fontSize: Layout.fontSize.xs },
  timeline: { marginTop: Layout.spacing.md },
  timelineItem: { flexDirection: 'row', marginBottom: Layout.spacing.lg },
  timeColumn: { width: 50, alignItems: 'flex-end', paddingRight: Layout.spacing.sm },
  timeText: { fontSize: Layout.fontSize.sm, fontWeight: '600' },
  timeEndText: { fontSize: Layout.fontSize.xs },
  lineColumn: { width: 30, alignItems: 'center' },
  dot: { width: 24, height: 24, borderRadius: 18, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  line: { width: 2, flex: 1, marginTop: 4 },
  contentCard: { flex: 1, padding: Layout.spacing.md, borderRadius: Layout.radius.lg, marginLeft: Layout.spacing.sm },
  completedCard: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm, marginBottom: Layout.spacing.sm },
  cardIcon: { fontSize: 20 },
  cardTitle: { fontSize: Layout.fontSize.md, fontWeight: '600', flex: 1 },
  completedText: { textDecorationLine: 'line-through' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm, marginBottom: 4 },
  cardRowText: { fontSize: Layout.fontSize.sm },
  cardActions: { flexDirection: 'row', gap: Layout.spacing.sm, marginTop: Layout.spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.md,
  },
  emptyState: { alignItems: 'center', paddingVertical: Layout.spacing.xxl },
  emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', marginTop: Layout.spacing.md },
  emptySubtitle: { fontSize: Layout.fontSize.md, marginTop: Layout.spacing.xs },
});
