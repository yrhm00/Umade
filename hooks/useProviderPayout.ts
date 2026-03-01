import { supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

interface ProviderWalletSummary {
  provider_id: string;
  held_amount: number;
  available_amount: number;
  reserved_amount: number;
  paid_out_amount: number;
  total_released_amount: number;
}

interface ProviderStripeConnectStatus {
  provider_id: string;
  stripe_account_id: string;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  payout_schedule_mode: 'manual' | 'automatic';
  onboarding_completed_at: string | null;
  requirements_currently_due: string[];
  capabilities: Record<string, string>;
}

interface ProviderOnboardingResponse {
  providerId: string;
  stripeAccountId: string;
  onboardingUrl: string | null;
  dashboardLoginUrl: string | null;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  payoutScheduleMode: 'manual' | 'automatic';
  requirementsCurrentlyDue: string[];
  onboardingCompleted: boolean;
}

interface ProviderPayoutResponse {
  payoutRequestId: string;
  stripePayoutId: string;
  status: 'processing' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  stripeAccountId: string;
}

const providerWalletSummaryKey = (userId: string | null | undefined) => [
  'provider-wallet-summary',
  userId,
];

const providerStripeConnectKey = (userId: string | null | undefined) => [
  'provider-stripe-connect',
  userId,
];

export function useProviderWalletSummary() {
  const { userId, isProvider } = useAuth();

  return useQuery({
    queryKey: providerWalletSummaryKey(userId),
    queryFn: async (): Promise<ProviderWalletSummary | null> => {
      const { data, error } = await (supabase as any).rpc('get_provider_wallet_summary');
      if (error) throw error;

      const rows = (data as any[]) || [];
      const first = rows[0];
      if (!first) return null;

      return {
        provider_id: first.provider_id,
        held_amount: Number(first.held_amount || 0),
        available_amount: Number(first.available_amount || 0),
        reserved_amount: Number(first.reserved_amount || 0),
        paid_out_amount: Number(first.paid_out_amount || 0),
        total_released_amount: Number(first.total_released_amount || 0),
      };
    },
    enabled: !!userId && isProvider,
  });
}

export function useProviderStripeConnectStatus() {
  const { userId, isProvider } = useAuth();

  return useQuery({
    queryKey: providerStripeConnectKey(userId),
    queryFn: async (): Promise<ProviderStripeConnectStatus | null> => {
      const { data, error } = await supabase
        .from('providers')
        .select(
          `
          id,
          provider_stripe_accounts (
            provider_id,
            stripe_account_id,
            details_submitted,
            charges_enabled,
            payouts_enabled,
            payout_schedule_mode,
            onboarding_completed_at,
            requirements_currently_due,
            capabilities
          )
          `
        )
        .eq('user_id', userId as string)
        .maybeSingle();

      if (error) throw error;

      const stripeAccountRaw = (data as any)?.provider_stripe_accounts;
      const stripeAccount = Array.isArray(stripeAccountRaw)
        ? stripeAccountRaw[0]
        : stripeAccountRaw;
      if (!stripeAccount) return null;

      return {
        provider_id: stripeAccount.provider_id,
        stripe_account_id: stripeAccount.stripe_account_id,
        details_submitted: Boolean(stripeAccount.details_submitted),
        charges_enabled: Boolean(stripeAccount.charges_enabled),
        payouts_enabled: Boolean(stripeAccount.payouts_enabled),
        payout_schedule_mode:
          stripeAccount.payout_schedule_mode === 'automatic' ? 'automatic' : 'manual',
        onboarding_completed_at: stripeAccount.onboarding_completed_at || null,
        requirements_currently_due: Array.isArray(stripeAccount.requirements_currently_due)
          ? stripeAccount.requirements_currently_due
          : [],
        capabilities:
          stripeAccount.capabilities && typeof stripeAccount.capabilities === 'object'
            ? stripeAccount.capabilities
            : {},
      };
    },
    enabled: !!userId && isProvider,
  });
}

export function useProviderConnectOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      returnUrl,
      refreshUrl,
    }: {
      returnUrl?: string;
      refreshUrl?: string;
    } = {}): Promise<ProviderOnboardingResponse> => {
      const { data, error } = await supabase.functions.invoke('provider-connect-onboarding', {
        body: {
          returnUrl,
          refreshUrl,
        },
      });

      if (error) {
        const context = (error as any)?.context;
        let detailedMessage: string | null = null;

        if (context) {
          try {
            if (typeof context.clone === 'function') {
              const cloned = context.clone();
              const details = await cloned.json();
              if (details?.error) {
                detailedMessage = String(details.error);
              }
            }
          } catch {
            // Ignore JSON parsing failure and try text below.
          }

          if (!detailedMessage) {
            try {
              const text = await context.text();
              if (text) {
                try {
                  const parsed = JSON.parse(text);
                  if (parsed?.error) {
                    detailedMessage = String(parsed.error);
                  } else {
                    detailedMessage = text;
                  }
                } catch {
                  detailedMessage = text;
                }
              }
            } catch {
              // Ignore text parsing failure.
            }
          }
        }

        throw new Error(
          detailedMessage || error.message || 'Impossible de lancer l\'onboarding Stripe Connect.'
        );
      }

      return data as ProviderOnboardingResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-stripe-connect'] });
      queryClient.invalidateQueries({ queryKey: ['provider-wallet-summary'] });
    },
  });
}

export function useProviderRequestPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount }: { amount?: number } = {}): Promise<ProviderPayoutResponse> => {
      const { data, error } = await supabase.functions.invoke('provider-request-payout', {
        body: {
          amount,
        },
      });

      if (error) {
        const context = (error as any)?.context;
        let detailedMessage: string | null = null;

        if (context) {
          try {
            if (typeof context.clone === 'function') {
              const cloned = context.clone();
              const details = await cloned.json();
              if (details?.error) {
                detailedMessage = String(details.error);
              }
            }
          } catch {
            // Ignore JSON parsing failure and try text below.
          }

          if (!detailedMessage) {
            try {
              const text = await context.text();
              if (text) {
                try {
                  const parsed = JSON.parse(text);
                  if (parsed?.error) {
                    detailedMessage = String(parsed.error);
                  } else {
                    detailedMessage = text;
                  }
                } catch {
                  detailedMessage = text;
                }
              }
            } catch {
              // Ignore text parsing failure.
            }
          }
        }

        throw new Error(detailedMessage || error.message || 'Impossible de créer le payout prestataire.');
      }

      return data as ProviderPayoutResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-wallet-summary'] });
      queryClient.invalidateQueries({ queryKey: ['provider-stripe-connect'] });
    },
  });
}

export function useConfirmBookingCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      note,
    }: {
      bookingId: string;
      note?: string | null;
    }) => {
      const { data, error } = await (supabase as any).rpc('confirm_booking_completion', {
        p_booking_id: bookingId,
        p_note: note || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['booking-advanced', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking-payments', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking-completion', variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ['provider-wallet-summary'] });
    },
  });
}
