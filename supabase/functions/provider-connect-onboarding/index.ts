// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface OnboardingRequest {
  returnUrl?: string;
  refreshUrl?: string;
  country?: string;
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

function normalizeHttpUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    return protocol === 'http:' || protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

function normalizeAppUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    return protocol === 'umade:' || protocol === 'exp:' || protocol === 'exps:' ? trimmed : null;
  } catch {
    return null;
  }
}

function buildCheckoutReturnBridgeUrl(params: {
  supabaseUrl: string;
  appReturnUrl: string;
  payment: 'success' | 'cancelled';
}) {
  const base = `${params.supabaseUrl.replace(/\/+$/, '')}/functions/v1/checkout-return`;
  const search = new URLSearchParams({
    payment: params.payment,
    app_return: params.appReturnUrl,
  });
  return `${base}?${search.toString()}`;
}

function sanitizeCountryCode(value: string | undefined | null): string {
  const normalized = (value || 'BE').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return 'BE';
  return normalized;
}

async function stripeFormRequest(
  stripeSecretKey: string,
  path: string,
  form: URLSearchParams,
  stripeAccount?: string
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (stripeAccount) {
    headers['Stripe-Account'] = stripeAccount;
  }

  const response = await fetch(`https://api.stripe.com${path}`, {
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

async function stripeGetRequest(
  stripeSecretKey: string,
  path: string,
  stripeAccount?: string
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey}`,
  };

  if (stripeAccount) {
    headers['Stripe-Account'] = stripeAccount;
  }

  const response = await fetch(`https://api.stripe.com${path}`, {
    method: 'GET',
    headers,
  });

  const payload = await response.json();
  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
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

  let payload: OnboardingRequest = {};
  try {
    payload = ((await req.json()) || {}) as OnboardingRequest;
  } catch {
    payload = {};
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

  const { data: provider, error: providerError } = await adminClient
    .from('providers')
    .select('id, business_email, business_phone, city, postal_code')
    .eq('user_id', user.id)
    .maybeSingle();

  if (providerError) {
    return json(500, { error: providerError.message });
  }

  if (!provider?.id) {
    return json(403, { error: 'Provider account required' });
  }

  const { data: existingStripeAccount, error: existingStripeAccountError } = await adminClient
    .from('provider_stripe_accounts')
    .select('provider_id, stripe_account_id, onboarding_completed_at')
    .eq('provider_id', provider.id)
    .maybeSingle();

  if (existingStripeAccountError) {
    return json(500, { error: existingStripeAccountError.message });
  }

  let stripeAccountId = existingStripeAccount?.stripe_account_id || null;

  if (!stripeAccountId) {
    const createAccountForm = new URLSearchParams();
    createAccountForm.set('type', 'express');
    createAccountForm.set('country', sanitizeCountryCode(payload.country));

    const email = provider.business_email || user.email;
    if (email) createAccountForm.set('email', email);

    createAccountForm.set('capabilities[card_payments][requested]', 'true');
    createAccountForm.set('capabilities[transfers][requested]', 'true');
    createAccountForm.set('settings[payouts][schedule][interval]', 'manual');
    createAccountForm.set('metadata[provider_id]', provider.id);
    createAccountForm.set('metadata[user_id]', user.id);

    const createAccountResult = await stripeFormRequest(
      stripeSecretKey,
      '/v1/accounts',
      createAccountForm
    );

    if (!createAccountResult.ok) {
      const stripeMessage =
        createAccountResult.payload?.error?.message ||
        'Unable to create Stripe Connect account';
      return json(400, { error: stripeMessage });
    }

    stripeAccountId = createAccountResult.payload?.id || null;
  }

  if (!stripeAccountId) {
    return json(500, { error: 'Stripe account id missing after onboarding setup' });
  }

  const forceManualPayoutForm = new URLSearchParams();
  forceManualPayoutForm.set('settings[payouts][schedule][interval]', 'manual');
  await stripeFormRequest(
    stripeSecretKey,
    `/v1/accounts/${encodeURIComponent(stripeAccountId)}`,
    forceManualPayoutForm
  );

  const retrieveAccountResult = await stripeGetRequest(
    stripeSecretKey,
    `/v1/accounts/${encodeURIComponent(stripeAccountId)}`
  );

  if (!retrieveAccountResult.ok) {
    const stripeMessage =
      retrieveAccountResult.payload?.error?.message ||
      'Unable to fetch Stripe Connect account';
    return json(400, { error: stripeMessage });
  }

  const stripeAccount = retrieveAccountResult.payload;
  const detailsSubmitted = stripeAccount?.details_submitted === true;
  const chargesEnabled = stripeAccount?.charges_enabled === true;
  const payoutsEnabled = stripeAccount?.payouts_enabled === true;
  const requirementsCurrentlyDue = Array.isArray(stripeAccount?.requirements?.currently_due)
    ? stripeAccount.requirements.currently_due
    : [];
  const onboardingCompleted =
    detailsSubmitted && chargesEnabled && payoutsEnabled && requirementsCurrentlyDue.length === 0;

  const payoutScheduleMode =
    stripeAccount?.settings?.payouts?.schedule?.interval === 'manual'
      ? 'manual'
      : 'automatic';

  const { error: upsertAccountError } = await adminClient
    .from('provider_stripe_accounts')
    .upsert(
      {
        provider_id: provider.id,
        stripe_account_id: stripeAccountId,
        country: sanitizeCountryCode(stripeAccount?.country || payload.country),
        default_currency: (stripeAccount?.default_currency || 'eur').toLowerCase(),
        details_submitted: detailsSubmitted,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        payout_schedule_mode: payoutScheduleMode,
        onboarding_completed_at: onboardingCompleted
          ? existingStripeAccount?.onboarding_completed_at || new Date().toISOString()
          : null,
        requirements_currently_due: requirementsCurrentlyDue,
        capabilities: stripeAccount?.capabilities || {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider_id' }
    );

  if (upsertAccountError) {
    return json(500, { error: upsertAccountError.message });
  }

  const defaultReturnBase =
    Deno.env.get('CONNECT_ONBOARDING_RETURN_URL')?.trim() ||
    Deno.env.get('CHECKOUT_RETURN_BASE_URL')?.trim() ||
    'https://umade.app/connect-return';
  const defaultRefreshBase =
    Deno.env.get('CONNECT_ONBOARDING_REFRESH_URL')?.trim() ||
    Deno.env.get('CHECKOUT_RETURN_BASE_URL')?.trim() ||
    defaultReturnBase;

  const requestedReturnHttp = normalizeHttpUrl(payload.returnUrl);
  const requestedRefreshHttp = normalizeHttpUrl(payload.refreshUrl);
  const requestedReturnApp = normalizeAppUrl(payload.returnUrl);
  const requestedRefreshApp = normalizeAppUrl(payload.refreshUrl);

  const envReturnHttp = normalizeHttpUrl(defaultReturnBase);
  const envRefreshHttp = normalizeHttpUrl(defaultRefreshBase);
  const envReturnApp = normalizeAppUrl(defaultReturnBase);
  const envRefreshApp = normalizeAppUrl(defaultRefreshBase);

  const fallbackReturnApp = requestedReturnApp || envReturnApp || 'umade://dashboard?connect=return';
  const fallbackRefreshApp =
    requestedRefreshApp || envRefreshApp || 'umade://dashboard?connect=refresh';

  const bridgedReturnUrl = buildCheckoutReturnBridgeUrl({
    supabaseUrl,
    appReturnUrl: fallbackReturnApp,
    payment: 'success',
  });
  const bridgedRefreshUrl = buildCheckoutReturnBridgeUrl({
    supabaseUrl,
    appReturnUrl: fallbackRefreshApp,
    payment: 'cancelled',
  });
  const hasRequestedAppRedirect = Boolean(requestedReturnApp || requestedRefreshApp);

  const returnUrl = hasRequestedAppRedirect
    ? bridgedReturnUrl
    : requestedReturnHttp || envReturnHttp || bridgedReturnUrl;
  const refreshUrl = hasRequestedAppRedirect
    ? bridgedRefreshUrl
    : requestedRefreshHttp ||
      envRefreshHttp ||
      (returnUrl === bridgedReturnUrl ? bridgedRefreshUrl : returnUrl);

  const accountLinkForm = new URLSearchParams();
  accountLinkForm.set('account', stripeAccountId);
  accountLinkForm.set('type', 'account_onboarding');
  accountLinkForm.set('refresh_url', refreshUrl);
  accountLinkForm.set('return_url', returnUrl);

  const accountLinkResult = await stripeFormRequest(
    stripeSecretKey,
    '/v1/account_links',
    accountLinkForm
  );

  if (!accountLinkResult.ok) {
    const stripeMessage =
      accountLinkResult.payload?.error?.message ||
      'Unable to create Stripe onboarding link';
    return json(400, { error: stripeMessage });
  }

  let dashboardLoginUrl: string | null = null;
  const loginLinkResult = await stripeFormRequest(
    stripeSecretKey,
    `/v1/accounts/${encodeURIComponent(stripeAccountId)}/login_links`,
    new URLSearchParams()
  );
  if (loginLinkResult.ok) {
    dashboardLoginUrl = loginLinkResult.payload?.url || null;
  }

  return json(200, {
    providerId: provider.id,
    stripeAccountId,
    onboardingUrl: accountLinkResult.payload?.url || null,
    dashboardLoginUrl,
    detailsSubmitted,
    chargesEnabled,
    payoutsEnabled,
    payoutScheduleMode,
    requirementsCurrentlyDue,
    onboardingCompleted,
  });
});
