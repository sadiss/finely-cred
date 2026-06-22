import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { FINELY_TENANT_ID } from '../domain/tenants';

const KEY = 'finely.mailCredits.v1';
export const DEFAULT_MAIL_COST_CENTS = 185;

export type MailCreditTxn = {
  id: string;
  type: 'replenish' | 'send' | 'adjust';
  amountCents: number;
  note?: string;
  letterId?: string;
  partnerId?: string;
  actorEmail?: string;
  createdAt: string;
};

export type MailCreditWallet = {
  tenantId: string;
  balanceCents: number;
  costPerLetterCents: number;
  transactions: MailCreditTxn[];
  updatedAt: string;
};

type Store = { wallets: MailCreditWallet[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { wallets: [] }, 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
}

export function getMailCreditWallet(tenantId: string = FINELY_TENANT_ID): MailCreditWallet {
  const store = loadStore();
  let w = store.wallets.find((x) => x.tenantId === tenantId);
  if (!w) {
    w = {
      tenantId,
      balanceCents: 0,
      costPerLetterCents: DEFAULT_MAIL_COST_CENTS,
      transactions: [],
      updatedAt: new Date().toISOString(),
    };
    store.wallets.push(w);
    saveStore(store);
  }
  return w;
}

export function formatMailCreditsUsd(cents: number) {
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function canAffordMailSend(tenantId?: string): { ok: boolean; balanceCents: number; costCents: number } {
  const w = getMailCreditWallet(tenantId);
  return { ok: w.balanceCents >= w.costPerLetterCents, balanceCents: w.balanceCents, costCents: w.costPerLetterCents };
}

export function replenishMailCredits(args: {
  tenantId?: string;
  amountCents: number;
  note?: string;
  actorEmail?: string;
}): MailCreditWallet {
  const tenantId = args.tenantId || FINELY_TENANT_ID;
  const store = loadStore();
  const w = getMailCreditWallet(tenantId);
  const idx = store.wallets.findIndex((x) => x.tenantId === tenantId);
  const amount = Math.max(0, Math.round(args.amountCents));
  const next: MailCreditWallet = {
    ...w,
    balanceCents: w.balanceCents + amount,
    transactions: [
      {
        id: newId('mailtxn'),
        type: 'replenish' as const,
        amountCents: amount,
        note: args.note,
        actorEmail: args.actorEmail,
        createdAt: new Date().toISOString(),
      },
      ...w.transactions,
    ].slice(0, 200),
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) store.wallets[idx] = next;
  else store.wallets.push(next);
  saveStore(store);
  return next;
}

export function chargeMailSend(args: {
  tenantId?: string;
  letterId: string;
  partnerId: string;
  actorEmail?: string;
  costCents?: number;
}): MailCreditWallet {
  const tenantId = args.tenantId || FINELY_TENANT_ID;
  const store = loadStore();
  const w = getMailCreditWallet(tenantId);
  const cost = args.costCents ?? w.costPerLetterCents;
  if (w.balanceCents < cost) {
    throw new Error(`Insufficient mail balance. Need ${formatMailCreditsUsd(cost)}; available ${formatMailCreditsUsd(w.balanceCents)}.`);
  }
  const idx = store.wallets.findIndex((x) => x.tenantId === tenantId);
  const next: MailCreditWallet = {
    ...w,
    balanceCents: w.balanceCents - cost,
    transactions: [
      {
        id: newId('mailtxn'),
        type: 'send' as const,
        amountCents: -cost,
        letterId: args.letterId,
        partnerId: args.partnerId,
        actorEmail: args.actorEmail,
        createdAt: new Date().toISOString(),
      },
      ...w.transactions,
    ].slice(0, 200),
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) store.wallets[idx] = next;
  saveStore(store);
  return next;
}
