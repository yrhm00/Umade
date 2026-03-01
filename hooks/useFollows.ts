/**
 * Hooks pour le système de follow/unfollow
 * Gère les abonnements entre utilisateurs
 */

import { supabase } from '@/lib/supabase';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from './useAuth';

const FOLLOWS_CACHE_KEY = 'follows';

// Helper: on force "any" pour eviter les SelectQueryError (relations, selects imbriques).
const fromTable = (table: string) => (supabase as any).from(table);

/**
 * Hook pour récupérer les IDs des utilisateurs suivis
 */
export function useFollowingIds() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [FOLLOWS_CACHE_KEY, 'following', userId],
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set();

      const { data, error } = await fromTable('user_follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) throw error;
      return new Set((data || []).map((f: any) => f.following_id));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook pour récupérer le nombre de followers d'un utilisateur
 */
export function useFollowerCount(targetUserId: string | undefined) {
  return useQuery({
    queryKey: [FOLLOWS_CACHE_KEY, 'count', targetUserId],
    queryFn: async (): Promise<number> => {
      if (!targetUserId) return 0;

      const { count, error } = await fromTable('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook pour follow/unfollow un utilisateur
 */
export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      isCurrentlyFollowing,
    }: {
      targetUserId: string;
      isCurrentlyFollowing: boolean;
    }): Promise<void> => {
      if (!userId) throw new Error('Non authentifié');
      if (userId === targetUserId) throw new Error('Impossible de se suivre soi-même');

      if (isCurrentlyFollowing) {
        const { error } = await fromTable('user_follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', targetUserId);
        if (error) throw error;
      } else {
        const { error } = await fromTable('user_follows')
          .insert({
            follower_id: userId,
            following_id: targetUserId,
          });
        if (error) throw error;
      }
    },
    onMutate: async ({ targetUserId, isCurrentlyFollowing }) => {
      await queryClient.cancelQueries({ queryKey: [FOLLOWS_CACHE_KEY, 'following', userId] });

      const previousFollowing = queryClient.getQueryData<Set<string>>([FOLLOWS_CACHE_KEY, 'following', userId]);

      // Optimistic update
      queryClient.setQueryData(
        [FOLLOWS_CACHE_KEY, 'following', userId],
        (old: Set<string> | undefined) => {
          const newSet = new Set(old || []);
          if (isCurrentlyFollowing) {
            newSet.delete(targetUserId);
          } else {
            newSet.add(targetUserId);
          }
          return newSet;
        }
      );

      return { previousFollowing };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFollowing) {
        queryClient.setQueryData([FOLLOWS_CACHE_KEY, 'following', userId], context.previousFollowing);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [FOLLOWS_CACHE_KEY] });
    },
  });
}
