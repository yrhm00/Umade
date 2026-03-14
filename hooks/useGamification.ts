/**
 * Moteur de gamification — vérification et attribution automatique des badges
 * Utilise le RPC check_and_award_badge(p_user_id, p_badge_code) existant en DB.
 */

import { Config } from '@/constants/Config';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/types/badges';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

// Helper pour les relations imbriquées (bypass SelectQueryError)
const fromTable = (table: string) => (supabase as any).from(table);

// ============================================
// Règles d'éligibilité par badge
// ============================================

type BadgeRule = (userId: string) => Promise<boolean>;

const BADGE_RULES: Record<string, BadgeRule> = {
  first_booking: async (userId) => {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'completed');
    return (count ?? 0) >= 1;
  },

  five_bookings: async (userId) => {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'completed');
    return (count ?? 0) >= 5;
  },

  ten_bookings: async (userId) => {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('status', 'completed');
    return (count ?? 0) >= 10;
  },

  first_review: async (userId) => {
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId);
    return (count ?? 0) >= 1;
  },

  five_reviews: async (userId) => {
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId);
    return (count ?? 0) >= 5;
  },

  first_event: async (userId) => {
    const { count } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', userId);
    return (count ?? 0) >= 1;
  },

  profile_complete: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, city')
      .eq('id', userId)
      .single();
    return !!(data?.full_name && data?.avatar_url && data?.city);
  },

  first_referral: async (userId) => {
    const { count } = await fromTable('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .in('status', ['completed', 'rewarded']);
    return (count ?? 0) >= 1;
  },

  five_referrals: async (userId) => {
    const { count } = await fromTable('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', userId)
      .in('status', ['completed', 'rewarded']);
    return (count ?? 0) >= 5;
  },

  social_butterfly: async (userId) => {
    const { count } = await fromTable('social_posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) >= 3;
  },

  first_inspiration_fav: async (userId) => {
    const { count } = await fromTable('inspiration_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) >= 1;
  },

  budget_master: async (userId) => {
    // Compter les budget_items payés dans tous les événements de l'utilisateur
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('client_id', userId);

    if (!events || events.length === 0) return false;

    const eventIds = events.map((e) => e.id);
    const { count } = await fromTable('budget_items')
      .select('*', { count: 'exact', head: true })
      .in('event_id', eventIds)
      .eq('is_paid', true);
    return (count ?? 0) >= 5;
  },

  early_bird: async (userId) => {
    // Vérifier si au moins un booking a été créé avant 8h du matin
    const { data } = await supabase
      .from('bookings')
      .select('created_at')
      .eq('client_id', userId)
      .limit(100);

    if (!data) return false;
    return data.some((booking) => {
      if (!booking.created_at) return false;
      const hour = new Date(booking.created_at).getHours();
      return hour < 8;
    });
  },

  night_owl: async (userId) => {
    // Vérifier si au moins un booking a été créé après 22h
    const { data } = await supabase
      .from('bookings')
      .select('created_at')
      .eq('client_id', userId)
      .limit(100);

    if (!data) return false;
    return data.some((booking) => {
      if (!booking.created_at) return false;
      const hour = new Date(booking.created_at).getHours();
      return hour >= 22;
    });
  },

  super_planner: async (userId) => {
    // Événement avec checklist, budget, timeline et guests tous remplis
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('client_id', userId);

    if (!events || events.length === 0) return false;

    for (const event of events) {
      const [checklistRes, budgetRes, timelineRes, guestsRes] = await Promise.all([
        fromTable('checklist_items').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
        fromTable('budget_items').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
        fromTable('timeline_items').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
        fromTable('guests').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
      ]);

      const hasAll =
        (checklistRes.count ?? 0) > 0 &&
        (budgetRes.count ?? 0) > 0 &&
        (timelineRes.count ?? 0) > 0 &&
        (guestsRes.count ?? 0) > 0;

      if (hasAll) return true;
    }

    return false;
  },
};

// ============================================
// Hook principal : vérifier et attribuer les badges
// ============================================

/**
 * Vérifie l'éligibilité d'un ou plusieurs badges et les attribue si gagné.
 * Déclenche la célébration via le gamificationStore.
 */
export function useCheckBadgeEligibility() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const setPendingBadge = useGamificationStore((s) => s.setPendingBadge);

  return useMutation({
    mutationFn: async (badgeCodes: string[]): Promise<Badge | null> => {
      if (!userId) return null;

      for (const code of badgeCodes) {
        const rule = BADGE_RULES[code];
        if (!rule) continue;

        try {
          const isEligible = await rule(userId);
          if (!isEligible) continue;

          // Appeler le RPC qui vérifie si le badge n'est pas déjà attribué
          const { data, error } = await supabase.rpc(
            'check_and_award_badge' as any,
            { p_user_id: userId, p_badge_code: code }
          );

          if (error) {
            if (__DEV__) console.error(`Badge check error (${code}):`, error);
            continue;
          }

          // Si le RPC a attribué le badge (retourne true ou le badge id)
          if (data) {
            // Récupérer les détails du badge pour la célébration
            const { data: badge } = await supabase
              .from('badges')
              .select('*')
              .eq('code', code)
              .single();

            if (badge) {
              return badge as Badge;
            }
          }
        } catch (err) {
          if (__DEV__) console.error(`Badge rule error (${code}):`, err);
        }
      }

      return null;
    },
    onSuccess: (badge) => {
      if (badge) {
        // Déclencher la célébration
        setPendingBadge(badge);

        // Invalider les caches badges
        queryClient.invalidateQueries({
          queryKey: [Config.cacheKeys.badges],
        });
      }
    },
  });
}

/**
 * Helper non-hook pour vérifier les badges en dehors des composants React.
 * Utile dans les onSuccess des mutations existantes.
 */
export async function checkBadgesForUser(
  userId: string,
  badgeCodes: string[]
): Promise<Badge | null> {
  for (const code of badgeCodes) {
    const rule = BADGE_RULES[code];
    if (!rule) continue;

    try {
      const isEligible = await rule(userId);
      if (!isEligible) continue;

      const { data, error } = await supabase.rpc(
        'check_and_award_badge' as any,
        { p_user_id: userId, p_badge_code: code }
      );

      if (error) {
        if (__DEV__) console.error(`Badge check error (${code}):`, error);
        continue;
      }

      if (data) {
        const { data: badge } = await supabase
          .from('badges')
          .select('*')
          .eq('code', code)
          .single();

        if (badge) {
          return badge as Badge;
        }
      }
    } catch (err) {
      if (__DEV__) console.error(`Badge rule error (${code}):`, err);
    }
  }

  return null;
}
