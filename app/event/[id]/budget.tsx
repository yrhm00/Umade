/**
 * Écran Budget Tracker
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Check,
  Trash2,
} from 'lucide-react-native';
import { Layout } from '@/constants/Layout';
import { useColors } from '@/hooks/useColors';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PressableScale } from '@/components/ui/PressableScale';
import {
  useBudgetItems,
  useBudgetSummary,
  useCreateBudgetItem,
  useDeleteBudgetItem,
  useMarkBudgetItemPaid,
} from '@/hooks/useBudget';
import {
  BudgetCategory,
  BUDGET_CATEGORIES,
  BudgetItem,
} from '@/types/eventFeatures';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/lib/toast';
import * as Haptics from 'expo-haptics';

export default function BudgetScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();

  const { data: items = [], isLoading, refetch, isRefetching } = useBudgetItems(eventId);
  const summary = useBudgetSummary(eventId);
  const { mutate: createItem, isPending: isCreating } = useCreateBudgetItem();
  const { mutate: deleteItem } = useDeleteBudgetItem();
  const { mutate: markPaid } = useMarkBudgetItemPaid();
  const syncedItems = items.filter((item) => item.source_type === 'booking');
  const customItems = items.filter((item) => item.source_type !== 'booking');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'other' as BudgetCategory,
    estimated_amount: '',
    vendor_name: '',
  });

  const handleAddItem = useCallback(() => {
    if (!newItem.name || !newItem.estimated_amount) {
      toast.error('Veuillez remplir le nom et le montant estimé.');
      return;
    }

    createItem(
      {
        event_id: eventId!,
        name: newItem.name,
        category: newItem.category,
        estimated_amount: parseFloat(newItem.estimated_amount),
        vendor_name: newItem.vendor_name || undefined,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setNewItem({ name: '', category: 'other', estimated_amount: '', vendor_name: '' });
          setShowAddForm(false);
        },
        onError: () => {
          toast.error("Impossible d'ajouter cet élément.");
        },
      }
    );
  }, [newItem, eventId, createItem]);

  const handleDelete = useCallback((item: BudgetItem) => {
    if (item.auto_generated) return;

    Alert.alert(
      'Supprimer',
      `Supprimer "${item.name}" ?`,
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

  const handleMarkPaid = useCallback((item: BudgetItem) => {
    if (item.auto_generated) return;

    const amount = item.actual_amount || item.estimated_amount;
    markPaid(
      { id: item.id, eventId: eventId!, paidAmount: amount },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      }
    );
  }, [eventId, markPaid]);

  const progressPercent = summary.total_estimated > 0
    ? Math.round((summary.total_paid / summary.total_estimated) * 100)
    : 0;

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Chargement du budget..." />;
  }

  const renderBudgetItem = (item: BudgetItem, index: number) => {
    const catInfo = BUDGET_CATEGORIES[item.category as BudgetCategory] || BUDGET_CATEGORIES.other;
    const totalAmount = item.actual_amount || item.estimated_amount || 0;
    const paidAmount = item.paid_amount || 0;
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const isBookingItem = item.source_type === 'booking';
    const categoryLine = [
      catInfo.label,
      item.vendor_name || null,
      isBookingItem ? 'Synchronisé' : null,
    ]
      .filter(Boolean)
      .join(' • ');

    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.delay(200 + index * 50)}
        style={[styles.itemCard, { backgroundColor: colors.card }]}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemLeft}>
            <Text style={styles.itemIcon}>{catInfo.icon}</Text>
            <View style={styles.itemContent}>
              <View style={styles.itemTitleRow}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                {isBookingItem && (
                  <View style={[styles.sourceBadge, { backgroundColor: `${colors.primary}14` }]}>
                    <Text style={[styles.sourceBadgeText, { color: colors.primary }]}>Prestataire</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.itemCategory, { color: colors.textSecondary }]}>
                {categoryLine}
              </Text>
            </View>
          </View>
          <View style={styles.itemRight}>
            <Text style={[styles.itemAmount, { color: colors.text }]}>
              {formatPrice(totalAmount)}
            </Text>
            {(paidAmount > 0 || isBookingItem) && (
              <Text style={[styles.itemMetaAmount, { color: colors.textSecondary }]}>
                Payé {formatPrice(paidAmount)}
                {remainingAmount > 0 ? ` • Reste ${formatPrice(remainingAmount)}` : ''}
              </Text>
            )}
            {item.is_paid && (
              <View style={[styles.paidBadge, { backgroundColor: '#10B98120' }]}>
                <Check size={12} color="#10B981" />
                <Text style={styles.paidText}>Payé</Text>
              </View>
            )}
          </View>
        </View>

        {!isBookingItem && (
          <View style={styles.itemActions}>
            {!item.is_paid && (
              <PressableScale
                onPress={() => handleMarkPaid(item)}
                haptic="light"
                style={[styles.actionButton, { backgroundColor: '#10B98120' }]}
              >
                <Check size={16} color="#10B981" />
                <Text style={[styles.actionText, { color: '#10B981' }]}>Payé</Text>
              </PressableScale>
            )}
            <PressableScale
              onPress={() => handleDelete(item)}
              haptic="light"
              style={[styles.actionButton, { backgroundColor: `${colors.error}20` }]}
            >
              <Trash2 size={16} color={colors.error} />
            </PressableScale>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Budget',
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
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <Animated.View
            entering={FadeInDown.delay(0)}
            style={[styles.summaryCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}20` }]}>
              <Wallet size={20} color={colors.primary} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Budget total</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {formatPrice(summary.total_estimated)}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(50)}
            style={[styles.summaryCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#10B98120' }]}>
              <TrendingDown size={20} color="#10B981" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Payé</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {formatPrice(summary.total_paid)}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(100)}
            style={[styles.summaryCard, { backgroundColor: colors.card }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F59E0B20' }]}>
              <TrendingUp size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Restant</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
              {formatPrice(summary.total_remaining)}
            </Text>
          </Animated.View>
        </View>

        {/* Progress Bar */}
        <Animated.View
          entering={FadeInDown.delay(150)}
          style={[styles.progressContainer, { backgroundColor: colors.card }]}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.text }]}>Progression</Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>{progressPercent}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: `${progressPercent}%` },
              ]}
            />
          </View>
        </Animated.View>

        {/* Add Button */}
        <PressableScale
          onPress={() => setShowAddForm(!showAddForm)}
          haptic="light"
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Ajouter une dépense</Text>
        </PressableScale>

        {syncedItems.length > 0 && (
          <View style={[styles.syncHint, { backgroundColor: colors.card }]}>
            <Text style={[styles.syncHintText, { color: colors.textSecondary }]}>
              Les paiements déjà effectués pour vos prestataires sont ajoutés automatiquement ici.
            </Text>
          </View>
        )}

        {/* Add Form */}
        {showAddForm && (
          <Animated.View
            entering={FadeInDown}
            style={[styles.addForm, { backgroundColor: colors.card }]}
          >
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Nom de la dépense"
              placeholderTextColor={colors.textTertiary}
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Montant estimé (€)"
              placeholderTextColor={colors.textTertiary}
              value={newItem.estimated_amount}
              onChangeText={(text) => setNewItem({ ...newItem, estimated_amount: text })}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Prestataire (optionnel)"
              placeholderTextColor={colors.textTertiary}
              value={newItem.vendor_name}
              onChangeText={(text) => setNewItem({ ...newItem, vendor_name: text })}
            />

            {/* Category Selector */}
            <View style={styles.categoriesGrid}>
              {Object.entries(BUDGET_CATEGORIES).map(([key, { label, icon }]) => (
                <Pressable
                  key={key}
                  onPress={() => setNewItem({ ...newItem, category: key as BudgetCategory })}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.border },
                    newItem.category === key && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={{ fontSize: 14 }}>{icon}</Text>
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: newItem.category === key ? '#FFFFFF' : colors.text },
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

        {/* Budget Items */}
        <View style={styles.itemsList}>
          {syncedItems.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupTitle, { color: colors.text }]}>Prestataires payés</Text>
              {syncedItems.map((item, index) => renderBudgetItem(item, index))}
            </View>
          )}

          {customItems.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupTitle, { color: colors.text }]}>Autres dépenses</Text>
              {customItems.map((item, index) => renderBudgetItem(item, syncedItems.length + index))}
            </View>
          )}

          {items.length === 0 && !showAddForm && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>💰</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune dépense</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Commencez à suivre votre budget
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
  summaryCards: { flexDirection: 'row', gap: Layout.spacing.sm, marginBottom: Layout.spacing.lg },
  summaryCard: {
    flex: 1,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    alignItems: 'center',
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: Layout.spacing.xs },
  summaryLabel: { fontSize: Layout.fontSize.xs, marginBottom: 2 },
  summaryValue: { fontSize: Layout.fontSize.md, fontWeight: '700' },
  progressContainer: { padding: Layout.spacing.lg, borderRadius: Layout.radius.lg, marginBottom: Layout.spacing.lg },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Layout.spacing.sm },
  progressLabel: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  progressPercent: { fontSize: Layout.fontSize.md, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 10 },
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
  syncHint: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.lg,
  },
  syncHintText: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  addForm: { padding: Layout.spacing.lg, borderRadius: Layout.radius.lg, marginBottom: Layout.spacing.lg, gap: Layout.spacing.md },
  input: { paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.md, borderRadius: Layout.radius.md, borderWidth: 1, fontSize: Layout.fontSize.md },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.spacing.sm },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Layout.spacing.sm, paddingVertical: Layout.spacing.xs, borderRadius: Layout.radius.full, borderWidth: 1 },
  categoryChipText: { fontSize: Layout.fontSize.xs },
  itemsList: { gap: Layout.spacing.md },
  group: { gap: Layout.spacing.md },
  groupTitle: { fontSize: Layout.fontSize.md, fontWeight: '700' },
  itemCard: { padding: Layout.spacing.lg, borderRadius: Layout.radius.lg },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Layout.spacing.md },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.md, flex: 1 },
  itemContent: { flex: 1, gap: 4 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.spacing.sm, flexWrap: 'wrap' },
  itemIcon: { fontSize: 24 },
  itemName: { fontSize: Layout.fontSize.md, fontWeight: '600' },
  itemCategory: { fontSize: Layout.fontSize.sm },
  sourceBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: 4,
    borderRadius: Layout.radius.full,
  },
  sourceBadgeText: {
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
  },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { fontSize: Layout.fontSize.lg, fontWeight: '700' },
  itemMetaAmount: { fontSize: Layout.fontSize.xs, marginTop: 4 },
  paidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Layout.spacing.sm, paddingVertical: 2, borderRadius: Layout.radius.full, marginTop: 4 },
  paidText: { fontSize: Layout.fontSize.xs, color: '#10B981', fontWeight: '600' },
  itemActions: { flexDirection: 'row', gap: Layout.spacing.sm },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Layout.spacing.md, paddingVertical: Layout.spacing.sm, borderRadius: Layout.radius.md },
  actionText: { fontSize: Layout.fontSize.sm, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: Layout.spacing.xxl },
  emptyTitle: { fontSize: Layout.fontSize.lg, fontWeight: '600', marginTop: Layout.spacing.md },
  emptySubtitle: { fontSize: Layout.fontSize.md, marginTop: Layout.spacing.xs },
});
