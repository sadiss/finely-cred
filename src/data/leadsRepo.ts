import type { LeadCapture } from '../domain/leads';
import { nowIso } from '../domain/leads';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';

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

export function createLeadCapture(args: Omit<LeadCapture, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): LeadCapture {
  const store = loadStore();
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
  };
  store.leads.push(lead);
  saveStore(store);
  return lead;
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
export async function submitLeadCapture(args: Omit<LeadCapture, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<LeadSubmitResult> {
  const lead = createLeadCapture({
    ...args,
    fullName: sanitize(args.fullName),
    email: sanitize(args.email),
    phone: sanitize(args.phone),
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
    });
    if (error) return { lead, remote: 'failed', remoteError: error.message };
    return { lead, remote: 'ok' };
  } catch (e: any) {
    return { lead, remote: 'failed', remoteError: e?.message || 'Unknown error' };
  }
}

