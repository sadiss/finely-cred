import { supabase, isSupabaseConfigured } from './supabaseClient';

export type NoraPullResponse<T = unknown> = {
  ok: boolean;
  action?: string;
  status?: number;
  data?: T;
  error?: string;
  hint?: string;
};

async function invokeNoraCapital<T = unknown>(body: Record<string, unknown>): Promise<NoraPullResponse<T>> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Supabase not configured.', hint: 'Set VITE_SUPABASE_URL and anon key.' };
  }
  const { data, error } = await supabase.functions.invoke('nora-capital', { body });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: 'Empty response' }) as NoraPullResponse<T>;
}

/** List pull operations Finely Cred can call on Nora Capital. */
export async function noraPullCatalog() {
  return invokeNoraCapital<{ catalog: Record<string, unknown>; pullPrefixes: string[] }>({ action: 'catalog' });
}

/** GET dossier previously pushed to Nora by exportId. */
export async function noraPullDossier(exportId: string) {
  return invokeNoraCapital<{ dossier: unknown }>({ action: 'pull.dossier', exportId });
}

/** List dossiers on Nora for a client or Finely partner. */
export async function noraPullDossiers(args: { clientId?: string; partnerId?: string; limit?: number }) {
  return invokeNoraCapital<{ dossiers: unknown[]; count: number }>({
    action: 'pull.dossiers',
    clientId: args.clientId,
    partnerId: args.partnerId,
    limit: args.limit ?? 20,
  });
}

/** Nora-side Finely client registration status. */
export async function noraPullClientStatus(clientId: string) {
  return invokeNoraCapital<{ status: unknown }>({ action: 'pull.client_status', clientId });
}

/** Nora CRM profile snapshot (funding verdict, doThisNext, dossier summary). */
export async function noraPullCrmProfile(clientId: string) {
  return invokeNoraCapital<{ profile: unknown }>({ action: 'pull.crm_profile', clientId });
}

/** Funding application record from Nora. */
export async function noraPullApplication(applicationId: string) {
  return invokeNoraCapital<{ application: unknown }>({ action: 'pull.application', applicationId });
}

/** Sync Nora funding status back onto Finely partner journey signals. */
export async function syncPartnerFundingFromNora(args: {
  partner: { id: string; importExternalId?: string | null; journeySignals?: Record<string, unknown> };
  clientId?: string;
  exportId?: string;
}) {
  const clientId = args.clientId || args.partner.importExternalId || undefined;
  const out: {
    ok: boolean;
    dossier?: unknown;
    dossiers?: unknown[];
    clientStatus?: unknown;
    crmProfile?: unknown;
    merged?: Record<string, unknown>;
    errors: string[];
  } = { ok: false, errors: [] };

  if (args.exportId) {
    const d = await noraPullDossier(args.exportId);
    if (d.ok) out.dossier = d.data?.dossier ?? d.data;
    else out.errors.push(d.error || 'pull.dossier failed');
  }

  if (clientId) {
    const [statusRes, profileRes, listRes] = await Promise.all([
      noraPullClientStatus(clientId),
      noraPullCrmProfile(clientId),
      noraPullDossiers({ clientId, partnerId: args.partner.id, limit: 5 }),
    ]);
    if (statusRes.ok) out.clientStatus = statusRes.data?.status ?? statusRes.data;
    else out.errors.push(statusRes.error || 'pull.client_status failed');
    if (profileRes.ok) out.crmProfile = profileRes.data?.profile ?? profileRes.data;
    else out.errors.push(profileRes.error || 'pull.crm_profile failed');
    if (listRes.ok) out.dossiers = (listRes.data as { dossiers?: unknown[] })?.dossiers;
    else out.errors.push(listRes.error || 'pull.dossiers failed');
  } else if (!args.exportId) {
    out.errors.push('clientId or exportId required to pull from Nora.');
    return out;
  }

  const profile = out.crmProfile as Record<string, unknown> | undefined;
  const summary = (profile?.finelyCredDossierSummary ?? profile?.finelyCredDossierBrief) as Record<string, unknown> | undefined;
  out.merged = {
    noraSyncedAt: new Date().toISOString(),
    fundingReadinessScore: profile?.fundingReadinessScore ?? summary?.readinessScore,
    fundingReadinessVerdict: profile?.fundingReadinessVerdict ?? summary?.fundingVerdict,
    lenderReadinessVerdict: profile?.lenderReadinessVerdict ?? summary?.lenderVerdict,
    doThisNext: profile?.doThisNext ?? summary?.doThisNext,
    dossierExportId: profile?.finelyCredDossierExportId ?? summary?.exportId,
    bridgeHandoffSuggestedAt: profile?.bridgeHandoffSuggestedAt,
    complianceScore: profile?.complianceScore ?? summary?.complianceScore,
  };
  out.ok = out.errors.length === 0 || Boolean(out.dossier || out.crmProfile);
  return out;
}
