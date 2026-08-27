import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  CircleHelp,
  FileCheck2,
  FileSearch,
  FileText,
  Fingerprint,
  PlayCircle,
  RefreshCcw,
  ScanSearch,
  Target,
  UploadCloud,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ENTITLEMENT_KEYS } from '../../../../billing/entitlements';
import { EntitlementGate } from '../../../../components/billing/EntitlementGate';
import { LineChartCard } from '../../../../components/charts';
import { assessCreditorContactRecovery } from '../../../../creditReports/creditorContactExtract';
import { deriveDisputeCandidates } from '../../../../creditReports/disputeCandidates';
import { computeReportIdentityCheck, identityFaultTitle } from '../../../../creditReports/identityCheck';
import type { Bureau, CreditReportRecord, DisputeCandidate } from '../../../../domain/creditReports';
import type { CreditScoreSnapshot } from '../../../../domain/creditScoreSnapshots';
import { captureScoreSnapshotFromReport, listCreditScoreSnapshots } from '../../../../data/creditScoreSnapshotsRepo';
import { listReportsByPartner, upsertReport } from '../../../../data/reportsRepo';
import { FinelyOsAlertBanner } from '../../../../features/os/FinelyOsAlertBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../../features/os/finelyOsLightUi';
import { buildCollectionContactBoard } from '../../../../lib/collectionContactBoard';
import { persistRefreshedCreditorContactsOnReport } from '../../../../lib/debtCreditorIntel';
import { isLegacyPendingReportBlob } from '../../../../lib/legacyPendingReport';
import { canAccessReportBlob } from '../../../../lib/reportBlobAccess';
import {
  recoverCreditorContactsFromStoredHtml,
  reparseStoredCreditReport,
  shouldRecoverCreditorContactsFromStoredHtml,
} from '../../../../lib/reportParsePipeline';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  ProductReportWorkspace,
  type ProductReportWorkspaceRoom,
} from '../components/ProductReportWorkspace';
import './partnerReportsCommandDeck.css';

const PAGE_ACCENT = 'sky' as const;
const METRICS_VARIANT = 'jewel' as const;
const BUREAUS: Bureau[] = ['EQF', 'EXP', 'TUC'];

const BUREAU_LABELS: Record<Bureau, string> = {
  EQF: 'Equifax',
  EXP: 'Experian',
  TUC: 'TransUnion',
};

const DECK_STATIONS: Array<{
  id: ProductReportWorkspaceRoom;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'rose' | 'sky';
  icon: typeof UploadCloud;
}> = [
  { id: 'upload', label: 'Upload', hint: 'Add a bureau export', accent: 'emerald', icon: UploadCloud },
  { id: 'viewer', label: 'Inspect', hint: 'Parsed accounts & scores', accent: 'violet', icon: FileSearch },
  { id: 'findings', label: 'Findings', hint: 'Dispute-ready items', accent: 'rose', icon: Target },
  { id: 'source', label: 'Verify source', hint: 'Original report regions', accent: 'sky', icon: ScanSearch },
];

function formatFreshness(iso?: string): string {
  if (!iso) return 'no reports yet';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function dedupeFindings(candidates: DisputeCandidate[]): (DisputeCandidate & { bureaus: Bureau[] })[] {
  const byKey = new Map<string, DisputeCandidate & { bureaus: Bureau[] }>();
  for (const candidate of candidates) {
    const key = `${candidate.account}::${candidate.type}`;
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.bureaus.includes(candidate.bureau)) existing.bureaus.push(candidate.bureau);
      continue;
    }
    byKey.set(key, { ...candidate, bureaus: [candidate.bureau] });
  }
  return Array.from(byKey.values());
}

function collectBureauCoverage(reports: CreditReportRecord[]): Set<Bureau> {
  const covered = new Set<Bureau>();
  for (const report of reports) {
    for (const score of report.parsed?.scores ?? []) {
      if (score.bureau) covered.add(score.bureau);
    }
    for (const tradeline of report.parsed?.tradelines ?? []) {
      for (const field of tradeline.fields) {
        for (const bureau of Object.keys(field.byBureau) as Bureau[]) covered.add(bureau);
      }
    }
  }
  return covered;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      reports: CreditReportRecord[];
      snapshots: CreditScoreSnapshot[];
      scoreDelta: number | null;
      headlineBureau?: Bureau;
      latestScore?: number;
    };

