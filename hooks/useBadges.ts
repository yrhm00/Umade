/**
 * Hooks pour le système de badges
 * Tables: badges, user_badges
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { Badge, UserBadgeWithDetails } from '@/types/badges';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Helper pour les relations imbriquées (bypass SelectQueryError)
const fromTable = (table: string) => (supabase as any).from(table);

/**
 * Badges obtenus par l'utilisateur connecté (avec détails du badge)
 */
export function useUserBadges() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.badges, 'user', userId],
    queryFn: async (): Promise<UserBadgeWithDetails[]> => {
      if (!userId) return [];

      const { data, error } = await fromTable('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserBadgeWithDetails[];
    },
    enabled: !!userId,
  });
}

/**
 * Tous les badges disponibles (non secrets)
 */
export function useAllBadges() {
  return useQuery({
    queryKey: [Config.cacheKeys.badges, 'all'],
    queryFn: async (): Promise<Badge[]> => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_secret', false)
        .order('category', { ascending: true })
        .order('points', { ascending: true });

      if (error) throw error;
      return (data || []) as Badge[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Marquer un badge comme vu
 */
export function useMarkBadgeSeen() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (userBadgeId: string) => {
      const { error } = await supabase
        .from('user_badges')
        .update({ seen_at: new Date().toISOString() })
        .eq('id', userBadgeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [Config.cacheKeys.badges, 'user', userId],
      });
    },
  });
}

/**
 * Nombre de badges non vus (pour le point de notification)
 */
export function useUnseenBadgeCount() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [Config.cacheKeys.badges, 'unseen', userId],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('seen_at', null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
  });
}
