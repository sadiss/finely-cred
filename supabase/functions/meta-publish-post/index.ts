// Supabase Edge Function: meta-publish-post
// Publishes caption to Facebook Page feed + optional Instagram media container.
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, META_DEFAULT_IG_IMAGE_URL (optional)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireAllowlistedEmail, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';
import { publishMetaSocialPost } from '../_shared/metaGraphPublish.ts';

type PublishBody = {
  pageId?: string;
  caption?: string;
  platforms?: string[];
  scheduledPostId?: string;
  imageUrl?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = await requireAuth(req);
    await requireAllowlistedEmail(auth.user.email);

    const body = (await req.json().catch(() => ({}))) as PublishBody;
    const pageId = String(body.pageId ?? '').trim();
    const caption = String(body.caption ?? '').trim();
    if (!pageId || !caption) {
      return json({ ok: false, error: 'pageId and caption required' }, { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = requireEnv('SUPABASE_URL');
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { data: conn, error: connErr } = await admin
      .from('meta_connections')
      .select('access_token, page_name, ig_business_id')
      .eq('tenant_id', 'finely_cred')
      .eq('page_id', pageId)
      .maybeSingle();

    if (connErr || !conn?.access_token) {
      return json({ ok: false, error: 'Page token not found — reconnect Meta OAuth' }, { status: 404, headers: corsHeaders });
    }

    const result = await publishMetaSocialPost({
      pageId,
      caption,
      platforms: body.platforms,
      imageUrl: body.imageUrl,
      conn,
    });

    await logEdgeEvent({
      namespace: 'meta-publish-post',
      level: 'info',
      event: 'published',
      meta: {
        pageId,
        graphPostIds: result.postIds,
        scheduledPostId: body.scheduledPostId ?? null,
        platforms: result.platforms,
        userId: auth.user.id,
      },
    });

    return json(
      {
        ok: true,
        postId: result.postIds[0],
        postIds: result.postIds,
        platforms: result.platforms,
        pageName: conn.page_name ?? pageId,
      },
      { headers: corsHeaders },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'meta-publish-post failed';
    return json({ ok: false, error: message }, { status: 500, headers: corsHeaders });
  }
});
