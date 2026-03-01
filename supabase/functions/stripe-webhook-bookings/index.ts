// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type CheckoutStatus = 'created' | 'paid' | 'expired' | 'failed' | 'cancelled';
type PaymentType = 'deposit' | 'balance' | 'full' | 'refund';
type PayoutUpdateStatus = 'processing' | 'paid' | 'failed' | 'cancelled';

interface StripeEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  account?: string | null;
  data?: {
    object?: T;
  };
}

interface StripeCheckoutSession {
  id: string;
  metadata?: Record<string, string>;
  amount_total?: number | null;
  currency?: string | null;
  payment_status?: string | null;
  payment_intent?: string | { id?: string } | null;
  url?: string | null;
  expires_at?: number | null;
}

interface StripePayout {
  id: string;
  metadata?: Record<string, string>;
  amount?: number | null;
  currency?: string | null;
  status?: string | null;
  failure_message?: string | null;
}

interface StripeConnectedAccount {
  id: string;
  country?: string | null;
  default_currency?: string | null;
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  requirements?: {
    currently_due?: string[] | null;
  } | null;
  capabilities?: Record<string, string> | null;
  settings?: {
    payouts?: {
      schedule?: {
        interval?: string | null;
      } | null;
    } | null;
  } | null;
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

function normalizePaymentType(value: unknown): PaymentType | null {
  if (
    value === 'deposit' ||
    value === 'balance' ||
    value === 'full' ||
    value === 'refund'
  ) {
    return value;
  }
  return null;
}

function parseAmountCentsToEur(value: unknown): number | null {
  const cents = toNumber(value);
  if (!Number.isFinite(cents) || cents <= 0) return null;
  return roundMoney(cents / 100);
}

function parsePaymentIntentId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const maybeId = (value as { id?: string }).id;
    return maybeId || null;
  }
  return null;
}

function parseStripeSignatureHeader(signatureHeader: string): {
  timestamp: number | null;
  signatures: string[];
} {
  const parts = signatureHeader
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);

  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    const value = rest.join('=');
    if (key === 't') {
      const parsed = Number(value);
      timestamp = Number.isFinite(parsed) ? parsed : null;
      continue;
    }
    if (key === 'v1' && value) {
      signatures.push(value);
    }
  }

  return { timestamp, signatures };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function payoutStatusFromEventType(eventType: string): PayoutUpdateStatus {
  if (eventType === 'payout.paid') return 'paid';
  if (eventType === 'payout.failed') return 'failed';
  if (eventType === 'payout.canceled') return 'cancelled';
  return 'processing';
}

async function computeHmacSHA256(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(signature);
}

async function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string
): Promise<boolean> {
  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const toleranceInSeconds = 300;
  if (Math.abs(nowInSeconds - timestamp) > toleranceInSeconds) {
    return false;
  }

  const expected = await computeHmacSHA256(webhookSecret, `${timestamp}.${rawBody}`);
  return signatures.some((candidate) => timingSafeEqual(candidate, expected));
}

function parseWebhookSecrets(rawValue: string | null | undefined): string[] {
  if (!rawValue) return [];
  return rawValue
    .split(',')
    .map((secret) => secret.trim())
    .filter(Boolean);
}

async function verifyStripeSignatureAgainstAnySecret(
  rawBody: string,
  signatureHeader: string,
  webhookSecrets: string[]
): Promise<boolean> {
  if (!webhookSecrets.length) return false;

  for (const secret of webhookSecrets) {
    const isValid = await verifyStripeSignature(rawBody, signatureHeader, secret);
    if (isValid) return true;
  }

  return false;
}

