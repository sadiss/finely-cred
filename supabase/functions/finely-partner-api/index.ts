// Supabase Edge Function: finely-partner-api
// Public API for Nora Capital Group (and other trusted integrators) to pull partner readiness.
//
// Auth: x-finely-partner-api-key (or x-api-key)
// Secret: FINELY_PARTNER_API_KEYS_JSON — same shape as NORA_LLC_API_KEYS_JSON
//
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { getClientIp, json, logEdgeEvent, rateLimit, requireAllowlistedEmail, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';

type ApiKeyRecord = { key: string; label?: string };

function parseKeys(raw: string): ApiKeyRecord[] {
  const t = (raw || '').trim();
  if (!t) return [];
  try {
    const v = JSON.parse(t);
    if (Array.isArray(v)) {
      return v
        .map((x) => (typeof x === 'string' ? { key: x.trim() } : x?.key ? { key: String(x.key).trim(), label: x.label } : null))
        .filter(Boolean) as ApiKeyRecord[];
    }
  } catch {
    // ignore
  }
  return t.split(',').map((k) => ({ key: k.trim() })).filter((r) => r.key);
}

function getApiKey(req: Request): string {
  return (
    (req.headers.get('x-finely-partner-api-key') || '').trim() ||
    (req.headers.get('x-api-key') || '').trim()
  );
}

type Body =
  | { action: 'health' }
  | { action: 'partner.readiness'; partnerId?: string; email?: string }
  | { action: 'partner.funding_intent'; partnerId: string; intent?: string; metadata?: Record<string, unknown> }
  | { action: 'voice.catalog'; tenantId?: string; contentType?: string; contentId?: string }
  | { action: 'voice.asset'; tenantId?: string; contentType?: string; contentId: string; voiceProfile: string; scriptHash: string }
  | { action: 'voice.render'; tenantId?: string; contentType?: string; contentId: string; title?: string; voiceProfile?: string; script: string; scriptHash: string; force?: boolean }
  | { action: 'lead.capture'; tenantId?: string; fullName: string; email: string; phone?: string; source?: string; offer?: string; funnelPath?: string; referralCode?: string; consentToContact?: boolean }
  | { action: 'tenant.embed_config'; tenantId?: string };

function buildReadiness(partner: any) {
  const signals = partner.journey_signals && typeof partner.journey_signals === 'object' ? partner.journey_signals : {};
  let score = 20;
  const js = partner.journey_stage;
  if (js === 'letters' || js === 'mailing') score += 25;
  if (js === 'funding' || js === 'complete') score += 35;
  const legacyStatus = Number(signals.legacyApplicationStatus ?? 0);
  if (legacyStatus >= 7) score += 15;
  if (legacyStatus >= 10) score += 10;
  if (Number(signals.legacyReportCount ?? 0) > 0) score += 10;
  if (Number(signals.legacyLetterCount ?? 0) > 0) score += 10;
  score = Math.min(100, score);
  const blockers: string[] = [];
  if (!Number(signals.legacyReportCount ?? 0)) blockers.push('No credit report on file.');
  return {
    partnerId: partner.id,
    externalId: partner.import_external_id ?? null,
    fullName: partner.profile?.fullName ?? partner.profile?.full_name ?? null,
    email: partner.profile?.email ?? null,
    phone: partner.profile?.phone ?? null,
    journeyStage: partner.journey_stage ?? null,
    fundingStage: partner.funding_stage ?? signals.fundingStage ?? 'not_ready',
    readinessScore: score,
    blockers,
    journeySignals: signals,
    exportedAt: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  const keys = parseKeys(Deno.env.get('FINELY_PARTNER_API_KEYS_JSON') || Deno.env.get('NORA_LLC_API_KEYS_JSON') || '');
  const apiKey = getApiKey(req);
  let authorized = keys.length > 0 && keys.some((k) => k.key === apiKey);

  if (!authorized) {
    try {
      const ctx = await requireAuth(req);
      requireAllowlistedEmail(ctx);
      authorized = true;
    } catch {
      // Nora integrators must use API key
    }
  }

  if (!authorized) {
    return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `finely-partner-api:${apiKey || 'admin'}:${ip}`, limit: 120, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const action = (body as any)?.action;
  if (action === 'health') {
    return json({ ok: true, service: 'finely-partner-api', at: new Date().toISOString() });
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  if (action === 'partner.readiness') {
    const partnerId = String((body as any).partnerId || '').trim();
    const email = String((body as any).email || '').trim().toLowerCase();
    if (!partnerId && !email) return json({ ok: false, error: 'partnerId or email required' }, { status: 400 });

    let q = admin.from('partners').select('*');
    if (partnerId) q = q.eq('id', partnerId);
    else q = q.filter('profile->>email', 'eq', email);
    const { data, error } = await q.maybeSingle();
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return json({ ok: false, error: 'Partner not found' }, { status: 404 });

    await logEdgeEvent({
      namespace: 'finely-partner-api',
      level: 'info',
      event: 'partner.readiness',
      meta: { partnerId: data.id, email: data.profile?.email },
    });
    return json({ ok: true, readiness: buildReadiness(data) });
  }

  if (action === 'partner.funding_intent') {
    const partnerId = String((body as any).partnerId || '').trim();
    if (!partnerId) return json({ ok: false, error: 'partnerId required' }, { status: 400 });
    const { data, error } = await admin
      .from('partners')
      .update({
        funding_stage: 'submitted',
        funding_meta: {
          intent: (body as any).intent ?? 'apply',
          metadata: (body as any).metadata ?? {},
          submittedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId)
      .select('*')
      .maybeSingle();
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return json({ ok: false, error: 'Partner not found' }, { status: 404 });
    await logEdgeEvent({
      namespace: 'finely-partner-api',
      level: 'info',
      event: 'partner.funding_intent',
      meta: { partnerId },
    });
    return json({ ok: true, partnerId, fundingStage: 'submitted' });
  }

  if (action === 'voice.catalog' || action === 'voice.asset' || action === 'voice.render') {
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const anonKey = requireEnv('SUPABASE_ANON_KEY');
    const client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
    const mapAction = action === 'voice.catalog' ? 'catalog' : action === 'voice.asset' ? 'asset' : 'render';
    const { data, error } = await client.functions.invoke('voice-studio', {
      body: { ...(body as any), action: mapAction },
    });
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    return json(data);
  }

  if (action === 'tenant.embed_config') {
    const tenantId = String((body as any).tenantId || 'nora_capital').trim();
    await logEdgeEvent({
      namespace: 'finely-partner-api',
      level: 'info',
      event: 'tenant.embed_config',
      meta: { tenantId },
    });
    return json({
      ok: true,
      tenantId,
      embed: {
        funnels: [
          { id: 'credit_dispute', path: '/free-guide', label: 'Credit Dispute Guide' },
          { id: 'debt_freedom', path: '/debt-freedom-guide', label: 'Debt Freedom Playbook' },
          { id: 'business_credit', path: '/business-credit-guide', label: 'Business Credit Jumpstart' },
        ],
        voiceTenantId: tenantId,
        leadCaptureAction: 'lead.capture',
        apiVersion: 'v2',
      },
    });
  }

  if (action === 'lead.capture') {
    const email = String((body as any).email || '').trim().toLowerCase();
    const fullName = String((body as any).fullName || '').trim();
    if (!email || !fullName) return json({ ok: false, error: 'fullName and email required' }, { status: 400 });

    const leadId = `lead_${crypto.randomUUID()}`;
    const row = {
      id: leadId,
      source: String((body as any).source || 'agent'),
      offer: String((body as any).offer || 'general_inquiry'),
      interest: (body as any).interest ?? null,
      full_name: fullName,
      email,
      phone: String((body as any).phone || '').trim() || null,
      consent_to_contact: Boolean((body as any).consentToContact ?? true),
      referral_code: (body as any).referralCode ?? null,
      funnel_path: (body as any).funnelPath ?? null,
      utm_source: (body as any).utmSource ?? null,
      utm_medium: (body as any).utmMedium ?? null,
      utm_campaign: (body as any).utmCampaign ?? null,
    };

    const { error } = await admin.from('lead_captures').insert(row);
    if (error) return json({ ok: false, error: error.message }, { status: 500 });

    await logEdgeEvent({
      namespace: 'finely-partner-api',
      level: 'info',
      event: 'lead.capture',
      meta: { leadId, email, tenantId: (body as any).tenantId ?? 'nora_capital' },
    });
    return json({ ok: true, leadId, email });
  }

  return json({ ok: false, error: 'Unknown action' }, { status: 400 });
});
