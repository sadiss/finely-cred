import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, FileText, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { deleteReport, listReportsByPartner, upsertReport } from '../../data/reportsRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { ReportUploader } from '../../components/reports/ReportUploader';
import { ReportActionsBar, ReportFileStrip } from '../../components/reports/ReportFileStrip';
import { ParsedReportViewer } from '../../components/reports/ParsedReportViewer';
import { CreditIntelTabs } from '../../components/creditIntel/CreditIntelTabs';
import { CreditIntelDashboardPanel } from '../../components/creditIntel/CreditIntelDashboardPanel';
import { EvidenceUploader } from '../../components/evidence/EvidenceUploader';
import { EvidenceList } from '../../components/evidence/EvidenceList';
import { ParsedReportOverviewPanel } from '../../components/reports/ParsedReportOverviewPanel';
import { ParsedReportDiagnosticsPanel } from '../../components/reports/ParsedReportDiagnosticsPanel';
import { PdfReportFallbackView } from '../../components/reports/PdfReportFallbackView';
import { LegacyPendingReportNotice } from '../../components/reports/LegacyPendingReportNotice';
import { isLegacyPendingReportBlob } from '../../lib/legacyPendingReport';
import { isAdminEmail } from '../../auth/admin';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../portal/getOrCreatePartnerForSession';
import { getBlobStore } from '../../storage/getBlobStore';
import { canAccessReportBlob } from '../../lib/reportBlobAccess';
import { reparseStoredCreditReport } from '../../lib/reportParsePipeline';
import { computeReportIdentityCheck } from '../../creditReports/identityCheck';
import { createDisputeCase } from '../../data/casesRepo';
import { candidateToCaseItem, nowIso } from '../../domain/cases';
import type { DisputeCandidate } from '../../domain/creditReports';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import { generateCreditAnalysisReportPdf, normalizeCreditAnalysisReportTemplateConfig } from '../../reports/generateCreditAnalysisReportPdf';
import { newId } from '../../utils/ids';
import { addAuditEvent } from '../../data/auditRepo';
import { notifyAnalysisReportReady } from '../../lib/analysisReportDelivery';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { Button } from '../../components/ui';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildPortalNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import { getCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import {
  createTemplateVaultItem,
  defaultRequiredEntitlementsForCategory,
  listVisibleTemplateVaultItemsForPartner,
  upsertTemplateVaultItem,
} from '../../data/templateVaultRepo';
import type { TemplateVaultItem } from '../../domain/templateVault';
import { captureScoreSnapshotFromReport, listCreditScoreSnapshots } from '../../data/creditScoreSnapshotsRepo';
import { listLettersByPartner } from '../../data/lettersRepo';
import { listCasesByPartner } from '../../data/casesRepo';
import { buildCreditIntelDashboard, spawnDisputeTaskFromSuggestion } from '../../lib/creditIntelDashboard';
import { listTasksByPartner } from '../../data/tasksRepo';
import { PartnerCreditRestoreCommandStrip } from '../../components/partner/PartnerCreditRestoreCommandStrip';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { computeRestoreEvidenceCoverage } from '../../lib/evidenceCoverage';

export default function PartnerReportsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = auth.user?.email || '';
  const { partner } = usePartnerSession();

  const deepLink = useMemo(() => {
    const q = new URLSearchParams(location.search);
    const intelTabRaw = (q.get('intelTab') || '').trim();
    const intelTab = intelTabRaw === 'collections' || intelTabRaw === 'accounts' ? intelTabRaw : null;
    const scrollToAccount = (q.get('scrollToAccount') || '').trim() || null;
    const returnTo = (q.get('returnTo') || '').trim() || null;
    return { intelTab, scrollToAccount, returnTo };
  }, [location.search]);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);
  const [evidenceVersion, setEvidenceVersion] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [reparseId, setReparseId] = useState<string | null>(null);
  const [reparseErr, setReparseErr] = useState<string | null>(null);
  const [reportSyncNotice, setReportSyncNotice] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const onSync = (e: Event) => {
      const detail = (e as CustomEvent<{ reportId: string; ok: boolean; error?: string }>).detail;
      if (!detail) return;
      setReportSyncNotice(
        detail.ok
          ? { ok: true, message: 'Report saved to cloud.' }
          : { ok: false, message: detail.error || 'Cloud sync failed — report is saved locally only.' },
      );
    };
    window.addEventListener('finely:report-sync', onSync as EventListener);
    return () => window.removeEventListener('finely:report-sync', onSync as EventListener);
  }, []);

  const reports = useMemo(() => {
    if (!partner) return [];
    return listReportsByPartner(partner.id);
  }, [partner, reportsVersion]);

  const selected = useMemo(() => {
    if (!selectedReportId) return reports[0] ?? null;
    return reports.find((r) => r.id === selectedReportId) ?? null;
  }, [reports, selectedReportId]);

  const [tab, setTab] = useState<'reports' | 'evidence'>('reports');
  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner, evidenceVersion]);
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner]);
  const cases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner]);
  const openCasesCount = useMemo(() => cases.filter((c) => c.status === 'open').length, [cases]);
  const disputeCandidates = useMemo(() => {
    if (!selected?.parsed) return [];
    return deriveDisputeCandidates(selected.parsed as any, selected.id);
  }, [selected?.id, selected?.parsed]);
  const evidenceCoverage = useMemo(
    () =>
      computeRestoreEvidenceCoverage({
        candidates: disputeCandidates,
        evidenceCount: evidence.length,
        letters,
      }),
    [disputeCandidates, evidence.length, letters],
  );

  const reportsKpis = useMemo(
    () => [
      { label: 'Reports', value: String(reports.length), hint: 'Uploaded files', accent: 'violet' as const },
      { label: 'Parsed', value: String(reports.filter((r) => r.parsed).length), hint: 'Ready for intel', accent: 'emerald' as const },
      { label: 'Evidence', value: String(evidence.length), hint: 'Vault files', accent: 'sky' as const },
      { label: 'Candidates', value: String(disputeCandidates.length), hint: 'Disputable items', accent: 'amber' as const },
    ],
    [reports, evidence.length, disputeCandidates.length],
  );

  const scoreSnapshots = useMemo(
    () => (partner ? listCreditScoreSnapshots(partner.id) : []),
    [partner, reportsVersion],
  );
  const creditIntelModel = useMemo(() => {
    if (!selected?.parsed) return null;
    return buildCreditIntelDashboard({
      parsed: selected.parsed,
      snapshots: scoreSnapshots,
      evidence,
      letters,
    });
  }, [selected?.parsed, scoreSnapshots, evidence, letters]);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [analysisVariant, setAnalysisVariant] = useState<'standard' | 'negatives_heavy' | 'funding_focus'>('standard');
  const [analysisIncludeExhibits, setAnalysisIncludeExhibits] = useState(true);
  const [analysisExhibitIds, setAnalysisExhibitIds] = useState<string[]>([]);
  const [analysisTemplateId, setAnalysisTemplateId] = useState<string>('');
  const [analysisTemplateStudioOpen, setAnalysisTemplateStudioOpen] = useState(false);
  const [analysisTemplateStudioTitle, setAnalysisTemplateStudioTitle] = useState('');
  const [analysisTemplateStudioJson, setAnalysisTemplateStudioJson] = useState('');
  const [analysisTemplateStudioErr, setAnalysisTemplateStudioErr] = useState<string | null>(null);
  const [analysisTemplateStudioSaving, setAnalysisTemplateStudioSaving] = useState(false);
  const [analysisTemplateStudioEditId, setAnalysisTemplateStudioEditId] = useState<string | null>(null);

  const analysisTemplates = useMemo(() => {
    if (!partner) return [];
    const tenantId = (partner.tenantId || '').trim() || FINELY_TENANT_ID;
    const visible = listVisibleTemplateVaultItemsForPartner({ tenantId, partnerId: partner.id });
    return visible
      .filter((t) => t.category === 'ops')
      .filter((t) => (t.tags ?? []).includes('analysis_report_template'))
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [partner?.id]);

  const selectedAnalysisTemplate = useMemo<TemplateVaultItem | null>(() => {
    if (!analysisTemplateId) return analysisTemplates[0] ?? null;
    return analysisTemplates.find((t) => t.id === analysisTemplateId) ?? analysisTemplates[0] ?? null;
  }, [analysisTemplateId, analysisTemplates]);

  const selectedAnalysisTemplateConfig = useMemo(() => {
    const raw = String(selectedAnalysisTemplate?.bodyText || '').trim();
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      return normalizeCreditAnalysisReportTemplateConfig(obj);
    } catch {
      return null;
    }
  }, [selectedAnalysisTemplate?.bodyText]);

  useEffect(() => {
    // Apply template settings (currently variant only).
    if (!selectedAnalysisTemplateConfig) return;
    try {
      const v = String(selectedAnalysisTemplateConfig?.variant || '').trim();
      if (v === 'standard' || v === 'negatives_heavy' || v === 'funding_focus') setAnalysisVariant(v as any);
      if (typeof selectedAnalysisTemplateConfig?.exhibits?.max === 'number') {
        setAnalysisIncludeExhibits(selectedAnalysisTemplateConfig.exhibits.max > 0);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnalysisTemplate?.id, Boolean(selectedAnalysisTemplateConfig)]);

  const identityCheck = useMemo(() => {
    if (!partner || !selected?.parsed) return null;
    // Prefer the identityCheck stored on the report at upload time; fallback to a fresh compute for older records.
    return (selected as any)?.identityCheck ?? computeReportIdentityCheck({ partnerId: partner.id, parsed: selected.parsed });
  }, [partner?.id, selected?.id, Boolean(selected?.parsed)]);

  const handleReparse = async (r: any) => {
    setReparseErr(null);
    setReparseId(r.id);
    try {
      if (isLegacyPendingReportBlob(r.rawBlobRef)) {
        throw new Error('This report was migrated without the original file. Re-upload using the uploader above.');
      }
      if (!canAccessReportBlob(r.rawBlobRef)) {
        throw new Error('This report has no accessible stored file. Re-upload the original HTML or PDF export.');
      }
      const updated = await reparseStoredCreditReport({ record: r });
      upsertReport(updated);
      if (partner && updated.parsed) {
        captureScoreSnapshotFromReport({
          partnerId: partner.id,
          reportId: r.id,
          parsed: updated.parsed,
          provider: updated.provider ?? undefined,
        });
      }
      setReportsVersion((v) => v + 1);
    } catch (e: any) {
      setReparseErr(e?.message || 'Re-parse failed.');
    } finally {
      setReparseId(null);
    }
  };

  const isAdminNoPartner = Boolean(email && isAdminEmail(email) && !partner);

  if (isAdminNoPartner) {
    return (
      <PageShell
        badge="Admin"
        title="Credit Reports"
        subtitle="Admins upload reports inside a specific Partner profile. Select a partner, then use the Reports tab."
      >
        <div className={FINELY_OS_PAGE}>
          <div className={`${FINELY_OS_LUXURY_EMPTY} text-left`}>
            You’re signed in as an admin. To keep data anchored correctly, uploads must be attached to a Partner record.
          </div>
          <Button variant="primary" onClick={() => navigate('/admin/partners')}>
            Open Partner Management
          </Button>
        </div>
      </PageShell>
    );
  }

  if (!partner) {
    return (
      <PageShell
        badge="Partner Portal"
        title="My Credit Reports"
        subtitle="Sign in to upload and view your credit reports."
      />
    );
  }

  return (
    <PageShell
      badge="Partner Portal"
      title="My Credit Reports"
      subtitle="Upload your IdentityIQ/MyScoreIQ exports (HTML or PDF). HTML files parse into tradelines + 2-year payment history tables."
    >
      <EntitlementGate partnerId={partner.id} requiredKeys={[ENTITLEMENT_KEYS.reports]}>
        <div className={FINELY_OS_PAGE}>
          <FinelyNowDoThisStrip currentIndex={reports.length === 0 ? 0 : 2} />
          <FinelyNoticedStrip
            items={buildPortalNoticedItems({
              reportsCount: reports.length,
              lettersCount: letters.length,
              openCasesCount: openCasesCount,
              evidenceCount: evidence.length,
            })}
          />
          <PartnerCreditRestoreCommandStrip
            partner={partner}
            reportsCount={reports.length}
            evidenceCount={evidence.length}
            lettersCount={letters.length}
            openCasesCount={openCasesCount}
            negativesCount={disputeCandidates.length}
          />

          {reports.length === 0 ? (
            <FinelyOsAlertBanner
              tone="blocking"
              message="Step 1 — Upload your first credit report (HTML preferred). Restoration cannot start until we have a bureau file to analyze."
            />
          ) : selected?.parsed && disputeCandidates.length > 0 ? (
            <FinelyOsAlertBanner
              tone={evidenceCoverage.tone === 'success' ? 'success' : evidenceCoverage.tone === 'blocking' ? 'blocking' : 'warning'}
              message={evidenceCoverage.summary}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => navigate('/portal/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Partner Dashboard">
                <ArrowLeft size={16} /> Partner Dashboard
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
                <ArrowLeft size={16} /> Finely Cred
              </button>
              {deepLink.returnTo ? (
                <button
                  type="button"
                  onClick={() => navigate(deepLink.returnTo!)}
                  className={FINELY_OS_SUCCESS_BTN}
                  title="Return to where you started"
                >
                  Return to Letters <ChevronRight size={14} />
                </button>
              ) : null}
            </div>
          </div>

        <ReportUploader
          partnerId={partner.id}
          uploadedBy="partner"
          onCreated={(record) => {
            upsertReport(record);
            if (record.parsed && partner) {
              captureScoreSnapshotFromReport({
                partnerId: partner.id,
                reportId: record.id,
                parsed: record.parsed,
                provider: record.provider,
              });
            }
            addAuditEvent({
              partnerId: partner.id,
              actorType: 'partner',
              actorEmail: email || undefined,
              action: 'report.uploaded',
              entityType: 'report',
              entityId: record.id,
              meta: { filename: record.filename, fileType: record.fileType, provider: record.provider ?? null },
            });
            setSelectedReportId(record.id);
            setReportsVersion((v) => v + 1);
          }}
        />

        <FinelyUnifiedHubLayout
          eyebrow="Credit reports"
          title="Reports & evidence — tab-first"
          subtitle="Credit intel from parsed bureau files and your evidence vault."
          accent="emerald"
          kpis={reportsKpis}
          tabs={[
            { id: 'reports', label: 'Credit intel', badge: reports.length || undefined },
            { id: 'evidence', label: 'Evidence vault', badge: evidence.length || undefined },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as 'reports' | 'evidence')}
          primaryAction={{ label: 'Dispute center', onClick: () => navigate('/portal/disputes') }}
          secondaryAction={{ label: 'Letter Studio', onClick: () => navigate('/portal/letters') }}
        >
        {!isSupabaseConfigured ? (
          <div className={`${FINELY_OS_NOTICE_WARN} text-sm`}>
            Cloud sync unavailable — configure Supabase to persist reports across devices. Reports are stored in this browser until then.
          </div>
        ) : null}
        {reportSyncNotice ? (
          <div className={reportSyncNotice.ok ? FINELY_OS_NOTICE : FINELY_OS_NOTICE_WARN}>{reportSyncNotice.message}</div>
        ) : null}

        {tab === 'reports' && (
          <div className="space-y-6 w-full max-w-full overflow-visible">
            <ReportFileStrip
              reports={reports}
              selectedId={selectedReportId}
              onSelect={setSelectedReportId}
              label="Your uploads"
              accent="amber"
            />

            {(deleteErr || reparseErr) && (
              <div className="space-y-3">
                {deleteErr ? <div className={FINELY_OS_NOTICE_ERROR}>{deleteErr}</div> : null}
                {reparseErr ? <div className={FINELY_OS_NOTICE_ERROR}>{reparseErr}</div> : null}
              </div>
            )}

            {selected ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-4 md:!p-5 w-full`}>
                <ReportActionsBar report={selected}>
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    title={
                      isLegacyPendingReportBlob(selected.rawBlobRef)
                        ? 'File not yet in storage — re-upload first'
                        : !canAccessReportBlob(selected.rawBlobRef)
                          ? 'Stored file missing — re-upload to re-parse'
                          : 'Re-run parsing from stored raw file'
                    }
                    disabled={
                      Boolean(reparseId) ||
                      deletingId === selected.id ||
                      isLegacyPendingReportBlob(selected.rawBlobRef) ||
                      !canAccessReportBlob(selected.rawBlobRef)
                    }
                    onClick={() => void handleReparse(selected as any)}
                  >
                    <RefreshCcw size={14} className="text-violet-300" />
                    {reparseId === selected.id ? 'Re-parsing…' : 'Re-parse'}
                  </button>
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    title="Delete report"
                    disabled={deletingId === selected.id || Boolean(reparseId)}
                    onClick={async () => {
                      setDeleteErr(null);
                      const ok = window.confirm(
                        `Delete this report?\n\n${selected.filename}\n\nThis removes it from your uploads list (and deletes the stored file).`,
                      );
                      if (!ok) return;
                      setDeletingId(selected.id);
                      try {
                        const store = getBlobStore();
                        try {
                          await store.delete(selected.rawBlobRef);
                        } catch {
                          // ignore
                        }
                        deleteReport(selected.id);
                        if (selectedReportId === selected.id) setSelectedReportId(null);
                        setReportsVersion((v) => v + 1);
                      } catch (err: any) {
                        setDeleteErr(err?.message || 'Delete failed.');
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    <Trash2 size={14} className="text-rose-600" />
                    {deletingId === selected.id ? 'Deleting…' : 'Delete'}
                  </button>
                </ReportActionsBar>
              </div>
            ) : null}

            <div className="w-full max-w-full overflow-visible">
              {selected && isLegacyPendingReportBlob(selected.rawBlobRef) ? (
                <div className="space-y-6">
                  <LegacyPendingReportNotice
                    filename={selected.filename}
                    rawBlobRef={selected.rawBlobRef}
                    variant="partner"
                  />
                  {selected.parsed ? (
                    <>
                      {creditIntelModel ? (
                        <CreditIntelDashboardPanel
                          model={creditIntelModel}
                          onSpawnTask={(candidateId) => {
                            if (!partner) return;
                            const suggestion = creditIntelModel.nextDisputes.find((d) => d.candidateId === candidateId);
                            if (!suggestion) return;
                            const titles = listTasksByPartner(partner.id).map((t) => t.title);
                            spawnDisputeTaskFromSuggestion({ partnerId: partner.id, suggestion, existingTaskTitles: titles });
                          }}
                        />
                      ) : null}
                      <ParsedReportOverviewPanel parsed={selected.parsed} filename={selected.filename} />
                      <CreditIntelTabs
                        parsed={selected.parsed}
                        reportId={selected.id}
                        partnerId={partner.id}
                        evidence={evidence as any}
                        availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
                        onOpenEvidenceVault={() => setTab('evidence')}
                        onOpenTasks={() => navigate('/portal/projects')}
                        initialTab={(deepLink.intelTab as any) || undefined}
                        initialScrollToAccount={deepLink.scrollToAccount}
                        onStartDispute={(candidate: DisputeCandidate, reasonTexts: string[]) => {
                          const item = candidateToCaseItem(candidate, { reasons: reasonTexts });
                          const c = createDisputeCase({
                            partnerId: partner.id,
                            bureau: candidate.bureau,
                            title: `${candidate.account} — ${candidate.type}`,
                            latestReportId: selected?.id,
                            items: [item],
                            initialRound: { round: 'Round 1', tone: 'formal', createdAt: nowIso() },
                          });
                          navigate(`/portal/letters?caseId=${encodeURIComponent(c.id)}`);
                        }}
                      />
                      <section className="w-full max-w-full overflow-visible" id="fc-tradelines-full">
                        <ParsedReportViewer parsed={selected.parsed} partnerId={partner.id} reportId={selected.id} />
                      </section>
                    </>
                  ) : null}
                </div>
              ) : selected?.parsed ? (
                <div className="space-y-6">
                  {creditIntelModel ? (
                    <CreditIntelDashboardPanel
                      model={creditIntelModel}
                      onSpawnTask={(candidateId) => {
                        if (!partner) return;
                        const suggestion = creditIntelModel.nextDisputes.find((d) => d.candidateId === candidateId);
                        if (!suggestion) return;
                        const titles = listTasksByPartner(partner.id).map((t) => t.title);
                        spawnDisputeTaskFromSuggestion({ partnerId: partner.id, suggestion, existingTaskTitles: titles });
                      }}
                    />
                  ) : null}
                  <ParsedReportOverviewPanel parsed={selected.parsed} filename={selected.filename} />
                  {(selected.parsed.tradelines?.length ?? 0) === 0 ? (
                    <div className={FINELY_OS_NOTICE_WARN}>
                      Partial parse — no tradelines extracted. Try HTML export, re-parse, or upload a fuller report file.
                    </div>
                  ) : null}
                  <ParsedReportDiagnosticsPanel
                    parsed={selected.parsed}
                    filename={selected.filename}
                    variant="partner"
                    pdfMeta={selected.fileType === 'pdf' ? (selected.pdfMeta as any) : undefined}
                    defaultOpen={
                      (selected.parsed.tradelines?.length ?? 0) === 0 ||
                      Boolean(selected.parsed.debug?.fallbackTradelinesUsed) ||
                      selected.parsed.provider === 'unknown'
                    }
                  />

                  {identityCheck?.faults?.length ? (
                    <div className={`${finelyOsCatalogCard('violet')} !p-5 border-fuchsia-500/25 space-y-4`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className={FINELY_OS_ENTITY_LABEL}>Identity + report match</div>
                          <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>We detected possible mismatches</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                            If the report belongs to a different person (or your saved mailing info is incomplete), letters may auto-fill incorrectly.
                            Fix these before generating and mailing dispute packets.
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => navigate('/portal/checklist')}>
                            Open checklist
                          </Button>
                          <Button variant="secondary" onClick={() => navigate('/portal/projects')}>
                            Open tasks
                          </Button>
                          <Button variant="secondary" onClick={() => navigate('/portal/documents')}>
                            Open documents
                          </Button>
                          <Button variant="primary" onClick={() => navigate('/portal/letters?openPicker=1')}>
                            Open Letters Studio
                          </Button>
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-4">
                        <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                          <div className={FINELY_OS_ENTITY_LABEL}>Canonical (profile)</div>
                          <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} font-mono whitespace-pre-wrap break-words space-y-1`}>
                            <div>name: {identityCheck.canonical?.fullName || '—'}</div>
                            <div>addr: {identityCheck.canonical?.addressLine1 || '—'}</div>
                            <div>csz: {identityCheck.canonical?.cityStateZip || '—'}</div>
                          </div>
                        </div>
                        <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                          <div className={FINELY_OS_ENTITY_LABEL}>From report (extracted)</div>
                          <div className={`mt-3 ${FINELY_OS_ENTITY_BODY} font-mono whitespace-pre-wrap break-words space-y-1`}>
                            <div>name: {identityCheck.report?.fullName || '—'}</div>
                            <div>addr: {identityCheck.report?.addressLine1 || '—'}</div>
                            <div>csz: {identityCheck.report?.cityStateZip || '—'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {identityCheck.faults.map((f: any, idx: number) => {
                          const tone =
                            f.severity === 'error'
                              ? FINELY_OS_NOTICE_ERROR
                              : f.severity === 'warn'
                                ? FINELY_OS_NOTICE_WARN
                                : FINELY_OS_NOTICE;
                          return (
                            <div key={`${f.kind}_${idx}`} className={tone}>
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-semibold">{f.kind.replace(/_/g, ' ')}</div>
                                <div className={FINELY_OS_ENTITY_SUBLABEL}>{f.severity}</div>
                              </div>
                              <div className="mt-2">{f.message}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-700">Free deliverable</div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>Credit Analysis Report (20+ pages)</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                          Generates a multi-page PDF with scores, negatives breakdown, and a roadmap. It will be saved into your Documents Vault as a PDF. Optionally include exhibits (screenshots) in the appendix.
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <button
                          type="button"
                          disabled={analysisBusy}
                          onClick={async () => {
                            if (!partner || !selected?.parsed) return;
                            setAnalysisNotice(null);
                            setAnalysisBusy(true);
                            try {
                              const candidates = deriveDisputeCandidates(selected.parsed, selected.id);
                              const exhibits = analysisIncludeExhibits
                                ? analysisExhibitIds
                                    .map((id) => evidence.find((e) => e.id === id) ?? null)
                                    .filter(Boolean)
                                    .filter((e: any) => String(e?.mimeType || '').toLowerCase().startsWith('image/'))
                                    .slice(0, 10)
                                    .map((e: any) => ({ blobRef: e.blobRef, filename: e.filename, mimeType: e.mimeType, caption: e.caption }))
                                : [];
                              const { blob, filename, pages, exhibitsIncluded } = await generateCreditAnalysisReportPdf({
                                partner,
                                report: selected,
                                candidates,
                                variant: analysisVariant,
                                exhibits,
                                template: selectedAnalysisTemplateConfig,
                              });
                              const store = getBlobStore();
                              const put = await store.put(blob, { partnerId: partner.id, reportId: selected.id, kind: 'reports' });
                              const item = {
                                id: newId('evidence'),
                                partnerId: partner.id,
                                reportId: selected.id,
                                type: 'upload' as const,
                                source: 'upload' as const,
                                caption: `Credit Analysis Report • ${selected.filename} • variant:${analysisVariant}${exhibitsIncluded ? ` • exhibits:${exhibitsIncluded}` : ''}`,
                                tags: ['analysis_report', `analysis_variant:${analysisVariant}`],
                                filename,
                                mimeType: 'application/pdf',
                                sizeBytes: blob.size,
                                blobRef: put.ref,
                                createdAt: new Date().toISOString(),
                              };
                              upsertEvidence(item as any);
                              setEvidenceVersion((v) => v + 1);
                              addAuditEvent({
                                partnerId: partner.id,
                                actorType: 'partner',
                                actorEmail: email || undefined,
                                action: 'report.credit_analysis.generated',
                                entityType: 'evidence',
                                entityId: item.id,
                                meta: { pages, filename, reportId: selected.id, variant: analysisVariant, exhibitsIncluded },
                              });
                              setAnalysisNotice(
                                `Generated and saved (${pages} pages${exhibitsIncluded ? ` • ${exhibitsIncluded} exhibit(s)` : ''}). Find it in Documents Vault.`,
                              );
                              const emailResult = await notifyAnalysisReportReady({
                                partner,
                                report: selected,
                                candidates,
                              });
                              if (emailResult.sent) {
                                setAnalysisNotice((prev) =>
                                  `${prev ?? ''} Analysis summary email sent to your inbox.`.trim(),
                                );
                              }
                            } catch (e: any) {
                              setAnalysisNotice(e?.message || 'Failed to generate report.');
                            } finally {
                              setAnalysisBusy(false);
                            }
                          }}
                          className={FINELY_OS_SUCCESS_BTN}
                        >
                          {analysisBusy ? 'Generating…' : 'Generate PDF'}
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <div className={FINELY_OS_ENTITY_LABEL}>Variant</div>
                        <select
                          value={analysisVariant}
                          onChange={(e) => setAnalysisVariant(e.target.value as any)}
                          className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}
                        >
                          <option value="standard">Standard</option>
                          <option value="negatives_heavy">Negatives-heavy</option>
                          <option value="funding_focus">Funding-focus</option>
                        </select>
                        <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Controls section density + emphasis.</div>
                      </div>

                      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className={FINELY_OS_ENTITY_LABEL}>Exhibits</div>
                          <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            <input
                              type="checkbox"
                              checked={analysisIncludeExhibits}
                              onChange={(e) => setAnalysisIncludeExhibits(e.target.checked)}
                              className="accent-amber-500"
                            />
                            Include
                          </label>
                        </div>
                        <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                          Selected: <span className="font-mono">{analysisExhibitIds.length}</span>
                        </div>
                        <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>Adds image exhibits in the appendix (screenshots/attachments).</div>
                      </div>

                      <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <div className={FINELY_OS_ENTITY_LABEL}>Templates (optional)</div>
                        {analysisTemplates.length === 0 ? (
                          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>No saved analysis templates yet.</div>
                        ) : (
                          <select
                            value={selectedAnalysisTemplate?.id ?? ''}
                            onChange={(e) => setAnalysisTemplateId(e.target.value)}
                            className={`mt-2 w-full ${FINELY_OS_ENTITY_SELECT}`}
                            title="Apply a saved analysis template"
                          >
                            {analysisTemplates.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          disabled={!partner}
                          onClick={() => {
                            if (!partner) return;
                            const tenantId = (partner.tenantId || '').trim() || FINELY_TENANT_ID;
                            const title = `Credit Analysis Template • ${analysisVariant}`;
                            const cfg = {
                              version: 1,
                              title: 'Credit Analysis Report',
                              badgeLine: 'Premium deliverable • Strategy • Negatives • Next steps',
                              variant: analysisVariant,
                              exhibits: { max: analysisIncludeExhibits ? 10 : 0 },
                              negatives: { maxPerBucket: analysisVariant === 'negatives_heavy' ? 40 : 18 },
                              minPages: 22,
                            };
                            createTemplateVaultItem({
                              tenantId,
                              title,
                              category: 'ops',
                              tags: ['analysis_report_template', `analysis_variant:${analysisVariant}`],
                              kind: 'text',
                              bodyText: JSON.stringify(cfg, null, 2),
                              requiredEntitlements: defaultRequiredEntitlementsForCategory('ops'),
                              createdBy: { actorType: 'partner', email: email || undefined },
                            });
                            setAnalysisNotice('Saved current analysis settings as a template (Templates Vault).');
                          }}
                          className={`mt-3 ${FINELY_OS_SECONDARY_BTN}`}
                          title="Save these settings into Templates Vault (requires Templates entitlement to view/use)"
                        >
                          Save template
                        </button>

                        <button
                          type="button"
                          disabled={!partner}
                          onClick={() => {
                            if (!partner) return;
                            const base = selectedAnalysisTemplateConfig ?? {
                              version: 1,
                              title: 'Credit Analysis Report',
                              badgeLine: 'Premium deliverable • Strategy • Negatives • Next steps',
                              variant: analysisVariant,
                              exhibits: { max: analysisIncludeExhibits ? 10 : 0 },
                              negatives: { maxPerBucket: analysisVariant === 'negatives_heavy' ? 40 : 18 },
                              minPages: 22,
                            };
                            setAnalysisTemplateStudioEditId(selectedAnalysisTemplate?.id ?? null);
                            setAnalysisTemplateStudioTitle(selectedAnalysisTemplate?.title || `Credit Analysis Template • ${analysisVariant}`);
                            setAnalysisTemplateStudioJson(JSON.stringify(base, null, 2));
                            setAnalysisTemplateStudioErr(null);
                            setAnalysisTemplateStudioOpen(true);
                          }}
                          className={`mt-2 ${FINELY_OS_SECONDARY_BTN}`}
                          title="Edit/save a template config (JSON) used by the PDF generator"
                        >
                          Template studio
                        </button>
                      </div>
                    </div>

                    {analysisIncludeExhibits ? (
                      <details className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                        <summary className="cursor-pointer select-none">
                          <div className="flex items-center justify-between gap-3">
                            <div className={FINELY_OS_ENTITY_LABEL}>Pick exhibits (images)</div>
                            <div className="text-[10px] uppercase tracking-widest text-violet-300">Expand</div>
                          </div>
                        </summary>
                        <div className="mt-3 grid md:grid-cols-2 gap-2">
                          {evidence
                            .filter((e) => String(e.mimeType || '').toLowerCase().startsWith('image/'))
                            .slice(0, 40)
                            .map((ev) => (
                              <label key={ev.id} className={`flex items-start gap-2 ${finelyOsListItem(analysisExhibitIds.includes(ev.id), 'amber')} !p-3 cursor-pointer`}>
                                <input
                                  type="checkbox"
                                  checked={analysisExhibitIds.includes(ev.id)}
                                  onChange={() =>
                                    setAnalysisExhibitIds((prev) => (prev.includes(ev.id) ? prev.filter((x) => x !== ev.id) : [...prev, ev.id]))
                                  }
                                  className="mt-1"
                                />
                                <div className="min-w-0">
                                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm truncate`}>{ev.filename}</div>
                                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} truncate`}>
                                    {ev.mimeType} • {new Date(ev.createdAt).toLocaleDateString()}
                                  </div>
                                  {ev.caption ? <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs line-clamp-2`}>{ev.caption}</div> : null}
                                </div>
                              </label>
                            ))}
                        </div>
                        <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                          Tip: keep exhibits tight (3–6). The report generator will include up to 10 image exhibits.
                        </div>
                      </details>
                    ) : null}

                    {analysisNotice ? <div className={FINELY_OS_NOTICE}>{analysisNotice}</div> : null}
                  </div>

                  {analysisTemplateStudioOpen ? (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                      <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => {
                          if (analysisTemplateStudioSaving) return;
                          setAnalysisTemplateStudioOpen(false);
                        }}
                      />
                      <div
                        className={`relative w-full max-w-4xl overflow-hidden ${finelyOsCatalogCard('violet')} !p-0 shadow-2xl`}
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className={FINELY_OS_ENTITY_SUBLABEL}>Template studio</div>
                            <div className={`mt-2 text-2xl font-light ${FINELY_OS_ENTITY_VALUE} truncate`}>
                              Credit Analysis Report template (JSON)
                            </div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                              Saved to Templates Vault as an <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>ops</span> template with tag{' '}
                              <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>analysis_report_template</span>.
                            </div>
                          </div>
                          <button
                            type="button"
                            className={FINELY_OS_SECONDARY_BTN}
                            disabled={analysisTemplateStudioSaving}
                            onClick={() => setAnalysisTemplateStudioOpen(false)}
                          >
                            Close
                          </button>
                        </div>

                        <div className="p-6 space-y-4">
                          {analysisTemplateStudioErr ? (
                            <div className={FINELY_OS_NOTICE_ERROR}>{analysisTemplateStudioErr}</div>
                          ) : null}

                          <div className="grid lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-1 min-w-0 space-y-3">
                              <div>
                                <div className={FINELY_OS_ENTITY_SUBLABEL}>Template title</div>
                                <input
                                  value={analysisTemplateStudioTitle}
                                  onChange={(e) => setAnalysisTemplateStudioTitle(e.target.value)}
                                  className={FINELY_OS_ENTITY_INPUT}
                                  placeholder="Credit Analysis Template • Standard"
                                />
                              </div>
                              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-[11px] ${FINELY_OS_ENTITY_BODY} space-y-2`}>
                                <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>Tips</div>
                                <div>- Keep <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>version: 1</span>.</div>
                                <div>- Set <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>variant</span> to control density.</div>
                                <div>- Set <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>exhibits.max</span> to 0 to disable exhibits.</div>
                                <div>- Set <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>negatives.maxPerBucket</span> for depth.</div>
                                <div>- Set <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>minPages</span> for premium padding.</div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={analysisTemplateStudioSaving}
                                  onClick={() => {
                                    setAnalysisTemplateStudioErr(null);
                                    try {
                                      const obj = JSON.parse(analysisTemplateStudioJson || '{}');
                                      const norm = normalizeCreditAnalysisReportTemplateConfig(obj);
                                      if (!norm) throw new Error('Invalid template config. Expected { "version": 1, ... }.');
                                      const v = String(norm.variant || '').trim();
                                      if (v === 'standard' || v === 'negatives_heavy' || v === 'funding_focus') setAnalysisVariant(v as any);
                                      if (typeof norm.exhibits?.max === 'number') setAnalysisIncludeExhibits(norm.exhibits.max > 0);
                                      setAnalysisNotice('Applied template settings to this generator panel.');
                                      setAnalysisTemplateStudioErr(null);
                                    } catch (e: any) {
                                      setAnalysisTemplateStudioErr(e?.message || 'Invalid JSON.');
                                    }
                                  }}
                                  className={FINELY_OS_PRIMARY_BTN}
                                >
                                  Apply to generator
                                </button>
                                <button
                                  type="button"
                                  disabled={analysisTemplateStudioSaving}
                                  onClick={async () => {
                                    if (!partner) return;
                                    const tenantId = (partner.tenantId || '').trim() || FINELY_TENANT_ID;
                                    const title = (analysisTemplateStudioTitle || '').trim() || `Credit Analysis Template • ${analysisVariant}`;
                                    setAnalysisTemplateStudioSaving(true);
                                    setAnalysisTemplateStudioErr(null);
                                    try {
                                      const obj = JSON.parse(analysisTemplateStudioJson || '{}');
                                      const norm = normalizeCreditAnalysisReportTemplateConfig(obj);
                                      if (!norm) throw new Error('Invalid template config. Expected { "version": 1, ... }.');
                                      createTemplateVaultItem({
                                        tenantId,
                                        title,
                                        category: 'ops',
                                        tags: ['analysis_report_template', `analysis_variant:${String(norm.variant || analysisVariant)}`],
                                        kind: 'text',
                                        bodyText: JSON.stringify(norm, null, 2),
                                        requiredEntitlements: defaultRequiredEntitlementsForCategory('ops'),
                                        createdBy: { actorType: 'partner', email: email || undefined },
                                      });
                                      setAnalysisNotice('Saved template to Templates Vault.');
                                      setAnalysisTemplateStudioOpen(false);
                                      setAnalysisTemplateStudioEditId(null);
                                    } catch (e: any) {
                                      setAnalysisTemplateStudioErr(e?.message || 'Failed to save template.');
                                    } finally {
                                      setAnalysisTemplateStudioSaving(false);
                                    }
                                  }}
                                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
                                >
                                  Save as new
                                </button>
                                {analysisTemplateStudioEditId ? (
                                  <button
                                    type="button"
                                    disabled={analysisTemplateStudioSaving}
                                    onClick={async () => {
                                      if (!partner || !analysisTemplateStudioEditId) return;
                                      const tenantId = (partner.tenantId || '').trim() || FINELY_TENANT_ID;
                                      setAnalysisTemplateStudioSaving(true);
                                      setAnalysisTemplateStudioErr(null);
                                      try {
                                        const obj = JSON.parse(analysisTemplateStudioJson || '{}');
                                        const norm = normalizeCreditAnalysisReportTemplateConfig(obj);
                                        if (!norm) throw new Error('Invalid template config. Expected { "version": 1, ... }.');
                                        const existing = analysisTemplates.find((t) => t.id === analysisTemplateStudioEditId) ?? null;
                                        if (!existing) throw new Error('Original template not found.');
                                        upsertTemplateVaultItem({
                                          ...existing,
                                          tenantId,
                                          title: (analysisTemplateStudioTitle || existing.title).trim() || existing.title,
                                          tags: ['analysis_report_template', `analysis_variant:${String(norm.variant || analysisVariant)}`],
                                          kind: 'text',
                                          bodyText: JSON.stringify(norm, null, 2),
                                          requiredEntitlements: defaultRequiredEntitlementsForCategory('ops'),
                                        });
                                        setAnalysisNotice('Updated template in Templates Vault.');
                                        setAnalysisTemplateStudioOpen(false);
                                      } catch (e: any) {
                                        setAnalysisTemplateStudioErr(e?.message || 'Failed to update template.');
                                      } finally {
                                        setAnalysisTemplateStudioSaving(false);
                                      }
                                    }}
                                    className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60`}
                                  >
                                    Update selected
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            <div className="lg:col-span-2 min-w-0">
                              <div className={FINELY_OS_ENTITY_SUBLABEL}>Template JSON</div>
                              <textarea
                                value={analysisTemplateStudioJson}
                                onChange={(e) => setAnalysisTemplateStudioJson(e.target.value)}
                                className={`mt-2 w-full h-[520px] ${FINELY_OS_ENTITY_SELECT} font-mono text-sm`}
                                spellCheck={false}
                              />
                              <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                                This config is consumed by the PDF generator at generation time.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <CreditIntelTabs
                    parsed={selected.parsed}
                    reportId={selected.id}
                    partnerId={partner.id}
                    evidence={evidence as any}
                    availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
                    onOpenEvidenceVault={() => setTab('evidence')}
                    onOpenTasks={() => navigate('/portal/projects')}
                    initialTab={(deepLink.intelTab as any) || undefined}
                    initialScrollToAccount={deepLink.scrollToAccount}
                    onStartDispute={(candidate: DisputeCandidate, reasonTexts: string[]) => {
                      const item = candidateToCaseItem(candidate, { reasons: reasonTexts });
                      const c = createDisputeCase({
                        partnerId: partner.id,
                        bureau: candidate.bureau,
                        title: `${candidate.account} — ${candidate.type}`,
                        latestReportId: selected?.id,
                        items: [item],
                        initialRound: { round: 'Round 1', tone: 'formal', createdAt: nowIso() },
                      });
                      navigate(`/portal/letters?caseId=${encodeURIComponent(c.id)}`);
                    }}
                  />

                  <section className="w-full max-w-full overflow-visible" id="fc-tradelines-full">
                    <ParsedReportViewer parsed={selected.parsed} partnerId={partner.id} reportId={selected.id} />
                  </section>
                </div>
              ) : selected ? (
                selected.fileType === 'pdf' ? (
                  <PdfReportFallbackView
                    pdfText={selected.pdfText}
                    pdfMeta={selected.pdfMeta as any}
                    provider={selected.provider as any}
                    reportDate={selected.reportDate}
                    filename={selected.filename}
                    variant="partner"
                  />
                ) : (
                  <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
                    <div className={FINELY_OS_ENTITY_VALUE}>Parsing data missing</div>
                    <div className={FINELY_OS_ENTITY_BODY}>
                      This upload doesn’t currently have parsed tradelines attached. Click <span className="text-fuchsia-300 font-semibold">Re-parse</span> to generate the overview and tradelines.
                    </div>
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      disabled={Boolean(reparseId) || Boolean(deletingId)}
                      onClick={() => void handleReparse(selected as any)}
                      title="Re-run parsing from stored raw file"
                    >
                      <RefreshCcw size={14} className="text-fuchsia-300" /> {reparseId === selected.id ? 'Re-parsing…' : 'Re-parse'}
                    </button>
                  </div>
                )
              ) : (
                <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>
                  Upload a report to view parsed tradelines.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'evidence' && (
          <div className="space-y-6">
            <EvidenceUploader
              partnerId={partner.id}
              reportId={selected?.id}
              onCreated={(item) => {
                upsertEvidence(item);
                setEvidenceVersion((v) => v + 1);
              }}
            />
            <EvidenceList
              items={evidence}
              onDelete={(id) => {
                deleteEvidence(id);
                setEvidenceVersion((v) => v + 1);
              }}
              onUpsert={(item) => {
                upsertEvidence(item);
                setEvidenceVersion((v) => v + 1);
              }}
            />
          </div>
        )}
        </FinelyUnifiedHubLayout>
        <FinelyOsPageFooter />
        </div>
      </EntitlementGate>
    </PageShell>
  );
}

