import type { SovereignStore, SovereignMission, SovereignNotification, SovereignConversationThread } from './types';
import { defaultGeoCells, defaultLeadCaptureRoutes, buildDefaultMediaPlans } from './marketingIntelligenceVault';

const KEY = 'finelycred.sovereignGrowthCommandStack.v1';

function nowIso() {
  return new Date().toISOString();
}

function fallbackStore(): SovereignStore {
  return {
    missions: [],
    notifications: [],
    threads: [],
    leadRoutes: defaultLeadCaptureRoutes,
    mediaPlans: buildDefaultMediaPlans(),
    geoCells: defaultGeoCells,
  };
}

function safeParse(raw: string | null): SovereignStore | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SovereignStore>;
    return {
      ...fallbackStore(),
      ...parsed,
      missions: Array.isArray(parsed.missions) ? parsed.missions : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
      leadRoutes: Array.isArray(parsed.leadRoutes) ? parsed.leadRoutes : defaultLeadCaptureRoutes,
      mediaPlans: Array.isArray(parsed.mediaPlans) ? parsed.mediaPlans : buildDefaultMediaPlans(),
      geoCells: Array.isArray(parsed.geoCells) ? parsed.geoCells : defaultGeoCells,
    };
  } catch {
    return null;
  }
}

function notifyStore() {
  try {
    window.dispatchEvent(new CustomEvent('finely:sovereign-growth-store'));
  } catch {
    // no-op for server/tests
  }
}

export function loadSovereignStore(): SovereignStore {
  if (typeof window === 'undefined') return fallbackStore();
  return safeParse(window.localStorage.getItem(KEY)) ?? fallbackStore();
}

export function saveSovereignStore(store: SovereignStore): SovereignStore {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(KEY, JSON.stringify(store));
    notifyStore();
  }
  return store;
}

export function resetSovereignStore(): SovereignStore {
  const store = fallbackStore();
  return saveSovereignStore(store);
}

export function listSovereignMissions(): SovereignMission[] {
  return loadSovereignStore().missions.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function upsertSovereignMission(mission: SovereignMission): SovereignMission {
  const store = loadSovereignStore();
  const idx = store.missions.findIndex((m) => m.id === mission.id);
  const next = { ...mission, updatedAt: nowIso() };
  if (idx >= 0) store.missions[idx] = next;
  else store.missions.unshift(next);
  saveSovereignStore(store);
  return next;
}

export function addSovereignNotification(notification: SovereignNotification): SovereignNotification {
  const store = loadSovereignStore();
  store.notifications.unshift(notification);
  store.notifications = store.notifications.slice(0, 300);
  saveSovereignStore(store);
  return notification;
}

export function markSovereignNotificationRead(id: string): void {
  const store = loadSovereignStore();
  store.notifications = store.notifications.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? nowIso() } : n));
  saveSovereignStore(store);
}

export function listSovereignNotifications(): SovereignNotification[] {
  return loadSovereignStore().notifications.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertSovereignThread(thread: SovereignConversationThread): SovereignConversationThread {
  const store = loadSovereignStore();
  const idx = store.threads.findIndex((t) => t.id === thread.id);
  const next = { ...thread, updatedAt: nowIso() };
  if (idx >= 0) store.threads[idx] = next;
  else store.threads.unshift(next);
  saveSovereignStore(store);
  return next;
}

export function listSovereignThreads(): SovereignConversationThread[] {
  return loadSovereignStore().threads.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function buildSovereignSnapshot() {
  const store = loadSovereignStore();
  const unread = store.notifications.filter((n) => !n.readAt).length;
  const blockers = [
    ...store.geoCells.flatMap((g) => g.blockers),
    ...store.missions.flatMap((m) => m.blockers),
  ].filter(Boolean);
  const avgGeo = store.geoCells.length ? Math.round(store.geoCells.reduce((sum, g) => sum + g.readinessScore, 0) / store.geoCells.length) : 0;
  const routeReadiness = store.leadRoutes.length ? Math.round(store.leadRoutes.reduce((sum, r) => sum + r.intelligenceScore, 0) / store.leadRoutes.length) : 0;
  const intelligenceScore = Math.round((avgGeo * 0.35) + (routeReadiness * 0.35) + (Math.min(100, store.mediaPlans.length * 4) * 0.2) + (Math.max(0, 100 - blockers.length * 4) * 0.1));
  return {
    generatedAt: nowIso(),
    intelligenceScore,
    departments: 15,
    agents: 22,
    openMissions: store.missions.filter((m) => m.status !== 'complete').length,
    notifications: unread,
    leadRoutes: store.leadRoutes.length,
    mediaPlans: store.mediaPlans.length,
    geoCells: store.geoCells.length,
    health: blockers.length > 8 ? 'blocked' : intelligenceScore >= 85 ? 'excellent' : intelligenceScore >= 70 ? 'good' : 'needs_setup',
    missingSetup: blockers.slice(0, 8),
  } as const;
}