async function upsertCheckoutStatus(
  adminClient: ReturnType<typeof createClient>,
  session: StripeCheckoutSession,
  status: CheckoutStatus
) {
  const bookingId = session.metadata?.booking_id;
  const paymentType = normalizePaymentType(session.metadata?.payment_type);
  const amount = roundMoney(toNumber(session.amount_total) / 100);
  const baseAmount = parseAmountCentsToEur(session.metadata?.base_amount_cents) || amount;
  const clientFee = parseAmountCentsToEur(session.metadata?.client_fee_cents) || 0;
  const providerFee = parseAmountCentsToEur(session.metadata?.provider_fee_cents) || 0;
  const providerNetAmount =
    parseAmountCentsToEur(session.metadata?.provider_net_amount_cents) ||
    roundMoney(Math.max(baseAmount - providerFee, 0));
  const paymentIntentId = parsePaymentIntentId(session.payment_intent);
  const expiresAt = session.expires_at
    ? new Date(toNumber(session.expires_at) * 1000).toISOString()
    : null;

  const updatePayload: Record<string, unknown> = {
    status,
    amount: amount > 0 ? amount : 0,
    base_amount: baseAmount,
    client_fee_amount: clientFee,
    provider_fee_amount: providerFee,
    provider_net_amount: providerNetAmount,
    stripe_payment_intent_id: paymentIntentId,
    paid_at: status === 'paid' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
    expires_at: expiresAt,
    metadata: {
      payment_status: session.payment_status ?? null,
      base_amount_cents: session.metadata?.base_amount_cents ?? null,
      client_fee_cents: session.metadata?.client_fee_cents ?? null,
      provider_fee_cents: session.metadata?.provider_fee_cents ?? null,
      provider_net_amount_cents: session.metadata?.provider_net_amount_cents ?? null,
    },
  };

  if (bookingId && paymentType) {
    await adminClient.from('booking_checkout_sessions').upsert(
      {
        booking_id: bookingId,
        payment_type: paymentType,
        currency: (session.currency || 'eur').toUpperCase(),
        stripe_checkout_session_id: session.id,
        ...updatePayload,
      },
      { onConflict: 'stripe_checkout_session_id' }
    );
    return;
  }

  await adminClient
    .from('booking_checkout_sessions')
    .update(updatePayload)
    .eq('stripe_checkout_session_id', session.id);
}

