/** Shared sender / mailing-address helpers for dispute, debt, and court letters. */

export type LetterSenderFields = {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  cityStateZip?: string;
};

function cleanLine(v?: string | null): string {
  return String(v ?? '').trim();
}

/**
 * Letter paper sender block — name + mailing address only.
 * Finely Cred policy: never print partner phone or email on mailed/generated letters.
 */
export function formatLetterSenderBlock(args: {
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  /** @deprecated Ignored — phone must not appear on letters */
  phone?: string;
  /** @deprecated Ignored — email must not appear on letters */
  email?: string;
}): string {
  const lines: string[] = [];
  const name = cleanLine(args.name);
  if (name) lines.push(name);
  const a1 = cleanLine(args.address1);
  const a2 = cleanLine(args.address2);
  if (a1) lines.push(a1);
  if (a2) lines.push(a2);
  const city = cleanLine(args.city);
  const state = cleanLine(args.state);
  const zip = cleanLine(args.postalCode);
  const cityStateZip = [city, state].filter(Boolean).join(', ') + (zip ? ` ${zip}` : '');
  if (cityStateZip.trim()) lines.push(cityStateZip.trim());
  if (lines.length <= 1 && !lines[0]) return '[Your Name and Mailing Address]';
  if (lines.length <= 1) return '[Your Name and Mailing Address]';
  return lines.join('\n');
}

/** Strip phone/email lines if they were pasted into legacy letter drafts. */
export function stripContactLinesFromLetterBody(body: string): string {
  if (!body?.trim()) return body;
  return body
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^phone\s*:/i.test(t)) return false;
      if (/^email\s*:/i.test(t)) return false;
      if (/^tel\s*:/i.test(t)) return false;
      if (/^telephone\s*:/i.test(t)) return false;
      return true;
    })
    .join('\n');
}

export function resolveCityStateZip(fields: LetterSenderFields): string {
  const fromCombined = String(fields.cityStateZip || '').trim();
  if (fromCombined) return fromCombined;
  const city = String(fields.city || '').trim();
  const state = String(fields.state || '').trim();
  const zip = String(fields.postalCode || '').trim();
  const cityState = [city, state].filter(Boolean).join(', ');
  return [cityState, zip].filter(Boolean).join(cityState && zip ? ' ' : '');
}

export function hasCompleteLetterMailingAddress(fields: LetterSenderFields): boolean {
  const name = String(fields.name || '').trim();
  const line1 = String(fields.addressLine1 || '').trim();
  const csz = resolveCityStateZip(fields);
  return Boolean(name && line1 && csz.length >= 5);
}

export function senderPreviewLines(fields: LetterSenderFields): { lines: string[]; missing: boolean } {
  const name = String(fields.name || '').trim();
  const line1 = String(fields.addressLine1 || '').trim();
  const line2 = String(fields.addressLine2 || '').trim();
  const csz = resolveCityStateZip(fields);
  const missing = !hasCompleteLetterMailingAddress(fields);

  if (!missing) {
    return {
      lines: [name, line1, line2, csz].map((x) => x.trim()).filter(Boolean),
      missing: false,
    };
  }

  return {
    lines: [
      name || '[YOUR NAME — REQUIRED]',
      line1 || '[STREET ADDRESS — REQUIRED]',
      line2 || '',
      csz || '[CITY, STATE ZIP — REQUIRED]',
    ].filter(Boolean),
    missing: true,
  };
}

export const LETTER_MISSING_PLACEHOLDER_TOKENS = [
  '[Your Name and Address]',
  '[YOUR NAME — REQUIRED]',
  '[STREET ADDRESS — REQUIRED]',
  '[CITY, STATE ZIP — REQUIRED]',
  '[Collector/Attorney Name and Address]',
  '[CREDITOR / LAW FIRM NAME — REQUIRED]',
  '[CREDITOR / LAW FIRM MAILING ADDRESS — REQUIRED]',
  '[PLAINTIFF ADDRESS]',
  '[PLAINTIFF LAW FIRM]',
  '[PLAINTIFF LAW FIRM ADDRESS]',
  '[DATE]',
] as const;

export function highlightMissingLetterPlaceholders(html: string): string {
  let out = html;
  for (const token of LETTER_MISSING_PLACEHOLDER_TOKENS) {
    const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(
      new RegExp(esc, 'g'),
      `<span class="fc-letter-missing" style="color:#b91c1c;font-weight:700;background:#fef2f2;padding:1px 4px;border-radius:3px;border:1px solid #fecaca">${token}</span>`,
    );
  }
  return out;
}

export function letterDateIso(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function letterDateDisplay(d = new Date()): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
