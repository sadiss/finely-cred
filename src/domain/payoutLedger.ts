import type { AuSellerPayoutMethod } from './auSeller';

export type PayoutRole = 'affiliate' | 'specialist' | 'agent' | 'seller';

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

export type PayoutEntry = {
  id: string;
  role: PayoutRole;
  /** seller id, partner id, or user-scoped key */
  ownerId: string;
  ownerEmail?: string;
  amountCents: number;
  status: PayoutStatus;
  source: string;
  referenceId?: string;
  method?: AuSellerPayoutMethod | 'stripe' | 'check' | 'other';
  scheduledFor?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PayoutSummary = {
  pendingCents: number;
  processingCents: number;
  paidCents: number;
  paidLast30Cents: number;
  nextScheduled?: string;
  entryCount: number;
};

export function summarizePayoutEntries(entries: PayoutEntry[]): PayoutSummary {
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  let pendingCents = 0;
  let processingCents = 0;
  let paidCents = 0;
  let paidLast30Cents = 0;
  let nextScheduled: string | undefined;

  for (const e of entries) {
    if (e.status === 'pending') pendingCents += e.amountCents;
    if (e.status === 'processing') processingCents += e.amountCents;
    if (e.status === 'paid') {
      paidCents += e.amountCents;
      const paidAt = e.paidAt ? new Date(e.paidAt).getTime() : 0;
      if (paidAt >= thirtyDaysAgo) paidLast30Cents += e.amountCents;
    }
    if (e.status === 'pending' && e.scheduledFor) {
      if (!nextScheduled || e.scheduledFor < nextScheduled) nextScheduled = e.scheduledFor;
    }
  }

  return {
    pendingCents,
    processingCents,
    paidCents,
    paidLast30Cents,
    nextScheduled,
    entryCount: entries.length,
  };
}
