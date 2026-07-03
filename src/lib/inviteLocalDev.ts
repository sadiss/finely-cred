import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';

const OUTBOX_KEY = 'finely.invite.dev.outbox.v1';
const MAX_ITEMS = 40;

export type LocalInviteOutboxItem = {
  id: string;
  kind: 'account_invite' | 'claim_invite' | 'sms';
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  inviteUrl?: string;
  createdAt: string;
};

type OutboxStore = { items: LocalInviteOutboxItem[] };

function loadOutbox(): OutboxStore {
  return loadJson<OutboxStore>(OUTBOX_KEY, { items: [] }, 1);
}

function saveOutbox(store: OutboxStore) {
  saveJson(OUTBOX_KEY, store, 1);
}

/** True when running Vite dev or on localhost — allows invite testing without Supabase edge functions. */
export function canSimulateInviteDeliveryLocally(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local');
}

export function listLocalInviteOutbox(): LocalInviteOutboxItem[] {
  return loadOutbox()
    .items.slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function pushOutbox(item: Omit<LocalInviteOutboxItem, 'id' | 'createdAt'>): LocalInviteOutboxItem {
  const store = loadOutbox();
  const entry: LocalInviteOutboxItem = {
    ...item,
    id: newId('invite_dev'),
    createdAt: new Date().toISOString(),
  };
  store.items = [entry, ...store.items].slice(0, MAX_ITEMS);
  saveOutbox(store);
  return entry;
}

export function openLocalInviteEmailPreview(html: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) return false;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  } catch {
    return false;
  }
}

export type LocalInviteSimResult = {
  ok: true;
  simulated: true;
  inviteUrl?: string;
  previewOpened: boolean;
};

export function simulateInviteEmail(args: {
  kind: 'account_invite' | 'claim_invite';
  to: string;
  subject: string;
  text: string;
  html: string;
  inviteUrl?: string;
}): LocalInviteSimResult {
  pushOutbox({
    kind: args.kind,
    to: args.to,
    subject: args.subject,
    text: args.text,
    html: args.html,
    inviteUrl: args.inviteUrl,
  });
  const previewOpened = openLocalInviteEmailPreview(args.html);
  try {
    console.info('[Finely local invite]', {
      kind: args.kind,
      to: args.to,
      subject: args.subject,
      inviteUrl: args.inviteUrl,
    });
  } catch {
    // ignore
  }
  return { ok: true, simulated: true, inviteUrl: args.inviteUrl, previewOpened };
}

export function simulateInviteSms(args: { to: string; body: string; inviteUrl?: string }): LocalInviteSimResult {
  pushOutbox({
    kind: 'sms',
    to: args.to,
    text: args.body,
    inviteUrl: args.inviteUrl,
  });
  try {
    console.info('[Finely local invite SMS]', args);
  } catch {
    // ignore
  }
  return { ok: true, simulated: true, inviteUrl: args.inviteUrl, previewOpened: false };
}

export function formatLocalInviteNotice(res: LocalInviteSimResult, to: string): string {
  const base = `Local dev: invite simulated for ${to} (no Supabase / edge email).`;
  if (res.previewOpened) return `${base} Branded email preview opened in a new tab — use the link inside to test signup.`;
  if (res.inviteUrl) return `${base} Use the invite link shown below to test the flow.`;
  return `${base} Details logged to the browser console.`;
}
