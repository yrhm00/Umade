// @ts-nocheck
/**
 * Confirmation de suppression de compte.
 * Ouvert depuis le lien reçu par email (GET), donc renvoie une page HTML
 * plutôt que du JSON — ça fonctionne dans n'importe quel navigateur,
 * même si l'app est déjà désinstallée.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function page(title: string, message: string, tone: 'ok' | 'error'): Response {
  const accent = tone === 'ok' ? '#0f7b4f' : '#b42318';
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${title} — Umade</title></head>
<body style="margin:0;background:#f7f5f1;font-family:-apple-system,Segoe UI,Inter,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px">
<div style="max-width:460px;background:#fff;border-radius:18px;padding:40px;text-align:center">
  <div style="font-size:34px;margin-bottom:14px">${tone === 'ok' ? '✓' : '⚠️'}</div>
  <h1 style="margin:0 0 12px;font-size:22px;color:${accent}">${title}</h1>
  <p style="margin:0;font-size:15px;line-height:1.6;color:#555">${message}</p>
</div></body></html>`;
  return new Response(html, {
    status: tone === 'ok' ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

Deno.serve(async (req: Request) => {
  const token = new URL(req.url).searchParams.get('token');
  if (!token) {
    return page('Lien invalide', "Ce lien de confirmation est incomplet.", 'error');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return page('Erreur serveur', 'Configuration incomplète.', 'error');
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tokenHash = await sha256Hex(token);
  const { data: request, error } = await admin
    .from('account_deletion_requests')
    .select('id, user_id, expires_at, confirmed_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) return page('Erreur serveur', error.message, 'error');
  if (!request) {
    return page('Lien invalide', 'Cette demande est introuvable ou a déjà été traitée.', 'error');
  }
  if (request.confirmed_at) {
    return page('Compte déjà supprimé', 'Ce compte a déjà été supprimé.', 'ok');
  }
  if (new Date(request.expires_at) < new Date()) {
    return page(
      'Lien expiré',
      'Ce lien a expiré. Relancez la demande depuis l\'application.',
      'error'
    );
  }

  const userId = request.user_id;

  // Nettoyage du stockage (non couvert par les cascades SQL).
  for (const bucket of ['avatars', 'portfolio', 'inspirations']) {
    try {
      const { data: files } = await admin.storage.from(bucket).list(userId);
      if (files?.length) {
        await admin.storage
          .from(bucket)
          .remove(files.map((f: { name: string }) => `${userId}/${f.name}`));
      }
    } catch {
      // Un bucket absent ne doit pas bloquer la suppression du compte.
    }
  }

  // Trace la confirmation avant la suppression (la ligne partira en cascade).
  await admin
    .from('account_deletion_requests')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', request.id);

  // Supprime l'utilisateur : les données liées partent via ON DELETE CASCADE.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return page('Suppression impossible', deleteError.message, 'error');
  }

  return page(
    'Compte supprimé',
    'Votre compte Umade et toutes vos données ont été définitivement supprimés. Merci d\'avoir utilisé Umade.',
    'ok'
  );
});
