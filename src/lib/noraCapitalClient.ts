import { isSupabaseConfigured, supabase } from './supabaseClient';
import { isFeatureEnabled, getNoraCapitalSettings } from '../data/settingsRepo';

export async function noraPing(args?: { idempotencyKey?: string }) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  // Controlled by integration status. Server enforces admin allowlist + rate limits.
  const nora = getNoraCapitalSettings();
  if (nora.status === 'not_configured') throw new Error('Nora Capital is not configured.');
  const { data, error } = await supabase.functions.invoke('nora-capital', {
    body: { action: 'ping', idempotencyKey: args?.idempotencyKey ?? undefined },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Ping failed.');
  return data as { ok: true; status: number; body: string };
}

export async function noraRequest(args: {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  idempotencyKey?: string;
}) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
  const nora = getNoraCapitalSettings();
  if (nora.status === 'not_configured') throw new Error('Nora Capital is not configured.');

  const { data, error } = await supabase.functions.invoke('nora-capital', {
    body: {
      action: 'request',
      path: args.path,
      method: args.method ?? 'POST',
      query: args.query ?? undefined,
      body: args.body ?? undefined,
      idempotencyKey: args.idempotencyKey ?? undefined,
    },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok) throw new Error(data?.error || 'Request failed.');
  return data as { ok: true; status: number; contentType: string; body: string };
}

