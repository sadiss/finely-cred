import type { ProspectTarget } from '../../domain/crmProspects';
import type { IntelResult } from './leadIntelModel';

/** Daily prospecting goal shown in Lead Intelligence Agent. */
export const DAILY_LEAD_TARGET = 50;

/** Default results per single query (edge max 50). */
export const DEFAULT_INTEL_LIMIT = 25;

export type DailyGrowthTemplate = {
  label: string;
  target: ProspectTarget;
  query: string;
  location?: string;
  signupIntent?: boolean;
};

/** High-intent queries aimed at people likely to sign up for free guides / portal trial. */
export const DAILY_SIGNUP_INTENT_TEMPLATES: DailyGrowthTemplate[] = [
  {
    label: 'Signup • Free credit dispute guide seekers',
    target: 'clients',
    query: 'free credit dispute letter guide download sign up',
    location: 'United States',
    signupIntent: true,
  },
  {
    label: 'Signup • Fix credit score help (high intent)',
    target: 'clients',
    query: 'how to fix credit score fast help consultation',
    location: 'United States',
    signupIntent: true,
  },
  {
    label: 'Signup • Collections / debt validation help',
    target: 'clients',
    query: 'debt validation letter help collection agency dispute',
    location: 'United States',
    signupIntent: true,
  },
  {
    label: 'Signup • Business credit + funding readiness',
    target: 'clients',
    query: 'business credit building funding readiness consultation',
    location: 'United States',
    signupIntent: true,
  },
  {
    label: 'Signup • Credit repair DIY portal',
    target: 'clients',
    query: 'credit repair software portal upload report dispute',
    location: 'United States',
    signupIntent: true,
  },
];

export function mergeIntelResults(existing: IntelResult[], incoming: IntelResult[]): IntelResult[] {
  const byUrl = new Map<string, IntelResult>();
  for (const r of [...existing, ...incoming]) {
    const prev = byUrl.get(r.url);
    if (!prev || (r.score ?? 0) > (prev.score ?? 0)) byUrl.set(r.url, r);
  }
  return Array.from(byUrl.values()).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function autoSelectHighIntent(results: IntelResult[]): Record<string, boolean> {
  const sel: Record<string, boolean> = {};
  for (const r of results) {
    sel[r.url] = (r.score ?? 0) >= 35 && ((r.emails?.length ?? 0) > 0 || (r.phones?.length ?? 0) > 0);
  }
  return sel;
}

export function recommendedSignupPath(target: ProspectTarget): string {
  if (target === 'clients') return '/free-guide';
  if (target === 'affiliates') return '/affiliate/hub';
  if (target === 'agents') return '/credit-specialist/hub';
  if (target === 'au_sellers') return '/au-seller/hub';
  if (target === 'b2b_partners') return '/free-business-guide';
  return '/start-here';
}
