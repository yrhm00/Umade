// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PayoutRequestBody {
  amount?: number | string | null;
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function statusFromStripePayout(status: string | undefined | null): 'processing' | 'paid' | 'failed' | 'cancelled' {
  if (status === 'paid') return 'paid';
  if (status === 'failed') return 'failed';
  if (status === 'canceled') return 'cancelled';
  return 'processing';
}

async function stripeCreatePayout(params: {
  stripeSecretKey: string;
  stripeAccountId: string;
  amountCents: number;
  currency: string;
  payoutRequestId: string;
  providerId: string;
  idempotencyKey?: string;
}) {
  const form = new URLSearchParams();
  form.set('amount', String(params.amountCents));
  form.set('currency', params.currency.toLowerCase());
  form.set('metadata[payout_request_id]', params.payoutRequestId);
  form.set('metadata[provider_id]', params.providerId);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.stripeSecretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Stripe-Account': params.stripeAccountId,
  };
  if (params.idempotencyKey) {
    headers['Idempotency-Key'] = params.idempotencyKey;
  }

  const response = await fetch('https://api.stripe.com/v1/payouts', {
    method: 'POST',
    headers,
    body: form.toString(),
  });

  const payload = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

async function stripeGetBalance(params: {
  stripeSecretKey: string;
  stripeAccountId: string;
}) {
  const response = await fetch('https://api.stripe.com/v1/balance', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.stripeSecretKey}`,
      'Stripe-Account': params.stripeAccountId,
    },
  });

  const payload = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

async function stripeCreateTransfer(params: {
  stripeSecretKey: string;
  destinationAccountId: string;
  amountCents: number;
  currency: string;
  payoutRequestId: string;
  providerId: string;
  idempotencyKey?: string;
}) {
  const form = new URLSearchParams();
  form.set('amount', String(params.amountCents));
  form.set('currency', params.currency.toLowerCase());
  form.set('destination', params.destinationAccountId);
  form.set('transfer_group', `umade_payout_${params.payoutRequestId}`);
  form.set('metadata[payout_request_id]', params.payoutRequestId);
  form.set('metadata[provider_id]', params.providerId);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.stripeSecretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  if (params.idempotencyKey) {
    headers['Idempotency-Key'] = params.idempotencyKey;
  }

  const response = await fetch('https://api.stripe.com/v1/transfers', {
    method: 'POST',
    headers,
    body: form.toString(),
  });

  const payload = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

function getAvailableCentsForCurrency(
  balancePayload: any,
  currency: string
): number {
  const entries = Array.isArray(balancePayload?.available) ? balancePayload.available : [];
  const targetCurrency = currency.toLowerCase();
  const matched = entries.find(
    (entry: any) => String(entry?.currency || '').toLowerCase() === targetCurrency
  );
  return Math.max(toNumber(matched?.amount), 0);
}

function isStripeInsufficientBalanceError(payload: any): boolean {
  const code = String(payload?.error?.code || '').toLowerCase();
  const message = String(payload?.error?.message || '').toLowerCase();
  return (
    code === 'balance_insufficient' ||
    message.includes('insufficient') ||
    message.includes('not enough')
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !stripeSecretKey) {
    return json(500, { error: 'Server configuration incomplete' });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json(401, { error: 'Missing authorization header' });
  }

  let payload: PayoutRequestBody = {};
  try {
    payload = ((await req.json()) || {}) as PayoutRequestBody;
  } catch {
    payload = {};
  }

  const requestedAmount = payload.amount == null ? null : roundMoney(toNumber(payload.amount));
  if (requestedAmount !== null && requestedAmount <= 0) {
    return json(400, { error: 'Le montant du payout doit être supérieur à 0.' });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json(401, { error: 'Authentication failed' });
  }

  const { data: payoutRequest, error: payoutRequestError } = await userClient.rpc(
    'create_provider_payout_request',
    {
      p_amount: requestedAmount,
    }
  );

  if (payoutRequestError || !payoutRequest) {
    return json(400, {
      error: payoutRequestError?.message || 'Impossible de créer la demande de payout.',
    });
  }

  const payoutRequestId = payoutRequest.id as string;
  const providerId = payoutRequest.provider_id as string;
  const payoutAmount = roundMoney(toNumber(payoutRequest.amount));
  const payoutCurrency = ((payoutRequest.currency as string) || 'EUR').toUpperCase();
  const payoutAmountCents = Math.round(payoutAmount * 100);

  const failAndRelease = async (reason: string, status = 400) => {
    await adminClient.rpc('update_provider_payout_status', {
      p_payout_request_id: payoutRequestId,
      p_status: 'failed',
      p_failure_reason: reason,
    });

    return json(status, { error: reason, payoutRequestId });
  };

  const { data: providerStripeAccount, error: providerStripeAccountError } = await adminClient
    .from('provider_stripe_accounts')
    .select('stripe_account_id, details_submitted, payouts_enabled')
    .eq('provider_id', providerId)
    .maybeSingle();

  if (providerStripeAccountError) {
    return failAndRelease(providerStripeAccountError.message, 500);
  }

  if (!providerStripeAccount?.stripe_account_id) {
    return failAndRelease('Le compte Stripe Connect prestataire n\'est pas configuré.', 400);
  }

  if (providerStripeAccount.details_submitted !== true) {
    return failAndRelease('Le compte Stripe Connect prestataire n\'est pas finalisé.', 400);
  }

  if (providerStripeAccount.payouts_enabled !== true) {
    return failAndRelease('Les payouts Stripe ne sont pas activés pour ce prestataire.', 400);
  }

  let payoutResult = await stripeCreatePayout({
    stripeSecretKey,
    stripeAccountId: providerStripeAccount.stripe_account_id,
    amountCents: payoutAmountCents,
    currency: payoutCurrency,
    payoutRequestId,
    providerId,
    idempotencyKey: `umade_payout_${payoutRequestId}_initial`,
  });

  if (!payoutResult.ok && isStripeInsufficientBalanceError(payoutResult.payload)) {
    const balanceResult = await stripeGetBalance({
      stripeSecretKey,
      stripeAccountId: providerStripeAccount.stripe_account_id,
    });

    if (!balanceResult.ok) {
      const balanceErrorMessage =
        balanceResult.payload?.error?.message ||
        'Impossible de vérifier le solde Stripe du prestataire.';
      return failAndRelease(balanceErrorMessage, 400);
    }

    const connectedAvailableCents = getAvailableCentsForCurrency(balanceResult.payload, payoutCurrency);
    const shortfallCents = Math.max(payoutAmountCents - connectedAvailableCents, 0);

    if (shortfallCents > 0) {
      const transferResult = await stripeCreateTransfer({
        stripeSecretKey,
        destinationAccountId: providerStripeAccount.stripe_account_id,
        amountCents: shortfallCents,
        currency: payoutCurrency,
        payoutRequestId,
        providerId,
        idempotencyKey: `umade_transfer_${payoutRequestId}_${shortfallCents}`,
      });

      if (!transferResult.ok) {
        const transferMessage =
          transferResult.payload?.error?.message ||
          'Impossible de transférer les fonds vers le compte prestataire.';
        return failAndRelease(transferMessage, 400);
      }

      payoutResult = await stripeCreatePayout({
        stripeSecretKey,
        stripeAccountId: providerStripeAccount.stripe_account_id,
        amountCents: payoutAmountCents,
        currency: payoutCurrency,
        payoutRequestId,
        providerId,
        idempotencyKey: `umade_payout_${payoutRequestId}_after_transfer`,
      });
    }
  }

  if (!payoutResult.ok) {
    const stripeMessage =
      payoutResult.payload?.error?.message || 'Impossible de créer le payout Stripe.';
    return failAndRelease(stripeMessage, 400);
  }

  const stripePayoutId = payoutResult.payload?.id as string | undefined;
  const stripePayoutStatus = payoutResult.payload?.status as string | undefined;
  const internalStatus = statusFromStripePayout(stripePayoutStatus);

  if (!stripePayoutId) {
    return failAndRelease('Stripe payout id manquant dans la réponse Stripe.', 500);
  }

  const { error: statusUpdateError } = await adminClient.rpc('update_provider_payout_status', {
    p_payout_request_id: payoutRequestId,
    p_status: internalStatus,
    p_stripe_payout_id: stripePayoutId,
    p_failure_reason: payoutResult.payload?.failure_message || null,
  });

  if (statusUpdateError) {
    return json(500, {
      error: statusUpdateError.message,
      payoutRequestId,
      stripePayoutId,
    });
  }

  return json(200, {
    payoutRequestId,
    stripePayoutId,
    status: internalStatus,
    amount: payoutAmount,
    currency: payoutCurrency,
    stripeAccountId: providerStripeAccount.stripe_account_id,
  });
});
