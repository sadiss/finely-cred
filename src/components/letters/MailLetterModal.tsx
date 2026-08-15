import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, ExternalLink, Send, AlertTriangle, MapPin, Package } from 'lucide-react';
import type { LetterRecord } from '../../domain/letters';
import type { EvidenceItem } from '../../domain/evidence';
import { businessBureauDisputeAddress, consumerBureauDisputeAddress } from '../../letters/bureauAddresses';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';
import {
  formatMailAddressOneLine,
  mailLetterViaProvider,
  quoteMailOptionsViaProvider,
  verifyMailAddressesViaProvider,
  type MailAddress,
  type MailAddressVerificationResult,
} from '../../lib/mailerClient';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';
import { buildLetterAgentChain } from '../../lib/letterAgentChain';
import { canAffordMailSend, chargeMailSend, formatMailCreditsUsd, setMailCostPerLetterCents } from '../../data/mailCreditsRepo';
import { MAIL_CLASS_CHOICES, defaultMailTypeForLetter, mailClassChoice, type FinelyMailType } from '../../lib/mailClassOptions';
import { MailCreditsPanel } from '../mailing/MailCreditsPanel';
import { MailProviderStatusBanner } from '../mailing/MailProviderStatusBanner';
import { LetterAgentChainStrip } from './LetterAgentChainStrip';
import { LetterEmailPartnerToggle } from './LetterEmailPartnerToggle';
import { appendAiActionAudit } from '../../data/aiActionAuditLog';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, FINELY_OS_ENTITY_BODY, FINELY_OS_MODAL_HEADER } from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';
import {
  enrichRecipientAddress,
  enrichRecipientAddressSync,
  parseMailingAddress,
} from '../../lib/recipientAddressEnrichment';
import { getDebt } from '../../data/debtRepo';
import { resolveMailModalToAddress } from '../../lib/letterMailingAddress';
import { backfillLetterMailToMeta } from '../../lib/letterMailToBackfill';
import { upsertLetter } from '../../data/lettersRepo';
import { LetterPartnerNoteField } from './LetterPartnerNoteField';
import { recordLetterPartnerNote } from '../../lib/letterPartnerNotes';
import { markValidationLetterMailed } from '../../lib/validationAccountState';
import { buildLetterStreamJobNaming, previewLetterStreamJobName } from '../../lib/letterStreamJobName';

type WizardStep = 'confirm' | 'mail' | 'track';

function sanitizeState(s: string) {
  return (s || '').trim().toUpperCase().slice(0, 2);
}

function zipOnly(s: string) {
  return (s || '').replace(/\D/g, '').slice(0, 10);
}

function parseCityStateZip(s: string): { city: string; state: string; zip: string } | null {
  const raw = (s || '').trim();
  if (!raw) return null;
  const m = raw.match(/^(.+?),\s*([A-Za-z]{2})\s+(.+)$/);
  if (!m) return null;
  return { city: m[1]!.trim(), state: sanitizeState(m[2]!), zip: String(m[3] || '').trim() };
}

function mailDefaultsForDisputeRecipient(letter: LetterRecord): Partial<MailAddress> | null {
  const meta: any = (letter as any)?.meta ?? null;
  const isObj = meta && typeof meta === 'object';

  if (isObj && meta.bureauMailingAddress) {
    const name = String(meta.bureauMailingName || '').trim();
    const fromSaved = resolveMailModalToAddress({
      letter: {
        meta: {
          mailToName: name,
          mailToAddress: String(meta.bureauMailingAddress),
        },
      },
    });
    if (fromSaved) return fromSaved;
  }

  if (isObj && (meta.context === 'business_dispute' || meta.bureauKind === 'business') && meta.businessBureau) {
    const addr = businessBureauDisputeAddress(meta.businessBureau);
    const lines = (addr.lines ?? []).map((x) => String(x || '').trim()).filter(Boolean);
    if (!lines.length) return null;
    const name = String(addr.name || '').trim() || 'Business bureau';
    const cityStateZip = lines[lines.length - 1] || '';
    const parsed = parseCityStateZip(cityStateZip);
    if (!parsed) return null;
    const midLines = lines.slice(0, -1);
    const addressLine1 = midLines[midLines.length - 1] ?? '';
    const addressLine2 = midLines.length > 1 ? midLines.slice(0, -1).join(', ') : undefined;
    return { name, addressLine1, addressLine2, city: parsed.city, state: parsed.state, zip: parsed.zip };
  }

  const bureau = isObj && 'bureau' in meta ? (meta.bureau as any) : null;
  if (!bureau) return null;
  const addr = consumerBureauDisputeAddress(bureau);
  const lines = (addr.lines ?? []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!lines.length) return null;
  const first = lines[0] || '';
  const addressLine1 = (first.toLowerCase() === String(addr.name || '').toLowerCase() ? lines[1] : first) || '';
  const cityStateZip = lines[lines.length - 1] || '';
  const parsed = parseCityStateZip(cityStateZip);
  if (!parsed) return null;
  return {
    name: addr.name,
    addressLine1,
    city: parsed.city,
    state: parsed.state,
    zip: parsed.zip,
  };
}

