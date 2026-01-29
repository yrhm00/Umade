/**
 * Hook pour gérer les prestataires
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase, Provider, Service, Category } from '@/lib/supabase';
import { Config } from '@/constants/Config';
import {
  ProviderListItem,
  ProviderWithDetails,
  ProviderFilters,
  ReviewWithClient,
} from '@/types';

// ============================================
// Types internes
// ============================================

interface ProviderWithRelations extends Provider {
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
    phone?: string | null;
  };
  categories?: {
    id: string;
    name: string;
    icon: string | null;
    slug: string;
  };
}

// ============================================
// Fonctions de fetch
// ============================================

// Recherche de providers avec filtres (utilise la fonction RPC)
async function searchProviders(
  filters: ProviderFilters,
  limit: number = Config.pageSize,
  offset: number = 0
): Promise<ProviderListItem[]> {
  const { data, error } = await supabase.rpc('search_providers', {
    p_category_slug: filters.categorySlug,
    p_city: filters.city,
    p_min_price: filters.minPrice,
    p_max_price: filters.maxPrice,
    p_min_rating: filters.minRating,
    p_search_query: filters.searchQuery,
    p_limit: limit,
    p_offset: offset,
  } as any);

  if (error) throw error;
  return (data || []) as ProviderListItem[];
}

// Top providers (pour la home)
async function fetchTopProviders(limit: number = 10): Promise<ProviderListItem[]> {
  const { data, error } = await supabase.rpc('search_providers', {
    p_min_rating: 4.0,
    p_limit: limit,
    p_offset: 0,
  } as any);

  if (error) throw error;
  return (data || []) as ProviderListItem[];
}

// Providers par catégorie
async function fetchProvidersByCategory(
  categorySlug: string,
  limit: number = Config.pageSize
): Promise<ProviderListItem[]> {
  const { data, error } = await supabase.rpc('search_providers', {
    p_category_slug: categorySlug,
    p_limit: limit,
    p_offset: 0,
  } as any);

  if (error) throw error;
  return (data || []) as ProviderListItem[];
}

// Détail d'un provider avec toutes ses relations
async function fetchProviderDetail(providerId: string): Promise<ProviderWithDetails | null> {
  // 1. Récupérer le provider avec sa catégorie
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select(`
      *,
      profiles:user_id (full_name, avatar_url, phone),
      categories:category_id (*)
    `)
    .eq('id', providerId)
    .eq('is_active', true)
    .single();

  if (providerError) {
    if (providerError.code === 'PGRST116') return null;
    throw providerError;
  }

  // 2. Récupérer les services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (servicesError) throw servicesError;

  // 3. Récupérer les images portfolio
  const { data: portfolioImages, error: portfolioError } = await supabase
    .from('portfolio_images')
    .select('*')
    .eq('provider_id', providerId)
    .order('display_order', { ascending: true });

  if (portfolioError) throw portfolioError;

  // 4. Récupérer les avis avec infos client
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      *,
      client:profiles!reviews_client_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('provider_id', providerId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(10);

  if (reviewsError) throw reviewsError;

  return {
    ...provider,
    category: provider.categories as Category,
    services: services || [],
    portfolio_images: portfolioImages || [],
    reviews: (reviews as ReviewWithClient[]) || [],
  };
}

// ============================================
// HOOKS - Recherche et liste
// ============================================

// Hook pour les top providers (home)
export function useTopProviders(limit: number = 10) {
  return useQuery({
    queryKey: [Config.cacheKeys.providers, 'top', limit],
    queryFn: () => fetchTopProviders(limit),
  });
}

// Hook pour les providers par catégorie
export function useProvidersByCategory(categorySlug: string, limit: number = Config.pageSize) {
  return useQuery({
    queryKey: [Config.cacheKeys.providers, 'category', categorySlug, limit],
    queryFn: () => fetchProvidersByCategory(categorySlug, limit),
    enabled: !!categorySlug,
  });
}

// Hook pour la recherche avec filtres (avec pagination infinie)
export function useSearchProviders(filters: ProviderFilters) {
  return useInfiniteQuery({
    queryKey: [Config.cacheKeys.providers, 'search', filters],
    queryFn: ({ pageParam = 0 }) => searchProviders(filters, Config.pageSize, pageParam),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < Config.pageSize) return undefined;
      return allPages.length * Config.pageSize;
    },
    initialPageParam: 0,
  });
}

// Hook générique pour les providers (rétro-compatible avec l'existant)
interface ProvidersFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  city?: string;
  isVerified?: boolean;
}

export function useProviders(filters: ProvidersFilters = {}) {
  return useInfiniteQuery({
    queryKey: [Config.cacheKeys.providers, filters],
    queryFn: async ({ pageParam = 0 }): Promise<ProviderWithRelations[]> => {
      let query = supabase
        .from('providers')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          categories (id, name, icon, slug)
        `)
        .eq('is_active', true)
        .range(pageParam, pageParam + Config.pageSize - 1)
        .order('average_rating', { ascending: false, nullsFirst: false });

      // Filtres
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.search) {
        query = query.or(`business_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.minRating) {
        query = query.gte('average_rating', filters.minRating);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.isVerified) {
        query = query.eq('is_verified', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as ProviderWithRelations[];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < Config.pageSize) return undefined;
      return allPages.length * Config.pageSize;
    },
    initialPageParam: 0,
  });
}

// ============================================
// HOOKS - Détail provider
// ============================================

// Hook pour le détail d'un provider (version complète)
export function useProviderDetail(providerId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.providers, 'detail', providerId],
    queryFn: () => fetchProviderDetail(providerId!),
    enabled: !!providerId,
  });
}

// Hook simple pour un provider (rétro-compatible)
export function useProvider(providerId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.providers, providerId],
    queryFn: async (): Promise<ProviderWithRelations | null> => {
      if (!providerId) return null;

      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url, phone),
          categories (id, name, icon, slug)
        `)
        .eq('id', providerId)
        .single();

      if (error) throw error;
      return data as ProviderWithRelations;
    },
    enabled: !!providerId,
  });
}

// Hook pour les featured providers (rétro-compatible)
export function useFeaturedProviders(limit: number = 6) {
  return useQuery({
    queryKey: [Config.cacheKeys.providers, 'featured', limit],
    queryFn: async (): Promise<ProviderWithRelations[]> => {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url),
          categories (id, name, icon, slug)
        `)
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('average_rating', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as ProviderWithRelations[];
    },
  });
}

// ============================================
// HOOKS - Services et avis
// ============================================

// Hook pour les services d'un provider
export function useProviderServices(providerId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.providers, providerId, 'services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', providerId!)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!providerId,
  });
}

// Hook pour les avis d'un provider (avec pagination)
export function useProviderReviews(providerId: string | undefined) {
  return useInfiniteQuery({
    queryKey: [Config.cacheKeys.providers, providerId, 'reviews'],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          client:profiles!reviews_client_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('provider_id', providerId!)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + Config.pageSize - 1);

      if (error) throw error;
      return (data as ReviewWithClient[]) || [];
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < Config.pageSize) return undefined;
      return allPages.length * Config.pageSize;
    },
    initialPageParam: 0,
    enabled: !!providerId,
  });
}

// Hook pour les images portfolio d'un provider
export function useProviderPortfolio(providerId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.providers, providerId, 'portfolio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('provider_id', providerId!)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!providerId,
  });
}
