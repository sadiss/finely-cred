// Supabase Edge Function: platform-cron
// Server-side scheduled tick for production (pair with Supabase cron or external scheduler).
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EDGE_ADMIN_EMAILS, META_DEFAULT_IG_IMAGE_URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, requireEnv } from '../_shared/edgeGuard.ts';
import { authorizeCronOrService } from '../_shared/cronAuth.ts';
import { publishMetaSocialPost } from '../_shared/metaGraphPublish.ts';

type SocialDuePost = {
  id: string;
  pageId?: string;
  caption: string;
  platforms?: string[];
  scheduledAt: string;
  status?: string;
  complianceStatus?: string;
  imageUrl?: string;
};

type ReqBody = {
  action?: 'ping' | 'tick';
  dryRun?: boolean;
  source?: string;
  socialDuePosts?: SocialDuePost[];
  loadSocialFromDb?: boolean;
  runAutomationSweep?: boolean;
};

const CRON_STEPS = [
  'nurture',
  'automations',
  'trial_expiry',
  'billing_dunning',
  'support_sla',
  'task_overdue',
  'win_back',
  'admin_digest',
  'partner_digest',
  'social_autopilot',
  'social_publish',
  'automation_sweep',
] as const;

const TENANT_ID = 'finely_cred';

async function loadDuePostsFromDb(admin: ReturnType<typeof createClient>): Promise<SocialDuePost[]> {
  const now = new Date().toISOString();
  const { data } = await admin
    .from('social_scheduled_posts')
    .select('id, page_id, caption, platforms, scheduled_at, status, compliance_status, image_url')
    .eq('tenant_id', TENANT_ID)
    .eq('status', 'queued')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(25);

  return (data ?? [])
    .filter((row) => {
      const cs = row.compliance_status as string | null;
      return cs !== 'needs_review' && cs !== 'blocked';
    })
    .map((row) => ({
      id: String(row.id),
      pageId: row.page_id ? String(row.page_id) : undefined,
      caption: String(row.caption ?? ''),
      platforms: Array.isArray(row.platforms) ? (row.platforms as string[]) : undefined,
      scheduledAt: String(row.scheduled_at),
      status: String(row.status ?? 'queued'),
      complianceStatus: row.compliance_status ? String(row.compliance_status) : undefined,
      imageUrl: row.image_url ? String(row.image_url) : undefined,
    }));
}

async function runSocialPublishSweep(args: {
  dryRun: boolean;
  posts: SocialDuePost[];
  admin: ReturnType<typeof createClient>;
}): Promise<{ published: number; failed: number; skipped: number }> {
  const now = Date.now();
  let published = 0;
  let failed = 0;
  let skipped = 0;

  const due = args.posts.filter((p) => {
    if (p.status && p.status !== 'queued') return false;
    if (p.complianceStatus === 'needs_review' || p.complianceStatus === 'blocked') return false;
    return Date.parse(p.scheduledAt) <= now;
  });

  if (args.dryRun || due.length === 0) {
    return { published: 0, failed: 0, skipped: due.length };
  }

  for (const post of due) {
    const pageId = String(post.pageId ?? '').trim();
    if (!pageId) {
      skipped += 1;
      continue;
    }
    const { data: conn } = await args.admin
      .from('meta_connections')
      .select('access_token, page_name, ig_business_id')
      .eq('tenant_id', TENANT_ID)
      .eq('page_id', pageId)
      .maybeSingle();
    if (!conn?.access_token) {
      await args.admin
        .from('social_scheduled_posts')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', post.id);
      failed += 1;
      continue;
    }
    try {
      await publishMetaSocialPost({
        pageId,
        caption: post.caption,
        platforms: post.platforms,
        imageUrl: post.imageUrl,
        conn,
      });
      await args.admin
        .from('social_scheduled_posts')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', post.id);
      published += 1;
    } catch {
      await args.admin
        .from('social_scheduled_posts')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', post.id);
      failed += 1;
    }
  }

  return { published, failed, skipped };
}

async function invokeAutomationCronSweep(args: {
  supabaseUrl: string;
  serviceRoleKey: string;
  dryRun: boolean;
}) {
  try {
    const res = await fetch(`${args.supabaseUrl}/functions/v1/automation-runner`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'cron_sweep', dryRun: args.dryRun }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return { ok: false as const, error: String(data?.error ?? 'automation sweep failed') };
    }
    return {
      ok: true as const,
      leadsScanned: Number(data.leadsScanned ?? 0),
      metaInbound: Number(data.metaInbound ?? 0),
      hooksMatched: Number(data.hooksMatched ?? 0),
      nurtureCandidates: Number(data.nurtureCandidates ?? 0),
      nurtureProcess: data.nurtureProcess as
        | {
            due: number;
            advanced: number;
            completed: number;
            skipped: number;
            emailsSent?: number;
            emailsSkipped?: number;
            portalSteps?: number;
          }
        | undefined,
      automationRules: data.automationRules as
        | { scanned: number; due: number; executed: number; skipped: number; notifyAdmin: number }
        | undefined,
    };
  } catch (e: unknown) {
    return { ok: false as const, error: e instanceof Error ? e.message : 'automation sweep failed' };
  }
}

