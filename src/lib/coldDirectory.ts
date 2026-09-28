/**
 * Cold public-directory prospects vs inbound Finely signups.
 * Scraped/discovered contacts are CRM prospects with no marketing consent.
 */
import type { CrmRecord } from '../domain/crmRecords';
import type { LeadCapture } from '../domain/leads';
import type { Prospect } from '../domain/crmProspects';

export const COLD_DIRECTORY_TAG = 'cold-directory';
export const COLD_NO_CONSENT_TAG = 'no-consent';
export const COLD_PUBLIC_ORG_TAG = 'public-org';

export const COLD_LANE_TAGS = ['affiliates', 'specialists', 'jobs', 'haitian_orgs'] as const;
export type ColdLaneTag = (typeof COLD_LANE_TAGS)[number];

const CONSUMER_MAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'msn.com',
]);

const ROLE_LOCAL_PARTS = new Set([
  'info',
  'contact',
  'office',
  'admin',
  'hello',
  'outreach',
  'pastor',
  'director',
  'partnerships',
  'partnership',
  'media',
  'communications',
  'community',
  'intake',
  'frontDesk',
  'frontdesk',
  'secretary',
  'help',
]);

export function isColdDirectoryProspect(p: Pick<Prospect, 'source' | 'tags' | 'leadType' | 'consentBasis' | 'emailMarketingAllowed'>): boolean {
  const tags = p.tags ?? [];
  if (tags.includes(COLD_DIRECTORY_TAG)) return true;
  if (p.source === 'directory_cold') return true;
  if (p.leadType === 'discovered') return true;
  if (p.consentBasis === 'discovered_no_consent') return true;
  if (p.emailMarketingAllowed === false && tags.includes(COLD_NO_CONSENT_TAG)) return true;
  return false;
}

export function isColdDirectoryCrmRecord(r: CrmRecord): boolean {
  if (r.kind === 'inbound_lead') return false;
  if (r.kind !== 'prospect') return false;
  const tags = r.tags ?? [];
  if (tags.includes(COLD_DIRECTORY_TAG)) return true;
  if (r.source === 'directory_cold') return true;
  if (r.leadType === 'discovered') return true;
  if (r.consentBasis === 'discovered_no_consent') return true;
  return false;
}

export function isColdDirectoryLeadCapture(lead: LeadCapture): boolean {
  const blob = `${lead.interest ?? ''} ${lead.utmCampaign ?? ''} ${lead.funnelPath ?? ''}`.toLowerCase();
  if (blob.includes('directory_cold') || blob.includes('haitian_csv') || blob.includes('cold_directory')) return true;
  if (lead.consentToContact === false && lead.consentEmailMarketing !== true && blob.includes('bulk_import')) return true;
  return false;
}

/** Verified public organization/role inbox only — never personal/consumer mail. */
export function isPublicOrganizationRoleInbox(email: string | undefined | null): { ok: boolean; reason: string } {
  const raw = (email ?? '').trim().toLowerCase();
  if (!raw || !raw.includes('@')) return { ok: false, reason: 'missing_email' };
  const [local, domain] = raw.split('@');
  if (!local || !domain) return { ok: false, reason: 'malformed' };
  if (domain === 'example.com' || domain.endsWith('.example')) return { ok: false, reason: 'placeholder' };
  if (CONSUMER_MAIL_DOMAINS.has(domain)) return { ok: false, reason: 'consumer_domain' };
  const localBare = local.replace(/[._-]/g, '');
  if (ROLE_LOCAL_PARTS.has(local) || ROLE_LOCAL_PARTS.has(localBare)) {
    return { ok: true, reason: `role_inbox:${local}` };
  }
  if (local.includes('.')) return { ok: false, reason: 'looks_personal' };
  return { ok: false, reason: 'not_role_inbox' };
}
