import React, { useMemo } from 'react';
import { AlertTriangle, CalendarClock, Copy, Fingerprint, Search, ShieldAlert } from 'lucide-react';
import { computeReportIdentityCheck, identityFaultTitle } from '../../creditReports/identityCheck';
import { listReportsByPartner } from '../../data/reportsRepo';
import type { ParsedCreditReport } from '../../domain/creditReports';
import {
  analyzeParsedReport,
  type ReportFinding,
} from '../../domain/reportIntelligence';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

const ACCENT_ROTATION = ['emerald', 'violet', 'sky', 'rose'] as const;

type Accent = (typeof ACCENT_ROTATION)[number];

function kindIcon(kind: ReportFinding['kind']) {
  switch (kind) {
    case 'sol':
      return ShieldAlert;
    case 'falloff':
      return CalendarClock;
    case 'duplicate':
      return Copy;
    case 'reaging':
      return AlertTriangle;
    case 'inquiry_cluster':
      return Search;
    case 'identity':
      return Fingerprint;
    default:
      return AlertTriangle;
  }
}

function identityFindings(partnerId: string, parsed: ParsedCreditReport): ReportFinding[] {
  const check = computeReportIdentityCheck({ partnerId, parsed });
  return check.faults.map((fault, index) => ({
    id: `identity_${fault.kind}_${index}`,
    kind: 'identity' as const,
    title: identityFaultTitle(fault.kind),
    detail: `${fault.message} Results vary · not legal advice.`,
    severity: fault.severity === 'error' ? 'high' : fault.severity === 'warn' ? 'medium' : 'info',
  }));
}

function mergeFindings(parsed: ParsedCreditReport, partnerId?: string, partnerState?: string): ReportFinding[] {
  const base = analyzeParsedReport(parsed, partnerState);
  if (!partnerId) return base;
  return [...base, ...identityFindings(partnerId, parsed)];
}

function severityLabel(severity: ReportFinding['severity']) {
  if (severity === 'high') return 'High priority';
  if (severity === 'medium') return 'Review';
  return 'Info';
}

export function ReportIntelligenceFindings({
  parsed: parsedProp,
  partnerId,
  partnerState,
}: {
  parsed?: ParsedCreditReport | null;
  partnerId?: string;
  partnerState?: string;
}) {
  const parsed = useMemo(() => {
    if (parsedProp) return parsedProp;
    if (!partnerId) return null;
    const reports = listReportsByPartner(partnerId).filter((r) => r.parsed);
    return reports[0]?.parsed ?? null;
  }, [parsedProp, partnerId]);

  const findings = useMemo(() => {
    if (!parsed) return [];
    return mergeFindings(parsed, partnerId, partnerState);
  }, [parsed, partnerId, partnerState]);

  if (!parsed || !findings.length) return null;

  const usePagination = findings.length >= 20;

  const renderFinding = (finding: ReportFinding, index: number) => {
    const accent: Accent = ACCENT_ROTATION[index % ACCENT_ROTATION.length]!;
    const Icon = kindIcon(finding.kind);
    return (
      <div
        key={finding.id}
        className={`${finelyOsCatalogCard(accent)} !p-4 fc-surface-harmony space-y-2`}
        data-finding-kind={finding.kind}
      >
        <div className="flex items-start gap-3">
          <Icon size={20} className="mt-0.5 shrink-0 opacity-90" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold text-white">{finding.title}</p>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${FINELY_OS_ENTITY_SUBLABEL}`}>
                {severityLabel(finding.severity)}
              </span>
            </div>
            <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>{finding.detail}</p>
            {finding.tradelineIndexes?.length ? (
              <p className={`text-sm ${FINELY_OS_ENTITY_SUBLABEL}`}>
                Tradeline{finding.tradelineIndexes.length > 1 ? 's' : ''}:{' '}
                {finding.tradelineIndexes.map((i) => i + 1).join(', ')}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-3" aria-label="Report intelligence findings">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white">Report intelligence</h2>
        <p className={`text-base ${FINELY_OS_ENTITY_BODY}`}>
          Automated scan of your latest parsed bureau report. Results vary · not legal advice.
        </p>
      </div>

      {usePagination ? (
        <FinelyOsPaginatedStack
          items={findings}
          pageSize={20}
          emptyMessage="No findings detected."
          itemSpacingClassName="space-y-3"
          renderItem={(finding, index) => renderFinding(finding, index)}
        />
      ) : (
        <div className="space-y-3">{findings.map((finding, index) => renderFinding(finding, index))}</div>
      )}
    </section>
  );
}