function deliverabilityLabel(v: any): string {
  const s = String(v || '').trim();
  return s ? s.replaceAll('_', ' ') : 'unknown';
}

function AddressFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MailAddress;
  onChange: (next: MailAddress) => void;
}) {
  return (
    <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
      <div className="text-white font-semibold text-sm inline-flex items-center gap-2">
        <MapPin size={14} className="text-amber-300" /> {label}
      </div>
      {(['name', 'addressLine1', 'addressLine2', 'city', 'state', 'zip'] as const).map((k) => (
        <label key={k} className="block">
          <div className="text-[10px] uppercase tracking-widest text-white/40">
            {k === 'name'
              ? 'Name'
              : k === 'addressLine1'
                ? 'Street address'
                : k === 'addressLine2'
                  ? 'Apt / suite (optional)'
                  : k === 'city'
                    ? 'City'
                    : k === 'state'
                      ? 'State'
                      : 'ZIP'}
          </div>
          <input
            value={(value as any)[k] ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                [k]: k === 'state' ? sanitizeState(e.target.value) : k === 'zip' ? zipOnly(e.target.value) : e.target.value,
              })
            }
            className="mt-1.5 w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2.5 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
            placeholder={k === 'state' ? 'CA' : k === 'zip' ? '90210' : ''}
          />
        </label>
      ))}
    </div>
  );
}

