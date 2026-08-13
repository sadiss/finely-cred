import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Check,
  FileSearch,
  MapPin,
  Phone,
  Scale,
  User,
  Wand2,
} from 'lucide-react';
import type { ParsedCreditorContact, ParsedCreditReport } from '../../domain/creditReports';
import type { DebtCase } from '../../domain/debt';
import type { ProcessedDocument } from '../../domain/documents';
import { adminEmbeddedNavHref } from '../../lib/adminPartnerRoutes';
import { createDebtCase, listDebtByPartner } from '../../data/debtRepo';
import {
  debtCaseFromSignal,
  computePartnerDebtSnapshot,
  autoPersistDebtPartyIfEmpty,
  contactsFromParsedReport,
  extractCollateralSignals,
  extractReportDebtSignals,
  listSummonsDocumentsForDebt,
  mergeDebtCreditorFields,
  persistRefreshedCreditorContactsOnReport,
  resolveDebtPartyInfo,
  type DebtPartyInfo,
  type ReportedDebtSignal,
} from '../../lib/debtCreditorIntel';
import {
  buildCollectionContactBoardForReports,
  type BoardCollection,
} from '../../lib/collectionContactBoard';
import type { SelfPartyIdentity } from '../../creditReports/creditorContactExtract';
import {
  enrichRecipientAddress,
  enrichmentToDebtPatch,
  type AddressEnrichmentResult,
} from '../../lib/recipientAddressEnrichment';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_FIELD_WIDTH,
  FINELY_OS_FIELD_WIDTH_SM,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
  finelyOsGlowKpi,
  finelyOsGlowTile,
  finelyOsStatusChip,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsWorkstationModal } from '../../features/os/FinelyOsWorkstationModal';
import './validationDebtLayout.css';

type ReportRow = { id: string; parsed?: ParsedCreditReport | null };

/** Chips stay compact by default; partners can expand to every reported account. */
const TARGET_CHIP_LIMIT = 12;

