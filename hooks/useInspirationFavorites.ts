/**
 * Hook pour gerer les favoris d'inspirations (Phase 9)
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { InspirationWithProvider } from '@/types/inspiration';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuth } from './useAuth';

// Helper pour accéder aux tables non encore dans les types auto-générés
const fromTable = (table: string) => supabase.from(table as any);

// ============================================
// Hook pour les IDs des inspirations favorites
// ============================================

export function useInspirationFavoriteIds() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.inspirations, 'favoriteIds', userId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];

      const { data, error } = await fromTable('inspiration_favorites')
        .select('inspiration_id')
        .eq('user_id', userId);

      if (error) throw error;
      return ((data as any[]) || []).map((f) => f.inspiration_id);
    },
    enabled: !!userId,
  });
}

// ============================================
// Hook pour les inspirations favorites avec details
// ============================================

export function useUserFavoriteInspirations() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.inspirations, 'favorites', userId],
    queryFn: async (): Promise<InspirationWithProvider[]> => {
      if (!userId) return [];

      const { data, error } = await fromTable('inspiration_favorites')
        .select(`
          inspiration_id,
          inspirations (
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
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extraire les inspirations des favoris
      return ((data as any[]) || [])
        .map((fav) => fav.inspirations)
        .filter((insp): insp is any => insp !== null)
        .map((item) => ({
          ...item,
          inspiration_images: (item.inspiration_images || []).sort(
            (a: { display_order: number }, b: { display_order: number }) =>
              a.display_order - b.display_order
          ),
        })) as InspirationWithProvider[];
    },
    enabled: !!userId,
  });
}

// ============================================
// Hook pour verifier si une inspiration est favorite
// ============================================

export function useIsInspirationFavorite(inspirationId: string): boolean {
  const { data: favoriteIds = [] } = useInspirationFavoriteIds();
  return favoriteIds.includes(inspirationId);
}

// ============================================
// Hook pour toggle favori avec optimistic update
// ============================================

export function useToggleInspirationFavorite() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (inspirationId: string) => {
      if (!userId) throw new Error('User not authenticated');

      // Verifier si deja en favoris
      const { data: existing } = await fromTable('inspiration_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('inspiration_id', inspirationId)
        .single();

      if (existing) {
        // Supprimer des favoris
        const { error } = await fromTable('inspiration_favorites')
          .delete()
          .eq('id', (existing as any).id);

        if (error) throw error;

        // Decrementer le compteur
        await supabase.rpc('decrement_favorite_count' as any, { insp_id: inspirationId });

        return { action: 'removed' as const, inspirationId };
      } else {
        // Ajouter aux favoris
        const { error } = await fromTable('inspiration_favorites').insert({
          user_id: userId,
          inspiration_id: inspirationId,
        });

        if (error) throw error;

        // Incrementer le compteur
        await supabase.rpc('increment_favorite_count' as any, { insp_id: inspirationId });

        return { action: 'added' as const, inspirationId };
      }
    },
    onMutate: async (inspirationId) => {
      // Haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [Config.cacheKeys.inspirations, 'favoriteIds', userId],
      });

      // Snapshot the previous value
      const previousIds = queryClient.getQueryData<string[]>([
        Config.cacheKeys.inspirations,
        'favoriteIds',
        userId,
      ]);

      // Optimistically update the favorite IDs
      if (previousIds) {
        const isFavorite = previousIds.includes(inspirationId);
        queryClient.setQueryData<string[]>(
          [Config.cacheKeys.inspirations, 'favoriteIds', userId],
          isFavorite
            ? previousIds.filter((id) => id !== inspirationId)
            : [...previousIds, inspirationId]
        );
      }

      return { previousIds };
    },
    onError: (err, inspirationId, context) => {
      // Rollback on error
      if (context?.previousIds) {
        queryClient.setQueryData(
          [Config.cacheKeys.inspirations, 'favoriteIds', userId],
          context.previousIds
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations, 'favoriteIds'],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations, 'favorites'],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations, 'feed'],
      });
    },
  });
}

// ============================================
// Hook simplifie pour les actions favorites
// ============================================

export function useInspirationFavoriteActions() {
  const { mutate: toggleFavorite, isPending } = useToggleInspirationFavorite();
  const { data: favoriteIds = [] } = useInspirationFavoriteIds();

  const isFavorite = (inspirationId: string) => favoriteIds.includes(inspirationId);

  const addToFavorites = (inspirationId: string) => {
    if (!favoriteIds.includes(inspirationId)) {
      toggleFavorite(inspirationId);
    }
  };

  const removeFromFavorites = (inspirationId: string) => {
    if (favoriteIds.includes(inspirationId)) {
      toggleFavorite(inspirationId);
    }
  };

  return {
    favoriteIds,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isLoading: isPending,
  };
}
