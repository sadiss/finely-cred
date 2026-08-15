import type { LetterRecord, LetterMeta } from '../domain/letters';
import { listLettersByPartner, upsertLetter } from '../data/lettersRepo';
import { parseLetterRecipientBlock } from './letterMailingAddress';
import { businessBureauDisputeAddress, consumerBureauDisputeAddress } from '../letters/bureauAddresses';

function clean(v: unknown): string {
  return String(v ?? '').trim();
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function addressesMatch(nameA: string, addrA: string, nameB: string, addrB: string): boolean {
  return norm(nameA) === norm(nameB) && norm(addrA) === norm(addrB);
}

function resolveDisputeBureauBlock(letter: LetterRecord): { name: string; address: string } | null {
  const meta = letter.meta as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') return null;

  const savedName = clean(meta.bureauMailingName);
  const savedAddr = clean(meta.bureauMailingAddress);
  if (savedName && savedAddr) {
    return { name: savedName, address: savedAddr };
  }

  if ((meta.context === 'business_dispute' || meta.bureauKind === 'business') && meta.businessBureau) {
    const addr = businessBureauDisputeAddress(meta.businessBureau as any);
    const lines = (addr.lines ?? []).map((x) => String(x || '').trim()).filter(Boolean);
    if (!lines.length) return null;
    return { name: clean(addr.name) || 'Business bureau', address: lines.join('\n') };
  }

  if ('bureau' in meta && meta.bureau) {
    const addr = consumerBureauDisputeAddress(meta.bureau as any);
    const lines = (addr.lines ?? []).map((x) => String(x || '').trim()).filter(Boolean);
    if (!lines.length) return null;
    return { name: clean(addr.name), address: lines.join('\n') };
  }

  return null;
}

function resolveTargetMailBlock(
  letter: LetterRecord,
  parsed: { name: string; address: string } | null,
): { name: string; address: string } | null {
  if (parsed) return parsed;
  if (letter.type === 'dispute') return resolveDisputeBureauBlock(letter);
  return null;
}

/**
 * Backfill per-letter mail To meta from the saved body recipient block (or bureau defaults for disputes).
 */
export function backfillLetterMailToMeta(letter: LetterRecord): { letter: LetterRecord; changed: boolean } {
  const parsed = letter.body ? parseLetterRecipientBlock(letter.body) : null;
  const metaRaw = letter.meta && typeof letter.meta === 'object' ? letter.meta : null;
  const meta: Record<string, unknown> = metaRaw ? { ...(metaRaw as object) } : {};

  const mailToName = clean(meta.mailToName);
  const mailToAddress = clean(meta.mailToAddress);

  if (parsed && mailToName && mailToAddress && addressesMatch(mailToName, mailToAddress, parsed.name, parsed.address)) {
    return { letter, changed: false };
  }

  const target = resolveTargetMailBlock(letter, parsed);
  if (!target?.name || !target.address) {
    const metaOnlyName =
      clean(meta.collectorName) || clean(meta.creditorName) || clean(meta.recipientName) || clean(meta.mailToName);
    if (metaOnlyName && (!mailToName || !mailToAddress)) {
      const nextMeta = { ...meta, mailToName: metaOnlyName, recipientName: metaOnlyName };
      return {
        letter: { ...letter, meta: nextMeta as LetterMeta },
        changed: true,
      };
    }
    return { letter, changed: false };
  }

  let changed = false;
  const nextMeta = { ...meta };

  const needsMailTo =
    !mailToName ||
    !mailToAddress ||
    (parsed ? !addressesMatch(mailToName, mailToAddress, parsed.name, parsed.address) : !addressesMatch(mailToName, mailToAddress, target.name, target.address));

  if (needsMailTo) {
    nextMeta.mailToName = target.name;
    nextMeta.mailToAddress = target.address;
    // Keep recipient fields aligned so older readers pick up per-letter address too.
    nextMeta.recipientName = target.name;
    nextMeta.recipientAddress = target.address;
    changed = true;
  }

  if (letter.type === 'dispute') {
    const bureauName = clean(meta.bureauMailingName);
    const bureauAddr = clean(meta.bureauMailingAddress);
    const needsBureau =
      !bureauName ||
      !bureauAddr ||
      (parsed ? !addressesMatch(bureauName, bureauAddr, parsed.name, parsed.address) : false);

    if (needsBureau) {
      const bureauTarget = parsed ?? resolveDisputeBureauBlock(letter);
      if (bureauTarget?.name && bureauTarget.address) {
        nextMeta.bureauMailingName = bureauTarget.name;
        nextMeta.bureauMailingAddress = bureauTarget.address;
        changed = true;
      }
    }
  }

  if (!changed) return { letter, changed: false };

  return {
    letter: { ...letter, meta: nextMeta as LetterMeta },
    changed: true,
  };
}

/** Run mail-To meta backfill for all partner letters; returns count updated. */
export function backfillPartnerLettersMailTo(partnerId: string): number {
  const letters = listLettersByPartner(partnerId);
  let count = 0;
  for (const letter of letters) {
    const { letter: next, changed } = backfillLetterMailToMeta(letter);
    if (changed) {
      upsertLetter(next);
      count += 1;
    }
  }
  return count;
}
