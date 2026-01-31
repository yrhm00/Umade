/**
 * Hook pour gérer les avis (reviews)
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import {
  CreateReviewInput,
  Review,
  ReviewStats,
  ReviewWithDetails,
  ReviewableBooking,
} from '@/types';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from './useAuth';

const REVIEWS_PER_PAGE = 10;

// === FETCH FUNCTIONS ===

async function fetchProviderReviews(
  providerId: string,
  cursor?: string
): Promise<ReviewWithDetails[]> {
  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      client:profiles!reviews_client_id_fkey(id, full_name, avatar_url),
      booking:bookings(id, booking_date, service:services(name))
    `
    )
    .eq('provider_id', providerId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(REVIEWS_PER_PAGE);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as ReviewWithDetails[]) || [];
}

async function fetchProviderReviewStats(
  providerId: string
): Promise<ReviewStats> {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating')
    .eq('provider_id', providerId)
    .eq('is_visible', true);

  if (error) throw error;

  const reviews = data || [];
  const total = reviews.length;

  if (total === 0) {
    return {
      average_rating: 0,
      total_count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const distribution: ReviewStats['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((r) => {
    const rating = r.rating as 1 | 2 | 3 | 4 | 5;
    distribution[rating]++;
  });

  return {
    average_rating: Math.round((sum / total) * 10) / 10,
    total_count: total,
    distribution,
  };
}

async function fetchUserReviews(userId: string): Promise<ReviewWithDetails[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
      *,
      client:profiles!reviews_client_id_fkey(id, full_name, avatar_url),
      booking:bookings(
        id,
        booking_date,
        service:services(name),
        provider:providers(id, business_name)
      )
    `
    )
    .eq('client_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as ReviewWithDetails[]) || [];
}

async function fetchReviewableBookings(
  userId: string
): Promise<ReviewableBooking[]> {
  // Réservations complétées sans avis
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      booking_date,
      provider:providers(id, business_name),
      service:services(name)
    `
    )
    .eq('client_id', userId)
    .eq('status', 'completed')
    .order('booking_date', { ascending: false });

  if (error) throw error;

  // Pour chaque booking, vérifier s'il a déjà un avis
  const bookingsWithoutReview: ReviewableBooking[] = [];

  for (const booking of data || []) {
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking.id)
      .maybeSingle();

    if (!existingReview) {
      bookingsWithoutReview.push(booking as unknown as ReviewableBooking);
    }
  }

  return bookingsWithoutReview;
}

async function fetchBookingForReview(bookingId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      booking_date,
      provider_id,
      provider:providers(id, business_name, user_id, profiles:profiles(avatar_url)),
      service:services(name, price)
    `
    )
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data;
}

async function createReview(
  userId: string,
  input: CreateReviewInput
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      client_id: userId,
      booking_id: input.booking_id,
      provider_id: input.provider_id,
      rating: input.rating,
      comment: input.comment || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateReview(
  reviewId: string,
  input: { rating?: number; comment?: string }
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteReview(reviewId: string): Promise<void> {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

  if (error) throw error;
}

async function addProviderResponse(
  reviewId: string,
  response: string
): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      provider_response: response,
      response_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// === HOOKS ===

export function useProviderReviews(providerId: string) {
  return useInfiniteQuery({
    queryKey: ['reviews', 'provider', providerId],
    queryFn: ({ pageParam }) => fetchProviderReviews(providerId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < REVIEWS_PER_PAGE) return undefined;
      return lastPage[lastPage.length - 1]?.created_at;
    },
    initialPageParam: undefined as string | undefined,
    enabled: !!providerId,
  });
}

export function useProviderReviewStats(providerId: string) {
  return useQuery({
    queryKey: ['reviews', 'stats', providerId],
    queryFn: () => fetchProviderReviewStats(providerId),
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUserReviews() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => fetchUserReviews(userId!),
    enabled: !!userId,
  });
}

export function useReviewableBookings() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['bookings', 'reviewable', userId],
    queryFn: () => fetchReviewableBookings(userId!),
    enabled: !!userId,
  });
}

export function useBookingForReview(bookingId: string) {
  return useQuery({
    queryKey: ['bookings', 'forReview', bookingId],
    queryFn: () => fetchBookingForReview(bookingId),
    enabled: !!bookingId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(userId!, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['reviews', 'provider', variables.provider_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['reviews', 'stats', variables.provider_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['reviews', 'user', userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['bookings', 'reviewable', userId],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.providers, 'detail', variables.provider_id],
      });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      input,
    }: {
      reviewId: string;
      input: { rating?: number; comment?: string };
    }) => updateReview(reviewId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useAddProviderResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      response,
    }: {
      reviewId: string;
      response: string;
    }) => addProviderResponse(reviewId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
