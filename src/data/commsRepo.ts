import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { CommsSendLog, CommsTemplate } from '../domain/comms';

const KEY = 'finely.comms.v1';

type Store = { templates: CommsTemplate[]; sends: CommsSendLog[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { templates: [], sends: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listCommsTemplates(): CommsTemplate[] {
  return loadStore().templates.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getCommsTemplate(id: string): CommsTemplate | null {
  return loadStore().templates.find((t) => t.id === id) ?? null;
}

export function upsertCommsTemplate(tpl: CommsTemplate): CommsTemplate {
  const store = loadStore();
  const idx = store.templates.findIndex((t) => t.id === tpl.id);
  const next = { ...tpl, updatedAt: nowIso() };
  if (idx >= 0) store.templates[idx] = next;
  else store.templates.push(next);
  saveStore(store);
  return next;
}

export function createCommsTemplate(args: Omit<CommsTemplate, 'id' | 'createdAt' | 'updatedAt'>): CommsTemplate {
  const now = nowIso();
  return upsertCommsTemplate({ id: newId('tpl'), createdAt: now, updatedAt: now, ...args });
}

export function setCommsTemplateEnabled(id: string, enabled: boolean): CommsTemplate | null {
  const cur = getCommsTemplate(id);
  if (!cur) return null;
  return upsertCommsTemplate({ ...cur, enabled });
}

export function deleteCommsTemplate(id: string): boolean {
  const store = loadStore();
  const before = store.templates.length;
  store.templates = store.templates.filter((t) => t.id !== id);
  const changed = store.templates.length !== before;
  if (changed) saveStore(store);
  return changed;
}

export function listCommsSends(limit = 120): CommsSendLog[] {
  return loadStore().sends.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, Math.max(1, limit));
}

export function addCommsSend(log: CommsSendLog): CommsSendLog {
  const store = loadStore();
  store.sends.push(log);
  store.sends = store.sends.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 1200);
  saveStore(store);
  return log;
}

export function hasRecentCommsSend(args: { templateId: string; partnerId: string; withinHours: number }): boolean {
  const t = (args.templateId || '').trim();
  const p = (args.partnerId || '').trim();
  const within = Math.max(0, Number(args.withinHours) || 0);
  if (!t || !p || !within) return false;
  const cutoff = Date.now() - within * 60 * 60 * 1000;
  const store = loadStore();
  return (
    store.sends.find((s) => {
      if (s.templateId !== t) return false;
      if (s.partnerId !== p) return false;
      if (s.status !== 'sent') return false;
      const ts = Date.parse(s.createdAt);
      return Number.isFinite(ts) && ts >= cutoff;
    }) != null
  );
}

