import type { LeadCapture } from '../domain/leads';
import { nowIso } from '../domain/leads';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { getLeadAttribution } from '../lib/leadAttribution';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';
import { autoEnrollCrmRecordInDefaultSequence } from '../features/crm/sequences/autoEnrollCrmRecord';
import { runLeadCapturePipeline } from '../lib/leadCapturePipeline';
import { addLeadTags, setLeadStage } from './leadOpsRepo';
import { syncLeadToCrmProspect } from '../lib/crmLeadSync';

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

export function findLeadCapturesByEmail(email: string): LeadCapture[] {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return [];
  return loadStore().leads.filter((l) => (l.email || '').trim().toLowerCase() === normalized);
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
    utmContent: args.utmContent?.trim() || attr?.utmContent?.trim() || undefined,
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

function findUpgradableColdHaitianLead(email: string): LeadCapture | null {
  const matches = findLeadCapturesByEmail(email);
  return (
    matches.find(
      (l) =>
        l.source === 'haitian_csv_import' &&
        !l.consentToContact &&
        !l.consentEmailMarketing,
    ) ?? null
  );
}

function leadCaptureRow(lead: LeadCapture) {
  return {
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
  };
}

/** Upgrade a cold Haitian CSV row to a consented hot capture — same lead id, no duplicate. */
function upgradeColdHaitianLeadToHot(
  existing: LeadCapture,
  args: Omit<LeadCapture, 'id' | 'createdAt'>,
): LeadCapture {
  const store = loadStore();
  const idx = store.leads.findIndex((l) => l.id === existing.id);
  if (idx < 0) throw new Error('Lead not found');

  const lead: LeadCapture = {
    ...existing,
    fullName: sanitize(args.fullName) || existing.fullName,
    email: sanitize(args.email),
    phone: sanitize(args.phone) || existing.phone,
    source: args.source,
    offer: args.offer,
    interest: args.interest,
    consentToContact: args.consentToContact,
    consentEmailMarketing: Boolean((args.consentEmailMarketing ?? false) && sanitize(args.email)),
    consentSmsMarketing: Boolean((args.consentSmsMarketing ?? false) && sanitize(args.phone)),
    referralCode: args.referralCode?.trim() || existing.referralCode,
    promoterRole: args.promoterRole?.trim() || existing.promoterRole,
    promoType: args.promoType?.trim() || existing.promoType,
    promoAsset: args.promoAsset?.trim() || existing.promoAsset,
    utmSource: args.utmSource?.trim() || existing.utmSource,
    utmMedium: args.utmMedium?.trim() || existing.utmMedium,
    utmCampaign: args.utmCampaign?.trim() || existing.utmCampaign,
    utmContent: args.utmContent?.trim() || existing.utmContent,
    funnelPath: args.funnelPath?.trim() || existing.funnelPath,
    funnelId: args.funnelId?.trim() || existing.funnelId,
    goal: args.goal ?? existing.goal,
    giveawayStack: args.giveawayStack?.filter(Boolean).slice(0, 24) ?? existing.giveawayStack,
  };
  store.leads[idx] = lead;
  saveStore(store);

  addLeadTags(lead.id, ['hot-opt-in', 'temperature:warm', 'source:free_kreyol_opt_in']);
  setLeadStage(lead.id, 'contacted');

  if (lead.consentToContact) {
    try {
      autoEnrollCrmRecordInDefaultSequence(`crm_lead_${lead.id}`, {
        noteLabel: '[Sequence] Auto-enrolled on Haitian cold→hot opt-in',
      });
    } catch {
      // non-blocking
    }
  }

  try {
    syncLeadToCrmProspect(lead, lead.funnelId);
  } catch {
    // non-blocking
  }

  return lead;
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
    /** When true, skip nurture / welcome / trial hooks (cold CRM import). */
    skipPipeline?: boolean;
  },
): Promise<LeadSubmitResult> {
  const { guideId, guideTitle, funnelId, skipPipeline, ...leadArgs } = args;
  const email = sanitize(leadArgs.email);
  const hasConsent = Boolean(leadArgs.consentToContact || leadArgs.consentEmailMarketing);
  const coldUpgrade =
    hasConsent && !skipPipeline ? findUpgradableColdHaitianLead(email) : null;

  const lead = coldUpgrade
    ? upgradeColdHaitianLeadToHot(coldUpgrade, {
        ...leadArgs,
        fullName: sanitize(leadArgs.fullName),
        email,
        phone: sanitize(leadArgs.phone),
      })
    : createLeadCapture({
        ...leadArgs,
        fullName: sanitize(leadArgs.fullName),
        email,
        phone: sanitize(leadArgs.phone),
      });

  if (!skipPipeline) {
    void runLeadCapturePipeline({ lead, guideId, guideTitle, funnelId }).catch(() => {
      // non-blocking
    });
  }

  if (!isSupabaseConfigured) return { lead, remote: 'not_configured' };

  try {
    const row = leadCaptureRow(lead);
    const { error } = coldUpgrade
      ? await supabase.from('lead_captures').upsert(row, { onConflict: 'id' })
      : await supabase.from('lead_captures').insert(row);
    if (error) return { lead, remote: 'failed', remoteError: error.message };
    return { lead, remote: 'ok' };
  } catch (e: any) {
    return { lead, remote: 'failed', remoteError: e?.message || 'Unknown error' };
  }
}

