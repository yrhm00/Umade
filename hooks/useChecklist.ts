/**
 * Hook pour gérer la checklist utilisateur (Phase 10)
 */

import { supabase } from '@/lib/supabase';
import { ChecklistItem, ChecklistStatus, ChecklistCategory } from '@/types/preferences';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuth } from './useAuth';

const CHECKLIST_KEY = 'checklist';

// Helper: on force "any" pour eviter les SelectQueryError (relations, selects imbriques).
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Récupérer la checklist
// ============================================

export function useChecklist() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [CHECKLIST_KEY, userId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      if (!userId) return [];

      const { data, error } = await fromTable('user_checklist_items')
        .select(`
          *,
          provider:provider_id (
            id,
            business_name
          ),
          booking:booking_id (
            id,
            status
          )
        `)
        .eq('user_id', userId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data as ChecklistItem[]) || [];
    },
    enabled: !!userId,
  });
}

// ============================================
// Checklist groupée par catégorie
// ============================================

export function useChecklistByCategory() {
  const { data: items = [], isLoading } = useChecklist();

  const categories: ChecklistCategory[] = [];
  const categoryMap = new Map<string, ChecklistItem[]>();

  items.forEach((item) => {
    const existing = categoryMap.get(item.category) || [];
    categoryMap.set(item.category, [...existing, item]);
  });

  categoryMap.forEach((items, name) => {
    const completedCount = items.filter((i) => i.status === 'done').length;
    categories.push({
      name,
      icon: getCategoryIcon(name),
      items,
      completedCount,
      totalCount: items.length,
    });
  });

  // Calculate overall progress
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.status === 'done').length;
  const inProgressItems = items.filter((i) => i.status === 'in_progress').length;

  return {
    categories,
    totalItems,
    completedItems,
    inProgressItems,
    progress: totalItems > 0 ? completedItems / totalItems : 0,
    isLoading,
  };
}

// ============================================
// Mettre à jour le statut d'un item
// ============================================

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: string;
      updates: Partial<ChecklistItem>;
    }) => {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // If marking as done, set completed_at
      if (updates.status === 'done') {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status === 'todo') {
        updateData.completed_at = null;
      }

      const { data, error } = await fromTable('user_checklist_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ itemId, updates }) => {
      // Haptic feedback
      if (updates.status === 'done') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Optimistic update
      await queryClient.cancelQueries({ queryKey: [CHECKLIST_KEY, userId] });

      const previousItems = queryClient.getQueryData<ChecklistItem[]>([
        CHECKLIST_KEY,
        userId,
      ]);

      if (previousItems) {
        queryClient.setQueryData<ChecklistItem[]>(
          [CHECKLIST_KEY, userId],
          previousItems.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          )
        );
      }

      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData([CHECKLIST_KEY, userId], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [CHECKLIST_KEY] });
    },
  });
}

// ============================================
// Ajouter un item à la checklist
// ============================================

export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (item: Omit<ChecklistItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await fromTable('user_checklist_items')
        .insert({
          user_id: userId,
          ...item,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      queryClient.invalidateQueries({ queryKey: [CHECKLIST_KEY] });
    },
  });
}

// ============================================
// Supprimer un item
// ============================================

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await fromTable('user_checklist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHECKLIST_KEY] });
    },
  });
}

// ============================================
// Lier un item à un provider/booking
// ============================================

export function useLinkChecklistItem() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemId,
      providerId,
      bookingId,
    }: {
      itemId: string;
      providerId?: string;
      bookingId?: string;
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };

      if (providerId !== undefined) {
        updates.provider_id = providerId;
        updates.status = 'in_progress';
      }

      if (bookingId !== undefined) {
        updates.booking_id = bookingId;
        updates.status = 'done';
        updates.completed_at = new Date().toISOString();
      }

      const { data, error } = await fromTable('user_checklist_items')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHECKLIST_KEY] });
    },
  });
}

// ============================================
// Helpers
// ============================================

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Lieu': '🏰',
    'Photo/Vidéo': '📸',
    'Traiteur': '🍽️',
    'Musique': '🎵',
    'Décoration': '💐',
    'Tenue': '👗',
    'Administratif': '📋',
    'Animation': '🎉',
    'Cérémonie': '⛪',
    'Technique': '🎤',
  };
  return icons[category] || '📌';
}

export function getStatusColor(status: ChecklistStatus): string {
  switch (status) {
    case 'done':
      return '#10B981'; // Green
    case 'in_progress':
      return '#F59E0B'; // Orange
    case 'todo':
    default:
      return '#9CA3AF'; // Gray
  }
}

export function getStatusLabel(status: ChecklistStatus): string {
  switch (status) {
    case 'done':
      return 'Réservé';
    case 'in_progress':
      return 'En cours';
    case 'todo':
    default:
      return 'À faire';
  }
}
