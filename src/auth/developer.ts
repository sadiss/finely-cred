function normalizeEmail(email?: string | null): string {
  return String(email || '').trim().toLowerCase();
}

function stripPlusAddress(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus <= 0) return email;
  return `${local.slice(0, plus)}@${domain}`;
}

/** Always-recognized platform developer — also set VITE_DEVELOPER_EMAILS / EDGE_DEVELOPER_EMAILS in prod. */
export const DEVELOPER_EMAIL_ALLOWLIST = new Set(
  ['sadiss.ansaari@gmail.com'].map((e) => e.trim().toLowerCase()),
);

/** Documented initial password — set in Supabase Auth; reset anytime via Account → Security. */
export const DEVELOPER_BOOTSTRAP_LOGIN = {
  email: 'sadiss.ansaari@gmail.com',
  initialPassword: 'FinelyDev2026!',
} as const;

function listRuntimeDeveloperEmails(): Set<string> {
  const out = new Set<string>();
  for (const e of DEVELOPER_EMAIL_ALLOWLIST) out.add(e);
  const envRaw = String((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_DEVELOPER_EMAILS || '');
  for (const raw of envRaw.split(',')) {
    const normalized = normalizeEmail(raw);
    if (!normalized) continue;
    out.add(normalized);
    out.add(stripPlusAddress(normalized));
  }
  return out;
}

export function listDeveloperEmailAllowlist(): string[] {
  return Array.from(listRuntimeDeveloperEmails()).sort();
}

export function getDeveloperLoginHint(): string {
  return `Developer login: ${DEVELOPER_BOOTSTRAP_LOGIN.email} · initial password in docs/DEVELOPER_GUIDE.md §16`;
}

/** Platform developer QA role — separate from admin; outbound comms are sandboxed on edge. */
export function isDeveloperEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const stripped = stripPlusAddress(normalized);
  const set = listRuntimeDeveloperEmails();
  return set.has(normalized) || set.has(stripped);
}
