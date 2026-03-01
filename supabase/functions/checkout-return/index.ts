// @ts-nocheck

type PaymentStatus = 'success' | 'cancelled';
type PaymentType = 'deposit' | 'balance' | 'unknown';

function buildDefaultAppReturnUrl(params: {
  bookingId: string | null;
  payment: PaymentStatus;
  type: PaymentType;
}): string {
  const query: string[] = [`payment=${encodeURIComponent(params.payment)}`];
  if (params.bookingId) query.push(`booking_id=${encodeURIComponent(params.bookingId)}`);
  if (params.type !== 'unknown') query.push(`type=${encodeURIComponent(params.type)}`);
  return `umade://payment-result?${query.join('&')}`;
}

function isAllowedAppReturnUrl(url: string | null): boolean {
  if (!url) return false;
  return /^(umade|exp|exps):\/\//i.test(url);
}

function redirectTo(url: string) {
  const headers = new Headers();
  headers.set('Location', url);
  headers.set('Cache-Control', 'no-store');

  return new Response(null, {
    status: 303,
    headers,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
        'access-control-allow-methods': 'GET, OPTIONS',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }

  const url = new URL(req.url);
  const bookingId = url.searchParams.get('booking_id');
  const payment: PaymentStatus = url.searchParams.get('payment') === 'cancelled' ? 'cancelled' : 'success';
  const typeRaw = url.searchParams.get('type');
  const paymentType: PaymentType =
    typeRaw === 'deposit' || typeRaw === 'balance' ? typeRaw : 'unknown';

  const incomingAppReturn = url.searchParams.get('app_return');
  const appReturnUrl = isAllowedAppReturnUrl(incomingAppReturn)
    ? incomingAppReturn
    : buildDefaultAppReturnUrl({
        bookingId,
        payment,
        type: paymentType,
      });

  return redirectTo(appReturnUrl);
});
