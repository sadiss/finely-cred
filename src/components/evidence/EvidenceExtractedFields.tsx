import React from 'react';
import { finelyOsGlowKpi } from '../../features/os/finelyOsLightUi';

const ENTITY_LABELS: Record<string, string> = {
  creditorName: 'Creditor',
  collectorName: 'Collector',
  accountLast4: 'Account',
  legalName: 'Legal name',
  address: 'Address',
  ein: 'EIN',
  caseNumber: 'Case / docket #',
  courtName: 'Court',
  courtDivision: 'Division',
  plaintiffName: 'Plaintiff',
  defendantName: 'Defendant',
  counselName: 'Counsel',
  plaintiffLawFirm: 'Law firm',
  plaintiffAttorneyName: 'Attorney',
  plaintiffAttorneyBar: 'Bar #',
  hearingDate: 'Hearing',
  dateServed: 'Served',
  judgeName: 'Judge',
  amountClaimed: 'Amount claimed',
  bureau: 'Bureau',
  fullName: 'Name',
  state: 'State',
  zip: 'ZIP',
  date: 'Date',
  amount: 'Amount',
};

function labelForKey(key: string): string {
  return ENTITY_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
}

export function EvidenceExtractedFields({
  entities,
  summary,
  compact,
}: {
  entities: Record<string, string>;
  summary?: string;
  compact?: boolean;
}) {
  const entries = Object.entries(entities).filter(([, v]) => v && String(v).trim());
  if (!entries.length && !summary) return null;

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {summary ? (
        <p className="text-xs text-white/65 leading-relaxed">
          <span className="text-emerald-300/90 font-semibold">Scraped: </span>
          {summary}
        </p>
      ) : null}
      {entries.length > 0 ? (
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
          {entries.slice(0, compact ? 4 : 8).map(([key, value]) => (
            <div key={key} className={`${finelyOsGlowKpi('emerald')} !py-2 !px-2.5`}>
              <div className="text-[9px] uppercase tracking-widest text-white/45">{labelForKey(key)}</div>
              <div className="text-[11px] font-semibold text-white/90 truncate" title={value}>
                {value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
