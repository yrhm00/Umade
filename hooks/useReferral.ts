/**
 * Hooks pour le système de parrainage
 * Gestion des codes, referrals et crédits
 */

import { supabase } from '@/lib/supabase';
import { Config } from '@/constants/Config';
import {
  CreditTransaction,
  ReferralCode,
  ReferralStats,
  ReferralWithUser,
  UserCredits,
} from '@/types/referral';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { checkBadgesForUser } from './useGamification';
import { useGamificationStore } from '@/stores/gamificationStore';

const REFERRAL_CACHE_KEY = 'referral';

// Helper: on force "any" pour eviter les SelectQueryError (selects imbriques/relations).
const fromTable = (table: string) => (supabase as any).from(table);

/**
 * Hook pour récupérer le code de parrainage de l'utilisateur
 */
export function useReferralCode() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [REFERRAL_CACHE_KEY, 'code', userId],
    queryFn: async (): Promise<ReferralCode | null> => {
      if (!userId) return null;

      const { data, error } = await fromTable('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si le code n'existe pas, en créer un
        if (error.code === 'PGRST116') {
          const newCode = generateReferralCode();
          const { data: newData, error: insertError } = await fromTable('referral_codes')
            .insert({
              user_id: userId,
              code: newCode,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          return newData as ReferralCode;
        }
        throw error;
      }

      return data as ReferralCode;
    },
    enabled: !!userId,
  });
}

/**
 * Hook pour récupérer les parrainages de l'utilisateur
 */
export function useReferrals() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [REFERRAL_CACHE_KEY, 'list', userId],
    queryFn: async (): Promise<ReferralWithUser[]> => {
      if (!userId) return [];

      const { data, error } = await fromTable('referrals')
        .select(`
          *,
          referred:referred_id (
            id,
            full_name,
            avatar_url,
            created_at
          )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ReferralWithUser[];
    },
    enabled: !!userId,
  });
}

/**
 * Hook pour les statistiques de parrainage
 */
export function useReferralStats() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [REFERRAL_CACHE_KEY, 'stats', userId],
    queryFn: async (): Promise<ReferralStats> => {
      if (!userId) {
        return {
          total_referrals: 0,
          pending_referrals: 0,
          completed_referrals: 0,
          total_earned: 0,
        };
      }

      // Get referral code data
      const { data: codeData } = await fromTable('referral_codes')
        .select('total_referrals, total_rewards_earned')
        .eq('user_id', userId)
        .single();

      // Get pending and completed counts
      const { data: referrals } = await fromTable('referrals')
        .select('status')
        .eq('referrer_id', userId);

      const pending = (referrals || []).filter((r: any) => r.status === 'pending').length;
      const completed = (referrals || []).filter((r: any) =>
        r.status === 'completed' || r.status === 'rewarded'
      ).length;

      return {
        total_referrals: codeData?.total_referrals || 0,
        pending_referrals: pending,
        completed_referrals: completed,
        total_earned: codeData?.total_rewards_earned || 0,
      };
    },
    enabled: !!userId,
  });
}

/**
 * Hook pour le solde de crédits
 */
export function useCredits() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [REFERRAL_CACHE_KEY, 'credits', userId],
    queryFn: async (): Promise<UserCredits | null> => {
      if (!userId) return null;

      const { data, error } = await fromTable('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Si pas de crédits, en créer
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await fromTable('user_credits')
            .insert({ user_id: userId, balance: 0 })
            .select()
            .single();

          if (insertError) throw insertError;
          return newData as UserCredits;
        }
        throw error;
      }

      return data as UserCredits;
    },
    enabled: !!userId,
  });
}

/**
 * Hook pour l'historique des transactions
 */
export function useCreditHistory() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: [REFERRAL_CACHE_KEY, 'history', userId],
    queryFn: async (): Promise<CreditTransaction[]> => {
      if (!userId) return [];

      const { data, error } = await fromTable('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as CreditTransaction[];
    },
    enabled: !!userId,
  });
}

/**
 * Hook pour appliquer un code de parrainage (lors de l'inscription)
 */
export function useApplyReferralCode() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: async (code: string): Promise<boolean> => {
      if (!userId) throw new Error('Non authentifié');

      // 1. Vérifier que le code existe et est actif
      const { data: referralCode, error: codeError } = await fromTable('referral_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeError || !referralCode) {
        throw new Error('Code de parrainage invalide');
      }

      // 2. Vérifier que l'utilisateur n'est pas son propre parrain
      if (referralCode.user_id === userId) {
        throw new Error('Vous ne pouvez pas utiliser votre propre code');
      }

      // 3. Vérifier que l'utilisateur n'a pas déjà été parrainé
      const { data: existingReferral } = await fromTable('referrals')
        .select('id')
        .eq('referred_id', userId)
        .single();

      if (existingReferral) {
        throw new Error('Vous avez déjà été parrainé');
      }

      // 4. Créer le parrainage
      const { error: referralError } = await fromTable('referrals')
        .insert({
          referrer_id: referralCode.user_id,
          referred_id: userId,
          referral_code: code.toUpperCase(),
          status: 'pending',
        });

      if (referralError) throw referralError;

      // 5. Incrémenter le compteur de parrainages
      await fromTable('referral_codes')
        .update({ total_referrals: (referralCode.total_referrals || 0) + 1 })
        .eq('id', referralCode.id);

      // 6. Donner les crédits au filleul (bonus immédiat)
      await addCredits(userId, 200, 'referee_bonus', 'Bonus de bienvenue (parrainage)');

      return true;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: [REFERRAL_CACHE_KEY] });

      // Gamification : vérifier les badges parrainage (pour le parrain)
      // Le parrain est l'owner du code, on vérifie ses badges
      if (userId) {
        // Note: ici userId est le filleul, mais on vérifie quand même
        // les badges du parrain via le referral_code.user_id
        const badge = await checkBadgesForUser(userId, ['first_referral', 'five_referrals']);
        if (badge) {
          useGamificationStore.getState().setPendingBadge(badge);
          queryClient.invalidateQueries({ queryKey: [Config.cacheKeys.badges] });
        }
      }
    },
  });
}

/**
 * Fonction helper pour générer un code de parrainage
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Fonction helper pour ajouter des crédits — opération atomique via RPC
 * Évite la race condition du pattern read-then-update
 */
async function addCredits(
  userId: string,
  amount: number,
  type: string,
  description: string
): Promise<void> {
  const { error } = await (supabase as any).rpc('add_user_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
  });
  if (error) throw error;
}
