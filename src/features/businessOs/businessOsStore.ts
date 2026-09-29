import { loadJson, saveJson } from '../../data/localJsonStore';
import { newId } from '../../utils/ids';

export type OtherBusiness = {
  id: string;
  name: string;
  notes: string;
  docsUrl: string;
};

export type VaultDoc = {
  id: string;
  title: string;
  url: string;
  note: string;
};

/** A reference only. The full secret is discarded after masking. */
export type KeySlot = {
  id: string;
  label: string;
  envName: string;
  last4: string;
  updatedAt: string;
};

export type QaCheck = {
  id: string;
  label: string;
  done: boolean;
};

const BUSINESSES = 'finely.business_os.clients.v1';
const DOCS = 'finely.business_os.docs.v1';
const KEYS = 'finely.business_os.keys.v1';
const QA = 'finely.business_os.qa.v1';
const LINKS = 'finely.business_os.links.v1';

const DEFAULT_KEYS: KeySlot[] = [
  { id: 'youtube', label: 'YouTube Data API', envName: 'YOUTUBE_API_KEY', last4: '', updatedAt: '' },
  { id: 'zoho', label: 'Zoho SMTP password', envName: 'ZOHO_SMTP_PASS', last4: '', updatedAt: '' },
  { id: 'zoho-flag', label: 'Zoho send flag', envName: 'VITE_ZOHO_PARTNER_EMAIL', last4: '', updatedAt: '' },
];

const DEFAULT_QA: QaCheck[] = [
  { id: 'contrast', label: 'Spot-check Courses and Marketing Desk for light-on-light text.', done: false },
  { id: 'nav', label: 'Confirm Courses, Playbooks, and Marketing Desk are one click from Start here.', done: false },
  { id: 'send', label: 'Confirm no partner email left this desk without Approve before send.', done: false },
  { id: 'scores', label: 'Confirm no screen shows an invented credit score.', done: false },
];

export type BrandLinks = {
  noraUrl: string;
  jirehSite: string;
  jirehEaDocs: string;
};

export function listOtherBusinesses(): OtherBusiness[] {
  return loadJson<OtherBusiness[]>(BUSINESSES, [], 1);
}

export function saveOtherBusiness(input: Omit<OtherBusiness, 'id'> & { id?: string }): OtherBusiness {
  const row: OtherBusiness = {
    id: input.id || newId('biz'),
    name: input.name.trim(),
    notes: input.notes.trim(),
    docsUrl: input.docsUrl.trim(),
  };
  const rest = listOtherBusinesses().filter((item) => item.id !== row.id);
  saveJson(BUSINESSES, [row, ...rest], 1);
  return row;
}

export function listVaultDocs(): VaultDoc[] {
  return loadJson<VaultDoc[]>(DOCS, [], 1);
}

export function saveVaultDoc(input: Omit<VaultDoc, 'id'> & { id?: string }): VaultDoc {
  const row: VaultDoc = {
    id: input.id || newId('doc'),
    title: input.title.trim(),
    url: input.url.trim(),
    note: input.note.trim(),
  };
  const rest = listVaultDocs().filter((item) => item.id !== row.id);
  saveJson(DOCS, [row, ...rest], 1);
  return row;
}

export function listKeySlots(): KeySlot[] {
  const stored = loadJson<KeySlot[]>(KEYS, [], 1);
  const byId = new Map(stored.map((slot) => [slot.id, slot]));
  return DEFAULT_KEYS.map((slot) => byId.get(slot.id) ?? slot);
}

export function rememberKeyRef(id: string, secret: string): KeySlot[] {
  const digits = secret.trim();
  const last4 = digits ? digits.slice(-4) : '';
  const next = listKeySlots().map((slot) =>
    slot.id === id ? { ...slot, last4, updatedAt: new Date().toISOString() } : slot,
  );
  saveJson(KEYS, next, 1);
  return next;
}

export function listQaChecks(): QaCheck[] {
  const stored = loadJson<QaCheck[]>(QA, [], 1);
  if (!stored.length) return DEFAULT_QA;
  const byId = new Map(stored.map((row) => [row.id, row.done]));
  return DEFAULT_QA.map((row) => ({ ...row, done: byId.get(row.id) ?? false }));
}

export function toggleQaCheck(id: string): QaCheck[] {
  const next = listQaChecks().map((row) => (row.id === id ? { ...row, done: !row.done } : row));
  saveJson(QA, next, 1);
  return next;
}

export function readBrandLinks(): BrandLinks {
  return loadJson<BrandLinks>(LINKS, { noraUrl: '', jirehSite: '', jirehEaDocs: '' }, 1);
}

export function saveBrandLinks(patch: Partial<BrandLinks>): BrandLinks {
  const next = { ...readBrandLinks(), ...patch };
  saveJson(LINKS, next, 1);
  return next;
}

export function noraHandoffUrl(): string {
  const fromEnv = String(import.meta.env.VITE_NORA_CAPITAL_URL || '').trim();
  return fromEnv || readBrandLinks().noraUrl.trim();
}
