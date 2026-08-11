/**
 * Dedupe-safe CRM persist for Marketing Desk approve / auto-approve.
 * Shared by Find Review and (A2) smart qualify — never create duplicate prospects.
 */
import {
  addProspectNote,
  createProspect,
  findProspectByWebsite,
  listProspects,
  patchProspect,
} from '../../data/crmProspectsRepo';
import type { Prospect } from '../../domain/crmProspects';
import {
  HUNT_LANE_PRESETS,
  buildOutreachCopyPack,
  nextActionForImport,
  type LeadEngineLane,
} from '../leadIntel/leadEngineAutonomy';
import { enrollColdProspectMail, enrollInviteOptInMail, type MailEnrollResult } from './marketingDeskMail';
import { createReviewImportsTask } from './marketingDeskTasks';
import { ensureMarketingPipelineProject } from './marketingDeskProjects';
import {
  consentForMarketingDeskHit,
  prospectAllowsColdEmail,
  type MarketingConsentSnapshot,
} from './marketingProspectConsent';
import type { ProspectConsentBasis, ProspectLeadType } from '../../domain/crmProspects';

export type MarketingPersistHit = {
  url: string;
  title?: string;
  domain?: string;
  snippet?: string;
  score: number;
  emails?: string[];
  phones?: string[];
  industry?: string;
  intentTier?: string;
  confidence?: number;
  meta?: { description?: string };
  whyNote?: string;
  consentBasis?: ProspectConsentBasis;
  leadType?: ProspectLeadType;
  emailMarketingAllowed?: boolean;
};

export type MarketingPersistResult = {
  ok: boolean;
  prospectId?: string;
  deduped: boolean;
  mailEnrolled: boolean;
  message: string;
};

function normEmail(e: string) {
  return e.trim().toLowerCase();
}

