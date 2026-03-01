/**
 * Hooks pour le Budget Tracker
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  BudgetItem,
  BudgetSummary,
  BudgetCategory,
  CreateBudgetItemInput,
  BUDGET_CATEGORIES,
} from '@/types/eventFeatures';

const QUERY_KEY = 'budget';

// Helper: on force "any" pour eviter les SelectQueryError quand les types Supabase
// n'arrivent pas a inferrer (relations, selects imbriques, etc).
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Récupérer les items du budget
// ============================================

export function useBudgetItems(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'items', eventId],
    queryFn: async (): Promise<BudgetItem[]> => {
      if (!eventId) return [];

      const { data, error } = await fromTable('budget_items')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as BudgetItem[];
    },
    enabled: !!eventId,
  });
}

// ============================================
// Récupérer le résumé du budget
// ============================================

export function useBudgetSummary(eventId: string | undefined) {
  const { data: items = [] } = useBudgetItems(eventId);

  const summary: BudgetSummary = {
    total_estimated: 0,
    total_actual: 0,
    total_paid: 0,
    total_remaining: 0,
    by_category: {} as Record<BudgetCategory, { estimated: number; actual: number; paid: number }>,
  };

  // Initialiser toutes les catégories
  Object.keys(BUDGET_CATEGORIES).forEach((cat) => {
    summary.by_category[cat as BudgetCategory] = { estimated: 0, actual: 0, paid: 0 };
  });

  // Calculer les totaux
  items.forEach((item) => {
    summary.total_estimated += item.estimated_amount || 0;
    summary.total_actual += item.actual_amount || item.estimated_amount || 0;
    summary.total_paid += item.paid_amount || 0;

    const cat = item.category as BudgetCategory;
    if (summary.by_category[cat]) {
      summary.by_category[cat].estimated += item.estimated_amount || 0;
      summary.by_category[cat].actual += item.actual_amount || item.estimated_amount || 0;
      summary.by_category[cat].paid += item.paid_amount || 0;
    }
  });

  summary.total_remaining = summary.total_actual - summary.total_paid;

  return summary;
}

// ============================================
// Créer un item de budget
// ============================================

export function useCreateBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBudgetItemInput) => {
      const { data, error } = await fromTable('budget_items')
        .insert({
          event_id: input.event_id,
          category: input.category,
          name: input.name,
          estimated_amount: input.estimated_amount,
          actual_amount: input.actual_amount || null,
          paid_amount: 0,
          vendor_name: input.vendor_name || null,
          notes: input.notes || null,
          due_date: input.due_date || null,
          is_paid: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BudgetItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'items', variables.event_id],
      });
    },
  });
}

// ============================================
// Mettre à jour un item de budget
// ============================================

export function useUpdateBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, updates }: {
      id: string;
      eventId: string;
      updates: Partial<BudgetItem>;
    }) => {
      const { data, error } = await fromTable('budget_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BudgetItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'items', variables.eventId],
      });
    },
  });
}

// ============================================
// Supprimer un item de budget
// ============================================

export function useDeleteBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await fromTable('budget_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'items', variables.eventId],
      });
    },
  });
}

// ============================================
// Marquer comme payé
// ============================================

export function useMarkBudgetItemPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, paidAmount }: {
      id: string;
      eventId: string;
      paidAmount: number;
    }) => {
      const { data, error } = await fromTable('budget_items')
        .update({
          paid_amount: paidAmount,
          is_paid: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BudgetItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'items', variables.eventId],
      });
    },
  });
}
