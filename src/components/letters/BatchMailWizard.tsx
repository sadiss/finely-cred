import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, Send, X, Package } from 'lucide-react';
import type { LetterRecord } from '../../domain/letters';
import {
  formatMailAddressOneLine,
  mailLettersBatchViaProvider,
  type MailAddress,
} from '../../lib/mailerClient';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';
import { canAffordMailSend, chargeMailSend, formatMailCreditsUsd, DEFAULT_MAIL_COST_CENTS } from '../../data/mailCreditsRepo';
import { MailProviderStatusBanner } from '../mailing/MailProviderStatusBanner';
import { MailCreditsPanel } from '../mailing/MailCreditsPanel';
import {
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
} from '../../features/os/finelyOsLightUi';

type Step = 'select' | 'confirm' | 'mail' | 'track';

function sanitizeState(s: string) {
  return (s || '').trim().toUpperCase().slice(0, 2);
}
function zipOnly(s: string) {
  return (s || '').replace(/\D/g, '').slice(0, 10);
}

export type BatchMailItemResult = {
  letterId: string;
  ok: boolean;
  providerId?: string;
  error?: string;
  to?: MailAddress;
  from?: MailAddress;
};

/**
 * First-timer batch path: Select letters → Confirm address → Mail → Track.
 * Shared by partner vault and admin mail-for-partner.
 */