async function saveCronHeartbeat(admin: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  try {
    await admin.from('platform_cron_heartbeats').upsert(
      {
        id: 'latest',
        tenant_id: TENANT_ID,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  } catch {
    // table may not exist until migration
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const action = body.action ?? 'ping';

    if (action === 'ping') {
      return json(
        {
          ok: true,
          service: 'platform-cron',
          version: 6,
          steps: CRON_STEPS,
          voicePipelineVersion: Deno.env.get('VOICE_PIPELINE_VERSION') || 'v1',
          socialPipelineVersion: 'v2',
          automationPipelineVersion: 'v3',
          nurturePipelineVersion: 'v2',
        },
        { headers: corsHeaders },
      );
    }

    if (action === 'tick') {
      const who = await authorizeCronOrService(req);
      const dryRun = body.dryRun !== false;
      const at = new Date().toISOString();
      const source = String(body.source ?? 'edge');
      const runAutomation = body.runAutomationSweep !== false;

      const supabaseUrl = requireEnv('SUPABASE_URL');
      const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
      const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

      let socialDuePosts = Array.isArray(body.socialDuePosts) ? body.socialDuePosts : [];
      const shouldLoadDb = body.loadSocialFromDb !== false && socialDuePosts.length === 0 && !dryRun;
      if (shouldLoadDb) {
        socialDuePosts = await loadDuePostsFromDb(admin);
      }

      const socialPublish = await runSocialPublishSweep({ dryRun, posts: socialDuePosts, admin });
      const automationSweep = runAutomation
        ? await invokeAutomationCronSweep({ supabaseUrl, serviceRoleKey, dryRun })
        : { ok: false as const, error: 'skipped' };

      const tickPayload = {
        at,
        dryRun,
        source,
        auth: who.mode,
        socialAutopilot: {
          duePosts: socialDuePosts.length,
          published: socialPublish.published,
          failed: socialPublish.failed,
          skipped: socialPublish.skipped,
          fromDb: shouldLoadDb,
        },
        automationSweep,
        nurture: automationSweep.ok
          ? {
              candidates: automationSweep.nurtureCandidates,
              leadsScanned: automationSweep.leadsScanned,
              due: automationSweep.nurtureProcess?.due ?? 0,
              advanced: automationSweep.nurtureProcess?.advanced ?? 0,
              completed: automationSweep.nurtureProcess?.completed ?? 0,
              skipped: automationSweep.nurtureProcess?.skipped ?? 0,
              emailsSent: automationSweep.nurtureProcess?.emailsSent ?? 0,
              emailsSkipped: automationSweep.nurtureProcess?.emailsSkipped ?? 0,
            }
          : {
              candidates: 0,
              leadsScanned: 0,
              due: 0,
              advanced: 0,
              completed: 0,
              skipped: 0,
              emailsSent: 0,
              emailsSkipped: 0,
            },
        automationRules: automationSweep.ok
          ? automationSweep.automationRules ?? { scanned: 0, due: 0, executed: 0, skipped: 0, notifyAdmin: 0 }
          : { scanned: 0, due: 0, executed: 0, skipped: 0, notifyAdmin: 0 },
      };

      await saveCronHeartbeat(admin, tickPayload);

      await logEdgeEvent({
        namespace: 'platform-cron',
        level: 'info',
        event: 'tick',
        meta: {
          ...tickPayload,
          steps: CRON_STEPS,
          userId: who.userId,
        },
      });

      return json(
        {
          ok: true,
          ...tickPayload,
          steps: CRON_STEPS,
          message: dryRun
            ? 'Server cron tick logged — dryRun:false runs social DB sweep + automation-runner cron_sweep.'
            : 'Live server tick — social publish + automation sweep + DB nurture enrollments processed.',
          commsDeliveryHint: 'Set commsDelivery feature flag + SendGrid/Twilio secrets for live email/SMS.',
        },
        { headers: corsHeaders },
      );
    }

    return json({ ok: false, error: 'Unknown action' }, { status: 400, headers: corsHeaders });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'platform-cron error';
    await logEdgeEvent({
      namespace: 'platform-cron',
      level: 'error',
      event: 'error',
      meta: { message: msg },
    }).catch(() => undefined);
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 401 : 500;
    return json({ ok: false, error: msg }, { status, headers: corsHeaders });
  }
});
