/**
 * Hooks pour les inspirations (Phase 9)
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import {
  InspirationFilters,
  InspirationSortBy,
  InspirationWithProvider,
  InspirationDetail,
} from '@/types/inspiration';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const PAGE_SIZE = 20;

// Helper pour accéder aux tables non encore dans les types auto-générés
const fromTable = (table: string) => supabase.from(table as any);

// ============================================
// Hook pour le feed d'inspirations avec infinite scroll
// ============================================

export function useInspirationFeed(
  filters: InspirationFilters = {},
  sortBy: InspirationSortBy = 'recent'
) {
  return useInfiniteQuery({
    queryKey: [Config.cacheKeys.inspirations, 'feed', filters, sortBy],
    queryFn: async ({ pageParam = 0 }): Promise<InspirationWithProvider[]> => {
      let query = fromTable('inspirations')
        .select(`
          *,
          inspiration_images (
            id,
            image_url,
            thumbnail_url,
            width,
            height,
            display_order
          ),
          providers (
            id,
            business_name,
            profiles:user_id (
              avatar_url,
              full_name
            ),
            categories (
              name,
              slug
            )
          )
        `)
        .eq('is_active', true)
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      // Filtres
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type);
      }
      if (filters.style) {
        query = query.eq('style', filters.style);
      }
      if (filters.providerId) {
        query = query.eq('provider_id', filters.providerId);
      }
      if (filters.searchQuery) {
        query = query.or(
          `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
        );
      }

      // Tri
      switch (sortBy) {
        case 'popular':
          query = query.order('favorite_count', { ascending: false });
          break;
        case 'trending':
          query = query
            .order('favorite_count', { ascending: false })
            .order('created_at', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Trier les images par display_order
      return ((data as any[]) || []).map((item) => ({
        ...item,
        inspiration_images: (item.inspiration_images || []).sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order
        ),
      })) as InspirationWithProvider[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });
}

// ============================================
// Hook pour le detail d'une inspiration
// ============================================

export function useInspiration(inspirationId: string | undefined) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.inspirations, 'detail', inspirationId],
    queryFn: async (): Promise<InspirationDetail | null> => {
      if (!inspirationId) return null;

      // Incrementer le compteur de vues
      supabase.rpc('increment_inspiration_views' as any, { insp_id: inspirationId });

      const { data: inspiration, error } = await fromTable('inspirations')
        .select(`
          *,
          inspiration_images (
            id,
            image_url,
            thumbnail_url,
            width,
            height,
            display_order
          ),
          providers (
            id,
            business_name,
            profiles:user_id (
              avatar_url,
              full_name
            ),
            categories (
              name,
              slug
            )
          )
        `)
        .eq('id', inspirationId)
        .single();

      if (error) throw error;
      if (!inspiration) return null;

      // Verifier si c'est un favori
      let isFavorite = false;
      if (userId) {
        const { data: favorite } = await fromTable('inspiration_favorites')
          .select('id')
          .eq('user_id', userId)
          .eq('inspiration_id', inspirationId)
          .single();

        isFavorite = !!favorite;
      }

      // Trier les images
      const insp = inspiration as any;
      const sortedImages = (insp.inspiration_images || []).sort(
        (a: { display_order: number }, b: { display_order: number }) =>
          a.display_order - b.display_order
      );

      return {
        ...insp,
        inspiration_images: sortedImages,
        is_favorite: isFavorite,
      } as InspirationDetail;
    },
    enabled: !!inspirationId,
  });
}

// ============================================
// Hook pour les inspirations d'un prestataire
// ============================================

export function useProviderInspirations(providerId: string | undefined) {
  return useInfiniteQuery({
    queryKey: [Config.cacheKeys.inspirations, 'provider', providerId],
    queryFn: async ({ pageParam = 0 }): Promise<InspirationWithProvider[]> => {
      if (!providerId) return [];

      const { data, error } = await fromTable('inspirations')
        .select(`
          *,
          inspiration_images (
            id,
            image_url,
            thumbnail_url,
            width,
            height,
            display_order
          ),
          providers (
            id,
            business_name,
            profiles:user_id (
              avatar_url,
              full_name
            ),
            categories (
              name,
              slug
            )
          )
        `)
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (error) throw error;

      return ((data as any[]) || []).map((item) => ({
        ...item,
        inspiration_images: (item.inspiration_images || []).sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order
        ),
      })) as InspirationWithProvider[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!providerId,
  });
}

// ============================================
// Hook pour les inspirations mises en avant
// ============================================

export function useFeaturedInspirations(limit: number = 10) {
  return useQuery({
    queryKey: [Config.cacheKeys.inspirations, 'featured', limit],
    queryFn: async (): Promise<InspirationWithProvider[]> => {
      const { data, error } = await fromTable('inspirations')
        .select(`
          *,
          inspiration_images (
            id,
            image_url,
            thumbnail_url,
            width,
            height,
            display_order
          ),
          providers (
            id,
            business_name,
            profiles:user_id (
              avatar_url,
              full_name
            ),
            categories (
              name,
              slug
            )
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('favorite_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return ((data as any[]) || []).map((item) => ({
        ...item,
        inspiration_images: (item.inspiration_images || []).sort(
          (a: { display_order: number }, b: { display_order: number }) =>
            a.display_order - b.display_order
        ),
      })) as InspirationWithProvider[];
    },
  });
}

// ============================================
// Hook pour prefetch une inspiration
// ============================================

export function usePrefetchInspiration() {
  const queryClient = useQueryClient();

  return (inspirationId: string) => {
    queryClient.prefetchQuery({
      queryKey: [Config.cacheKeys.inspirations, 'detail', inspirationId],
      queryFn: async () => {
        const { data, error } = await fromTable('inspirations')
          .select(`
            *,
            inspiration_images (*),
            providers (
              id,
              business_name,
              profiles:user_id (avatar_url, full_name),
              categories (name, slug)
            )
          `)
          .eq('id', inspirationId)
          .single();

        if (error) throw error;
        return data;
      },
    });
  };
}
