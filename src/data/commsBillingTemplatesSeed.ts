import type { CommsTemplate } from '../domain/comms';
import { getCommsTemplate, upsertCommsTemplate } from './commsRepo';

const BILLING_TEMPLATES: CommsTemplate[] = [
  {
    id: 'billing_past_due',
    name: 'Billing past due',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Action needed — update your Finely Cred billing',
    bodyTemplate: `Hi {{firstName}},

Your plan payment is past due. Update billing in the portal to avoid interruption to disputes, letters, and Work OS tasks.

→ Open billing: {{portalBillingUrl}}

Educational services only — not legal advice.

— Finely Cred Billing`,
    tags: ['billing', 'dunning', 'automation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trial_win_back',
    name: 'Trial win-back offer',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Your DIY trial ended — keep your restore momentum',
    bodyTemplate: `Hi {{firstName}},

Your limited DIY portal trial has ended, but your dispute file and tasks are still here. Upgrade to keep letter automation, Work OS timers, and specialist support.

→ Continue in billing: {{portalBillingUrl}}

Questions? Reply in Communication Hub or book a session from Calendar.

— Finely Cred`,
    tags: ['billing', 'win-back', 'automation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'invoice_sent',
    name: 'Invoice sent',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Invoice {{invoiceNumber}} from Finely Cred',
    bodyTemplate: `Hi {{firstName}},

Your invoice is ready.

Invoice: {{invoiceNumber}}
Total: {{invoiceTotal}}
Due: {{invoiceDueDate}}

{{invoiceLines}}

Pay or review in your portal:
{{portalBillingUrl}}

— Finely Cred Billing`,
    tags: ['billing', 'invoice', 'automation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'invoice_reminder',
    name: 'Invoice payment reminder',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Reminder — invoice {{invoiceNumber}}',
    bodyTemplate: `Hi {{firstName}},

This is a friendly reminder that invoice {{invoiceNumber}} for {{invoiceTotal}} is due.

{{daysPastDue}} day(s) past due — please update payment to keep services active.

→ Pay now: {{portalBillingUrl}}

— Finely Cred Billing`,
    tags: ['billing', 'invoice', 'dunning', 'automation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'invoice_paid_receipt',
    name: 'Invoice paid receipt',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Payment received — {{invoiceNumber}}',
    bodyTemplate: `Hi {{firstName}},

Thank you — we received payment for invoice {{invoiceNumber}} ({{invoiceTotal}}).

Your entitlements are active. Open your portal dashboard to continue your workflow.

— Finely Cred`,
    tags: ['billing', 'invoice', 'receipt', 'automation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** Seed billing/dunning comms templates for automation recipes (Phase 30). */
export function ensureBillingCommsTemplates(): number {
  let added = 0;
  for (const tpl of BILLING_TEMPLATES) {
    if (getCommsTemplate(tpl.id)) continue;
    upsertCommsTemplate(tpl);
    added += 1;
  }
  return added;
}
