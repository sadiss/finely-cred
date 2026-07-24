import { isSupabaseConfigured, supabase } from './supabaseClient';
import type {
  NoraApiEnvelope,
  NoraFundingBriefResponse,
  NoraFundingPushResponse,
  NoraFundingQueueItem,
} from './noraFundingApiTypes';

export type NoraPartnerApiAction =
  | 'health'
  | 'api.catalog'
  | 'api.playbook'
  | 'api.pull_catalog'
  | 'partner.readiness'
  | 'partner.full_profile'
  | 'partner.enriched_profile'
  | 'partner.funding_brief'
  | 'partner.nora_sync_bundle'
  | 'partner.funding_dossier_v5'
  | 'partner.funding_dossier_v6'
  | 'partner.funding_dossier_push'
  | 'partner.funding_queue'
  | 'partner.batch_dossier_push'
  | 'partner.evidence_manifest'
  | 'partner.funding_intent'
  | 'vault.intel_feed'
  | 'roles.recognize'
  | 'lead.capture'
  | 'voice.render'
  | 'voice.catalog'
  | 'voice.asset'
  | 'tenant.embed_config'
  | 'ml.advisory'
  | 'ml.funding_path'
  | 'ml.dispute_strategy'
  | 'ml.pipeline_insights';

async function invokePartnerApi<T>(body: Record<string, unknown>): Promise<NoraApiEnvelope<T>> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      error: 'Supabase not configured — set VITE_SUPABASE_URL and anon key.',
      hint: 'Configure environment variables before calling the Nora funding API.',
    } as NoraApiEnvelope<T>;
  }
  const { data, error } = await supabase.functions.invoke('finely-partner-api', { body });
  if (error) {
    return {
      ok: false,
      error: error.message,
      hint: 'Edge function invoke failed — check auth and deployment.',
    } as NoraApiEnvelope<T>;
  }
  return (data ?? { ok: false, error: 'Empty response' }) as NoraApiEnvelope<T>;
}

/** Discover all actions + recommended flow. */
export async function noraApiCatalog(tenantId = 'nora_capital') {
  return invokePartnerApi<{ actions: string[]; recommendedFlow?: string[]; dossierCapabilities?: string[] }>({
    action: 'api.catalog',
    tenantId,
  });
}

/** Human-friendly guide for funding API actions. */
export async function noraApiPlaybook(topic?: string) {
  return invokePartnerApi({ action: 'api.playbook', topic });
}

/** Nora Capital discovers how to PULL from Finely Cred. */
export async function finelyPullCatalogForNora() {
  return invokePartnerApi({ action: 'api.pull_catalog' });
}

/** Recommended one-call sync for Nora cron jobs. */
export async function noraPartnerSyncBundle(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({
    action: 'partner.nora_sync_bundle',
    partnerId: args.partnerId,
    email: args.email,
  });
}

/** Fast executive brief — best for CRM cards (~200ms, no ML). */
export async function noraPartnerFundingBrief(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi<NoraFundingBriefResponse>({
    action: 'partner.funding_brief',
    partnerId: args.partnerId,
    email: args.email,
  });
}

/** Full dossier v6 with optional section filter. */
export async function noraPartnerFundingDossierV6(args: {
  partnerId?: string;
  email?: string;
  sections?: string | string[];
  includeMl?: boolean;
  adminOverride?: boolean;
}) {
  return invokePartnerApi({
    action: 'partner.funding_dossier_v6',
    partnerId: args.partnerId,
    email: args.email,
    sections: args.sections ?? 'full',
    includeMl: args.includeMl !== false,
    adminOverride: args.adminOverride,
  });
}

/** @deprecated Use noraPartnerFundingDossierV6 */
export async function noraPartnerFundingDossierV5(args: {
  partnerId?: string;
  email?: string;
  includeMl?: boolean;
}) {
  return invokePartnerApi({
    action: 'partner.funding_dossier_v5',
    partnerId: args.partnerId,
    email: args.email,
    includeMl: args.includeMl !== false,
  });
}

/** Push full dossier to Nora Capital webhook. */
export async function noraPartnerFundingDossierPush(args: {
  partnerId?: string;
  email?: string;
  clientId?: string;
  force?: boolean;
  includeMl?: boolean;
  sections?: string | string[];
}): Promise<NoraFundingPushResponse> {
  return invokePartnerApi({
    action: 'partner.funding_dossier_push',
    partnerId: args.partnerId,
    email: args.email,
    clientId: args.clientId,
    force: args.force,
    includeMl: args.includeMl !== false,
    sections: args.sections ?? 'full',
  }) as Promise<NoraFundingPushResponse>;
}

/** Ops queue — partners ready for funding review. */
export async function noraPartnerFundingQueue(args?: { limit?: number; minScore?: number }) {
  return invokePartnerApi<{ queue: NoraFundingQueueItem[]; count: number }>({
    action: 'partner.funding_queue',
    limit: args?.limit ?? 25,
    minScore: args?.minScore ?? 65,
  });
}

/** Batch push fund-ready dossiers (ops). */
export async function noraPartnerBatchDossierPush(args?: { limit?: number; minScore?: number; force?: boolean }) {
  return invokePartnerApi({
    action: 'partner.batch_dossier_push',
    limit: args?.limit ?? 3,
    minScore: args?.minScore ?? 70,
    force: args?.force,
  });
}

export async function noraPartnerReadiness(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'partner.readiness', partnerId: args.partnerId, email: args.email });
}

export async function noraPartnerFullProfile(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'partner.full_profile', partnerId: args.partnerId, email: args.email });
}

export async function noraPartnerEnrichedProfile(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'partner.enriched_profile', partnerId: args.partnerId, email: args.email });
}

export async function noraMlAdvisory(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'ml.advisory', partnerId: args.partnerId, email: args.email });
}

export async function noraMlFundingPath(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'ml.funding_path', partnerId: args.partnerId, email: args.email });
}

export async function noraMlDisputeStrategy(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'ml.dispute_strategy', partnerId: args.partnerId, email: args.email });
}

export async function noraMlPipelineInsights(args?: { limit?: number }) {
  return invokePartnerApi({ action: 'ml.pipeline_insights', limit: args?.limit ?? 20 });
}

export async function noraPartnerEvidenceManifest(args: { partnerId: string }) {
  return invokePartnerApi({ action: 'partner.evidence_manifest', partnerId: args.partnerId });
}

export async function noraVaultIntelFeed(args?: { limit?: number }) {
  return invokePartnerApi({ action: 'vault.intel_feed', limit: args?.limit ?? 25 });
}

export async function noraRecognizeRole(args: { email: string }) {
  return invokePartnerApi({ action: 'roles.recognize', email: args.email });
}

export async function noraCaptureLead(args: {
  fullName: string;
  email: string;
  phone?: string;
  funnelPath?: string;
  referralCode?: string;
}) {
  return invokePartnerApi({
    action: 'lead.capture',
    fullName: args.fullName,
    email: args.email,
    phone: args.phone,
    funnelPath: args.funnelPath,
    referralCode: args.referralCode,
    consentToContact: true,
    source: 'nora_partner_api',
  });
}

export async function noraRenderVoice(args: {
  contentId: string;
  script: string;
  scriptHash: string;
  contentType?: string;
  title?: string;
}) {
  return invokePartnerApi({ action: 'voice.render', ...args });
}

/** @deprecated Use noraPartnerFundingDossierV6 */
export const callNoraPartnerApi = invokePartnerApi;
