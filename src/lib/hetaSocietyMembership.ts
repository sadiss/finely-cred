import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';
import { HETA_SOCIETY_PROGRAM_ID } from '../config/hetaSocietyProgram';

const KEY = 'finely.hetaSociety.members.v1';

export type HetaSocietyMember = {
  id: string;
  leadId: string;
  partnerId?: string;
  email: string;
  fullName: string;
  joinedAt: string;
  programId: typeof HETA_SOCIETY_PROGRAM_ID;
};

type Store = { members: HetaSocietyMember[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { members: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function registerHetaSocietyMember(args: {
  leadId: string;
  email: string;
  fullName: string;
  partnerId?: string;
}): HetaSocietyMember {
  const store = loadStore();
  const email = args.email.trim().toLowerCase();
  const existing =
    store.members.find((m) => m.leadId === args.leadId) ??
    store.members.find((m) => m.email === email);
  if (existing) {
    if (args.partnerId && !existing.partnerId) {
      existing.partnerId = args.partnerId;
      existing.fullName = args.fullName.trim() || existing.fullName;
      saveStore(store);
    }
    return existing;
  }
  const member: HetaSocietyMember = {
    id: newId('hos_member'),
    leadId: args.leadId,
    partnerId: args.partnerId,
    email,
    fullName: args.fullName.trim(),
    joinedAt: new Date().toISOString(),
    programId: HETA_SOCIETY_PROGRAM_ID,
  };
  store.members.push(member);
  saveStore(store);
  return member;
}

export function linkHetaMemberToPartner(leadId: string, partnerId: string): HetaSocietyMember | null {
  const store = loadStore();
  const idx = store.members.findIndex((m) => m.leadId === leadId);
  if (idx < 0) return null;
  store.members[idx] = { ...store.members[idx], partnerId };
  saveStore(store);
  return store.members[idx];
}

export function getHetaMemberByLead(leadId: string): HetaSocietyMember | null {
  return loadStore().members.find((m) => m.leadId === leadId) ?? null;
}

export function getHetaMemberByPartner(partnerId: string): HetaSocietyMember | null {
  return loadStore().members.find((m) => m.partnerId === partnerId) ?? null;
}

export function getHetaMemberByEmail(email: string): HetaSocietyMember | null {
  const norm = email.trim().toLowerCase();
  return loadStore().members.find((m) => m.email === norm) ?? null;
}

export function isHetaSocietyPartner(args: { partnerId?: string; email?: string; lane?: string }): boolean {
  if (args.lane === HETA_SOCIETY_PROGRAM_ID) return true;
  if (args.partnerId && getHetaMemberByPartner(args.partnerId)) return true;
  if (args.email && getHetaMemberByEmail(args.email)) return true;
  return false;
}

export function seedHetaOnboardingDraft(args: { fullName: string; email: string; phone: string; leadId: string }) {
  try {
    const raw = localStorage.getItem('finely.onboarding.v1');
    const parsed = raw ? JSON.parse(raw) : {};
    localStorage.setItem(
      'finely.onboarding.v1',
      JSON.stringify({
        ...parsed,
        userData: {
          ...(parsed.userData ?? {}),
          name: args.fullName,
          email: args.email,
          phone: args.phone,
          lane: HETA_SOCIETY_PROGRAM_ID,
          goal: HETA_SOCIETY_PROGRAM_ID,
          program: 'hos',
          leadId: args.leadId,
        },
      }),
    );
  } catch {
    /* ignore */
  }
}
