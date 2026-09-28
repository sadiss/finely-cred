import { COLD_DIRECTORY_TAG, COLD_NO_CONSENT_TAG, isPublicOrganizationRoleInbox, type ColdLaneTag } from './coldDirectory';
import type { Prospect, ProspectTarget } from '../domain/crmProspects';
import { createProspect, listProspects } from '../data/crmProspectsRepo';
import { recordEngagementEvent } from '../data/crmEngagementRepo';

export type ColdImportRow = {
  organization?: string;
  website?: string;
  email?: string;
  lane?: ColdLaneTag | string;
  sourceUrl?: string;
  collectedAt?: string;
};

export type ColdImportDryRun = {
  insert: number;
  update: number;
  skip: number;
  conflict: number;
  quarantine: number;
  reasons: Record<string, number>;
};

function normEmail(email?: string) {
  return (email ?? '').trim().toLowerCase();
}

function normSite(site?: string) {
  return (site ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function bump(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export function dryRunColdProspectImport(rows: ColdImportRow[]): ColdImportDryRun {
  const existing = listProspects();
  const byEmail = new Map(existing.flatMap((p) => (p.contact.emails ?? []).map((e) => [normEmail(e), p] as const)));
  const bySite = new Map(
    existing
      .map((p) => [normSite(p.company.website || p.company.domain), p] as const)
      .filter(([site]) => Boolean(site)),
  );
  const seen = new Set<string>();
  const out: ColdImportDryRun = { insert: 0, update: 0, skip: 0, conflict: 0, quarantine: 0, reasons: {} };

  for (const row of rows) {
    const email = normEmail(row.email);
    const site = normSite(row.website || row.sourceUrl);
    const key = email || site;
    if (!key) {
      out.quarantine += 1;
      bump(out.reasons, 'missing_identity');
      continue;
    }
    if (seen.has(key)) {
      out.skip += 1;
      bump(out.reasons, 'duplicate_in_batch');
      continue;
    }
    seen.add(key);

    if (email) {
      const inbox = isPublicOrganizationRoleInbox(email);
      if (!inbox.ok) {
        out.quarantine += 1;
        bump(out.reasons, inbox.reason);
        continue;
      }
    }

    const hit = (email && byEmail.get(email)) || (site && bySite.get(site)) || null;
    if (hit && email && byEmail.get(email) && site && bySite.get(site) && byEmail.get(email) !== bySite.get(site)) {
      out.conflict += 1;
      bump(out.reasons, 'email_website_mismatch');
      continue;
    }
    if (hit) {
      out.update += 1;
      bump(out.reasons, 'existing_prospect');
    } else {
      out.insert += 1;
      bump(out.reasons, 'new_prospect');
    }
  }
  return out;
}

function targetFromLane(lane?: string): ProspectTarget {
  if (lane === 'affiliates') return 'affiliates';
  if (lane === 'specialists' || lane === 'jobs') return 'agents';
  return 'b2b_partners';
}

/** Idempotent prospect upsert. Never consent, never nurture. */
export function importColdProspects(rows: ColdImportRow[]): { imported: number; updated: number; skipped: number } {
  const preview = dryRunColdProspectImport(rows);
  const existing = listProspects();
  let imported = 0;
  let updated = 0;
  for (const row of rows) {
    const email = normEmail(row.email);
    const site = normSite(row.website || row.sourceUrl);
    if (!email && !site) continue;
    if (email && !isPublicOrganizationRoleInbox(email).ok) continue;
    const hit =
      existing.find((p) => email && (p.contact.emails ?? []).map(normEmail).includes(email)) ||
      existing.find((p) => site && normSite(p.company.website || p.company.domain) === site);
    if (hit) {
      updated += 1;
      continue;
    }
    const prospect: Prospect = createProspect({
      target: targetFromLane(row.lane),
      source: 'directory_cold',
      tags: [COLD_DIRECTORY_TAG, COLD_NO_CONSENT_TAG, 'public-org', ...(row.lane ? [row.lane] : [])],
      company: { name: row.organization, website: row.website || row.sourceUrl },
      contact: { emails: email ? [email] : [] },
      consentBasis: 'discovered_no_consent',
      leadType: 'discovered',
      emailMarketingAllowed: false,
      outreachStage: 'cold_imported',
    });
    markColdProspectImported(prospect.id);
    imported += 1;
  }
  void preview;
  return { imported, updated, skipped: preview.skip + preview.quarantine };
}

export function markColdProspectImported(prospectId: string) {
  recordEngagementEvent({ prospectId, eventType: 'imported', source: 'directory_cold', actor: 'import' });
}
