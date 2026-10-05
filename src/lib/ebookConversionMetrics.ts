import type { LeadCapture } from '../domain/leads';

export type EbookConversionPeriod = 7 | 14 | 30;

export type EbookConversionLead = {
  id: string;
  createdAt: string;
  funnelId: string;
  funnelPath?: string;
  offer?: string;
  phone?: string;
  email?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  referralCode?: string;
  source?: string;
};

export type EbookFunnelRow = {
  funnelId: string;
  label: string;
  path: string;
  featured: boolean;
  captures: number;
  withPhone: number;
  phonePct: number;
  withUtmOrRef: number;
  utmPct: number;
};

export type EbookUtmRow = {
  key: string;
  captures: number;
};

export type EbookConversionSnapshot = {
  periodDays: EbookConversionPeriod;
  total: number;
  withPhone: number;
  phonePct: number;
  withUtmOrRef: number;
  featuredTotal: number;
  freeGuide: number;
  kreyolGuide: number;
  otherMagnets: number;
  byFunnel: EbookFunnelRow[];
  utmRows: EbookUtmRow[];
};

const FEATURED_FUNNEL_IDS = new Set(['credit_dispute', 'kreyol_companion']);

const FUNNEL_META: Record<string, { label: string; path: string }> = {
  credit_dispute: { label: 'Free dispute letter guide', path: '/free-guide' },
  kreyol_companion: { label: 'Credit kits — Haitian community', path: '/free-kreyol-guide' },
  debt_freedom: { label: 'Free debt validation guide', path: '/free-debt-guide' },
  business_credit: { label: 'Free business credit guide', path: '/free-business-guide' },
  tradeline_insider: { label: 'Free tradeline insider guide', path: '/free-tradeline-guide' },
  score_roadmap: { label: '72-hour credit score roadmap', path: '/free-score-roadmap' },
  agency_white_label: { label: 'Free agency and white-label guide', path: '/free-agency-guide' },
  credit_specialist_guide: { label: 'Free Credit Specialist playbook', path: '/credit-specialist-guide' },
  specialist_apply: { label: 'Join as a Credit Specialist', path: '/credit-specialist-apply' },
  affiliate_toolkit: { label: 'Free affiliate toolkit', path: '/affiliate-toolkit' },
  partner_refer: { label: 'Partner referral — credit restore', path: '/partners/refer' },
  other: { label: 'Other magnets / untagged', path: '' },
};

const PATH_TO_FUNNEL: Record<string, string> = Object.fromEntries(
  Object.entries(FUNNEL_META).filter(([, m]) => m.path).map(([id, m]) => [m.path, id]),
);

const OFFER_TO_FUNNEL: Record<string, string> = {
  dispute_letter_guide: 'credit_dispute',
  haitian_credit_kit: 'kreyol_companion',
  kreyol_companion_kit: 'kreyol_companion',
  debt_validation_playbook: 'debt_freedom',
  business_credit_jumpstart: 'business_credit',
  primary_tradeline_insider: 'tradeline_insider',
  score_roadmap: 'score_roadmap',
  agency_white_label_kit: 'agency_white_label',
  affiliate_toolkit: 'affiliate_toolkit',
  partner_referral: 'partner_refer',
  credit_specialist_guide: 'credit_specialist_guide',
  credit_specialist_join: 'specialist_apply',
};

export function funnelLabel(funnelId: string): string {
  return FUNNEL_META[funnelId]?.label ?? funnelId.replace(/_/g, ' ');
}

export function funnelPathForId(funnelId: string): string {
  return FUNNEL_META[funnelId]?.path ?? '';
}

export function resolveEbookFunnelId(lead: {
  funnelId?: string | null;
  funnelPath?: string | null;
  offer?: string | null;
}): string {
  const explicit = (lead.funnelId || '').trim();
  if (explicit) return explicit;
  const path = (lead.funnelPath || '').trim();
  if (path) {
    const exact = PATH_TO_FUNNEL[path];
    if (exact) return exact;
    const prefix = Object.entries(PATH_TO_FUNNEL).find(([p]) => path === p || path.startsWith(`${p}/`));
    if (prefix) return prefix[1];
  }
  const offer = (lead.offer || '').trim();
  if (offer && OFFER_TO_FUNNEL[offer]) return OFFER_TO_FUNNEL[offer];
  return 'other';
}

export function hasPhoneValue(phone?: string | null): boolean {
  return String(phone || '').replace(/\D/g, '').length >= 10;
}

