// Supabase Edge Function: meta-oauth
// OAuth callback + Page/IG token exchange for Meta Business Platform (Phase 3).
//
// Secrets: META_APP_ID, META_APP_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireAllowlistedEmail, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';

type OAuthBody = { code?: string; redirectUri?: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    await requireAllowlistedEmail(auth.user.email);

    let code: string | null = null;
    let redirectUri = '';

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as OAuthBody;
      code = String(body.code ?? '').trim() || null;
      redirectUri = String(body.redirectUri ?? '').trim();
    } else {
      const url = new URL(req.url);
      code = url.searchParams.get('code');
      redirectUri = url.searchParams.get('redirect_uri') ?? '';
    }

    if (!code) {
      return json({ ok: false, error: 'Missing OAuth code' }, { status: 400, headers: corsHeaders });
    }

    const appId = (Deno.env.get('META_APP_ID') ?? '').trim();
    const appSecret = (Deno.env.get('META_APP_SECRET') ?? '').trim();
    if (!appId || !appSecret) {
      return json({ ok: false, error: 'META_APP_ID and META_APP_SECRET must be set on Supabase' }, { status: 503, headers: corsHeaders });
    }

    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('client_secret', appSecret);
    if (redirectUri) tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return json(
        { ok: false, error: tokenData.error?.message ?? 'Meta token exchange failed' },
        { status: 400, headers: corsHeaders },
      );
    }

    const userToken = String(tokenData.access_token);
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${encodeURIComponent(userToken)}`,
    );
    const pagesData = await pagesRes.json();
    if (!pagesRes.ok) {
      return json({ ok: false, error: pagesData.error?.message ?? 'Failed to list pages' }, { status: 400, headers: corsHeaders });
    }

    const pages = (pagesData.data ?? []).map((p: Record<string, unknown>) => ({
      pageId: String(p.id),
      pageName: String(p.name ?? ''),
      igBusinessId: (p.instagram_business_account as { id?: string })?.id,
      igUsername: (p.instagram_business_account as { username?: string })?.username,
    }));

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null;

    for (const p of pagesData.data ?? []) {
      const pageToken = String((p as { access_token?: string }).access_token ?? userToken);
      await admin.from('meta_connections').upsert(
        {
          tenant_id: 'finely_cred',
          page_id: String((p as { id: string }).id),
          page_name: String((p as { name?: string }).name ?? ''),
          ig_business_id: (p as { instagram_business_account?: { id?: string } }).instagram_business_account?.id ?? null,
          ig_username: (p as { instagram_business_account?: { username?: string } }).instagram_business_account?.username ?? null,
          access_token: pageToken,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,page_id' },
      );
    }

    await logEdgeEvent({
      namespace: 'meta-oauth',
      level: 'info',
      event: 'connected',
      meta: { pageCount: pages.length, userId: auth.user.id },
    });

    return json({ ok: true, status: 'connected', pages, tokenExpiresIn: tokenData.expires_in ?? null }, { headers: corsHeaders });
  } catch (e: unknown) {
    return json({ ok: false, error: (e as Error)?.message ?? 'meta-oauth failed' }, { status: 500, headers: corsHeaders });
  }
});