async function handleCheckoutCompleted(
  adminClient: ReturnType<typeof createClient>,
  session: StripeCheckoutSession
) {
  await upsertCheckoutStatus(adminClient, session, 'paid');

  if (session.payment_status !== 'paid') {
    return json(200, { received: true, ignored: 'Payment not yet settled' });
  }

  const bookingId = session.metadata?.booking_id;
  const paymentType = normalizePaymentType(session.metadata?.payment_type);
  const chargedAmount = roundMoney(toNumber(session.amount_total) / 100);
  const baseAmount =
    parseAmountCentsToEur(session.metadata?.base_amount_cents) || chargedAmount;
  const clientFee = parseAmountCentsToEur(session.metadata?.client_fee_cents) || 0;
  const providerFee = parseAmountCentsToEur(session.metadata?.provider_fee_cents) || 0;
  const providerNetAmount =
    parseAmountCentsToEur(session.metadata?.provider_net_amount_cents) ||
    roundMoney(Math.max(baseAmount - providerFee, 0));
  const paymentIntentId = parsePaymentIntentId(session.payment_intent);
  const transactionRef = paymentIntentId || session.id;

  if (!bookingId || !paymentType || baseAmount <= 0) {
    return json(200, { received: true, ignored: 'Missing booking payment metadata' });
  }

  const { data: existingCheckout } = await adminClient
    .from('booking_checkout_sessions')
    .select('processed_at')
    .eq('stripe_checkout_session_id', session.id)
    .maybeSingle();

  if (existingCheckout?.processed_at) {
    return json(200, { received: true, idempotent: true });
  }

  const { error: recordPaymentError } = await adminClient.rpc(
    'record_booking_payment_from_checkout',
    {
      p_booking_id: bookingId,
      p_payment_type: paymentType,
      p_amount: baseAmount,
      p_transaction_ref: transactionRef,
      p_note: `Stripe Checkout ${session.id}${
        clientFee !== 0 || providerFee !== 0
          ? ` · Frais client ${clientFee.toFixed(2)}€ · Frais prestataire ${providerFee.toFixed(2)}€`
          : ''
      }`,
    }
  );

  if (recordPaymentError) {
    console.error('record_booking_payment_from_checkout_failed', {
      sessionId: session.id,
      bookingId,
      paymentType,
      error: recordPaymentError.message,
    });
    return json(500, { error: 'Failed to settle booking payment' });
  }

  const { error: holdError } = await adminClient.rpc('record_provider_hold_from_checkout', {
    p_booking_id: bookingId,
    p_checkout_session_id: session.id,
    p_transaction_ref: transactionRef,
    p_base_amount: baseAmount,
    p_provider_fee_amount: providerFee,
    p_client_fee_amount: clientFee,
    p_currency: (session.currency || 'eur').toUpperCase(),
  });

  if (holdError) {
    console.error('record_provider_hold_from_checkout_failed', {
      sessionId: session.id,
      bookingId,
      error: holdError.message,
    });
    return json(500, { error: 'Failed to record provider hold' });
  }

  const { data: completionConfirmation } = await adminClient
    .from('booking_completion_confirmations')
    .select('provider_confirmed_at, client_confirmed_at')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (
    completionConfirmation?.provider_confirmed_at &&
    completionConfirmation?.client_confirmed_at
  ) {
    const { error: releaseError } = await adminClient.rpc(
      'release_booking_funds_for_payout',
      {
        p_booking_id: bookingId,
        p_force: true,
      }
    );

    if (releaseError) {
      console.error('release_booking_funds_for_payout_failed', {
        sessionId: session.id,
        bookingId,
        error: releaseError.message,
      });
    }
  }

  await adminClient
    .from('booking_checkout_sessions')
    .update({
      status: 'paid',
      base_amount: baseAmount,
      client_fee_amount: clientFee,
      provider_fee_amount: providerFee,
      provider_net_amount: providerNetAmount,
      processed_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', session.id);

  return json(200, { received: true, settled: true });
}

async function handlePayoutEvent(
  adminClient: ReturnType<typeof createClient>,
  payout: StripePayout,
  eventType: string
) {
  if (!payout?.id) {
    return json(200, { received: true, ignored: 'No payout object' });
  }

  const status = payoutStatusFromEventType(eventType);
  let payoutRequestId = payout.metadata?.payout_request_id || null;

  if (!payoutRequestId) {
    const { data: payoutRequest } = await adminClient
      .from('provider_payout_requests')
      .select('id')
      .eq('stripe_payout_id', payout.id)
      .maybeSingle();

    payoutRequestId = payoutRequest?.id || null;
  }

  if (!payoutRequestId) {
    return json(200, {
      received: true,
      ignored: 'No payout request mapped for this payout id',
      payoutId: payout.id,
    });
  }

  const { error: payoutUpdateError } = await adminClient.rpc(
    'update_provider_payout_status',
    {
      p_payout_request_id: payoutRequestId,
      p_status: status,
      p_stripe_payout_id: payout.id,
      p_failure_reason: payout.failure_message || null,
    }
  );

  if (payoutUpdateError) {
    console.error('update_provider_payout_status_failed', {
      payoutId: payout.id,
      payoutRequestId,
      status,
      error: payoutUpdateError.message,
    });
    return json(500, { error: 'Failed to update payout status' });
  }

  return json(200, {
    received: true,
    payoutId: payout.id,
    payoutRequestId,
    status,
  });
}

async function handleConnectedAccountUpdated(
  adminClient: ReturnType<typeof createClient>,
  account: StripeConnectedAccount
) {
  if (!account?.id) {
    return json(200, { received: true, ignored: 'No account object' });
  }

  const { data: existingRow, error: existingRowError } = await adminClient
    .from('provider_stripe_accounts')
    .select('provider_id, onboarding_completed_at')
    .eq('stripe_account_id', account.id)
    .maybeSingle();

  if (existingRowError) {
    console.error('provider_stripe_accounts_lookup_failed', {
      stripeAccountId: account.id,
      error: existingRowError.message,
    });
    return json(500, { error: 'Failed to lookup provider stripe account' });
  }

  if (!existingRow?.provider_id) {
    return json(200, { received: true, ignored: 'Unmapped connected account' });
  }

  const detailsSubmitted = account.details_submitted === true;
  const chargesEnabled = account.charges_enabled === true;
  const payoutsEnabled = account.payouts_enabled === true;
  const onboardingCompleted = detailsSubmitted && chargesEnabled && payoutsEnabled;

  const payoutScheduleInterval =
    account.settings?.payouts?.schedule?.interval === 'manual' ? 'manual' : 'automatic';

  const requirementsCurrentlyDue = Array.isArray(account.requirements?.currently_due)
    ? account.requirements?.currently_due
    : [];

  const { error: updateError } = await adminClient
    .from('provider_stripe_accounts')
    .update({
      country: (account.country || 'BE').toUpperCase(),
      default_currency: (account.default_currency || 'eur').toLowerCase(),
      details_submitted: detailsSubmitted,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      payout_schedule_mode: payoutScheduleInterval,
      onboarding_completed_at: onboardingCompleted
        ? existingRow.onboarding_completed_at || new Date().toISOString()
        : null,
      requirements_currently_due: requirementsCurrentlyDue,
      capabilities: account.capabilities || {},
      updated_at: new Date().toISOString(),
    })
    .eq('provider_id', existingRow.provider_id);

  if (updateError) {
    console.error('provider_stripe_accounts_update_failed', {
      stripeAccountId: account.id,
      providerId: existingRow.provider_id,
      error: updateError.message,
    });
    return json(500, { error: 'Failed to sync connected account state' });
  }

  return json(200, {
    received: true,
    accountId: account.id,
    providerId: existingRow.provider_id,
    detailsSubmitted,
    chargesEnabled,
    payoutsEnabled,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeWebhookSecrets = [
    ...parseWebhookSecrets(Deno.env.get('STRIPE_WEBHOOK_SECRETS')),
    ...parseWebhookSecrets(Deno.env.get('STRIPE_WEBHOOK_SECRET')),
  ];

  if (!supabaseUrl || !serviceRoleKey || !stripeWebhookSecrets.length) {
    return json(500, { error: 'Server configuration incomplete' });
  }

  const signatureHeader = req.headers.get('stripe-signature');
  if (!signatureHeader) {
    return json(400, { error: 'Missing Stripe signature header' });
  }

  const rawBody = await req.text();
  const isValidSignature = await verifyStripeSignatureAgainstAnySecret(
    rawBody,
    signatureHeader,
    stripeWebhookSecrets
  );
  if (!isValidSignature) {
    return json(400, { error: 'Invalid Stripe signature' });
  }

  let event: StripeEvent<Record<string, unknown>>;
  try {
    event = JSON.parse(rawBody) as StripeEvent<Record<string, unknown>>;
  } catch {
    return json(400, { error: 'Invalid webhook payload' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  if (event.type === 'checkout.session.completed') {
    return handleCheckoutCompleted(
      adminClient,
      event.data?.object as StripeCheckoutSession
    );
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data?.object as StripeCheckoutSession;
    if (!session?.id) {
      return json(200, { received: true, ignored: 'No checkout session object' });
    }

    await upsertCheckoutStatus(adminClient, session, 'expired');
    return json(200, { received: true, status: 'expired' });
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data?.object as StripeCheckoutSession;
    if (!session?.id) {
      return json(200, { received: true, ignored: 'No checkout session object' });
    }

    await upsertCheckoutStatus(adminClient, session, 'failed');
    return json(200, { received: true, status: 'failed' });
  }

  if (
    event.type === 'payout.paid' ||
    event.type === 'payout.failed' ||
    event.type === 'payout.canceled'
  ) {
    return handlePayoutEvent(
      adminClient,
      event.data?.object as StripePayout,
      event.type
    );
  }

  if (event.type === 'account.updated') {
    return handleConnectedAccountUpdated(
      adminClient,
      event.data?.object as StripeConnectedAccount
    );
  }

  return json(200, { received: true, ignored: event.type });
});
