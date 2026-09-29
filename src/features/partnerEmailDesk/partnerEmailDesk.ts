import { loadJson, saveJson } from '../../data/localJsonStore';
import { newId } from '../../utils/ids';
import { warmPartnerRows } from '../commandIntelligence/warmPartners';

/** Mailboxes that already exist. Do not add addresses here. */
export const PARTNER_FROM_ADDRESSES = [
  'partnersupport@finelycred.com',
  'sanzstlouis@finelycred.com',
] as const;

export type PartnerFromAddress = (typeof PARTNER_FROM_ADDRESSES)[number];

export const PARTNER_EMAIL_VERTICALS = ['tax', 'bhph', 'mortgage', 'realtor', 'immigration'] as const;

export type PartnerEmailVertical = (typeof PARTNER_EMAIL_VERTICALS)[number];

export type PartnerEmailDraft = {
  id: string;
  partnerId?: string;
  toName: string;
  toEmail: string;
  fromEmail: PartnerFromAddress;
  vertical: PartnerEmailVertical;
  subject: string;
  body: string;
  /** HOLD until the owner approves. Approving does not transmit. */
  status: 'hold' | 'approved';
  sent: false;
  seeded: boolean;
  createdAt: string;
};

const KEY = 'finely.partner_email_desk.v1';

const VERTICAL_LABEL: Record<PartnerEmailVertical, string> = {
  tax: 'Tax',
  bhph: 'BHPH',
  mortgage: 'Mortgage',
  realtor: 'Realtor',
  immigration: 'Immigration',
};

export function verticalLabel(vertical: PartnerEmailVertical): string {
  return VERTICAL_LABEL[vertical];
}

export function isPartnerFromAddress(value: string): value is PartnerFromAddress {
  return (PARTNER_FROM_ADDRESSES as readonly string[]).includes(value);
}

export function renderVerticalTemplate(vertical: PartnerEmailVertical, partnerName: string): { subject: string; body: string } {
  const name = partnerName.trim() || 'there';
  const close = [
    '',
    'This is education, not a guarantee and not legal, tax, or lending advice.',
    'Reply with the document you already have, or tell me to hold.',
    '',
    'Finely Cred',
  ].join('\n');
  switch (vertical) {
    case 'tax':
      return {
        subject: 'Tax file checklist — one document this week',
        body: `Hello ${name},\n\nHere is a short tax-file checklist. It does not file a return.\n\n1. Photo ID.\n2. Last year’s return, if you have it.\n3. Any 1099 or W-2 already in hand.\n\nBring what you have. We do not invent numbers.${close}`,
      };
    case 'bhph':
      return {
        subject: 'BHPH shopping note — what to bring',
        body: `Hello ${name},\n\nBuy-here-pay-here lots ask for proof you can pay. This note does not approve a car.\n\n1. Driver license.\n2. Proof of income you already have.\n3. A phone number that rings.\n\nWe will not quote a payment or a score.${close}`,
      };
    case 'mortgage':
      return {
        subject: 'Mortgage readiness — documents only',
        body: `Hello ${name},\n\nMortgage readiness is a document list. This is not a preapproval.\n\n1. Photo ID.\n2. Two months of income proof you already have.\n3. The property address, if you have one.\n\nNo rate and no score is promised.${close}`,
      };
    case 'realtor':
      return {
        subject: 'Realtor partner note — next conversation',
        body: `Hello ${name},\n\nA short note you can forward to a realtor. It does not promise a commission or a closing.\n\n1. What you want the house to do (live in, or hold).\n2. The city you are looking at.\n3. Whether a lender conversation has started.\n\nWe introduce the conversation. We do not lock a deal.${close}`,
      };
    case 'immigration':
      return {
        subject: 'Immigration paper checklist — organize only',
        body: `Hello ${name},\n\nThis organizes papers you already have. It is not legal advice and not a filing.\n\n1. Passport or ID you already hold.\n2. Any notice that arrived in the mail.\n3. The date on that notice.\n\nA licensed attorney handles the case. We only sort the stack.${close}`,
      };
  }
}

function verticalForLane(lane: string, index: number): PartnerEmailVertical {
  const text = lane.toLowerCase();
  if (text.includes('agent')) return 'realtor';
  if (text.includes('funding')) return 'mortgage';
  if (text.includes('business')) return 'bhph';
  return PARTNER_EMAIL_VERTICALS[index % PARTNER_EMAIL_VERTICALS.length];
}

export function listPartnerEmailDrafts(): PartnerEmailDraft[] {
  return loadJson<PartnerEmailDraft[]>(KEY, [], 1);
}

function writeDrafts(rows: PartnerEmailDraft[]) {
  saveJson(KEY, rows, 1);
}

/** Create HOLD drafts from warm files that already have an email. Never sends. */
export function ensurePartnerEmailDrafts(): PartnerEmailDraft[] {
  const current = listPartnerEmailDrafts();
  if (current.some((row) => row.seeded)) return current;
  const warm = warmPartnerRows(8).filter((row) => row.email.trim()).slice(0, 5);
  const seeded: PartnerEmailDraft[] = warm.map((row, index) => {
    const vertical = verticalForLane(row.lane, index);
    const template = renderVerticalTemplate(vertical, row.name);
    return {
      id: newId('hold'),
      partnerId: row.id,
      toName: row.name,
      toEmail: row.email.trim(),
      fromEmail: PARTNER_FROM_ADDRESSES[0],
      vertical,
      subject: template.subject,
      body: template.body,
      status: 'hold',
      sent: false,
      seeded: true,
      createdAt: new Date().toISOString(),
    };
  });
  const next = [...seeded, ...current];
  writeDrafts(next);
  return next;
}

export function savePartnerEmailDraft(draft: PartnerEmailDraft): PartnerEmailDraft[] {
  const fromEmail = isPartnerFromAddress(draft.fromEmail) ? draft.fromEmail : PARTNER_FROM_ADDRESSES[0];
  const row: PartnerEmailDraft = { ...draft, fromEmail, sent: false };
  const current = listPartnerEmailDrafts();
  const next = current.some((item) => item.id === row.id)
    ? current.map((item) => (item.id === row.id ? row : item))
    : [row, ...current];
  writeDrafts(next);
  return next;
}

export function approvePartnerEmailDraft(id: string): PartnerEmailDraft[] {
  const next = listPartnerEmailDrafts().map((row) =>
    row.id === id ? { ...row, status: 'approved' as const, sent: false as const } : row,
  );
  writeDrafts(next);
  return next;
}

export function addPartnerEmailDraft(input: {
  toName: string;
  toEmail: string;
  vertical: PartnerEmailVertical;
  fromEmail: PartnerFromAddress;
  partnerId?: string;
}): PartnerEmailDraft[] {
  const template = renderVerticalTemplate(input.vertical, input.toName);
  return savePartnerEmailDraft({
    id: newId('hold'),
    partnerId: input.partnerId,
    toName: input.toName.trim(),
    toEmail: input.toEmail.trim(),
    fromEmail: input.fromEmail,
    vertical: input.vertical,
    subject: template.subject,
    body: template.body,
    status: 'hold',
    sent: false,
    seeded: false,
    createdAt: new Date().toISOString(),
  });
}