export type ColdLeadImportArgs = Omit<LeadCapture, 'id' | 'createdAt'> & {
  tags?: string[];
  existingLeadId?: string;
};

/**
 * Cold CRM import — stores locally (+ Supabase when configured) without nurture or welcome email.
 * Idempotent: pass existingLeadId to refresh metadata on re-import.
 */
export async function importColdLeadCapture(args: ColdLeadImportArgs): Promise<LeadSubmitResult> {
  const store = loadStore();
  const email = sanitize(args.email);
  const existingIdx = args.existingLeadId
    ? store.leads.findIndex((l) => l.id === args.existingLeadId)
    : store.leads.findIndex((l) => (l.email || '').trim().toLowerCase() === email.toLowerCase());

  let lead: LeadCapture;
  if (existingIdx >= 0) {
    const prev = store.leads[existingIdx]!;
    lead = {
      ...prev,
      fullName: sanitize(args.fullName) || prev.fullName,
      email,
      phone: sanitize(args.phone) || prev.phone,
      source: args.source,
      offer: args.offer,
      interest: args.interest,
      consentToContact: false,
      consentEmailMarketing: false,
      consentSmsMarketing: false,
      funnelPath: args.funnelPath,
      funnelId: args.funnelId,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      utmContent: args.utmContent,
      promoType: args.promoType ?? prev.promoType,
      promoAsset: args.promoAsset ?? prev.promoAsset,
    };
    store.leads[existingIdx] = lead;
    saveStore(store);
  } else {
    const { tags: _tags, existingLeadId: _existing, ...captureArgs } = args;
    lead = createLeadCapture({
      ...captureArgs,
      fullName: sanitize(args.fullName),
      email,
      phone: sanitize(args.phone),
      consentToContact: false,
      consentEmailMarketing: false,
      consentSmsMarketing: false,
    });
  }

  setLeadStage(lead.id, 'new');
  if (args.tags?.length) addLeadTags(lead.id, args.tags);

  try {
    syncLeadToCrmProspect(lead, args.funnelId);
  } catch {
    // non-blocking
  }

  if (!isSupabaseConfigured) return { lead, remote: 'not_configured' };

  try {
    const row = {
      id: lead.id,
      created_at: lead.createdAt,
      source: lead.source,
      offer: lead.offer,
      interest: lead.interest ?? null,
      full_name: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      consent_to_contact: false,
      referral_code: lead.referralCode ?? null,
      promoter_role: lead.promoterRole ?? null,
      promo_type: lead.promoType ?? null,
      promo_asset: lead.promoAsset ?? null,
      utm_source: lead.utmSource ?? null,
      utm_medium: lead.utmMedium ?? null,
      utm_campaign: lead.utmCampaign ?? null,
      funnel_path: lead.funnelPath ?? null,
    };
    const { error } = existingIdx >= 0
      ? await supabase.from('lead_captures').upsert(row, { onConflict: 'id' })
      : await supabase.from('lead_captures').insert(row);
    if (error) return { lead, remote: 'failed', remoteError: error.message };
    return { lead, remote: 'ok' };
  } catch (e: unknown) {
    return { lead, remote: 'failed', remoteError: (e as Error)?.message || 'Unknown error' };
  }
}

