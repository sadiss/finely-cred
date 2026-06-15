import type { Invoice, InvoiceStatus } from '../domain/invoices';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.invoices.v1';

type Store = { invoices: Invoice[]; nextNumber: number };

function defaultStore(): Store {
  return { invoices: [], nextNumber: 1001 };
}

function loadStore(): Store {
  return loadJson(KEY, defaultStore(), 1);
}

function saveStore(store: Store) {
  saveJson(KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

export function listInvoicesByPartner(partnerId: string): Invoice[] {
  return loadStore()
    .invoices.filter((i) => i.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listAllInvoices(): Invoice[] {
  return loadStore().invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getInvoice(id: string): Invoice | null {
  return loadStore().invoices.find((i) => i.id === id) ?? null;
}

export function listInvoicesDueForReminder(now = new Date()): Invoice[] {
  const ts = now.getTime();
  return loadStore().invoices.filter((i) => {
    if (i.status !== 'sent' && i.status !== 'past_due') return false;
    if (Date.parse(i.dueAt) > ts) return false;
    return i.remindersSent < 4;
  });
}

export function upsertInvoice(invoice: Invoice): Invoice {
  const store = loadStore();
  const idx = store.invoices.findIndex((i) => i.id === invoice.id);
  const next = { ...invoice, updatedAt: new Date().toISOString() };
  if (idx >= 0) store.invoices[idx] = next;
  else store.invoices.push(next);
  saveStore(store);
  return next;
}

export function allocateInvoiceNumber(): string {
  const store = loadStore();
  const num = store.nextNumber;
  store.nextNumber = num + 1;
  saveStore(store);
  return `FC-${num}`;
}

export function createInvoice(args: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'remindersSent'> & {
  invoiceNumber?: string;
}): Invoice {
  const now = new Date().toISOString();
  const invoice: Invoice = {
    id: newId('inv'),
    invoiceNumber: args.invoiceNumber ?? allocateInvoiceNumber(),
    remindersSent: 0,
    createdAt: now,
    updatedAt: now,
    ...args,
  };
  return upsertInvoice(invoice);
}

export function patchInvoiceStatus(id: string, status: InvoiceStatus, extra?: Partial<Invoice>): Invoice | null {
  const inv = getInvoice(id);
  if (!inv) return null;
  return upsertInvoice({ ...inv, ...extra, status, updatedAt: new Date().toISOString() });
}

export function deleteInvoice(id: string): boolean {
  const store = loadStore();
  const before = store.invoices.length;
  store.invoices = store.invoices.filter((i) => i.id !== id);
  if (store.invoices.length === before) return false;
  saveStore(store);
  return true;
}
