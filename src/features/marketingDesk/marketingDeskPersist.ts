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
import { enrollColdProspectMail } from './marketingDeskMail';
import { createReviewImportsTask } from './marketingDeskTasks';
import { ensureMarketingPipelineProject } from './marketingDeskProjects';

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

  const existing = findExistingMarketingProspect(hit);
  let prospectId: string;
  let deduped = false;

  if (existing) {
    deduped = true;
    patchProspect(existing.id, {
      score: Math.max(existing.score ?? 0, hit.score),
      tags: Array.from(new Set([...(existing.tags ?? []), ...tags])),
      nextAction,
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
    patchProspect(created.id, { nextAction });
    addProspectNote(created.id, `${notePrefix}.\n${hit.whyNote || ''}`);
    prospectId = created.id;
  }

  if (typeof args.pendingReviewLeft === 'number' && args.pendingReviewLeft > 0) {
    createReviewImportsTask(args.pendingReviewLeft);
  }

  let mailEnrolled = false;
  let mailNote = 'Saved to CRM.';
  if (args.enrollMail !== false) {
    const mail = enrollColdProspectMail({
      prospectId,
      email: hit.emails?.[0],
      fullName: hit.title,
      lane,
    });
    mailEnrolled = mail.enrolled;
    mailNote = mail.enrolled
      ? 'Cold mail sequence enrolled.'
      : mail.fallbackTask
        ? 'Saved — follow-up to-do created (mail not Ready).'
        : 'Saved to CRM.';
  }

  return {
    ok: true,
    prospectId,
    deduped,
    mailEnrolled,
    message: deduped ? `${mailNote} (matched existing)` : mailNote,
  };
}
