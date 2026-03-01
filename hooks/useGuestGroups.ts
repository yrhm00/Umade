/**
 * Hooks pour la gestion des groupes d'invités (familles)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  GuestGroup,
  GuestGroupWithMembers,
  GuestGroupMember,
  GuestGroupSummary,
  GuestStatus,
  GuestCategory,
  MealPreference,
  CreateGuestGroupInput,
  GUEST_CATEGORIES,
} from '@/types/eventFeatures';

const QUERY_KEY = 'guestGroups';

// Helper: on force "any" pour eviter les SelectQueryError.
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Récupérer tous les groupes d'invités
// ============================================

export function useGuestGroups(eventId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, eventId],
    queryFn: async (): Promise<GuestGroupWithMembers[]> => {
      if (!eventId) return [];

      // Récupérer les groupes
      const { data: groups, error } = await fromTable('guest_groups')
        .select('*')
        .eq('event_id', eventId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Récupérer les membres pour chaque groupe
      const groupIds = (groups || []).map((g: any) => g.id);

      let members: GuestGroupMember[] = [];
      if (groupIds.length > 0) {
        const { data: membersData } = await fromTable('guest_group_members')
          .select('*')
          .in('group_id', groupIds)
          .order('created_at', { ascending: true });

        members = (membersData || []) as GuestGroupMember[];
      }

      // Combiner groupes et membres
      return (groups || []).map((group: GuestGroup) => ({
        ...group,
        members: members.filter((m) => m.group_id === group.id),
      })) as GuestGroupWithMembers[];
    },
    enabled: !!eventId,
  });
}

// ============================================
// Récupérer le résumé des groupes
// ============================================

export function useGuestGroupSummary(eventId: string | undefined) {
  const { data: groups = [] } = useGuestGroups(eventId);

  const summary: GuestGroupSummary = {
    total_groups: groups.length,
    total_people: 0,
    confirmed_groups: 0,
    confirmed_people: 0,
    pending_groups: 0,
    pending_people: 0,
    declined_groups: 0,
    declined_people: 0,
    by_category: {} as Record<GuestCategory, { groups: number; people: number }>,
  };

  // Initialiser catégories
  Object.keys(GUEST_CATEGORIES).forEach((cat) => {
    summary.by_category[cat as GuestCategory] = { groups: 0, people: 0 };
  });

  groups.forEach((group) => {
    summary.total_people += group.member_count;
    const confirmedAttendees = Math.max(
      (group.confirmed_adults || 0) + (group.confirmed_children || 0),
      group.status === 'confirmed' ? group.member_count : 0
    );

    // Par statut
    switch (group.status) {
      case 'confirmed':
        summary.confirmed_groups++;
        summary.confirmed_people += confirmedAttendees;
        break;
      case 'declined':
        summary.declined_groups++;
        summary.declined_people += group.member_count;
        break;
      default:
        summary.pending_groups++;
        summary.pending_people += group.member_count;
    }

    // Par catégorie
    if (summary.by_category[group.category]) {
      summary.by_category[group.category].groups++;
      summary.by_category[group.category].people += group.member_count;
    }
  });

  return summary;
}

// ============================================
// Créer un groupe d'invités
// ============================================

export function useCreateGuestGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGuestGroupInput): Promise<GuestGroupWithMembers> => {
      // 1. Créer le groupe
      const { data: group, error: groupError } = await fromTable('guest_groups')
        .insert({
          event_id: input.event_id,
          name: input.name,
          member_count: input.member_count,
          status: 'pending',
          category: input.category || 'family',
          email: input.email || null,
          phone: input.phone || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Créer les membres si fournis
      let members: GuestGroupMember[] = [];
      if (input.members && input.members.length > 0) {
        const membersToInsert = input.members.map((m) => ({
          group_id: group.id,
          name: m.name,
          meal_preference: m.meal_preference || 'standard',
          dietary_notes: null,
          is_child: m.is_child || false,
          age: m.age || null,
        }));

        const { data: membersData, error: membersError } = await fromTable('guest_group_members')
          .insert(membersToInsert)
          .select();

        if (membersError) {
          console.error('Error creating members:', membersError);
        } else {
          members = membersData as GuestGroupMember[];
        }
      }

      return { ...group, members } as GuestGroupWithMembers;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.event_id],
      });
    },
  });
}

// ============================================
// Mettre à jour un groupe
// ============================================

export function useUpdateGuestGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, updates }: {
      id: string;
      eventId: string;
      updates: Partial<GuestGroup>;
    }): Promise<GuestGroup> => {
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Si le statut change, enregistrer la date RSVP
      if (updates.status === 'confirmed' || updates.status === 'declined') {
        updateData.rsvp_date = new Date().toISOString();
      }

      const { data, error } = await fromTable('guest_groups')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as GuestGroup;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Mettre à jour le statut RSVP d'un groupe
// ============================================

export function useUpdateGuestGroupStatus() {
  const { mutateAsync: updateGroup } = useUpdateGuestGroup();

  return useMutation({
    mutationFn: async ({ id, eventId, status }: {
      id: string;
      eventId: string;
      status: GuestStatus;
    }) => {
      return updateGroup({ id, eventId, updates: { status } });
    },
  });
}

// ============================================
// Supprimer un groupe
// ============================================

export function useDeleteGuestGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      // Supprimer d'abord les membres
      await fromTable('guest_group_members')
        .delete()
        .eq('group_id', id);

      // Puis le groupe
      const { error } = await fromTable('guest_groups')
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
// Ajouter un membre à un groupe
// ============================================

export function useAddGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, eventId, member }: {
      groupId: string;
      eventId: string;
      member: { name: string; meal_preference?: MealPreference; is_child?: boolean; age?: number };
    }): Promise<GuestGroupMember> => {
      const { data, error } = await fromTable('guest_group_members')
        .insert({
          group_id: groupId,
          name: member.name,
          meal_preference: member.meal_preference || 'standard',
          is_child: member.is_child || false,
          age: member.age || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour le compteur du groupe
      const { error: rpcError } = await supabase.rpc('increment_member_count' as any, { group_id: groupId });
      if (rpcError) throw rpcError;

      return data as GuestGroupMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}

// ============================================
// Supprimer un membre d'un groupe
// ============================================

export function useDeleteGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, groupId, eventId }: {
      memberId: string;
      groupId: string;
      eventId: string;
    }) => {
      const { error } = await fromTable('guest_group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Mettre à jour le compteur du groupe
      const { error: rpcError } = await supabase.rpc('decrement_member_count' as any, { group_id: groupId });
      if (rpcError) throw rpcError;

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
// Mettre à jour un membre
// ============================================

export function useUpdateGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, eventId, updates }: {
      memberId: string;
      eventId: string;
      updates: Partial<GuestGroupMember>;
    }): Promise<GuestGroupMember> => {
      const { data, error } = await fromTable('guest_group_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data as GuestGroupMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.eventId],
      });
    },
  });
}
