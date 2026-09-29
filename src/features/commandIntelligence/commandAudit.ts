import { loadJson, saveJson } from '../../data/localJsonStore';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';
import { newId } from '../../utils/ids';

export type CommandAuditEntry = {
  id: string;
  at: string;
  action: string;
  partnerId?: string;
  summary: string;
  sent: boolean;
};

const KEY = 'finely.command_intelligence_audit.v1';

export function listCommandAudit(): CommandAuditEntry[] {
  return loadJson<CommandAuditEntry[]>(KEY, [], 1);
}

export async function recordCommandAudit(entry: Omit<CommandAuditEntry, 'id' | 'at'> & { id?: string }): Promise<CommandAuditEntry> {
  const row: CommandAuditEntry = {
    id: entry.id || newId('cmd'),
    at: new Date().toISOString(),
    action: entry.action,
    partnerId: entry.partnerId,
    summary: entry.summary.slice(0, 280),
    sent: entry.sent,
  };
  const next = [row, ...listCommandAudit()].slice(0, 40);
  saveJson(KEY, next, 1);
  if (isSupabaseConfigured) {
    try {
      await supabase.from('audit_events').insert({
        id: row.id,
        partner_id: row.partnerId || null,
        actor_type: 'staff',
        action: row.action,
        entity_type: 'command_intelligence',
        entity_id: row.id,
        meta: { summary: row.summary, sent: row.sent },
      });
    } catch {
      // RLS may refuse the browser insert. The send function writes with the service role.
    }
  }
  return row;
}
