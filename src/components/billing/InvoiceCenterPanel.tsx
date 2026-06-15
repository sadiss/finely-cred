import React, { useMemo, useState } from 'react';
import { FileText, Mail, RefreshCw } from 'lucide-react';
import { listInvoicesByPartner } from '../../data/invoicesRepo';
import { formatInvoiceAmount, type Invoice } from '../../domain/invoices';
import { sendInvoiceEmail, sendInvoiceReminder } from '../../lib/invoiceEngine';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type Props = {
  partnerId: string;
  isAdmin?: boolean;
};

function statusTone(status: Invoice['status']): 'ok' | 'warn' | 'blocked' {
  if (status === 'paid') return 'ok';
  if (status === 'past_due') return 'blocked';
  if (status === 'sent') return 'warn';
  return 'warn';
}

export function InvoiceCenterPanel({ partnerId, isAdmin }: Props) {
  const [version, setVersion] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  React.useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const invoices = useMemo(() => listInvoicesByPartner(partnerId), [partnerId, version]);

  const resend = async (id: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await sendInvoiceEmail(id);
      setNotice(res.message);
    } catch (e: unknown) {
      setNotice((e as Error)?.message ?? 'Send failed.');
    } finally {
      setBusyId(null);
      setVersion((v) => v + 1);
    }
  };

  const remind = async (id: string) => {
    setBusyId(id);
    try {
      await sendInvoiceReminder(id);
      setNotice('Reminder sent.');
    } catch (e: unknown) {
      setNotice((e as Error)?.message ?? 'Reminder failed.');
    } finally {
      setBusyId(null);
      setVersion((v) => v + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${finelyOsCatalogCard('sky')} !p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-sm inline-flex items-center gap-2`}>
            <FileText size={16} /> Invoices
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>
            Automatic invoice emails and reminders for packages, services, and add-ons.
          </p>
        </div>
        <span className={finelyOsStatusChip('ok')}>{invoices.length} on file</span>
      </div>

      {notice ? <div className="text-xs text-sky-200 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2">{notice}</div> : null}

      {invoices.length === 0 ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY} py-6 text-center`}>
          No invoices yet — they are created automatically when you purchase a package or service.
        </p>
      ) : (
        <div className="grid gap-3">
          {invoices.map((inv) => (
            <div key={inv.id} className={`${finelyOsCatalogCard('violet')} !p-4 space-y-2`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className={FINELY_OS_ENTITY_VALUE}>{inv.invoiceNumber}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[10px]`}>
                    Due {new Date(inv.dueAt).toLocaleDateString()} · {inv.lineItems.map((l) => l.label).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{formatInvoiceAmount(inv.totalCents)}</div>
                  <span className={finelyOsStatusChip(statusTone(inv.status))}>{inv.status.replace('_', ' ')}</span>
                </div>
              </div>
              {(isAdmin || inv.status !== 'paid') && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" disabled={busyId === inv.id} onClick={() => void resend(inv.id)} className={FINELY_OS_SECONDARY_BTN}>
                    <Mail size={12} /> {busyId === inv.id ? '…' : 'Email invoice'}
                  </button>
                  {inv.status !== 'paid' ? (
                    <button type="button" disabled={busyId === inv.id} onClick={() => void remind(inv.id)} className={FINELY_OS_PRIMARY_BTN}>
                      <RefreshCw size={12} /> Remind
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
