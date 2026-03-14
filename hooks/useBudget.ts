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

type BookingBudgetRow = {
  id: string;
  event_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  quote_amount?: number | null;
  total_price?: number | null;
  deposit_paid_amount?: number | null;
  balance_paid_amount?: number | null;
  payment_status?: string | null;
  providers?: {
    business_name?: string | null;
    categories?: {
      name?: string | null;
      slug?: string | null;
    } | null;
  } | null;
  services?: {
    name?: string | null;
  } | null;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function inferBudgetCategory(label: string | null | undefined): BudgetCategory {
  const normalized = (label || '').toLowerCase();

  if (normalized.includes('photo') || normalized.includes('video')) return 'photography';
  if (normalized.includes('music') || normalized.includes('musique') || normalized.includes('dj')) return 'music';
  if (normalized.includes('fleur')) return 'flowers';
  if (normalized.includes('deco')) return 'decoration';
  if (normalized.includes('traiteur') || normalized.includes('catering') || normalized.includes('repas')) {
    return 'catering';
  }
  if (normalized.includes('lieu') || normalized.includes('salle') || normalized.includes('venue')) return 'venue';
  if (normalized.includes('tenue') || normalized.includes('robe') || normalized.includes('costume')) return 'attire';
  if (normalized.includes('transport')) return 'transportation';
  if (normalized.includes('invitation') || normalized.includes('faire-part')) return 'invitations';
  if (normalized.includes('cadeau') || normalized.includes('gift')) return 'gifts';

  return 'other';
}

function buildBookingBudgetItems(eventId: string, bookings: BookingBudgetRow[]): BudgetItem[] {
  const items: BudgetItem[] = [];

  bookings.forEach((booking) => {
    const totalAmount = roundMoney(
      Math.max(toNumber(booking.quote_amount), toNumber(booking.total_price))
    );
    const paidAmount = roundMoney(
      toNumber(booking.deposit_paid_amount) + toNumber(booking.balance_paid_amount)
    );

    if (paidAmount <= 0) return;

    const providerName = booking.providers?.business_name?.trim() || 'Prestataire';
    const serviceName = booking.services?.name?.trim() || null;
    const categoryLabel =
      booking.providers?.categories?.slug ||
      booking.providers?.categories?.name ||
      serviceName;
    const category = inferBudgetCategory(categoryLabel);
    const effectiveTotal = totalAmount > 0 ? totalAmount : paidAmount;

    items.push({
      id: `booking:${booking.id}`,
      event_id: eventId,
      category,
      name: providerName,
      estimated_amount: effectiveTotal,
      actual_amount: effectiveTotal,
      paid_amount: paidAmount,
      vendor_name: serviceName,
      notes: null,
      due_date: null,
      is_paid: booking.payment_status === 'paid' || paidAmount >= effectiveTotal,
      created_at: booking.created_at || new Date().toISOString(),
      updated_at: booking.updated_at || booking.created_at || new Date().toISOString(),
      source_type: 'booking',
      source_booking_id: booking.id,
      auto_generated: true,
    });
  });

  return items.sort((a, b) => b.paid_amount - a.paid_amount);
}

// ============================================
// Récupérer les items du budget
// ============================================

export function useBudgetItems(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'items', eventId],
    queryFn: async (): Promise<BudgetItem[]> => {
      if (!eventId) return [];

      const [budgetResult, bookingResult] = await Promise.all([
        fromTable('budget_items')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false }),
        fromTable('bookings')
          .select(`
            id,
            event_id,
            created_at,
            updated_at,
            quote_amount,
            total_price,
            deposit_paid_amount,
            balance_paid_amount,
            payment_status,
            providers (
              business_name,
              categories:category_id (
                name,
                slug
              )
            ),
            services (
              name
            )
          `)
          .eq('event_id', eventId)
          .neq('status', 'cancelled'),
      ]);

      if (budgetResult.error) throw budgetResult.error;
      if (bookingResult.error) throw bookingResult.error;

      const manualItems = ((budgetResult.data || []) as BudgetItem[]).map((item) => ({
        ...item,
        source_type: 'manual' as const,
        source_booking_id: null,
        auto_generated: false,
      }));
      const bookingItems = buildBookingBudgetItems(
        eventId,
        (bookingResult.data || []) as BookingBudgetRow[]
      );

      return [...bookingItems, ...manualItems];
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

  summary.total_remaining = Math.max(summary.total_actual - summary.total_paid, 0);

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
