import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { loadJson, saveJson } from '../../data/localJsonStore';

const WORKER_LAST_KEY = 'finely.growth_worker_last.v1';

export type GrowthWorkerTickPayload = {
  ok?: boolean;
  mode?: string;
  fn?: string;
  message?: string;
  processed?: number;
  at?: string;
  resultCount?: number;
  searchError?: string;
  jobId?: string;
  error?: string;
};

export type GrowthWorkerLastProbe = {
  mode: string;
  message: string;
  processed: number;
  ok: boolean;
  at: string;
};

export type GrowthWorkerTickResult = {
  ok: boolean;
  mode: string;
  message: string;
  processed: number;
  payload?: GrowthWorkerTickPayload;
  error?: string;
};

export function getLastGrowthWorkerProbe(): GrowthWorkerLastProbe | null {
  const row = loadJson<Partial<GrowthWorkerLastProbe>>(WORKER_LAST_KEY, {}, 1);
  if (!row.mode || !row.at) return null;
  return {
    mode: String(row.mode),
    message: String(row.message ?? ''),
    processed: Number(row.processed ?? 0),
    ok: Boolean(row.ok),
    at: String(row.at),
  };
}

function persistProbe(result: GrowthWorkerTickResult) {
  saveJson(
    WORKER_LAST_KEY,
    {
      mode: result.mode,
      message: result.message,
      processed: result.processed,
      ok: result.ok,
      at: new Date().toISOString(),
    },
    1,
  );
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export async function runGrowthWorkerTickTest(): Promise<GrowthWorkerTickResult> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      mode: 'unconfigured',
      message: 'Connect Supabase in settings before probing the worker.',
      processed: 0,
      error: 'no supabase',
    };
  }

  const { data, error } = await supabase.functions.invoke('lead-intel-worker-tick', {
    body: {},
  });

  if (error) {
    const fail: GrowthWorkerTickResult = {
      ok: false,
      mode: 'error',
      message: error.message,
      processed: 0,
      error: error.message,
    };
    persistProbe(fail);
    return fail;
  }

  const payload = (data ?? {}) as GrowthWorkerTickPayload;
  const mode = String(payload.mode ?? 'unknown');
  const message = String(payload.message ?? payload.error ?? 'No message from worker.');
  const processed = Number(payload.processed ?? 0);
  const ok = Boolean(payload.ok);

  const result: GrowthWorkerTickResult = {
    ok,
    mode,
    message,
    processed,
    payload,
    error: payload.error ? String(payload.error) : undefined,
  };
  persistProbe(result);
  return result;
}

export function workerModeLabel(mode: string | undefined): string {
  switch (mode) {
    case 'simulation':
      return 'Simulation (no counter writes)';
    case 'live':
      return 'Live worker';
    case 'live_attempt':
      return 'Live flag on — missing server creds';
    case 'unconfigured':
      return 'Supabase not connected';
    case 'error':
      return 'Probe failed';
    default:
      return mode ? `Mode: ${mode}` : 'Not probed yet';
  }
}

export function workerModeChipTone(mode: string | undefined): 'ok' | 'warn' | 'blocked' {
  if (mode === 'live') return 'ok';
  if (mode === 'simulation') return 'warn';
  return 'warn';
}