export function DebtCreditorIntelPanel({
  partnerId,
  debt,
  reports,
  processedDocuments,
  mode,
  workstation,
  senderFields,
  onDebtChange,
  onSenderPersist,
  selectedSummonsDocId,
  onSummonsDocChange,
  compact = false,
  adminPartnerId,
}: {
  partnerId: string;
  adminPartnerId?: string;
  debt: DebtCase | null;
  reports: ReportRow[];
  processedDocuments: ProcessedDocument[];
  mode: 'validation' | 'court';
  workstation?: 'validation' | 'court' | 'foreclosure' | 'repossession';
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
  compact?: boolean;
}) {
  const nav = (href: string) => adminEmbeddedNavHref(adminPartnerId, href);
  const signals = useMemo(() => extractReportDebtSignals(reports), [reports]);
  const ws = workstation ?? mode;
  const displaySignals = useMemo(() => {
    if (ws === 'foreclosure') return extractCollateralSignals(reports, 'foreclosure');
    if (ws === 'repossession') return extractCollateralSignals(reports, 'repossession');
    return signals;
  }, [signals, reports, ws]);
  // Full contact records (account ref, tradeline index, bureau) so the resolver
  // can address the right account when one collector holds several placements.
  const contacts = useMemo(() => {
    const out: ParsedCreditorContact[] = [];
    for (const r of reports) {
      for (const c of contactsFromParsedReport(r.parsed as ParsedCreditReport | null | undefined)) {
        if (!String(c?.creditorName || '').trim()) continue;
        out.push(c);
      }
    }
    return out;
  }, [reports]);

  // Recover Creditor Contacts addresses from sections onto cached parses so
  // Validation fields + letters see name/address/phone without a manual re-parse.
  useEffect(() => {
    let changed = false;
    for (const r of reports) {
      if (!r.id || !r.parsed) continue;
      const before = (r.parsed.creditorContacts || []).filter((c) => c.address).length;
      const next = persistRefreshedCreditorContactsOnReport({ id: r.id, parsed: r.parsed });
      const after = (next?.creditorContacts || []).filter((c) => c.address).length;
      if (after > before) changed = true;
    }
    if (changed) {
      try {
        window.dispatchEvent(new CustomEvent('finely:store'));
      } catch {
        /* ignore */
      }
    }
  }, [reports]);

  // The partner is never a valid letter recipient — collect every way we know
  // them so their own block can be rejected wherever it leaks in.
  const selfIdentity = useMemo<SelfPartyIdentity>(() => {
    const addresses: string[] = [
      [senderFields.address1, senderFields.address2, [senderFields.city, senderFields.state, senderFields.postalCode].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(' '),
    ];
    for (const r of reports) {
      for (const a of r.parsed?.personalInfo?.addresses || []) {
        const raw = a?.raw || [a?.line1, a?.city, a?.state, a?.zip].filter(Boolean).join(' ');
        if (raw) addresses.push(raw);
      }
    }
    return {
      fullName: senderFields.fullName || reports.find((r) => r.parsed?.personalInfo?.fullName)?.parsed?.personalInfo?.fullName,
      addresses: addresses.filter((a) => a.trim().length > 6),
    };
  }, [senderFields.fullName, senderFields.address1, senderFields.address2, senderFields.city, senderFields.state, senderFields.postalCode, reports]);

  const collectionBoard = useMemo(() => buildCollectionContactBoardForReports(reports), [reports]);
  const collectionRows = collectionBoard.collections;
  const targetsWithAddress = collectionBoard.collectionsWithAddress;

  const party = useMemo(
    () =>
      resolveDebtPartyInfo({
        debt,
        signals,
        contacts,
        documents: processedDocuments,
        self: selfIdentity,
        preferCounsel: mode === 'court',
      }),
    [debt, signals, contacts, processedDocuments, selfIdentity, mode],
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
  const [plaintiffLawFirm, setPlaintiffLawFirm] = useState('');
  const [plaintiffLawFirmAddress, setPlaintiffLawFirmAddress] = useState('');
  const [plaintiffAttorneyName, setPlaintiffAttorneyName] = useState('');
  const [plaintiffAttorneyBar, setPlaintiffAttorneyBar] = useState('');
  const [affidavitCounty, setAffidavitCounty] = useState('');
  const [loanId, setLoanId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [enrichMeta, setEnrichMeta] = useState<AddressEnrichmentResult | null>(null);

  useEffect(() => {
    setRecipientName(party?.recipientName || debt?.recipientName || debt?.name || '');
    setRecipientAddress(party?.recipientAddress || debt?.recipientAddress || '');
    setRecipientPhone(party?.recipientPhone || debt?.recipientPhone || '');
    setOriginalCreditor(party?.originalCreditor || debt?.originalCreditor || '');
    setAccountRef(party?.accountNumberMasked || debt?.accountNumberMasked || '');
    // Validation: never seed plaintiff from collector / bureau mailing.
    // Court: keep counsel fields (case first, then document/directory firm matches).
    if (mode === 'court') {
      setPlaintiffLawFirm(debt?.plaintiffLawFirm || '');
      setPlaintiffLawFirmAddress(
        debt?.plaintiffLawFirmAddress ||
          (party?.matchedFrom === 'document' || party?.matchedFrom === 'directory' ? party?.recipientAddress : '') ||
          '',
      );
    } else {
      setPlaintiffLawFirm(debt?.plaintiffLawFirm || '');
      setPlaintiffLawFirmAddress(debt?.plaintiffLawFirmAddress || '');
    }
    setPlaintiffAttorneyName(debt?.plaintiffAttorneyName || '');
    setPlaintiffAttorneyBar(debt?.plaintiffAttorneyBarNumber || '');
    setAffidavitCounty(debt?.affidavitCounty || '');
    setLoanId(debt?.loanId || '');
    setBorrowerId(debt?.borrowerId || '');
    if (party?.signal?.signalId) setActiveSignalId(party.signal.signalId);
  }, [debt?.id, debt?.plaintiffLawFirm, debt?.plaintiffLawFirmAddress, debt?.plaintiffAttorneyName, debt?.plaintiffAttorneyBarNumber, debt?.affidavitCounty, debt?.loanId, debt?.borrowerId, debt?.collectorName, party?.recipientName, party?.recipientAddress, party?.recipientPhone, party?.originalCreditor, party?.accountNumberMasked, party?.signal?.signalId, mode]);

  // Auto-persist high-confidence match when case is missing mailing fields.
  useEffect(() => {
    if (!debt || !party) return;
    const next = autoPersistDebtPartyIfEmpty(debt, party, selfIdentity);
    if (next) {
      onDebtChange(next);
      setSavedNotice(`Auto-filled from ${party.matchedFrom.replace('_', ' ')} — review before mailing.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when debt/party identity changes
  }, [debt?.id, party?.recipientAddress, party?.matchedFrom]);

  const useFromReport = () => {
    if (!party) return;
    setRecipientName(party.recipientName || '');
    setRecipientAddress(party.recipientAddress || '');
    setRecipientPhone(party.recipientPhone || '');
    setOriginalCreditor(party.originalCreditor || '');
    setAccountRef(party.accountNumberMasked || '');
    const courtPatch =
      mode === 'court'
        ? {
            plaintiffLawFirm: party.collectorName || party.recipientName || undefined,
            plaintiffLawFirmAddress: party.recipientAddress || undefined,
          }
        : {};
    if (mode === 'court') {
      if (party.collectorName || party.recipientName) {
        setPlaintiffLawFirm(party.collectorName || party.recipientName || '');
      }
      if (party.recipientAddress) {
        setPlaintiffLawFirmAddress(party.recipientAddress);
      }
    }
    if (debt) {
      const next = mergeDebtCreditorFields(debt, {
        recipientName: party.recipientName,
        recipientAddress: party.recipientAddress || undefined,
        recipientPhone: party.recipientPhone,
        originalCreditor: party.originalCreditor,
        accountNumberMasked: party.accountNumberMasked,
        collectorName: party.collectorName || party.recipientName,
        ...courtPatch,
      });
      onDebtChange(next);
      setSavedNotice(
        mode === 'court'
          ? 'Applied report / document match (including counsel fields).'
          : 'Applied report contact to recipient — plaintiff/counsel left unchanged.',
      );
    } else if (party.signal) {
      applySignal(party.signal);
    }
  };

  /**
   * Address the letter from a collection/charge-off row joined to Creditor Contacts.
   * With no case open we create one so the mailing block persists.
   */
  const applyCollection = (t: BoardCollection) => {
    setRecipientName(t.creditorName);
    if (t.mailingAddress) setRecipientAddress(t.mailingAddress);
    if (t.phone) setRecipientPhone(t.phone);
    if (t.originalCreditor) setOriginalCreditor(t.originalCreditor);
    if (t.accountNumberMasked) setAccountRef(t.accountNumberMasked);
    if (mode === 'court') {
      setPlaintiffLawFirm((prev) => prev || t.creditorName);
    }

    const sourceNote =
      t.addressSource === 'report_contact'
        ? 'report Creditor Contacts'
        : t.addressSource === 'directory'
          ? 'known-creditor directory (verify before send)'
          : t.addressSource === 'tradeline'
            ? 'tradeline fields'
            : 'no address yet';
    const addressNote = t.mailingAddress
      ? `Saved ${t.creditorName} from ${sourceNote} onto this case.`
      : `${t.creditorName} has no mailing address yet — Re-parse the report, use Fill address, or type it from the notice.`;

    const patch = {
      recipientName: t.creditorName,
      recipientAddress: t.mailingAddress || undefined,
      recipientPhone: t.phone,
      originalCreditor: t.originalCreditor,
      accountNumberMasked: t.accountNumberMasked,
      collectorName: t.creditorName,
      reportId: t.reportId,
      tradelineIndex: t.tradelineIndex,
    };

    if (debt) {
      onDebtChange(mergeDebtCreditorFields(debt, patch));
      setSavedNotice(addressNote);
      return;
    }

    if (!partnerId) {
      setSavedNotice(`Addressed to ${t.creditorName} — open a debt case above to save these fields.`);
      return;
    }

    const alreadyLinked = listDebtByPartner(partnerId).find(
      (c) =>
        (c.reportId === t.reportId && c.tradelineIndex === t.tradelineIndex) ||
        (c.name || '').trim().toLowerCase() === t.creditorName.trim().toLowerCase(),
    );
    if (alreadyLinked) {
      onDebtChange(mergeDebtCreditorFields(alreadyLinked, patch));
      setSavedNotice(`Switched to the existing case for ${t.creditorName}.`);
      return;
    }

    const draft = createDebtCase({
      partnerId,
      type: mode === 'court' ? 'summons' : 'debt',
      name: t.creditorName,
      amountCents: t.balanceCents ?? 0,
      collectorName: t.creditorName,
      originalCreditor: t.originalCreditor,
      recipientName: t.creditorName,
      recipientAddress: t.mailingAddress,
      recipientPhone: t.phone,
      accountNumberMasked: t.accountNumberMasked,
      reportId: t.reportId,
      tradelineIndex: t.tradelineIndex,
    });
    onDebtChange(draft);
    setSavedNotice(addressNote);
  };

  const topSignals = displaySignals;
  const hasAutoMatch = Boolean(party && party.matchedFrom !== 'manual' && (party.recipientAddress || party.signal));
  const matchQuality = party?.signal?.confidence ?? (hasAutoMatch ? 'medium' : null);
  const totalBalanceCents = signals.reduce((sum, s) => sum + (s.balanceCents ?? 0), 0);
  const debtSnapshot = useMemo(() => computePartnerDebtSnapshot(partnerId), [partnerId]);
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

    // One case per reported account — reuse the case already linked to this
    // tradeline instead of stacking duplicates each time the tile is tapped.
    const alreadyLinked = listDebtByPartner(partnerId).find(
      (c) => c.reportId === signal.reportId && c.tradelineIndex === signal.tradelineIndex,
    );
    if (alreadyLinked) {
      const next = mergeDebtCreditorFields(alreadyLinked, debtCaseFromSignal(signal, partnerId) as Partial<DebtCase>);
      onDebtChange(next);
      setSavedNotice(`Switched to the existing case for ${signal.creditorName}.`);
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
      plaintiffLawFirm: plaintiffLawFirm.trim() || undefined,
      plaintiffLawFirmAddress: plaintiffLawFirmAddress.trim() || undefined,
      plaintiffAttorneyName: plaintiffAttorneyName.trim() || undefined,
      plaintiffAttorneyBarNumber: plaintiffAttorneyBar.trim() || undefined,
      affidavitCounty: affidavitCounty.trim() || undefined,
      loanId: loanId.trim() || undefined,
      borrowerId: borrowerId.trim() || undefined,
    });
    onDebtChange(next);
    onSenderPersist?.();
    setSavedNotice('Creditor and sender details saved to this debt case.');
  };

  const lookupMailingAddress = async () => {
    setLookupBusy(true);
    try {
      // Report addresses come first so "Fill address" uses the partner's own
      // report before falling back to the directory or a web lookup.
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const wanted = [recipientName, debt?.recipientName, debt?.collectorName, debt?.name]
        .map((n) => normalize(String(n || '')))
        .filter(Boolean);
      const reportAddresses = collectionRows
        .filter((t) => {
          if (!t.mailingAddress) return false;
          const target = normalize(t.creditorName);
          return wanted.some((w) => w === target || w.includes(target) || target.includes(w));
        })
        .map((t) => t.mailingAddress as string);
      const result = await enrichRecipientAddress({
        preferCounsel: mode === 'court',
        nameCandidates: [
          plaintiffLawFirm,
          plaintiffAttorneyName,
          recipientName,
          debt?.plaintiffLawFirm,
          debt?.plaintiffAttorneyName,
          debt?.collectorName,
          debt?.recipientName,
          debt?.name,
          party?.recipientName,
          originalCreditor,
        ],
        addressCandidates: [
          plaintiffLawFirmAddress,
          recipientAddress,
          debt?.plaintiffLawFirmAddress,
          debt?.recipientAddress,
          party?.recipientAddress,
          ...reportAddresses,
        ],
        phone: recipientPhone || debt?.recipientPhone || party?.recipientPhone,
      });
      setEnrichMeta(result);
      if (!result?.address) {
        setSavedNotice(result?.hint || 'No mailing address found — enter it from the notice or summons.');
        return;
      }
      setRecipientName(result.name || recipientName);
      setRecipientAddress(result.address);
      if (result.phone) setRecipientPhone(result.phone);
      if (result.kind === 'law_firm' || mode === 'court') {
        setPlaintiffLawFirm(result.name || plaintiffLawFirm);
        setPlaintiffLawFirmAddress(result.address);
      }
      if (debt) {
        const patch = enrichmentToDebtPatch(result);
        onDebtChange(mergeDebtCreditorFields(debt, patch));
      }
      setSavedNotice(result.hint);
    } finally {
      setLookupBusy(false);
    }
  };

  const selectedSummons = summonsDocs.find((d) => d.id === selectedSummonsDocId) ?? summonsDocs[0] ?? null;
  const cardShell = (accent: 'violet' | 'sky' | 'emerald' = 'violet') =>
    compact ? finelyOsCatalogCardCompact('violet') : finelyOsCatalogCard(accent);
  const glowAccent: FinelyOsGlowAccent = mode === 'validation' ? 'emerald' : 'fuchsia';
  const fieldInput = compact ? `${finelyOsGlowField(glowAccent)} mt-1` : FINELY_OS_ENTITY_INPUT;
  const pad = compact ? '!p-4' : '!p-5';

  return (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>
      {compact ? (
        <div className="flex flex-wrap gap-2">
          <div className={`${finelyOsGlowKpi(glowAccent)} !px-3 !py-2`}>
            <div className="text-[10px] uppercase tracking-widest text-white/50">On report</div>
            <div className="text-sm font-bold text-white">
              {debtSnapshot.reportedCents > 0
                ? (debtSnapshot.reportedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                : '—'}
            </div>
            <div className="text-[10px] text-white/45">{debtSnapshot.reportedCount || 0} tradelines</div>
          </div>
          <div className={`${finelyOsGlowKpi('sky')} !px-3 !py-2`}>
            <div className="text-[10px] uppercase tracking-widest text-white/50">In cases</div>
            <div className="text-sm font-bold text-white">
              {debtSnapshot.claimedCents > 0
                ? (debtSnapshot.claimedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                : '—'}
            </div>
          </div>
          {(ws === 'foreclosure' || ws === 'repossession') && debtSnapshot.collateralCents > 0 ? (
            <div className={`${finelyOsGlowKpi('amber')} !px-3 !py-2`}>
              <div className="text-[10px] uppercase tracking-widest text-white/50">Collateral</div>
              <div className="text-sm font-bold text-white">
                {(debtSnapshot.collateralCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {!compact ? (
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
      ) : null}

      {topSignals.length > 0 ? (
        <div className={`${cardShell()} ${pad} space-y-3`}>
          <div>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>
              {ws === 'foreclosure'
                ? 'Foreclosure tradelines on your report'
                : ws === 'repossession'
                  ? 'Repossession tradelines on your report'
                  : 'Reported debts detected'}
            </div>
            {!compact ? (
              <p className={`max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
                {ws === 'foreclosure'
                  ? 'Only mortgage/foreclosure-classified negatives appear here. Tap one to auto-fill servicer mailing info.'
                  : ws === 'repossession'
                    ? 'Only repossession-classified negatives appear here. Tap one to auto-fill lender mailing info.'
                    : `We found ${signals.length} collection or charge-off tradeline${signals.length === 1 ? '' : 's'}. Pick one to auto-fill collector info.`}
              </p>
            ) : (
              <p className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Tap a tradeline to auto-fill mailing info.</p>
            )}
            {hasAutoMatch ? <span className={`${finelyOsStatusChip('ok')} mt-2 inline-flex`}>Auto-matched</span> : null}
          </div>
          <div className={`grid sm:grid-cols-2 gap-3 ${compact ? 'max-h-[280px]' : 'max-h-[min(520px,60vh)]'} overflow-y-auto pr-1`}>
            {topSignals.map((s) => {
              const active = activeSignalId === s.signalId || (debt?.reportId === s.reportId && debt?.tradelineIndex === s.tradelineIndex);
              const balance =
                typeof s.balanceCents === 'number' && s.balanceCents > 0
                  ? (s.balanceCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
                  : '—';
              const typeLabel =
                ws === 'foreclosure' ? 'Foreclosure' : ws === 'repossession' ? 'Repossession' : s.negativeType.replace('_', ' ');
              return (
                <button
                  key={s.signalId}
                  type="button"
                  onClick={() => applySignal(s)}
                  className={`${finelyOsGlowTile(glowAccent, active)} p-4 text-left flex flex-col min-h-[8.5rem]`}
                >
                  <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE} line-clamp-2 leading-snug`}>{s.creditorName}</div>
                  <div className={`mt-3 text-lg font-black ${glowAccent === 'emerald' ? 'text-emerald-300' : glowAccent === 'fuchsia' ? 'text-fuchsia-300' : 'text-amber-300'}`}>
                    {balance}
                  </div>
                  {s.accountNumberMasked ? (
                    <div className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Acct {s.accountNumberMasked}</div>
                  ) : null}
                  <div className={`mt-auto pt-3 text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_BODY}`}>
                    {typeLabel}
                    {s.bureau ? ` · ${s.bureau}` : ''}
                  </div>
                  {s.accountStatus ? (
                    <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY} line-clamp-1 mt-1`}>{s.accountStatus}</div>
                  ) : null}
                  <div className={`text-[10px] mt-1 ${s.address ? 'text-emerald-300/80' : 'text-amber-200/80'}`}>
                    {s.address ? 'Mailing address found' : 'No mailing address yet'}
                  </div>
                  {active ? (
                    <div className={`mt-2 inline-flex items-center gap-1 text-[10px] ${glowAccent === 'emerald' ? 'text-emerald-300' : 'text-fuchsia-300'}`}>
                      <Check size={12} /> Selected
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : ws === 'foreclosure' || ws === 'repossession' ? (
        <div className={`${cardShell()} ${pad} border-dashed space-y-2`}>
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            {ws === 'foreclosure'
              ? 'No foreclosure-classified tradelines on your uploaded reports yet.'
              : 'No repossession-classified tradelines on your uploaded reports yet.'}
          </p>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY} opacity-80`}>
            Upload a tri-merge or bureau report above, or enter {ws === 'foreclosure' ? 'servicer' : 'lender'} mailing info manually below.
            Only tradelines classified as {ws === 'foreclosure' ? 'foreclosure/mortgage' : 'repossession/auto'} appear here — unrelated collections stay hidden.
          </p>
        </div>
      ) : null}

      {compact && party && (party.recipientName || party.recipientAddress) ? (
        <div className={`${finelyOsCatalogCardCompact('emerald')} !p-3 space-y-1`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Scale size={13} className="text-emerald-300" />
              Letter goes to
            </div>
            <span className={finelyOsStatusChip(hasAutoMatch ? 'ok' : 'warn')}>
              {party.matchedFrom.replace('_', ' ')}
              {matchQuality ? ` · ${matchQuality}` : ''}
            </span>
          </div>
          <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{party.recipientName || 'Collector'}</div>
          {party.recipientAddress ? (
            <div className={`whitespace-pre-wrap text-xs ${FINELY_OS_ENTITY_BODY}`}>{party.recipientAddress}</div>
          ) : (
            <div className="inline-flex items-start gap-1.5 text-[11px] text-amber-200/90">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              No mailing address yet — pick a Creditor Contact below or use Fill address.
            </div>
          )}
        </div>
      ) : null}

      {!compact && party ? (
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

      {collectionRows.length > 0 ? (
        <div className={`${finelyOsCatalogCardCompact('fuchsia')} !p-3`}>
          <button
            type="button"
            onClick={() => setCollectionsModalOpen(true)}
            className="w-full rounded-xl border border-fuchsia-400/35 bg-gradient-to-br from-fuchsia-600/20 via-violet-900/25 to-black/60 px-3 py-3 text-left hover:brightness-110 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-200/90">
                  Collections & charge-offs
                </div>
                <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                  {collectionRows.length} account{collectionRows.length === 1 ? '' : 's'} · {targetsWithAddress} with mailing address
                </div>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Pick a collector — auto-fills the mailing block below.
                </p>
              </div>
              <span className={finelyOsStatusChip(targetsWithAddress > 0 ? 'ok' : 'warn')}>Open list</span>
            </div>
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className={`${finelyOsCatalogCardCompact('fuchsia')} !p-3 space-y-2`}>
          <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_BODY}`}>No credit report on file</div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Collection accounts come from your uploaded report.
          </p>
          <Link to={nav('/portal/reports')} className={FINELY_OS_SECONDARY_BTN}>
            Upload a credit report
          </Link>
        </div>
      ) : (
        <div className={`${finelyOsCatalogCardCompact('fuchsia')} !p-3 space-y-2`}>
          <div className={`text-[10px] uppercase tracking-widest ${FINELY_OS_ENTITY_BODY}`}>
            No collections or charge-offs on this report yet
          </div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {reports.length} report{reports.length === 1 ? '' : 's'} on file
            {collectionBoard.contactsWithAddress
              ? ` · ${collectionBoard.contactsWithAddress} Creditor Contact address${collectionBoard.contactsWithAddress === 1 ? '' : 'es'} read`
              : ''}
            .
          </p>
          <Link to={nav('/portal/reports')} className={FINELY_OS_SECONDARY_BTN}>
            Open reports / re-parse
          </Link>
        </div>
      )}

      <div className={`${cardShell('sky')} ${pad} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Building2 size={14} className="text-sky-300" />
              Collector mailing address
            </div>
            {!compact ? (
            <p className={`mt-1.5 ${FINELY_OS_ENTITY_BODY}`}>
              Who receives your{' '}
              {ws === 'foreclosure' ? 'RESPA / loss mitigation letter' : ws === 'repossession' ? 'repo or deficiency letter' : mode === 'validation' ? 'validation request' : 'court response'}.
            </p>
            ) : (
              <p className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Saved on the debt case when you tap Save.</p>
            )}
          </div>
          {party ? (
            <span className={finelyOsStatusChip(party.matchedFrom === 'debt_case' ? 'warn' : 'ok')}>
              {party.matchedFrom.replace('_', ' ')}
              {matchQuality ? ` · ${matchQuality}` : ''}
            </span>
          ) : null}
        </div>

        {!compact && !recipientAddress.trim() ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90 max-w-xl">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            Mailing address is required before you send.
          </div>
        ) : null}

        <div className={compact ? 'fc-validation-mail-deck' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'}>
          <div className={compact ? 'fc-field-span-2' : FINELY_OS_FIELD_WIDTH}>
            <label className={FINELY_OS_ENTITY_LABEL}>Recipient name</label>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Collector legal name"
              className={`${fieldInput} w-full`}
            />
          </div>
          <div className={compact ? '' : FINELY_OS_FIELD_WIDTH}>
            <label className={FINELY_OS_ENTITY_LABEL}>Phone</label>
            <input
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Optional"
              className={`${fieldInput} w-full`}
            />
          </div>
          <div className={compact ? '' : FINELY_OS_FIELD_WIDTH}>
            <label className={FINELY_OS_ENTITY_LABEL}>Account ref</label>
            <input
              value={accountRef}
              onChange={(e) => setAccountRef(e.target.value)}
              placeholder="Last 4 / masked #"
              className={`${fieldInput} w-full`}
            />
          </div>
          <div className={compact ? 'fc-field-span-2' : FINELY_OS_FIELD_WIDTH}>
            <label className={FINELY_OS_ENTITY_LABEL}>Original creditor</label>
            <input
              value={originalCreditor}
              onChange={(e) => setOriginalCreditor(e.target.value)}
              placeholder="If different from collector"
              className={`${fieldInput} w-full`}
            />
          </div>
          <div className={compact ? 'fc-field-span-4' : 'md:col-span-2'}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className={FINELY_OS_ENTITY_LABEL}>Mailing address</label>
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} !py-1.5 !px-2.5 text-[10px]`}
                disabled={lookupBusy}
                onClick={() => void lookupMailingAddress()}
              >
                <Wand2 size={12} />
                {lookupBusy ? 'Looking up…' : 'Fill address'}
              </button>
            </div>
            <textarea
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              rows={compact ? 2 : 3}
              placeholder="Street, city, state, ZIP"
              className={`${fieldInput} w-full ${compact ? 'min-h-[56px]' : 'min-h-[88px]'}`}
            />
            {enrichMeta?.verifyRequired || (!recipientAddress.trim() && enrichMeta?.source === 'missing') ? (
              <p className="mt-1 text-[10px] text-amber-200/85">Verify against the notice before mailing.</p>
            ) : enrichMeta?.hint ? (
              <p className="mt-1 text-[10px] text-emerald-200/80">{enrichMeta.hint}</p>
            ) : null}
          </div>
        </div>

        {mode === 'court' || mode === 'validation' ? (
          mode === 'validation' && compact ? (
            <details className="rounded-xl border border-white/10 bg-black/20 !p-3">
              <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-widest text-emerald-200/90 [&::-webkit-details-marker]:hidden">
                Court / summons fields (optional)
              </summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 max-w-3xl">
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Plaintiff law firm</label>
                  <input value={plaintiffLawFirm} onChange={(e) => setPlaintiffLawFirm(e.target.value)} placeholder="Collection law firm" className={`${fieldInput} w-full max-w-xs`} />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Plaintiff attorney</label>
                  <input value={plaintiffAttorneyName} onChange={(e) => setPlaintiffAttorneyName(e.target.value)} placeholder="Attorney of record" className={`${fieldInput} w-full max-w-xs`} />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Bar number</label>
                  <input value={plaintiffAttorneyBar} onChange={(e) => setPlaintiffAttorneyBar(e.target.value)} placeholder="State bar #" className={`${fieldInput} w-full max-w-xs`} />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Affidavit county</label>
                  <input value={affidavitCounty} onChange={(e) => setAffidavitCounty(e.target.value)} placeholder="County" className={`${fieldInput} w-full max-w-xs`} />
                </div>
                <div className="sm:col-span-2 max-w-md">
                  <label className={FINELY_OS_ENTITY_LABEL}>Plaintiff firm address</label>
                  <textarea value={plaintiffLawFirmAddress} onChange={(e) => setPlaintiffLawFirmAddress(e.target.value)} rows={2} className={`${fieldInput} w-full min-h-[56px]`} />
                </div>
              </div>
            </details>
          ) : (
          <div className={`pt-3 border-t border-white/10 grid gap-3 sm:grid-cols-2 ${compact ? 'max-w-3xl' : ''}`}>
            <div className="sm:col-span-2">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Scale size={14} className={mode === 'court' ? 'text-fuchsia-300' : 'text-emerald-300'} />
                {mode === 'court'
                  ? 'Plaintiff / counsel (court & summons)'
                  : 'Court / summons fields (optional)'}
              </div>
              <p className={`mt-1 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                {mode === 'court'
                  ? 'Counsel name and mailing populate courtroom letters, affidavits, and discovery.'
                  : 'Leave blank for validation mail — TO uses the collector / Creditor Contacts block above. Fill only if this case becomes a summons matter.'}
              </p>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Plaintiff law firm</label>
              <input value={plaintiffLawFirm} onChange={(e) => setPlaintiffLawFirm(e.target.value)} placeholder="Collection law firm" className={fieldInput} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Plaintiff attorney</label>
              <input value={plaintiffAttorneyName} onChange={(e) => setPlaintiffAttorneyName(e.target.value)} placeholder="Attorney of record" className={fieldInput} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Plaintiff bar number</label>
              <input value={plaintiffAttorneyBar} onChange={(e) => setPlaintiffAttorneyBar(e.target.value)} placeholder="State bar # / P-number" className={fieldInput} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Affidavit county</label>
              <input value={affidavitCounty} onChange={(e) => setAffidavitCounty(e.target.value)} placeholder="County for STATE/COUNTY caption" className={fieldInput} />
            </div>
            <div className={compact ? '' : 'md:col-span-2'}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className={FINELY_OS_ENTITY_LABEL}>Plaintiff firm mailing address</label>
                {mode === 'court' ? (
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    disabled={lookupBusy}
                    onClick={() => void lookupMailingAddress()}
                  >
                    <Wand2 size={14} />
                    {lookupBusy ? 'Looking up…' : 'Fill counsel address'}
                  </button>
                ) : null}
              </div>
              <textarea value={plaintiffLawFirmAddress} onChange={(e) => setPlaintiffLawFirmAddress(e.target.value)} rows={2} placeholder="Law firm address on summons" className={`${fieldInput} min-h-[64px]`} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Loan ID</label>
              <input value={loanId} onChange={(e) => setLoanId(e.target.value)} placeholder="From complaint or servicer" className={fieldInput} />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Borrower ID</label>
              <input value={borrowerId} onChange={(e) => setBorrowerId(e.target.value)} placeholder="Borrower / customer ID" className={fieldInput} />
            </div>
          </div>
          )
        ) : null}

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
          {party && (party.autoFilled || party.matchedFrom !== 'manual') ? (
            <button type="button" onClick={useFromReport} className={FINELY_OS_SECONDARY_BTN}>
              <Wand2 size={14} />
              Use from report
            </button>
          ) : null}
          <button type="button" onClick={persistRecipient} disabled={!debt} className={FINELY_OS_PRIMARY_BTN}>
            <Wand2 size={14} />
            Save to debt case
          </button>
          {party?.autoFilled ? (
            <span className={finelyOsStatusChip('ok')}>Auto-filled · {party.matchedFrom.replace('_', ' ')}</span>
          ) : party?.matchedFrom === 'debt_case' ? (
            <span className={finelyOsStatusChip('warn')}>Saved on case</span>
          ) : (
            <span className={finelyOsStatusChip('warn')}>Manual entry</span>
          )}
          {!debt ? (
            <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Select or create a debt case above to persist these fields.</span>
          ) : null}
          {savedNotice ? <span className={`text-xs text-emerald-300/90`}>{savedNotice}</span> : null}
        </div>
      </div>

      {!compact ? (
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
      ) : null}

      {mode === 'court' && summonsDocs.length > 0 ? (
        <div className={`${cardShell('violet')} ${pad} space-y-4`}>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <FileSearch size={14} className="text-violet-300" />
            Summons & legal documents
          </div>
          {!compact ? (
          <p className={FINELY_OS_ENTITY_BODY}>
            Choose the summons or complaint we read from your evidence. Affidavit drafts use extracted case facts from this document.
          </p>
          ) : null}
          <select
            value={selectedSummons?.id || ''}
            onChange={(e) => onSummonsDocChange?.(e.target.value || null)}
            className={compact ? `${finelyOsGlowField(glowAccent)} mt-1 max-w-md` : FINELY_OS_ENTITY_INPUT}
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
                  <div key={label} className={`${compact ? finelyOsGlowKpi(glowAccent) : 'rounded-xl border border-white/10 bg-black/20'} p-3`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{value}</div>
                  </div>
                ))}
              {selectedSummons.summary ? (
                <div className={`sm:col-span-2 ${compact ? finelyOsGlowKpi(glowAccent) : 'rounded-xl border border-white/10 bg-black/20'} p-3`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Document summary</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{selectedSummons.summary}</div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <FinelyOsWorkstationModal
        open={collectionsModalOpen}
        onClose={() => setCollectionsModalOpen(false)}
        title="Collections & charge-offs"
        subtitle={`${collectionRows.length} accounts from your report — tap one to fill the mailing block`}
        accent="fuchsia"
        size="large"
      >
        <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {collectionRows.map((t) => (
            <button
              key={t.collectionId}
              type="button"
              onClick={() => {
                applyCollection(t);
                setCollectionsModalOpen(false);
              }}
              className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                t.mailingAddress
                  ? 'border-fuchsia-400/35 bg-fuchsia-500/10 hover:bg-fuchsia-500/20'
                  : 'border-amber-400/30 bg-amber-500/[0.07] hover:bg-amber-500/15'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-fuchsia-100">
                  <Building2 size={13} className="shrink-0" />
                  <span>{t.label}</span>
                </span>
                <span className="shrink-0 text-[9px] font-semibold uppercase tracking-widest text-sky-300">
                  {t.addressSource === 'report_contact'
                    ? 'Report contact'
                    : t.addressSource === 'directory'
                      ? 'Directory'
                      : t.addressSource === 'tradeline'
                        ? 'Tradeline'
                        : 'Missing'}
                </span>
              </div>
              {t.matchedContactName && t.matchedContactName !== t.creditorName ? (
                <div className="mt-1 text-xs text-white/45">Contact: {t.matchedContactName}</div>
              ) : null}
              {t.mailingAddress ? (
                <div className="mt-2 whitespace-pre-line text-xs text-white/70">{t.mailingAddress}</div>
              ) : (
                <div className="mt-2 text-xs text-amber-200/80">No mailing address yet — Re-parse report or Fill address</div>
              )}
              {t.phone ? <div className="text-xs text-white/45 mt-1">{t.phone}</div> : null}
            </button>
          ))}
        </div>
      </FinelyOsWorkstationModal>
    </div>
  );
}

export type { DebtPartyInfo };
