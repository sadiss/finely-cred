import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { InviteRecord } from '../domain/imports';

const KEY = 'finely.invites.v1';

type Store = { invites: InviteRecord[] };

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): Store {
  return loadJson<Store>(KEY, { invites: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function listInvitesByPartner(partnerId: string): InviteRecord[] {
  return loadStore().invites.filter((i) => i.partnerId === partnerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getInvite(id: string): InviteRecord | null {
  return loadStore().invites.find((i) => i.id === id) ?? null;
}

export function findInviteByToken(token: string): InviteRecord | null {
  const t = (token || '').trim();
  if (!t) return null;
  return loadStore().invites.find((i) => i.token === t) ?? null;
}

export function upsertInvite(invite: InviteRecord): InviteRecord {
  const store = loadStore();
  const idx = store.invites.findIndex((i) => i.id === invite.id);
  if (idx >= 0) store.invites[idx] = invite;
  else store.invites.push(invite);
  saveStore(store);
  return invite;
}

export function createInvite(args: {
  partnerId: string;
  claimUrl: string;
  toEmail?: string;
  toPhone?: string;
}): InviteRecord {
  const token =
    (crypto?.randomUUID ? crypto.randomUUID() : `token_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`).replaceAll('-', '');
  const created: InviteRecord = {
    id: newId('invite'),
    partnerId: args.partnerId,
    token,
    claimUrl: args.claimUrl.includes('?') ? `${args.claimUrl}&token=${token}` : `${args.claimUrl}?token=${token}`,
    createdAt: nowIso(),
    channels: {
      email: args.toEmail ? { to: args.toEmail, status: 'pending' } : undefined,
      sms: args.toPhone ? { to: args.toPhone, status: 'pending' } : undefined,
    },
  };
  return upsertInvite(created);
}

export function markInviteClaimed(token: string, args: { userId: string }): InviteRecord | null {
  const inv = findInviteByToken(token);
  if (!inv) return null;
  const updated: InviteRecord = { ...inv, claimedAt: nowIso(), claimedUserId: args.userId };
  return upsertInvite(updated);
}

