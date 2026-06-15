/**
 * Sync Twilio inbound events from admin-events KV into local phone thread store.
 */

import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  appendPhoneMessage,
  logPhoneCall,
  upsertPhoneThread,
} from '../data/phoneThreadsRepo';

type EdgeEvent = {
  id: string;
  at: string;
  namespace: string;
  event: string;
  meta?: {
    sid?: string;
    from?: string;
    to?: string;
    body?: string;
    status?: string;
    transcription?: string | null;
    recordingUrl?: string | null;
  };
};

const SYNC_KEY = 'finely.phone.inbox.sync.v1';

function loadSyncedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSyncedIds(ids: Set<string>) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {
    // ignore
  }
}

export async function syncPhoneInboxFromEdge(): Promise<{ imported: number; error?: string }> {
  if (!isSupabaseConfigured) {
    return { imported: 0, error: 'Supabase not configured — use Simulate inbound in Phone Hub.' };
  }
  try {
    const { data, error } = await supabase.functions.invoke('admin-events', {
      body: { namespace: 'twilio-webhook', limit: 100 },
    });
    if (error) throw new Error(error.message);
    if (!data?.ok) throw new Error(data?.error || 'Failed to load phone events.');

    const events = (data.events ?? []) as EdgeEvent[];
    const synced = loadSyncedIds();
    let imported = 0;

    for (const ev of events) {
      if (synced.has(ev.id)) continue;
      const meta = ev.meta ?? {};

      if (ev.event === 'sms_inbound' && meta.from && meta.body) {
        const thread = upsertPhoneThread({
          phoneE164: meta.from,
          channel: 'sms',
        });
        appendPhoneMessage({ threadId: thread.id, direction: 'inbound', body: meta.body });
        synced.add(ev.id);
        imported += 1;
        continue;
      }

      if (ev.event === 'call_missed' && meta.from) {
        logPhoneCall({
          direction: 'inbound',
          from: meta.from,
          to: meta.to ?? meta.from,
          status: 'missed',
          transcription: meta.transcription ?? undefined,
        });
        synced.add(ev.id);
        imported += 1;
        continue;
      }

      if (ev.event === 'voicemail' && meta.from) {
        logPhoneCall({
          direction: 'inbound',
          from: meta.from,
          to: meta.to ?? meta.from,
          status: 'voicemail',
          transcription: meta.transcription ?? undefined,
        });
        const thread = upsertPhoneThread({ phoneE164: meta.from, channel: 'voice' });
        if (meta.transcription) {
          appendPhoneMessage({
            threadId: thread.id,
            direction: 'inbound',
            body: `[Voicemail] ${meta.transcription}`,
          });
        }
        synced.add(ev.id);
        imported += 1;
      }
    }

    saveSyncedIds(synced);
    return { imported };
  } catch (e: unknown) {
    return { imported: 0, error: (e as Error)?.message ?? 'Sync failed.' };
  }
}

/** Dev/demo — simulate inbound without Twilio. */
export function simulateInboundSms(from: string, body: string) {
  const thread = upsertPhoneThread({ phoneE164: from, channel: 'sms' });
  appendPhoneMessage({ threadId: thread.id, direction: 'inbound', body });
  return thread;
}

export function simulateInboundVoicemail(from: string, transcription: string) {
  logPhoneCall({
    direction: 'inbound',
    from,
    to: from,
    status: 'voicemail',
    transcription,
  });
  const thread = upsertPhoneThread({ phoneE164: from, channel: 'voice' });
  appendPhoneMessage({ threadId: thread.id, direction: 'inbound', body: `[Voicemail] ${transcription}` });
  return thread;
}
