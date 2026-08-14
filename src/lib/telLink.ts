/**
 * Click-to-call helpers — shared by public high-intent pages (B7).
 *
 * Real support number sourced from `loadSettings().site.supportPhone` (admin-configurable),
 * falling back to the same number already displayed sitewide in the public footer
 * (`src/components/landing/index.tsx`).
 */
export const DEFAULT_SUPPORT_PHONE_DISPLAY = '800-307-4057';

/** Builds a `tel:` href from a display phone number (assumes US numbers unless already `+`-prefixed). */
export function buildTelHref(phoneDisplay: string): string {
  const trimmed = phoneDisplay.trim();
  if (trimmed.startsWith('+')) return `tel:${trimmed.replace(/[^\d+]/g, '')}`;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`;
  return `tel:${digits}`;
}