export function MailLetterModal({
  open,
  partnerId,
  letter,
  defaultFromName,
  defaultFromAddress,
  onClose,
  onMailed,
  onStatus,
  onNotifyMailed,
  onNotifyReadyToMail,
  emailPartnerDefault = true,
  evidence = [],
  trackHref,
  noteAuthorType = 'partner',
  noteAuthorEmail,
}: {
  open: boolean;
  partnerId: string;
  letter: LetterRecord;
  defaultFromName?: string;
  defaultFromAddress?: Partial<MailAddress>;
  evidence?: EvidenceItem[];
  trackHref?: string;
  onClose: () => void;
  onMailed: (args: {
    providerId: string;
    expectedDeliveryDate?: string;
    status?: string;
    to: MailAddress;
    from: MailAddress;
    cost?: number;
  }) => void;
  onStatus?: (args: { status: 'mail_pending' | 'mail_failed'; error?: string; to: MailAddress; from: MailAddress }) => void;
  /** Optional notify hook — callers should send Finely Mail confirmation email. */
  onNotifyMailed?: (args: {
    providerId: string;
    expectedDeliveryDate?: string;
    to: MailAddress;
    from: MailAddress;
  }) => void | Promise<void>;
  /** When partner opts in, notify that letter is ready / mail_pending. */
  onNotifyReadyToMail?: (args: { emailPartner: boolean; to: MailAddress; from: MailAddress }) => void | Promise<void>;
  emailPartnerDefault?: boolean;
  /** Specialist / admin mailing on behalf of partner */
  noteAuthorType?: 'partner' | 'admin';
  noteAuthorEmail?: string;
}) {
  const [effectiveLetter, setEffectiveLetter] = useState(letter);
  const canMail = Boolean(effectiveLetter.pdfBlobRef);
  const [step, setStep] = useState<WizardStep>('confirm');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mailedMeta, setMailedMeta] = useState<{
    providerId: string;
    expectedDeliveryDate?: string;
    cost?: number;
  } | null>(null);
  /** Set when the physical mail succeeded but the internal credits ledger charge failed — never conflate with a failed send. */
  const [ledgerWarning, setLedgerWarning] = useState<string | null>(null);

  const [to, setTo] = useState<MailAddress>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });
  const [from, setFrom] = useState<MailAddress>({
    name: defaultFromName || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  });

  const [pdfPreview, setPdfPreview] = useState<{ url: string; revoke?: () => void } | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [verifyRes, setVerifyRes] = useState<{ to: MailAddressVerificationResult; from: MailAddressVerificationResult } | null>(
    null,
  );
  const [verifiedHash, setVerifiedHash] = useState<string | null>(null);
  const [mailType, setMailType] = useState<FinelyMailType>(() => defaultMailTypeForLetter(letter));
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteByType, setQuoteByType] = useState<Partial<Record<FinelyMailType, number>>>({});
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [emailPartner, setEmailPartner] = useState(emailPartnerDefault);
  const [partnerNote, setPartnerNote] = useState('');
  const [addressHint, setAddressHint] = useState<string | null>(null);
  // Fresh per mail attempt (regenerated whenever the modal opens) so a retry after a
  // failed send never reuses the same LetterStream job/batch id — LetterStream rejects
  // resends with a previously-used batch id ("Batch Id is not unique", code -925).
  const [attemptNonce, setAttemptNonce] = useState(() => Date.now().toString(36).slice(-4));

  const currentHash = useMemo(() => {
    const pick = (a: MailAddress) => ({
      name: a.name,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 || '',
      city: a.city,
      state: sanitizeState(a.state),
      zip: zipOnly(a.zip),
    });
    return JSON.stringify({ to: pick(to), from: pick(from) });
  }, [to, from]);

  const jobNaming = useMemo(
    () =>
      buildLetterStreamJobNaming({
        partnerDisplayName: defaultFromName,
        letter: effectiveLetter,
        disambiguator: attemptNonce,
      }),
    [defaultFromName, effectiveLetter, attemptNonce],
  );

  const letterStreamJobPreview = useMemo(() => previewLetterStreamJobName(jobNaming), [jobNaming]);

  const quoteIdempotencyKey = useMemo(
    () => `${effectiveLetter.id}:${currentHash}:${mailType}`,
    [effectiveLetter.id, currentHash, mailType],
  );

  useEffect(() => {
    if (!open) return;
    const { letter: backfilled, changed } = backfillLetterMailToMeta(letter);
    if (changed) upsertLetter(backfilled);
    setEffectiveLetter(backfilled);
    setStep('confirm');
    setErr(null);
    setMailedMeta(null);
    setLedgerWarning(null);
    setVerifyRes(null);
    setVerifiedHash(null);
    setAddressHint(null);
    setEmailPartner(emailPartnerDefault);
    setPartnerNote('');
    setMailType(defaultMailTypeForLetter(backfilled));
    setAttemptNonce(Date.now().toString(36).slice(-4));
    const disputeTo = mailDefaultsForDisputeRecipient(backfilled);
    const meta: any = (backfilled as any)?.meta ?? null;
    const linkedDebt =
      meta?.debtId && typeof meta.debtId === 'string' ? getDebt(meta.debtId) : null;
    const resolvedTo = resolveMailModalToAddress({
      letter: backfilled,
      linkedDebt,
      disputeBureauDefaults: disputeTo,
    });
    const enrich = resolvedTo
      ? null
      : enrichRecipientAddressSync({
          preferCounsel: Boolean(meta?.debtTrack === 'court'),
          nameCandidates: [
            disputeTo?.name,
            backfilled.title,
            meta?.creditorName,
            linkedDebt?.name,
            meta?.plaintiffLawFirm,
            linkedDebt?.plaintiffLawFirm,
            meta?.collectorName,
            linkedDebt?.collectorName,
            meta?.recipientName,
            linkedDebt?.recipientName,
          ],
          addressCandidates: [
            meta?.mailToAddress,
            meta?.recipientAddress,
            linkedDebt?.recipientAddress,
            meta?.plaintiffLawFirmAddress,
            linkedDebt?.plaintiffLawFirmAddress,
          ],
        });
    const enrichParsed =
      enrich?.structured || (enrich?.address ? parseMailingAddress(enrich.address) : null);
    const structured = resolvedTo
      ? resolvedTo
      : enrichParsed
        ? {
            name: enrich?.name || disputeTo?.name || linkedDebt?.collectorName || linkedDebt?.name || '',
            addressLine1: enrichParsed.line1 || disputeTo?.addressLine1 || '',
            addressLine2: enrichParsed.line2 || disputeTo?.addressLine2 || '',
            city: enrichParsed.city || disputeTo?.city || '',
            state: enrichParsed.state || disputeTo?.state || '',
            zip: enrichParsed.zip || disputeTo?.zip || '',
          }
        : null;
    setTo({
      name: structured?.name || disputeTo?.name || linkedDebt?.collectorName || linkedDebt?.name || '',
      addressLine1: structured?.addressLine1 || disputeTo?.addressLine1 || '',
      addressLine2: structured?.addressLine2 || disputeTo?.addressLine2 || '',
      city: structured?.city || disputeTo?.city || '',
      state: structured?.state || disputeTo?.state || '',
      zip: structured?.zip || disputeTo?.zip || '',
    });
    if (enrich?.verifyRequired) {
      setAddressHint(enrich.hint || 'Verify recipient address before mailing.');
    }
    setFrom({
      name: defaultFromName || '',
      addressLine1: defaultFromAddress?.addressLine1 ?? '',
      addressLine2: defaultFromAddress?.addressLine2 ?? '',
      city: defaultFromAddress?.city ?? '',
      state: defaultFromAddress?.state ?? '',
      zip: defaultFromAddress?.zip ?? '',
    });

    const needAsync = (a: MailAddress) =>
      !a.name?.trim() || !a.addressLine1?.trim() || !a.city?.trim() || !a.state?.trim() || !a.zip?.trim();
    const initialTo = {
      name: structured?.name || disputeTo?.name || linkedDebt?.collectorName || linkedDebt?.name || '',
      addressLine1: structured?.addressLine1 || disputeTo?.addressLine1 || '',
      addressLine2: structured?.addressLine2 || disputeTo?.addressLine2 || '',
      city: structured?.city || disputeTo?.city || '',
      state: structured?.state || disputeTo?.state || '',
      zip: structured?.zip || disputeTo?.zip || '',
    };
    if (needAsync(initialTo)) {
      let alive = true;
      void enrichRecipientAddress({
        preferCounsel: Boolean(meta?.debtTrack === 'court'),
        nameCandidates: [
          disputeTo?.name,
          backfilled.title,
          meta?.creditorName,
          linkedDebt?.name,
          meta?.plaintiffLawFirm,
          linkedDebt?.plaintiffLawFirm,
          meta?.collectorName,
          linkedDebt?.collectorName,
          meta?.recipientName,
          linkedDebt?.recipientName,
        ],
        addressCandidates: [
          meta?.mailToAddress,
          meta?.recipientAddress,
          linkedDebt?.recipientAddress,
          meta?.plaintiffLawFirmAddress,
          linkedDebt?.plaintiffLawFirmAddress,
        ],
      }).then((asyncEnrich) => {
        if (!alive || !asyncEnrich) return;
        const asyncStructured =
          asyncEnrich.structured || (asyncEnrich.address ? parseMailingAddress(asyncEnrich.address) : null);
        setTo((prev) => ({
          name: prev.name?.trim() ? prev.name : asyncEnrich.name || prev.name,
          addressLine1: prev.addressLine1?.trim() ? prev.addressLine1 : asyncStructured?.line1 || prev.addressLine1,
          addressLine2: prev.addressLine2?.trim() ? prev.addressLine2 : asyncStructured?.line2 || prev.addressLine2,
          city: prev.city?.trim() ? prev.city : asyncStructured?.city || prev.city,
          state: prev.state?.trim() ? prev.state : asyncStructured?.state || prev.state,
          zip: prev.zip?.trim() ? prev.zip : asyncStructured?.zip || prev.zip,
        }));
        if (asyncEnrich.verifyRequired) {
          setAddressHint(asyncEnrich.hint || 'Verify recipient address before mailing.');
        }
      });
      return () => {
        alive = false;
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, letter.id]);

  useEffect(() => {
    if (!open) return;
    if (verifiedHash && verifiedHash !== currentHash) {
      setVerifyRes(null);
      setVerifiedHash(null);
      setVerifyErr(null);
    }
  }, [open, currentHash, verifiedHash]);

  const selectedCostCents = useMemo(() => {
    const q = quoteByType[mailType];
    return q != null && Number.isFinite(q) ? Math.round(q * 100) : mailClassChoice(mailType).estCostCents;
  }, [quoteByType, mailType]);

  useEffect(() => {
    if (!open || !effectiveLetter.pdfBlobRef || step !== 'confirm') return;
    const need = (a: MailAddress) => !a.name?.trim() || !a.addressLine1?.trim() || !a.city?.trim() || !a.state?.trim() || !a.zip?.trim();
    if (need(to) || need(from)) return;
    const handle = window.setTimeout(() => {
      void (async () => {
        setQuoteBusy(true);
        setQuoteErr(null);
        try {
          const res = await quoteMailOptionsViaProvider({
            letterId: effectiveLetter.id,
            pdfBlobRef: effectiveLetter.pdfBlobRef!,
            to: { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) },
            from: { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) },
            selectedMailType: mailType,
            quoteIdempotencyKey,
            jobNaming,
          });
          if (!res.ok) {
            setQuoteErr(res.error || 'Live pricing unavailable');
            return;
          }
          const map: Partial<Record<FinelyMailType, number>> = {};
          for (const q of res.quotes) {
            if (
              q.costUsd != null &&
              Number.isFinite(q.costUsd) &&
              (q.mailType === 'firstclass' || q.mailType === 'certified' || q.mailType === 'certnoerr')
            ) {
              map[q.mailType] = q.costUsd;
            }
          }
          setQuoteByType(map);
          const selected = map[mailType];
          if (selected != null) setMailCostPerLetterCents(Math.round(selected * 100));
        } catch (e: unknown) {
          setQuoteErr((e as Error)?.message || 'Quote failed');
        } finally {
          setQuoteBusy(false);
        }
      })();
    }, 500);
    return () => window.clearTimeout(handle);
  }, [open, step, effectiveLetter.id, effectiveLetter.pdfBlobRef, currentHash, mailType, to, from, quoteIdempotencyKey, jobNaming]);

  useEffect(() => {
    if (!open) return;
    if (!effectiveLetter.pdfBlobRef) {
      setPdfPreview(null);
      return;
    }
    let mounted = true;
    let revoke: (() => void) | undefined;
    void (async () => {
      try {
        const res = await getBlobUrl(effectiveLetter.pdfBlobRef!, { mimeType: 'application/pdf', preferSigned: true });
        if (!mounted || !res?.url) return;
        revoke = res.revoke;
        setPdfPreview({ url: res.url, revoke: res.revoke });
      } catch {
        if (!mounted) return;
        setPdfPreview(null);
      }
    })();
    return () => {
      mounted = false;
      try {
        revoke?.();
      } catch {
        /* ignore */
      }
    };
  }, [open, effectiveLetter.pdfBlobRef]);

  const invalid = useMemo(() => {
    const need = (a: MailAddress) =>
      !a.name.trim() || !a.addressLine1.trim() || !a.city.trim() || !sanitizeState(a.state) || zipOnly(a.zip).length < 5;
    return need(to) || need(from) || !canMail;
  }, [to, from, canMail]);

  const deliverability = useMemo(() => {
    const toRaw = verifyRes?.to?.raw as { deliverability?: string; deliverability_analysis?: { deliverability?: string } } | null;
    const fromRaw = verifyRes?.from?.raw as { deliverability?: string; deliverability_analysis?: { deliverability?: string } } | null;
    if (toRaw?.deliverability === 'deferred' || fromRaw?.deliverability === 'deferred') {
      return { toDel: 'valid_format', fromDel: 'valid_format', deferred: true as const };
    }
    const toDel = toRaw ? (toRaw.deliverability ?? toRaw.deliverability_analysis?.deliverability ?? null) : null;
    const fromDel = fromRaw ? (fromRaw.deliverability ?? fromRaw.deliverability_analysis?.deliverability ?? null) : null;
    return { toDel, fromDel, deferred: false as const };
  }, [verifyRes]);

  const verifiedOk = useMemo(() => {
    if (!verifyRes) return false;
    if (deliverability.deferred) return true;
    const bad = new Set(['undeliverable', 'no_match']);
    const toDel = String(deliverability.toDel || '').toLowerCase();
    const fromDel = String(deliverability.fromDel || '').toLowerCase();
    if (!toDel || !fromDel) return false;
    return !bad.has(toDel) && !bad.has(fromDel);
  }, [verifyRes, deliverability]);

  const agentChain = useMemo(() => buildLetterAgentChain({ letter: effectiveLetter, evidence }), [effectiveLetter, evidence]);

  if (!open) return null;

  const verify = async () => {
    if (invalid || verifyBusy) return;
    setVerifyErr(null);
    setVerifyBusy(true);
    try {
      const toClean: MailAddress = { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) };
      const fromClean: MailAddress = { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) };
      const res = await verifyMailAddressesViaProvider({ to: toClean, from: fromClean });
      setVerifyRes({ to: res.to, from: res.from });
      setVerifiedHash(currentHash);
    } catch (e: any) {
      setVerifyRes(null);
      setVerifiedHash(null);
      setVerifyErr(e?.message || 'Verification failed.');
    } finally {
      setVerifyBusy(false);
    }
  };

  const goMailStep = async () => {
    setErr(null);
    if (invalid) {
      setErr('Fill complete To and From addresses (name, street, city, state, ZIP).');
      return;
    }
    if (!verifiedOk) {
      await verify();
    }
    const toClean: MailAddress = { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) };
    const fromClean: MailAddress = { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) };
    void onNotifyReadyToMail?.({ emailPartner, to: toClean, from: fromClean });
    setStep('mail');
  };

  const submit = async () => {
    if (!effectiveLetter.pdfBlobRef) return;
    if (invalid || busy) return;
    if (!agentChain.readyToMail) {
      setErr(agentChain.blockingMessage ?? 'Complete the review steps before mailing.');
      appendAiActionAudit({
        kind: 'letter_chain',
        action: 'Mail blocked — compliance gate',
        detail: agentChain.blockingMessage,
        partnerId,
        status: 'blocked',
        meta: { letterId: effectiveLetter.id },
      });
      return;
    }
    if (!verifiedOk) {
      setErr('Confirm addresses first (tap Back → Confirm address).');
      setStep('confirm');
      return;
    }
    const afford = canAffordMailSend(undefined, selectedCostCents);
    if (!afford.ok) {
      setErr(
        `Insufficient mailing ledger. Need ${formatMailCreditsUsd(selectedCostCents)} for ${mailClassChoice(mailType).shortLabel}; available ${formatMailCreditsUsd(afford.balanceCents)}. Sync LetterStream prepaid in Admin Settings.`,
      );
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const toClean: MailAddress = { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) };
      const fromClean: MailAddress = { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) };
      onStatus?.({ status: 'mail_pending', to: toClean, from: fromClean });
      const res = await mailLetterViaProvider({
        partnerId,
        letterId: effectiveLetter.id,
        pdfBlobRef: effectiveLetter.pdfBlobRef,
        to: toClean,
        from: fromClean,
        jobNaming,
        options: { color: true, doubleSided: true, mailType },
      });
      const costCents =
        typeof res.cost === 'number' && Number.isFinite(res.cost)
          ? Math.round(res.cost * (res.cost < 20 ? 100 : 1))
          : undefined;
      // The physical letter is already mailed at this point (provider call above succeeded) — a
      // ledger charge failure (e.g. balance drifted below the live cost) must never be reported as
      // a failed mailing. Surface it as a secondary reconciliation warning instead.
      try {
        chargeMailSend({ letterId: effectiveLetter.id, partnerId, costCents });
      } catch (chargeError: any) {
        setLedgerWarning(
          chargeError?.message ||
            'Mail credits could not be charged for this send. Contact an admin to reconcile the mail ledger.',
        );
      }
      setMailedMeta({
        providerId: res.providerId,
        expectedDeliveryDate: res.expectedDeliveryDate,
        cost: res.cost,
      });
      onMailed({
        providerId: res.providerId,
        expectedDeliveryDate: res.expectedDeliveryDate,
        status: res.status,
        to: toClean,
        from: fromClean,
        cost: res.cost,
      });
      const debtCaseId =
        effectiveLetter.meta && 'debtId' in effectiveLetter.meta && typeof (effectiveLetter.meta as { debtId?: string }).debtId === 'string'
          ? (effectiveLetter.meta as { debtId?: string }).debtId
          : undefined;
      // Wait clock starts only when a validation letter is mailed — never court filings.
      if (debtCaseId && effectiveLetter.type === 'validation') {
        markValidationLetterMailed({ debtCaseId, partnerId, mailedAt: new Date().toISOString() });
      }
      if (partnerNote.trim()) {
        recordLetterPartnerNote({
          partnerId,
          body: partnerNote,
          title: `Mailed: ${effectiveLetter.title}`,
          letterId: effectiveLetter.id,
          debtCaseId,
          source: 'letter_mail',
          authorType: noteAuthorType,
          authorEmail: noteAuthorEmail,
        });
        setPartnerNote('');
      }
      try {
        await onNotifyMailed?.({
          providerId: res.providerId,
          expectedDeliveryDate: res.expectedDeliveryDate,
          to: toClean,
          from: fromClean,
        });
      } catch {
        /* email is best-effort — mail already succeeded */
      }
      setStep('track');
    } catch (e: any) {
      const msg = e?.message || 'Mailing failed.';
      setErr(msg);
      const toClean: MailAddress = { ...to, state: sanitizeState(to.state), zip: zipOnly(to.zip) };
      const fromClean: MailAddress = { ...from, state: sanitizeState(from.state), zip: zipOnly(from.zip) };
      onStatus?.({ status: 'mail_failed', error: msg, to: toClean, from: fromClean });
    } finally {
      setBusy(false);
    }
  };

  const steps: { id: WizardStep; label: string }[] = [
    { id: 'confirm', label: '1 · Confirm address' },
    { id: 'mail', label: '2 · Mail' },
    { id: 'track', label: '3 · Track' },
  ];

  return (
    <div className="fixed inset-0 z-[9600] flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => (busy || step === 'track' ? null : onClose())} />
      <div
        className="relative w-full max-w-4xl rounded-3xl border border-white/[0.08] bg-fc-shell shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={FINELY_OS_MODAL_HEADER}>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-white/40">{FINELY_MAIL_COPY.serviceName}</div>
            <div className="mt-1 text-xl font-light text-white truncate">{effectiveLetter.title}</div>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              First-timer path: Confirm address → Mail → Track. One clear action per step.
            </p>
          </div>
          <FinelyOsModalCloseButton onClick={onClose} disabled={busy} />
        </div>

        <div className="px-4 pt-3 flex flex-wrap items-center gap-1.5">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              {idx > 0 ? <ChevronRight size={16} className="text-white/30 shrink-0" aria-hidden /> : null}
              <span
                className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  step === s.id
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-50'
                    : 'border-white/12 bg-black/30 text-white/55'
                }`}
              >
                {s.label}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="p-4 space-y-4 max-h-[72vh] overflow-y-auto">
          <MailProviderStatusBanner compact letterCount={1} />

          {!canMail ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-100 text-sm">
              This letter has no stored PDF. Generate and save it to the vault before mailing.
            </div>
          ) : null}
          {err ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-100 text-sm">{err}</div> : null}
          {effectiveLetter.type === 'dispute' ? <LetterAgentChainStrip steps={agentChain.steps} /> : null}

          {step === 'confirm' ? (
            <>
              <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Recipient preview</div>
                <div className="text-sm text-white/90">{to.name.trim() ? formatMailAddressOneLine(to) : 'Fill the To address below'}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 pt-2">Return address</div>
                <div className="text-sm text-white/75">{from.name.trim() ? formatMailAddressOneLine(from) : 'Fill the From address below'}</div>
                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {quoteBusy
                    ? 'Fetching live LetterStream pricing…'
                    : quoteByType[mailType] != null
                      ? `Live quote: ${formatMailCreditsUsd(selectedCostCents)} for ${mailClassChoice(mailType).shortLabel}`
                      : `Est. ${formatMailCreditsUsd(selectedCostCents)} for ${mailClassChoice(mailType).shortLabel} (complete addresses for live quote).`}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 pt-2">LetterStream job name</div>
                <div className="text-sm font-mono text-sky-200">{letterStreamJobPreview}</div>
              </div>

              <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-2">
                <div className="text-white font-semibold text-sm">Mail class</div>
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Default selected for this letter: <span className="text-amber-100">{mailClassChoice(mailType).shortLabel}</span>.{' '}
                  {mailClassChoice(mailType).speedNote} Prices below come from LetterStream preauth when addresses are complete.
                </p>
                {quoteErr ? <p className="text-xs text-amber-100/90">{quoteErr}</p> : null}
                <div className="grid gap-2">
                  {MAIL_CLASS_CHOICES.map((c) => {
                    const liveUsd = quoteByType[c.id];
                    return (
                    <label
                      key={c.id}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 cursor-pointer ${
                        mailType === c.id
                          ? 'border-amber-400/45 bg-amber-500/10'
                          : 'border-white/10 bg-black/25 hover:border-white/20'
                      }`}
                    >
                      <input
                        type="radio"
                        name="mailType"
                        className="mt-1"
                        checked={mailType === c.id}
                        onChange={() => setMailType(c.id)}
                      />
                      <span className="flex-1 min-w-0">
                        <span className="flex flex-wrap items-center justify-between gap-2">
                          <span className="block text-sm font-semibold text-white">{c.label}</span>
                          <span className="text-xs font-mono text-amber-100/95 shrink-0">
                            {quoteBusy ? '…' : liveUsd != null ? formatMailCreditsUsd(Math.round(liveUsd * 100)) : formatMailCreditsUsd(c.estCostCents)}
                          </span>
                        </span>
                        <span className={`block text-xs ${FINELY_OS_ENTITY_BODY}`}>{c.useWhen}</span>
                      </span>
                    </label>
                  );})}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <AddressFields label="To — who receives this letter" value={to} onChange={setTo} />
                <AddressFields label="From — return address on the envelope" value={from} onChange={setFrom} />
              </div>
              {addressHint ? (
                <p className="text-xs text-amber-100/90 flex items-start gap-1.5">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  {addressHint}
                </p>
              ) : null}
              <LetterEmailPartnerToggle
                checked={emailPartner}
                onChange={setEmailPartner}
                label="Email partner"
                hint="When ready / mailed"
              />
              <LetterPartnerNoteField
                id="mail-letter-partner-note"
                value={partnerNote}
                onChange={setPartnerNote}
                label="Optional partner note (saved on mail)"
                placeholder="Log context for this mail action on the partner record…"
              />

              <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold text-sm">PDF preview</div>
                    <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>This exact file is what gets printed and mailed.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => pdfPreview?.url && openUrlInNewTab({ url: pdfPreview.url })}
                    disabled={!pdfPreview?.url}
                    className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
                  >
                    <ExternalLink size={14} /> Open PDF
                  </button>
                </div>
                {pdfPreview?.url ? (
                  <iframe title="Letter PDF preview" src={pdfPreview.url} className="w-full h-[220px] rounded-xl border border-white/10" />
                ) : (
                  <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Preview unavailable.</div>
                )}
              </div>

              <div className="fc-light-glass-panel fc-light-chrome-panel p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-white font-semibold text-sm">Address check</div>
                  <button
                    type="button"
                    onClick={() => void verify()}
                    disabled={verifyBusy || invalid}
                    className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
                  >
                    {verifyBusy ? 'Checking…' : verifiedOk ? 'Re-check addresses' : 'Check addresses'}
                  </button>
                </div>
                {verifyErr ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100 text-sm">{verifyErr}</div>
                ) : null}
                {verifyRes ? (
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-white/80">
                    <div className="inline-flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" /> To: {deliverabilityLabel(deliverability.toDel)}
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" /> From: {deliverabilityLabel(deliverability.fromDel)}
                    </div>
                  </div>
                ) : (
                  <div className={`text-sm inline-flex items-start gap-2 ${FINELY_OS_ENTITY_BODY}`}>
                    <AlertTriangle size={14} className="text-amber-300 mt-0.5" />
                    Check addresses, then continue. Format-valid is enough for Finely Mail.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 sticky bottom-0 bg-fc-shell/95 py-2">
                <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void goMailStep()}
                  disabled={invalid || verifyBusy}
                  className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}
                >
                  Continue to Mail <ChevronRight size={16} />
                </button>
              </div>
            </>
          ) : null}

          {step === 'mail' ? (
            <>
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 space-y-2">
                <div className="text-white font-semibold">Ready to mail</div>
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  To: {formatMailAddressOneLine(to)}
                  <br />
                  From: {formatMailAddressOneLine(from)}
                </p>
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Cost estimate {formatMailCreditsUsd(selectedCostCents)} ({mailClassChoice(mailType).shortLabel}). One tap sends this PDF via {FINELY_MAIL_COPY.serviceName}.
                </p>
                {addressHint ? (
                  <p className="text-xs text-amber-100/90 flex items-start gap-1.5">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    {addressHint}
                  </p>
                ) : null}
              </div>
              <LetterEmailPartnerToggle
                checked={emailPartner}
                onChange={setEmailPartner}
                label="Email partner"
                hint="Confirm when mailed"
              />
              <MailCreditsPanel compact />
              <div className="flex justify-between gap-2 sticky bottom-0 bg-fc-shell/95 py-2">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} disabled={busy} onClick={() => setStep('confirm')}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={busy || invalid || !verifiedOk}
                  className={`${FINELY_OS_PRIMARY_BTN} !text-sm disabled:opacity-60`}
                >
                  <Send size={16} /> {busy ? 'Mailing…' : 'Mail this letter'}
                </button>
              </div>
            </>
          ) : null}

          {step === 'track' && mailedMeta ? (
            <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-5 space-y-3">
              <div className="inline-flex items-center gap-2 text-emerald-200 font-semibold">
                <Package size={18} /> Mailed successfully
              </div>
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Tracking / job id: <span className="font-mono text-white/90">{mailedMeta.providerId}</span>
                {mailedMeta.expectedDeliveryDate ? (
                  <>
                    <br />
                    Expected delivery: {mailedMeta.expectedDeliveryDate}
                  </>
                ) : null}
              </p>
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Status is saved on the letter. Watch the Letters Vault for mail_pending → mailed updates.
              </p>
              {ledgerWarning ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100 text-sm flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{ledgerWarning}</span>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {trackHref ? (
                  <a href={trackHref} className={FINELY_OS_PRIMARY_BTN}>
                    Open Letters Vault
                  </a>
                ) : null}
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
