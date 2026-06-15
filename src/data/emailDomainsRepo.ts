import type { EmailDomain, EmailDomainsStore, EmailSignature } from '../domain/emailDomains';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { buildFinelyEmailLogoHtml } from '../comms/finelyEmailBrand';
import { getPublicSiteOrigin } from '../lib/funnelPublicLinks';

const KEY = 'finely.emailDomains.v1';

function nowIso() {
  return new Date().toISOString();
}

function loadStore(): EmailDomainsStore {
  return loadJson<EmailDomainsStore>(KEY, { domains: [], signatures: [] }, 1);
}

function saveStore(store: EmailDomainsStore) {
  saveJson(KEY, store, 1);
}

export function listEmailDomains(): EmailDomain[] {
  return loadStore().domains.slice().sort((a, b) => a.label.localeCompare(b.label));
}

export function getEmailDomain(id: string): EmailDomain | null {
  return loadStore().domains.find((d) => d.id === id) ?? null;
}

export function getDefaultEmailDomain(): EmailDomain | null {
  const domains = listEmailDomains();
  return domains.find((d) => d.isDefault) ?? domains[0] ?? null;
}

export function upsertEmailDomain(patch: Omit<EmailDomain, 'createdAt' | 'updatedAt'> & { createdAt?: string }) {
  const store = loadStore();
  const idx = store.domains.findIndex((d) => d.id === patch.id);
  const ts = nowIso();
  if (patch.isDefault) {
    for (const d of store.domains) d.isDefault = d.id === patch.id;
  }
  if (idx >= 0) {
    store.domains[idx] = { ...store.domains[idx], ...patch, updatedAt: ts };
  } else {
    store.domains.push({
      ...patch,
      createdAt: patch.createdAt ?? ts,
      updatedAt: ts,
    });
  }
  saveStore(store);
  return getEmailDomain(patch.id)!;
}

export function deleteEmailDomain(id: string) {
  const store = loadStore();
  store.domains = store.domains.filter((d) => d.id !== id);
  store.signatures = store.signatures.filter((s) => s.domainId !== id);
  saveStore(store);
}

export function listEmailSignatures(domainId?: string): EmailSignature[] {
  const sigs = loadStore().signatures.slice();
  return domainId ? sigs.filter((s) => s.domainId === domainId) : sigs;
}

export function getEmailSignature(id: string): EmailSignature | null {
  return loadStore().signatures.find((s) => s.id === id) ?? null;
}

export function getDefaultEmailSignature(domainId: string): EmailSignature | null {
  const sigs = listEmailSignatures(domainId);
  return sigs.find((s) => s.isDefault) ?? sigs[0] ?? null;
}

export function upsertEmailSignature(patch: Omit<EmailSignature, 'createdAt' | 'updatedAt'> & { createdAt?: string }) {
  const store = loadStore();
  const idx = store.signatures.findIndex((s) => s.id === patch.id);
  const ts = nowIso();
  if (patch.isDefault) {
    for (const s of store.signatures) {
      if (s.domainId === patch.domainId) s.isDefault = s.id === patch.id;
    }
  }
  if (idx >= 0) {
    store.signatures[idx] = { ...store.signatures[idx], ...patch, updatedAt: ts };
  } else {
    store.signatures.push({
      ...patch,
      createdAt: patch.createdAt ?? ts,
      updatedAt: ts,
    });
  }
  saveStore(store);
  return getEmailSignature(patch.id)!;
}

export function deleteEmailSignature(id: string) {
  const store = loadStore();
  store.signatures = store.signatures.filter((s) => s.id !== id);
  saveStore(store);
}

/** Seed primary Finely Cred domain + default advisor signature. */
export function ensureDefaultEmailDomainsOnce() {
  const store = loadStore();
  if (store.domains.length) return false;

  const domainId = 'domain_finely_primary';
  const ts = nowIso();
  upsertEmailDomain({
    id: domainId,
    label: 'Finely Cred (primary)',
    domain: 'finelycred.com',
    fromEmail: 'hello@finelycred.com',
    fromName: 'Finely Cred',
    replyToEmail: 'partnersupport@finelycred.com',
    isDefault: true,
    verified: false,
    tenantId: 'finely_cred',
    createdAt: ts,
  });

  upsertEmailSignature({
    id: 'sig_finely_advisor',
    domainId,
    label: 'Finely advisor',
    personaName: 'Taylor Morgan',
    title: 'Credit Strategy Advisor',
    phone: '(888) 555-0142',
    isDefault: true,
    htmlBlock: defaultSignatureHtml('Taylor Morgan', 'Credit Strategy Advisor', '(888) 555-0142'),
    createdAt: ts,
  });

  return true;
}

/** Refresh default signature + logo when branding assets ship (idempotent). */
export function refreshDefaultEmailSignatureBranding() {
  const sig = getEmailSignature('sig_finely_advisor');
  if (!sig) return false;
  const next = defaultSignatureHtml(sig.personaName ?? 'Finely Cred', sig.title ?? 'Partner Success', sig.phone);
  if (sig.htmlBlock === next) return false;
  upsertEmailSignature({ ...sig, htmlBlock: next });
  return true;
}

export function defaultSignatureHtml(name: string, title: string, phone?: string) {
  const logo = buildFinelyEmailLogoHtml({
    variant: 'signature',
    width: 128,
    href: getPublicSiteOrigin(),
    origin: getPublicSiteOrigin(),
  });
  return `<table cellpadding="0" cellspacing="0" style="margin-top:24px;font-family:system-ui,-apple-system,sans-serif;border-top:1px solid #e2e8f0;padding-top:18px;width:100%;">
  <tr>
    <td style="padding-right:14px;vertical-align:top;width:140px;">
      ${logo}
    </td>
    <td style="vertical-align:top;">
      <div style="font-size:15px;font-weight:700;color:#0f172a;">${name}</div>
      <div style="font-size:13px;color:#475569;margin-top:2px;">${title}</div>
      <div style="font-size:12px;color:#64748b;margin-top:4px;">Finely Cred · Educational only · Not legal advice</div>
      ${phone ? `<div style="font-size:13px;color:#64748b;margin-top:6px;">${phone}</div>` : ''}
    </td>
  </tr>
</table>`;
}

export function createEmailDomainDraft(): EmailDomain {
  const ts = nowIso();
  return {
    id: newId('email_domain'),
    label: 'New sending domain',
    domain: 'yourdomain.com',
    fromEmail: 'hello@yourdomain.com',
    fromName: 'Your Brand',
    isDefault: false,
    verified: false,
    createdAt: ts,
    updatedAt: ts,
  };
}
