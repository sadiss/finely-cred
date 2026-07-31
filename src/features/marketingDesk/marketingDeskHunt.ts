/**
 * Find-new-people engine — one-tap, daily pack, schedule prefs, smart qualify, Review staging.
 * Persist + mail enroll via marketingDeskPersist (A3 dedupe-safe).
 */
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { callAiGateway } from '../../lib/aiClient';
import { getFeatureFlags, isFeatureEnabled } from '../../data/settingsRepo';
import { loadJson, saveJson } from '../../data/localJsonStore';
import { findProspectByWebsite, listProspects } from '../../data/crmProspectsRepo';
import {
  HUNT_LANE_PRESETS,
  appendLeadActivity,
  applyImportScoring,
  buildHuntQueries,
  saveLastLeadHuntRun,
  type LeadEngineLane,
} from '../leadIntel/leadEngineAutonomy';
import { upsertTask } from '../../data/tasksRepo';
import { persistApprovedMarketingHit, findExistingMarketingProspect } from './marketingDeskPersist';
import { ensureMarketingPipelineProject } from './marketingDeskProjects';
import { createMarketingTask, createReviewImportsTask, findOpenMarketingTask } from './marketingDeskTasks';

const STAGING_KEY = 'finely.marketing_desk_staging.v1';
const GEO_KEY = 'finely.marketing_desk_find_geo.v1';
const SCHEDULE_KEY = 'finely.marketing_desk_find_schedule.v1';
const LAST_RUN_KEY = 'finely.marketing_desk_find_last_run.v1';

export const AUTO_APPROVE_SCORE = 70;
export const AUTO_REJECT_SCORE = 40;
/** Mid-band hits that clear optional fit check can auto-save at this floor. */
export const AI_FIT_APPROVE_FLOOR = 58;
/** Cap optional fit checks per Find run (graceful offline if gateway off). */
const AI_FIT_MAX_PER_RUN = 5;

const FREE_MAIL_HOSTS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'proton.me',
  'protonmail.com',
  'ymail.com',
  'live.com',
]);

const DISPOSABLE_MAIL_HINTS = [
  'mailinator',
  'guerrillamail',
  'tempmail',
  '10minutemail',
  'yopmail',
  'trashmail',
  'sharklasers',
];

const JUNK_TITLE_RE =
  /^(home|index|untitled|login|sign\s*in|404|not\s*found|welcome|coming\s*soon|domain\s*for\s*sale|buy\s*this\s*domain)$/i;
const PARKING_RE =
  /domain\s*for\s*sale|buy\s*this\s*domain|parked\s*domain|godaddy|hugedomains|sedo\.com|coming\s*soon/i;
const DIRECTORY_SPAM_RE =
  /yellowpages|yelp\.com\/biz|linkedin\.com\/(pub|in|company)|facebook\.com\/|instagram\.com\/|crunchbase\.com\/|bbb\.org\//i;
const BAD_TLD_RE = /\.(xyz|top|click|loan|junk|icu|buzz|work|gq|tk|ml|cf|ga|zip|mov)$/i;

const DAILY_PACK_LANES: LeadEngineLane[] = [
  'business_credit',
  'credit_restore',
  'debt',
  'agency_affiliates',
  'local_service',
];

export type MarketingStagedHit = {
  url: string;
  title?: string;
  domain?: string;
  snippet?: string;
  score: number;
  emails?: string[];
  phones?: string[];
  industry?: string;
  intentTier?: string;
  confidence?: number;
  meta?: { description?: string };
  whyNote?: string;
  whyReason?: string;
  decision?: 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'skipped';
  prospectId?: string;
  lane?: LeadEngineLane;
};

export type MarketingFindLastRun = {
  at: string;
  mode: 'one_tap' | 'daily_pack' | 'scheduled';
  location: string;
  lanes: LeadEngineLane[];
  found: number;
  autoSaved: number;
  review: number;
  skipped: number;
  errors: string[];
  prospectIds: string[];
};

export type MarketingFindReadinessStep = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href?: string;
};

