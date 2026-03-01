import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GuestGroupInvite, GuestGroupRsvpPayload } from '@/types/bookingAdvanced';
import { useAuth } from './useAuth';

const fromTable = (table: string) => (supabase as any).from(table);

export function useGuestGroupInvite(groupId: string | undefined) {
  return useQuery({
    queryKey: ['guest-group-invite', groupId],
    queryFn: async (): Promise<GuestGroupInvite | null> => {
      if (!groupId) return null;

      const { data, error } = await fromTable('guest_group_invites')
        .select('*')
        .eq('group_id', groupId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data as GuestGroupInvite) || null;
    },
    enabled: !!groupId,
  });
}

export function useEventGuestGroupInvites(eventId: string | undefined) {
  return useQuery({
    queryKey: ['guest-group-invites', eventId],
    queryFn: async (): Promise<GuestGroupInvite[]> => {
      if (!eventId) return [];

      const { data, error } = await fromTable('guest_group_invites')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as GuestGroupInvite[];
    },
    enabled: !!eventId,
  });
}

export function useCreateGuestGroupInvite() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({ groupId, validDays = 90 }: { groupId: string; validDays?: number }) => {
      const { data, error } = await supabase.rpc('create_guest_group_invite' as any, {
        p_group_id: groupId,
        p_valid_days: validDays,
      });

      if (error) throw error;
      const token = String(data);
      return {
        token,
        shareLink: `umade://rsvp/${token}`,
        webPath: `/rsvp/${token}`,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guest-group-invite', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['guest-group-invites'] });
      queryClient.invalidateQueries({ queryKey: ['guestGroups'] });
      queryClient.invalidateQueries({ queryKey: ['guest-groups'] });
      queryClient.invalidateQueries({ queryKey: ['guest-group-summary'] });
      queryClient.invalidateQueries({ queryKey: ['guest-group-invite-list', userId] });
    },
  });
}

export function useGuestGroupRsvpPayload(token: string | undefined) {
  return useQuery({
    queryKey: ['guest-group-rsvp-payload', token],
    queryFn: async (): Promise<GuestGroupRsvpPayload | null> => {
      if (!token) return null;

      const { data, error } = await supabase.rpc('get_guest_group_rsvp_payload' as any, {
        p_token: token,
      });

      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as GuestGroupRsvpPayload) || null;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubmitGuestGroupRsvp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      status,
      adults,
      children,
      note,
      contactName,
    }: {
      token: string;
      status: 'pending' | 'confirmed' | 'declined' | 'maybe';
      adults?: number;
      children?: number;
      note?: string | null;
      contactName?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('submit_guest_group_rsvp' as any, {
        p_token: token,
        p_status: status,
        p_adults: adults ?? 0,
        p_children: children ?? 0,
        p_note: note || null,
        p_contact_name: contactName || null,
      });

      if (error) throw error;
      return Boolean(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guest-group-rsvp-payload', variables.token] });
      queryClient.invalidateQueries({ queryKey: ['guestGroups'] });
      queryClient.invalidateQueries({ queryKey: ['guest-group-summary'] });
    },
  });
}
