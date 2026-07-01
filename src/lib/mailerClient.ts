import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { FINELY_MAIL_PROVIDER, type FinelyMailProvider, normalizeMailProvider } from './mailWhiteLabel';

export type MailProvider = FinelyMailProvider;

export type MailAddress = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
};

export type MailAddressVerificationResult = {
  provider: MailProvider;
  /** Raw provider response (contains deliverability, components, etc.) */
  raw: unknown;
};

export type MailLetterResult = {
  provider: MailProvider;
  providerId: string;
  expectedDeliveryDate?: string;
  status?: string;
  batch?: string;
  job?: string;
  cost?: number;
  authcode?: string;
  message?: string;
};

export async function pingMailProvider(): Promise<{ ok: boolean; provider?: MailProvider; message?: string; error?: string }> {
  if (!isFeatureEnabled('letterMailing')) {
    throw new Error('Letter mailing is disabled (Feature Flags).');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (missing env).');
  }

  const { data, error } = await supabase.functions.invoke('mailer', {
    body: { op: 'ping' },
  });

  if (error) throw new Error(error.message);
  return {
    ok: Boolean(data?.ok),
    provider: normalizeMailProvider(data?.provider),
    message: data?.message,
    error: data?.error,
  };
}

export async function verifyMailAddressesViaProvider(args: {
  to: MailAddress;
  from: MailAddress;
}): Promise<{ provider: MailProvider; to: MailAddressVerificationResult; from: MailAddressVerificationResult }> {
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

  const provider = normalizeMailProvider(data.provider);
  return {
    provider,
    to: { provider, raw: data.to },
    from: { provider, raw: data.from },
  };
}

export async function mailLetterViaProvider(args: {
  partnerId: string;
  letterId: string;
  pdfBlobRef: string;
  to: MailAddress;
  from: MailAddress;
  options?: {
    color?: boolean;
    doubleSided?: boolean;
    mailType?: 'firstclass' | 'certified' | 'certnoerr' | 'flat';
    coverSheet?: boolean;
    pages?: number;
    preauth?: boolean;
  };
}): Promise<MailLetterResult> {
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
  if (!data?.ok) throw new Error(data?.error || data?.message || 'Mailing failed.');

  return {
    provider: normalizeMailProvider(data.provider),
    providerId: data.providerId,
    expectedDeliveryDate: data.expectedDeliveryDate ?? undefined,
    status: data.status ?? undefined,
    batch: data.batch ?? undefined,
    job: data.job ?? undefined,
    cost: data.cost ?? undefined,
    authcode: data.authcode ?? undefined,
    message: data.message ?? undefined,
  };
}

export { FINELY_MAIL_PROVIDER };