export type MarketingFindResult = {
  found: number;
  autoSaved: number;
  review: number;
  skipped: number;
  errors: string[];
  error?: string;
  /** @deprecated use found */
  staged?: number;
};

type StagingStore = {
  hits: MarketingStagedHit[];
  huntedAt?: string;
  lane?: LeadEngineLane;
};

function loadStaging(): StagingStore {
  return loadJson<StagingStore>(STAGING_KEY, { hits: [] }, 1);
}

function saveStaging(store: StagingStore) {
  saveJson(STAGING_KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getMarketingFindGeo(): string {
  const raw = loadJson<{ location?: string }>(GEO_KEY, {}, 1);
  return (raw.location || 'United States').trim() || 'United States';
}

export function setMarketingFindGeo(location: string) {
  saveJson(GEO_KEY, { location: (location || 'United States').trim() || 'United States' }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export type MarketingFindSchedule = {
  enabled: boolean;
  location?: string;
  /** Remembered Daily pack lanes (multi-lane comfort). */
  lanes?: LeadEngineLane[];
  updatedAt?: string;
};

export function getMarketingFindSchedule(): MarketingFindSchedule {
  const raw = loadJson<Partial<MarketingFindSchedule>>(SCHEDULE_KEY, { enabled: false }, 1);
  return {
    enabled: Boolean(raw.enabled),
    location: raw.location,
    lanes: Array.isArray(raw.lanes) ? (raw.lanes as LeadEngineLane[]) : undefined,
    updatedAt: raw.updatedAt,
  };
}

export function setMarketingFindSchedule(
  enabled: boolean,
  location?: string,
  lanes?: LeadEngineLane[],
) {
  const prev = getMarketingFindSchedule();
  saveJson(
    SCHEDULE_KEY,
    {
      enabled,
      location: (location || getMarketingFindGeo()).trim(),
      lanes: lanes?.length ? lanes : prev.lanes,
      updatedAt: new Date().toISOString(),
    },
    1,
  );
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

/** Lanes for Daily pack / overnight — remembered preference or default pack. */
export function getMarketingDailyPackLanes(): LeadEngineLane[] {
  const sched = getMarketingFindSchedule();
  if (sched.lanes?.length) return sched.lanes.slice(0, 5);
  return DAILY_PACK_LANES.slice(0, 5);
}

export function setMarketingDailyPackLanes(lanes: LeadEngineLane[]) {
  const sched = getMarketingFindSchedule();
  const next = lanes.length ? lanes.slice(0, 5) : DAILY_PACK_LANES.slice(0, 5);
  setMarketingFindSchedule(sched.enabled, sched.location || getMarketingFindGeo(), next);
}

export function listMarketingFindLaneOptions(): Array<{ id: LeadEngineLane; label: string }> {
  return HUNT_LANE_PRESETS.slice(0, 6).map((p) => ({ id: p.id, label: p.shortLabel || p.label }));
}

export function getMarketingFindLastRun(): MarketingFindLastRun | null {
  return loadJson<MarketingFindLastRun | null>(LAST_RUN_KEY, null, 1);
}

function saveMarketingFindLastRun(run: MarketingFindLastRun) {
  saveJson(LAST_RUN_KEY, run, 1);
  saveLastLeadHuntRun({
    at: run.at,
    lane: run.lanes[0] || 'business_credit',
    location: run.location,
    imported: run.autoSaved,
    prospectIds: run.prospectIds,
    error: run.errors[0],
    batchId: `desk_${run.mode}_${run.found}`,
  });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function getMarketingFindReadiness(): {
  ready: boolean;
  label: string;
  steps: MarketingFindReadinessStep[];
} {
  const deskOn = isFeatureEnabled('marketingDesk');
  const leadOn = Boolean(getFeatureFlags().leadIntel);
  const supabaseOk = isSupabaseConfigured;
  const steps: MarketingFindReadinessStep[] = [
    {
      id: 'desk',
      label: 'Marketing Desk flag',
      detail: 'Turn on marketingDesk in Admin Settings → Features.',
      done: deskOn,
      href: '/admin/settings',
    },
    {
      id: 'leadIntel',
      label: 'Find engine flag',
      detail: 'Turn on leadIntel so live Find can run.',
      done: leadOn,
      href: '/admin/settings',
    },
    {
      id: 'supabase',
      label: 'Supabase connected',
      detail: 'Connect Supabase so the hunt function can run.',
      done: supabaseOk,
      href: '/admin/settings',
    },
    {
      id: 'serper',
      label: 'Search API key (owner)',
      // Never mark Done client-side — key lives in function secrets; false Done was lying.
      detail:
        'Owner adds SERPER_API_KEY on the lead-intel function secrets, then redeploys. Not verifiable here.',
      done: false,
      href: '/admin/settings',
    },
  ];
  // Client-ready = flags + Supabase. Search key is owner ops (step stays Needed until hunt succeeds).
  const ready = deskOn && leadOn && supabaseOk;
  return {
    ready,
    label: ready ? 'Find Ready' : 'Find Needs setup',
    steps,
  };
}

export function listMarketingStagingQueue(limit = 8): MarketingStagedHit[] {
  return loadStaging()
    .hits.filter((h) => (h.decision ?? 'pending') === 'pending')
    .slice(0, limit);
}

export function countMarketingStagingPending(): number {
  return loadStaging().hits.filter((h) => (h.decision ?? 'pending') === 'pending').length;
}

/**
 * Reject every pending exception (Clear exceptions comfort).
 * Completes open Review to-do when the queue hits zero.
 */
export function clearMarketingStagingExceptions(): { cleared: number; remaining: number } {
  const store = loadStaging();
  let cleared = 0;
  store.hits = store.hits.map((h) => {
    if ((h.decision ?? 'pending') === 'pending') {
      cleared += 1;
      return { ...h, decision: 'rejected' as const };
    }
    return h;
  });
  saveStaging(store);
  const remaining = store.hits.filter((h) => (h.decision ?? 'pending') === 'pending').length;
  if (remaining === 0) {
    const open = findOpenMarketingTask({ kind: 'review' });
    if (open) {
      try {
        upsertTask({
          ...open,
          status: 'completed',
          completedAt: new Date().toISOString(),
          notes: `${open.notes || ''}\n[Auto] Exceptions cleared from Desk.`.trim(),
        });
      } catch {
        /* non-blocking */
      }
    }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
  return { cleared, remaining };
}

export function countMarketingStagingApproved(withinMs = 7 * 86400000): number {
  const last = getMarketingFindLastRun();
  if (last && Date.now() - Date.parse(last.at) <= withinMs) return last.autoSaved;
  const store = loadStaging();
  return store.hits.filter((h) => h.decision === 'approved' || h.decision === 'auto_approved').length;
}

function hostFromEmail(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase() : '';
}

/** Stronger junk classifiers — returns reason code or null. */
export function isJunkHit(hit: MarketingStagedHit): string | null {
  const title = (hit.title || '').trim();
  const domain = (hit.domain || '').toLowerCase().replace(/^www\./, '');
  const snippet = `${hit.snippet || ''} ${hit.meta?.description || ''}`;
  const url = (hit.url || '').toLowerCase();

  if (!title && !domain) return 'no_company';
  if (title && JUNK_TITLE_RE.test(title)) return 'placeholder_title';
  if (BAD_TLD_RE.test(domain) || BAD_TLD_RE.test(url)) return 'bad_tld';
  if (PARKING_RE.test(snippet) || PARKING_RE.test(title)) return 'parking';
  if (DIRECTORY_SPAM_RE.test(url)) return 'directory_listing';

  if (domain) {
    const labels = domain.split('.').filter(Boolean);
    const sld = labels.length >= 2 ? labels[labels.length - 2] : labels[0];
    if (sld && (sld.length <= 2 || /^\d+$/.test(sld))) return 'thin_domain';
    if ((sld.match(/-/g) || []).length >= 3) return 'spammy_domain';
  }

  const email = hit.emails?.[0]?.toLowerCase();
  if (email) {
    const host = hostFromEmail(email);
    if (DISPOSABLE_MAIL_HINTS.some((h) => host.includes(h))) return 'disposable_email';
    if (FREE_MAIL_HOSTS.has(host) && (!title || JUNK_TITLE_RE.test(title) || title.length < 3)) {
      return 'free_mail_no_company';
    }
    const dupEmail = listProspects().some((p) =>
      (p.contact?.emails ?? []).some((e) => e.toLowerCase() === email),
    );
    if (dupEmail) return 'duplicate_email';
  }

  if (findExistingMarketingProspect(hit) || findProspectByWebsite(hit.url)) return 'duplicate';

  // No contact signal + weak score → quiet skip
  const hasContact = (hit.emails?.length ?? 0) > 0 || (hit.phones?.length ?? 0) > 0;
  if (!hasContact && hit.score < AUTO_REJECT_SCORE + 8) return 'no_contact_weak';

  return null;
}

function qualifyHit(hit: MarketingStagedHit): 'auto_approve' | 'review' | 'reject' {
  const junk = isJunkHit(hit);
  if (junk) return 'reject';
  if (hit.score >= AUTO_APPROVE_SCORE) return 'auto_approve';
  if (hit.score < AUTO_REJECT_SCORE) return 'reject';
  return 'review';
}

type AiFitVerdict = 'approve' | 'reject' | 'review';

/**
 * Optional one-line fit via AI Gateway — never blocks Find when offline.
 * Returns null when gateway unavailable or parse fails.
 */
async function optionalAiFitVerdict(hit: MarketingStagedHit): Promise<{
  verdict: AiFitVerdict;
  line: string;
} | null> {
  if (!isFeatureEnabled('aiGateway') || !isSupabaseConfigured) return null;
  try {
    const res = await callAiGateway({
      taskType: 'marketing.desk.qualify_fit.v1',
      responseFormat: 'text',
      messages: [
        {
          role: 'system',
          content:
            'You qualify B2B marketing leads for a credit/funding education brand. Reply with exactly two lines: (1) APPROVE or REJECT or REVIEW (2) one plain English fit sentence. No vendor or model names.',
        },
        {
          role: 'user',
          content: [
            `Company: ${hit.title || hit.domain || 'unknown'}`,
            `Domain: ${hit.domain || ''}`,
            `Score: ${hit.score}`,
            `Lane: ${hit.lane || 'business_credit'}`,
            `Snippet: ${(hit.snippet || hit.meta?.description || '').slice(0, 280)}`,
            `Emails: ${(hit.emails || []).slice(0, 2).join(', ') || 'none'}`,
            `Why: ${hit.whyReason || hit.whyNote || ''}`,
          ].join('\n'),
        },
      ],
    });
    const text = (res.text || '').trim();
    if (!text) return null;
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const head = (lines[0] || text).toUpperCase();
    let verdict: AiFitVerdict = 'review';
    if (/\bAPPROVE\b/.test(head)) verdict = 'approve';
    else if (/\bREJECT\b/.test(head)) verdict = 'reject';
    else if (/\bREVIEW\b/.test(head)) verdict = 'review';
    else return null;
    const line = (lines[1] || lines[0] || 'Fit check complete.').replace(/^(APPROVE|REJECT|REVIEW)\s*[:.-]?\s*/i, '').trim();
    return { verdict, line: line.slice(0, 160) || 'Fit check complete.' };
  } catch {
    return null;
  }
}

async function applyOptionalAiFit(
  hits: MarketingStagedHit[],
  routes: Map<string, 'auto_approve' | 'review' | 'reject'>,
): Promise<void> {
  const candidates = hits
    .filter((h) => routes.get(h.url) === 'review' && h.score >= AI_FIT_APPROVE_FLOOR)
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_FIT_MAX_PER_RUN);

  for (const hit of candidates) {
    const fit = await optionalAiFitVerdict(hit);
    if (!fit) continue;
    hit.whyReason = fit.line;
    hit.whyNote = fit.line;
    if (fit.verdict === 'reject') routes.set(hit.url, 'reject');
    else if (fit.verdict === 'approve' && hit.score >= AI_FIT_APPROVE_FLOOR) {
      routes.set(hit.url, 'auto_approve');
    }
  }
}

async function invokeLaneHunt(args: {
  lane: LeadEngineLane;
  location: string;
}): Promise<{ hits: MarketingStagedHit[]; error?: string }> {
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === args.lane);
  if (!preset) return { hits: [], error: `Unknown lane ${args.lane}` };

  const queries = buildHuntQueries({
    lane: args.lane,
    location: args.location,
    niche: 'general',
    intent: 'high_intent',
    geo: 'national',
  });

  const invokeOnce = () =>
    supabase.functions.invoke('lead-intel', {
      body: {
        target: preset.target,
        queries,
        location: args.location,
        limit: 20,
        enrich: true,
        signupIntent: true,
        searchMode: 'mixed',
        country: 'us',
      },
    });

  let { data, error } = await invokeOnce();
  if (error || !data?.ok) {
    ({ data, error } = await invokeOnce());
  }
  if (error) return { hits: [], error: error.message };
  if (!data?.ok) {
    const msg = String(data?.error || 'Hunt failed');
    const friendly =
      /SERPER/i.test(msg) || /missing/i.test(msg)
        ? 'Search API key missing on the hunt function. Add the key in Supabase secrets, redeploy, then retry.'
        : msg;
    return { hits: [], error: friendly };
  }

  const results = (data.results ?? []) as Array<{
    url?: string;
    title?: string;
    domain?: string;
    snippet?: string;
    score?: number;
    emails?: string[];
    phones?: string[];
    industry?: string;
    intentTier?: string;
    confidence?: number;
    meta?: { description?: string };
  }>;

  const hits: MarketingStagedHit[] = [];
  for (const r of results) {
    const url = (r.url || '').trim();
    if (!url) continue;
    const scored = applyImportScoring({
      lane: args.lane,
      baseScore: r.score ?? 0,
      intentTier: r.intentTier,
      hasEmail: (r.emails?.length ?? 0) > 0,
      hasPhone: (r.phones?.length ?? 0) > 0,
      snippet: r.snippet || r.meta?.description,
      industry: r.industry,
      niche: 'general',
      intent: 'high_intent',
    });
    const why = scored.whyNote || 'Lane fit from Find.';
    hits.push({
      url,
      title: r.title,
      domain: r.domain,
      snippet: r.snippet,
      score: scored.score,
      emails: r.emails,
      phones: r.phones,
      industry: r.industry,
      intentTier: r.intentTier,
      confidence: r.confidence,
      meta: r.meta,
      whyNote: why,
      whyReason: why,
      decision: 'pending',
      lane: args.lane,
    });
  }
  return { hits };
}

async function processQualifiedHits(args: {
  hits: MarketingStagedHit[];
  lane: LeadEngineLane;
  mergeStaging: boolean;
}): Promise<{ autoSaved: number; review: number; skipped: number; prospectIds: string[] }> {
  ensureMarketingPipelineProject();
  const store = args.mergeStaging ? loadStaging() : { hits: [] as MarketingStagedHit[], huntedAt: undefined, lane: args.lane };
  const byUrl = new Map(store.hits.map((h) => [h.url, h]));

  let autoSaved = 0;
  let review = 0;
  let skipped = 0;
  const prospectIds: string[] = [];

  const fresh: MarketingStagedHit[] = [];
  const routes = new Map<string, 'auto_approve' | 'review' | 'reject'>();

  for (const hit of args.hits) {
    if (byUrl.has(hit.url) && (byUrl.get(hit.url)?.decision ?? 'pending') !== 'pending') {
      skipped += 1;
      continue;
    }
    const tagged = { ...hit, lane: hit.lane || args.lane };
    fresh.push(tagged);
    routes.set(tagged.url, qualifyHit(tagged));
  }

  await applyOptionalAiFit(fresh, routes);

  for (const hit of fresh) {
    const route = routes.get(hit.url) ?? 'review';
    if (route === 'reject') {
      skipped += 1;
      byUrl.set(hit.url, { ...hit, decision: 'skipped' });
      continue;
    }
    if (route === 'auto_approve') {
      const persisted = persistApprovedMarketingHit({
        hit,
        lane: hit.lane || args.lane,
        sourceNote: '[Marketing Desk] Auto-saved (smart qualify)',
        enrollMail: true,
      });
      if (persisted.ok && persisted.prospectId) {
        autoSaved += 1;
        prospectIds.push(persisted.prospectId);
        byUrl.set(hit.url, {
          ...hit,
          decision: 'auto_approved',
          prospectId: persisted.prospectId,
        });
      } else {
        skipped += 1;
      }
      continue;
    }
    review += 1;
    byUrl.set(hit.url, { ...hit, decision: 'pending' });
  }

  const nextHits = Array.from(byUrl.values());
  saveStaging({
    hits: nextHits,
    huntedAt: new Date().toISOString(),
    lane: args.lane,
  });

  const pending = nextHits.filter((h) => (h.decision ?? 'pending') === 'pending').length;
  if (pending > 0) createReviewImportsTask(pending);

  return { autoSaved, review, skipped, prospectIds };
}

export async function huntForMarketingReview(args?: {
  lane?: LeadEngineLane;
  location?: string;
  mode?: MarketingFindLastRun['mode'];
}): Promise<MarketingFindResult> {
  ensureMarketingPipelineProject();
  const readiness = getMarketingFindReadiness();
  const lane = args?.lane ?? 'business_credit';
  const location = (args?.location || getMarketingFindGeo()).trim();
  const mode = args?.mode ?? 'one_tap';

  if (!readiness.ready) {
    const result: MarketingFindResult = {
      found: 0,
      autoSaved: 0,
      review: 0,
      skipped: 0,
      errors: ['Needs setup — Fix Find setup first.'],
      error: 'Needs setup — Fix Find setup first.',
      staged: 0,
    };
    saveMarketingFindLastRun({
      at: new Date().toISOString(),
      mode,
      location,
      lanes: [lane],
      found: 0,
      autoSaved: 0,
      review: 0,
      skipped: 0,
      errors: result.errors,
      prospectIds: [],
    });
    // Overnight / pack blocked by setup → My work Fix setup (create or refresh).
    if (mode === 'scheduled' || mode === 'daily_pack') {
      ensureFindFailedFixSetupTask(result.error || result.errors[0]);
    }
    return result;
  }

  const { hits, error } = await invokeLaneHunt({ lane, location });
  if (error && hits.length === 0) {
    const result: MarketingFindResult = {
      found: 0,
      autoSaved: 0,
      review: 0,
      skipped: 0,
      errors: [error],
      error,
      staged: 0,
    };
    saveMarketingFindLastRun({
      at: new Date().toISOString(),
      mode,
      location,
      lanes: [lane],
      ...result,
      errors: [error],
      prospectIds: [],
    });
    ensureFindFailedFixSetupTask(error);
    return result;
  }

  const processed = await processQualifiedHits({ hits, lane, mergeStaging: false });
  const result: MarketingFindResult = {
    found: hits.length,
    autoSaved: processed.autoSaved,
    review: processed.review,
    skipped: processed.skipped,
    errors: error ? [error] : [],
    error,
    staged: processed.review,
  };

  saveMarketingFindLastRun({
    at: new Date().toISOString(),
    mode,
    location,
    lanes: [lane],
    found: result.found,
    autoSaved: result.autoSaved,
    review: result.review,
    skipped: result.skipped,
    errors: result.errors,
    prospectIds: processed.prospectIds,
  });

  appendLeadActivity({
    kind: 'hunt',
    label: `Marketing Desk Find · ${result.found} found · ${result.autoSaved} auto-saved`,
    detail: `Review ${result.review} · skipped ${result.skipped}`,
    count: result.found,
    lane,
  });

  // Successful Find path clears Fix setup My work (create-or-refresh on fail).
  completeFindFailedFixSetupTask();

  return result;
}

export async function runMarketingDailyPack(args?: {
  location?: string;
  lanes?: LeadEngineLane[];
  mode?: MarketingFindLastRun['mode'];
}): Promise<MarketingFindResult> {
  ensureMarketingPipelineProject();
  const location = (args?.location || getMarketingFindGeo()).trim();
  const lanes = args?.lanes?.length ? args.lanes : getMarketingDailyPackLanes();
  const mode = args?.mode ?? 'daily_pack';
  const readiness = getMarketingFindReadiness();

  // Remember pack lanes for overnight comfort
  if (args?.lanes?.length) {
    setMarketingDailyPackLanes(args.lanes);
  }

  if (!readiness.ready) {
    return huntForMarketingReview({ lane: lanes[0], location, mode });
  }

  let found = 0;
  let autoSaved = 0;
  let review = 0;
  let skipped = 0;
  const errors: string[] = [];
  const prospectIds: string[] = [];
  let first = true;

  for (const lane of lanes) {
    const { hits, error } = await invokeLaneHunt({ lane, location });
    if (error) errors.push(`${lane}: ${error}`);
    if (!hits.length) continue;
    found += hits.length;
    const processed = await processQualifiedHits({ hits, lane, mergeStaging: !first });
    first = false;
    autoSaved += processed.autoSaved;
    review = countMarketingStagingPending();
    skipped += processed.skipped;
    prospectIds.push(...processed.prospectIds);
  }

  const result: MarketingFindResult = {
    found,
    autoSaved,
    review,
    skipped,
    errors,
    error: errors[0],
    staged: review,
  };

  saveMarketingFindLastRun({
    at: new Date().toISOString(),
    mode,
    location,
    lanes,
    found,
    autoSaved,
    review,
    skipped,
    errors,
    prospectIds,
  });

  if (errors.length && found === 0) {
    ensureFindFailedFixSetupTask(errors[0]);
  } else if (found > 0 || errors.length === 0) {
    completeFindFailedFixSetupTask();
  }

  appendLeadActivity({
    kind: 'daily_pack',
    label: `Marketing Desk pack · ${found} found · ${autoSaved} auto-saved`,
    detail: `${lanes.length} lanes · review ${review}`,
    count: found,
  });

  return result;
}

/** Clear Find failed — Fix setup when Find succeeds again. */
export function completeFindFailedFixSetupTask() {
  try {
    const open = listTasksFindFailed();
    if (!open) return;
    upsertTask({
      ...open,
      status: 'completed',
      completedAt: new Date().toISOString(),
      notes: `${open.notes || ''}\n[Auto] Find succeeded — setup looks good.`.trim(),
    });
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
  } catch {
    /* non-blocking */
  }
}

/** Create or refresh the single Find failed — Fix setup My work to-do. */
export function ensureFindFailedFixSetupTask(detail?: string) {
  try {
    const notes =
      (detail || '').trim() ||
      'Daily pack / overnight Find hit an issue. Open Find → Fix setup.';
    const open = listTasksFindFailed();
    if (open) {
      upsertTask({
        ...open,
        title: 'Find failed — Fix setup',
        notes,
        status: 'pending',
        priority: 'high',
        dueAt: new Date().toISOString(),
        tags: Array.from(new Set([...(open.tags ?? []), 'marketing-find-failed', 'marketing-desk'])),
        meta: {
          ...(open.meta ?? {}),
          source: 'marketing_desk',
          marketingKind: 'failed_send',
          findFailed: true,
          lastFailAt: new Date().toISOString(),
          href: '/admin/marketing-desk?helper=find',
        },
      });
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
      return;
    }
    createMarketingTask({
      kind: 'failed_send',
      title: 'Find failed — Fix setup',
      notes,
      href: '/admin/marketing-desk?helper=find',
      priority: 'high',
      dueAt: new Date().toISOString(),
      tags: ['marketing-find-failed'],
      meta: { findFailed: true, lastFailAt: new Date().toISOString() },
      dedupe: false,
    });
  } catch {
    /* non-blocking */
  }
}

function listTasksFindFailed() {
  const t = findOpenMarketingTask({ kind: 'failed_send' });
  if (!t) return undefined;
  if ((t.tags ?? []).includes('marketing-find-failed')) return t;
  if ((t.meta as { findFailed?: boolean } | undefined)?.findFailed) return t;
  return undefined;
}

function isSameLocalDay(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    Number.isFinite(d.getTime()) &&
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

/**
 * Cron entry — Daily pack when Find while I sleep is On.
 * Once per local day (platform cron may tick every minute while admin is open).
 */
export async function runScheduledMarketingFind(): Promise<MarketingFindResult | null> {
  const schedule = getMarketingFindSchedule();
  if (!schedule.enabled) return null;

  const last = getMarketingFindLastRun();
  if (last?.mode === 'scheduled' && last.at && isSameLocalDay(last.at) && !last.errors[0]) {
    return null;
  }

  return runMarketingDailyPack({
    location: schedule.location || getMarketingFindGeo(),
    lanes: getMarketingDailyPackLanes(),
    mode: 'scheduled',
  });
}

export function rejectMarketingStaged(url: string) {
  const store = loadStaging();
  store.hits = store.hits.map((h) => (h.url === url ? { ...h, decision: 'rejected' as const } : h));
  saveStaging(store);
  const remaining = store.hits.filter((h) => (h.decision ?? 'pending') === 'pending').length;
  if (remaining === 0) {
    const open = findOpenMarketingTask({ kind: 'review' });
    if (open) {
      try {
        upsertTask({
          ...open,
          status: 'completed',
          completedAt: new Date().toISOString(),
          notes: `${open.notes || ''}\n[Auto] Exceptions cleared from Desk.`.trim(),
        });
      } catch {
        /* non-blocking */
      }
    }
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

/** Approve one staged hit into CRM + cold mail enroll (or fallback task). Dedupe-safe. */
export function approveMarketingStaged(url: string): {
  ok: boolean;
  prospectId?: string;
  message: string;
  mailEnrolled?: boolean;
  deduped?: boolean;
} {
  const store = loadStaging();
  const hit = store.hits.find((h) => h.url === url && (h.decision ?? 'pending') === 'pending');
  if (!hit) return { ok: false, message: 'That person is no longer in the review queue.' };

  const lane = hit.lane ?? store.lane ?? 'business_credit';
  store.hits = store.hits.map((h) => (h.url === url ? { ...h, decision: 'approved' as const } : h));
  saveStaging(store);

  const pendingLeft = store.hits.filter((h) => (h.decision ?? 'pending') === 'pending').length;
  const result = persistApprovedMarketingHit({
    hit,
    lane,
    sourceNote: '[Marketing Desk] Approved from Review before save',
    pendingReviewLeft: pendingLeft,
    enrollMail: true,
  });

  if (result.prospectId) {
    const next = loadStaging();
    next.hits = next.hits.map((h) =>
      h.url === url ? { ...h, decision: 'approved' as const, prospectId: result.prospectId } : h,
    );
    saveStaging(next);
  }

  return {
    ok: result.ok,
    prospectId: result.prospectId,
    mailEnrolled: result.mailEnrolled,
    deduped: result.deduped,
    message: result.message,
  };
}

/** Explicit auto-approve helper for smart qualify / tests. */
export function autoApproveMarketingHit(
  hit: MarketingStagedHit,
  lane?: LeadEngineLane,
): ReturnType<typeof persistApprovedMarketingHit> {
  ensureMarketingPipelineProject();
  return persistApprovedMarketingHit({
    hit,
    lane: lane ?? hit.lane ?? 'business_credit',
    sourceNote: '[Marketing Desk] Auto-saved (smart qualify)',
    enrollMail: true,
  });
}
