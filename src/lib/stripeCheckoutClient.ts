import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';

export async function createStripeCheckoutSession(args: {
  agreementId: string;
  tenantId: string;
  partnerId: string;
  packageId: string;
  amountCents?: number;
}): Promise<{ sessionId: string; url: string }> {
  if (!isFeatureEnabled('stripeEnabled')) throw new Error('Stripe is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: args,
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Stripe checkout failed.');
  if (!data?.sessionId || !data?.url) throw new Error('Stripe response missing session url.');
  return { sessionId: data.sessionId, url: data.url };
}

export async function verifyStripeCheckoutSession(args: { sessionId: string; agreementId?: string }): Promise<{
  paid: boolean;
  paymentStatus?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  paymentIntentId?: string | null;
  agreementId?: string | null;
  partnerId?: string | null;
}> {
  if (!isFeatureEnabled('stripeEnabled')) throw new Error('Stripe is disabled (Feature Flags).');
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('stripe-verify', {
    body: args,
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Stripe verify failed.');
  return {
    paid: Boolean(data.paid),
    paymentStatus: data.paymentStatus ?? null,
    amountTotal: data.amountTotal ?? null,
    currency: data.currency ?? null,
    paymentIntentId: data.paymentIntentId ?? null,
    agreementId: data.agreementId ?? null,
    partnerId: data.partnerId ?? null,
  };
}