function domainFromUrl(url: string, domain?: string): string {
  if (domain?.trim()) return domain.trim().toLowerCase().replace(/^www\./, '');
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Find existing prospect by website, email, or company domain. */
export function findExistingMarketingProspect(hit: MarketingPersistHit): Prospect | null {
  const byWeb = findProspectByWebsite(hit.url);
  if (byWeb) return byWeb;

  const emails = (hit.emails ?? []).map(normEmail).filter((e) => e.includes('@'));
  if (emails.length) {
    const byEmail = listProspects().find((p) =>
      (p.contact?.emails ?? []).some((e) => emails.includes(normEmail(e))),
    );
    if (byEmail) return byEmail;
  }

  const domain = domainFromUrl(hit.url, hit.domain);
  if (domain) {
    const byDomain = listProspects().find((p) => {
      const d = (p.company?.domain || '').toLowerCase().replace(/^www\./, '');
      if (d && d === domain) return true;
      const web = (p.company?.website || '').toLowerCase();
      return web.includes(domain);
    });
    if (byDomain) return byDomain;
  }

  return null;
}

function mergeConsentOnProspect(
  existing: Prospect | null,
  incoming: MarketingConsentSnapshot,
): MarketingConsentSnapshot {
  if (existing && prospectAllowsColdEmail(existing)) {
    return {
      consentBasis: existing.consentBasis ?? incoming.consentBasis,
      leadType: existing.leadType ?? incoming.leadType,
      emailMarketingAllowed: true,
    };
  }
  return incoming;
}

function shouldAttemptMailEnrollment(enrollMail: boolean | undefined, consent: MarketingConsentSnapshot): boolean {
  if (enrollMail === false) return false;
  if (enrollMail === true) return true;
  return consent.emailMarketingAllowed;
}

function mailEnrollNote(mail: MailEnrollResult, consent: MarketingConsentSnapshot, hasEmail: boolean): string {
  if (mail.enrolled) {
    return consent.emailMarketingAllowed
      ? 'Cold mail sequence enrolled.'
      : 'Link-first opt-in invite queued (no cold consent).';
  }
  if (mail.fallbackTask) {
    if (mail.reason === 'cold_autopilot_off') {
      return 'Saved — cold mail gated (coldOutboundAutopilot off; link-first invite or manual outreach).';
    }
    if (mail.reason === 'needs_setup') {
      return 'Saved — follow-up to-do created (mail not Ready).';
    }
    if (mail.reason === 'no_email') {
      return 'Saved to CRM — add email before mail enroll.';
    }
    return consent.emailMarketingAllowed
      ? 'Saved — follow-up to-do created (cold mail not Ready).'
      : 'Saved — link-first to-do (mail not Ready).';
  }
  if (!consent.emailMarketingAllowed) {
    return 'Saved to CRM — discovered lead; cold mail gated.';
  }
  if (!hasEmail) {
    return 'Saved to CRM — add email before mail enroll.';
  }
  return 'Saved to CRM.';
}

/**
 * Upsert CRM prospect + enroll cold mail (or nurture to-do fallback).
 * Call after human Approve or smart auto-approve. Idempotent on website/email/domain.
 */
export function persistApprovedMarketingHit(args: {
  hit: MarketingPersistHit;
  lane?: LeadEngineLane | string;
  sourceNote?: string;
  pendingReviewLeft?: number;
  enrollMail?: boolean;
}): MarketingPersistResult {
  ensureMarketingPipelineProject();

  const lane = (args.lane ?? 'business_credit') as LeadEngineLane;
  const preset = HUNT_LANE_PRESETS.find((p) => p.id === lane) ?? HUNT_LANE_PRESETS[0];
  const tags = Array.from(
    new Set(['lead-intel', 'lead-engine', 'marketing-desk', 'lead_engine', lane, ...(preset?.tags ?? [])]),
  );
  const hit = args.hit;
  const nextAction = nextActionForImport({
    lane,
    score: hit.score,
    intentTier: hit.intentTier,
    hasEmail: (hit.emails?.length ?? 0) > 0,
  });
  const pack = buildOutreachCopyPack({ lane, companyName: hit.title, website: hit.url });
  const notePrefix = args.sourceNote || '[Marketing Desk] Approved';
  const domain = domainFromUrl(hit.url, hit.domain) || undefined;
  const baseConsent = consentForMarketingDeskHit({
    source: 'lead_intel_search',
    emails: hit.emails,
    consentBasis: hit.consentBasis,
    leadType: hit.leadType,
    emailMarketingAllowed: hit.emailMarketingAllowed,
  });

  const existing = findExistingMarketingProspect(hit);
  const consent = mergeConsentOnProspect(existing, baseConsent);
  let prospectId: string;
  let deduped = false;

  if (existing) {
    deduped = true;
    patchProspect(existing.id, {
      score: Math.max(existing.score ?? 0, hit.score),
      tags: Array.from(new Set([...(existing.tags ?? []), ...tags])),
      nextAction,
      consentBasis: consent.consentBasis,
      leadType: consent.leadType,
      emailMarketingAllowed: consent.emailMarketingAllowed,
      company: {
        ...existing.company,
        website: existing.company.website ?? hit.url,
        domain: existing.company.domain ?? hit.domain ?? domain,
        name: existing.company.name ?? hit.title,
        description: existing.company.description ?? hit.meta?.description ?? hit.snippet,
      },
      contact: {
        ...existing.contact,
        emails: Array.from(new Set([...(existing.contact.emails ?? []), ...(hit.emails ?? [])])),
        phones: Array.from(new Set([...(existing.contact.phones ?? []), ...(hit.phones ?? [])])),
      },
    });
    addProspectNote(existing.id, `${notePrefix} (deduped).\n${hit.whyNote || ''}\n${pack.subject}`);
    prospectId = existing.id;
  } else {
    const created = createProspect({
      target: preset.target,
      source: 'lead_intel_search',
      score: hit.score,
      tags,
      company: {
        name: hit.title || undefined,
        website: hit.url,
        domain: hit.domain || domain,
        description: hit.meta?.description || hit.snippet || undefined,
      },
      contact: { emails: hit.emails ?? [], phones: hit.phones ?? [] },
      intel: {
        query: 'marketing-desk-find',
        position: null,
        snippet: hit.snippet ?? '',
        robotsOk: true,
        lastEnrichedAt: new Date().toISOString(),
        industry: hit.industry,
        intentTier: (hit.intentTier as 'hot' | 'warm' | 'cold' | 'unknown') || 'unknown',
        confidence: hit.confidence,
      },
    });
    patchProspect(created.id, {
      nextAction,
      consentBasis: consent.consentBasis,
      leadType: consent.leadType,
      emailMarketingAllowed: consent.emailMarketingAllowed,
    });
    addProspectNote(created.id, `${notePrefix}.\n${hit.whyNote || ''}`);
    prospectId = created.id;
  }

  if (typeof args.pendingReviewLeft === 'number' && args.pendingReviewLeft > 0) {
    createReviewImportsTask(args.pendingReviewLeft);
  }

  let mailEnrolled = false;
  const attemptMail = shouldAttemptMailEnrollment(args.enrollMail, consent);
  const hasEmail = Boolean((hit.emails?.[0] || '').trim().includes('@'));
  let mailNote = !attemptMail
    ? consent.emailMarketingAllowed
      ? 'Saved to CRM — mail skipped (auto-save only).'
      : 'Saved to CRM — discovered lead; cold mail gated.'
    : 'Saved to CRM.';

  if (attemptMail && consent.emailMarketingAllowed) {
    const mail = enrollColdProspectMail({
      prospectId,
      email: hit.emails?.[0],
      fullName: hit.title,
      lane,
    });
    mailEnrolled = mail.enrolled;
    mailNote = mailEnrollNote(mail, consent, hasEmail);
  } else if (attemptMail && hasEmail) {
    const mail = enrollInviteOptInMail({
      prospectId,
      email: hit.emails?.[0],
      fullName: hit.title,
      lane,
    });
    mailEnrolled = mail.enrolled;
    mailNote = mailEnrollNote(mail, consent, hasEmail);
  } else if (attemptMail && !hasEmail) {
    mailNote = mailEnrollNote({ enrolled: false, fallbackTask: true, reason: 'no_email' }, consent, hasEmail);
  }

  return {
    ok: true,
    prospectId,
    deduped,
    mailEnrolled,
    message: deduped ? `${mailNote} (matched existing)` : mailNote,
  };
}
