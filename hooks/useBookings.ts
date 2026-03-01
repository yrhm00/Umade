/**
 * Hook pour gérer les réservations
 */

import { Config } from '@/constants/Config';
import { Booking, BookingStatus, InsertTables, supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useMyProviderId } from './useMyProviderId';

interface BookingWithDetails extends Booking {
  providers?: {
    id: string;
    business_name: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  services?: {
    id: string;
    name: string;
    price: number;
  };
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    postal_code?: string | null;
  };
}

export function useBookings(status?: BookingStatus) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.bookings, userId, status],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      if (!userId) return [];

      let query = supabase
        .from('bookings')
        .select(`
          *,
          providers (
            id,
            business_name,
            profiles:user_id (full_name, avatar_url)
          ),
          services (id, name, price)
        `)
        .eq('client_id', userId)
        .order('booking_date', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as BookingWithDetails[];
    },
    enabled: !!userId,
  });
}

export type BookingFilter = BookingStatus | 'upcoming';

export function useProviderBookings(filter?: BookingFilter) {
  const providerId = useMyProviderId();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: [Config.cacheKeys.bookings, 'provider', providerId, filter],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      if (!providerId) return [];

      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:client_id (full_name, avatar_url),
          services (id, name, price)
        `)
        .eq('provider_id', providerId);

      if (filter === 'upcoming') {
        query = query
          .gte('booking_date', today)
          .in('status', ['confirmed', 'pending'])
          .order('booking_date', { ascending: true })
          .order('start_time', { ascending: true });
      } else {
        if (filter) {
          query = query.eq('status', filter);
        }
        query = query
          .order('booking_date', { ascending: false })
          .order('start_time', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as BookingWithDetails[];
    },
    enabled: !!providerId,
  });
}

export function useUpcomingProviderBookings(limit = 3) {
  const providerId = useMyProviderId();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: [Config.cacheKeys.bookings, 'provider', 'upcoming', providerId],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      if (!providerId) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:client_id (full_name, avatar_url),
          services (id, name, price)
        `)
        .eq('provider_id', providerId)
        .gte('booking_date', today)
        .in('status', ['confirmed', 'pending'])
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data || []) as BookingWithDetails[];
    },
    enabled: !!providerId,
  });
}

export function useBooking(bookingId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.bookings, bookingId],
    queryFn: async (): Promise<BookingWithDetails | null> => {
      if (!bookingId) return null;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          providers (
            id,
            business_name,
            profiles:user_id (full_name, avatar_url, phone)
          ),
          profiles:client_id (full_name, avatar_url, email, phone, city, postal_code),
          services (id, name, price, description)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data as BookingWithDetails;
    },
    enabled: !!bookingId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (booking: Omit<InsertTables<'bookings'>, 'client_id'>) => {
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('bookings')
        .insert({ ...booking, client_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.events] });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.providers] });
    },
  });
}

export function useEventBookings(eventId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.bookings, 'event', eventId],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      if (!eventId) return [];

      const { data, error } = await supabase
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

      if (error) throw error;
      return (data || []) as BookingWithDetails[];
    },
    enabled: !!eventId,
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
      cancellationReason,
    }: {
      bookingId: string;
      status: BookingStatus;
      cancellationReason?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        if (cancellationReason) {
          updateData.cancellation_reason = cancellationReason;
        }
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.bookings] });
      queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.events] });
    },
  });
}
