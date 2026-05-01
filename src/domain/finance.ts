export type FinanceBucketMode = 'pct_gross' | 'pct_remaining' | 'fixed_cents';

export type FinanceBucket = {
  id: string;
  /** Display name (e.g., Marketing, Payroll, Taxes, Agents, Affiliates). */
  name: string;
  /** Where the bucket belongs (optional). */
  category?: 'tax' | 'marketing' | 'payroll' | 'ops' | 'affiliate' | 'agent' | 'reserve' | 'other';
  /** Allocation mode. */
  mode: FinanceBucketMode;
  /** Percentage (0-100) or cents, depending on mode. */
  value: number;
  /** Optional payee label (team member, vendor, affiliate). */
  payeeLabel?: string;
  /** Optional notes. */
  notes?: string;
};

export type FinanceTemplate = {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  buckets: FinanceBucket[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FinanceIncomeEvent = {
  id: string;
  tenantId: string;
  /** Gross amount received. */
  amountCents: number;
  /** When revenue was received. */
  receivedAt: string; // ISO
  source?: string; // e.g. Stripe, Denefits, Cash, Referral
  referenceId?: string; // invoice/receipt id
  notes?: string;
  templateId?: string; // snapshot which template used
  createdAt: string;
  updatedAt: string;
};

export type FinanceAllocationLine = {
  bucketId: string;
  bucketName: string;
  amountCents: number;
  mode: FinanceBucketMode;
  value: number;
  category?: FinanceBucket['category'];
  payeeLabel?: string;
};

export function nowIso() {
  return new Date().toISOString();
}

export function computeAllocations(args: {
  event: Pick<FinanceIncomeEvent, 'amountCents'>;
  template: Pick<FinanceTemplate, 'buckets'>;
}): { lines: FinanceAllocationLine[]; allocatedCents: number; remainingCents: number } {
  const gross = Math.max(0, Math.round(args.event.amountCents));
  let remaining = gross;
  const lines: FinanceAllocationLine[] = [];

  const buckets = (args.template.buckets ?? []).slice();

  // 1) pct_gross
  for (const b of buckets.filter((x) => x.mode === 'pct_gross')) {
    const pct = Math.max(0, Math.min(100, Number(b.value) || 0));
    const amt = Math.max(0, Math.round((gross * pct) / 100));
    remaining = Math.max(0, remaining - amt);
    lines.push({
      bucketId: b.id,
      bucketName: b.name,
      amountCents: amt,
      mode: b.mode,
      value: pct,
      category: b.category,
      payeeLabel: b.payeeLabel,
    });
  }

  // 2) fixed
  for (const b of buckets.filter((x) => x.mode === 'fixed_cents')) {
    const amt = Math.max(0, Math.round(Number(b.value) || 0));
    const use = Math.min(remaining, amt);
    remaining = Math.max(0, remaining - use);
    lines.push({
      bucketId: b.id,
      bucketName: b.name,
      amountCents: use,
      mode: b.mode,
      value: amt,
      category: b.category,
      payeeLabel: b.payeeLabel,
    });
  }

  // 3) pct_remaining
  for (const b of buckets.filter((x) => x.mode === 'pct_remaining')) {
    const pct = Math.max(0, Math.min(100, Number(b.value) || 0));
    const amt = Math.max(0, Math.round((remaining * pct) / 100));
    remaining = Math.max(0, remaining - amt);
    lines.push({
      bucketId: b.id,
      bucketName: b.name,
      amountCents: amt,
      mode: b.mode,
      value: pct,
      category: b.category,
      payeeLabel: b.payeeLabel,
    });
  }

  const allocated = lines.reduce((s, l) => s + l.amountCents, 0);
  return { lines, allocatedCents: allocated, remainingCents: remaining };
}

