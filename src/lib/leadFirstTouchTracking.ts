/**
 * Best-effort write of the `lead_captures.first_touch_at` / `first_touch_channel`
 * columns (added by the N1 migration) — shared by both the client-side instant-ack
 * senders (`funnelEmail.ts`, `instantLeadAck.ts`) so the first successful send (email
 * or SMS, whichever lands first) sets first-touch exactly once. Never throws and
 * never blocks the caller — this is a tracking write, not part of the send itself.
 */
import { isSupabaseConfigured, supabase } from './supabaseClient';

export async function markLeadFirstTouch(leadId: string, channel: 'email' | 'sms'): Promise<void> {
  const id = (leadId || '').trim();
  if (!id || !isSupabaseConfigured) return;
  try {
    await supabase
      .from('lead_captures')
      .update({ first_touch_at: new Date().toISOString(), first_touch_channel: channel })
      .eq('id', id)
      .is('first_touch_at', null);
  } catch {
    // non-blocking — tracking-only write
  }
}
