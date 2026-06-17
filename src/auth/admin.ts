export const ADMIN_EMAIL_ALLOWLIST = new Set(
  [
    'partnersupport@finelycred.com',
    'sanzstlouis@finelycred.com',
    'shellystlouis@finelycred.com',
  ].map((e) => e.trim().toLowerCase()),
);

function normalizeEmail(email?: string | null): string {
  return String(email || '')
    .trim()
    .toLowerCase();
}

/**
 * Support plus-addressing (e.g. "owner+dev@finelycred.com") so staff can use tagged emails
 * without losing admin access.
 */
function stripPlusAddress(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus <= 0) return email;
  return `${local.slice(0, plus)}@${domain}`;
}

function listRuntimeAdminEmails(): Set<string> {
  const out = new Set<string>();
  // All three platform bootstrap admins — always recognized in every environment.
  for (const e of ADMIN_EMAIL_ALLOWLIST) out.add(e);
  try {
    // Demo-mode admin list is stored in browser storage under the settings key.
    const raw = localStorage.getItem('finely.settings.v1');
    if (!raw) return out;
    const parsed: any = JSON.parse(raw);
    const extra = Array.isArray(parsed?.security?.adminEmails) ? parsed.security.adminEmails : [];
    for (const e of extra) {
      const normalized = normalizeEmail(e);
      if (normalized) {
        out.add(normalized);
        out.add(stripPlusAddress(normalized));
      }
    }
  } catch {
    // ignore
  }
  return out;
}

export function listBootstrapAdminEmails(): string[] {
  return Array.from(ADMIN_EMAIL_ALLOWLIST).sort();
}

export function listAdminEmailRecipients(): string[] {
  return Array.from(listRuntimeAdminEmails()).sort();
}

export function isAdminEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const stripped = stripPlusAddress(normalized);
  const set = listRuntimeAdminEmails();
  const hit = set.has(normalized) || set.has(stripped);

  return hit;
}

