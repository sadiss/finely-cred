import React, { useState } from 'react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_FIELD_WIDTH,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import {
  LETTER_L4_ADDRESS_TITLE,
  LETTER_L4_WORK_CARD,
  LETTER_L5_DISCLAIMER,
} from './letterEasyFlowTokens';

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
}: {
  value: LetterAddressFields;
  onChange: (patch: Partial<LetterAddressFields>) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const fromSummary = [value.fromName, value.fromLine1, value.fromCityStateZip].map((x) => x.trim()).filter(Boolean).join(' · ');
  const toFirst = value.toLinesText.split('\n').map((l) => l.trim()).filter(Boolean)[0] || '';
  const toSummary = [value.toName, toFirst].filter(Boolean).join(' · ');

  return (
    <div className={`${LETTER_L4_WORK_CARD} space-y-2`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className={LETTER_L4_ADDRESS_TITLE}>Address</p>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm truncate`} title={fromSummary}>
            <span className="text-white/50">From </span>
            {fromSummary || '—'}
          </p>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm truncate`} title={toSummary}>
            <span className="text-white/50">To </span>
            {toSummary || '—'}
          </p>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm truncate`} title={value.subject}>
            <span className="text-white/50">Subject </span>
            {value.subject.trim() || '—'}
          </p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setOpen((v) => !v)}>
          {open ? 'Done' : 'Edit'}
        </button>
      </div>

      {open ? (
        <div className={`grid gap-2 pt-2 border-t border-white/10 ${FINELY_OS_FIELD_WIDTH}`}>
          <label className="block">
            <span className={FINELY_OS_ENTITY_LABEL}>Your name</span>
            <input
              className={`${FINELY_OS_ENTITY_INPUT} !mt-1`}
              value={value.fromName}
              onChange={(e) => onChange({ fromName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_LABEL}>Street</span>
            <input
              className={`${FINELY_OS_ENTITY_INPUT} !mt-1`}
              value={value.fromLine1}
              onChange={(e) => onChange({ fromLine1: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_LABEL}>Apt / suite (optional)</span>
            <input
              className={`${FINELY_OS_ENTITY_INPUT} !mt-1`}
              value={value.fromLine2 || ''}
              onChange={(e) => onChange({ fromLine2: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_LABEL}>City, ST ZIP</span>
            <input
              className={`${FINELY_OS_ENTITY_INPUT} !mt-1`}
              value={value.fromCityStateZip}
              onChange={(e) => onChange({ fromCityStateZip: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_LABEL}>Bureau name</span>
            <input
              className={`${FINELY_OS_ENTITY_INPUT} !mt-1`}
              value={value.toName}
              onChange={(e) => onChange({ toName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_LABEL}>Bureau address</span>
            <textarea
              rows={2}
              className={`${FINELY_OS_ENTITY_INPUT} !mt-1`}
              value={value.toLinesText}
              onChange={(e) => onChange({ toLinesText: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={FINELY_OS_ENTITY_LABEL}>Subject</span>
            <input
              className={`${FINELY_OS_ENTITY_INPUT} !mt-1`}
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
