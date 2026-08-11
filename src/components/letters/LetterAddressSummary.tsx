import React, { useState } from 'react';
import { AlertTriangle, MapPin, Wand2 } from 'lucide-react';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_COMPACT_INPUT,
  FINELY_OS_COMPACT_TEXTAREA,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';
import {
  LETTER_L4_ADDRESS_TITLE,
  LETTER_L4_WORK_CARD,
  LETTER_L5_DISCLAIMER,
} from './letterEasyFlowTokens';
import type { AddressEnrichmentSource } from '../../lib/recipientAddressEnrichment';
import { enrichmentSourceLabel } from '../../lib/recipientAddressEnrichment';

export type LetterAddressFields = {
  fromName: string;
  fromLine1: string;
  fromLine2?: string;
  fromCityStateZip: string;
  toName: string;
  toLinesText: string;
  subject: string;
};

export function LetterAddressSummary({
  value,
  onChange,
  defaultOpen = false,
  recipientKind = 'bureau',
  enrichmentSource,
  verifyRequired,
  enrichmentHint,
  onLookupAddress,
  lookupBusy,
}: {
  value: LetterAddressFields;
  onChange: (patch: Partial<LetterAddressFields>) => void;
  defaultOpen?: boolean;
  /** Bureau dispute letters vs creditor / counsel debt letters */
  recipientKind?: 'bureau' | 'creditor';
  enrichmentSource?: AddressEnrichmentSource;
  verifyRequired?: boolean;
  enrichmentHint?: string;
  onLookupAddress?: () => void | Promise<void>;
  lookupBusy?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || Boolean(verifyRequired && !value.toLinesText.trim()));
  const fromSummary = [value.fromName, value.fromLine1, value.fromCityStateZip].map((x) => x.trim()).filter(Boolean).join(' · ');
  const toFirst = value.toLinesText.split('\n').map((l) => l.trim()).filter(Boolean)[0] || '';
  const toSummary = [value.toName, toFirst].filter(Boolean).join(' · ');
  const toNameLabel = recipientKind === 'creditor' ? 'Recipient name' : 'Bureau name';
  const toAddrLabel = recipientKind === 'creditor' ? 'Recipient mailing address' : 'Bureau address';
  const missingTo = !value.toLinesText.trim() || !value.toName.trim();

  return (
    <div className={`${LETTER_L4_WORK_CARD} space-y-2`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={LETTER_L4_ADDRESS_TITLE}>Address</p>
            {enrichmentSource && enrichmentSource !== 'missing' ? (
              <span className={finelyOsStatusChip(verifyRequired ? 'warn' : 'ok')}>
                {enrichmentSourceLabel(enrichmentSource)}
              </span>
            ) : null}
            {verifyRequired || missingTo ? (
              <span className={finelyOsStatusChip('warn')}>
                <AlertTriangle size={10} className="inline mr-0.5" />
                Verify address
              </span>
            ) : null}
          </div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`} title={fromSummary}>
            <span className="text-white/50">From </span>
            {fromSummary || '—'}
          </p>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`} title={toSummary}>
            <span className="text-white/50">To </span>
            {toSummary || '—'}
          </p>
          <p className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`} title={value.subject}>
            <span className="text-white/50">Subject </span>
            {value.subject.trim() || '—'}
          </p>
          {enrichmentHint ? (
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs text-amber-100/80`}>{enrichmentHint}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {onLookupAddress ? (
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              disabled={lookupBusy}
              onClick={() => void onLookupAddress()}
              title="Fill recipient address from directory or lookup"
            >
              <Wand2 size={14} />
              {lookupBusy ? 'Looking up…' : 'Fill address'}
            </button>
          ) : null}
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setOpen((v) => !v)}>
            {open ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {open ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Your name</span>
            <input
              className={`${FINELY_OS_COMPACT_INPUT} !max-w-none mt-1`}
              value={value.fromName}
              onChange={(e) => onChange({ fromName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Street</span>
            <input
              className={`${FINELY_OS_COMPACT_INPUT} !max-w-none mt-1`}
              value={value.fromLine1}
              onChange={(e) => onChange({ fromLine1: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Apt / suite (optional)</span>
            <input
              className={`${FINELY_OS_COMPACT_INPUT} !max-w-none mt-1`}
              value={value.fromLine2 || ''}
              onChange={(e) => onChange({ fromLine2: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>City, ST ZIP</span>
            <input
              className={`${FINELY_OS_COMPACT_INPUT} !max-w-none mt-1`}
              value={value.fromCityStateZip}
              onChange={(e) => onChange({ fromCityStateZip: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{toNameLabel}</span>
            <input
              className={`${FINELY_OS_COMPACT_INPUT} !max-w-none mt-1`}
              value={value.toName}
              onChange={(e) => onChange({ toName: e.target.value })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={`${FINELY_OS_ENTITY_SUBLABEL} inline-flex items-center gap-1`}>
              <MapPin size={11} /> {toAddrLabel}
            </span>
            <textarea
              rows={2}
              className={`${FINELY_OS_COMPACT_TEXTAREA} !max-w-none mt-1`}
              value={value.toLinesText}
              onChange={(e) => onChange({ toLinesText: e.target.value })}
              placeholder={
                recipientKind === 'creditor'
                  ? 'Collector / law firm street, city, ST ZIP'
                  : 'Bureau dispute mailing address'
              }
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Subject</span>
            <input
              className={`${FINELY_OS_COMPACT_INPUT} !max-w-none mt-1`}
              value={value.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}

export function LetterDisclaimerFooter() {
  return (
    <p className={LETTER_L5_DISCLAIMER}>
      Educational reference only — not legal advice. Results vary. Verify facts before mailing.
    </p>
  );
}
