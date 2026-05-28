import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, FileText, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { deleteReport, listReportsByPartner, upsertReport } from '../../data/reportsRepo';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { ReportUploader } from '../../components/reports/ReportUploader';
import { CreditIntelTabs } from '../../components/creditIntel/CreditIntelTabs';
import { EvidenceUploader } from '../../components/evidence/EvidenceUploader';
import { EvidenceList } from '../../components/evidence/EvidenceList';
import { ParsedReportOverviewPanel } from '../../components/reports/ParsedReportOverviewPanel';
import { ParsedReportDiagnosticsPanel } from '../../components/reports/ParsedReportDiagnosticsPanel';
import { PdfReportFallbackView } from '../../components/reports/PdfReportFallbackView';
import { isAdminEmail } from '../../auth/admin';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { ADMIN_PARTNER_OVERRIDE_KEY } from '../../portal/getOrCreatePartnerForSession';
import { getBlobStore } from '../../storage/getBlobStore';
import { parseCreditReportHtmlEnhanced } from '../../creditReports/parseHtmlReport';
import { detectProviderFromHtml, detectProviderFromText } from '../../creditReports/detectProvider';
import { detectReportDateFromText } from '../../creditReports/parsePdfText';
import { parseCreditReportPdf } from '../../creditReports/parsePdfReport';
import { computeReportIdentityCheck } from '../../creditReports/identityCheck';
import { createDisputeCase } from '../../data/casesRepo';
import { candidateToCaseItem, nowIso } from '../../domain/cases';
import type { DisputeCandidate } from '../../domain/creditReports';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import { generateCreditAnalysisReportPdf, normalizeCreditAnalysisReportTemplateConfig } from '../../reports/generateCreditAnalysisReportPdf';
import { newId } from '../../utils/ids';
import { addAuditEvent } from '../../data/auditRepo';
import { EntitlementGate } from '../../components/billing/EntitlementGate';
import { ENTITLEMENT_KEYS } from '../../billing/entitlements';
import { ActionLink, Button } from '../../components/ui';
import { getCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import {
  createTemplateVaultItem,
  defaultRequiredEntitlementsForCategory,
  listVisibleTemplateVaultItemsForPartner,
  upsertTemplateVaultItem,
} from '../../data/templateVaultRepo';
import type { TemplateVaultItem } from '../../domain/templateVault';

export default function PartnerReportsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = auth.user?.email || '';
  const { partner } = usePartnerSession();

  // Admin accounts should not land on the Partner-facing reports uploader.
  // This prevents accidental creation of a "Partner" record for an admin email.
  if (email && isAdminEmail(email) && !partner) {
    return (
      <PageShell
        badge="Admin"
        title="Credit Reports"
        subtitle="Admins upload reports inside a specific Partner profile. Select a partner, then use the Reports tab."
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/70 text-sm">
            You’re signed in as an admin. To keep data anchored correctly, uploads must be attached to a Partner record.
          </div>
          <Button variant="primary" onClick={() => navigate('/admin/partners')}>
            Open Partner Management
          </Button>
        </div>
      </PageShell>
    );
  }
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
      const store = getBlobStore();
      const blob = await store.get(r.rawBlobRef);
      if (!blob) throw new Error('Stored report file not found.');

      if (r.fileType === 'html') {
        const html = await blob.text();
        const parsed = await parseCreditReportHtmlEnhanced(html);
        const provider = parsed.provider ?? detectProviderFromHtml(html);
        upsertReport({
          ...r,
          provider,
          reportDate: parsed.reportDate,
          parsed,
        });
      } else {
        const file = new File([blob], r.filename || 'report.pdf', {
          type: blob.type || r.mimeType || 'application/pdf',
        });
        const res = await parseCreditReportPdf(file);
        const pdfText = res.pdfText;
        const pdfMeta = { ...(res.pdfMeta as any), ocrUsed: Boolean(res.ocrUsed), ocrEngine: (res.pdfMeta as any)?.ocrEngine };
        const provider = res.provider ?? (pdfText ? detectProviderFromText(pdfText) : 'unknown');
        const reportDate = res.reportDate ?? (pdfText ? detectReportDateFromText(pdfText) : undefined);
        upsertReport({ ...r, provider, reportDate, pdfText, pdfMeta, parsed: res.parsed });
      }

      setReportsVersion((v) => v + 1);
    } catch (e: any) {
      setReparseErr(e?.message || 'Re-parse failed.');
    } finally {
      setReparseId(null);
    }
  };

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
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <ActionLink to="/portal/dashboard" title="Back to Partner Dashboard" icon={<ArrowLeft size={16} />}>
                Partner Dashboard
              </ActionLink>
              <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
                Finely Cred
              </ActionLink>
              {deepLink.returnTo ? (
                <button
                  type="button"
                  onClick={() => navigate(deepLink.returnTo!)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  title="Return to where you started"
                >
                  Return to Letters <ChevronRight size={14} />
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setTab('reports')}
              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === 'reports'
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setTab('evidence')}
              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === 'evidence'
                  ? 'bg-amber-500 text-black border-amber-400'
                  : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              Evidence Vault
            </button>
          </div>

        <ReportUploader
          partnerId={partner.id}
          uploadedBy="partner"
          onCreated={(record) => {
            upsertReport(record);
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

        {tab === 'reports' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="order-2 lg:order-1 lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Your uploads</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-white/40">{reports.length} files</span>
              </div>

              {deleteErr && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
                  {deleteErr}
                </div>
              )}
              {reparseErr && (
                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
                  {reparseErr}
                </div>
              )}

              <div className="mt-5">
                {reports.length === 0 ? (
                  <div className="text-white/50 text-sm">No uploads yet.</div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => (
                    <div
                      key={r.id}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        (selectedReportId ?? reports[0]?.id) === r.id
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
                      }`}
                    >
                      <button type="button" onClick={() => setSelectedReportId(r.id)} className="w-full text-left">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-white">
                              <FileText size={14} className="text-white/60" />
                              <span className="font-semibold truncate">{r.filename}</span>
                            </div>
                            <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                              {r.fileType} • {r.provider} • {new Date(r.receivedAt).toLocaleString()}
                            </div>
                            {Array.isArray((r as any).identityCheck?.faults) && (r as any).identityCheck.faults.length ? (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest">
                                  Identity check • {(r as any).identityCheck.faults.length} flag{(r as any).identityCheck.faults.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <div className="text-right text-[10px] uppercase tracking-widest text-white/40">
                            {r.uploadedBy}
                          </div>
                        </div>
                      </button>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono">report_id: {r.id}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-60 disabled:cursor-not-allowed"
                            title="Re-run parsing from stored raw file"
                            disabled={Boolean(reparseId) || deletingId === r.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleReparse(r);
                            }}
                          >
                            <RefreshCcw size={14} className="text-amber-300" />
                            {reparseId === r.id ? 'Re-parsing…' : 'Re-parse'}
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-60 disabled:cursor-not-allowed"
                            title="Delete report"
                            disabled={deletingId === r.id || Boolean(reparseId)}
                            onClick={async (e) => {
                              e.stopPropagation();
                              setDeleteErr(null);
                              const ok = window.confirm(
                                `Delete this report?\n\n${r.filename}\n\nThis removes it from your uploads list (and deletes the stored file).`,
                              );
                              if (!ok) return;
                              setDeletingId(r.id);
                              try {
                                const store = getBlobStore();
                                try {
                                  await store.delete(r.rawBlobRef);
                                } catch {
                                  // ignore blob delete failures; still remove record
                                }
                                deleteReport(r.id);
                                if (selectedReportId === r.id) setSelectedReportId(null);
                                setReportsVersion((v) => v + 1);
                              } catch (err: any) {
                                setDeleteErr(err?.message || 'Delete failed.');
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                          >
                            <Trash2 size={14} className="text-red-300" />
                            {deletingId === r.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-8">
              {selected?.parsed ? (
                <div className="space-y-6">
                  <ParsedReportOverviewPanel parsed={selected.parsed} filename={selected.filename} />
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
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 backdrop-blur-xl p-6 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase tracking-widest text-amber-200/80">Identity + report match</div>
                          <div className="mt-2 text-white font-semibold">We detected possible mismatches</div>
                          <div className="mt-1 text-white/70 text-sm leading-relaxed">
                            If the report belongs to a different person (or your saved mailing info is incomplete), letters may auto-fill incorrectly.
                            Fix these before generating and mailing dispute packets.
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => navigate('/portal/checklist')}>
                            Open checklist
                          </Button>
                          <Button variant="secondary" onClick={() => navigate('/portal/tasks')}>
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
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Canonical (profile)</div>
                          <div className="mt-3 text-white/75 text-sm font-mono whitespace-pre-wrap break-words space-y-1">
                            <div>name: {identityCheck.canonical?.fullName || '—'}</div>
                            <div>addr: {identityCheck.canonical?.addressLine1 || '—'}</div>
                            <div>csz: {identityCheck.canonical?.cityStateZip || '—'}</div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">From report (extracted)</div>
                          <div className="mt-3 text-white/75 text-sm font-mono whitespace-pre-wrap break-words space-y-1">
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
                              ? 'border-red-500/30 bg-red-500/10 text-red-100/90'
                              : f.severity === 'warn'
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100/90'
                                : 'border-white/10 bg-white/[0.03] text-white/75';
                          return (
                            <div key={`${f.kind}_${idx}`} className={`rounded-xl border p-4 text-sm ${tone}`}>
                              <div className="flex items-center justify-between gap-3">
                                <div className="font-semibold">{f.kind.replace(/_/g, ' ')}</div>
                                <div className="text-[10px] uppercase tracking-widest font-mono">{f.severity}</div>
                              </div>
                              <div className="mt-2">{f.message}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Premium deliverable</div>
                        <div className="mt-2 text-white font-semibold">Credit Analysis Report (20+ pages)</div>
                        <div className="mt-1 text-white/60 text-sm">
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
                            } catch (e: any) {
                              setAnalysisNotice(e?.message || 'Failed to generate report.');
                            } finally {
                              setAnalysisBusy(false);
                            }
                          }}
                          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {analysisBusy ? 'Generating…' : 'Generate PDF'}
                        </button>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Variant</div>
                        <select
                          value={analysisVariant}
                          onChange={(e) => setAnalysisVariant(e.target.value as any)}
                          className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                        >
                          <option value="standard">Standard</option>
                          <option value="negatives_heavy">Negatives-heavy</option>
                          <option value="funding_focus">Funding-focus</option>
                        </select>
                        <div className="mt-2 text-[11px] text-white/45">Controls section density + emphasis.</div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-[10px] uppercase tracking-widest text-white/40">Exhibits</div>
                          <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                            <input
                              type="checkbox"
                              checked={analysisIncludeExhibits}
                              onChange={(e) => setAnalysisIncludeExhibits(e.target.checked)}
                              className="accent-amber-500"
                            />
                            Include
                          </label>
                        </div>
                        <div className="mt-2 text-white/70 text-sm">
                          Selected: <span className="font-mono">{analysisExhibitIds.length}</span>
                        </div>
                        <div className="mt-2 text-[11px] text-white/45">Adds image exhibits in the appendix (screenshots/attachments).</div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Templates (optional)</div>
                        {analysisTemplates.length === 0 ? (
                          <div className="mt-2 text-white/50 text-sm">No saved analysis templates yet.</div>
                        ) : (
                          <select
                            value={selectedAnalysisTemplate?.id ?? ''}
                            onChange={(e) => setAnalysisTemplateId(e.target.value)}
                            className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
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
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
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
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          title="Edit/save a template config (JSON) used by the PDF generator"
                        >
                          Template studio
                        </button>
                      </div>
                    </div>

                    {analysisIncludeExhibits ? (
                      <details className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <summary className="cursor-pointer select-none">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Pick exhibits (images)</div>
                            <div className="text-[10px] uppercase tracking-widest text-amber-300/80">Expand</div>
                          </div>
                        </summary>
                        <div className="mt-3 grid md:grid-cols-2 gap-2">
                          {evidence
                            .filter((e) => String(e.mimeType || '').toLowerCase().startsWith('image/'))
                            .slice(0, 40)
                            .map((ev) => (
                              <label key={ev.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={analysisExhibitIds.includes(ev.id)}
                                  onChange={() =>
                                    setAnalysisExhibitIds((prev) => (prev.includes(ev.id) ? prev.filter((x) => x !== ev.id) : [...prev, ev.id]))
                                  }
                                  className="mt-1"
                                />
                                <div className="min-w-0">
                                  <div className="text-white/80 text-sm truncate">{ev.filename}</div>
                                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                                    {ev.mimeType} • {new Date(ev.createdAt).toLocaleDateString()}
                                  </div>
                                  {ev.caption ? <div className="mt-1 text-white/50 text-xs line-clamp-2">{ev.caption}</div> : null}
                                </div>
                              </label>
                            ))}
                        </div>
                        <div className="mt-2 text-[11px] text-white/40">
                          Tip: keep exhibits tight (3–6). The report generator will include up to 10 image exhibits.
                        </div>
                      </details>
                    ) : null}

                    {analysisNotice ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/70">{analysisNotice}</div>
                    ) : null}
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
                        className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Template studio</div>
                            <div className="mt-2 text-2xl font-light text-white truncate">Credit Analysis Report template (JSON)</div>
                            <div className="mt-1 text-white/60 text-sm">
                              Saved to Templates Vault as an <span className="text-white/80 font-mono">ops</span> template with tag{' '}
                              <span className="text-white/80 font-mono">analysis_report_template</span>.
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                            disabled={analysisTemplateStudioSaving}
                            onClick={() => setAnalysisTemplateStudioOpen(false)}
                          >
                            Close
                          </button>
                        </div>

                        <div className="p-6 space-y-4">
                          {analysisTemplateStudioErr ? (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100/90">
                              {analysisTemplateStudioErr}
                            </div>
                          ) : null}

                          <div className="grid lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-1 space-y-3">
                              <div>
                                <div className="text-[10px] uppercase tracking-widest text-white/40">Template title</div>
                                <input
                                  value={analysisTemplateStudioTitle}
                                  onChange={(e) => setAnalysisTemplateStudioTitle(e.target.value)}
                                  className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                                  placeholder="Credit Analysis Template • Standard"
                                />
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/60 space-y-2">
                                <div className="text-white/80 font-semibold">Tips</div>
                                <div>- Keep <span className="text-white/80 font-mono">version: 1</span>.</div>
                                <div>- Set <span className="text-white/80 font-mono">variant</span> to control density.</div>
                                <div>- Set <span className="text-white/80 font-mono">exhibits.max</span> to 0 to disable exhibits.</div>
                                <div>- Set <span className="text-white/80 font-mono">negatives.maxPerBucket</span> for depth.</div>
                                <div>- Set <span className="text-white/80 font-mono">minPages</span> for premium padding.</div>
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
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60"
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
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60"
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
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 text-[10px] font-black uppercase tracking-widest text-amber-100 transition-all disabled:opacity-60"
                                  >
                                    Update selected
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            <div className="lg:col-span-2">
                              <div className="text-[10px] uppercase tracking-widest text-white/40">Template JSON</div>
                              <textarea
                                value={analysisTemplateStudioJson}
                                onChange={(e) => setAnalysisTemplateStudioJson(e.target.value)}
                                className="mt-2 w-full h-[520px] bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white/80 text-sm font-mono focus:outline-none focus:border-amber-500"
                                spellCheck={false}
                              />
                              <div className="mt-2 text-[11px] text-white/50">
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
                    onOpenTasks={() => navigate('/portal/tasks')}
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
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-white/70 space-y-3">
                    <div className="text-white font-semibold">Parsing data missing</div>
                    <div className="text-white/60 text-sm">
                      This upload doesn’t currently have parsed tradelines attached. Click <span className="text-white/80 font-semibold">Re-parse</span> to generate the overview and tradelines.
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-60"
                      disabled={Boolean(reparseId) || Boolean(deletingId)}
                      onClick={() => void handleReparse(selected as any)}
                      title="Re-run parsing from stored raw file"
                    >
                      <RefreshCcw size={14} className="text-amber-300" /> {reparseId === selected.id ? 'Re-parsing…' : 'Re-parse'}
                    </button>
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-white/60">
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
        </div>
      </EntitlementGate>
    </PageShell>
  );
}

