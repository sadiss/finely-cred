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
