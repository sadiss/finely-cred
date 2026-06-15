import { isSupabaseConfigured, supabase } from './supabaseClient';

export type NoraPartnerApiAction =
  | 'lead.capture'
  | 'voice.render'
  | 'voice.catalog'
  | 'voice.asset'
  | 'tenant.embed_config';

export type NoraPartnerApiResponse<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

/** Phase 27 — thin client for Nora / Partner API v2 (edge function). */
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

/** Capture a lead from a white-label tenant funnel. */
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

/** Request neural voice render for tenant content. */
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
