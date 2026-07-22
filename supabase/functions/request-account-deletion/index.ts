// @ts-nocheck
/**
 * Demande de suppression de compte.
 * Authentifie l'utilisateur, génère un jeton à usage unique (stocké haché),
 * et lui envoie un email de confirmation. Rien n'est supprimé ici.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const TOKEN_TTL_MINUTES = 60;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function emailHtml(confirmUrl: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f7f5f1;font-family:-apple-system,Segoe UI,Inter,sans-serif;padding:32px 16px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:36px">
  <h1 style="margin:0 0 14px;font-size:21px;color:#101010">Confirmer la suppression de votre compte</h1>
  <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#444">
    Vous avez demandé la suppression définitive de votre compte Umade.
    Cette action est <strong>irréversible</strong> : vos événements, réservations,
    messages et photos seront effacés.
  </p>
  <p style="margin:0 0 26px;font-size:15px;line-height:1.6;color:#444">
    Ce lien expire dans ${TOKEN_TTL_MINUTES} minutes.
  </p>
  <a href="${confirmUrl}" style="display:inline-block;background:#b42318;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 26px;border-radius:999px">
    Supprimer définitivement mon compte
  </a>
  <p style="margin:26px 0 0;font-size:13px;line-height:1.6;color:#888">
    Vous n'êtes pas à l'origine de cette demande ? Ignorez simplement cet email,
    votre compte restera intact.
  </p>
</div></body></html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('DELETION_FROM_EMAIL') ?? 'Umade <onboarding@resend.dev>';

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: 'Configuration Supabase incomplète' });
  }
  if (!resendKey) {
    return json(500, {
      error:
        "L'envoi d'email n'est pas configuré (RESEND_API_KEY manquant sur la fonction).",
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'Non authentifié' });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user?.email) return json(401, { error: 'Session invalide' });

  // Jeton opaque : on ne stocke que son hash.
  const rawToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
  const tokenHash = await sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString();

  // Une seule demande active à la fois.
  await adminClient
    .from('account_deletion_requests')
    .delete()
    .eq('user_id', user.id)
    .is('confirmed_at', null);

  const { error: insertError } = await adminClient
    .from('account_deletion_requests')
    .insert({ user_id: user.id, token_hash: tokenHash, expires_at: expiresAt });
  if (insertError) return json(500, { error: insertError.message });

  const confirmUrl = `${supabaseUrl}/functions/v1/confirm-account-deletion?token=${rawToken}`;

  const mailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [user.email],
      subject: 'Confirmez la suppression de votre compte Umade',
      html: emailHtml(confirmUrl),
    }),
  });

  if (!mailRes.ok) {
    const detail = await mailRes.text();
    return json(502, { error: "Échec de l'envoi de l'email", detail });
  }

  return json(200, { ok: true, email: user.email, expiresInMinutes: TOKEN_TTL_MINUTES });
});
