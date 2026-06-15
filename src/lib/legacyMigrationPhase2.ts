import type { LegacyPartnerExportV1 } from '../domain/imports';
import { parseInsertRows, type LegacySqlRow } from './legacySqlParser';

export type LegacyLetterMeta = {
  externalId: string;
  title?: string;
  bodyHtml?: string;
  bureau?: string;
  createdAt?: string;
};

export type LegacyBusinessMeta = {
  businessName?: string;
  ein?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  naics?: string;
  profileType?: number;
};

export type LegacyReferralSeed = {
  externalId: string;
  affiliateEmail?: string;
  referralCode?: string;
  partnerEmail?: string;
  createdAt?: string;
};

export type LegacyPhase2Summary = {
  templateCount: number;
  templateTypeCount: number;
  letterRows: number;
  businessRows: number;
  referralRows: number;
  accountHistoryRows: number;
};

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function rowPartnerId(row: LegacySqlRow): string {
  return str(row.partner_id) || str(row.user_id) || str(row.uid) || str(row.file_id);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function summarizeLegacyPhase2FromSql(sql: string): LegacyPhase2Summary {
  return {
    templateCount: parseInsertRows(sql, 'templates').length,
    templateTypeCount: parseInsertRows(sql, 'template_types').length,
    letterRows: parseInsertRows(sql, 'generate_letter').length,
    businessRows: parseInsertRows(sql, 'business_info').length,
    referralRows: parseInsertRows(sql, 'referral_logs').length + parseInsertRows(sql, 'subadmin_referral_details').length,
    accountHistoryRows: parseInsertRows(sql, 'account_history').length,
  };
}

export function buildLegacyLettersForPartner(uid: string, rows: LegacySqlRow[]): LegacyLetterMeta[] {
  const out: LegacyLetterMeta[] = [];
  for (const g of rows) {
    const pid = rowPartnerId(g);
    if (pid !== uid) continue;
    const html = str(g.letter_html) || str(g.html) || str(g.letter) || str(g.content);
    if (!html) continue;
    const id = str(g.id) || `letter:${out.length}`;
    out.push({
      externalId: `laravel:letter:${id}`,
      title: str(g.title) || str(g.subject) || 'Legacy dispute letter',
      bodyHtml: html.slice(0, 120_000),
      bureau: str(g.bureau) || str(g.credit_bureau) || undefined,
      createdAt: str(g.created_at) || str(g.date_created) || undefined,
    });
  }
  return out;
}

export function buildLegacyBusinessForPartner(uid: string, rows: LegacySqlRow[]): LegacyBusinessMeta | undefined {
  const row = rows.find((b) => rowPartnerId(b) === uid);
  if (!row) return undefined;
  return {
    businessName: str(row.business_name) || str(row.company_name) || str(row.name) || undefined,
    ein: str(row.ein) || str(row.ein_number) || undefined,
    address: str(row.address) || str(row.street) || undefined,
    city: str(row.city) || undefined,
    state: str(row.state) || undefined,
    postalCode: str(row.zip) || str(row.zip_code) || str(row.postal_code) || undefined,
    naics: str(row.naics) || undefined,
    profileType: Number(row.profile_type) || undefined,
  };
}

export function buildLegacyReferralSeedsFromSql(sql: string): LegacyReferralSeed[] {
  const seeds: LegacyReferralSeed[] = [];
  for (const r of parseInsertRows(sql, 'referral_logs')) {
    seeds.push({
      externalId: `laravel:referral:${str(r.id) || seeds.length}`,
      affiliateEmail: str(r.affiliate_email) || str(r.email) || undefined,
      referralCode: str(r.referral_code) || str(r.code) || undefined,
      partnerEmail: str(r.partner_email) || str(r.client_email) || undefined,
      createdAt: str(r.created_at) || undefined,
    });
  }
  for (const r of parseInsertRows(sql, 'subadmin_referral_details')) {
    seeds.push({
      externalId: `laravel:subadmin_ref:${str(r.id) || seeds.length}`,
      affiliateEmail: str(r.subadmin_email) || str(r.email) || undefined,
      referralCode: str(r.referral_code) || undefined,
      partnerEmail: str(r.partner_email) || undefined,
      createdAt: str(r.created_at) || undefined,
    });
  }
  return seeds;
}

/** Attach Phase 2 metadata to partner export rows (letters, business lane). */
export function enrichLegacyExportPhase2(sql: string, exportData: LegacyPartnerExportV1): LegacyPartnerExportV1 {
  const generateLetters = parseInsertRows(sql, 'generate_letter');
  const businessInfo = parseInsertRows(sql, 'business_info');
  const accountHistory = parseInsertRows(sql, 'account_history');
  const historyByPartner = new Map<string, number>();
  for (const h of accountHistory) {
    const pid = rowPartnerId(h);
    if (!pid) continue;
    historyByPartner.set(pid, (historyByPartner.get(pid) ?? 0) + 1);
  }

  const partners = exportData.partners.map((p) => {
    const uid = str((p.journeySignals as any)?.legacyUserId);
    if (!uid) return p;
    const legacyLetters = buildLegacyLettersForPartner(uid, generateLetters);
    const legacyBusiness = buildLegacyBusinessForPartner(uid, businessInfo);
    const tradelineHistoryCount = historyByPartner.get(uid) ?? 0;
    return {
      ...p,
      legacyLetters: legacyLetters.length ? legacyLetters : p.legacyLetters,
      legacyBusiness: legacyBusiness ?? p.legacyBusiness,
      journeySignals: {
        ...(p.journeySignals ?? {}),
        legacyTradelineHistoryCount: tradelineHistoryCount || undefined,
        legacyPhase2EnrichedAt: new Date().toISOString(),
      },
      primaryRoute: legacyBusiness ? ('business_build' as const) : p.primaryRoute,
      lane: legacyBusiness ? ('business_credit' as const) : p.lane,
    };
  });

  return { ...exportData, partners };
}

export function legacyLetterBodyPlain(meta: LegacyLetterMeta): string {
  if (!meta.bodyHtml) return meta.title ?? 'Legacy letter (re-import HTML from old server if needed).';
  const plain = stripHtml(meta.bodyHtml);
  return plain.slice(0, 24_000) || meta.title || 'Legacy dispute letter';
}
