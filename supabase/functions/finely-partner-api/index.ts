// Supabase Edge Function: finely-partner-api
// Public API for Nora Capital Group (and other trusted integrators) to pull partner readiness.
//
// Auth: x-finely-partner-api-key (or x-api-key)
// Secret: FINELY_PARTNER_API_KEYS_JSON — same shape as NORA_LLC_API_KEYS_JSON
//
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { buildPartnerMlAdvisory, buildPartnerMlContext } from '../_shared/ncgMlEngine.ts';
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
  | { action: 'api.catalog' }
  | { action: 'partner.readiness'; partnerId?: string; email?: string }
  | { action: 'partner.full_profile'; partnerId?: string; email?: string }
  | { action: 'partner.evidence_manifest'; partnerId: string }
  | { action: 'partner.funding_intent'; partnerId: string; intent?: string; metadata?: Record<string, unknown> }
  | { action: 'vault.intel_feed'; tenantId?: string; limit?: number }
  | { action: 'roles.recognize'; email?: string; tenantId?: string }
  | { action: 'voice.catalog'; tenantId?: string; contentType?: string; contentId?: string }
  | { action: 'voice.asset'; tenantId?: string; contentType?: string; contentId: string; voiceProfile: string; scriptHash: string }
  | { action: 'voice.render'; tenantId?: string; contentType?: string; contentId: string; title?: string; voiceProfile?: string; script: string; scriptHash: string; force?: boolean }
  | { action: 'lead.capture'; tenantId?: string; fullName: string; email: string; phone?: string; source?: string; offer?: string; funnelPath?: string; referralCode?: string; consentToContact?: boolean }
  | { action: 'tenant.embed_config'; tenantId?: string }
  | { action: 'ml.advisory'; partnerId?: string; email?: string }
  | { action: 'ml.funding_path'; partnerId?: string; email?: string }
  | { action: 'ml.dispute_strategy'; partnerId?: string; email?: string }
  | { action: 'ml.pipeline_insights'; tenantId?: string; limit?: number }
  | { action: 'partner.enriched_profile'; partnerId?: string; email?: string };

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
    return json({ ok: true, service: 'finely-partner-api', version: 'v4', at: new Date().toISOString() });
  }

  if (action === 'api.catalog') {
    return json({
      ok: true,
      version: 'v4',
      actions: [
        'health',
        'api.catalog',
        'partner.readiness',
        'partner.full_profile',
        'partner.enriched_profile',
        'partner.evidence_manifest',
        'partner.funding_intent',
        'vault.intel_feed',
        'roles.recognize',
        'lead.capture',
        'tenant.embed_config',
        'ml.advisory',
        'ml.funding_path',
        'ml.dispute_strategy',
        'ml.pipeline_insights',
        'voice.catalog',
        'voice.asset',
        'voice.render',
      ],
      tenants: ['finely_cred', 'nora_capital'],
      mlCapabilities: [
        'Executive readiness summary with prioritized action plan',
        'Per-partner dispute strategy (round discipline, focus areas)',
        'Funding path sequencing with estimated timelines',
        'Pipeline-wide insights for NCG ops (aggregate blockers)',
        'OpenAI-powered suggestions with heuristic fallback',
      ],
    });
  }

  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  async function fetchPartnerCounts(partnerId: string) {
    const [reportsRes, evidenceRes, lettersRes] = await Promise.all([
      admin.from('credit_reports').select('id', { count: 'exact', head: true }).eq('partner_id', partnerId),
      admin.from('evidence').select('id', { count: 'exact', head: true }).eq('partner_id', partnerId),
      admin.from('letters').select('id', { count: 'exact', head: true }).eq('partner_id', partnerId),
    ]);
    return {
      reportCount: reportsRes.count ?? 0,
      evidenceCount: evidenceRes.count ?? 0,
      letterCount: lettersRes.count ?? 0,
    };
  }

  async function buildMlContext(partnerId?: string, email?: string) {
    const data = await fetchPartner(partnerId, email);
    if (!data) return null;
    const readiness = buildReadiness(data);
    const counts = await fetchPartnerCounts(data.id);
    return buildPartnerMlContext({
      partner: data,
      readiness: {
        readinessScore: readiness.readinessScore,
        blockers: readiness.blockers,
        journeySignals: readiness.journeySignals as Record<string, unknown>,
      },
      ...counts,
    });
  }

  if (action === 'ml.advisory' || action === 'ml.funding_path' || action === 'ml.dispute_strategy') {
    const partnerId = String((body as any).partnerId || '').trim();
    const email = String((body as any).email || '').trim().toLowerCase();
    if (!partnerId && !email) return json({ ok: false, error: 'partnerId or email required' }, { status: 400 });
    try {
      const ctx = await buildMlContext(partnerId || undefined, email || undefined);
      if (!ctx) return json({ ok: false, error: 'Partner not found' }, { status: 404 });
      const advisory = await buildPartnerMlAdvisory(ctx);
      if (action === 'ml.funding_path') {
        return json({ ok: true, partnerId: ctx.partnerId, fundingPath: advisory.fundingPath, readinessScore: advisory.readinessScore });
      }
      if (action === 'ml.dispute_strategy') {
        return json({ ok: true, partnerId: ctx.partnerId, disputeStrategy: advisory.disputeStrategy, suggestions: advisory.suggestions.filter((s) => s.category === 'dispute') });
      }
      return json({ ok: true, advisory });
    } catch (e) {
      return json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
  }

  if (action === 'ml.pipeline_insights') {
    const limit = Math.min(50, Math.max(5, Number((body as any).limit ?? 20)));
    const { data: partners, error } = await admin.from('partners').select('*').order('updated_at', { ascending: false }).limit(limit);
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    const insights: Array<{ partnerId: string; fullName: string | null; readinessScore: number; topPriority: string }> = [];
    let noReport = 0;
    let noLetters = 0;
    let fundingReady = 0;
    for (const p of partners ?? []) {
      const r = buildReadiness(p);
      const counts = await fetchPartnerCounts(p.id);
      if (counts.reportCount === 0) noReport += 1;
      if (counts.letterCount === 0) noLetters += 1;
      if (r.readinessScore >= 70) fundingReady += 1;
      const ctx = buildPartnerMlContext({
        partner: p,
        readiness: { readinessScore: r.readinessScore, blockers: r.blockers, journeySignals: r.journeySignals as Record<string, unknown> },
        ...counts,
      });
      const h = heuristicOnly(ctx);
      insights.push({
        partnerId: p.id,
        fullName: ctx.fullName,
        readinessScore: r.readinessScore,
        topPriority: h.topPriorities[0] ?? 'Review file',
      });
    }
    return json({
      ok: true,
      pipeline: {
        sampled: partners?.length ?? 0,
        noReport,
        noLetters,
        fundingReady,
        insights,
        opsRecommendations: [
          noReport > 0 ? `${noReport} partner(s) missing reports — trigger upload nurture.` : null,
          noLetters > 0 ? `${noLetters} partner(s) with reports but no Round 1 letters — assign dispute coach.` : null,
          fundingReady > 0 ? `${fundingReady} partner(s) at readiness ≥70 — prioritize NCG funding review queue.` : null,
        ].filter(Boolean),
        exportedAt: new Date().toISOString(),
      },
    });
  }

  function heuristicOnly(ctx: ReturnType<typeof buildPartnerMlContext>) {
    return {
      topPriorities: ctx.reportCount === 0
        ? ['Upload tri-bureau credit report']
        : ctx.letterCount === 0
          ? ['Launch Round 1 dispute with evidence']
          : ['Review bureau responses for Round 2'],
    };
  }

  if (action === 'partner.enriched_profile') {
    const partnerId = String((body as any).partnerId || '').trim();
    const email = String((body as any).email || '').trim().toLowerCase();
    if (!partnerId && !email) return json({ ok: false, error: 'partnerId or email required' }, { status: 400 });
    try {
      const data = await fetchPartner(partnerId || undefined, email || undefined);
      if (!data) return json({ ok: false, error: 'Partner not found' }, { status: 404 });
      const [reportsRes, evidenceRes, lettersRes] = await Promise.all([
        admin.from('credit_reports').select('id,filename,received_at,provider').eq('partner_id', data.id).limit(50),
        admin.from('evidence').select('id,filename,caption,type,created_at').eq('partner_id', data.id).limit(100),
        admin.from('letters').select('id,title,status,created_at,meta').eq('partner_id', data.id).limit(50),
      ]);
      const readiness = buildReadiness(data);
      const ctx = buildPartnerMlContext({
        partner: data,
        readiness: {
          readinessScore: readiness.readinessScore,
          blockers: readiness.blockers,
          journeySignals: readiness.journeySignals as Record<string, unknown>,
        },
        reportCount: (reportsRes.data ?? []).length,
        evidenceCount: (evidenceRes.data ?? []).length,
        letterCount: (lettersRes.data ?? []).length,
      });
      const advisory = await buildPartnerMlAdvisory(ctx);
      return json({
        ok: true,
        profile: {
          partner: data,
          readiness,
          reports: reportsRes.data ?? [],
          evidence: evidenceRes.data ?? [],
          letters: lettersRes.data ?? [],
          mlAdvisory: advisory,
          exportedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      return json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
  }

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

  async function fetchPartner(partnerId?: string, email?: string) {
    let q = admin.from('partners').select('*');
    if (partnerId) q = q.eq('id', partnerId);
    else q = q.filter('profile->>email', 'eq', email);
    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  if (action === 'partner.full_profile') {
    const partnerId = String((body as any).partnerId || '').trim();
    const email = String((body as any).email || '').trim().toLowerCase();
    if (!partnerId && !email) return json({ ok: false, error: 'partnerId or email required' }, { status: 400 });
    try {
      const data = await fetchPartner(partnerId || undefined, email || undefined);
      if (!data) return json({ ok: false, error: 'Partner not found' }, { status: 404 });
      const [reportsRes, evidenceRes, lettersRes] = await Promise.all([
        admin.from('credit_reports').select('id,filename,received_at,provider').eq('partner_id', data.id).limit(50),
        admin.from('evidence').select('id,filename,caption,type,created_at').eq('partner_id', data.id).limit(100),
        admin.from('letters').select('id,title,status,created_at,meta').eq('partner_id', data.id).limit(50),
      ]);
      return json({
        ok: true,
        profile: {
          partner: data,
          readiness: buildReadiness(data),
          reports: reportsRes.data ?? [],
          evidence: evidenceRes.data ?? [],
          letters: lettersRes.data ?? [],
          exportedAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      return json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
  }

  if (action === 'partner.evidence_manifest') {
    const partnerId = String((body as any).partnerId || '').trim();
    if (!partnerId) return json({ ok: false, error: 'partnerId required' }, { status: 400 });
    const [reportsRes, evidenceRes] = await Promise.all([
      admin.from('credit_reports').select('*').eq('partner_id', partnerId).order('received_at', { ascending: false }).limit(30),
      admin.from('evidence').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }).limit(80),
    ]);
    if (reportsRes.error) return json({ ok: false, error: reportsRes.error.message }, { status: 500 });
    if (evidenceRes.error) return json({ ok: false, error: evidenceRes.error.message }, { status: 500 });
    return json({
      ok: true,
      partnerId,
      manifest: {
        reports: (reportsRes.data ?? []).map((r: any) => ({
          id: r.id,
          filename: r.filename,
          receivedAt: r.received_at,
          provider: r.provider,
          hasBlob: Boolean(r.data?.rawBlobRef || r.data?.filename),
        })),
        evidence: (evidenceRes.data ?? []).map((e: any) => ({
          id: e.id,
          filename: e.filename,
          caption: e.caption,
          type: e.type,
          createdAt: e.created_at,
          blobRef: e.blob_ref,
        })),
        exportedAt: new Date().toISOString(),
      },
    });
  }

  if (action === 'vault.intel_feed') {
    const tenantId = String((body as any).tenantId || 'finely_cred').trim();
    const limit = Math.min(100, Math.max(1, Number((body as any).limit ?? 25)));
    const { data, error } = await admin
      .from('secret_vault_items')
      .select('id,title,media_kind,tags,intel,shared_with_roles,updated_at')
      .eq('tenant_id', tenantId)
      .eq('share_with_ncg', true)
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) return json({ ok: false, error: error.message, items: [] });
    return json({ ok: true, tenantId, items: data ?? [] });
  }

  if (action === 'roles.recognize') {
    const email = String((body as any).email || '').trim().toLowerCase();
    const tenantId = String((body as any).tenantId || 'finely_cred').trim();
    if (!email) return json({ ok: false, error: 'email required' }, { status: 400 });
    const { data: memberships } = await admin.from('memberships').select('*').eq('email', email).limit(20);
    const { data: adminRow } = await admin.from('admin_emails').select('email').eq('email', email).maybeSingle();
    const tenantMembership = (memberships ?? []).find((m: any) => m.tenant_id === tenantId) ?? (memberships ?? [])[0];
    return json({
      ok: true,
      recognition: {
        email,
        isAdmin: Boolean(adminRow),
        tenantId,
        membershipRole: tenantMembership?.role ?? null,
        recognitionLabel: adminRow ? 'Platform Admin' : tenantMembership?.role ?? 'unknown',
        sharedIntelScopes: adminRow || tenantMembership?.role === 'tenant_owner' ? ['finely_cred', 'nora_capital'] : ['finely_cred'],
        canAccessVault: Boolean(adminRow) || ['platform_admin', 'tenant_owner', 'agent'].includes(tenantMembership?.role),
        exportedAt: new Date().toISOString(),
      },
    });
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
        apiVersion: 'v4',
        partnerApiActions: [
          'partner.readiness',
          'partner.full_profile',
          'partner.enriched_profile',
          'partner.evidence_manifest',
          'vault.intel_feed',
          'roles.recognize',
          'ml.advisory',
          'ml.funding_path',
          'ml.dispute_strategy',
          'ml.pipeline_insights',
        ],
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
