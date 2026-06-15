/** Stripe Checkout for public enlightenment / consultation sessions (Phase 31). */
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';

export async function createPublicSessionCheckout(args: {
  requestId: string;
  email: string;
  fullName: string;
  amountCents: number;
  topic: 'enlightenment' | 'consultation';
}): Promise<{ sessionId: string; url: string }> {
  if (!isFeatureEnabled('stripeEnabled')) throw new Error('Stripe is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('public-session-checkout', {
    body: { action: 'create', ...args },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Checkout failed.');
  if (!data?.sessionId || !data?.url) throw new Error('Checkout response missing session url.');
  return { sessionId: data.sessionId, url: data.url };
}

export async function verifyPublicSessionCheckout(args: {
  sessionId: string;
  requestId: string;
  email?: string;
}): Promise<{ ok: boolean; paid: boolean }> {
  if (!isSupabaseConfigured) return { ok: false, paid: false };
  try {
    const { data, error } = await supabase.functions.invoke('public-session-checkout', {
      body: { action: 'verify', sessionId: args.sessionId, requestId: args.requestId, email: args.email },
    });
    if (error || !data?.ok) return { ok: false, paid: false };
    return { ok: true, paid: Boolean(data.paid) };
  } catch {
    return { ok: false, paid: false };
  }
}
