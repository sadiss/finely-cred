import React from 'react';
import type { DebtCase } from '../../domain/debt';
import type { Partner } from '../../domain/partners';
import type { LitigationScrapeResult } from '../../lib/ocr/litigationDocScraper';
import { UnifiedEvidenceCapture } from '../evidence/UnifiedEvidenceCapture';

/**
 * Litigation Step 1 intake — thin wrapper around {@link UnifiedEvidenceCapture}
 * so drop + type chips + scrape intel stay one composition with the Evidence hub.
 */
export function LitigationDocScraperChat({
  debt,
  partnerId,
  partner: partnerProp,
  onDebtChange,
  onScrapeApplied,
  onScrapeComplete,
  defaultHearingIso,
  reports,
  autoApplyOnHighConfidence = false,
}: {
  debt: DebtCase | null;
  partnerId: string;
  /** Preferred — when omitted, a minimal partner stub is used for vault ingest. */
  partner?: Partner | null;
  onDebtChange: (d: DebtCase) => void;
  onScrapeApplied?: (result: LitigationScrapeResult) => void;
  onScrapeComplete?: (result: LitigationScrapeResult) => void;
  defaultHearingIso?: string;
  reports?: Array<{
    id?: string;
    parsed?: { tradelines?: Array<Record<string, unknown>>; creditorContacts?: Array<Record<string, unknown>> } | null;
  }>;
  autoApplyOnHighConfidence?: boolean;
}) {
  const partner: Partner =
    partnerProp ||
    ({
      id: partnerId || debt?.partnerId || '',
      tenantId: 'finely',
      status: 'active',
      profile: { fullName: '', email: '' },
      routes: {},
      consents: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Partner);

  if (!partner.id) {
    return (
      <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
        Partner context required for scrape + vault filing.
      </div>
    );
  }

  return (
    <UnifiedEvidenceCapture
      partner={partner}
      email={partner.profile?.email}
      uploadContext="debt"
      debtCaseId={debt?.id}
      enableScrape
      debt={debt}
      onDebtChange={onDebtChange}
      onScrapeApplied={onScrapeApplied}
      onScrapeComplete={onScrapeComplete}
      defaultHearingIso={defaultHearingIso}
      autoApplyOnHighConfidence={autoApplyOnHighConfidence}
      reports={reports}
    />
  );
}
