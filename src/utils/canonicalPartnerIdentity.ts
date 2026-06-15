import type { Partner } from '../domain/partners';
import type { ParsedPersonalInfo } from '../domain/creditReports';
import { getCustomFieldValues } from '../data/customFieldValuesRepo';
import { FINELY_TENANT_ID } from '../domain/tenants';

function safeText(v: any) {
  const s = String(v ?? '').trim();
  return s || '';
}

export type CanonicalPartnerIdentity = {
  fullName: string;
  phone?: string;

  /** Mailing address pieces (letters) */
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  /** Convenience display/letter header lines */
  addressLine1?: string;
  cityStateZip?: string;
};

export function getCanonicalPartnerIdentity(args: {
  partner: Partner;
  tenantId?: string;
  /** Optional preloaded custom field values for partners scope. */
  partnerCf?: ReturnType<typeof getCustomFieldValues> | null;
  /** Optional report personal info (best-effort fallback). */
  reportPersonalInfo?: ParsedPersonalInfo | null;
}): CanonicalPartnerIdentity {
  const tenantId = safeText(args.tenantId) || safeText((args.partner as any)?.tenantId) || FINELY_TENANT_ID;
  const cf = args.partnerCf ?? getCustomFieldValues('partners', args.partner.id, tenantId);
  const v = (cf?.values ?? {}) as Record<string, any>;

  const legalFirst = safeText(v.legal_first_name);
  const legalLast = safeText(v.legal_last_name);
  const legal = [legalFirst, legalLast].filter(Boolean).join(' ').trim();
  const reportName = safeText((args.reportPersonalInfo as any)?.fullName);
  const fullName = legal || safeText(args.partner.profile.fullName) || reportName || 'Your Full Legal Name';

  const personal = (args.partner.routes?.[args.partner.primaryRoute || 'personal_restore'] as any)?.personal ?? {};
  const pi = args.reportPersonalInfo as any;
  const piAddr = Array.isArray(pi?.addresses) ? (pi.addresses.find((a: any) => a?.type === 'current') ?? pi.addresses[0]) : null;

  // Prefer custom-field “letters canonical” address first (admin-set), then route intake, then report PI.
  const address1 = safeText(v.address1) || safeText(personal.address1) || safeText(piAddr?.line1) || safeText(piAddr?.raw);
  const address2 = safeText(v.address2) || safeText(personal.address2);
  const city = safeText(v.city) || safeText(personal.city) || safeText(piAddr?.city);
  const state = safeText(v.state) || safeText(personal.state) || safeText(piAddr?.state);
  const postalCode = safeText(v.postal_code) || safeText(v.postalCode) || safeText(personal.postalCode) || safeText(piAddr?.zip);

  const addressLine1 = [address1, address2].filter(Boolean).join(', ').trim() || undefined;
  const cityStateZipRaw = [city, state].filter(Boolean).join(', ').trim() + (postalCode ? ` ${postalCode}` : '');
  const cityStateZip = cityStateZipRaw.trim() || undefined;

  return {
    fullName,
    phone: safeText(args.partner.profile.phone) || safeText(v.phone) || safeText(personal.phone) || undefined,
    address1: address1 || undefined,
    address2: address2 || undefined,
    city: city || undefined,
    state: state || undefined,
    postalCode: postalCode || undefined,
    addressLine1,
    cityStateZip,
  };
}