export function BatchMailWizard({
  open,
  partnerId,
  letters,
  defaultFromName,
  defaultFromAddress,
  defaultSelectedIds,
  onClose,
  onComplete,
}: {
  open: boolean;
  partnerId: string;
  letters: LetterRecord[];
  defaultFromName?: string;
  defaultFromAddress?: Partial<MailAddress>;
  defaultSelectedIds?: string[];
  onClose: () => void;
  onComplete: (results: BatchMailItemResult[]) => void;
}) {
  const mailReady = useMemo(() => letters.filter((l) => Boolean(l.pdfBlobRef)), [letters]);
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<BatchMailItemResult[]>([]);
  const [from, setFrom] = useState<MailAddress>({
    name: defaultFromName || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });
  /** Shared recipient override — optional; per-letter defaults stay when empty name. */
  const [to, setTo] = useState<MailAddress>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });

  useEffect(() => {
    if (!open) return;
    setStep('select');
    setErr(null);
    setResults([]);
    setBusy(false);
    const preset = (defaultSelectedIds || []).filter((id) => mailReady.some((l) => l.id === id));
    setSelected(new Set(preset.length ? preset : mailReady.map((l) => l.id)));
    setFrom({
      name: defaultFromName || '',
      addressLine1: defaultFromAddress?.addressLine1 ?? '',
      addressLine2: defaultFromAddress?.addressLine2 ?? '',
      city: defaultFromAddress?.city ?? '',
      state: defaultFromAddress?.state ?? '',
      zip: defaultFromAddress?.zip ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partnerId]);

  const selectedLetters = useMemo(() => mailReady.filter((l) => selected.has(l.id)), [mailReady, selected]);
  const estCents = selectedLetters.length * DEFAULT_MAIL_COST_CENTS;

  const fromOk =
    Boolean(from.name.trim()) &&
    Boolean(from.addressLine1.trim()) &&
    Boolean(from.city.trim()) &&
    sanitizeState(from.state).length === 2 &&
    zipOnly(from.zip).length >= 5;

  const toOk =
    Boolean(to.name.trim()) &&
    Boolean(to.addressLine1.trim()) &&
    Boolean(to.city.trim()) &&
    sanitizeState(to.state).length === 2 &&
    zipOnly(to.zip).length >= 5;

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runMail = async () => {
    if (!selectedLetters.length || !fromOk || !toOk || busy) return;
    const afford = canAffordMailSend();
    const need = selectedLetters.length * afford.costCents;
    if (afford.balanceCents < need) {
      setErr(
        `Insufficient internal mailing budget. Need ~${formatMailCreditsUsd(need)}; available ${formatMailCreditsUsd(afford.balanceCents)}.`,
      );
      return;
    }
    setErr(null);
    setBusy(true);
    setStep('mail');
    try {
      const toClean: MailAddress = { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) };
      const fromClean: MailAddress = { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) };
      const batch = await mailLettersBatchViaProvider({
        partnerId,
        from: fromClean,
        items: selectedLetters.map((l) => ({
          letterId: l.id,
          pdfBlobRef: l.pdfBlobRef!,
          to: toClean,
        })),
        options: { color: true, doubleSided: true },
      });
      const mapped: BatchMailItemResult[] = batch.map((r) => {
        if (r.ok && r.result) {
          try {
            chargeMailSend({ letterId: r.letterId, partnerId });
          } catch {
            /* budget already checked; ignore race */
          }
          return {
            letterId: r.letterId,
            ok: true,
            providerId: r.result.providerId,
            to: toClean,
            from: fromClean,
          };
        }
        return { letterId: r.letterId, ok: false, error: r.error || 'Failed', to: toClean, from: fromClean };
      });
      setResults(mapped);
      onComplete(mapped);
      setStep('track');
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Batch mail failed.');
    } finally {
      setBusy(false);
    }
  };

  const stepChips: { id: Step; label: string }[] = [
    { id: 'select', label: '1 · Pick letters' },
    { id: 'confirm', label: '2 · Confirm address' },
    { id: 'mail', label: '3 · Mail' },
    { id: 'track', label: '4 · Email notify' },
  ];

  return (
    <div className="fixed inset-0 z-[310] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => (busy ? null : onClose())} />
      <div
        className="relative w-full max-w-3xl rounded-3xl border border-white/[0.08] bg-fc-shell shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/[0.08] flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">{FINELY_MAIL_COPY.serviceName} · batch</div>
            <div className="mt-1 text-xl font-light text-white">Mail selected letters</div>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Pick → Confirm address → Mail → Email notify</p>
          </div>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="px-4 pt-3 flex flex-wrap items-center gap-1.5">
          {stepChips.map((s, idx) => (
            <React.Fragment key={s.id}>
              {idx > 0 ? <ChevronRight size={14} className="text-white/30" /> : null}
              <span
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                  step === s.id ? 'border-amber-400/50 bg-amber-500/15 text-amber-50' : 'border-white/12 text-white/55'
                }`}
              >
                {s.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="p-4 space-y-3 max-h-[72vh] overflow-y-auto">
          <MailProviderStatusBanner compact letterCount={selectedLetters.length || 1} />
          {err ? <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 text-rose-100 text-sm">{err}</div> : null}

          {step === 'select' ? (
            <>
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                {selectedLetters.length} selected · est. {formatMailCreditsUsd(estCents)}. Only PDF-ready letters can mail.
              </p>
              <div className="space-y-2">
                {mailReady.length === 0 ? (
                  <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>No PDF-ready letters for this partner.</p>
                ) : (
                  mailReady.map((l) => (
                    <label
                      key={l.id}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(l.id)}
                        onChange={() => toggle(l.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{l.title}</div>
                        <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                          {l.type} · {l.status || 'generated'}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
                  disabled={!selectedLetters.length}
                  onClick={() => setStep('confirm')}
                >
                  Confirm address <ChevronRight size={14} />
                </button>
              </div>
            </>
          ) : null}

          {step === 'confirm' ? (
            <>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>To — recipient (shared for batch)</div>
                  {(['name', 'addressLine1', 'addressLine2', 'city', 'state', 'zip'] as const).map((k) => (
                    <input
                      key={k}
                      value={(to as any)[k] ?? ''}
                      onChange={(e) =>
                        setTo((prev) => ({
                          ...prev,
                          [k]: k === 'state' ? sanitizeState(e.target.value) : k === 'zip' ? zipOnly(e.target.value) : e.target.value,
                        }))
                      }
                      placeholder={k}
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                  ))}
                </div>
                <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>From — return address</div>
                  {(['name', 'addressLine1', 'addressLine2', 'city', 'state', 'zip'] as const).map((k) => (
                    <input
                      key={k}
                      value={(from as any)[k] ?? ''}
                      onChange={(e) =>
                        setFrom((prev) => ({
                          ...prev,
                          [k]: k === 'state' ? sanitizeState(e.target.value) : k === 'zip' ? zipOnly(e.target.value) : e.target.value,
                        }))
                      }
                      placeholder={k}
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white/80">
                Mailing {selectedLetters.length} letter(s) to {toOk ? formatMailAddressOneLine(to) : '…'}
              </div>
              <div className="flex justify-between gap-2">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setStep('select')}>
                  Back
                </button>
                <button
                  type="button"
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
                  disabled={!toOk || !fromOk}
                  onClick={() => setStep('mail')}
                >
                  Continue to Mail <ChevronRight size={14} />
                </button>
              </div>
            </>
          ) : null}

          {step === 'mail' ? (
            <>
              <MailCreditsPanel compact />
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                One tap mails all {selectedLetters.length} selected PDFs. Est. {formatMailCreditsUsd(estCents)}.
              </p>
              <div className="flex justify-between gap-2">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => setStep('confirm')}>
                  Back
                </button>
                <button
                  type="button"
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
                  disabled={busy || !selectedLetters.length}
                  onClick={() => void runMail()}
                >
                  <Send size={14} /> {busy ? 'Mailing…' : `Mail ${selectedLetters.length} letters`}
                </button>
              </div>
            </>
          ) : null}

          {step === 'track' ? (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 text-emerald-200 font-semibold">
                <Package size={16} /> Mailed · email notify queued
              </div>
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Successful sends trigger a Finely Mail confirmation email to the partner (when <strong className="text-white/80">commsDelivery</strong> is on). Admin copy goes to you when you mailed on their behalf.
              </p>
              <ul className="space-y-2">
                {results.map((r) => {
                  const title = letters.find((l) => l.id === r.letterId)?.title || r.letterId;
                  return (
                    <li
                      key={r.letterId}
                      className={`rounded-xl border px-3 py-2 text-sm ${
                        r.ok ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-50' : 'border-rose-400/30 bg-rose-500/10 text-rose-50'
                      }`}
                    >
                      {r.ok ? <CheckCircle2 size={14} className="inline mr-1.5" /> : null}
                      <span className="font-semibold">{title}</span>
                      {r.ok ? (
                        <span className="font-mono text-xs ml-2">{r.providerId}</span>
                      ) : (
                        <span className="ml-2">{r.error}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={onClose}>
                Done
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
