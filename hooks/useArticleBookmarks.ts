/**
 * Hooks pour les bookmarks d'articles éditoriaux
 * Table: article_bookmarks (à créer dans Supabase)
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { EditorialArticle } from '@/types/editorial';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuth } from './useAuth';

// Helper pour les relations imbriquées (bypass SelectQueryError)
const fromTable = (table: string) => (supabase as any).from(table);

const BOOKMARKS_CACHE_KEY = [Config.cacheKeys.editorial, 'bookmarks'] as const;

/**
 * Liste des articles bookmarkés par l'utilisateur
 */
export function useArticleBookmarks() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [...BOOKMARKS_CACHE_KEY, 'list', userId],
    queryFn: async (): Promise<EditorialArticle[]> => {
      if (!userId) return [];

      const { data, error } = await fromTable('article_bookmarks')
        .select(`
          article_id,
          created_at,
          editorial_articles (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data as any[]) || [])
        .map((bm: any) => bm.editorial_articles)
        .filter((article: any): article is EditorialArticle => article !== null);
    },
    enabled: !!userId,
  });
}

/**
 * IDs des articles bookmarkés (pour vérification rapide)
 */
export function useBookmarkedArticleIds() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [...BOOKMARKS_CACHE_KEY, 'ids', userId],
    queryFn: async (): Promise<Set<string>> => {
      if (!userId) return new Set();

      const { data, error } = await fromTable('article_bookmarks')
        .select('article_id')
        .eq('user_id', userId);

      if (error) throw error;
      return new Set(((data as any[]) || []).map((bm) => bm.article_id));
    },
    enabled: !!userId,
  });
}

/**
 * Vérifier si un article est bookmarké
 */
export function useIsArticleBookmarked(articleId: string): boolean {
  const { data: bookmarkedIds } = useBookmarkedArticleIds();
  return bookmarkedIds?.has(articleId) ?? false;
}

/**
 * Toggle bookmark avec optimistic update
 */
export function useToggleArticleBookmark() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (articleId: string): Promise<{ action: 'added' | 'removed' }> => {
      if (!userId) throw new Error('Non authentifié');

      // Vérifier si déjà bookmarké
      const { data: existing } = await fromTable('article_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('article_id', articleId)
        .maybeSingle();

      if (existing) {
        // Supprimer
        const { error } = await fromTable('article_bookmarks')
          .delete()
          .eq('id', (existing as any).id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Ajouter
        const { error } = await fromTable('article_bookmarks')
          .insert({ user_id: userId, article_id: articleId });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onMutate: async (articleId) => {
      // Haptic
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [...BOOKMARKS_CACHE_KEY, 'ids', userId],
      });

      // Snapshot
      const previousIds = queryClient.getQueryData<Set<string>>([
        ...BOOKMARKS_CACHE_KEY,
        'ids',
        userId,
      ]);

      // Optimistic update des IDs
      if (previousIds) {
        const newIds = new Set(previousIds);
        if (newIds.has(articleId)) {
          newIds.delete(articleId);
        } else {
          newIds.add(articleId);
        }
        queryClient.setQueryData([...BOOKMARKS_CACHE_KEY, 'ids', userId], newIds);
      }

      return { previousIds };
    },
    onError: (_, __, context) => {
      // Rollback
      if (context?.previousIds) {
        queryClient.setQueryData(
          [...BOOKMARKS_CACHE_KEY, 'ids', userId],
          context.previousIds
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...BOOKMARKS_CACHE_KEY],
      });
    },
  });
}
