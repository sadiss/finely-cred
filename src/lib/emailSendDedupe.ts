/**
 * Lightweight dedupe for transactional emails — prevents duplicate sends when
 * the same action fires twice (double-click, remount, batch + lifecycle, etc.).
 */
import { loadJson, saveJson } from '../data/localJsonStore';

const KEY = 'finely.email_send_dedupe.v1';

type Row = { key: string; sentAtMs: number };

function loadRows(): Row[] {
  return loadJson<{ rows: Row[] }>(KEY, { rows: [] }, 1).rows;
}

function saveRows(rows: Row[]) {
  saveJson(KEY, { rows: rows.slice(-3000) }, 1);
}

export function emailDedupeKey(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(':').toLowerCase();
}

/** True if this dedupe key already fired within windowHours. */
export function isEmailRecentlySent(key: string, windowHours = 24): boolean {
  const normalized = key.toLowerCase();
  const cutoff = Date.now() - windowHours * 3_600_000;
  return loadRows().some((r) => r.key === normalized && r.sentAtMs >= cutoff);
}

export function markEmailRecentlySent(key: string) {
  const rows = loadRows();
  rows.push({ key: key.toLowerCase(), sentAtMs: Date.now() });
  saveRows(rows);
}
