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

export type MailProviderStatus = {
  ok: boolean;
  provider?: MailProvider;
  message?: string;
  error?: string;
  code?: number;
  /** True when LetterStream TEST mode / MAIL_TEST_MODE / debug debug is active. */
  testMode: boolean;
  /** True when MAIL_LIVE_MODE forces production sends (no debug/test flags). */
  liveMode?: boolean;
  debugLevel?: number | null;
  /** Prepaid balance in USD when the API (or ping payload) exposes it. */
  balanceUsd: number | null;
  estimatedCostUsd: number;
};

const DEFAULT_EST_COST_USD = 1.85;

function coerceStatus(data: Record<string, unknown> | null | undefined, fallbackErr?: string): MailProviderStatus {
  const raw = data || {};
  const testMode =
    !Boolean(raw.liveMode) &&
    (Boolean(raw.testMode) ||
      /\btest\s*mode\b|\btestmode\b|\bsandbox\s*mode\b|\bin\s*test\b/i.test(String(raw.message || raw.error || '')));
  const balanceRaw = raw.balanceUsd;
  const balanceUsd =
    typeof balanceRaw === 'number' && Number.isFinite(balanceRaw)
      ? balanceRaw
      : typeof balanceRaw === 'string' && Number.isFinite(Number(balanceRaw))
        ? Number(balanceRaw)
        : null;
  const est =
    typeof raw.estimatedCostUsd === 'number' && Number.isFinite(raw.estimatedCostUsd)
      ? raw.estimatedCostUsd
      : DEFAULT_EST_COST_USD;
  return {
    ok: Boolean(raw.ok),
    provider: normalizeMailProvider(raw.provider as string | undefined),
    message: typeof raw.message === 'string' ? raw.message : undefined,
    error: typeof raw.error === 'string' ? raw.error : fallbackErr,
    code: typeof raw.code === 'number' ? raw.code : undefined,
    testMode,
    liveMode: Boolean(raw.liveMode),
    debugLevel: typeof raw.debugLevel === 'number' ? raw.debugLevel : raw.debugLevel === null ? null : undefined,
    balanceUsd,
    estimatedCostUsd: est,
  };
}

export async function pingMailProvider(): Promise<{ ok: boolean; provider?: MailProvider; message?: string; error?: string }> {
  const status = await getMailProviderStatus();
  return {
    ok: status.ok,
    provider: status.provider,
    message: status.message,
    error: status.error,
  };
}

/** Connectivity + testmode + optional prepaid balance (LetterStream via mailer edge). */
export async function getMailProviderStatus(): Promise<MailProviderStatus> {
  if (!isFeatureEnabled('letterMailing')) {
    throw new Error('Letter mailing is disabled (Feature Flags).');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (missing env).');
  }

  const { data, error } = await supabase.functions.invoke('mailer', {
    body: { op: 'status' },
  });

  if (error) {
    return coerceStatus(data as Record<string, unknown> | null, error.message);
  }
  return coerceStatus(data as Record<string, unknown> | null);
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

/** Sequential batch send — one LetterStream job per letter PDF. */
export async function mailLettersBatchViaProvider(args: {
  partnerId: string;
  from: MailAddress;
  items: Array<{ letterId: string; pdfBlobRef: string; to: MailAddress }>;
  options?: {
    color?: boolean;
    doubleSided?: boolean;
    mailType?: 'firstclass' | 'certified' | 'certnoerr' | 'flat';
    coverSheet?: boolean;
  };
}): Promise<Array<{ letterId: string; ok: boolean; result?: MailLetterResult; error?: string }>> {
  const out: Array<{ letterId: string; ok: boolean; result?: MailLetterResult; error?: string }> = [];
  for (const item of args.items) {
    try {
      const result = await mailLetterViaProvider({
        partnerId: args.partnerId,
        letterId: item.letterId,
        pdfBlobRef: item.pdfBlobRef,
        to: item.to,
        from: args.from,
        options: args.options ?? { color: true, doubleSided: true },
      });
      out.push({ letterId: item.letterId, ok: true, result });
    } catch (e: unknown) {
      out.push({ letterId: item.letterId, ok: false, error: (e as Error)?.message || 'Mailing failed.' });
    }
  }
  return out;
}

export function formatMailAddressOneLine(a: MailAddress): string {
  const line2 = a.addressLine2?.trim() ? `, ${a.addressLine2.trim()}` : '';
  return `${a.name} · ${a.addressLine1}${line2}, ${a.city}, ${a.state} ${a.zip}`.replace(/\s+/g, ' ').trim();
}

export { FINELY_MAIL_PROVIDER };
