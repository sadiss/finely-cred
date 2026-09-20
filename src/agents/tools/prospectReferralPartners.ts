import { listProspects } from '../../data/crmProspectsRepo';
import { listPartnersByTenant } from '../../data/partnersRepo';
import {
  localDedupeIndex,
  persistProspectorRun,
} from '../../data/partnerProspectsRepo';
import { getFeatureFlags } from '../../data/settingsRepo';
import {
  addIdentity,
  emptyDedupeIndex,
  mergeIndexes,
  prospectReferralPartners as runEngine,
  type DedupeIndex,
  type PartnerVertical,
  type ProspectorRunParams,
  type ProspectorRunResult,
  type RawProspectCandidate,
} from '../../domain/partnerProspector/index.ts';
import { nameCityKey } from '../../domain/partnerProspector/normalize.ts';
import { rateLimitedEnricher } from '../../lib/partnerProspector/enrichment.ts';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { getActiveTenantId } from '../../tenancy/activeTenant';

export const prospectReferralPartnersDefinition = {
  name: 'prospectReferralPartners' as const,
  description:
    'Find South Florida / Haitian-corridor referral partners (tax, BHPH, realtor, mortgage, immigration/notary). Scores strong|maybe|skip, writes why_fit, dedupes CRM, exports draft-only. Never sends email.',
  parameters: {
    type: 'object',
    properties: {
      metros: { type: 'array', items: { type: 'string' }, description: 'Metro pack ids (default: SFL)' },
      verticals: {
        type: 'array',
        items: { type: 'string', enum: ['tax', 'bhph', 'realtor', 'mortgage', 'immigration', 'community'] },
      },
      limit: { type: 'number', description: 'Batch size, default 50' },
      dedupe: { type: 'boolean', default: true },
      enrich: { type: 'boolean', description: 'Fetch official sites for public mailto/tel only' },
    },
  },
};

async function crmDedupeIndex(): Promise<DedupeIndex> {
  const index = emptyDedupeIndex();
  for (const p of listProspects()) {
    addIdentity(index, {
      emails: p.contact?.emails ?? [],
      phones: p.contact?.phones ?? [],
      domains: [p.company?.website, p.company?.domain].filter(Boolean) as string[],
      names: p.company?.name ? [nameCityKey(p.company.name, p.company.location)] : [],
    });
  }
  try {
    const partners = await listPartnersByTenant(getActiveTenantId());
    for (const partner of partners) {
      addIdentity(index, {
        emails: partner.profile?.email ? [partner.profile.email] : [],
        phones: partner.profile?.phone ? [partner.profile.phone] : [],
      });
    }
  } catch {
    // offline / RLS — local CRM + prior batches still apply
  }
  return index;
}

async function discoverViaEdge(args: {
  metros: string[];
  verticals: PartnerVertical[];
  limit: number;
}): Promise<RawProspectCandidate[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.functions.invoke('partner-prospector', {
      body: { action: 'discover', metros: args.metros, verticals: args.verticals, limit: Math.min(20, args.limit) },
    });
    if (error || !data?.ok) return [];
    return (data.candidates ?? []) as RawProspectCandidate[];
  } catch {
    return [];
  }
}

async function persistRemote(result: ProspectorRunResult) {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.functions.invoke('partner-prospector', {
      body: { action: 'persist', result },
    });
  } catch {
    // local persist is the durable fallback
  }
}

export async function executeProspectReferralPartners(params: ProspectorRunParams = {}): Promise<ProspectorRunResult> {
  const flags = getFeatureFlags();
  if ((flags as any).partnerProspector === false) {
    throw new Error('Partner Prospector is disabled (Feature Flags).');
  }

  const prior = mergeIndexes(localDedupeIndex(), await crmDedupeIndex());
  const enrich = params.enrich === true;

  const result = await runEngine(
    { ...params, dedupe: params.dedupe !== false, enrich },
    {
      discover: async (q) => discoverViaEdge(q),
      enrichPage: enrich ? rateLimitedEnricher({ gapMs: 850 }) : undefined,
      loadDedupeIndex: async () => prior,
      persistBatch: async (batch) => {
        persistProspectorRun(batch);
        void persistRemote(batch);
      },
    },
  );

  return result;
}
