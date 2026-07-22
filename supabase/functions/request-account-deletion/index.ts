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

// Même charte que les templates supabase/email-templates/ : tables + styles
// inline, polices système, largeur 520px, color-scheme verrouillé en clair.
function emailHtml(confirmUrl: string): string {
  const font = "-apple-system,'Segoe UI',Inter,Helvetica,Arial,sans-serif";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Confirmer la suppression de votre compte</title></head>
<body style="margin:0;padding:0;background-color:#f7f5f1;-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;color:#f7f5f1;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
Confirmez la suppression définitive de votre compte Umade.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7f5f1;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:520px;">

<tr><td align="left" style="padding:0 4px 22px;">
<span style="font-family:${font};font-size:21px;font-weight:700;color:#101010;letter-spacing:-0.02em;">
Umade <span style="font-size:11px;font-weight:500;color:#8a8378;vertical-align:super;">&reg;</span></span>
</td></tr>

<tr><td style="background-color:#ffffff;border-radius:18px;padding:44px 40px;">
<h1 style="margin:0 0 16px;font-family:${font};font-size:26px;line-height:1.25;font-weight:600;color:#101010;letter-spacing:-0.02em;">
Confirmer la suppression</h1>

<p style="margin:0 0 20px;font-family:${font};font-size:15px;line-height:1.65;color:#4a4640;">
Vous avez demandé la suppression définitive de votre compte Umade.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef3f2;border-radius:12px;margin:0 0 24px;">
<tr><td style="padding:16px 18px;">
<p style="margin:0;font-family:${font};font-size:14px;line-height:1.6;color:#912018;">
<strong>Cette action est irréversible.</strong> Vos événements, réservations,
conversations et photos seront définitivement effacés.</p>
</td></tr></table>

<p style="margin:0 0 28px;font-family:${font};font-size:15px;line-height:1.65;color:#4a4640;">
Ce lien expire dans ${TOKEN_TTL_MINUTES} minutes et ne peut servir qu'une fois.</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" bgcolor="#b42318" style="border-radius:999px;">
<a href="${confirmUrl}" style="display:inline-block;padding:15px 34px;font-family:${font};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">
Supprimer définitivement mon compte</a>
</td></tr></table>

<p style="margin:30px 0 0;font-family:${font};font-size:13px;line-height:1.6;color:#8a8378;">
Le bouton ne fonctionne pas&nbsp;? Copiez ce lien dans votre navigateur&nbsp;:</p>
<p style="margin:6px 0 0;font-family:${font};font-size:12px;line-height:1.5;color:#5f4a8b;word-break:break-all;">
${confirmUrl}</p>
</td></tr>

<tr><td style="padding:26px 24px 0;">
<p style="margin:0 0 8px;font-family:${font};font-size:12.5px;line-height:1.6;color:#8a8378;">
Vous n'êtes pas à l'origine de cette demande&nbsp;? Ignorez simplement cet email,
votre compte restera intact.</p>
<p style="margin:0;font-family:${font};font-size:12px;line-height:1.6;color:#a9a49b;">
Umade &middot; Belgique</p>
</td></tr>

</table></td></tr></table>
</body></html>`;
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
