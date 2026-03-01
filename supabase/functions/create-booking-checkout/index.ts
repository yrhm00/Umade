// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type PaymentType = 'deposit' | 'balance';

const CLIENT_FEE_RATE = 0.015;
const PROVIDER_FEE_RATE = 0.025;

interface CreateCheckoutRequest {
  bookingId?: string;
  paymentType?: PaymentType;
  successUrl?: string;
  cancelUrl?: string;
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
  if (value === 'deposit' || value === 'balance') return value;
  return null;
}

function appendSessionIdPlaceholder(url: string): string {
  if (url.includes('{CHECKOUT_SESSION_ID}')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}checkout_session_id={CHECKOUT_SESSION_ID}`;
}

function getAllowedReturnUrl(url: string | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (
      protocol === 'http:' ||
      protocol === 'https:' ||
      protocol === 'umade:' ||
      protocol === 'exp:' ||
      protocol === 'exps:'
    ) {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

function computeDueAmount(booking: Record<string, unknown>, paymentType: PaymentType): number {
  const quoteAmount = Math.max(
    toNumber(booking.quote_amount),
    toNumber(booking.total_price)
  );

  const configuredDeposit =
    toNumber(booking.deposit_amount) > 0
      ? toNumber(booking.deposit_amount)
      : roundMoney(quoteAmount * 0.3);
  const configuredBalance =
    toNumber(booking.balance_amount) > 0
      ? toNumber(booking.balance_amount)
      : Math.max(quoteAmount - configuredDeposit, 0);

  const depositPaid = Math.max(toNumber(booking.deposit_paid_amount), 0);
  const balancePaid = Math.max(toNumber(booking.balance_paid_amount), 0);

  const depositDue = Math.max(configuredDeposit - depositPaid, 0);
  const balanceDue = Math.max(configuredBalance - balancePaid, 0);

  return roundMoney(paymentType === 'deposit' ? depositDue : balanceDue);
}

function computeFees(baseAmount: number): {
  clientFee: number;
  providerFee: number;
  chargedAmount: number;
} {
  const safeBase = Math.max(roundMoney(baseAmount), 0);
  const clientFee = roundMoney(safeBase * CLIENT_FEE_RATE);
  const providerFee = roundMoney(safeBase * PROVIDER_FEE_RATE);
  const chargedAmount = roundMoney(safeBase + clientFee);
  return { clientFee, providerFee, chargedAmount };
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

  let payload: CreateCheckoutRequest;
  try {
    payload = (await req.json()) as CreateCheckoutRequest;
  } catch {
    return json(400, { error: 'Invalid JSON payload' });
  }

  const bookingId = payload.bookingId?.trim();
  const paymentType = normalizePaymentType(payload.paymentType);
  if (!bookingId || !paymentType) {
    return json(400, { error: 'bookingId and paymentType are required' });
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

  const { data: booking, error: bookingError } = await adminClient
    .from('bookings')
    .select(
      `
      id,
      client_id,
      provider_id,
      status,
      payment_status,
      contract_required,
      quote_amount,
      total_price,
      deposit_amount,
      deposit_paid_amount,
      balance_amount,
      balance_paid_amount
      `
    )
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    return json(500, { error: bookingError.message });
  }

  if (!booking) {
    return json(404, { error: 'Booking not found' });
  }

  if (booking.client_id !== user.id) {
    return json(403, { error: 'Only the booking client can initiate online payment' });
  }

  if (booking.status === 'cancelled') {
    return json(400, { error: 'Booking is cancelled' });
  }

  if (booking.contract_required !== false) {
    const { data: contract, error: contractError } = await adminClient
      .from('booking_contracts')
      .select('provider_signed_at, client_signed_at')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (contractError) {
      return json(500, { error: contractError.message });
    }

    const isFullySigned = !!contract?.provider_signed_at && !!contract?.client_signed_at;
    if (!isFullySigned) {
      return json(400, {
        error: 'Le contrat doit être signé par les deux parties avant de payer.',
      });
    }
  }

  if (booking.payment_status === 'paid' && paymentType === 'balance') {
    return json(400, { error: 'Booking is already fully paid' });
  }

  const dueAmount = computeDueAmount(booking as Record<string, unknown>, paymentType);
  if (dueAmount <= 0) {
    return json(400, { error: 'No outstanding amount for this payment type' });
  }

  const { clientFee, providerFee, chargedAmount } = computeFees(dueAmount);
  const amountCents = Math.round(chargedAmount * 100);
  const baseAmountCents = Math.round(dueAmount * 100);
  const clientFeeCents = Math.round(clientFee * 100);
  const providerFeeCents = Math.round(providerFee * 100);
  const platformFeeCents = clientFeeCents + providerFeeCents;
  const providerNetAmount = roundMoney(Math.max(dueAmount - providerFee, 0));
  const providerNetAmountCents = Math.round(providerNetAmount * 100);
  const bookingRef = bookingId.slice(0, 8).toUpperCase();
  const paymentLabel = paymentType === 'deposit' ? 'Acompte' : 'Solde';

  const checkoutReturnBaseUrl =
    Deno.env.get('CHECKOUT_RETURN_BASE_URL')?.trim() || 'https://umade.app';
  const normalizedReturnBase = checkoutReturnBaseUrl.replace(/\/+$/, '');
  const fallbackSuccessUrl = `${normalizedReturnBase}/payment-result?booking_id=${encodeURIComponent(
    bookingId
  )}&payment=success&type=${paymentType}`;
  const fallbackCancelUrl = `${normalizedReturnBase}/payment-result?booking_id=${encodeURIComponent(
    bookingId
  )}&payment=cancelled&type=${paymentType}`;

  const customSuccessUrl = getAllowedReturnUrl(payload.successUrl);
  const customCancelUrl = getAllowedReturnUrl(payload.cancelUrl);

  const successUrl = appendSessionIdPlaceholder(customSuccessUrl || fallbackSuccessUrl);
  const cancelUrl = customCancelUrl || fallbackCancelUrl;

  let connectDestinationAccountId: string | null = null;
  if (booking.provider_id) {
    const { data: providerStripeAccount, error: providerStripeAccountError } = await adminClient
      .from('provider_stripe_accounts')
      .select('stripe_account_id, details_submitted, charges_enabled, payouts_enabled')
      .eq('provider_id', booking.provider_id)
      .maybeSingle();

    if (providerStripeAccountError) {
      console.error('provider_stripe_account_lookup_failed', {
        bookingId,
        providerId: booking.provider_id,
        error: providerStripeAccountError.message,
      });
    } else if (
      providerStripeAccount?.stripe_account_id &&
      providerStripeAccount.details_submitted === true &&
      providerStripeAccount.charges_enabled === true &&
      providerStripeAccount.payouts_enabled === true
    ) {
      connectDestinationAccountId = providerStripeAccount.stripe_account_id;
    }
  }

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('success_url', successUrl);
  form.set('cancel_url', cancelUrl);
  form.set('locale', 'fr');

  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', 'eur');
  form.set('line_items[0][price_data][unit_amount]', String(amountCents));
  form.set('line_items[0][price_data][product_data][name]', `${paymentLabel} réservation #${bookingRef}`);
  form.set(
    'line_items[0][price_data][product_data][description]',
    `Paiement ${paymentType} pour la réservation ${bookingId} (frais service inclus)`
  );

  if (user.email) {
    form.set('customer_email', user.email);
  }

  form.set('metadata[booking_id]', bookingId);
  form.set('metadata[payment_type]', paymentType);
  form.set('metadata[amount_cents]', String(amountCents));
  form.set('metadata[base_amount_cents]', String(baseAmountCents));
  form.set('metadata[client_fee_cents]', String(clientFeeCents));
  form.set('metadata[provider_fee_cents]', String(providerFeeCents));
  form.set('metadata[platform_fee_cents]', String(platformFeeCents));
  form.set('metadata[provider_net_amount_cents]', String(providerNetAmountCents));
  form.set('metadata[user_id]', user.id);

  form.set('payment_intent_data[metadata][booking_id]', bookingId);
  form.set('payment_intent_data[metadata][payment_type]', paymentType);
  form.set('payment_intent_data[metadata][base_amount_cents]', String(baseAmountCents));
  form.set('payment_intent_data[metadata][client_fee_cents]', String(clientFeeCents));
  form.set('payment_intent_data[metadata][provider_fee_cents]', String(providerFeeCents));
  form.set('payment_intent_data[metadata][platform_fee_cents]', String(platformFeeCents));
  form.set(
    'payment_intent_data[metadata][provider_net_amount_cents]',
    String(providerNetAmountCents)
  );
  form.set('payment_intent_data[metadata][user_id]', user.id);

  if (connectDestinationAccountId) {
    form.set(
      'payment_intent_data[transfer_data][destination]',
      connectDestinationAccountId
    );
    form.set(
      'payment_intent_data[application_fee_amount]',
      String(platformFeeCents)
    );
  }

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  const stripePayload = await stripeResponse.json();
  if (!stripeResponse.ok) {
    const stripeMessage =
      stripePayload?.error?.message || 'Unable to create Stripe Checkout session';
    console.error('stripe_checkout_session_create_failed', {
      status: stripeResponse.status,
      message: stripeMessage,
      type: stripePayload?.error?.type ?? null,
      code: stripePayload?.error?.code ?? null,
      param: stripePayload?.error?.param ?? null,
    });
    return json(400, { error: stripeMessage });
  }

  const sessionId = stripePayload?.id as string | undefined;
  const checkoutUrl = stripePayload?.url as string | undefined;
  if (!sessionId || !checkoutUrl) {
    return json(500, { error: 'Stripe response missing checkout URL' });
  }

  const expiresAtUnix = toNumber(stripePayload?.expires_at);
  const expiresAt =
    expiresAtUnix > 0 ? new Date(expiresAtUnix * 1000).toISOString() : null;

  const { error: checkoutInsertError } = await adminClient
    .from('booking_checkout_sessions')
    .insert({
      booking_id: bookingId,
      payment_type: paymentType,
      amount: chargedAmount,
      base_amount: dueAmount,
      client_fee_amount: clientFee,
      provider_fee_amount: providerFee,
      provider_net_amount: providerNetAmount,
      currency: 'EUR',
      status: 'created',
      stripe_checkout_session_id: sessionId,
      checkout_url: checkoutUrl,
      expires_at: expiresAt,
      created_by: user.id,
      metadata: {
        livemode: Boolean(stripePayload?.livemode),
        source: 'mobile',
        base_amount: dueAmount,
        client_fee: clientFee,
        provider_fee: providerFee,
        charged_amount: chargedAmount,
        platform_fee: roundMoney(clientFee + providerFee),
        connect_destination_account_id: connectDestinationAccountId,
      },
      updated_at: new Date().toISOString(),
    });

  if (checkoutInsertError) {
    return json(500, { error: checkoutInsertError.message });
  }

  return json(200, {
    checkoutUrl,
    sessionId,
    amount: dueAmount,
    chargedAmount,
    clientFee,
    providerFee,
    providerNetAmount,
    connectDestinationAccountId,
    currency: 'EUR',
    paymentType,
  });
});
