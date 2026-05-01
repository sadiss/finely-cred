import type { ProgramApplication, ProgramApplicationKind, ProgramApplicationStatus } from '../domain/programApplications';
import { nowIso } from '../domain/programApplications';
import { newId } from '../utils/ids';
import { loadJson, saveJson } from './localJsonStore';

const KEY = 'finely.program_applications.v1';
const VERSION = 1;

type Store = { applications: ProgramApplication[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { applications: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

function norm(s: any) {
  return String(s ?? '').trim();
}

export function listProgramApplications(args?: { kind?: ProgramApplicationKind | 'all'; status?: ProgramApplicationStatus | 'all' }): ProgramApplication[] {
  const store = loadStore();
  const kind = (args?.kind ?? 'all') as any;
  const status = (args?.status ?? 'all') as any;
  const filtered = (store.applications ?? []).filter((a) => {
    if (kind !== 'all' && a.kind !== kind) return false;
    if (status !== 'all' && a.status !== status) return false;
    return true;
  });
  return filtered.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createProgramApplication(args: {
  kind: ProgramApplicationKind;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  roleTitle?: string;
  website?: string;
  socials?: ProgramApplication['socials'];
  audienceSize?: number;
  monthlyLeadsEstimate?: number;
  niche?: string;
  regionsServed?: string;
  referralCode?: string;
  payoutPreference?: ProgramApplication['payoutPreference'];
  payoutHandle?: string;
  notes?: string;
}): ProgramApplication {
  const now = nowIso();
  const app: ProgramApplication = {
    id: newId('app'),
    kind: args.kind,
    status: 'new',
    fullName: norm(args.fullName),
    email: norm(args.email).toLowerCase(),
    phone: norm(args.phone) || undefined,
    companyName: norm(args.companyName) || undefined,
    roleTitle: norm(args.roleTitle) || undefined,
    website: norm(args.website) || undefined,
    socials: args.socials ?? {},
    audienceSize: args.audienceSize != null ? Math.max(0, Math.round(Number(args.audienceSize) || 0)) : undefined,
    monthlyLeadsEstimate: args.monthlyLeadsEstimate != null ? Math.max(0, Math.round(Number(args.monthlyLeadsEstimate) || 0)) : undefined,
    niche: norm(args.niche) || undefined,
    regionsServed: norm(args.regionsServed) || undefined,
    referralCode: norm(args.referralCode) || undefined,
    payoutPreference: args.payoutPreference,
    payoutHandle: norm(args.payoutHandle) || undefined,
    notes: norm(args.notes) || undefined,
    createdAt: now,
    updatedAt: now,
  };
  if (!app.fullName || !app.email) throw new Error('Name and email are required.');
  const store = loadStore();
  store.applications = [app, ...(store.applications ?? [])].slice(0, 2000);
  saveStore(store);
  return app;
}

export function setProgramApplicationStatus(id: string, status: ProgramApplicationStatus): ProgramApplication | null {
  const store = loadStore();
  const idx = (store.applications ?? []).findIndex((a) => a.id === id);
  if (idx < 0) return null;
  const cur = store.applications[idx]!;
  const next: ProgramApplication = { ...cur, status, updatedAt: nowIso() };
  store.applications[idx] = next;
  saveStore(store);
  return next;
}

