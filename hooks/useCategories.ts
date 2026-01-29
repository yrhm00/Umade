/**
 * Hook pour gérer les catégories de services
 */

import { useQuery } from '@tanstack/react-query';
import { supabase, Category } from '@/lib/supabase';
import { Config } from '@/constants/Config';

export function useCategories() {
  return useQuery({
    queryKey: [Config.cacheKeys.categories],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes - les catégories changent rarement
  });
}

export function useCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.categories, categoryId],
    queryFn: async (): Promise<Category | null> => {
      if (!categoryId) return null;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!categoryId,
  });
}
