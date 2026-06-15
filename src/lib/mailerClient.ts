import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';

export type MailAddress = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
};

export type MailAddressVerificationResult = {
  provider: 'lob';
  /** Raw provider response (contains deliverability, components, etc.) */
  raw: any;
};

export async function verifyMailAddressesViaProvider(args: {
  to: MailAddress;
  from: MailAddress;
}): Promise<{ provider: 'lob'; to: MailAddressVerificationResult; from: MailAddressVerificationResult }> {
  if (!isFeatureEnabled('letterMailing')) {
    throw new Error('Letter mailing is disabled (Feature Flags).');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (missing env).');
  }

  const { data, error } = await supabase.functions.invoke('mailer', {
    body: {
      op: 'verify',
      to: args.to,
      from: args.from,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Verification failed.');
  return {
    provider: 'lob',
    to: { provider: 'lob', raw: data.to },
    from: { provider: 'lob', raw: data.from },
  };
}

export async function mailLetterViaProvider(args: {
  partnerId: string;
  letterId: string;
  pdfBlobRef: string;
  to: MailAddress;
  from: MailAddress;
  options?: { color?: boolean; doubleSided?: boolean };
}): Promise<{ provider: 'lob'; providerId: string; expectedDeliveryDate?: string; status?: string }> {
  if (!isFeatureEnabled('letterMailing')) {
    throw new Error('Letter mailing is disabled (Feature Flags).');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (missing env).');
  }

  const { data, error } = await supabase.functions.invoke('mailer', {
    body: {
      partnerId: args.partnerId,
      letterId: args.letterId,
      pdfBlobRef: args.pdfBlobRef,
      to: args.to,
      from: args.from,
      options: args.options ?? {},
      idempotencyKey: `${args.partnerId}:${args.letterId}:${String(args.pdfBlobRef).slice(-64)}`,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Mailing failed.');
  return {
    provider: 'lob',
    providerId: data.providerId,
    expectedDeliveryDate: data.expectedDeliveryDate ?? undefined,
    status: data.status ?? undefined,
  };
}

