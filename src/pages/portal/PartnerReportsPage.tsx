import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, FileText, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { deleteReport, listReportsByPartner, upsertReport } from '../../data/reportsRepo';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { listCreditAnalysisReportsByPartner, upsertCreditAnalysisReport } from '../../data/creditAnalysisReportsRepo';
import { CreditAnalysisDeliverableStrip } from '../../components/reports/CreditAnalysisDeliverableCard';
import { ReportUploader } from '../../components/reports/ReportUploader';
import { ReportActionsBar, ReportFileStrip } from '../../components/reports/ReportFileStrip';
import { CreditIntelTabs } from '../../components/creditIntel/CreditIntelTabs';
import { SmartProofUploader } from '../../components/evidence/SmartProofUploader';
import { EvidenceList } from '../../components/evidence/EvidenceList';
import { ParsedReportOverviewPanel } from '../../components/reports/ParsedReportOverviewPanel';
import { PdfReportFallbackView } from '../../components/reports/PdfReportFallbackView';
import { LegacyPendingReportNotice } from '../../components/reports/LegacyPendingReportNotice';
import { isLegacyPendingReportBlob } from '../../lib/legacyPendingReport';
import { isAdminEmail } from '../../auth/admin';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../portal/getOrCreatePartnerForSession';
import { getBlobStore } from '../../storage/getBlobStore';
import { canAccessReportBlob } from '../../lib/reportBlobAccess';
import {
  recoverCreditorContactsFromStoredHtml,
  reparseStoredCreditReport,
  shouldRecoverCreditorContactsFromStoredHtml,
} from '../../lib/reportParsePipeline';
import { assessCreditorContactRecovery } from '../../creditReports/creditorContactExtract';
import { persistRefreshedCreditorContactsOnReport } from '../../lib/debtCreditorIntel';
import { computeReportIdentityCheck } from '../../creditReports/identityCheck';
import { createDisputeCase } from '../../data/casesRepo';
import { candidateToCaseItem, nowIso } from '../../domain/cases';
import type { DisputeCandidate } from '../../domain/creditReports';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import { normalizeCreditAnalysisReportTemplateConfig } from '../../reports/generateCreditAnalysisReportPdf';
import { generatePartnerCreditAnalysisReport } from '../../reports/generatePartnerCreditAnalysisReport';
import { PREMIUM_CREDIT_ANALYSIS_TEMPLATE_ID, isPremiumCreditAnalysisEngine, resolveCreditAnalysisEngine } from '../../lib/resolveCreditAnalysisEngine';
import { CREDIT_ANALYSIS_ENGINE_OPTIONS } from '../../lib/creditAnalysisEngineOptions';
import type { CreditAnalysisReportEngine } from '../../reports/generateCreditAnalysisReportPdf';
import { newId } from '../../utils/ids';
import { addAuditEvent } from '../../data/auditRepo';
import { notifyAnalysisReportReady } from '../../lib/analysisReportDelivery';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { Button } from '../../components/ui';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { PartnerRestoreWorkspaceDock } from '../../features/partner/PartnerRestoreWorkspaceDock';
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
import { PartnerCreditRestoreCommandStrip } from '../../components/partner/PartnerCreditRestoreCommandStrip';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { computeRestoreEvidenceCoverage } from '../../lib/evidenceCoverage';
import { buildCollectionContactBoard } from '../../lib/collectionContactBoard';

