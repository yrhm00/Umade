/**
 * Hooks pour la Checklist Collaborative
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  ChecklistItem,
  ChecklistItemStatus,
  CreateChecklistItemInput,
} from '@/types/eventFeatures';
import { useAuth } from './useAuth';

const QUERY_KEY = 'eventChecklist';

// Helper: on force "any" pour eviter les SelectQueryError.
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Récupérer la checklist
// ============================================

export function useEventChecklist(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, eventId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      if (!eventId) return [];

      const { data, error } = await fromTable('event_checklist')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return (data || []) as ChecklistItem[];
    },
    enabled: !!eventId,
  });
}

// ============================================
// Récupérer par statut
// ============================================

export function useChecklistByStatus(eventId: string | undefined) {
  const { data: items = [] } = useEventChecklist(eventId);

  return {
    todo: items.filter((i) => i.status === 'todo'),
    inProgress: items.filter((i) => i.status === 'in_progress'),
    done: items.filter((i) => i.status === 'done'),
    blocked: items.filter((i) => i.status === 'blocked'),
    total: items.length,
    completedCount: items.filter((i) => i.status === 'done').length,
    progress: items.length > 0
      ? Math.round((items.filter((i) => i.status === 'done').length / items.length) * 100)
      : 0,
  };
}

// ============================================
// Créer un item
// ============================================

export function useCreateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateChecklistItemInput) => {
      // Calculer l'ordre
      const { data: existing } = await fromTable('event_checklist')
        .select('order_index')
        .eq('event_id', input.event_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const orderIndex = (existing as any)?.[0]?.order_index ?? -1;

      const { data, error } = await fromTable('event_checklist')
        .insert({
          event_id: input.event_id,
          title: input.title,
          description: input.description || null,
          status: 'todo',
          priority: input.priority || 'medium',
          due_date: input.due_date || null,
          assigned_to: input.assigned_to || null,
          category: input.category || null,
          order_index: orderIndex + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ChecklistItem;
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

export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, updates }: {
      id: string;
      eventId: string;
      updates: Partial<ChecklistItem>;
    }) => {
      const { data, error } = await fromTable('event_checklist')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Changer le statut
// ============================================

export function useUpdateChecklistStatus() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ id, eventId, status }: {
      id: string;
      eventId: string;
      status: ChecklistItemStatus;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Si complété, enregistrer qui et quand
      if (status === 'done') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = userId;
      } else {
        updateData.completed_at = null;
        updateData.completed_by = null;
      }

      const { data, error } = await fromTable('event_checklist')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ChecklistItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Toggle complété
// ============================================

export function useToggleChecklistItem() {
  const { mutateAsync: updateStatus } = useUpdateChecklistStatus();

  return useMutation({
    mutationFn: async ({ id, eventId, currentStatus }: {
      id: string;
      eventId: string;
      currentStatus: ChecklistItemStatus;
    }) => {
      const newStatus = currentStatus === 'done' ? 'todo' : 'done';
      return updateStatus({ id, eventId, status: newStatus });
    },
  });
}

// ============================================
// Supprimer un item
// ============================================

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await fromTable('event_checklist')
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
// Réordonner
// ============================================

export function useReorderChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, items }: {
      eventId: string;
      items: { id: string; order_index: number }[];
    }) => {
      await Promise.all(
        items.map(({ id, order_index }) =>
          fromTable('event_checklist')
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
// Templates de checklist par type d'événement
// ============================================

const CHECKLIST_TEMPLATES: Record<string, { title: string; category: string; priority: 'low' | 'medium' | 'high' }[]> = {
  wedding: [
    { title: 'Réserver le lieu de cérémonie', category: 'Lieu', priority: 'high' },
    { title: 'Réserver le lieu de réception', category: 'Lieu', priority: 'high' },
    { title: 'Choisir le traiteur', category: 'Traiteur', priority: 'high' },
    { title: 'Commander le gâteau', category: 'Traiteur', priority: 'medium' },
    { title: 'Réserver le photographe', category: 'Photo', priority: 'high' },
    { title: 'Réserver le DJ/groupe', category: 'Musique', priority: 'medium' },
    { title: 'Commander les faire-part', category: 'Papeterie', priority: 'medium' },
    { title: 'Envoyer les invitations', category: 'Papeterie', priority: 'high' },
    { title: 'Choisir la robe/costume', category: 'Tenues', priority: 'high' },
    { title: 'Réserver le fleuriste', category: 'Décoration', priority: 'medium' },
    { title: 'Organiser le transport', category: 'Logistique', priority: 'medium' },
    { title: 'Planifier la lune de miel', category: 'Voyage', priority: 'low' },
  ],
  birthday: [
    { title: 'Réserver le lieu', category: 'Lieu', priority: 'high' },
    { title: 'Commander le gâteau', category: 'Traiteur', priority: 'high' },
    { title: 'Préparer les invitations', category: 'Papeterie', priority: 'medium' },
    { title: 'Planifier les animations', category: 'Animation', priority: 'medium' },
    { title: 'Acheter les décorations', category: 'Décoration', priority: 'medium' },
    { title: 'Prévoir la musique', category: 'Musique', priority: 'low' },
  ],
  corporate: [
    { title: 'Réserver la salle', category: 'Lieu', priority: 'high' },
    { title: 'Organiser le catering', category: 'Traiteur', priority: 'high' },
    { title: 'Préparer la présentation', category: 'Contenu', priority: 'high' },
    { title: 'Envoyer les invitations', category: 'Communication', priority: 'medium' },
    { title: 'Prévoir le matériel technique', category: 'Technique', priority: 'medium' },
    { title: 'Organiser le networking', category: 'Animation', priority: 'low' },
  ],
};

export function useApplyChecklistTemplate() {
  const { mutateAsync: createItem } = useCreateChecklistItem();

  return useMutation({
    mutationFn: async ({ eventId, eventType }: { eventId: string; eventType: string }) => {
      const template = CHECKLIST_TEMPLATES[eventType] || CHECKLIST_TEMPLATES.birthday;

      for (const item of template) {
        await createItem({
          event_id: eventId,
          title: item.title,
          category: item.category,
          priority: item.priority,
        });
      }

      return { created: template.length };
    },
  });
}
