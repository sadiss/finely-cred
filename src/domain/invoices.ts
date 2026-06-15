/** Partner invoices for services, packages, and add-ons. */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'past_due' | 'void';

export type InvoiceLineItem = {
  id: string;
  label: string;
  description?: string;
  sku?: string;
  packageId?: string;
  quantity: number;
  unitAmountCents: number;
  amountCents: number;
};

export type Invoice = {
  id: string;
  partnerId: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: 'USD';
  status: InvoiceStatus;
  dueAt: string;
  paidAt?: string;
  agreementId?: string;
  packageId?: string;
  stripeSessionId?: string;
  remindersSent: number;
  lastReminderAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export function formatInvoiceAmount(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}
