import type {
  IdentityFaultKind,
  ParsedCreditReport,
  ParsedPersonalInfo,
  ReportIdentityCheck,
  ReportIdentityFault,
} from '../domain/creditReports';
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

export function identityFaultTitle(kind: IdentityFaultKind): string {
  if (kind === 'name_mismatch') return 'Name mismatch on report';
  if (kind === 'address_mismatch') return 'Address mismatch on report';
  if (kind === 'ssn_mismatch') return 'SSN last-4 mismatch';
  if (kind === 'employer_mismatch') return 'Employer mismatch on report';
  if (kind === 'file_frozen') return 'Security freeze on file';
  if (kind === 'fraud_alert') return 'Fraud alert on file';
  if (kind === 'missing_partner_mailing_address') return 'Mailing address incomplete';
  return 'Personal information limited';
}

function last4(value?: string | null): string {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : '';
}

function collectSectionText(section?: { title?: string; key?: string; items?: { fields?: Record<string, string> }[]; rows?: { label?: string; byBureau?: Record<string, string> }[]; table?: { columns?: string[]; rows?: string[][] } } | null) {
  if (!section) return [] as string[];
  const chunks: string[] = [section.title || '', section.key || ''];
  for (const item of section.items ?? []) {
    chunks.push(...Object.values(item.fields ?? {}));
  }
  for (const row of section.rows ?? []) {
    chunks.push(row.label || '', ...Object.values(row.byBureau ?? {}));
  }
  if (section.table) {
    chunks.push(...(section.table.columns ?? []));
    for (const row of section.table.rows ?? []) chunks.push(...row);
  }
  return chunks;
}

function scanReportIdentityFlags(parsed?: ParsedCreditReport | null, extraText?: string): { frozen: boolean; fraudAlert: boolean } {
  const chunks: string[] = [];
  const pi = parsed?.personalInfo;
  if (pi?.raw?.length) {
    for (const row of pi.raw) chunks.push(`${row.label} ${row.value}`);
  }
  for (const section of parsed?.sections ?? []) chunks.push(...collectSectionText(section));
  for (const section of parsed?.unclassifiedSections ?? []) chunks.push(...collectSectionText(section));
  if (extraText) chunks.push(extraText);
  const blob = chunks.join(' ').toLowerCase();
  return {
    frozen: /security freeze|file (is )?frozen|credit freeze|freeze on (this )?file|frozen file/.test(blob),
    fraudAlert: /fraud alert|extended (fraud )?alert|active duty alert|identity theft alert|initial fraud alert/.test(blob),
  };
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

export function computeReportIdentityCheck(args: {
  partnerId: string;
  parsed?: ParsedCreditReport | null;
  extraText?: string;
}): ReportIdentityCheck {
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

  const routeKey = (partner as any)?.primaryRoute as string | undefined;
  const routePersonal = routeKey && (partner as any)?.routes?.[routeKey]?.personal ? (partner as any).routes[routeKey].personal : {};
  const canonicalSsnLast4 =
    last4(v.ssn_last4) || last4(routePersonal?.ssnLast4) || undefined;
  const canonicalEmployer =
    String(v.employer || v.current_employer || v.employer_name || '').trim() || undefined;

  const pi = args.parsed?.personalInfo ?? null;
  const reportName = String(pi?.fullName || '').trim() || undefined;
  const ra = pickReportAddress(pi);
  const reportSsnLast4 = last4(pi?.ssnMasked) || undefined;
  const reportEmployer = String(pi?.employer || '').trim() || undefined;
  const flags = scanReportIdentityFlags(args.parsed, args.extraText);

  const faults: ReportIdentityFault[] = [];

  if (!pi || (!reportName && !(pi.addresses ?? []).length && !(pi.raw ?? []).length)) {
    faults.push({
      kind: 'missing_report_personal_info',
      severity: 'info',
      message: 'Personal information was not detected in this report export (name and address checks may be limited).',
    });
  }

  if (!canonicalAddressLine1 || !canonicalCityStateZip) {
    faults.push({
      kind: 'missing_partner_mailing_address',
      severity: 'warn',
      message: 'Your mailing address is incomplete. Add it so letters can auto-fill correctly.',
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
        message: `This report shows "${reportName}", which does not match your profile name "${canonicalFullName}".`,
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
        message: 'This report address does not match your saved mailing address. Confirm your address before generating letters.',
      });
    }
  }

  if (canonicalSsnLast4 && reportSsnLast4 && canonicalSsnLast4 !== reportSsnLast4) {
    faults.push({
      kind: 'ssn_mismatch',
      severity: 'warn',
      message: `This report’s SSN last four (${reportSsnLast4}) does not match the last four on your profile (${canonicalSsnLast4}).`,
    });
  }

  if (canonicalEmployer && reportEmployer && norm(canonicalEmployer) !== norm(reportEmployer)) {
    faults.push({
      kind: 'employer_mismatch',
      severity: 'info',
      message: `This report lists employer "${reportEmployer}", which does not match "${canonicalEmployer}" on your profile.`,
    });
  }

  if (flags.frozen) {
    faults.push({
      kind: 'file_frozen',
      severity: 'warn',
      message: 'This report shows a security freeze. Bureaus typically will not process disputes or new credit until you lift the freeze.',
    });
  }

  if (flags.fraudAlert) {
    faults.push({
      kind: 'fraud_alert',
      severity: 'warn',
      message: 'This report shows a fraud or identity-theft alert. Confirm it is yours before sending letters.',
    });
  }

  return {
    checkedAt,
    canonical: {
      fullName: canonicalFullName,
      addressLine1: canonicalAddressLine1,
      cityStateZip: canonicalCityStateZip,
      ssnLast4: canonicalSsnLast4,
      employer: canonicalEmployer,
    },
    report: {
      fullName: reportName,
      addressRaw: ra?.raw,
      addressLine1: ra?.line1,
      cityStateZip: ra?.cityStateZip,
      ssnLast4: reportSsnLast4,
      employer: reportEmployer,
      fileFrozen: flags.frozen || undefined,
      fraudAlert: flags.fraudAlert || undefined,
    },
    faults,
  };
}

