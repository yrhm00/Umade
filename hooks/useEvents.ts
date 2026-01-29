/**
 * Hook pour gérer les événements
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Config } from '@/constants/Config';
import { useAuth } from './useAuth';
import {
  Event,
  EventWithBookings,
  CreateEventInput,
  BookingWithDetails,
} from '@/types';

// === FETCH FUNCTIONS ===

async function fetchUserEvents(userId: string): Promise<EventWithBookings[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('client_id', userId)
    .order('event_date', { ascending: true });

  if (error) throw error;

  if (!data || data.length === 0) return [];

  // Fetch booking counts for each event
  const eventIds = data.map((e) => e.id);
  const { data: bookingCounts, error: countError } = await supabase
    .from('bookings')
    .select('event_id')
    .in('event_id', eventIds);

  if (countError) throw countError;

  const countsMap = new Map<string, number>();
  for (const b of bookingCounts || []) {
    if (b.event_id) {
      countsMap.set(b.event_id, (countsMap.get(b.event_id) || 0) + 1);
    }
  }

  return data.map((event) => ({
    ...event,
    bookings_count: countsMap.get(event.id) || 0,
  }));
}

async function fetchEventById(eventId: string): Promise<EventWithBookings | null> {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (eventError) {
    if (eventError.code === 'PGRST116') return null;
    throw eventError;
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select(`
      *,
      providers (
        id,
        business_name,
        profiles:user_id (full_name, avatar_url),
        categories:category_id (name)
      ),
      services (id, name, price, description, duration_minutes)
    `)
    .eq('event_id', eventId)
    .order('booking_date', { ascending: true });

  if (bookingsError) throw bookingsError;

  return {
    ...event,
    bookings: (bookings as unknown as BookingWithDetails[]) || [],
    bookings_count: bookings?.length || 0,
  };
}

// === HOOKS ===

export function useUserEvents() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.events, userId],
    queryFn: () => fetchUserEvents(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useEventDetail(eventId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.events, 'detail', eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .insert({
          client_id: userId,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.events, userId],
      });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      eventId,
      input,
    }: {
      eventId: string;
      input: Partial<CreateEventInput>;
    }) => {
      const { data, error } = await supabase
        .from('events')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.events, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.events, 'detail', eventId],
      });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.events, userId],
      });
    },
  });
}
