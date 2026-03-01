/**
 * Hooks pour la Timeline Jour J
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  TimelineItem,
  CreateTimelineItemInput,
} from '@/types/eventFeatures';

const QUERY_KEY = 'timeline';

// Helper: on force "any" pour eviter les SelectQueryError.
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Récupérer la timeline
// ============================================

export function useTimeline(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, eventId],
    queryFn: async (): Promise<TimelineItem[]> => {
      if (!eventId) return [];

      const { data, error } = await fromTable('timeline_items')
        .select('*')
        .eq('event_id', eventId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      return (data || []) as TimelineItem[];
    },
    enabled: !!eventId,
  });
}

// ============================================
// Créer un item de timeline
// ============================================

export function useCreateTimelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTimelineItemInput) => {
      // Calculer l'ordre
      const { data: existing } = await fromTable('timeline_items')
        .select('order_index')
        .eq('event_id', input.event_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const orderIndex = existing?.[0]?.order_index ?? -1;

      const { data, error } = await fromTable('timeline_items')
        .insert({
          event_id: input.event_id,
          type: input.type,
          title: input.title,
          description: input.description || null,
          start_time: input.start_time,
          end_time: input.end_time || null,
          duration_minutes: input.duration_minutes || null,
          location: input.location || null,
          responsible_person: input.responsible_person || null,
          notes: input.notes || null,
          is_completed: false,
          order_index: orderIndex + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TimelineItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.event_id],
      });
    },
  });
}

// ============================================
// Mettre à jour un item
// ============================================

export function useUpdateTimelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, updates }: {
      id: string;
      eventId: string;
      updates: Partial<TimelineItem>;
    }) => {
      const { data, error } = await fromTable('timeline_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TimelineItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Marquer comme complété
// ============================================

export function useToggleTimelineItemComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, isCompleted }: {
      id: string;
      eventId: string;
      isCompleted: boolean;
    }) => {
      const { data, error } = await fromTable('timeline_items')
        .update({
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TimelineItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Supprimer un item
// ============================================

export function useDeleteTimelineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await fromTable('timeline_items')
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
// Réordonner les items
// ============================================

export function useReorderTimeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, items }: {
      eventId: string;
      items: { id: string; order_index: number }[];
    }) => {
      // Mettre à jour chaque item
      await Promise.all(
        items.map(({ id, order_index }) =>
          fromTable('timeline_items')
            .update({ order_index })
            .eq('id', id)
        )
      );

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
// Helper: Calculer la durée totale
// ============================================

export function useTimelineDuration(eventId: string | undefined) {
  const { data: items = [] } = useTimeline(eventId);

  if (items.length === 0) return null;

  const sortedItems = [...items].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );

  const firstItem = sortedItems[0];
  const lastItem = sortedItems[sortedItems.length - 1];

  const startTime = firstItem.start_time;
  const endTime = lastItem.end_time || lastItem.start_time;

  // Calculer la durée en minutes
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

  return {
    startTime,
    endTime,
    durationMinutes,
    durationFormatted: `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? durationMinutes % 60 : ''}`,
  };
}
