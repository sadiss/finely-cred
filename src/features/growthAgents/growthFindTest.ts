import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { getFeatureFlags } from '../../data/settingsRepo';
import { loadJson, saveJson } from '../../data/localJsonStore';

const SERPER_OK_KEY = 'finely.growth_serper_ok.v1';

export function isSerperSearchMarkedOk(): boolean {
  return Boolean(loadJson<{ ok?: boolean }>(SERPER_OK_KEY, {}, 1).ok);
}

export function markSerperSearchOk(ok: boolean) {
  saveJson(SERPER_OK_KEY, { ok, at: new Date().toISOString() }, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export type GrowthFindTestResult = {
  ok: boolean;
  resultCount: number;
  message: string;
  error?: string;
};

export async function runGrowthFindTestSearch(): Promise<GrowthFindTestResult> {
  if (!getFeatureFlags().leadIntel) {
    return { ok: false, resultCount: 0, message: 'Turn on leadIntel in Admin Settings → Features.', error: 'leadIntel off' };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, resultCount: 0, message: 'Connect Supabase in settings first.', error: 'no supabase' };
  }
  const { data, error } = await supabase.functions.invoke('lead-intel', {
    body: {
      target: 'clients',
      query: 'credit repair help small business owner',
      location: 'United States',
      limit: 3,
      enrich: false,
      searchMode: 'web',
      country: 'us',
    },
  });
  if (error) {
    markSerperSearchOk(false);
    return { ok: false, resultCount: 0, message: error.message, error: error.message };
  }
  if (!data?.ok) {
    const msg = String(data?.error || 'Search failed');
    const friendly =
      /SERPER/i.test(msg) || /missing/i.test(msg)
        ? 'Search key missing on the server. Add SERPER_API_KEY on lead-intel, redeploy, then retry.'
        : msg;
    markSerperSearchOk(false);
    return { ok: false, resultCount: 0, message: friendly, error: msg };
  }
  const count = Array.isArray(data.results) ? data.results.length : 0;
  markSerperSearchOk(true);
  return {
    ok: true,
    resultCount: count,
    message: count > 0 ? `Search works — ${count} sample result(s).` : 'Search connected but returned 0 rows (try a different city on Find).',
  };
}
