/**
 * Fetch the current user's provider_id (if they are a provider).
 * Kept as a separate hook instead of stuffing it into useAuth(), since it requires I/O.
 */

import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export function useMyProviderId() {
  const { userId, isProvider } = useAuth();

  const { data: providerId } = useQuery({
    queryKey: ['provider-id', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return (data as any)?.id ?? null;
    },
    enabled: !!userId && isProvider,
    staleTime: Infinity,
  });

  return providerId ?? null;
}

