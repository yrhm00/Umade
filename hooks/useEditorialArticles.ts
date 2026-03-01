/**
 * Hooks pour les articles éditoriaux
 * Table: editorial_articles
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { EditorialArticle } from '@/types/editorial';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

const PAGE_SIZE = 10;

/**
 * Articles publiés avec pagination et filtre par catégorie
 */
export function useEditorialArticles(category?: string) {
  return useInfiniteQuery({
    queryKey: [Config.cacheKeys.editorial, 'list', category],
    queryFn: async ({ pageParam = 0 }): Promise<EditorialArticle[]> => {
      let query = supabase
        .from('editorial_articles')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EditorialArticle[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
  });
}

/**
 * Articles mis en avant (pour la section home)
 */
export function useFeaturedArticles(limit: number = 5) {
  return useQuery({
    queryKey: [Config.cacheKeys.editorial, 'featured', limit],
    queryFn: async (): Promise<EditorialArticle[]> => {
      const { data, error } = await supabase
        .from('editorial_articles')
        .select('*')
        .eq('is_published', true)
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as EditorialArticle[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Détail d'un article + incrémentation du compteur de vues
 */
export function useArticleDetail(articleId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.editorial, 'detail', articleId],
    queryFn: async (): Promise<EditorialArticle | null> => {
      if (!articleId) return null;

      const { data, error } = await supabase
        .from('editorial_articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      if (!data) return null;

      // Incrémenter le compteur de vues (fire-and-forget)
      supabase
        .from('editorial_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', articleId)
        .then();

      return data as EditorialArticle;
    },
    enabled: !!articleId,
  });
}
