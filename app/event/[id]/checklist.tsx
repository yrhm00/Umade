/**
 * Écran Checklist Collaborative
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
import Animated, { FadeInDown, FadeInLeft, Layout as ReanimatedLayout } from 'react-native-reanimated';
import {
  Plus,
  Check,
  Circle,
  Clock,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  User,
  Calendar,
} from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  useEventChecklist,
  useChecklistByStatus,
  useCreateChecklistItem,
  useUpdateChecklistStatus,
  useDeleteChecklistItem,
  useApplyChecklistTemplate,
} from '@/hooks/useEventChecklist';
import {
  ChecklistItem,
  ChecklistItemStatus,
  CHECKLIST_PRIORITIES,
} from '@/types/eventFeatures';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';

const STATUS_CONFIG: Record<ChecklistItemStatus, { label: string; color: string; icon: any }> = {
  todo: { label: 'À faire', color: '#6B7280', icon: Circle },
  in_progress: { label: 'En cours', color: '#F59E0B', icon: Clock },
  done: { label: 'Fait', color: '#10B981', icon: Check },
  blocked: { label: 'Bloqué', color: '#EF4444', icon: AlertCircle },
};

export default function ChecklistScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: items = [], isLoading, refetch, isRefetching } = useEventChecklist(eventId);
  const statusData = useChecklistByStatus(eventId);
  const { mutate: createItem, isPending: isCreating } = useCreateChecklistItem();
  const { mutate: updateStatus } = useUpdateChecklistStatus();
  const { mutate: deleteItem } = useDeleteChecklistItem();
  const { mutate: applyTemplate, isPending: isApplyingTemplate } = useApplyChecklistTemplate();

  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<ChecklistItemStatus[]>(['todo', 'in_progress']);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    due_date: '',
  });

  const handleAddItem = useCallback(() => {
    if (!newItem.title) {
      toast.error('Veuillez entrer un titre.');
      return;
    }

    createItem(
      {
        event_id: eventId!,
        title: newItem.title,
        description: newItem.description || undefined,
        priority: newItem.priority,
        category: newItem.category || undefined,
        due_date: newItem.due_date || undefined,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setNewItem({ title: '', description: '', priority: 'medium', category: '', due_date: '' });
          setShowAddForm(false);
        },
      }
    );
  }, [newItem, eventId, createItem]);

  const handleStatusChange = useCallback(
    (item: ChecklistItem, newStatus: ChecklistItemStatus) => {
      updateStatus(
        { id: item.id, eventId: eventId!, status: newStatus },
        {
          onSuccess: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        }
      );
    },
    [eventId, updateStatus]
  );

  const handleDelete = useCallback(
    (item: ChecklistItem) => {
      Alert.alert('Supprimer', `Supprimer "${item.title}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            deleteItem({ id: item.id, eventId: eventId! });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    },
    [eventId, deleteItem]
  );

  const handleApplyTemplate = useCallback(() => {
    Alert.alert(
      'Appliquer un template',
      'Voulez-vous ajouter une checklist pré-remplie pour votre type d\'événement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Mariage', onPress: () => applyTemplate({ eventId: eventId!, eventType: 'wedding' }) },
        { text: 'Anniversaire', onPress: () => applyTemplate({ eventId: eventId!, eventType: 'birthday' }) },
        { text: 'Corporate', onPress: () => applyTemplate({ eventId: eventId!, eventType: 'corporate' }) },
      ]
    );
  }, [eventId, applyTemplate]);

  const toggleSection = (status: ChecklistItemStatus) => {
    setExpandedSections((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const getItemsByStatus = (status: ChecklistItemStatus) => {
    return items.filter((i) => i.status === status);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement de la checklist..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Checklist',
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
        {/* Progress Card */}
        <Animated.View
          entering={FadeInDown}
          style={[styles.progressCard, { backgroundColor: colors.card }]}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Progression</Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {statusData.progress}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${statusData.progress}%` },
              ]}
            />
          </View>
          <View style={styles.progressStats}>
            <Text style={[styles.progressStat, { color: colors.textSecondary }]}>
              {statusData.completedCount}/{statusData.total} tâches complétées
            </Text>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          {(Object.keys(STATUS_CONFIG) as ChecklistItemStatus[]).map((status, index) => {
            const config = STATUS_CONFIG[status];
            const count = getItemsByStatus(status).length;
            const Icon = config.icon;
            return (
              <Animated.View
                key={status}
                entering={FadeInDown.delay(index * 50)}
                style={[styles.quickStatCard, { backgroundColor: colors.card }]}
              >
                <Icon size={18} color={config.color} />
                <Text style={[styles.quickStatCount, { color: colors.text }]}>{count}</Text>
                <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                  {config.label}
                </Text>
              </Animated.View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <PressableScale
            onPress={() => setShowAddForm(!showAddForm)}
            haptic="light"
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Ajouter</Text>
          </PressableScale>

          {items.length === 0 && (
            <PressableScale
              onPress={handleApplyTemplate}
              haptic="light"
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Sparkles size={18} color={colors.primary} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Template</Text>
            </PressableScale>
          )}
        </View>

        {/* Add Form */}
        {showAddForm && (
          <Animated.View
            entering={FadeInDown}
            style={[styles.addForm, { backgroundColor: colors.card }]}
          >
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Titre de la tâche"
              placeholderTextColor={colors.textTertiary}
              value={newItem.title}
              onChangeText={(text) => setNewItem({ ...newItem, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Description (optionnel)"
              placeholderTextColor={colors.textTertiary}
              value={newItem.description}
              onChangeText={(text) => setNewItem({ ...newItem, description: text })}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Catégorie (ex: Lieu, Traiteur...)"
              placeholderTextColor={colors.textTertiary}
              value={newItem.category}
              onChangeText={(text) => setNewItem({ ...newItem, category: text })}
            />

            <Text style={[styles.formLabel, { color: colors.text }]}>Priorité</Text>
            <View style={styles.prioritySelector}>
              {(['low', 'medium', 'high'] as const).map((priority) => {
                const config = CHECKLIST_PRIORITIES[priority];
                return (
                  <Pressable
                    key={priority}
                    onPress={() => setNewItem({ ...newItem, priority })}
                    style={[
                      styles.priorityOption,
                      { borderColor: colors.border },
                      newItem.priority === priority && { backgroundColor: config.color, borderColor: config.color },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: newItem.priority === priority ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {config.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <AnimatedButton
              title="Ajouter la tâche"
              onPress={handleAddItem}
              loading={isCreating}
              fullWidth
            />
          </Animated.View>
        )}

        {/* Sections by Status */}
        {(Object.keys(STATUS_CONFIG) as ChecklistItemStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const sectionItems = getItemsByStatus(status);
          const isExpanded = expandedSections.includes(status);
          const Icon = config.icon;

          if (sectionItems.length === 0) return null;

          return (
            <Animated.View
              key={status}
              entering={FadeInDown}
              layout={ReanimatedLayout.duration(260)}
              style={[styles.section, { backgroundColor: colors.card }]}
            >
              <Pressable
                onPress={() => toggleSection(status)}
                style={styles.sectionHeader}
              >
                <View style={styles.sectionLeft}>
                  <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {config.label}
                  </Text>
                  <View style={[styles.countBadge, { backgroundColor: `${config.color}20` }]}>
                    <Text style={[styles.countText, { color: config.color }]}>
                      {sectionItems.length}
                    </Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={20} color={colors.textSecondary} />
                )}
              </Pressable>

              {isExpanded && (
                <View style={styles.sectionContent}>
                  {sectionItems.map((item, index) => {
                    const priorityConfig = CHECKLIST_PRIORITIES[item.priority];
                    return (
                      <Animated.View
                        key={item.id}
                        entering={FadeInLeft.delay(index * 30)}
                        style={[styles.itemCard, { backgroundColor: colors.background }]}
                      >
                        <View style={styles.itemMain}>
                          <Pressable
                            onPress={() =>
                              handleStatusChange(
                                item,
                                status === 'done' ? 'todo' : 'done'
                              )
                            }
                            style={[
                              styles.checkbox,
                              { borderColor: config.color },
                              status === 'done' && { backgroundColor: config.color },
                            ]}
                          >
                            {status === 'done' && <Check size={14} color="#FFFFFF" />}
                          </Pressable>

                          <View style={styles.itemContent}>
                            <Text
                              style={[
                                styles.itemTitle,
                                { color: colors.text },
                                status === 'done' && styles.completedText,
                              ]}
                            >
                              {item.title}
                            </Text>

                            {item.description && (
                              <Text
                                style={[styles.itemDescription, { color: colors.textSecondary }]}
                                numberOfLines={2}
                              >
                                {item.description}
                              </Text>
                            )}

                            <View style={styles.itemMeta}>
                              {item.category && (
                                <View style={[styles.metaBadge, { backgroundColor: `${colors.primary}20` }]}>
                                  <Text style={[styles.metaText, { color: colors.primary }]}>
                                    {item.category}
                                  </Text>
                                </View>
                              )}
                              <View style={[styles.metaBadge, { backgroundColor: `${priorityConfig.color}20` }]}>
                                <Text style={[styles.metaText, { color: priorityConfig.color }]}>
                                  {priorityConfig.label}
                                </Text>
                              </View>
                              {item.assigned_to && (
                                <View style={styles.assignedBadge}>
                                  <User size={12} color={colors.textTertiary} />
                                </View>
                              )}
                            </View>
                          </View>

                          <PressableScale
                            onPress={() => handleDelete(item)}
                            haptic="light"
                            style={styles.deleteBtn}
                          >
                            <Trash2 size={16} color={colors.error} />
                          </PressableScale>
                        </View>

                        {/* Status Actions */}
                        {status !== 'done' && (
                          <View style={styles.statusActions}>
                            {status !== 'in_progress' && (
                              <Pressable
                                onPress={() => handleStatusChange(item, 'in_progress')}
                                style={[styles.statusBtn, { borderColor: '#F59E0B' }]}
                              >
                                <Clock size={14} color="#F59E0B" />
                                <Text style={[styles.statusBtnText, { color: '#F59E0B' }]}>
                                  En cours
                                </Text>
                              </Pressable>
                            )}
                            {status !== 'blocked' && (
                              <Pressable
                                onPress={() => handleStatusChange(item, 'blocked')}
                                style={[styles.statusBtn, { borderColor: '#EF4444' }]}
                              >
                                <AlertCircle size={14} color="#EF4444" />
                                <Text style={[styles.statusBtnText, { color: '#EF4444' }]}>
                                  Bloqué
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        )}
                      </Animated.View>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          );
        })}

        {/* Empty State */}
        {items.length === 0 && !showAddForm && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune tâche</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Créez votre checklist ou utilisez un template
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: Layout.spacing.lg, paddingBottom: Layout.spacing.xxl },
  progressCard: {
    padding: Layout.spacing.lg,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  progressTitle: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  progressPercent: { fontSize: Layout.fontSize.xl, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 10 },
  progressStats: { marginTop: Layout.spacing.sm },
  progressStat: { fontSize: Layout.fontSize.sm },
  quickStats: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  quickStatCard: {
    flex: 1,
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
  },
  quickStatCount: { fontSize: Layout.fontSize.lg, fontWeight: '700', marginTop: 4 },
  quickStatLabel: { fontSize: 10, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    gap: Layout.spacing.sm,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: Layout.fontSize.sm, fontWeight: '600' },
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
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  formLabel: { fontSize: Layout.fontSize.sm, fontWeight: '600' },
  prioritySelector: { flexDirection: 'row', gap: Layout.spacing.sm },
  priorityOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
  },
  priorityText: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
  section: {
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.lg,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm },
  statusDot: { width: 12, height: 12, borderRadius: 12 },
  sectionTitle: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  countBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radius.full,
  },
  countText: { fontSize: Layout.fontSize.xs, fontWeight: '600' },
  sectionContent: { paddingHorizontal: Layout.spacing.md, paddingBottom: Layout.spacing.md, gap: Layout.spacing.sm },
  itemCard: {
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.md,
  },
  itemMain: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
    marginTop: 2,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: Layout.fontSize.md, fontWeight: '500' },
  completedText: { textDecorationLine: 'line-through', opacity: 0.6 },
  itemDescription: { fontSize: Layout.fontSize.sm, marginTop: 4 },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.spacing.xs, marginTop: Layout.spacing.sm },
  metaBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.radius.full,
  },
  metaText: { fontSize: 10, fontWeight: '500' },
  assignedBadge: { padding: 4 },
  deleteBtn: { padding: Layout.spacing.xs },
  statusActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
    marginLeft: 40,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.radius.md,
    borderWidth: 1,
  },
  statusBtnText: { fontSize: Layout.fontSize.xs },
  emptyState: { alignItems: 'center', paddingVertical: Layout.spacing.xxl },
  emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', marginTop: Layout.spacing.md },
  emptySubtitle: { fontSize: Layout.fontSize.md, marginTop: Layout.spacing.xs, textAlign: 'center' },
});
