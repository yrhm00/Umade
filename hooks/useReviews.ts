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
import { checkBadgesForUser } from './useGamification';
import { useGamificationStore } from '@/stores/gamificationStore';

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
  // Utiliser les stats dénormalisées du provider + 5 count queries parallèles (head: true = 0 lignes transférées)
  const [providerResult, r1, r2, r3, r4, r5] = await Promise.all([
    supabase
      .from('providers')
      .select('average_rating, review_count')
      .eq('id', providerId)
      .single(),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('provider_id', providerId).eq('is_visible', true).eq('rating', 1),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('provider_id', providerId).eq('is_visible', true).eq('rating', 2),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('provider_id', providerId).eq('is_visible', true).eq('rating', 3),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('provider_id', providerId).eq('is_visible', true).eq('rating', 4),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('provider_id', providerId).eq('is_visible', true).eq('rating', 5),
  ]);

  if (providerResult.error) throw providerResult.error;

  const total = providerResult.data?.review_count || 0;
  const average = providerResult.data?.average_rating || 0;

  if (total === 0) {
    return {
      average_rating: 0,
      total_count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  return {
    average_rating: Math.round(average * 10) / 10,
    total_count: total,
    distribution: {
      1: r1.count || 0,
      2: r2.count || 0,
      3: r3.count || 0,
      4: r4.count || 0,
      5: r5.count || 0,
    },
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
  // Réservations complétées sans avis — une seule requête avec LEFT JOIN
  const { data, error } = await (supabase as any)
    .from('bookings')
    .select(
      `
      id,
      booking_date,
      provider:providers(id, business_name),
      service:services(name),
      reviews!reviews_booking_id_fkey(id)
    `
    )
    .eq('client_id', userId)
    .eq('status', 'completed')
    .order('booking_date', { ascending: false });

  if (error) throw error;

  // Filtrer les bookings sans review (reviews array vide)
  return ((data || []) as any[])
    .filter((booking) => !booking.reviews || booking.reviews.length === 0)
    .map(({ reviews: _reviews, ...rest }) => rest) as unknown as ReviewableBooking[];
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
    staleTime: 1000 * 60 * 5,
  });
}

export function useReviewableBookings() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['bookings', 'reviewable', userId],
    queryFn: () => fetchReviewableBookings(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBookingForReview(bookingId: string) {
  return useQuery({
    queryKey: ['bookings', 'forReview', bookingId],
    queryFn: () => fetchBookingForReview(bookingId),
    enabled: !!bookingId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(userId!, input),
    onSuccess: async (_, variables) => {
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

      // Gamification : vérifier les badges avis
      if (userId) {
        const badge = await checkBadgesForUser(userId, ['first_review', 'five_reviews']);
        if (badge) {
          useGamificationStore.getState().setPendingBadge(badge);
          queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.badges] });
        }
      }
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
