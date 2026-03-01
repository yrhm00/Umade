/**
 * Hook pour les statistiques publiques d'un prestataire
 * Données affichées côté client (temps de réponse, taux de réponse, etc.)
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export interface ProviderPublicStats {
  avg_response_time: number | null; // en minutes
  response_rate: number | null; // 0-100 pourcentage
  bookings_this_month: number | null;
}

async function fetchProviderPublicStats(
  providerId: string
): Promise<ProviderPublicStats | null> {
  const { data, error } = await supabase
    .from('provider_stats')
    .select('avg_response_time, response_rate, bookings_this_month')
    .eq('provider_id', providerId)
    .single();

  if (error) {
    // Pas de stats pour ce prestataire
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as ProviderPublicStats;
}

export function useProviderPublicStats(providerId: string | undefined) {
  return useQuery({
    queryKey: [Config.cacheKeys.providers, 'public-stats', providerId],
    queryFn: () => fetchProviderPublicStats(providerId!),
    enabled: !!providerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
