import { loadJson, saveJson } from '../../data/localJsonStore';
import { newId } from '../../utils/ids';

export type SoftPullVendor = {
  id: string;
  name: string;
  note: string;
};

/** Named monitoring vendors. Selecting one does not call their API. */
export const SOFT_PULL_VENDORS: SoftPullVendor[] = [
  { id: 'smartcredit', name: 'SmartCredit', note: 'Monitoring vendor. No score is read until an API secret is pasted.' },
  { id: 'identityiq', name: 'IdentityIQ', note: 'Monitoring vendor. Consent and documents only.' },
  { id: 'myscoreiq', name: 'MyScoreIQ', note: 'Monitoring vendor. Consent and documents only.' },
];

export const SOFT_PULL_DOCS = [
  'Government photo ID',
  'Proof of address',
  'Signed consent for a soft inquiry',
  'Partner email on the file',
] as const;

export type SoftPullConsent = {
  id: string;
  at: string;
  vendorId: string;
  partnerId?: string;
  partnerName: string;
  note: string;
  pullExecuted: false;
};

const KEY = 'finely.soft_pull_consent.v1';

export function listSoftPullConsents(): SoftPullConsent[] {
  return loadJson<SoftPullConsent[]>(KEY, [], 1);
}

export function recordSoftPullConsent(input: {
  vendorId: string;
  partnerId?: string;
  partnerName: string;
  note: string;
}): SoftPullConsent {
  const row: SoftPullConsent = {
    id: newId('consent'),
    at: new Date().toISOString(),
    vendorId: input.vendorId,
    partnerId: input.partnerId,
    partnerName: input.partnerName.trim() || 'Unnamed partner',
    note: input.note.trim(),
    pullExecuted: false,
  };
  saveJson(KEY, [row, ...listSoftPullConsents()].slice(0, 40), 1);
  return row;
}
