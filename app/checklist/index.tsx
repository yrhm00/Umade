/**
 * Écran de la checklist complète (Phase 10)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout as ReanimatedLayout,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Check,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { PressableScale } from '@/components/ui/PressableScale';
import { Button } from '@/components/ui/Button';
import {
  useChecklistByCategory,
  useUpdateChecklistItem,
  useAddChecklistItem,
  useDeleteChecklistItem,
  getStatusColor,
  getStatusLabel,
} from '@/hooks/useChecklist';
import { ChecklistItem, ChecklistStatus } from '@/types/preferences';
import { goBackOrFallback } from '@/lib/navigation';

export default function ChecklistScreen() {
  const colors = useColors();
  const {
    categories,
    totalItems,
    completedItems,
    progress,
    isLoading,
  } = useChecklistByCategory();
  const { mutate: updateItem } = useUpdateChecklistItem();
  const { mutate: addItem } = useAddChecklistItem();
  const { mutate: deleteItem } = useDeleteChecklistItem();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  const handleBack = () => {
    goBackOrFallback(router);
  };

  const handleToggleItem = (item: ChecklistItem) => {
    const newStatus: ChecklistStatus =
      item.status === 'done' ? 'todo' : 'done';
    updateItem({ itemId: item.id, updates: { status: newStatus } });
  };

  const handleToggleCategory = (categoryName: string) => {
    setExpandedCategory(
      expandedCategory === categoryName ? null : categoryName
    );
  };

  const handleAddItem = () => {
    if (newItemTitle.trim() && newItemCategory.trim()) {
      addItem({
        category: newItemCategory.trim(),
        title: newItemTitle.trim(),
        description: null,
        status: 'todo',
        provider_id: null,
        booking_id: null,
        display_order: totalItems,
        due_date: null,
        completed_at: null,
      });
      setNewItemTitle('');
      setNewItemCategory('');
      setShowAddForm(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteItem(itemId);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <PressableScale onPress={handleBack} haptic="light">
            <View style={[styles.backButton, { backgroundColor: colors.card }]}>
              <ChevronLeft size={24} color={colors.text} />
            </View>
          </PressableScale>
          <Text style={[styles.title, { color: colors.text }]}>Checklist</Text>
          <PressableScale
            onPress={() => setShowAddForm(true)}
            haptic="light"
          >
            <View style={[styles.addButton, { backgroundColor: `${colors.primary}15` }]}>
              <Plus size={24} color={colors.primary} />
            </View>
          </PressableScale>
        </View>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {completedItems} sur {totalItems} éléments
            </Text>
            <Text style={[styles.progressPercentage, { color: colors.primary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: colors.success },
              ]}
            />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {categories.map((category, catIndex) => (
            <Animated.View
              key={category.name}
              entering={FadeInDown.delay(catIndex * 50)}
              layout={ReanimatedLayout.duration(260)}
              style={[styles.categoryCard, { backgroundColor: colors.card }]}
            >
              <Pressable
                onPress={() => handleToggleCategory(category.name)}
                style={styles.categoryHeader}
              >
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
                    <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                      {category.completedCount}/{category.totalCount} complétés
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryProgress}>
                  <View style={[styles.categoryProgressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.categoryProgressFill,
                        {
                          width: `${
                            category.totalCount > 0
                              ? (category.completedCount / category.totalCount) * 100
                              : 0
                          }%`,
                          backgroundColor: colors.success,
                        },
                      ]}
                    />
                  </View>
                </View>
              </Pressable>

              {expandedCategory === category.name && (
                <Animated.View
                  entering={FadeInDown.duration(260)}
                  style={[styles.categoryItems, { borderTopColor: colors.border }]}
                >
                  {category.items.map((item, index) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggleItem(item)}
                      onDelete={() => handleDeleteItem(item.id)}
                      index={index}
                      colors={colors}
                    />
                  ))}
                </Animated.View>
              )}
            </Animated.View>
          ))}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Add Item Form */}
        {showAddForm && (
          <View style={styles.addFormOverlay}>
            <Pressable
              style={styles.addFormBackdrop}
              onPress={() => setShowAddForm(false)}
            />
            <Animated.View
              entering={FadeInDown.duration(260)}
              style={[styles.addFormCard, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.addFormTitle, { color: colors.text }]}>Ajouter un élément</Text>
              <TextInput
                style={[styles.addFormInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Catégorie (ex: Lieu, Musique...)"
                placeholderTextColor={colors.textTertiary}
                value={newItemCategory}
                onChangeText={setNewItemCategory}
              />
              <TextInput
                style={[styles.addFormInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="Titre de l'élément"
                placeholderTextColor={colors.textTertiary}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
              />
              <View style={styles.addFormButtons}>
                <Button
                  title="Annuler"
                  variant="outline"
                  onPress={() => setShowAddForm(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Ajouter"
                  onPress={handleAddItem}
                  disabled={!newItemTitle.trim() || !newItemCategory.trim()}
                  style={{ flex: 1 }}
                />
              </View>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle: () => void;
  onDelete: () => void;
  index: number;
  colors: ReturnType<typeof useColors>;
}

function ChecklistItemRow({
  item,
  onToggle,
  onDelete,
  index,
  colors,
}: ChecklistItemRowProps) {
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
      entering={FadeInRight.delay(index * 30)}
      style={[styles.itemRow, { borderBottomColor: colors.border }]}
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
        <View style={styles.itemMeta}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}20` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
          {item.provider?.business_name && (
            <Text style={[styles.providerName, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.provider.business_name}
            </Text>
          )}
        </View>
      </View>

      <PressableScale onPress={onDelete} haptic="light">
        <View style={[styles.deleteButton, { backgroundColor: `${colors.error}10` }]}>
          <Trash2 size={18} color={colors.error} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: Layout.fontSize.sm,
  },
  progressPercentage: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
    paddingTop: 0,
  },
  categoryCard: {
    borderRadius: Layout.radius.xl,
    marginBottom: Layout.spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.spacing.lg,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: Layout.fontSize.xs,
  },
  categoryProgress: {
    width: 60,
  },
  categoryProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryItems: {
    borderTopWidth: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
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
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  providerName: {
    fontSize: Layout.fontSize.xs,
    flex: 1,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: 100,
  },
  addFormOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  addFormBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  addFormCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Layout.spacing.xl,
    paddingBottom: 40,
  },
  addFormTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '700',
    marginBottom: Layout.spacing.lg,
    textAlign: 'center',
  },
  addFormInput: {
    borderRadius: Layout.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Layout.fontSize.md,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
  },
  addFormButtons: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
  },
});