function BureauCoverageRail({ covered }: { covered: Set<Bureau> }) {
  return (
    <div className={`${finelyOsCatalogCard('violet')} fc-luxury-glass p-6 lg:p-8`}>
      <div className={`${FINELY_OS_ENTITY_LABEL} mb-4`}>Bureau coverage</div>
      <div className="fc-partner-reports-bureau-rail" role="list" aria-label="Bureau coverage">
        {BUREAUS.map((bureau) => {
          const hasData = covered.has(bureau);
          const label = BUREAU_LABELS[bureau];
          return (
            <div
              key={bureau}
              className="fc-partner-reports-bureau-chip"
              data-covered={hasData ? 'true' : 'false'}
              role="listitem"
            >
              <span>{label}</span>
              <strong>{hasData ? 'On file' : 'Missing'}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportsCommandDeck({
  activeRoom,
  onSelect,
  reportsCount,
  findingsCount,
  identityFaultCount,
}: {
  activeRoom: ProductReportWorkspaceRoom;
  onSelect: (room: ProductReportWorkspaceRoom) => void;
  reportsCount: number;
  findingsCount: number;
  identityFaultCount: number;
}) {
  return (
    <div className="fc-partner-reports-command-deck" role="tablist" aria-label="Credit report stations">
      {DECK_STATIONS.map((station) => {
        const Icon = station.icon;
        const badge =
          station.id === 'viewer'
            ? identityFaultCount > 0
              ? String(identityFaultCount)
              : reportsCount
                ? String(reportsCount)
                : undefined
            : station.id === 'findings' && findingsCount > 0
              ? String(findingsCount)
              : undefined;
        return (
          <button
            key={station.id}
            type="button"
            role="tab"
            aria-selected={activeRoom === station.id}
            data-active={activeRoom === station.id ? 'true' : undefined}
            data-accent={station.accent}
            className="fc-partner-reports-command-tile"
            onClick={() => onSelect(station.id)}
          >
            <span className="fc-partner-reports-command-tile-icon">
              <Icon size={22} strokeWidth={2.1} />
            </span>
            <span>
              <strong>{station.label}</strong>
              <small>
                {station.id === 'viewer' && identityFaultCount > 0
                  ? 'Profile vs report mismatch'
                  : station.hint}
              </small>
            </span>
            {badge ? <em>{badge}</em> : null}
          </button>
        );
      })}
    </div>
  );
}

function ReportIdentityCompareModal({
  open,
  onClose,
  identityCheck,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  identityCheck: ReturnType<typeof computeReportIdentityCheck>;
  onNavigate: (href: string) => void;
}) {
  if (!open || !identityCheck.faults.length) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={`relative max-h-[85vh] w-full max-w-4xl overflow-y-auto ${finelyOsCatalogCard('sky')} p-6 lg:p-8 shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fc-report-identity-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className={FINELY_OS_ENTITY_LABEL}>Identity + report match</div>
            <h2 id="fc-report-identity-modal-title" className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>
              Confirm profile details before letters
            </h2>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
              If this file belongs to a different person — or your saved mailing info is incomplete — letters may
              auto-fill incorrectly. Confirm name, SSN last four, address, employer, freeze, and fraud-alert status
              before you generate packets. Results vary · not legal advice.
            </p>
          </div>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony p-6`}>
            <div className={FINELY_OS_ENTITY_LABEL}>Your profile</div>
            <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} space-y-1 font-mono whitespace-pre-wrap break-words`}>
              <div>name: {identityCheck.canonical?.fullName || '—'}</div>
              <div>addr: {identityCheck.canonical?.addressLine1 || '—'}</div>
              <div>csz: {identityCheck.canonical?.cityStateZip || '—'}</div>
              <div>ssn last 4: {identityCheck.canonical?.ssnLast4 ? `•••${identityCheck.canonical.ssnLast4}` : '—'}</div>
              <div>employer: {identityCheck.canonical?.employer || '—'}</div>
            </div>
          </div>
          <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony p-6`}>
            <div className={FINELY_OS_ENTITY_LABEL}>From this report</div>
            <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} space-y-1 font-mono whitespace-pre-wrap break-words`}>
              <div>name: {identityCheck.report?.fullName || '—'}</div>
              <div>addr: {identityCheck.report?.addressLine1 || '—'}</div>
              <div>csz: {identityCheck.report?.cityStateZip || '—'}</div>
              <div>ssn last 4: {identityCheck.report?.ssnLast4 ? `•••${identityCheck.report.ssnLast4}` : '—'}</div>
              <div>employer: {identityCheck.report?.employer || '—'}</div>
              <div>file freeze: {identityCheck.report?.fileFrozen ? 'Shown on file' : 'Not detected'}</div>
              <div>fraud alert: {identityCheck.report?.fraudAlert ? 'Shown on file' : 'Not detected'}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {identityCheck.faults.map((fault, index) => {
            const tone =
              fault.severity === 'error'
                ? FINELY_OS_NOTICE_ERROR
                : fault.severity === 'warn'
                  ? FINELY_OS_NOTICE_WARN
                  : FINELY_OS_NOTICE;
            return (
              <div key={`${fault.kind}_${index}`} className={tone}>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{identityFaultTitle(fault.kind)}</div>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>{fault.severity}</div>
                </div>
                <div className="mt-2">{fault.message}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onNavigate('/portal/checklist')}>
            Open checklist
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onNavigate('/portal/projects')}>
            Open tasks
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => onNavigate('/portal/documents')}>
            Open documents
          </button>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => onNavigate('/portal/letters?openPicker=1')}>
            Open Letter Studio
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportContactRecoveryStrip({
  report,
  contactRecovery,
  canReparse,
  reparseBusy,
  onReparse,
}: {
  report: CreditReportRecord;
  contactRecovery: ReturnType<typeof assessCreditorContactRecovery>;
  canReparse: boolean;
  reparseBusy: boolean;
  onReparse: () => void;
}) {
  return (
    <div className={`${finelyOsCatalogCard('violet')} fc-luxury-glass p-6 lg:p-8 space-y-3`}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
          <RefreshCcw size={20} />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className={FINELY_OS_ENTITY_VALUE}>Creditor mailing addresses missing</div>
          <p className={FINELY_OS_ENTITY_BODY}>
            We found {contactRecovery.tradelineCount} account{contactRecovery.tradelineCount === 1 ? '' : 's'} on{' '}
            {report.filename || 'this report'} but no creditor or collector mailing addresses, so validation and dispute
            letters cannot autofill the TO block.{' '}
            {canReparse
              ? 'Re-parse reads your stored file again with the latest contact extractor — no re-upload needed.'
              : 'The original file is no longer stored, so upload the HTML export again from Upload.'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={FINELY_OS_PRIMARY_BTN}
              disabled={!canReparse || reparseBusy}
              onClick={onReparse}
              title={
                canReparse
                  ? 'Re-run parsing from your stored file to recover creditor contacts'
                  : 'Stored file missing — re-upload to re-parse'
              }
            >
              <RefreshCcw size={14} />
              {reparseBusy ? 'Re-parsing…' : 'Re-parse for contacts'}
            </button>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>
              HTML exports from IdentityIQ / MyScoreIQ include the Creditor Contacts table; most PDF exports do not.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PartnerReportsProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const navItem = getWorkspaceProductNavItem('partner', 'reports');
  const PageIcon = navItem?.icon ?? FileText;
  const archetype = getWorkspaceProductArchetype(role, pageId);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const [reportRoom, setReportRoom] = useState<ProductReportWorkspaceRoom>('upload');
  const [activeReport, setActiveReport] = useState<CreditReportRecord | null>(null);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [reparseId, setReparseId] = useState<string | null>(null);
  const [reparseErr, setReparseErr] = useState<string | null>(null);
  const [recoveryNotice, setRecoveryNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const autoRecoverAttemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onStore = () => setRetryToken((value) => value + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      const reports = listReportsByPartner(partnerId!);
      const snapshots = listCreditScoreSnapshots(partnerId!);
      const [latest, previous] = snapshots;
      const scoreDelta =
        typeof latest?.headlineScore === 'number' && typeof previous?.headlineScore === 'number'
          ? latest.headlineScore - previous.headlineScore
          : null;
      if (!cancelled) {
        setState({
          status: 'ready',
          reports,
          snapshots,
          scoreDelta,
          headlineBureau: latest?.headlineBureau,
          latestScore: latest?.headlineScore,
        });
        setReportRoom(reports.length > 0 ? 'viewer' : 'upload');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your reports right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', 'reports'), []);

  const effectiveReportForEffects =
    state.status === 'ready' ? activeReport ?? state.reports[0] ?? null : null;

  const contactRecoveryForEffects = useMemo(
    () => assessCreditorContactRecovery(effectiveReportForEffects?.parsed ?? null),
    [effectiveReportForEffects?.id, effectiveReportForEffects?.parsed],
  );

  useEffect(() => {
    if (isDemo || !effectiveReportForEffects?.id || !effectiveReportForEffects.parsed) return;
    if (!contactRecoveryForEffects.recoverableFromStoredParse) return;
    persistRefreshedCreditorContactsOnReport({
      id: effectiveReportForEffects.id,
      parsed: effectiveReportForEffects.parsed,
    });
    setRetryToken((value) => value + 1);
  }, [contactRecoveryForEffects.recoverableFromStoredParse, effectiveReportForEffects?.id, isDemo]);

  useEffect(() => {
    if (isDemo || !effectiveReportForEffects?.id || !effectiveReportForEffects.parsed) return;
    if (effectiveReportForEffects.fileType !== 'html') return;
    if (isLegacyPendingReportBlob(effectiveReportForEffects.rawBlobRef)) return;
    if (!canAccessReportBlob(effectiveReportForEffects.rawBlobRef)) return;
    if (!shouldRecoverCreditorContactsFromStoredHtml(effectiveReportForEffects.parsed)) return;
    if (autoRecoverAttemptedRef.current.has(effectiveReportForEffects.id)) return;
    if (reparseId) return;

    autoRecoverAttemptedRef.current.add(effectiveReportForEffects.id);
    let cancelled = false;
    (async () => {
      setReparseId(effectiveReportForEffects.id);
      setReparseErr(null);
      try {
        const result = await recoverCreditorContactsFromStoredHtml({ record: effectiveReportForEffects });
        if (cancelled) return;
        if (result.ran) {
          upsertReport(result.record);
          setRecoveryNotice(
            result.afterAddresses > result.beforeAddresses
              ? {
                  ok: true,
                  message: `Recovered Creditor Contacts from your stored HTML — ${result.afterAddresses} mailing address(es) ready (was ${result.beforeAddresses}).`,
                }
              : result.afterAddresses > 0
                ? {
                    ok: true,
                    message: `Re-read stored HTML — ${result.afterAddresses} creditor mailing address(es) on file.`,
                  }
                : {
                    ok: false,
                    message:
                      'Re-read the stored file, but no Creditor Contacts addresses were found. Confirm this is an IdentityIQ / MyScoreIQ HTML export.',
                  },
          );
          setRetryToken((value) => value + 1);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          autoRecoverAttemptedRef.current.delete(effectiveReportForEffects.id);
          setReparseErr(err instanceof Error ? err.message : 'Could not recover contacts from stored HTML.');
        }
      } finally {
        if (!cancelled) setReparseId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveReportForEffects?.fileType, effectiveReportForEffects?.id, effectiveReportForEffects?.parsed, isDemo, reparseId]);

  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button
        type="button"
        onClick={() =>
          openProductCopilot({
            prompt: 'What should I do next with my credit reports?',
            contextLabel: navItem?.label ?? 'Credit reports',
          })
        }
      >
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const renderWorkbench = (
    reports: CreditReportRecord[],
    snapshots: CreditScoreSnapshot[],
    demoMode: boolean,
    resolvedPartnerId?: string,
  ) => {
    const latestReport = reports[0] ?? null;
    const effectiveReport = activeReport ?? latestReport;
    const bureausCovered = collectBureauCoverage(reports);
    const findings = latestReport?.parsed
      ? dedupeFindings(deriveDisputeCandidates(latestReport.parsed, latestReport.id))
      : [];

    const identityCheck =
      !demoMode && resolvedPartnerId && effectiveReport?.parsed
        ? computeReportIdentityCheck({
            partnerId: resolvedPartnerId,
            parsed: effectiveReport.parsed,
            extraText: effectiveReport.pdfText,
          })
        : null;
    const identityFaultCount = identityCheck?.faults?.length ?? 0;

    const contactRecovery = assessCreditorContactRecovery(effectiveReport?.parsed ?? null);
    const selectedContactBoard = effectiveReport
      ? buildCollectionContactBoard({ id: effectiveReport.id, parsed: effectiveReport.parsed ?? null })
      : null;
    const canReparseSelected = Boolean(
      effectiveReport &&
        !isLegacyPendingReportBlob(effectiveReport.rawBlobRef) &&
        canAccessReportBlob(effectiveReport.rawBlobRef),
    );
    const showContactRecoveryBanner = Boolean(
      !demoMode &&
        effectiveReport?.parsed &&
        contactRecovery.needsReparse &&
        selectedContactBoard &&
        selectedContactBoard.contactsWithAddress === 0 &&
        selectedContactBoard.collectionsWithAddress === 0,
    );

    const handleReparse = async (report: CreditReportRecord) => {
      setReparseErr(null);
      setRecoveryNotice(null);
      setReparseId(report.id);
      try {
        if (isLegacyPendingReportBlob(report.rawBlobRef)) {
          throw new Error('This report was migrated without the original file. Re-upload using Upload.');
        }
        if (!canAccessReportBlob(report.rawBlobRef)) {
          throw new Error('This report has no accessible stored file. Re-upload the original HTML or PDF export.');
        }
        const updated = await reparseStoredCreditReport({ record: report });
        upsertReport(updated);
        const after = assessCreditorContactRecovery(updated.parsed ?? null);
        setRecoveryNotice(
          after.refreshedWithAddress > 0
            ? {
                ok: true,
                message: `Re-parse complete — ${after.refreshedWithAddress} creditor mailing address(es) recovered for letters.`,
              }
            : {
                ok: false,
                message:
                  'Re-parse complete, but this export contains no Creditor Contacts addresses. Download the HTML export from IdentityIQ / MyScoreIQ and upload it again — PDF exports often omit the contact table.',
              },
        );
        if (resolvedPartnerId && updated.parsed) {
          captureScoreSnapshotFromReport({
            partnerId: resolvedPartnerId,
            reportId: report.id,
            parsed: updated.parsed,
            provider: updated.provider ?? undefined,
          });
        }
        setRetryToken((value) => value + 1);
      } catch (err: unknown) {
        setReparseErr(err instanceof Error ? err.message : 'Re-parse failed.');
      } finally {
        setReparseId(null);
      }
    };

    const scoreTrendPoints = snapshots
      .filter((snapshot) => typeof snapshot.headlineScore === 'number')
      .slice()
      .reverse();
    const showDemoTrend = demoMode && scoreTrendPoints.length === 0;
    const showScoreTrend = scoreTrendPoints.length > 0 || showDemoTrend;

    return (
      <div className="fc-partner-reports-deck-root" data-surface-layout="bureau-instrument">
        <ReportsCommandDeck
          activeRoom={reportRoom}
          onSelect={setReportRoom}
          reportsCount={reports.length}
          findingsCount={findings.length}
          identityFaultCount={identityFaultCount}
        />

        <BureauCoverageRail covered={bureausCovered} />

        {identityFaultCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FinelyOsAlertBanner
              tone="warning"
              surface="light"
              message={`Profile vs report mismatch — ${identityFaultCount} item${identityFaultCount === 1 ? '' : 's'} to confirm before letters.`}
            />
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setIdentityModalOpen(true)}>
              <Fingerprint size={14} /> Compare identity
            </button>
          </div>
        ) : null}

        {showContactRecoveryBanner && effectiveReport ? (
          <ReportContactRecoveryStrip
            report={effectiveReport}
            contactRecovery={contactRecovery}
            canReparse={canReparseSelected}
            reparseBusy={reparseId === effectiveReport.id}
            onReparse={() => void handleReparse(effectiveReport)}
          />
        ) : null}

        {recoveryNotice ? (
          <FinelyOsAlertBanner
            tone={recoveryNotice.ok ? 'success' : 'warning'}
            surface="light"
            message={recoveryNotice.message}
          />
        ) : null}

        {reparseErr ? <FinelyOsAlertBanner tone="blocking" surface="light" message={reparseErr} /> : null}

        {showScoreTrend ? (
          <section className="fc-partner-reports-score-band">
            <LineChartCard
              title="Score history"
              subtitle={
                showDemoTrend
                  ? 'Demo illustration — your live chart uses saved report snapshots.'
                  : 'From parsed reports on file — not live bureau pulls.'
              }
              labels={
                showDemoTrend
                  ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
                  : scoreTrendPoints.map((snapshot) => {
                      const date = new Date(snapshot.reportDate ?? snapshot.capturedAt);
                      return Number.isNaN(date.getTime())
                        ? 'Report'
                        : date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                    })
              }
              series={[
                {
                  id: 'headline',
                  label: 'Saved headline score',
                  color: '#38bdf8',
                  values: showDemoTrend
                    ? [618, 626, 641, 653, 667, 681]
                    : scoreTrendPoints.map((snapshot) => snapshot.headlineScore as number),
                },
              ]}
              height={240}
            />
          </section>
        ) : null}

        <div className="fc-partner-reports-workbench">
          <ProductReportWorkspace
            partnerId={partnerId}
            initialReports={reports}
            room={reportRoom}
            onRoomChange={setReportRoom}
            onActiveReportChange={setActiveReport}
            dataMode={demoMode ? 'demo' : 'real'}
            layout="embedded"
            mapPortalHref={mapPortalHref}
          />
        </div>

        {identityCheck ? (
          <ReportIdentityCompareModal
            open={identityModalOpen}
            onClose={() => setIdentityModalOpen(false)}
            identityCheck={identityCheck}
            onNavigate={(href) => navigate(mapPortalHref(href))}
          />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="fc-wlp-section-description fc-wlp-compliance-line m-0">
            Results vary · not legal advice · funding subject to underwriting
          </p>
          {guideActions}
        </div>
      </div>
    );
  };

  const buildMetrics = (
    reports: CreditReportRecord[],
    findings: (DisputeCandidate & { bureaus: Bureau[] })[],
    bureausCovered: Set<Bureau>,
    scoreDelta: number | null,
    headlineBureau?: Bureau,
    latestScore?: number,
  ): ProductMetric[] => {
    const latestReport = reports[0] ?? null;
    const tradelinesParsed = latestReport?.parsed?.tradelines?.length ?? 0;
    const isEmpty = reports.length === 0;

    const scoreMovementValue =
      scoreDelta !== null
        ? `${scoreDelta > 0 ? '+' : ''}${scoreDelta}`
        : typeof latestScore === 'number'
          ? String(latestScore)
          : '—';
    const scoreMovementHint =
      scoreDelta !== null
        ? `${headlineBureau ?? 'Headline'} vs. prior saved report`
        : typeof latestScore === 'number'
          ? 'Upload another report to track movement'
          : 'Appears after a parsed report with scores';

    return [
      {
        label: 'Reports on file',
        value: reports.length,
        hint: latestReport
          ? `${tradelinesParsed} tradeline${tradelinesParsed === 1 ? '' : 's'} on latest file`
          : 'Upload your first bureau export',
        accent: 'sky',
        icon: FileSearch,
        onClick: () => setReportRoom('viewer'),
      },
      {
        label: 'Bureaus covered',
        value: `${bureausCovered.size}/3`,
        hint: bureausCovered.size ? Array.from(bureausCovered).join(' · ') : 'No bureau data parsed yet',
        accent: 'violet',
        icon: FileCheck2,
        onClick: () => setReportRoom('source'),
      },
      {
        label: 'Findings',
        value: findings.length,
        hint: findings.length
          ? 'Ready for dispute review'
          : isEmpty
            ? 'Upload a report first'
            : 'No findings on latest report',
        accent: 'rose',
        icon: Target,
        onClick: () => setReportRoom('findings'),
      },
      {
        label: 'Score change',
        value: scoreMovementValue,
        hint: scoreMovementHint,
        accent: 'emerald',
        icon: BarChart3,
        onClick: () => setReportRoom('viewer'),
      },
    ];
  };

  const scaffoldShell = (children: React.ReactNode, opts: {
    status: string;
    freshness: string;
    metrics?: ProductMetric[];
    primaryAction?: React.ReactNode;
  }) => (
    <ProductHubScaffold
      role={role}
      eyebrow="Credit reports"
      title="Your bureau files, parsed and ready to use."
      description="Upload exports, review parsed accounts, verify source regions, and move findings into disputes."
      status={opts.status}
      freshness={opts.freshness}
      accent={PAGE_ACCENT}
      surfaceMode="studio"
      icon={PageIcon}
      archetype={archetype}
      metrics={opts.metrics}
      metricsVariant={METRICS_VARIANT}
      primaryAction={opts.primaryAction}
    >
      {children}
    </ProductHubScaffold>
  );

  if (isDemo) {
    const demoReports: CreditReportRecord[] = [];
    const demoFindings: (DisputeCandidate & { bureaus: Bureau[] })[] = [];
    const demoBureaus = collectBureauCoverage(demoReports);

    return scaffoldShell(
      renderWorkbench(demoReports, [], true),
      {
        status: `${demoSpec?.status ?? 'Three bureaus current'} · demo`,
        freshness: 'demo snapshot',
        metrics: buildMetrics(demoReports, demoFindings, demoBureaus, null),
        primaryAction: (
          <ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Upload report'} onClick={() => setReportRoom('upload')} />
        ),
      },
    );
  }

  if (state.status === 'loading') {
    return scaffoldShell(
      partnerId ? (
        <EntitlementGate partnerId={partnerId} requiredKeys={[ENTITLEMENT_KEYS.reports]}>
          <ProductReportWorkspace
            partnerId={partnerId}
            room={reportRoom}
            onRoomChange={setReportRoom}
            layout="embedded"
            dataMode="real"
          />
        </EntitlementGate>
      ) : null,
      { status: 'Loading reports', freshness: 'just now' },
    );
  }

  if (state.status === 'error') {
    return scaffoldShell(
      <ProductEmptyState
        title="Could not load reports"
        description={state.message}
        action={
          <button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((value) => value + 1)}>
            Try again
          </button>
        }
      />,
      {
        status: 'Load failed',
        freshness: 'just now',
        primaryAction: <ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((value) => value + 1)} />,
      },
    );
  }

  const { reports, snapshots, scoreDelta, headlineBureau, latestScore } = state;
  const latestReport = reports[0] ?? null;
  const bureausCovered = collectBureauCoverage(reports);
  const findings = latestReport?.parsed
    ? dedupeFindings(deriveDisputeCandidates(latestReport.parsed, latestReport.id))
    : [];
  const isEmpty = reports.length === 0;

  const statusHeadline = isEmpty
    ? 'No reports yet'
    : findings.length > 0
      ? `${findings.length} finding${findings.length === 1 ? '' : 's'} to review`
      : 'Reports current';

  return scaffoldShell(
    <EntitlementGate partnerId={partnerId!} requiredKeys={[ENTITLEMENT_KEYS.reports]}>
      {renderWorkbench(reports, snapshots, false, partnerId!)}
    </EntitlementGate>,
    {
      status: `${statusHeadline} · live`,
      freshness: formatFreshness(latestReport?.receivedAt),
      metrics: buildMetrics(reports, findings, bureausCovered, scoreDelta, headlineBureau, latestScore),
      primaryAction: <ProductPagePrimaryAction label="Upload report" onClick={() => setReportRoom('upload')} />,
    },
  );
}
