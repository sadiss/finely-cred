import type { ParsedCreditReport, ParsedPersonalInfo, ReportIdentityCheck, ReportIdentityFault } from '../domain/creditReports';
import { getPartner } from '../data/partnersRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';
import { getCustomFieldValues } from '../data/customFieldValuesRepo';

function nowIso() {
  return new Date().toISOString();
}

function norm(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickReportAddress(pi?: ParsedPersonalInfo | null) {
  const list = (pi?.addresses ?? []).slice();
  if (!list.length) return null;
  const cur = list.find((a) => a.type === 'current') ?? list[0]!;
  const line1 = String(cur.line1 || '').trim() || undefined;
  const raw = String(cur.raw || '').trim() || undefined;
  const city = String(cur.city || '').trim() || undefined;
  const state = String(cur.state || '').trim() || undefined;
  const zip = String(cur.zip || '').trim() || undefined;
  const cityStateZipRaw = [city, state].filter(Boolean).join(', ').trim() + (zip ? ` ${zip}` : '');
  const cityStateZip = cityStateZipRaw.trim() || undefined;
  return { raw, line1, cityStateZip };
}

export function computeReportIdentityCheck(args: { partnerId: string; parsed?: ParsedCreditReport | null }): ReportIdentityCheck {
  const checkedAt = nowIso();
  const partner = getPartner(args.partnerId);
  const tenantId = (partner as any)?.tenantId ? String((partner as any).tenantId) : FINELY_TENANT_ID;
  const cf = getCustomFieldValues('partners', args.partnerId, tenantId);
  const v = (cf?.values ?? {}) as Record<string, any>;

  const legalFirst = String(v.legal_first_name || '').trim();
  const legalLast = String(v.legal_last_name || '').trim();
  const canonicalFullName =
    [legalFirst, legalLast].filter(Boolean).join(' ').trim() ||
    String((partner as any)?.profile?.fullName || '').trim() ||
    undefined;

  const address1 = String(v.address1 || '').trim();
  const address2 = String(v.address2 || '').trim();
  const city = String(v.city || '').trim();
  const state = String(v.state || '').trim();
  const postal = String(v.postal_code || v.postalCode || '').trim();

  const canonicalAddressLine1 = ([address1, address2].filter(Boolean).join(', ').trim() || undefined) as string | undefined;
  const canonicalCityStateZipRaw = [city, state].filter(Boolean).join(', ').trim() + (postal ? ` ${postal}` : '');
  const canonicalCityStateZip = canonicalCityStateZipRaw.trim() || undefined;

  const pi = args.parsed?.personalInfo ?? null;
  const reportName = String(pi?.fullName || '').trim() || undefined;
  const ra = pickReportAddress(pi);

  const faults: ReportIdentityFault[] = [];

  if (!pi || (!reportName && !(pi.addresses ?? []).length && !(pi.raw ?? []).length)) {
    faults.push({
      kind: 'missing_report_personal_info',
      severity: 'info',
      message: 'Personal Information section was not detected in this report export (name/address validation may be limited).',
    });
  }

  if (!canonicalAddressLine1 || !canonicalCityStateZip) {
    faults.push({
      kind: 'missing_partner_mailing_address',
      severity: 'warn',
      message: 'Partner mailing address is incomplete. Add address fields so Letters can auto-fill correctly.',
    });
  }

  if (canonicalFullName && reportName) {
    const a = norm(canonicalFullName);
    const b = norm(reportName);
    if (a && b && a !== b) {
      const aLast = a.split(' ').at(-1) ?? '';
      const bLast = b.split(' ').at(-1) ?? '';
      const lastMismatch = Boolean(aLast && bLast && aLast !== bLast);
      const severe = lastMismatch;
      faults.push({
        kind: 'name_mismatch',
        severity: severe ? 'warn' : 'info',
        message: `Report name "${reportName}" does not match your profile name "${canonicalFullName}".`,
      });
    }
  }

  if (canonicalAddressLine1 && canonicalCityStateZip && (ra?.line1 || ra?.cityStateZip)) {
    const c1 = norm(canonicalAddressLine1);
    const c2 = norm(canonicalCityStateZip);
    const r1 = norm(ra?.line1 || '');
    const r2 = norm(ra?.cityStateZip || '');
    const lineMismatch = c1 && r1 && !r1.includes(c1) && !c1.includes(r1);
    const cityMismatch = c2 && r2 && !r2.includes(c2) && !c2.includes(r2);
    if (lineMismatch || cityMismatch) {
      faults.push({
        kind: 'address_mismatch',
        severity: 'warn',
        message: 'Report address does not match your saved mailing address. Confirm your address before generating letters.',
      });
    }
  }

  return {
    checkedAt,
    canonical: {
      fullName: canonicalFullName,
      addressLine1: canonicalAddressLine1,
      cityStateZip: canonicalCityStateZip,
    },
    report: {
      fullName: reportName,
      addressRaw: ra?.raw,
      addressLine1: ra?.line1,
      cityStateZip: ra?.cityStateZip,
    },
    faults,
  };
}

