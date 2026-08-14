import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { FINELY_MAIL_PROVIDER, type FinelyMailProvider, normalizeMailProvider } from './mailWhiteLabel';
import { mailClassEstCostUsd } from './mailClassOptions';

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

export type MailQuoteOption = {
  mailType: 'firstclass' | 'certified' | 'certnoerr' | 'flat';
  costUsd: number | null;
  code?: number;
  message?: string;
};

const DEFAULT_EST_COST_USD = mailClassEstCostUsd('certified');

function parseMailEdgeError(error: unknown, data: Record<string, unknown> | null | undefined): string {
  if (typeof data?.error === 'string' && data.error.trim()) {
    const code = typeof data.code === 'number' ? data.code : null;
    if (code === -904) {
      return `${data.error.trim()} If this persists, regenerate the letter PDF and mail again.`;
    }
    return data.error.trim();
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  const msg = (error as Error)?.message || '';
  if (/non-2xx/i.test(msg)) {
    return 'Mail edge function rejected the request — confirm EDGE_ADMIN_EMAILS includes your login and MAIL_API_ID/MAIL_API_KEY are set on the deployed mailer function.';
  }
  return msg || 'Mail request failed';
}

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
    return coerceStatus(data as Record<string, unknown> | null, parseMailEdgeError(error, data as Record<string, unknown> | null));
  }
  return coerceStatus(data as Record<string, unknown> | null);
}

/** Live LetterStream preauth quotes per mail class for a specific letter PDF. */
export async function quoteMailOptionsViaProvider(args: {
  letterId: string;
  pdfBlobRef: string;
  to: MailAddress;
  from: MailAddress;
  mailTypes?: Array<'firstclass' | 'certified' | 'certnoerr'>;
}): Promise<{ ok: boolean; quotes: MailQuoteOption[]; error?: string }> {
  if (!isFeatureEnabled('letterMailing')) {
    throw new Error('Letter mailing is disabled (Feature Flags).');
  }
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured (missing env).');
  }

  const { data, error } = await supabase.functions.invoke('mailer', {
    body: {
      op: 'quote',
      letterId: args.letterId,
      pdfBlobRef: args.pdfBlobRef,
      to: args.to,
      from: args.from,
      mailTypes: args.mailTypes ?? ['firstclass', 'certified', 'certnoerr'],
      options: { color: true, doubleSided: true, coverSheet: true },
    },
  });

  if (error) {
    return { ok: false, quotes: [], error: parseMailEdgeError(error, data as Record<string, unknown> | null) };
  }
  const raw = data as Record<string, unknown> | null;
  if (!raw?.ok) {
    return { ok: false, quotes: [], error: parseMailEdgeError(null, raw ?? undefined) };
  }
  const quotes = Array.isArray(raw.quotes)
    ? (raw.quotes as Array<Record<string, unknown>>).map((q) => ({
        mailType: String(q.mailType || 'firstclass') as MailQuoteOption['mailType'],
        costUsd: typeof q.costUsd === 'number' && Number.isFinite(q.costUsd) ? q.costUsd : null,
        code: typeof q.code === 'number' ? q.code : undefined,
        message: typeof q.message === 'string' ? q.message : undefined,
      }))
    : [];
  return { ok: true, quotes };
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

  if (error) throw new Error(parseMailEdgeError(error, data as Record<string, unknown> | null));
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

  if (error) throw new Error(parseMailEdgeError(error, data as Record<string, unknown> | null));
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
