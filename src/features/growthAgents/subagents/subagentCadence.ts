/**
 * Shared once-per-day / once-per-week cadence guard for growth-agent
 * reasoning sub-agents (Phase 5b). Keeps each sub-agent idempotent-ish — safe
 * to call repeatedly from `agent_team_tick` without duplicate spam — using the
 * same local-day/local-week comparison as `finelyAutomationOrchestrator.ts`'s
 * `jobRanToday`/`jobRanThisWeek`, but scoped per-entity (e.g. per affiliate id,
 * per CRM record id) instead of per whole-job.
 */
import { loadJson, saveJson } from '../../../data/localJsonStore';

type CadenceLog = Record<string, string>;

function loadLog(storeKey: string): CadenceLog {
  return loadJson<CadenceLog>(storeKey, {}, 1);
}

function saveLog(storeKey: string, log: CadenceLog) {
  // Cap store size so a long-lived entity list (e.g. many affiliates) can't grow unbounded.
  const entries = Object.entries(log);
  const trimmed = entries.length > 500 ? Object.fromEntries(entries.slice(-500)) : log;
  saveJson(storeKey, trimmed, 1);
}

function isSameLocalDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function weekStart(n: Date): number {
  const copy = new Date(n);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function isSameLocalWeek(iso: string, now: Date): boolean {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return false;
  return weekStart(d) === weekStart(now);
}

/** True if `entityKey` already ran today in the given cadence store. */
export function ranToday(storeKey: string, entityKey: string, now = new Date()): boolean {
  const at = loadLog(storeKey)[entityKey];
  return Boolean(at && isSameLocalDay(at, now));
}

/** True if `entityKey` already ran this local week in the given cadence store. */
export function ranThisWeek(storeKey: string, entityKey: string, now = new Date()): boolean {
  const at = loadLog(storeKey)[entityKey];
  return Boolean(at && isSameLocalWeek(at, now));
}

/** Mark `entityKey` as run now — call once a review cycle (real read + directive) has completed. */
export function markRan(storeKey: string, entityKey: string, at = new Date().toISOString()) {
  const log = loadLog(storeKey);
  log[entityKey] = at;
  saveLog(storeKey, log);
}
