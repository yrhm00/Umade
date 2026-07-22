// @ts-nocheck
/**
 * Chiffres d'activité pour la console Ops.
 *
 * Tourne en service_role, donc protégée par un secret partagé
 * (ADMIN_STATS_TOKEN) : sans lui, la fonction refuse de répondre.
 *
 * Ne renvoie QUE des agrégats — jamais un nom, un email ou une ligne
 * individuelle. Même si la réponse fuitait, elle n'exposerait aucune
 * donnée personnelle.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Comparaison à temps constant : évite de révéler le secret par la durée. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const expected = Deno.env.get('ADMIN_STATS_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!expected || !supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Configuration incomplète (ADMIN_STATS_TOKEN manquant ?)' });
  }

  const provided = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!provided || !safeEqual(provided, expected)) {
    return json(401, { error: 'Jeton invalide' });
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // head:true => Postgres renvoie le compte sans transférer les lignes.
  const count = async (
    table: string,
    build: (q: any) => any = (q) => q
  ): Promise<number> => {
    const { count: c, error } = await build(
      db.from(table).select('*', { count: 'exact', head: true })
    );
    if (error) throw new Error(`${table}: ${error.message}`);
    return c ?? 0;
  };

  try {
    const [
      usersTotal,
      usersThisWeek,
      providersTotal,
      providersUnverified,
      bookingsThisMonth,
      bookingsPending,
    ] = await Promise.all([
      count('profiles'),
      count('profiles', (q) => q.gte('created_at', weekAgo)),
      count('providers'),
      count('providers', (q) => q.or('is_verified.is.null,is_verified.eq.false')),
      count('bookings', (q) => q.gte('created_at', monthStart)),
      count('bookings', (q) => q.eq('status', 'pending')),
    ]);

    // Volume encaissé ce mois-ci + commission (frais client + frais prestataire).
    let volume = 0;
    let commission = 0;
    const { data: sessions, error: sessionsError } = await db
      .from('booking_checkout_sessions')
      .select('base_amount, client_fee_amount, provider_fee_amount, status, created_at')
      .eq('status', 'paid')
      .gte('created_at', monthStart);

    if (!sessionsError && sessions) {
      for (const s of sessions) {
        volume += Number(s.base_amount ?? 0) + Number(s.client_fee_amount ?? 0);
        commission += Number(s.client_fee_amount ?? 0) + Number(s.provider_fee_amount ?? 0);
      }
    }

    // Comptes créés mais jamais confirmés : signale un souci de délivrabilité.
    let unconfirmed = 0;
    const { data: userList } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (userList?.users) {
      unconfirmed = userList.users.filter((u: any) => !u.email_confirmed_at).length;
    }

    return json(200, {
      generatedAt: now.toISOString(),
      users: { total: usersTotal, newThisWeek: usersThisWeek, unconfirmed },
      providers: { total: providersTotal, unverified: providersUnverified },
      bookings: { thisMonth: bookingsThisMonth, pending: bookingsPending },
      revenue: {
        volumeThisMonth: Math.round(volume * 100) / 100,
        commissionThisMonth: Math.round(commission * 100) / 100,
        currency: 'EUR',
      },
    });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : 'Erreur inattendue' });
  }
});
