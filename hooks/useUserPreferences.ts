/**
 * Hook pour gérer les préférences utilisateur (Phase 10)
 */

import { supabase } from '@/lib/supabase';
import {
  UserPreferences,
  EventType,
  DEFAULT_CHECKLIST_ITEMS,
} from '@/types/preferences';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

const PREFERENCES_KEY = 'user-preferences';

// Helper: on force "any" pour eviter les SelectQueryError.
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Récupérer les préférences
// ============================================

export function useUserPreferences() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [PREFERENCES_KEY, userId],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!userId) return null;

      const { data, error } = await fromTable('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as UserPreferences | null;
    },
    enabled: !!userId,
  });
}

// ============================================
// Créer ou mettre à jour les préférences
// ============================================

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!userId) throw new Error('User not authenticated');

      // Check if preferences exist
      const { data: existing } = await fromTable('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update
        const { data, error } = await fromTable('user_preferences')
          .update({
            ...preferences,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await fromTable('user_preferences')
          .insert({
            user_id: userId,
            ...preferences,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREFERENCES_KEY] });
    },
  });
}

// ============================================
// Compléter l'onboarding
// ============================================

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!userId) throw new Error('User not authenticated');

      // 1. Save preferences
      const { data: existing } = await fromTable('user_preferences')
        .select('id')
        .eq('user_id', userId)
        .single();

      const prefsData = {
        ...preferences,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let savedPrefs;
      if (existing) {
        const { data, error } = await fromTable('user_preferences')
          .update(prefsData)
          .eq('user_id', userId)
          .select()
          .single();
        if (error) throw error;
        savedPrefs = data;
      } else {
        const { data, error } = await fromTable('user_preferences')
          .insert({ user_id: userId, ...prefsData })
          .select()
          .single();
        if (error) throw error;
        savedPrefs = data;
      }

      // 2. Create default checklist based on event type
      const eventType = preferences.event_type as EventType;
      if (eventType && DEFAULT_CHECKLIST_ITEMS[eventType]) {
        const checklistItems = DEFAULT_CHECKLIST_ITEMS[eventType].map((item, index) => ({
          user_id: userId,
          category: item.category,
          title: item.title,
          description: null,
          status: 'todo',
          display_order: index,
        }));

        // Insert checklist items (ignore errors if already exists)
        await fromTable('user_checklist_items').insert(checklistItems);
      }

      // 3. Update profile as onboarded
      await supabase
        .from('profiles')
        .update({ is_onboarded: true })
        .eq('id', userId);

      return savedPrefs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PREFERENCES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['checklist'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// ============================================
// Vérifier si l'onboarding est complété
// ============================================

export function useIsOnboardingCompleted() {
  const { data: preferences, isLoading } = useUserPreferences();

  return {
    isCompleted: preferences?.onboarding_completed ?? false,
    isLoading,
  };
}
