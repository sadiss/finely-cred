import { isSupabaseConfigured, supabase } from './supabaseClient';

export async function finelyPartnerReadiness(args: { partnerId?: string; email?: string }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('finely-partner-api', {
    body: { action: 'partner.readiness', partnerId: args.partnerId, email: args.email },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Readiness request failed.');
  return data as { ok: true; readiness: Record<string, unknown> };
}

export async function finelyPartnerApiHealth() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.functions.invoke('finely-partner-api', {
    body: { action: 'health' },
  });
  if (error) throw new Error(error.message);
  return data;
}
