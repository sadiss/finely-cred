import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { FINELY_TENANT_ID } from '../domain/tenants';

import { mailClassChoice } from '../lib/mailClassOptions';

const KEY = 'finely.mailCredits.v1';
/** Certified + ERR typical LetterStream cost — used when live quote unavailable. */
export const DEFAULT_MAIL_COST_CENTS = mailClassChoice('certified').estCostCents;

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
  /** Last known LetterStream prepaid balance (USD cents), when API exposes it. */
  providerBalanceCents: number | null;
  providerBalanceUpdatedAt?: string | null;
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

function normalizeWallet(w: MailCreditWallet): MailCreditWallet {
  return {
    ...w,
    providerBalanceCents: w.providerBalanceCents ?? null,
    providerBalanceUpdatedAt: w.providerBalanceUpdatedAt ?? null,
  };
}

export function getMailCreditWallet(tenantId: string = FINELY_TENANT_ID): MailCreditWallet {
  const store = loadStore();
  let w = store.wallets.find((x) => x.tenantId === tenantId);
  if (!w) {
    w = {
      tenantId,
      balanceCents: 0,
      costPerLetterCents: DEFAULT_MAIL_COST_CENTS,
      providerBalanceCents: null,
      providerBalanceUpdatedAt: null,
      transactions: [],
      updatedAt: new Date().toISOString(),
    };
    store.wallets.push(w);
    saveStore(store);
  }
  return normalizeWallet(w);
}

export function formatMailCreditsUsd(cents: number) {
  return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function canAffordMailSend(tenantId?: string, costCents?: number): { ok: boolean; balanceCents: number; costCents: number } {
  const w = getMailCreditWallet(tenantId);
  const cost = costCents ?? w.costPerLetterCents;
  return { ok: w.balanceCents >= cost, balanceCents: w.balanceCents, costCents: cost };
}

export function syncProviderMailBalance(args: { balanceUsd: number | null; tenantId?: string }): MailCreditWallet {
  const tenantId = args.tenantId || FINELY_TENANT_ID;
  const store = loadStore();
  const w = getMailCreditWallet(tenantId);
  const idx = store.wallets.findIndex((x) => x.tenantId === tenantId);
  const providerBalanceCents =
    typeof args.balanceUsd === 'number' && Number.isFinite(args.balanceUsd)
      ? Math.round(args.balanceUsd * 100)
      : null;
  const next: MailCreditWallet = {
    ...w,
    providerBalanceCents,
    providerBalanceUpdatedAt: providerBalanceCents != null ? new Date().toISOString() : w.providerBalanceUpdatedAt ?? null,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) store.wallets[idx] = next;
  else store.wallets.push(next);
  saveStore(store);
  return next;
}

export function maxReplenishCents(tenantId?: string): number | null {
  const w = getMailCreditWallet(tenantId);
  if (w.providerBalanceCents == null) return null;
  return Math.max(0, w.providerBalanceCents - w.balanceCents);
}

export function setMailCostPerLetterCents(costCents: number, tenantId?: string): MailCreditWallet {
  const tenantIdResolved = tenantId || FINELY_TENANT_ID;
  const store = loadStore();
  const w = getMailCreditWallet(tenantIdResolved);
  const idx = store.wallets.findIndex((x) => x.tenantId === tenantIdResolved);
  const next: MailCreditWallet = {
    ...w,
    costPerLetterCents: Math.max(1, Math.round(costCents)),
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) store.wallets[idx] = next;
  saveStore(store);
  return next;
}

export function replenishMailCredits(args: {
  tenantId?: string;
  amountCents: number;
  note?: string;
  actorEmail?: string;
  /** When true, skip provider cap (manual override — shows variance in UI). */
  force?: boolean;
}): { wallet: MailCreditWallet; capped?: boolean; varianceCents?: number } {
  const tenantId = args.tenantId || FINELY_TENANT_ID;
  const store = loadStore();
  const w = getMailCreditWallet(tenantId);
  const idx = store.wallets.findIndex((x) => x.tenantId === tenantId);
  let amount = Math.max(0, Math.round(args.amountCents));
  let capped = false;
  let varianceCents: number | undefined;
  const max = maxReplenishCents(tenantId);
  if (!args.force && max != null && amount > max) {
    varianceCents = amount - max;
    amount = max;
    capped = true;
  }
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
  return { wallet: next, capped, varianceCents };
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
