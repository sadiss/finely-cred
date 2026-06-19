import { isSupabaseConfigured, supabase } from './supabaseClient';



export type NoraPartnerApiAction =

  | 'health'

  | 'api.catalog'

  | 'partner.readiness'

  | 'partner.full_profile'

  | 'partner.enriched_profile'

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



export type NoraPartnerApiResponse<T = unknown> = {

  ok: boolean;

  data?: T;

  error?: string;

};



/** Nora Capital Group / Finely Partner API v4 (edge function). */

export async function callNoraPartnerApi<T = unknown>(args: {

  action: NoraPartnerApiAction;

  tenantId?: string;

  body?: Record<string, unknown>;

}): Promise<NoraPartnerApiResponse<T>> {

  if (!isSupabaseConfigured) {

    return { ok: false, error: 'Supabase not configured — set VITE_SUPABASE_URL and anon key.' };

  }



  const { data, error } = await supabase.functions.invoke('finely-partner-api', {

    body: { action: args.action, tenantId: args.tenantId ?? 'finely_cred', ...args.body },

  });



  if (error) return { ok: false, error: error.message };

  return { ok: true, data: data as T };

}



export async function noraApiCatalog(tenantId = 'nora_capital') {

  return callNoraPartnerApi<{ version: string; actions: string[]; mlCapabilities?: string[] }>({

    action: 'api.catalog',

    tenantId,

  });

}



export async function noraPartnerReadiness(args: { partnerId?: string; email?: string; tenantId?: string }) {

  return callNoraPartnerApi({

    action: 'partner.readiness',

    tenantId: args.tenantId,

    body: { partnerId: args.partnerId, email: args.email },

  });

}



export async function noraPartnerFullProfile(args: { partnerId?: string; email?: string; tenantId?: string }) {

  return callNoraPartnerApi({

    action: 'partner.full_profile',

    tenantId: args.tenantId,

    body: { partnerId: args.partnerId, email: args.email },

  });

}



export async function noraPartnerEnrichedProfile(args: { partnerId?: string; email?: string; tenantId?: string }) {

  return callNoraPartnerApi({

    action: 'partner.enriched_profile',

    tenantId: args.tenantId,

    body: { partnerId: args.partnerId, email: args.email },

  });

}



export async function noraMlAdvisory(args: { partnerId?: string; email?: string; tenantId?: string }) {

  return callNoraPartnerApi({

    action: 'ml.advisory',

    tenantId: args.tenantId,

    body: { partnerId: args.partnerId, email: args.email },

  });

}



export async function noraMlFundingPath(args: { partnerId?: string; email?: string; tenantId?: string }) {

  return callNoraPartnerApi({

    action: 'ml.funding_path',

    tenantId: args.tenantId,

    body: { partnerId: args.partnerId, email: args.email },

  });

}



export async function noraMlDisputeStrategy(args: { partnerId?: string; email?: string; tenantId?: string }) {

  return callNoraPartnerApi({

    action: 'ml.dispute_strategy',

    tenantId: args.tenantId,

    body: { partnerId: args.partnerId, email: args.email },

  });

}



export async function noraMlPipelineInsights(args: { tenantId?: string; limit?: number }) {

  return callNoraPartnerApi({

    action: 'ml.pipeline_insights',

    tenantId: args.tenantId ?? 'nora_capital',

    body: { limit: args.limit ?? 20 },

  });

}



export async function noraPartnerEvidenceManifest(args: { partnerId: string; tenantId?: string }) {

  return callNoraPartnerApi({

    action: 'partner.evidence_manifest',

    tenantId: args.tenantId,

    body: { partnerId: args.partnerId },

  });

}



export async function noraVaultIntelFeed(args: { tenantId?: string; limit?: number }) {

  return callNoraPartnerApi({

    action: 'vault.intel_feed',

    tenantId: args.tenantId ?? 'finely_cred',

    body: { limit: args.limit ?? 25 },

  });

}



export async function noraRecognizeRole(args: { email: string; tenantId?: string }) {

  return callNoraPartnerApi({

    action: 'roles.recognize',

    tenantId: args.tenantId,

    body: { email: args.email },

  });

}



export async function noraCaptureLead(args: {

  fullName: string;

  email: string;

  phone?: string;

  funnelPath?: string;

  referralCode?: string;

  tenantId?: string;

}) {

  return callNoraPartnerApi({

    action: 'lead.capture',

    tenantId: args.tenantId,

    body: {

      fullName: args.fullName,

      email: args.email,

      phone: args.phone,

      funnelPath: args.funnelPath,

      referralCode: args.referralCode,

      consentToContact: true,

      source: 'nora_partner_api',

    },

  });

}



export async function noraRenderVoice(args: {

  contentId: string;

  script: string;

  scriptHash: string;

  contentType?: string;

  title?: string;

  tenantId?: string;

}) {

  return callNoraPartnerApi({

    action: 'voice.render',

    tenantId: args.tenantId,

    body: args,

  });

}