export function hasUtmOrRef(lead: {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  referralCode?: string | null;
}): boolean {
  return Boolean(
    lead.utmSource?.trim() ||
      lead.utmMedium?.trim() ||
      lead.utmCampaign?.trim() ||
      lead.utmContent?.trim() ||
      lead.referralCode?.trim(),
  );
}

export function utmKey(lead: {
  utmSource?: string | null;
  utmCampaign?: string | null;
  referralCode?: string | null;
}): string {
  const src = lead.utmSource?.trim();
  const camp = lead.utmCampaign?.trim();
  const ref = lead.referralCode?.trim();
  if (src && camp) return `${src} / ${camp}`;
  if (src) return src;
  if (ref) return `ref:${ref}`;
  if (camp) return camp;
  return '(none)';
}

export function toEbookConversionLead(lead: LeadCapture): EbookConversionLead {
  return {
    id: lead.id,
    createdAt: lead.createdAt,
    funnelId: resolveEbookFunnelId(lead),
    funnelPath: lead.funnelPath,
    offer: lead.offer,
    phone: lead.phone,
    email: lead.email,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    utmContent: lead.utmContent,
    referralCode: lead.referralCode,
    source: lead.source,
  };
}

export function mergeEbookConversionLeads(
  local: EbookConversionLead[],
  remote: EbookConversionLead[],
): EbookConversionLead[] {
  const byId = new Map<string, EbookConversionLead>();
  for (const lead of [...remote, ...local]) {
    if (!lead.id) continue;
    if (!byId.has(lead.id)) byId.set(lead.id, lead);
  }
  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function buildEbookConversionSnapshot(
  leads: EbookConversionLead[],
  periodDays: EbookConversionPeriod,
  nowMs = Date.now(),
): EbookConversionSnapshot {
  const cutoff = nowMs - periodDays * 24 * 60 * 60 * 1000;
  const windowed = leads.filter((l) => {
    const t = Date.parse(l.createdAt);
    return Number.isFinite(t) && t >= cutoff;
  });

  const groups = new Map<string, EbookConversionLead[]>();
  for (const lead of windowed) {
    const id = lead.funnelId || 'other';
    const list = groups.get(id) ?? [];
    list.push(lead);
    groups.set(id, list);
  }

  const featuredOrder = ['credit_dispute', 'kreyol_companion'];
  const rest = Array.from(groups.keys()).filter((id) => !FEATURED_FUNNEL_IDS.has(id));
  rest.sort((a, b) => (groups.get(b)?.length ?? 0) - (groups.get(a)?.length ?? 0) || a.localeCompare(b));

  const byFunnel: EbookFunnelRow[] = [...featuredOrder, ...rest].map((funnelId) => {
    const list = groups.get(funnelId) ?? [];
    const withPhone = list.filter((l) => hasPhoneValue(l.phone)).length;
    const withUtmOrRefCount = list.filter((l) => hasUtmOrRef(l)).length;
    return {
      funnelId,
      label: funnelLabel(funnelId),
      path: funnelPathForId(funnelId),
      featured: FEATURED_FUNNEL_IDS.has(funnelId),
      captures: list.length,
      withPhone,
      phonePct: pct(withPhone, list.length),
      withUtmOrRef: withUtmOrRefCount,
      utmPct: pct(withUtmOrRefCount, list.length),
    };
  });

  const utmMap = new Map<string, number>();
  for (const lead of windowed) {
    const key = utmKey(lead);
    utmMap.set(key, (utmMap.get(key) ?? 0) + 1);
  }
  const utmRows = Array.from(utmMap.entries())
    .map(([key, captures]) => ({ key, captures }))
    .sort((a, b) => {
      if (a.key === '(none)') return 1;
      if (b.key === '(none)') return -1;
      return b.captures - a.captures || a.key.localeCompare(b.key);
    })
    .slice(0, 12);

  const withPhone = windowed.filter((l) => hasPhoneValue(l.phone)).length;
  const withUtmOrRefCount = windowed.filter((l) => hasUtmOrRef(l)).length;
  const freeGuide = groups.get('credit_dispute')?.length ?? 0;
  const kreyolGuide = groups.get('kreyol_companion')?.length ?? 0;
  const featuredTotal = freeGuide + kreyolGuide;

  return {
    periodDays,
    total: windowed.length,
    withPhone,
    phonePct: pct(withPhone, windowed.length),
    withUtmOrRef: withUtmOrRefCount,
    featuredTotal,
    freeGuide,
    kreyolGuide,
    otherMagnets: Math.max(0, windowed.length - featuredTotal),
    byFunnel,
    utmRows,
  };
}
