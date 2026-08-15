/** Persist mail send receipts in Deno KV — idempotent resend returns the same proof. */

export type MailSendReceipt = {
  providerId: string;
  batch?: string | null;
  job?: string | null;
  cost?: number | null;
  status: string;
  code: number;
  sentAt: string;
  reconciled?: boolean;
  deduped?: boolean;
};

let _kvPromise: Promise<Deno.Kv> | null = null;

function getKv(): Promise<Deno.Kv> {
  if (!_kvPromise) {
    _kvPromise = Deno.openKv().catch(() => {
      _kvPromise = null;
      throw new Error('KV unavailable');
    });
  }
  return _kvPromise;
}

function receiptKey(idemKey: string): Deno.KvKey {
  return ['mail-receipt', idemKey];
}

export async function getMailSendReceipt(idemKey: string): Promise<MailSendReceipt | null> {
  try {
    const kv = await getKv();
    const got = await kv.get<MailSendReceipt>(receiptKey(idemKey));
    return got.value ?? null;
  } catch {
    return null;
  }
}

export async function saveMailSendReceipt(args: {
  idemKey: string;
  receipt: MailSendReceipt;
  ttlSeconds?: number;
}): Promise<void> {
  try {
    const kv = await getKv();
    const ttlMs = Math.max(60_000, Math.round((args.ttlSeconds ?? 60 * 60 * 24 * 30) * 1000));
    await kv.set(receiptKey(args.idemKey), args.receipt, { expireIn: ttlMs });
  } catch {
    // fail open — send still succeeded at provider
  }
}

/** Returns existing receipt if this idempotency key already mailed. */
export async function claimMailSendIdempotency(args: {
  idemKey: string;
  ttlSeconds?: number;
}): Promise<{ fresh: boolean; receipt?: MailSendReceipt }> {
  const existing = await getMailSendReceipt(args.idemKey);
  if (existing) return { fresh: false, receipt: existing };

  try {
    const kv = await getKv();
    const ttlMs = Math.max(60_000, Math.round((args.ttlSeconds ?? 60 * 60 * 6) * 1000));
    const k = ['idem', 'mailer', args.idemKey];
    const got = await kv.get(k);
    if (got.value) {
      const again = await getMailSendReceipt(args.idemKey);
      if (again) return { fresh: false, receipt: again };
      return { fresh: false };
    }
    await kv.set(k, { seenAt: new Date().toISOString() }, { expireIn: ttlMs });
    return { fresh: true };
  } catch {
    return { fresh: true };
  }
}
