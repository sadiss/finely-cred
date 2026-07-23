import { defaultPartnerWelcomeMessage } from './partnerMessaging';

export type StaffMessageSnippet = {
  id: string;
  label: string;
  emoji: string;
  body: (partnerName: string) => string;
};

export const STAFF_MESSAGE_SNIPPETS: StaffMessageSnippet[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    emoji: '👋',
    body: (name) => defaultPartnerWelcomeMessage(name),
  },
  {
    id: 'report_received',
    label: 'Report received',
    emoji: '📄',
    body: (name) =>
      `Hi ${name || 'there'} — we received your credit report upload. Our team is reviewing it and will post next steps in your portal shortly.`,
  },
  {
    id: 'dispute_mailed',
    label: 'Dispute mailed',
    emoji: '📬',
    body: (name) =>
      `Hi ${name || 'there'} — your dispute letters are marked as mailed. Watch your mail for bureau responses and log any updates in your evidence vault.`,
  },
  {
    id: 'docs_needed',
    label: 'Docs needed',
    emoji: '📎',
    body: (name) =>
      `Hi ${name || 'there'} — we need a few documents to keep your file moving. Please upload ID, proof of address, and any bureau responses to your vault, then reply here when done.`,
  },
  {
    id: 'billing_reminder',
    label: 'Billing reminder',
    emoji: '💳',
    body: (name) =>
      `Hi ${name || 'there'} — this is a friendly reminder about your Finely Cred subscription. Open Billing in your portal if you need to update payment or have questions.`,
  },
];
