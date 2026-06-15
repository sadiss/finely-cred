import type { LeadCapture } from '../domain/leads';
import { nowIso } from '../domain/leads';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { getLeadAttribution } from '../lib/leadAttribution';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';
import { autoEnrollCrmRecordInDefaultSequence } from '../features/crm/sequences/autoEnrollCrmRecord';
import { runLeadCapturePipeline } from '../lib/leadCapturePipeline';

const KEY = 'finely.leads.v1';

type Store = {
  leads: LeadCapture[];
};

function loadStore(): Store {
  return loadJson<Store>(KEY, { leads: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listLeadCaptures(): LeadCapture[] {
  return loadStore().leads.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getLeadCaptureById(leadId: string): LeadCapture | null {
  return loadStore().leads.find((l) => l.id === leadId) ?? null;
}

export function createLeadCapture(args: Omit<LeadCapture, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): LeadCapture {
  const store = loadStore();
  const attr = getLeadAttribution();
  const lead: LeadCapture = {
    id: args.id ?? newId('lead'),
    createdAt: args.createdAt ?? nowIso(),
    source: args.source,
    offer: args.offer,
    interest: args.interest,
    fullName: args.fullName,
    email: args.email,
    phone: args.phone,
    consentToContact: args.consentToContact,
    consentEmailMarketing: Boolean((args.consentEmailMarketing ?? false) && String(args.email || '').trim()),
    consentSmsMarketing: Boolean((args.consentSmsMarketing ?? false) && String(args.phone || '').trim()),
    referralCode: args.referralCode?.trim() || attr?.referralCode?.trim() || undefined,
    promoterRole: args.promoterRole?.trim() || attr?.promoterRole?.trim() || undefined,
    promoType: args.promoType?.trim() || attr?.promoType?.trim() || undefined,
    promoAsset: args.promoAsset?.trim() || attr?.promoAsset?.trim() || undefined,
    utmSource: args.utmSource?.trim() || attr?.utmSource?.trim() || undefined,
    utmMedium: args.utmMedium?.trim() || attr?.utmMedium?.trim() || undefined,
    utmCampaign: args.utmCampaign?.trim() || attr?.utmCampaign?.trim() || undefined,
    funnelPath: args.funnelPath?.trim() || undefined,
    funnelId: args.funnelId?.trim() || undefined,
    goal: args.goal,
    giveawayStack: args.giveawayStack?.filter(Boolean).slice(0, 24),
  };
  store.leads.push(lead);
  saveStore(store);
  if (lead.consentToContact) {
    try {
      autoEnrollCrmRecordInDefaultSequence(`crm_lead_${lead.id}`, { noteLabel: `[Sequence] Auto-enrolled on lead capture` });
    } catch {
      // non-blocking
    }
  }
  return lead;
}

export function patchLeadCapture(
  leadId: string,
  patch: Partial<Pick<LeadCapture, 'consentToContact' | 'consentEmailMarketing' | 'consentSmsMarketing' | 'fullName' | 'email' | 'phone' | 'interest'>>,
): LeadCapture | null {
  const store = loadStore();
  const idx = store.leads.findIndex((l) => l.id === leadId);
  if (idx < 0) return null;
  const prev = store.leads[idx];
  store.leads[idx] = { ...prev, ...patch };
  saveStore(store);
  return store.leads[idx];
}

export type LeadSubmitResult = {
  lead: LeadCapture;
  /** Whether the lead was also inserted into Supabase. */
  remote: 'ok' | 'failed' | 'not_configured';
  remoteError?: string;
};

function sanitize(s: string) {
  return (s || '').trim();
}

/**
 * "Real" submit:
 * - Always stores locally (so the UI can confirm success even offline)
 * - If Supabase is configured, attempts to insert into `lead_captures`
 */
export async function submitLeadCapture(
  args: Omit<LeadCapture, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
    /** Post-capture pipeline metadata */
    guideId?: string;
    guideTitle?: string;
    funnelId?: string;
  },
): Promise<LeadSubmitResult> {
  const { guideId, guideTitle, funnelId, ...leadArgs } = args;
  const lead = createLeadCapture({
    ...leadArgs,
    fullName: sanitize(leadArgs.fullName),
    email: sanitize(leadArgs.email),
    phone: sanitize(leadArgs.phone),
  });

  void runLeadCapturePipeline({ lead, guideId, guideTitle, funnelId }).catch(() => {
    // non-blocking
  });

  if (!isSupabaseConfigured) return { lead, remote: 'not_configured' };

  try {
    const { error } = await supabase.from('lead_captures').insert({
      id: lead.id,
      created_at: lead.createdAt,
      source: lead.source,
      offer: lead.offer,
      interest: lead.interest ?? null,
      full_name: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      consent_to_contact: lead.consentToContact,
      referral_code: lead.referralCode ?? null,
      promoter_role: lead.promoterRole ?? null,
      promo_type: lead.promoType ?? null,
      promo_asset: lead.promoAsset ?? null,
      utm_source: lead.utmSource ?? null,
      utm_medium: lead.utmMedium ?? null,
      utm_campaign: lead.utmCampaign ?? null,
      funnel_path: lead.funnelPath ?? null,
    });
    if (error) return { lead, remote: 'failed', remoteError: error.message };
    return { lead, remote: 'ok' };
  } catch (e: any) {
    return { lead, remote: 'failed', remoteError: e?.message || 'Unknown error' };
  }
}