export default function PartnerReportsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = auth.user?.email || '';
  const { partner } = usePartnerSession();

  const deepLink = useMemo(() => {
    const q = new URLSearchParams(location.search);
    const intelTabRaw = (q.get('intelTab') || '').trim();
    const intelTab = intelTabRaw === 'collections' || intelTabRaw === 'accounts' || intelTabRaw === 'late_payments' || intelTabRaw === 'creditors'
      ? intelTabRaw
      : null;
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
  const [parseOverviewOpen, setParseOverviewOpen] = useState(false);

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
    const onStore = () => setReportsVersion((v) => v + 1);
    window.addEventListener('finely:report-sync', onSync as EventListener);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => {
      window.removeEventListener('finely:report-sync', onSync as EventListener);
      window.removeEventListener('finely:store', onStore as EventListener);
    };
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
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [analysisVariant, setAnalysisVariant] = useState<'standard' | 'negatives_heavy' | 'funding_focus'>('standard');
  const [analysisEngine, setAnalysisEngine] = useState<CreditAnalysisReportEngine>('structured_premium');
  const [analysisIncludeExhibits, setAnalysisIncludeExhibits] = useState(true);
  const [analysisExhibitIds, setAnalysisExhibitIds] = useState<string[]>([]);
  const [analysisTemplateId, setAnalysisTemplateId] = useState<string>('');
  const [analysisTemplateStudioOpen, setAnalysisTemplateStudioOpen] = useState(false);
  const [analysisTemplateStudioTitle, setAnalysisTemplateStudioTitle] = useState('');
  const [analysisTemplateStudioJson, setAnalysisTemplateStudioJson] = useState('');
  const [analysisTemplateStudioErr, setAnalysisTemplateStudioErr] = useState<string | null>(null);
  const [analysisTemplateStudioSaving, setAnalysisTemplateStudioSaving] = useState(false);
  const [analysisTemplateStudioEditId, setAnalysisTemplateStudioEditId] = useState<string | null>(null);
  const [analysisReportsVersion, setAnalysisReportsVersion] = useState(0);

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

  const effectiveAnalysisTemplateConfig = useMemo(() => {
    const base = selectedAnalysisTemplateConfig ?? {
      version: 1 as const,
      title: 'Credit Analysis Report',
      badgeLine: 'Premium deliverable • Strategy • Negatives • Next steps',
      variant: analysisVariant,
      exhibits: { max: analysisIncludeExhibits ? 10 : 0 },
      negatives: { maxPerBucket: analysisVariant === 'negatives_heavy' ? 40 : 18 },
      minPages: 22,
    };
    return { ...base, engine: analysisEngine, variant: analysisVariant };
  }, [selectedAnalysisTemplateConfig, analysisEngine, analysisVariant, analysisIncludeExhibits]);

  const isPremiumAnalysisTemplate = isPremiumCreditAnalysisEngine(effectiveAnalysisTemplateConfig);

  useEffect(() => {
    if (!analysisTemplates.length) return;
    const premium = analysisTemplates.find((t) => t.id === PREMIUM_CREDIT_ANALYSIS_TEMPLATE_ID || (t.tags ?? []).includes('structured_premium') || (t.tags ?? []).includes('premium_spreads'));
    if (premium && !analysisTemplateId) setAnalysisTemplateId(premium.id);
  }, [analysisTemplates, analysisTemplateId]);

  const analysisReports = useMemo(() => {
    if (!partner) return [];
    return listCreditAnalysisReportsByPartner(partner.id);
  }, [partner?.id, analysisReportsVersion, evidenceVersion]);

  useEffect(() => {
    // Apply template settings (variant + engine) when the saved template changes.
    if (!selectedAnalysisTemplateConfig) {
      setAnalysisEngine('structured_premium');
      return;
    }
    try {
      const v = String(selectedAnalysisTemplateConfig?.variant || '').trim();
      if (v === 'standard' || v === 'negatives_heavy' || v === 'funding_focus') setAnalysisVariant(v as any);
      if (typeof selectedAnalysisTemplateConfig?.exhibits?.max === 'number') {
        setAnalysisIncludeExhibits(selectedAnalysisTemplateConfig.exhibits.max > 0);
      }
      setAnalysisEngine(resolveCreditAnalysisEngine(selectedAnalysisTemplateConfig));
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

  // Contacts on older reports: a refresh recovers them from the stored parse;
  // only a parse that never captured contact data needs the raw file re-parsed.
  const contactRecovery = useMemo(
    () => assessCreditorContactRecovery(selected?.parsed ?? null),
    [selected?.id, selected?.parsed],
  );

  const selectedContactBoard = useMemo(() => {
    if (!selected) return null;
    return buildCollectionContactBoard({ id: selected.id, parsed: selected.parsed ?? null });
  }, [selected?.id, selected?.parsed]);

  const showContactRecoveryBanner = Boolean(
    selected?.parsed &&
      contactRecovery.needsReparse &&
      selectedContactBoard &&
      selectedContactBoard.contactsWithAddress === 0 &&
      selectedContactBoard.collectionsWithAddress === 0,
  );

  const canReparseSelected = Boolean(
    selected &&
      !isLegacyPendingReportBlob(selected.rawBlobRef) &&
      canAccessReportBlob(selected.rawBlobRef),
  );

  useEffect(() => {
    if (!selected?.id || !selected.parsed) return;
    if (!contactRecovery.recoverableFromStoredParse) return;
    persistRefreshedCreditorContactsOnReport({ id: selected.id, parsed: selected.parsed });
    setReportsVersion((v) => v + 1);
  }, [selected?.id, contactRecovery.recoverableFromStoredParse]);

  // Old HTML uploads: if Open file still shows the bottom Creditor Contacts table
  // but Creditors is stuck at ~11, re-read the stored blob automatically (no re-upload).
  const autoRecoverAttemptedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selected?.id || !selected.parsed) return;
    if (selected.fileType !== 'html') return;
    if (!canReparseSelected) return;
    if (!shouldRecoverCreditorContactsFromStoredHtml(selected.parsed)) return;
    if (autoRecoverAttemptedRef.current.has(selected.id)) return;
    if (reparseId) return;

    autoRecoverAttemptedRef.current.add(selected.id);
    let cancelled = false;
    (async () => {
      setReparseId(selected.id);
      setReparseErr(null);
      try {
        const result = await recoverCreditorContactsFromStoredHtml({ record: selected as any });
        if (cancelled) return;
        if (result.ran) {
          upsertReport(result.record);
          setReportSyncNotice(
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
          setReportsVersion((v) => v + 1);
        }
      } catch (e: any) {
        if (!cancelled) {
          // Allow a manual Re-parse retry if auto-recover fails.
          autoRecoverAttemptedRef.current.delete(selected.id);
          setReparseErr(e?.message || 'Could not recover contacts from stored HTML.');
        }
      } finally {
        if (!cancelled) setReparseId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.fileType, canReparseSelected]);

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
      const after = assessCreditorContactRecovery(updated.parsed ?? null);
      setReportSyncNotice(
        after.refreshedWithAddress > 0
          ? { ok: true, message: `Re-parse complete — ${after.refreshedWithAddress} creditor mailing address(es) recovered for letters.` }
          : {
              ok: false,
              message:
                'Re-parse complete, but this export contains no Creditor Contacts addresses. Download the HTML export from IdentityIQ / MyScoreIQ and upload it above — PDF exports often omit the contact table.',
            },
      );
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

        <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-4 md:p-5 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300">1 · Upload reports</div>
              <p className="mt-1 text-sm text-white/65">IdentityIQ / MyScoreIQ HTML preferred — that’s where Creditor Contacts live.</p>
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
        </div>

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
              <div className="rounded-2xl border-2 border-amber-400/45 bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent p-4 md:p-6 shadow-[0_0_40px_rgba(251,191,36,0.12)] space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">2 · Active report file</div>
                    <div className="mt-2 text-xl md:text-2xl font-light text-white truncate" title={selected.filename}>
                      {selected.filename}
                    </div>
                    <p className="mt-1 text-sm text-white/60">
                      Open the original file, re-parse contacts, or remove this upload — this bar is only for the selected report.
                    </p>
                  </div>
                </div>
                <ReportActionsBar report={selected}>
                  {selected.parsed ? (
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      title="View the parsed report overview"
                      onClick={() => setParseOverviewOpen(true)}
                    >
                      Parse overview
                    </button>
                  ) : null}
                  {!isLegacyPendingReportBlob(selected.rawBlobRef) && canAccessReportBlob(selected.rawBlobRef) ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 shadow-[0_0_24px_rgba(251,191,36,0.35)]"
                      title="Open stored report file"
                      onClick={async () => {
                        try {
                          const { openBlobRefInNewTab } = await import('../../lib/openBlobRef');
                          await openBlobRefInNewTab({
                            blobRef: selected.rawBlobRef,
                            mimeType: selected.mimeType || (selected.fileType === 'pdf' ? 'application/pdf' : 'text/html'),
                          });
                        } catch (e: any) {
                          setDeleteErr(e?.message || 'Could not open file.');
                        }
                      }}
                    >
                      Open file
                    </button>
                  ) : null}
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

            {selected?.parsed && showContactRecoveryBanner ? (
              <div className={`${finelyOsCatalogCard('amber')} !p-4 space-y-2`}>
                <div className={FINELY_OS_ENTITY_VALUE}>Creditor mailing addresses missing</div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  We found {contactRecovery.tradelineCount} account(s) on this report but no creditor or collector mailing
                  addresses, so validation and dispute letters cannot autofill the TO block.{' '}
                  {canReparseSelected
                    ? 'Re-parse reads your stored file again with the latest contact extractor — no re-upload needed.'
                    : 'The original file is no longer stored, so upload the HTML export again using the uploader above.'}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    disabled={!canReparseSelected || Boolean(reparseId) || Boolean(deletingId)}
                    onClick={() => void handleReparse(selected as any)}
                    title={
                      canReparseSelected
                        ? 'Re-run parsing from your stored file to recover creditor contacts'
                        : 'Stored file missing — re-upload to re-parse'
                    }
                  >
                    <RefreshCcw size={14} />
                    {reparseId === selected.id ? 'Re-parsing…' : 'Re-parse for contacts'}
                  </button>
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>
                    HTML exports from IdentityIQ / MyScoreIQ include the Creditor Contacts table; most PDF exports do not.
                  </span>
                </div>
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
                      <CreditIntelTabs
                        parsed={selected.parsed}
                        reportId={selected.id}
                        partnerId={partner.id}
                        evidence={evidence as any}
                        availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
                        onOpenEvidenceVault={() => setTab('evidence')}
                        onOpenTasks={() => navigate('/portal/projects')}
                        onReparseRequest={canReparseSelected ? () => void handleReparse(selected as any) : undefined}
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
                    </>
                  ) : null}
                </div>
              ) : selected?.parsed ? (
                <div className="rounded-2xl border-2 border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/12 via-violet-500/5 to-transparent p-4 md:p-6 space-y-6 shadow-[0_0_48px_rgba(232,121,249,0.12)]">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300">3 · Credit Intelligence</div>
                    <p className="mt-1 text-sm text-white/65">
                      Creditors, collections, strategy, education, and simulation for this report — separate from the file actions above.
                    </p>
                  </div>
                  {(selected.parsed.tradelines?.length ?? 0) === 0 ? (
                    <div className={FINELY_OS_NOTICE_WARN}>
                      Partial parse — no tradelines extracted. Try HTML export, re-parse, or upload a fuller report file.
                    </div>
                  ) : null}

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

                  <CreditIntelTabs
                    parsed={selected.parsed}
                    reportId={selected.id}
                    partnerId={partner.id}
                    evidence={evidence as any}
                    availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
                    onOpenEvidenceVault={() => setTab('evidence')}
                    onOpenTasks={() => navigate('/portal/projects')}
                    onReparseRequest={canReparseSelected ? () => void handleReparse(selected as any) : undefined}
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
            <SmartProofUploader
              partner={partner}
              email={partner.profile?.email}
              uploadContext="bureau"
              onUploaded={() => setEvidenceVersion((v) => v + 1)}
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

        {parseOverviewOpen && selected?.parsed ? (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setParseOverviewOpen(false)}
          >
            <div
              className={`relative w-full max-w-4xl max-h-[85vh] overflow-y-auto ${finelyOsCatalogCard('violet')} !p-5 shadow-2xl`}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className={FINELY_OS_ENTITY_LABEL}>Parse overview</div>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setParseOverviewOpen(false)}>
                  Close
                </button>
              </div>
              <ParsedReportOverviewPanel parsed={selected.parsed} filename={selected.filename} />
            </div>
          </div>
        ) : null}

        <PartnerRestoreWorkspaceDock variant="portal" className="mt-6 sticky bottom-3 z-20" />
        <FinelyOsPageFooter />
        </div>
      </EntitlementGate>
    </PageShell>
  );
}

