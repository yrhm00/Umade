/**
 * Hooks pour la gestion des invités
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Guest,
  GuestListSummary,
  GuestStatus,
  GuestCategory,
  MealPreference,
  CreateGuestInput,
  GUEST_CATEGORIES,
  MEAL_PREFERENCES,
} from '@/types/eventFeatures';

const QUERY_KEY = 'guests';

// Helper: on force "any" pour eviter les SelectQueryError.
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Récupérer tous les invités
// ============================================

export function useGuests(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, eventId],
    queryFn: async (): Promise<Guest[]> => {
      if (!eventId) return [];

      const { data, error } = await fromTable('guests')
        .select('*')
        .eq('event_id', eventId)
        .order('last_name', { ascending: true });

      if (error) throw error;
      return (data || []) as Guest[];
    },
    enabled: !!eventId,
  });
}

// ============================================
// Récupérer le résumé des invités
// ============================================

export function useGuestSummary(eventId: string | undefined) {
  const { data: guests = [] } = useGuests(eventId);

  const summary: GuestListSummary = {
    total: guests.length,
    confirmed: 0,
    declined: 0,
    pending: 0,
    maybe: 0,
    with_plus_one: 0,
    total_attending: 0,
    by_category: {} as Record<GuestCategory, number>,
    by_meal: {} as Record<MealPreference, number>,
  };

  // Initialiser catégories et repas
  Object.keys(GUEST_CATEGORIES).forEach((cat) => {
    summary.by_category[cat as GuestCategory] = 0;
  });
  Object.keys(MEAL_PREFERENCES).forEach((meal) => {
    summary.by_meal[meal as MealPreference] = 0;
  });

  guests.forEach((guest) => {
    // Par statut
    switch (guest.status) {
      case 'confirmed':
        summary.confirmed++;
        summary.total_attending++;
        if (guest.plus_one && guest.plus_one_confirmed) {
          summary.total_attending++;
        }
        break;
      case 'declined':
        summary.declined++;
        break;
      case 'maybe':
        summary.maybe++;
        break;
      default:
        summary.pending++;
    }

    // Plus one
    if (guest.plus_one) {
      summary.with_plus_one++;
    }

    // Par catégorie
    if (summary.by_category[guest.category]) {
      summary.by_category[guest.category]++;
    }

    // Par préférence repas (seulement confirmés)
    if (guest.status === 'confirmed' && summary.by_meal[guest.meal_preference]) {
      summary.by_meal[guest.meal_preference]++;
    }
  });

  return summary;
}

// ============================================
// Récupérer les invités par statut
// ============================================

export function useGuestsByStatus(eventId: string | undefined, status: GuestStatus) {
  const { data: guests = [] } = useGuests(eventId);
  return guests.filter((g) => g.status === status);
}

// ============================================
// Créer un invité
// ============================================

export function useCreateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGuestInput) => {
      const { data, error } = await fromTable('guests')
        .insert({
          event_id: input.event_id,
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email || null,
          phone: input.phone || null,
          status: 'pending',
          category: input.category || 'other',
          plus_one: input.plus_one || false,
          plus_one_name: null,
          plus_one_confirmed: false,
          meal_preference: input.meal_preference || 'standard',
          dietary_notes: input.dietary_notes || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.event_id],
      });
    },
  });
}

// ============================================
// Mettre à jour un invité
// ============================================

export function useUpdateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, updates }: {
      id: string;
      eventId: string;
      updates: Partial<Guest>;
    }) => {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Si le statut passe à confirmé, enregistrer la date RSVP
      if (updates.status === 'confirmed' || updates.status === 'declined') {
        updateData.rsvp_date = new Date().toISOString();
      }

      const { data, error } = await fromTable('guests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Mettre à jour le statut RSVP
// ============================================

export function useUpdateGuestStatus() {
  const { mutateAsync: updateGuest } = useUpdateGuest();

  return useMutation({
    mutationFn: async ({ id, eventId, status }: {
      id: string;
      eventId: string;
      status: GuestStatus;
    }) => {
      return updateGuest({ id, eventId, updates: { status } });
    },
  });
}

// ============================================
// Supprimer un invité
// ============================================

export function useDeleteGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await fromTable('guests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Import en masse (CSV/liste)
// ============================================

export function useBulkCreateGuests() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, guests }: {
      eventId: string;
      guests: Omit<CreateGuestInput, 'event_id'>[];
    }) => {
      const guestsToInsert = guests.map((g) => ({
        event_id: eventId,
        first_name: g.first_name,
        last_name: g.last_name,
        email: g.email || null,
        phone: g.phone || null,
        status: 'pending',
        category: g.category || 'other',
        plus_one: g.plus_one || false,
        meal_preference: g.meal_preference || 'standard',
        dietary_notes: g.dietary_notes || null,
        notes: g.notes || null,
      }));

      const { data, error } = await fromTable('guests')
        .insert(guestsToInsert)
        .select();

      if (error) throw error;
      return data as Guest[];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Assigner à une table
// ============================================

export function useAssignGuestToTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guestId, eventId, tableId, seatNumber }: {
      guestId: string;
      eventId: string;
      tableId: string | null;
      seatNumber?: number;
    }) => {
      const { data, error } = await fromTable('guests')
        .update({
          table_id: tableId,
          seat_number: seatNumber || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', guestId)
        .select()
        .single();

      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['tables', variables.eventId],
      });
    },
  });
}
