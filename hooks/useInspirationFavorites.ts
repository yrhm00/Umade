/**
 * Hook pour gerer les favoris d'inspirations (Phase 9)
 * Avec support hors-ligne
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import {
  loadFavoriteIds,
  loadFavoriteInspirations,
  saveFavoriteIds,
  saveFavoriteInspirations,
} from '@/lib/offlineStorage';
import { InspirationWithProvider } from '@/types/inspiration';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useIsOnline } from './useNetworkStatus';
import { checkBadgesForUser } from './useGamification';
import { useGamificationStore } from '@/stores/gamificationStore';

// Helper: on force "any" pour eviter les SelectQueryError (selects imbriques/relations).
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Hook pour les IDs des inspirations favorites
// ============================================

export function useInspirationFavoriteIds() {
  const { userId } = useAuth();
  const isOnline = useIsOnline();

  const query = useQuery({
    queryKey: [Config.cacheKeys.inspirations, 'favoriteIds', userId],
    queryFn: async (): Promise<string[]> => {
      if (!userId) return [];

      // Si hors-ligne, charger depuis le stockage local
      if (!isOnline) {
        return await loadFavoriteIds();
      }

      const { data, error } = await fromTable('inspiration_favorites')
        .select('inspiration_id')
        .eq('user_id', userId);

      if (error) throw error;
      const ids = ((data as any[]) || []).map((f) => f.inspiration_id);

      // Sauvegarder en local pour usage hors-ligne
      await saveFavoriteIds(ids);

      return ids;
    },
    enabled: !!userId,
    // Garder les données en cache plus longtemps pour le mode hors-ligne
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime)
  });

  // Charger les données hors-ligne au démarrage
  useEffect(() => {
    if (!isOnline && userId && !query.data) {
      loadFavoriteIds().then((ids) => {
        if (ids.length > 0) {
          query.refetch();
        }
      });
    }
  }, [isOnline, userId]);

  return query;
}

// ============================================
// Hook pour les inspirations favorites avec details
// ============================================

export function useUserFavoriteInspirations() {
  const { userId } = useAuth();
  const isOnline = useIsOnline();

  const query = useQuery({
    queryKey: [Config.cacheKeys.inspirations, 'favorites', userId],
    queryFn: async (): Promise<InspirationWithProvider[]> => {
      if (!userId) return [];

      // Si hors-ligne, charger depuis le stockage local
      if (!isOnline) {
        return await loadFavoriteInspirations();
      }

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
      const inspirations = ((data as any[]) || [])
        .map((fav) => fav.inspirations)
        .filter((insp): insp is any => insp !== null)
        .map((item) => ({
          ...item,
          inspiration_images: (item.inspiration_images || []).sort(
            (a: { display_order: number }, b: { display_order: number }) =>
              a.display_order - b.display_order
          ),
        })) as InspirationWithProvider[];

      // Sauvegarder en local pour usage hors-ligne
      await saveFavoriteInspirations(inspirations);

      return inspirations;
    },
    enabled: !!userId,
    // Garder les données en cache plus longtemps pour le mode hors-ligne
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Charger les données hors-ligne au démarrage
  useEffect(() => {
    if (!isOnline && userId && !query.data) {
      loadFavoriteInspirations().then((inspirations) => {
        if (inspirations.length > 0) {
          query.refetch();
        }
      });
    }
  }, [isOnline, userId]);

  return query;
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
      const { data: existing, error: existingError } = await fromTable('inspiration_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('inspiration_id', inspirationId)
        .maybeSingle();

      if (existingError) throw existingError;

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
    onSettled: async (result) => {
      // Refetch favorite data only (not feed to prevent reordering)
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations, 'favoriteIds'],
      });
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.inspirations, 'favorites'],
      });

      // Gamification : vérifier le badge premier favori (seulement si ajouté)
      if (result?.action === 'added' && userId) {
        const badge = await checkBadgesForUser(userId, ['first_inspiration_fav']);
        if (badge) {
          useGamificationStore.getState().setPendingBadge(badge);
          queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.badges] });
        }
      }
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
