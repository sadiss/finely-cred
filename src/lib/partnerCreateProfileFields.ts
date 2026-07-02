import type { ClientServiceId } from './partnerInviteRouting';

export type PartnerCreateProfileDraft = {
  legalFirstName: string;
  legalLastName: string;
  dob: string;
  ssnLast4: string;
  address2: string;
  creditMonitorProvider: string;
  creditMonitorUsername: string;
  creditMonitorPassword: string;
  experianUsername: string;
  experianPassword: string;
  transunionUsername: string;
  transunionPassword: string;
  equifaxUsername: string;
  equifaxPassword: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedin: string;
  dunsNumber: string;
  profileNotes: string;
};

export const EMPTY_PARTNER_CREATE_PROFILE: PartnerCreateProfileDraft = {
  legalFirstName: '',
  legalLastName: '',
  dob: '',
  ssnLast4: '',
  address2: '',
  creditMonitorProvider: '',
  creditMonitorUsername: '',
  creditMonitorPassword: '',
  experianUsername: '',
  experianPassword: '',
  transunionUsername: '',
  transunionPassword: '',
  equifaxUsername: '',
  equifaxPassword: '',
  socialFacebook: '',
  socialInstagram: '',
  socialLinkedin: '',
  dunsNumber: '',
  profileNotes: '',
};

export type PartnerCreateFieldGroup = {
  id: string;
  title: string;
  hint: string;
  keys: Array<keyof PartnerCreateProfileDraft>;
};

const MONITORING_KEYS: Array<keyof PartnerCreateProfileDraft> = [
  'creditMonitorProvider',
  'creditMonitorUsername',
  'creditMonitorPassword',
];
const BUREAU_KEYS: Array<keyof PartnerCreateProfileDraft> = [
  'experianUsername',
  'experianPassword',
  'transunionUsername',
  'transunionPassword',
  'equifaxUsername',
  'equifaxPassword',
];
const IDENTITY_KEYS: Array<keyof PartnerCreateProfileDraft> = ['dob', 'ssnLast4'];
const SOCIAL_KEYS: Array<keyof PartnerCreateProfileDraft> = ['socialFacebook', 'socialInstagram', 'socialLinkedin'];
const BUSINESS_KEYS: Array<keyof PartnerCreateProfileDraft> = ['dunsNumber'];

export function profileFieldGroupsForService(service: ClientServiceId): PartnerCreateFieldGroup[] {
  const base: PartnerCreateFieldGroup[] = [
    { id: 'identity', title: 'Identity (credit file)', hint: 'DOB and SSN last 4 for bureau matching.', keys: IDENTITY_KEYS },
    {
      id: 'monitoring',
      title: 'Credit monitoring logins',
      hint: 'IdentityIQ, SmartCredit, MyScoreIQ, etc. — same fields as partner profile.',
      keys: MONITORING_KEYS,
    },
  ];
  if (service === 'business_credit') {
    return [
      ...base,
      { id: 'bureaus', title: 'Bureau portal logins', hint: 'Optional — Experian, TransUnion, Equifax.', keys: BUREAU_KEYS },
      { id: 'business', title: 'Business identifiers', hint: 'DUNS and business credit readiness.', keys: BUSINESS_KEYS },
      { id: 'social', title: 'Social & web presence', hint: 'Used for business credit and verification context.', keys: SOCIAL_KEYS },
    ];
  }
  if (service === 'debt_kill') {
    return [
      ...base,
      { id: 'bureaus', title: 'Bureau portal logins', hint: 'Helpful when validating collector reporting.', keys: BUREAU_KEYS },
      { id: 'social', title: 'Social (optional)', hint: 'Contact verification only — optional.', keys: SOCIAL_KEYS },
    ];
  }
  return [
    ...base,
    { id: 'bureaus', title: 'Bureau portal logins', hint: 'Optional direct bureau access.', keys: BUREAU_KEYS },
    { id: 'social', title: 'Social (optional)', hint: 'Optional contact verification.', keys: SOCIAL_KEYS },
  ];
}

export function partnerCreateProfileToCustomValues(
  draft: PartnerCreateProfileDraft,
  args: { firstName: string; lastName: string; phone: string; address1: string; city: string; state: string; postalCode: string },
): Record<string, string> {
  const values: Record<string, string> = {};
  const set = (key: string, val: string) => {
    const v = val.trim();
    if (v) values[key] = v;
  };
  set('legal_first_name', draft.legalFirstName || args.firstName);
  set('legal_last_name', draft.legalLastName || args.lastName);
  set('phone', args.phone);
  set('dob', draft.dob);
  set('ssn_last4', draft.ssnLast4);
  set('address1', args.address1);
  set('address2', draft.address2);
  set('city', args.city);
  set('state', args.state);
  set('postal_code', args.postalCode);
  set('credit_monitor_provider', draft.creditMonitorProvider);
  set('credit_monitor_username', draft.creditMonitorUsername);
  set('credit_monitor_password', draft.creditMonitorPassword);
  set('experian_username', draft.experianUsername);
  set('experian_password', draft.experianPassword);
  set('transunion_username', draft.transunionUsername);
  set('transunion_password', draft.transunionPassword);
  set('equifax_username', draft.equifaxUsername);
  set('equifax_password', draft.equifaxPassword);
  set('social_facebook', draft.socialFacebook);
  set('social_instagram', draft.socialInstagram);
  set('social_linkedin', draft.socialLinkedin);
  set('duns_number', draft.dunsNumber);
  set('profile_notes', draft.profileNotes);
  return values;
}

export const PARTNER_CREATE_FIELD_LABELS: Record<keyof PartnerCreateProfileDraft, string> = {
  legalFirstName: 'Legal first name',
  legalLastName: 'Legal last name',
  dob: 'Date of birth',
  ssnLast4: 'SSN (last 4)',
  address2: 'Address line 2',
  creditMonitorProvider: 'Monitoring provider',
  creditMonitorUsername: 'Monitoring username',
  creditMonitorPassword: 'Monitoring password',
  experianUsername: 'Experian username',
  experianPassword: 'Experian password',
  transunionUsername: 'TransUnion username',
  transunionPassword: 'TransUnion password',
  equifaxUsername: 'Equifax username',
  equifaxPassword: 'Equifax password',
  socialFacebook: 'Facebook profile URL',
  socialInstagram: 'Instagram handle',
  socialLinkedin: 'LinkedIn profile URL',
  dunsNumber: 'DUNS number',
  profileNotes: 'Profile notes',
};
