import { getPackageById } from '../config/pricingCatalog';
import { createInvoice, getInvoice, listInvoicesDueForReminder, patchInvoiceStatus, upsertInvoice } from '../data/invoicesRepo';
import { listPartnersLocal } from '../data/partnersRepo';
import { getCommsTemplate } from '../data/commsRepo';
import type { Invoice, InvoiceLineItem } from '../domain/invoices';
import { formatInvoiceAmount } from '../domain/invoices';
import type { Partner } from '../domain/partners';
import { newId } from '../utils/ids';
import { sendEmailFromTemplate } from './commsEngine';
import { isFeatureEnabled } from '../data/settingsRepo';
import { createNotification } from '../data/notificationsRepo';

const REMINDER_DAYS = [1, 3, 7, 14];

function partnerById(partnerId: string): Partner | null {
  return listPartnersLocal().find((p) => p.id === partnerId) ?? null;
}

function partnerFirstName(partner: Partner): string {
  const name = (partner.profile?.fullName ?? partner.profile?.email ?? 'there').trim();
  return name.split(/\s+/)[0] || 'there';
}

export function createInvoiceForPackage(args: {
  partnerId: string;
  packageId: string;
  agreementId?: string;
  dueInDays?: number;
  sendEmail?: boolean;
}): Invoice {
  const pkg = getPackageById(args.packageId);
  const amountCents = pkg?.priceAmount ?? 0;
  const line: InvoiceLineItem = {
    id: newId('inv_line'),
    label: pkg?.name ?? args.packageId,
    description: pkg?.description,
    sku: args.packageId,
    packageId: args.packageId,
    quantity: 1,
    unitAmountCents: amountCents,
    amountCents,
  };
  const dueAt = new Date(Date.now() + (args.dueInDays ?? 7) * 24 * 60 * 60 * 1000).toISOString();
  const invoice = createInvoice({
    partnerId: args.partnerId,
    lineItems: [line],
    subtotalCents: amountCents,
    taxCents: 0,
    totalCents: amountCents,
    currency: 'USD',
    status: 'sent',
    dueAt,
    agreementId: args.agreementId,
    packageId: args.packageId,
  });
  if (args.sendEmail !== false) void sendInvoiceEmail(invoice.id);
  return invoice;
}

export async function sendInvoiceEmail(invoiceId: string): Promise<{ ok: boolean; message: string }> {
  const inv = getInvoice(invoiceId);
  if (!inv) return { ok: false, message: 'Invoice not found.' };
  const invoice = upsertInvoice({ ...inv, status: inv.status === 'draft' ? 'sent' : inv.status });
  const partner = partnerById(invoice.partnerId);
  const email = partner?.profile?.email;
  if (!email) return { ok: false, message: 'Partner email missing.' };
  if (!isFeatureEnabled('commsDelivery')) {
    createNotification({
      partnerId: invoice.partnerId,
      audience: 'partner',
      kind: 'system',
      title: `Invoice ${invoice.invoiceNumber}`,
      body: `${formatInvoiceAmount(invoice.totalCents)} due ${new Date(invoice.dueAt).toLocaleDateString()}. Open Billing to pay.`,
      href: '/portal/billing?tab=invoices',
    });
    return { ok: true, message: 'Invoice queued in portal (comms delivery off).' };
  }
  const tpl = getCommsTemplate('invoice_sent');
  if (!tpl || !partner) return { ok: false, message: 'Invoice template or partner missing.' };
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
  await sendEmailFromTemplate({
    template: tpl,
    partner,
    ctx: {
      firstName: partnerFirstName(partner),
      invoiceNumber: invoice.invoiceNumber,
      invoiceTotal: formatInvoiceAmount(invoice.totalCents),
      invoiceDueDate: new Date(invoice.dueAt).toLocaleDateString(),
      invoiceLines: invoice.lineItems.map((l) => `• ${l.label} — ${formatInvoiceAmount(l.amountCents)}`).join('\n'),
      portalBillingUrl: `${origin}/portal/billing?tab=invoices`,
    },
  });
  return { ok: true, message: 'Invoice email sent.' };
}

export async function sendInvoiceReminder(invoiceId: string): Promise<{ ok: boolean }> {
  const inv = getInvoice(invoiceId);
  if (!inv) return { ok: false };
  const partner = partnerById(inv.partnerId);
  const email = partner?.profile?.email;
  if (!email || !partner) return { ok: false };
  const daysPast = Math.max(0, Math.floor((Date.now() - Date.parse(inv.dueAt)) / (24 * 60 * 60 * 1000)));
  if (isFeatureEnabled('commsDelivery')) {
    const tpl = getCommsTemplate('invoice_reminder');
    if (tpl) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://finelycred.com';
      await sendEmailFromTemplate({
        template: tpl,
        partner,
        ctx: {
          firstName: partnerFirstName(partner),
          invoiceNumber: inv.invoiceNumber,
          invoiceTotal: formatInvoiceAmount(inv.totalCents),
          daysPastDue: String(daysPast),
          portalBillingUrl: `${origin}/portal/billing?tab=invoices`,
        },
      });
    }
  }
  createNotification({
    partnerId: inv.partnerId,
    audience: 'partner',
    kind: 'system',
    title: `Reminder: invoice ${inv.invoiceNumber}`,
    body: `${formatInvoiceAmount(inv.totalCents)} is ${daysPast ? `${daysPast} day(s) past due` : 'due soon'}.`,
    href: '/portal/billing?tab=invoices',
  });
  upsertInvoice({
    ...inv,
    status: daysPast > 0 ? 'past_due' : inv.status,
    remindersSent: inv.remindersSent + 1,
    lastReminderAt: new Date().toISOString(),
  });
  return { ok: true };
}

export function markInvoicePaid(invoiceId: string, paidAt = new Date().toISOString()): Invoice | null {
  return patchInvoiceStatus(invoiceId, 'paid', { paidAt });
}

export type InvoiceReminderTickResult = { checked: number; sent: number };

export async function processInvoiceReminderTick(opts?: { dryRun?: boolean }): Promise<InvoiceReminderTickResult> {
  const dryRun = opts?.dryRun ?? false;
  let sent = 0;
  const due = listInvoicesDueForReminder();
  for (const inv of due) {
    const daysPast = Math.floor((Date.now() - Date.parse(inv.dueAt)) / (24 * 60 * 60 * 1000));
    if (!REMINDER_DAYS.includes(daysPast) && daysPast < 1) continue;
    if (inv.lastReminderAt) {
      const hoursSince = (Date.now() - Date.parse(inv.lastReminderAt)) / (60 * 60 * 1000);
      if (hoursSince < 20) continue;
    }
    sent += 1;
    if (!dryRun) await sendInvoiceReminder(inv.id);
  }
  return { checked: due.length, sent };
}
