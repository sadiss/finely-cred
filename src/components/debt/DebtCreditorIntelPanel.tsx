import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  FileSearch,
  MapPin,
  Phone,
  Scale,
  Sparkles,
  User,
  Wand2,
} from 'lucide-react';
import type { ParsedCreditReport } from '../../domain/creditReports';
import type { DebtCase } from '../../domain/debt';
import type { ProcessedDocument } from '../../domain/documents';
import { createDebtCase } from '../../data/debtRepo';
import {
  debtCaseFromSignal,
  extractReportDebtSignals,
  listSummonsDocumentsForDebt,
  mergeDebtCreditorFields,
  resolveDebtPartyInfo,
  type DebtPartyInfo,
  type ReportedDebtSignal,
} from '../../lib/debtCreditorIntel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type ReportRow = { id: string; parsed?: ParsedCreditReport | null };

export function DebtCreditorIntelPanel({
  partnerId,
  debt,
  reports,
  processedDocuments,
  mode,
  senderFields,
  onDebtChange,
  onSenderPersist,
  selectedSummonsDocId,
  onSummonsDocChange,
}: {
  partnerId: string;
  debt: DebtCase | null;
  reports: ReportRow[];
  processedDocuments: ProcessedDocument[];
  mode: 'validation' | 'court';
  senderFields: {
    fullName: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  onDebtChange: (debt: DebtCase) => void;
  onSenderPersist?: () => void;
  selectedSummonsDocId?: string;
  onSummonsDocChange?: (docId: string | null) => void;
}) {
  const signals = useMemo(() => extractReportDebtSignals(reports), [reports]);
  const contacts = useMemo(() => {
    const out: Array<{ creditorName: string; address?: string; phone?: string; accountNumberMasked?: string }> = [];
    for (const r of reports) {
      const parsed = r.parsed as { creditorContacts?: Array<Record<string, unknown>> } | null | undefined;
      for (const c of parsed?.creditorContacts || []) {
        const name = String(c?.creditorName || '').trim();
        if (!name) continue;
        out.push({
          creditorName: name,
          address: String(c?.address || '').trim() || undefined,
          phone: String(c?.phone || '').trim() || undefined,
          accountNumberMasked: String(c?.accountNumberMasked || '').trim() || undefined,
        });
      }
    }
    return out;
  }, [reports]);

  const party = useMemo(
    () =>
      resolveDebtPartyInfo({
        debt,
        signals,
        contacts: contacts as never,
        documents: processedDocuments,
      }),
    [debt, signals, contacts, processedDocuments],
  );

  const summonsDocs = useMemo(
    () => listSummonsDocumentsForDebt({ documents: processedDocuments, debt }),
    [processedDocuments, debt],
  );

  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [originalCreditor, setOriginalCreditor] = useState('');
  const [accountRef, setAccountRef] = useState('');
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    setRecipientName(party?.recipientName || debt?.recipientName || debt?.name || '');
    setRecipientAddress(party?.recipientAddress || debt?.recipientAddress || '');
    setRecipientPhone(party?.recipientPhone || debt?.recipientPhone || '');
    setOriginalCreditor(party?.originalCreditor || debt?.originalCreditor || '');
    setAccountRef(party?.accountNumberMasked || debt?.accountNumberMasked || '');
    if (party?.signal?.signalId) setActiveSignalId(party.signal.signalId);
  }, [debt?.id, party?.recipientName, party?.recipientAddress, party?.recipientPhone, party?.originalCreditor, party?.accountNumberMasked, party?.signal?.signalId]);

  const topSignals = signals;
  const hasAutoMatch = Boolean(party && party.matchedFrom !== 'manual' && (party.recipientAddress || party.signal));
  const matchQuality = party?.signal?.confidence ?? (hasAutoMatch ? 'medium' : null);
  const totalBalanceCents = signals.reduce((sum, s) => sum + (s.balanceCents ?? 0), 0);
  const totalBalanceLabel =
    totalBalanceCents > 0
      ? (totalBalanceCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
      : '—';

  const applySignal = (signal: ReportedDebtSignal) => {
    setActiveSignalId(signal.signalId);
    setRecipientName(signal.creditorName);
    setRecipientAddress(signal.address || '');
    setRecipientPhone(signal.phone || '');
    setOriginalCreditor(signal.originalCreditor || '');
    setAccountRef(signal.accountNumberMasked || '');

    if (debt && (debt.reportId === signal.reportId && debt.tradelineIndex === signal.tradelineIndex)) {
      const next = mergeDebtCreditorFields(debt, debtCaseFromSignal(signal, partnerId) as Partial<DebtCase>);
      onDebtChange(next);
      setSavedNotice(`Linked to report tradeline for ${signal.creditorName}.`);
      return;
    }

    const draft = createDebtCase({
      partnerId,
      ...debtCaseFromSignal(signal, partnerId),
      name: signal.creditorName,
      amountCents: signal.balanceCents ?? 0,
    } as Parameters<typeof createDebtCase>[0]);
    onDebtChange(draft);
    setSavedNotice(`Opened debt case for ${signal.creditorName} from your credit report.`);
  };

  const persistRecipient = () => {
    if (!debt) return;
    const next = mergeDebtCreditorFields(debt, {
      recipientName: recipientName.trim() || debt.name,
      recipientAddress: recipientAddress.trim() || undefined,
      recipientPhone: recipientPhone.trim() || undefined,
      originalCreditor: originalCreditor.trim() || undefined,
      accountNumberMasked: accountRef.trim() || undefined,
      collectorName: recipientName.trim() || debt.collectorName,
    });
    onDebtChange(next);
    onSenderPersist?.();
    setSavedNotice('Creditor and sender details saved to this debt case.');
  };

  const selectedSummons = summonsDocs.find((d) => d.id === selectedSummonsDocId) ?? summonsDocs[0] ?? null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Reported debts', value: signals.length, accent: 'text-violet-300' },
          { label: 'Total balance', value: totalBalanceLabel, accent: 'text-sky-300' },
          { label: 'Match quality', value: matchQuality ? String(matchQuality) : '—', accent: 'text-emerald-300' },
          { label: 'Active case', value: debt?.name ? 'Linked' : 'None', accent: 'text-fuchsia-300' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-center">
            <div className={`text-lg font-black ${kpi.accent}`}>{kpi.value}</div>
            <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_BODY}`}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {topSignals.length > 0 ? (
        <div className={`${finelyOsCatalogCard(mode === 'validation' ? 'emerald' : 'violet')} !p-5 space-y-4`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Sparkles size={14} className="text-violet-300" />
                Reported debts detected
              </div>
              <p className={`mt-2 max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
                We found {signals.length} collection, charge-off, or serious delinquency tradeline{signals.length === 1 ? '' : 's'} on your credit report. Pick one to auto-fill the collector for your{' '}
                {mode === 'validation' ? 'validation letter' : 'affidavit'}.
              </p>
            </div>
            {hasAutoMatch ? <span className={finelyOsStatusChip('ok')}>Auto-matched</span> : null}
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[min(520px,60vh)] overflow-y-auto pr-1">
            {topSignals.map((s) => {
              const active = activeSignalId === s.signalId || (debt?.reportId === s.reportId && debt?.tradelineIndex === s.tradelineIndex);
              const balance =
                typeof s.balanceCents === 'number' && s.balanceCents > 0
                  ? (s.balanceCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                  : null;
              return (
                <button
                  key={s.signalId}
                  type="button"
                  onClick={() => applySignal(s)}
                  className={`rounded-2xl border p-4 text-left transition min-h-[132px] flex flex-col ${
                    active
                      ? 'border-violet-400/50 bg-violet-500/15 ring-1 ring-violet-400/30'
                      : 'border-white/10 bg-black/25 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} line-clamp-2`}>{s.creditorName}</div>
                    {active ? <Check size={16} className="text-violet-300 shrink-0" /> : null}
                  </div>
                  <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                    <div className="capitalize">{s.negativeType.replace('_', ' ')}</div>
                    {balance ? <div>Balance: {balance}</div> : null}
                    {s.address ? <div className="line-clamp-2">{s.address}</div> : <div className="text-white/35">Address not on report — add below</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {party ? (
        <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Scale size={14} className="text-emerald-300" />
              Intelligence match
            </div>
            <span className={finelyOsStatusChip(hasAutoMatch ? 'ok' : 'warn')}>
              {party.matchedFrom.replace('_', ' ')}
              {matchQuality ? ` · ${matchQuality}` : ''}
            </span>
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            {hasAutoMatch
              ? `We matched collector details from your ${party.matchedFrom.replace('_', ' ')}. Review the mailing block below before generating your ${mode === 'validation' ? 'validation' : 'court'} letter.`
              : 'No confident auto-match yet — pick a reported debt above or enter collector mailing info manually.'}
          </p>
          {(party.recipientName || party.recipientAddress) && (
            <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2 text-sm">
              <div className={FINELY_OS_ENTITY_VALUE}>{party.recipientName || debt?.name || 'Collector'}</div>
              {party.recipientAddress ? <div className={`whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY}`}>{party.recipientAddress}</div> : null}
              {party.accountNumberMasked ? (
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Account ref: {party.accountNumberMasked}</div>
              ) : null}
            </div>
          )}
          {!recipientAddress.trim() ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100/90">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              Mailing address is required before you send — add it in the collector block below.
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCard('sky')} !p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Building2 size={14} className="text-sky-300" />
              Collector / creditor mailing info
            </div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              This is who receives your {mode === 'validation' ? 'validation request' : 'court response'}. Edit before you build the draft.
            </p>
          </div>
          {party ? (
            <span className={finelyOsStatusChip(party.matchedFrom === 'debt_case' ? 'warn' : 'ok')}>
              Source: {party.matchedFrom.replace('_', ' ')}
            </span>
          ) : null}
        </div>

        <div className="space-y-4">
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Recipient name</label>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Collector or plaintiff legal name"
              className={FINELY_OS_ENTITY_INPUT}
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Original creditor (if different)</label>
            <input
              value={originalCreditor}
              onChange={(e) => setOriginalCreditor(e.target.value)}
              placeholder="e.g. Capital One, Synchrony"
              className={FINELY_OS_ENTITY_INPUT}
            />
          </div>
          <div className="md:col-span-2">
            <label className={FINELY_OS_ENTITY_LABEL}>Mailing address</label>
            <textarea
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              rows={3}
              placeholder="Street, suite, city, state, ZIP"
              className={`${FINELY_OS_ENTITY_INPUT} min-h-[88px]`}
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Phone (optional)</label>
            <input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Collector phone"
              className={FINELY_OS_ENTITY_INPUT}
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Account reference</label>
            <input
              value={accountRef}
              onChange={(e) => setAccountRef(e.target.value)}
              placeholder="Last 4 or masked account #"
              className={FINELY_OS_ENTITY_INPUT}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={persistRecipient} disabled={!debt} className={FINELY_OS_PRIMARY_BTN}>
            <Wand2 size={14} />
            Save to debt case
          </button>
          {!debt ? (
            <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Select or create a debt case above to persist these fields.</span>
          ) : null}
          {savedNotice ? <span className={`text-xs text-emerald-300/90`}>{savedNotice}</span> : null}
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-4`}>
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <User size={14} className="text-emerald-300" />
          Your sender info (recorded on letters)
        </div>
        <p className={FINELY_OS_ENTITY_BODY}>
          This is printed at the top of mailed letters. We save a snapshot on each draft so your vault keeps the exact sender block used.
        </p>
        <div className="space-y-3 text-sm">
          <div className={`rounded-xl border border-white/10 bg-black/20 p-4 ${FINELY_OS_ENTITY_BODY}`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Your return address</div>
            <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{senderFields.fullName || '—'}</div>
            <div className="mt-1 whitespace-pre-wrap">
              {[senderFields.address1, senderFields.address2, [senderFields.city, senderFields.state, senderFields.postalCode].filter(Boolean).join(', ')].filter(Boolean).join('\n') || 'Add your mailing address in the sender block below the draft editor.'}
            </div>
            {senderFields.phone ? (
              <div className="mt-2 inline-flex items-center gap-1">
                <Phone size={12} /> {senderFields.phone}
              </div>
            ) : null}
          </div>
          <div className={`rounded-xl border border-white/10 bg-black/20 p-4 space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <MapPin size={12} /> Letter recipient preview
            </div>
            <div className={FINELY_OS_ENTITY_VALUE}>{recipientName || '—'}</div>
            <div className="whitespace-pre-wrap">{recipientAddress || 'Add collector mailing address before sending.'}</div>
            <div className="text-xs text-white/45 pt-1">Mailed letters use name + address only (no email).</div>
          </div>
        </div>
      </div>

      {mode === 'court' && summonsDocs.length > 0 ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <FileSearch size={14} className="text-violet-300" />
            Summons & legal documents
          </div>
          <p className={FINELY_OS_ENTITY_BODY}>
            Choose the summons or complaint we read from your evidence. Affidavit drafts use extracted case facts from this document.
          </p>
          <select
            value={selectedSummons?.id || ''}
            onChange={(e) => onSummonsDocChange?.(e.target.value || null)}
            className={FINELY_OS_ENTITY_INPUT}
          >
            {summonsDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.filename || d.docType} • {d.entities.caseNumber || d.entities.creditorName || 'legal doc'}
              </option>
            ))}
          </select>
          {selectedSummons ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {[
                ['Case #', selectedSummons.entities.caseNumber],
                ['Plaintiff', selectedSummons.entities.creditorName || selectedSummons.entities.collectorName],
                ['Court', selectedSummons.entities.courtName],
                ['Amount', selectedSummons.entities.amountClaimed || selectedSummons.entities.amount],
                ['Served', selectedSummons.entities.dateServed],
                ['State', selectedSummons.entities.state],
              ]
                .filter(([, v]) => String(v || '').trim())
                .map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{value}</div>
                  </div>
                ))}
              {selectedSummons.summary ? (
                <div className="sm:col-span-2 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Document summary</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{selectedSummons.summary}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type { DebtPartyInfo };
