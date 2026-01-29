/**
 * Hook pour gérer les préférences de notifications
 * Note: Nécessite la table notification_preferences en base de données
 * En attendant, utilise les valeurs par défaut
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { NotificationPreferences } from '@/types';

const DEFAULT_PREFERENCES: Omit<
  NotificationPreferences,
  'id' | 'created_at' | 'updated_at'
> = {
  user_id: '',
  booking_updates: true,
  messages: true,
  reviews: true,
  marketing: false,
};

// Note: Cette implémentation utilise les valeurs par défaut
// car la table notification_preferences n'existe pas encore.
// Une fois la table créée, décommentez le code Supabase ci-dessous.

export function useNotificationPreferences() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', userId],
    queryFn: async (): Promise<NotificationPreferences> => {
      // TODO: Activer quand la table existe
      // const { data, error } = await supabase
      //   .from('notification_preferences')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .maybeSingle();
      // if (error) throw error;
      // if (data) return data;

      // Retourner les valeurs par défaut
      return {
        id: 'default',
        ...DEFAULT_PREFERENCES,
        user_id: userId || '',
      };
    },
    enabled: !!userId,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [localPrefs, setLocalPrefs] = useState<Partial<NotificationPreferences>>({});

  const mutate = useCallback(
    (
      preferences: Partial<
        Omit<
          NotificationPreferences,
          'id' | 'user_id' | 'created_at' | 'updated_at'
        >
      >,
      options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
      }
    ) => {
      // TODO: Activer quand la table existe
      // const { data, error } = await supabase
      //   .from('notification_preferences')
      //   .upsert({ user_id: userId, ...preferences, updated_at: new Date().toISOString() })
      //   .select()
      //   .single();
      // if (error) throw error;

      // Pour l'instant, on met à jour localement
      setLocalPrefs((prev) => ({ ...prev, ...preferences }));

      // Optimistic update du cache
      queryClient.setQueryData<NotificationPreferences>(
        ['notification-preferences', userId],
        (old) => {
          if (!old) return old;
          return { ...old, ...preferences };
        }
      );

      options?.onSuccess?.();
    },
    [userId, queryClient]
  );

  return {
    mutate,
    isPending: false,
  };
}
