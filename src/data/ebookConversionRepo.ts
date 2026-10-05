import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { listLeadCaptures } from './leadsRepo';
import {
  mergeEbookConversionLeads,
  resolveEbookFunnelId,
  toEbookConversionLead,
  type EbookConversionLead,
} from '../lib/ebookConversionMetrics';

export type EbookConversionSource = 'local' | 'supabase' | 'merged' | 'unavailable';

export type EbookConversionFetchResult = {
  leads: EbookConversionLead[];
  source: EbookConversionSource;
  supabaseConfigured: boolean;
  remoteCount: number;
  localCount: number;
  error?: string;
};

type RemoteLeadRow = {
  id?: string;
  created_at?: string;
  source?: string;
  offer?: string;
  phone?: string | null;
  email?: string | null;
  funnel_id?: string | null;
  funnel_path?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  referral_code?: string | null;
};

function remoteToLead(row: RemoteLeadRow): EbookConversionLead | null {
  if (!row.id || !row.created_at) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    funnelId: resolveEbookFunnelId({
      funnelId: row.funnel_id,
      funnelPath: row.funnel_path,
      offer: row.offer,
    }),
    funnelPath: row.funnel_path ?? undefined,
    offer: row.offer ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    utmSource: row.utm_source ?? undefined,
    utmMedium: row.utm_medium ?? undefined,
    utmCampaign: row.utm_campaign ?? undefined,
    utmContent: row.utm_content ?? undefined,
    referralCode: row.referral_code ?? undefined,
    source: row.source ?? undefined,
  };
}

export async function fetchEbookConversionLeads(): Promise<EbookConversionFetchResult> {
  const local = listLeadCaptures().map(toEbookConversionLead);
  if (!isSupabaseConfigured) {
    return {
      leads: local,
      source: 'local',
      supabaseConfigured: false,
      remoteCount: 0,
      localCount: local.length,
    };
  }

  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('lead_captures')
      .select(
        'id, created_at, source, offer, phone, email, funnel_id, funnel_path, utm_source, utm_medium, utm_campaign, utm_content, referral_code',
      )
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      return {
        leads: local,
        source: local.length ? 'local' : 'unavailable',
        supabaseConfigured: true,
        remoteCount: 0,
        localCount: local.length,
        error: error.message,
      };
    }

    const remote = ((data ?? []) as RemoteLeadRow[]).map(remoteToLead).filter((x): x is EbookConversionLead => Boolean(x));
    const merged = mergeEbookConversionLeads(local, remote);
    return {
      leads: merged,
      source: remote.length && local.length ? 'merged' : remote.length ? 'supabase' : 'local',
      supabaseConfigured: true,
      remoteCount: remote.length,
      localCount: local.length,
    };
  } catch (err: unknown) {
    return {
      leads: local,
      source: local.length ? 'local' : 'unavailable',
      supabaseConfigured: true,
      remoteCount: 0,
      localCount: local.length,
      error: (err as Error)?.message || 'Unknown Supabase error',
    };
  }
}
