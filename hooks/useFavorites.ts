/**
 * Hook pour gérer les favoris
 */

import { Config } from '@/constants/Config';
import { Favorite, supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface FavoriteWithProvider extends Favorite {
  providers?: {
    id: string;
    business_name: string;
    description: string | null;
    average_rating: number | null;
    review_count: number | null;
    city: string | null;
    profiles?: {
      avatar_url: string | null;
    };
    categories?: {
      id: string;
      name: string;
      icon: string | null;
      slug: string;
    };
  };
}

// ============================================
// Hook pour les IDs des favoris (léger, pour vérifier si un provider est favori)
// ============================================

export function useFavoriteIds() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.favorites, userId, 'ids'],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select('provider_id')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map((f) => f.provider_id) || [];
    },
    enabled: !!userId,
  });
}

// ============================================
// Hook pour les favoris avec détails
// ============================================

export function useFavorites() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.favorites, userId],
    queryFn: async (): Promise<FavoriteWithProvider[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          providers (
            id,
            business_name,
            description,
            average_rating,
            review_count,
            city,
            profiles:user_id (avatar_url),
            categories (id, name, icon, slug),
            portfolio_images (image_url)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as FavoriteWithProvider[];
    },
    enabled: !!userId,
  });
}

// ============================================
// Hook pour vérifier si un provider est favori
// ============================================

export function useIsFavorite(providerId: string | undefined) {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.favorites, userId, providerId],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !providerId) return false;

      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('provider_id', providerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
    enabled: !!userId && !!providerId,
  });
}

// ============================================
// Hook custom pour vérifier rapidement si un provider est favori (utilise useFavoriteIds)
// ============================================

export function useIsFavoriteFromIds(providerId: string): boolean {
  const { data: favoriteIds = [] } = useFavoriteIds();
  return favoriteIds.includes(providerId);
}

// ============================================
// Hook pour toggle favori avec mise à jour optimiste
// ============================================

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (providerId: string) => {
      if (!userId) throw new Error('User not authenticated');

      // Vérifier si déjà en favoris
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('provider_id', providerId)
        .single();

      if (existing) {
        // Supprimer des favoris
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { action: 'removed' as const, providerId };
      } else {
        // Ajouter aux favoris
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: userId,
            provider_id: providerId,
          });

        if (error) throw error;
        return { action: 'added' as const, providerId };
      }
    },
    onMutate: async (providerId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [Config.cacheKeys.favorites, userId, 'ids'],
      });

      // Snapshot the previous value
      const previousIds = queryClient.getQueryData<string[]>([
        Config.cacheKeys.favorites,
        userId,
        'ids',
      ]);

      // Optimistically update the favorite IDs
      if (previousIds) {
        const isFavorite = previousIds.includes(providerId);
        queryClient.setQueryData<string[]>(
          [Config.cacheKeys.favorites, userId, 'ids'],
          isFavorite
            ? previousIds.filter((id) => id !== providerId)
            : [...previousIds, providerId]
        );
      }

      return { previousIds };
    },
    onError: (err, providerId, context) => {
      // Rollback on error
      if (context?.previousIds) {
        queryClient.setQueryData(
          [Config.cacheKeys.favorites, userId, 'ids'],
          context.previousIds
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.favorites],
      });
    },
  });
}

// ============================================
// Hook simplifié pour ajouter/supprimer favori avec callbacks
// ============================================

export function useFavoriteActions() {
  const { mutate: toggleFavorite, isPending } = useToggleFavorite();
  const { data: favoriteIds = [] } = useFavoriteIds();

  const addToFavorites = (providerId: string) => {
    if (!favoriteIds.includes(providerId)) {
      toggleFavorite(providerId);
    }
  };

  const removeFromFavorites = (providerId: string) => {
    if (favoriteIds.includes(providerId)) {
      toggleFavorite(providerId);
    }
  };

  const isFavorite = (providerId: string) => favoriteIds.includes(providerId);

  return {
    favoriteIds,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    isLoading: isPending,
  };
}
