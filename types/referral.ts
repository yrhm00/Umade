/**
 * Types pour le Système de Parrainage
 * Gestion des codes de parrainage et des crédits
 */

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  total_referrals: number;
  total_rewards_earned: number;
  is_active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: ReferralStatus;
  completed_at?: string | null;
  rewarded_at?: string | null;
  created_at: string;
}

export type ReferralStatus = 'pending' | 'completed' | 'rewarded' | 'expired';

export interface ReferralWithUser extends Referral {
  referred?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
}

export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: CreditTransactionType;
  reference_id?: string | null;
  description?: string | null;
  created_at: string;
}

export type CreditTransactionType =
  | 'referral_bonus'
  | 'referee_bonus'
  | 'booking_reward'
  | 'spent'
  | 'expired'
  | 'manual';

export interface ReferralConfig {
  referrer_reward: number;
  referee_reward: number;
  min_booking_for_completion: number;
  reward_expiry_days: number;
}

export interface ReferralStats {
  total_referrals: number;
  pending_referrals: number;
  completed_referrals: number;
  total_earned: number;
}

// Default config values
export const DEFAULT_REFERRAL_CONFIG: ReferralConfig = {
  referrer_reward: 500,
  referee_reward: 200,
  min_booking_for_completion: 0,
  reward_expiry_days: 365,
};
