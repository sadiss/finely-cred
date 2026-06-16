import { isSupabaseConfigured, supabase } from './supabaseClient';

async function invokePartnerApi(body: Record<string, unknown>) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('finely-partner-api', { body });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Partner API request failed.');
  return data;
}

export function getProviderGatewayUrl(): string {
  return (import.meta.env.VITE_PROVIDER_GATEWAY_URL || import.meta.env.VITE_FINELY_CRED_API_URL || '').trim();
}

export async function fetchCreditProgram(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'partner.credit_program', ...args });
}

export async function fetchUnderwritingPacketV2(args: { partnerId?: string; email?: string; adminOverride?: boolean }) {
  return invokePartnerApi({ action: 'partner.underwriting_packet_v2', ...args });
}

export async function triggerBridgeFundReady(args: { partnerId?: string; email?: string; force?: boolean }) {
  return invokePartnerApi({ action: 'bridge.fund_ready', ...args });
}

export async function fetchBridgeOpsSnapshot() {
  return invokePartnerApi({ action: 'bridge.ops_snapshot' });
}

export async function runMlPipelineInsights(limit = 20) {
  return invokePartnerApi({ action: 'ml.pipeline_insights', limit });
}

export async function runMlFundingPath(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'ml.funding_path', ...args });
}

export async function runMlAdvisory(args: { partnerId?: string; email?: string }) {
  return invokePartnerApi({ action: 'ml.advisory', ...args });
}
