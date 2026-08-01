import React from 'react';
import { FileSearch, Gavel, MapPin, Scale, Users } from 'lucide-react';
import type { DebtCase } from '../../domain/debt';
import type { SummonsAffidavitContext } from '../../lib/debtCreditorIntel';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
} from '../../features/os/finelyOsLightUi';

type Fact = { label: string; value?: string | null; emphasize?: boolean };

function FactTile({ label, value, emphasize, accent }: Fact & { accent: 'fuchsia' | 'violet' | 'amber' | 'sky' }) {
  if (!String(value || '').trim()) return null;
  return (
    <div className={`${finelyOsGlowKpi(accent)} !p-2.5 ${emphasize ? 'sm:col-span-2' : ''}`}>
      <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
      <div className={`mt-0.5 ${emphasize ? 'text-sm font-bold text-white' : FINELY_OS_ENTITY_VALUE} break-words`}>
        {value}
      </div>
    </div>
  );
}

/**
 * Compact luxury panel of scrape/docket/summons facts for court drafting.
 * Shows court, docket, parties, counsel, hearing — important details first.
 */
export function ExtractedCourtFactsPanel({
  debt,
  summonsContext,
  compact = false,
}: {
  debt: DebtCase | null;
  summonsContext: SummonsAffidavitContext;
  compact?: boolean;
}) {
  const court =
    debt?.courtName ||
    summonsContext.courtName ||
    (summonsContext.courtDivision ? `Division: ${summonsContext.courtDivision}` : '');
  const docket = debt?.courtCaseNumber || summonsContext.caseNumber;
  const plaintiff = debt?.name || summonsContext.plaintiffName;
  const defendant = summonsContext.defendantName;
  const firm = debt?.plaintiffLawFirm || summonsContext.plaintiffLawFirm || summonsContext.counselName || summonsContext.collectorName;
  const attorney = debt?.plaintiffAttorneyName || summonsContext.plaintiffAttorneyName;
  const bar = debt?.plaintiffAttorneyBarNumber || summonsContext.plaintiffAttorneyBar;
  const firmAddr = debt?.plaintiffLawFirmAddress || debt?.recipientAddress || summonsContext.counselAddress;
  const hearing = debt?.hearingDate || summonsContext.hearingDate;
  const served = debt?.dateServed || summonsContext.dateServed;
  const amount =
    summonsContext.amountClaimed ||
    (debt?.amountCents && debt.amountCents > 0
      ? `$${(debt.amountCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '');
  const judge = summonsContext.judgeName;
  const state = debt?.stateJurisdiction || summonsContext.jurisdictionState;
  const county = debt?.affidavitCounty || summonsContext.affidavitCounty;
  const caption = summonsContext.caseCaption;
  const original = debt?.originalCreditor || summonsContext.originalCreditor;
  const account = debt?.accountNumberMasked || summonsContext.accountNumberMasked;

  const primary: Fact[] = [
    { label: 'Court', value: court, emphasize: true },
    { label: 'Case / docket #', value: docket, emphasize: true },
    { label: 'Hearing', value: hearing, emphasize: Boolean(hearing) },
    { label: 'Amount claimed', value: amount },
  ];
  const parties: Fact[] = [
    { label: 'Plaintiff', value: plaintiff },
    { label: 'Defendant', value: defendant },
    { label: 'Caption', value: caption, emphasize: Boolean(caption) },
    { label: 'Original creditor', value: original },
    { label: 'Account', value: account },
  ];
  const counsel: Fact[] = [
    { label: 'Opposing counsel / firm', value: firm, emphasize: true },
    { label: 'Attorney', value: attorney },
    { label: 'Bar #', value: bar },
    { label: 'Counsel mailing address', value: firmAddr, emphasize: Boolean(firmAddr) },
  ];
  const venue: Fact[] = [
    { label: 'Judge', value: judge },
    { label: 'State', value: state },
    { label: 'County', value: county },
    { label: 'Date served', value: served },
    { label: 'Division', value: summonsContext.courtDivision },
  ];

  const hasAny = [...primary, ...parties, ...counsel, ...venue].some((f) => String(f.value || '').trim());
  if (!hasAny) {
    return (
      <div className={`${finelyOsCatalogCardCompact('fuchsia')} !p-3`}>
        <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-200/90">
          <FileSearch size={13} /> Extracted case facts
        </div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Drop a summons or docket and tap Apply — court, docket #, parties, and counsel will show here for your draft.
        </p>
      </div>
    );
  }

  return (
    <div className={`${finelyOsCatalogCardCompact('fuchsia')} !p-3 space-y-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-200/90">
            <Scale size={13} /> Extracted case facts
          </div>
          <p className={`mt-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            From summons / docket scrape — verify before mailing. Educational · not legal advice.
          </p>
        </div>
      </div>

      <div>
        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-amber-200/85 mb-1.5">
          <Gavel size={12} /> Court & docket
        </div>
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {primary.map((f) => (
            <FactTile key={f.label} {...f} accent="amber" />
          ))}
        </div>
      </div>

      <div>
        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-sky-200/85 mb-1.5">
          <Users size={12} /> Parties
        </div>
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {parties.map((f) => (
            <FactTile key={f.label} {...f} accent="sky" />
          ))}
        </div>
      </div>

      <div>
        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-violet-200/85 mb-1.5">
          <MapPin size={12} /> Opposing counsel
        </div>
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {counsel.map((f) => (
            <FactTile key={f.label} {...f} accent="violet" />
          ))}
        </div>
      </div>

      {!compact ? (
        <div>
          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-fuchsia-200/85 mb-1.5">
            Venue & service
          </div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {venue.map((f) => (
              <FactTile key={f.label} {...f} accent="fuchsia" />
            ))}
          </div>
        </div>
      ) : null}

      {summonsContext.entityFacts?.length ? (
        <details className="rounded-xl border border-white/10 bg-black/25 !p-2.5">
          <summary className="cursor-pointer select-none text-xs font-semibold text-white/85">
            More extracted fields ({summonsContext.entityFacts.length})
          </summary>
          <ul className={`mt-2 space-y-0.5 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
            {summonsContext.entityFacts.slice(0, 16).map((line: string) => (
              <li key={line.slice(0, 48)} className="truncate" title={line}>
                {line}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
