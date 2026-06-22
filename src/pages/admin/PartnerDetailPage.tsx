import React, { useEffect, useMemo, useRef, useState, Component, type ErrorInfo, type ReactNode, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Layers,
  PenLine,
  ShieldAlert,
  ScrollText,
  Trash2,
  Scale,
  ExternalLink,
  RefreshCcw,
  ListChecks,
  Bell,
  PlayCircle,
  CheckCircle2,
  Clock,
  Send,
  BarChart3,
  User,
} from 'lucide-react';
import { downloadBlob } from '../../utils/download';
import { PageShell } from '../../components/layout/PageShell';
import { EntityDetailShell } from '../../components/layout/EntityDetailShell';
import { JourneyStageAdminControl } from '../../components/journey/JourneyStageAdminControl';
import { KpiCard } from '../../components/ui/KpiCards';
import { PdfReportFallbackView } from '../../components/reports/PdfReportFallbackView';
import { adminDeletePartner, adminGetPartner, adminUpsertPartner, deletePartner, getPartner, upsertPartner } from '../../data/partnersRepo';
import { deleteReport, listReportsByPartner, upsertReport } from '../../data/reportsRepo';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { deleteLetter, listLettersByPartner, upsertLetter } from '../../data/lettersRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { openBlobRefInNewTab } from '../../lib/openBlobRef';
import { isLegacyPendingReportBlob } from '../../lib/legacyPendingReport';
import { bureauFullName, bureauShortCode } from '../../utils/bureaus';
import { ReportUploader } from '../../components/reports/ReportUploader';
import { CreditIntelTabs } from '../../components/creditIntel/CreditIntelTabs';
import { EvidenceUploader } from '../../components/evidence/EvidenceUploader';
import { EvidenceList } from '../../components/evidence/EvidenceList';
import { EvidencePickerModal } from '../../components/evidence/EvidencePickerModal';

function fmtWhen(iso: string) {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
import { ParsedReportOverviewPanel } from '../../components/reports/ParsedReportOverviewPanel';
import { ParsedReportDiagnosticsPanel } from '../../components/reports/ParsedReportDiagnosticsPanel';
import type { Bureau, DisputeCandidate } from '../../domain/creditReports';
import type { LetterRecord } from '../../domain/letters';
import { deriveDisputeCandidates } from '../../creditReports/disputeCandidates';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { getDisputeReasons, upsertDisputeReasons } from '../../data/disputeReasonsRepo';
import type { DisputeReasonsRecord } from '../../domain/disputeReasons';
import { computeDisputeReasonsId } from '../../domain/disputeReasons';
import { buildFactualDisputeSuggestions } from '../../lib/disputeLetterBuilder';
import { parseCreditReportHtmlEnhanced } from '../../creditReports/parseHtmlReport';
import { detectProviderFromHtml, detectProviderFromText } from '../../creditReports/detectProvider';
import { detectReportDateFromText } from '../../creditReports/parsePdfText';
import { parseCreditReportPdf } from '../../creditReports/parsePdfReport';
import { generateCreditAnalysisReportPdf } from '../../reports/generateCreditAnalysisReportPdf';
import { downloadInlineDisputeLetterPdf } from '../../letters/generateDisputePdfInline';
import { computePartnerOverallScore } from '../../utils/partnerOverallScore';
import { addAuditEvent, listAuditEventsByPartner } from '../../data/auditRepo';
import { createDisputeCase, listCasesByPartner, addRoundToCase, upsertCase } from '../../data/casesRepo';
import { candidateToCaseItem, addDaysIso, nowIso } from '../../domain/cases';
import { createTask, listTasksByPartner, setTaskStatus, upsertTask } from '../../data/tasksRepo';
import { checkDisputeLetterEvidenceGate } from '../../lib/evidenceGates';
import { checkIdentityVaultGate } from '../../lib/documentVaultGates';
import { onDisputeLetterMailed } from '../../lib/disputeRoundEngine';
import { createProject, listProjectsByPartner } from '../../data/projectsRepo';
import { addThreadMessage, getOrCreateThreadBySubject } from '../../data/supportRepo';
import { listPartnerNotesByPartner, createPartnerNote, deletePartnerNote, upsertPartnerNote } from '../../data/partnerNotesRepo';
import { seedLegacyPartnerNotes } from '../../data/legacyPartnerNotesImport';
import { legacyNoteEntriesForPartner, legacyNotesExternalId } from '../../lib/legacyPartnerNotesHydrate';
import { pullWorkflowSnapshotFromSupabase } from '../../data/workflowSupabaseSync';
import { LegacyPendingReportNotice } from '../../components/reports/LegacyPendingReportNotice';
import { listDebtByPartner } from '../../data/debtRepo';
import { newId } from '../../utils/ids';
import { listNotifications, markAllRead, markNotificationRead, unreadCount } from '../../data/notificationsRepo';
import { getWorkboardSettings, isFeatureEnabled } from '../../data/settingsRepo';
import { MailLetterModal } from '../../components/letters/MailLetterModal';
import { LettersCommandCenter } from '../../components/letters/LettersCommandCenter';
import { SavedLetterCard } from '../../components/letters/SavedLetterCard';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { canDeleteLetters, getMembershipByUserAndTenant } from '../../data/tenantsRepo';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { PartnerRoute } from '../../domain/partners';
import { listCustomFieldDefinitionsByScope } from '../../data/customFieldsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { getFieldLayout } from '../../data/fieldLayoutsRepo';
import { countPartnerEmptyFieldSections } from '../../features/partner/PartnerCollapsibleFieldLayout';
import { PartnerOverviewTab } from '../../features/partner/PartnerOverviewTab';
import { PartnerProfileTab } from '../../features/partner/PartnerProfileTab';
import { listEntitlementsByPartner } from '../../data/billingRepo';
import { ENTITLEMENT_KEYS, type EntitlementKey, ensurePartnerEntitlements } from '../../billing/entitlements';
import { TASK_PROGRESS_STAGES, WorkBoardShell, WorkCalendarView, WorkKanbanBoard, WorkListView, type WorkBoardItem } from '../../components/workboard';
import type { WorkStageDefinition } from '../../domain/settings';
import type { TaskStatus } from '../../domain/tasks';
import { AdminPartnerAccessPanel } from '../../components/admin/AdminPartnerAccessPanel';
import { PartnerIntakeLinkPanel } from '../../components/admin/PartnerIntakeLinkPanel';
import { PartnerCreditRestoreHud } from '../../features/partner/PartnerCreditRestoreHud';
import { LegacyApplicationStatusBanner } from '../../components/admin/LegacyApplicationStatusBanner';
import { PartnerCreditRestoreMiniRail } from '../../features/partner/PartnerCreditRestoreMiniRail';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { workflowIdForPartner } from '../../config/roleWorkflows';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { PartnerCompactGrid } from '../../features/partner/PartnerCompactGrid';
import { PartnerBureauResourcesPanel } from '../../components/admin/PartnerBureauResourcesPanel';
import {
  FINELY_OS_BOARD_SHELL,
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_ACTION,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_DANGER_PANEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_BANNER,
  FINELY_OS_ACTIVE_CHIP,
  finelyOsEntityKpi,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { VoiceToTaskButton } from '../../features/work/components/VoiceToTaskButton';

type TabKey = 'overview' | 'profile' | 'reports' | 'analysis' | 'evidence' | 'letters' | 'tasks' | 'notes' | 'debt';

function generateDisputeLetter(args: { partnerName: string; candidate: DisputeCandidate }) {
  const { partnerName, candidate } = args;
  const today = new Date().toLocaleDateString();
  return `DATE: ${today}

TO WHOM IT MAY CONCERN,

I am writing to dispute inaccurate and/or unverified information appearing on my credit file with ${bureauFullName(candidate.bureau)}.

ACCOUNT / CREDITOR: ${candidate.account}
ISSUE TYPE: ${candidate.type}
REQUEST: ${candidate.status}
LEGAL BASIS: ${candidate.code}

Please investigate this matter and provide written results of your investigation. If you cannot verify the information with competent evidence, the item must be deleted or corrected.

Sincerely,
${partnerName}
`;
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

type LetterTone = 'formal' | 'neutral' | 'conversational';
type LetterRound = 'Round 1' | 'Round 2' | 'Round 3';

function buildLetterBodyText(args: {
  partnerName: string;
  candidate: DisputeCandidate;
  tone: LetterTone;
  round: LetterRound;
}) {
  const { partnerName, candidate, tone, round } = args;
  const today = new Date().toLocaleDateString();
  const header = `DATE: ${today}\nROUND: ${round}\nBUREAU: ${bureauFullName(candidate.bureau)}\n\n`;

  const baseFacts =
    `ACCOUNT / CREDITOR: ${candidate.account}\n` +
    `ISSUE TYPE: ${candidate.type}\n` +
    `REQUEST: ${candidate.status}\n` +
    `LEGAL BASIS: ${candidate.code}\n\n`;

  if (tone === 'formal') {
    return (
      header +
      `TO WHOM IT MAY CONCERN,\n\n` +
      `I am writing to dispute inaccurate and/or unverified information appearing on my credit file.\n\n` +
      baseFacts +
      `Please investigate this matter and provide written results of your investigation. If you cannot verify the information with competent evidence, the item must be deleted or corrected.\n\n` +
      `Sincerely,\n${partnerName}\n`
    );
  }
  if (tone === 'conversational') {
    return (
      header +
      `Hello,\n\n` +
      `I’m reaching out because this item still looks inaccurate or incomplete on my credit file, and I’m requesting a reinvestigation.\n\n` +
      baseFacts +
      `Please send me the results in writing, and remove or correct the item if it can’t be verified.\n\n` +
      `Thank you,\n${partnerName}\n`
    );
  }
  return (
    header +
    `Hello,\n\n` +
    `I’m following up to dispute inaccurate and/or unverified information on my credit file.\n\n` +
    baseFacts +
    `Please reinvestigate and provide the results in writing. If verification cannot be produced, the item must be deleted or corrected.\n\n` +
    `Regards,\n${partnerName}\n`
  );
}

function buildLetterBodyHtml(args: {
  partnerName: string;
  candidate: DisputeCandidate;
  tone: LetterTone;
  round: LetterRound;
  evidenceNames: string[];
}) {
  const text = buildLetterBodyText(args);
  const evidence = args.evidenceNames.length
    ? `<h3 style="margin:16px 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;">Attached evidence</h3>
       <ul style="margin:0;padding-left:18px;color:#e5e7eb;">${args.evidenceNames.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
    : '';
  return `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;line-height:1.55;color:#e5e7eb;">
      <pre style="white-space:pre-wrap;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin:0;color:#e5e7eb;">${escapeHtml(text)}</pre>
      ${evidence}
      <p style="margin-top:14px;color:#9ca3af;font-size:12px;">
        Generated for internal dispute workflow. Not legal advice. Verify facts before mailing or submission.
      </p>
    </div>
  `;
}

async function downloadPdfWithEvidence(args: {
  filename: string;
  letterText: string;
  evidence: { filename: string; blobRef: string; mimeType: string }[];
}) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 54;
  const fontSize = 11;
  const lineHeight = 14;
  const pageWidth = 612;
  const pageHeight = 792;

  const wrap = (text: string, maxWidth: number) => {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    for (const p of paragraphs) {
      if (!p.trim()) {
        lines.push('');
        continue;
      }
      const words = p.split(/\s+/);
      let line = '';
      for (const w of words) {
        const candidate = line ? `${line} ${w}` : w;
        const width = font.widthOfTextAtSize(candidate, fontSize);
        if (width <= maxWidth) {
          line = candidate;
        } else {
          if (line) lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  };

  // Page 1: Letter body
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  page.drawText('FINELY CRED — DISPUTE LETTER', {
    x: margin,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.91, 0.91, 0.91),
  });
  y -= 24;

  const maxWidth = pageWidth - margin * 2;
  const lines = wrap(args.letterText, maxWidth);
  for (const line of lines) {
    if (y < margin) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.88, 0.88, 0.88) });
    y -= lineHeight;
  }

  // Evidence pages
  if (args.evidence.length) {
    const store = getBlobStore();
    for (const ev of args.evidence) {
      const blob = await store.get(ev.blobRef);
      if (!blob) continue;
      if (!blob.type.startsWith('image/')) continue;

      const bytes = new Uint8Array(await blob.arrayBuffer());
      const img =
        blob.type.includes('png') ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

      const evPage = pdfDoc.addPage([pageWidth, pageHeight]);
      evPage.drawText(`EVIDENCE: ${ev.filename}`, {
        x: margin,
        y: pageHeight - margin,
        size: 11,
        font: fontBold,
        color: rgb(0.88, 0.88, 0.88),
      });

      const availableW = pageWidth - margin * 2;
      const availableH = pageHeight - margin * 2 - 24;
      const scale = Math.min(availableW / img.width, availableH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      evPage.drawImage(img, {
        x: margin + (availableW - w) / 2,
        y: margin,
        width: w,
        height: h,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  // Ensure BlobPart uses an ArrayBuffer-backed view (avoid SharedArrayBuffer typing edge)
  const copy = Uint8Array.from(pdfBytes);
  const blob = new Blob([copy], { type: 'application/pdf' });
  downloadBlob({ blob, filename: args.filename });
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Intentionally silent in production; rely on browser console + error UI.
    // (When wired, this can be connected to a real error tracker.)
    void errorInfo;
  }
  render() {
    if (this.state.hasError) {
      return (
        <PageShell badge="Admin" title="Error loading partner" subtitle={`Render error: ${this.state.error?.message || 'Unknown error'}`}>
          <button onClick={() => window.location.href = '/admin/partners'} className="px-4 py-2 rounded-xl bg-amber-500 text-black">
            Back to Partners
          </button>
        </PageShell>
      );
    }
    return this.props.children;
  }
}

function PartnerDetailPageInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [partnerVersion, setPartnerVersion] = useState(0);
  const [tab, setTab] = useState<TabKey>('overview');
  const [highlightLetterId, setHighlightLetterId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [deleteReportErr, setDeleteReportErr] = useState<string | null>(null);
  const [reparseReportId, setReparseReportId] = useState<string | null>(null);
  const [reparseReportErr, setReparseReportErr] = useState<string | null>(null);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [focusedCandidateId, setFocusedCandidateId] = useState<string | null>(null);
  const [bureauFilter, setBureauFilter] = useState<Bureau | 'ALL'>('ALL');
  const [letterTone, setLetterTone] = useState<LetterTone>('formal');
  const [letterRound, setLetterRound] = useState<LetterRound>('Round 1');
  const [evidenceByCandidateId, setEvidenceByCandidateId] = useState<Record<string, string>>({});
  const [evidencePicker, setEvidencePicker] = useState<null | { candidateId?: string }>(null);
  const [reasonsVersion, setReasonsVersion] = useState(0);
  const [pdfBusyBureau, setPdfBusyBureau] = useState<Bureau | null>(null);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailLetter, setMailLetter] = useState<LetterRecord | null>(null);
  const [mailGateErr, setMailGateErr] = useState<string | null>(null);
  const [docOpenErr, setDocOpenErr] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesVisibleToPartner, setNotesVisibleToPartner] = useState(false);
  const [notesPinned, setNotesPinned] = useState(false);
  const [notesVersion, setNotesVersion] = useState(0);
  const [tasksDraftTitle, setTasksDraftTitle] = useState('');
  const [tasksDraftKind, setTasksDraftKind] = useState<'mail_letter' | 'follow_up' | 'upload_document' | 'review_results' | 'general'>('general');
  const [tasksDraftDueAt, setTasksDraftDueAt] = useState('');
  const [tasksDraftNotes, setTasksDraftNotes] = useState('');
  const [tasksView, setTasksView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [tasksDraftProjectId, setTasksDraftProjectId] = useState<string>('auto');
  const [profileDraft, setProfileDraft] = useState<{
    fullName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
  }>({ fullName: '', email: '', phone: '', address1: '', address2: '', city: '', state: '', postalCode: '' });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [financialDraft, setFinancialDraft] = useState<{
    annualIncome: string;
    monthlyDebtPayments: string;
    monthlyHousing: string;
  }>({ annualIncome: '', monthlyDebtPayments: '', monthlyHousing: '' });
  const [denefitsContractUrlDraft, setDenefitsContractUrlDraft] = useState('');
  const [denefitsContractLabelDraft, setDenefitsContractLabelDraft] = useState('');
  const [customFieldDraft, setCustomFieldDraft] = useState<Record<string, any>>({});
  const [reportsRefreshKey, setReportsRefreshKey] = useState(0);
  const setTabAndUrl = useCallback(
    (next: TabKey) => {
      setTab(next);
      if (!id) return;
      const sp = new URLSearchParams(location.search || '');
      sp.set('tab', next);
      navigate({ pathname: `/admin/partners/${id}`, search: `?${sp.toString()}` }, { replace: true });
    },
    [id, location.search, navigate],
  );
  const generatedLettersRef = useRef<HTMLDivElement | null>(null);
  const analysisReportsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onStore = () => setNotesVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const [partner, setPartner] = useState<any>(null);

  useEffect(() => {
    if (!id) { setPartner(null); return; }
    adminGetPartner(id).then((p) => {
      if (!p || !p.profile || typeof p.profile.fullName !== 'string') setPartner(null);
      else setPartner(p);
    });
  }, [id, partnerVersion]);

  useEffect(() => {
    if (!partner?.id) return;
    let cancelled = false;
    void (async () => {
      await pullWorkflowSnapshotFromSupabase({ partnerId: partner.id });
      if (cancelled) return;
      const noteEntries = legacyNoteEntriesForPartner(partner);
      if (noteEntries.length || partner.notes?.trim()) {
        seedLegacyPartnerNotes({
          partnerId: partner.id,
          notesText: partner.notes,
          noteEntries,
          externalId: legacyNotesExternalId(partner),
          forceRefresh: noteEntries.length > 0,
        });
      }
      setNotesVersion((v) => v + 1);
      setReportsRefreshKey((v) => v + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [partner?.id, partner?.notes, partner?.importExternalId]);

  const profileRouteKey = useMemo<PartnerRoute>(() => (partner?.primaryRoute || 'personal_restore') as PartnerRoute, [partner?.primaryRoute]);
  const profilePersonal = useMemo(() => ((partner?.routes?.[profileRouteKey] as any)?.personal as any) ?? {}, [partner?.id, profileRouteKey]);

  useEffect(() => {
    if (!partner) return;
    setProfileDraft({
      fullName: partner.profile.fullName || '',
      email: partner.profile.email || '',
      phone: partner.profile.phone || '',
      address1: String(profilePersonal.address1 || ''),
      address2: String(profilePersonal.address2 || ''),
      city: String(profilePersonal.city || ''),
      state: String(profilePersonal.state || ''),
      postalCode: String(profilePersonal.postalCode || ''),
    });
  }, [partner?.id, partner?.updatedAt, profilePersonal?.address1, profilePersonal?.postalCode]);

  const [access, setAccess] = useState<{ ok: boolean; reason: string | null }>({ ok: false, reason: 'Loading...' });

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u || !id) { setAccess({ ok: false, reason: 'Not signed in.' }); return; }
    if (!partner) { setAccess({ ok: false, reason: 'Partner not found.' }); return; }
    if ((partner as any).tenantId && (partner as any).tenantId !== tenantId) { setAccess({ ok: false, reason: 'Wrong tenant.' }); return; }
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId })
      .then((allowed) => {
        if (!allowed.has(partner.id)) setAccess({ ok: false, reason: 'Not assigned.' });
        else setAccess({ ok: true, reason: null });
      });
  }, [auth.user, id, partner]);

  const canHardDeleteLetters = useMemo(() => {
    const u = auth.user;
    if (!u?.id) return false;
    const email =
      u.email ||
      ((u as any)?.user_metadata?.email as string | undefined) ||
      ((u as any)?.identities?.[0]?.identity_data?.email as string | undefined) ||
      '';
    if (email && isAdminEmail(email)) return true;
    const tenantId = getActiveTenantId();
    const m = getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    return canDeleteLetters(m);
  }, [auth.user, notesVersion]);

  // Memoize the report upload callback to prevent infinite re-renders
  const handleReportCreated = useCallback((r: any) => {
    upsertReport(r);
    setSelectedReportId(r.id);
    // Trigger refresh of reports list without cascading to notesVersion
    setReportsRefreshKey((v) => v + 1);
  }, []);

  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner, reportsRefreshKey]);
  const selectedReport = useMemo(() => {
    if (!reports.length) return null;
    const idToUse = selectedReportId ?? reports[0].id;
    return reports.find((r) => r.id === idToUse) ?? reports[0];
  }, [reports, selectedReportId]);

  const evidence = useMemo(() => (partner ? listEvidenceByPartner(partner.id) : []), [partner, notesVersion]);
  const letters = useMemo(() => (partner ? listLettersByPartner(partner.id) : []), [partner, notesVersion]);
  const analysisReports = useMemo(() => {
    if (!partner) return [];
    return evidence
      .filter((e: any) => Array.isArray(e?.tags) && e.tags.includes('analysis_report'))
      .filter((e: any) => String(e?.mimeType || '').toLowerCase() === 'application/pdf')
      .slice()
      .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [partner, evidence]);
  const manualNotes = useMemo(() => (partner ? listPartnerNotesByPartner(partner.id) : []), [partner, notesVersion]);
  const sortedManualNotes = useMemo(
    () =>
      manualNotes
        .slice()
        .sort(
          (a, b) =>
            Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt.localeCompare(a.createdAt),
        ),
    [manualNotes],
  );
  const audit = useMemo(() => (partner ? listAuditEventsByPartner(partner.id) : []), [partner, notesVersion]);
  const partnerTasks = useMemo(() => (partner ? listTasksByPartner(partner.id) : []), [partner, notesVersion]);
  const partnerProjects = useMemo(() => (partner ? listProjectsByPartner(partner.id) : []), [partner, notesVersion]);
  const projectTitleById = useMemo(() => new Map(partnerProjects.map((p) => [p.id, p.title])), [partnerProjects]);
  const tenantId = useMemo(() => getActiveTenantId(), [notesVersion]);
  const customDefs = useMemo<CustomFieldDefinition[]>(() => listCustomFieldDefinitionsByScope('partners', tenantId), [notesVersion, tenantId]);
  const customValues = useMemo(() => (partner ? getCustomFieldValues('partners', partner.id, tenantId) : null), [partner, notesVersion, tenantId]);
  const partnerFieldLayout = useMemo(() => getFieldLayout({ tenantId, scope: 'partners' }), [notesVersion, tenantId]);

  useEffect(() => {
    setCustomFieldDraft(customValues?.values ?? {});
  }, [partner?.id, notesVersion]);

  const emptyCustomFieldSections = useMemo(
    () => countPartnerEmptyFieldSections({ layout: partnerFieldLayout, definitions: customDefs, values: customFieldDraft || {} }),
    [partnerFieldLayout, customDefs, customFieldDraft],
  );

  const mailingSummary = useMemo(() => {
    const parts = [
      profilePersonal.address1,
      profilePersonal.city,
      profilePersonal.state,
      profilePersonal.postalCode,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  }, [profilePersonal]);

  const updateCustomField = (key: string, value: any, persist: boolean) => {
    if (!partner) return;
    setCustomFieldDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (persist) upsertCustomFieldValues('partners', partner.id, next, tenantId);
      return next;
    });
  };

  const partnerNotifs = useMemo(
    () => (partner ? listNotifications({ partnerId: partner.id, audience: 'partner', limit: 120 }) : []),
    [partner, notesVersion],
  );
  const partnerUnreadNotifs = useMemo(
    () => (partner ? unreadCount({ partnerId: partner.id, audience: 'partner' }) : 0),
    [partner, notesVersion],
  );
  const partnerCases = useMemo(() => (partner ? listCasesByPartner(partner.id) : []), [partner, notesVersion]);
  const debtCases = useMemo(() => (partner ? listDebtByPartner(partner.id) : []), [partner]);
  const openPartnerTasks = useMemo(
    () => partnerTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress'),
    [partnerTasks],
  );
  const donePartnerTasks = useMemo(() => partnerTasks.filter((t) => t.status === 'completed'), [partnerTasks]);
  const openPartnerCases = useMemo(() => partnerCases.filter((c) => c.status === 'open'), [partnerCases]);

  const adminWorkflowId = useMemo(() => workflowIdForPartner(partner?.lane), [partner?.lane]);
  const adminWorkflowProgress = useMemo(
    () =>
      computeRoleWorkflowProgress(adminWorkflowId, {
        partner,
        reportsCount: reports.length,
        evidenceCount: evidence.length,
        lettersCount: letters.length,
        casesCount: partnerCases.length,
        tasksCount: partnerTasks.length,
        projectsCount: partnerProjects.length,
      }),
    [
      adminWorkflowId,
      partner,
      reports.length,
      evidence.length,
      letters.length,
      partnerCases.length,
      partnerTasks.length,
      partnerProjects.length,
    ],
  );

  const taskStageDefs = useMemo(() => getWorkboardSettings().taskStages, [notesVersion]);
  const taskStageLabelById = useMemo(() => new Map(taskStageDefs.map((s) => [s.id, s.label])), [taskStageDefs]);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<string | 'all'>('all');
  const taskItems: WorkBoardItem[] = useMemo(
    () =>
      partnerTasks
        .filter((t) => (taskCategoryFilter === 'all' ? true : String(t.stage ?? 'intake') === taskCategoryFilter))
        .map((t) => {
        const proj = t.projectId ? projectTitleById.get(t.projectId) : null;
        const cat = String(t.stage ?? 'intake');
        return {
          id: t.id,
          title: t.title,
          subtitle: [proj ? `Project: ${proj}` : null, taskStageLabelById.get(cat) ?? cat, t.kind].filter(Boolean).join(' • '),
          stage: String(t.status ?? 'pending'),
          status: t.status,
          dueAt: t.dueAt,
          updatedAt: t.updatedAt,
          tags: t.tags,
        };
      }),
    [partnerTasks, projectTitleById, taskCategoryFilter, taskStageLabelById],
  );

  const overallScore = useMemo(() => {
    if (!partner) return null;
    return computePartnerOverallScore({
      partner,
      counts: {
        reports: reports.length,
        evidence: evidence.length,
        tasksOpen: openPartnerTasks.length,
        tasksDone: donePartnerTasks.length,
        casesOpen: openPartnerCases.length + debtCases.filter((d) => d.status === 'open' || d.status === 'in_review').length,
        lettersGenerated: letters.length,
      },
    });
  }, [
    partner?.id,
    reports.length,
    evidence.length,
    letters.length,
    openPartnerTasks.length,
    donePartnerTasks.length,
    openPartnerCases.length,
    debtCases.length,
  ]);
  const entitlements = useMemo(() => (partner ? listEntitlementsByPartner(partner.id) : []), [partner, notesVersion]);
  const allPortalEntitlementKeys = useMemo(() => Object.values(ENTITLEMENT_KEYS) as EntitlementKey[], []);
  const activeEntitlementKeys = useMemo(() => {
    const s = new Set<string>();
    for (const e of entitlements) {
      if (e.status !== 'active') continue;
      s.add(e.key);
    }
    return s;
  }, [entitlements]);
  const missingEntitlementKeys = useMemo(
    () => allPortalEntitlementKeys.filter((k) => !activeEntitlementKeys.has(k)),
    [allPortalEntitlementKeys, activeEntitlementKeys],
  );

  const candidates = useMemo<DisputeCandidate[]>(() => {
    const parsed = selectedReport?.parsed;
    if (!parsed) return [];
    return deriveDisputeCandidates(parsed, selectedReport?.id);
  }, [selectedReport]);

  const filteredCandidates = useMemo(() => {
    if (bureauFilter === 'ALL') return candidates;
    return candidates.filter((c) => c.bureau === bureauFilter);
  }, [bureauFilter, candidates]);

  const selectedCandidates = useMemo(() => {
    const set = new Set(selectedCandidateIds);
    return candidates.filter((c) => set.has(c.id));
  }, [candidates, selectedCandidateIds]);

  const selectedCandidate = useMemo(() => {
    if (!candidates.length) return null;
    const idToUse =
      focusedCandidateId ??
      (selectedCandidateIds.length ? selectedCandidateIds[0] : null) ??
      candidates[0].id;
    return candidates.find((c) => c.id === idToUse) ?? candidates[0];
  }, [candidates, focusedCandidateId, selectedCandidateIds]);

  const evidencePickerCandidate = useMemo(() => {
    const cid = evidencePicker?.candidateId;
    if (!cid) return null;
    return candidates.find((c) => c.id === cid) ?? null;
  }, [candidates, evidencePicker?.candidateId]);

  useEffect(() => {
    // Ensure focus stays valid when list changes (e.g., switching reports).
    if (!candidates.length) {
      if (focusedCandidateId) setFocusedCandidateId(null);
      if (selectedCandidateIds.length) setSelectedCandidateIds([]);
      return;
    }
    // Check if current focusedCandidateId already exists in candidates
    if (focusedCandidateId && candidates.some((c) => c.id === focusedCandidateId)) {
      return;
    }
    // Only update if we have a valid fallback
    const nextFocus = selectedCandidateIds.find((cid) => candidates.some((c) => c.id === cid)) ?? candidates[0]?.id;
    if (nextFocus && nextFocus !== focusedCandidateId) {
      setFocusedCandidateId(nextFocus);
    }
  }, [candidates.length, focusedCandidateId, selectedCandidateIds]);

  useEffect(() => {
    if (!highlightLetterId) return;
    const t = window.setTimeout(() => setHighlightLetterId(null), 9000);
    return () => window.clearTimeout(t);
  }, [highlightLetterId]);

  const openSavedLetterVault = (args?: { letterId?: string }) => {
    setTabAndUrl('letters');
    if (args?.letterId) setHighlightLetterId(args.letterId);
    setNotesVersion((v) => v + 1);
    window.setTimeout(() => {
      generatedLettersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      const has = prev.includes(candidateId);
      const next = has ? prev.filter((x) => x !== candidateId) : [...prev, candidateId];
      return next;
    });
  };

  const partnerName = partner?.profile.fullName ?? '';
  const actorEmail = auth.user?.email || undefined;

  const openStoredDocument = async (args: { blobRef: string; mimeType?: string }) => {
    setDocOpenErr(null);
    const result = await openBlobRefInNewTab({
      blobRef: args.blobRef,
      mimeType: args.mimeType || 'application/pdf',
    });
    if (!result.ok) setDocOpenErr(result.message);
  };

  // Generate the (free) Credit Analysis Report for a given uploaded report.
  // Shared by the Reports tab and the dedicated Analysis Report tab.
  const runGenerateAnalysis = async (report: any) => {
    if (!partner || !report?.parsed) {
      setAnalysisNotice('Pick an uploaded, parsed credit report first.');
      return;
    }
    setAnalysisNotice(null);
    setAnalysisBusy(true);
    try {
      const candidates = deriveDisputeCandidates(report.parsed, report.id);
      const { blob, filename, pages } = await generateCreditAnalysisReportPdf({
        partner: partner as any,
        report: report as any,
        candidates,
      });
      const store = getBlobStore();
      const put = await store.put(blob, { partnerId: partner.id, reportId: report.id, kind: 'analysis_report' });
      const item = {
        id: newId('evidence'),
        partnerId: partner.id,
        reportId: report.id,
        type: 'upload' as const,
        source: 'upload' as const,
        caption: `Credit Analysis Report • ${report.filename}`,
        tags: ['analysis_report'],
        filename,
        mimeType: 'application/pdf',
        sizeBytes: blob.size,
        blobRef: put.ref,
        createdAt: new Date().toISOString(),
      };
      upsertEvidence(item as any);
      setNotesVersion((v) => v + 1);
      addAuditEvent({
        partnerId: partner.id,
        actorType: 'admin',
        actorEmail: actorEmail || undefined,
        action: 'report.credit_analysis.generated',
        entityType: 'evidence',
        entityId: item.id,
        meta: { pages, filename, reportId: report.id },
      });
      setAnalysisNotice(`Generated and saved (${pages} pages). It's listed below and in the partner's Documents/Evidence.`);
    } catch (e: any) {
      setAnalysisNotice(e?.message || 'Failed to generate report.');
    } finally {
      setAnalysisBusy(false);
    }
  };

  const latestScoresRows = useMemo(() => {
    const scores = reports[0]?.parsed?.scores ?? [];
    if (!scores.length) return [];
    const byModel = new Map<string, Partial<Record<Bureau, number>>>();
    for (const s of scores) {
      const cur = byModel.get(s.model) ?? {};
      if (s.bureau) {
        const prev = cur[s.bureau];
        cur[s.bureau] = prev == null ? s.value : Math.max(prev, s.value);
      }
      byModel.set(s.model, cur);
    }
    return Array.from(byModel.entries()).map(([model, by]) => ({
      model,
      exp: by.EXP,
      eqf: by.EQF,
      tuc: by.TUC,
    }));
  }, [reports]);

  const dti = useMemo(() => {
    const annual = Number(financialDraft.annualIncome);
    const debt = Number(financialDraft.monthlyDebtPayments);
    const housing = Number(financialDraft.monthlyHousing);
    const monthlyIncome = Number.isFinite(annual) && annual > 0 ? annual / 12 : null;
    const monthlyObligations =
      (Number.isFinite(debt) && debt > 0 ? debt : 0) + (Number.isFinite(housing) && housing > 0 ? housing : 0);
    if (!monthlyIncome) return null;
    const pct = (monthlyObligations / monthlyIncome) * 100;
    return Number.isFinite(pct) ? Math.round(pct * 10) / 10 : null;
  }, [financialDraft.annualIncome, financialDraft.monthlyDebtPayments, financialDraft.monthlyHousing]);

  // Support deep-linking into a specific tab from dashboards (e.g. ?tab=reports).
  useEffect(() => {
    if (!partner) return;
    const sp = new URLSearchParams(location.search || '');
    const t = (sp.get('tab') || '').toLowerCase();
    const next: TabKey | null =
      t === 'overview'
        ? 'overview'
        : t === 'profile'
          ? 'profile'
          : t === 'reports'
          ? 'reports'
          : t === 'analysis'
            ? 'analysis'
            : t === 'evidence'
              ? 'evidence'
              : t === 'disputes'
                ? 'letters'
                : t === 'letters'
                  ? 'letters'
                  : t === 'tasks'
                    ? 'tasks'
                    : t === 'notes'
                      ? 'notes'
                      : t === 'debt'
                        ? 'debt'
                        : null;
    if (next && next !== tab) setTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, partner?.id]);

  useEffect(() => {
    if (!partner) return;
    setFinancialDraft({
      annualIncome: partner.financial?.annualIncome != null ? String(partner.financial.annualIncome) : '',
      monthlyDebtPayments: partner.financial?.monthlyDebtPayments != null ? String(partner.financial.monthlyDebtPayments) : '',
      monthlyHousing: partner.financial?.monthlyHousing != null ? String(partner.financial.monthlyHousing) : '',
    });
  }, [partner?.id]);

  useEffect(() => {
    if (!partner) return;
    setDenefitsContractUrlDraft(partner.denefits?.contractUrl ?? '');
    setDenefitsContractLabelDraft(partner.denefits?.label ?? '');
  }, [partner?.id, partnerVersion]);

  // Best-effort evidence matching (supports both new structured metadata and legacy caption-based screenshots).
  const imageEvidence = useMemo(() => evidence.filter((e) => e.mimeType.startsWith('image/')), [evidence]);

  const bestEvidenceIdForCandidate = (c: DisputeCandidate): string | null => {
    const type = (c.type || '').toLowerCase();
    const wantSectionKey =
      type.includes('public record') ? 'public_records'
      : type.includes('collection') ? 'collections'
      : type.includes('inquiry') ? 'inquiries'
      : null;

    const accountLower = c.account.toLowerCase().trim();
    const matches = imageEvidence.filter((e) => {
      if (wantSectionKey) {
        const sectionMatch =
          (e.sectionKey || '').toLowerCase() === wantSectionKey ||
          (wantSectionKey === 'collections' && (e.sectionKey || '').toLowerCase() === 'collections_tradeline');
        const creditorMatch = accountLower && (e.creditorName || '').toLowerCase().trim() === accountLower;
        if (sectionMatch && creditorMatch) return true;
        if (sectionMatch && !accountLower) return true;
        if (sectionMatch) return true;
        const cap = (e.caption || '').toLowerCase();
        if (cap.includes('section screenshot') && cap.includes(wantSectionKey.replace('_', ' '))) return true;
        if (cap.includes('section screenshot') && cap.includes('public') && wantSectionKey === 'public_records') return true;
        if (cap.includes('section screenshot') && cap.includes('collection') && wantSectionKey === 'collections') return true;
        if (cap.includes('section screenshot') && cap.includes('inquir') && wantSectionKey === 'inquiries') return true;
        return false;
      }

      const creditor = (e.creditorName || '').toLowerCase();
      if (creditor && creditor === accountLower) return true;
      const cap = (e.caption || '').toLowerCase();
      if (cap.includes('tradeline screenshot') && cap.includes(accountLower)) return true;
      return false;
    });

    if (!matches.length) return null;
    // Prefer evidence that matches this candidate's account (e.g. collection row / inquiry name) so per-card screenshots bind correctly
    const withAccount = matches.filter((e) => accountLower && (e.creditorName || '').toLowerCase().trim() === accountLower);
    const sorted = (withAccount.length ? withAccount : matches).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted[0]!.id;
  };

  // Seed defaults for evidence binding when selection changes.
  useEffect(() => {
    if (!selectedCandidates.length) return;
    setEvidenceByCandidateId((prev) => {
      const next = { ...prev };
      for (const c of selectedCandidates) {
        if (next[c.id]) continue;
        const best = bestEvidenceIdForCandidate(c);
        if (best) next[c.id] = best;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCandidates.map((c) => c.id).join('|'), imageEvidence.length]);

  // Seed dispute reasons for selected candidates (persisted).
  useEffect(() => {
    if (!partner) return;
    const parsed = selectedReport?.parsed;
    if (!parsed) return;
    if (!selectedCandidates.length) return;
    let changed = false;
    for (const c of selectedCandidates) {
      const existing = getDisputeReasons({
        partnerId: partner.id,
        reportId: selectedReport?.id,
        bureau: c.bureau,
        candidateId: c.id,
      });
      if (existing) continue;
      const suggestions = buildFactualDisputeSuggestions({ parsed, candidate: c });
      const rec: DisputeReasonsRecord = {
        id: computeDisputeReasonsId({
          partnerId: partner.id,
          reportId: selectedReport?.id,
          bureau: c.bureau,
          candidateId: c.id,
        }),
        partnerId: partner.id,
        reportId: selectedReport?.id,
        bureau: c.bureau,
        candidateId: c.id,
        suggestions,
        selectedSuggestionIds: suggestions.map((s) => s.id),
        customReasons: [],
        updatedAt: new Date().toISOString(),
      };
      upsertDisputeReasons(rec);
      changed = true;
    }
    if (changed) setReasonsVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partner?.id, selectedReport?.id, selectedCandidates.map((c) => c.id).join('|')]);

  const getReasonsRecord = (c: DisputeCandidate): DisputeReasonsRecord | null => {
    if (!partner) return null;
    return getDisputeReasons({
      partnerId: partner.id,
      reportId: selectedReport?.id,
      bureau: c.bureau,
      candidateId: c.id,
    });
  };

  const updateReasonsRecord = (c: DisputeCandidate, next: DisputeReasonsRecord) => {
    upsertDisputeReasons({ ...next, updatedAt: new Date().toISOString() });
    setReasonsVersion((v) => v + 1);
  };

  if (partner && !access.ok) {
    return (
      <PageShell badge="Admin" title="Not authorized" subtitle="You don’t have access to this partner in the active tenant.">
        <div className="space-y-4">
          <div className={`${FINELY_OS_NOTICE_WARN} ${FINELY_OS_ENTITY_BODY}`}>
            Reason: <span className="font-mono font-semibold">{String(access.reason || 'unknown')}</span>
          </div>
          <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_PRIMARY_BTN}>
            Back to Partners
          </button>
        </div>
      </PageShell>
    );
  }

  if (!partner) {
    return (
      <PageShell badge="Admin" title="Partner not found" subtitle="This Partner record does not exist or the link may be invalid.">
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/admin/partners')}
            className={FINELY_OS_BACK_LINK}
          >
            <ArrowLeft size={16} />
            Back to Partner Management
          </button>
        </div>
      </PageShell>
    );
  }

  const systemNotes = (() => {
    const out: { createdAt: string; title: string; body: string }[] = [];

    out.push({
      createdAt: partner.updatedAt,
      title: 'Partner status',
      body: `Status: ${partner.status}`,
    });

    // Next steps: pending / in-progress tasks
    const actionable = partnerTasks
      .filter((t) => t.status === 'pending' || t.status === 'in_progress')
      .slice()
      .sort((a, b) => (a.dueAt || a.createdAt).localeCompare(b.dueAt || b.createdAt));
    if (actionable.length) {
      const top = actionable.slice(0, 3);
      out.push({
        createdAt: top[0]!.dueAt || top[0]!.createdAt,
        title: 'Next steps',
        body:
          top
            .map((t) => {
              const due = t.dueAt ? ` (due ${new Date(t.dueAt).toLocaleDateString()})` : '';
              return `• ${t.title}${due}`;
            })
            .join('\n') + (actionable.length > 3 ? `\n• +${actionable.length - 3} more…` : ''),
      });
    } else {
      out.push({
        createdAt: new Date().toISOString(),
        title: 'Next steps',
        body: 'No open tasks right now. Generate a letter or add a task to begin the next action.',
      });
    }

    // Case status snapshot
    const openCases = partnerCases.filter((c) => c.status === 'open');
    if (openCases.length) {
      const lines = openCases
        .map((c) => {
          const latest = c.rounds.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
          const due = latest?.dueAt ? ` — follow-up due ${new Date(latest.dueAt).toLocaleDateString()}` : '';
          return `• ${bureauShortCode(c.bureau)}: ${c.title}${due}`;
        })
        .join('\n');
      out.push({
        createdAt: openCases[0]!.updatedAt,
        title: 'Open dispute cases',
        body: lines,
      });
    }

    // Recent audit events (last 5)
    const recent = audit.slice(0, 5);
    if (recent.length) {
      out.push({
        createdAt: recent[0]!.createdAt,
        title: 'Recent activity',
        body: recent
          .map((e) => {
            const who = e.actorEmail ? ` (${e.actorEmail})` : '';
            return `• ${new Date(e.createdAt).toLocaleString()} — ${e.action}${who}`;
          })
          .join('\n'),
      });
    }

    // Keep newest-first by createdAt.
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  })();

  return (
    <EntityDetailShell
      badge="Admin"
      title={partner.profile.fullName}
      subtitle="Partner profile: reports, evidence, disputes, and letters are anchored here for full visibility."
      headerLeft={
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className={FINELY_OS_BACK_LINK}
            title="Back to Finely Cred Dashboard"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="h-4 w-px bg-violet-200/80" />
          <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back to Partners
          </button>
        </div>
      }
      headerRight={<div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>partner_id: {partner.id}</div>}
      tabs={[
        { key: 'overview', label: 'Overview', icon: <Layers size={12} className="inline mr-2" /> },
        { key: 'profile', label: 'Profile', icon: <User size={12} className="inline mr-2" /> },
        { key: 'reports', label: 'Reports', icon: <FileText size={12} className="inline mr-2" /> },
        { key: 'analysis', label: 'Analysis Report', icon: <BarChart3 size={12} className="inline mr-2" /> },
        { key: 'evidence', label: 'Evidence', icon: <ShieldAlert size={14} className="inline mr-2" /> },
        { key: 'letters', label: 'Letters', icon: <PenLine size={14} className="inline mr-2" /> },
        {
          key: 'tasks',
          label: partnerUnreadNotifs > 0 ? `Tasks (${partnerUnreadNotifs})` : 'Tasks',
          icon: <ListChecks size={14} className="inline mr-2" />,
        },
        { key: 'notes', label: 'Notes', icon: <ScrollText size={14} className="inline mr-2" /> },
        { key: 'debt', label: 'Debt Center', icon: <Scale size={14} className="inline mr-2" /> },
      ]}
      activeTabKey={tab}
      useSidebarNav
      onTabChange={(k) => setTabAndUrl(k as TabKey)}
      stickyBar={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Partner workspace · <span className="text-violet-200/90 capitalize">{tab.replace('_', ' ')}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setTabAndUrl('overview')} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-xs ${tab === 'overview' ? '!border-emerald-400/40' : ''}`}>
              Overview
            </button>
            <button type="button" onClick={() => setTabAndUrl('profile')} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-xs ${tab === 'profile' ? '!border-violet-400/40' : ''}`}>
              Profile
            </button>
            <button type="button" onClick={() => setTabAndUrl('reports')} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-xs`}>
              Reports
            </button>
            <button type="button" onClick={() => setTabAndUrl('letters')} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-xs`}>
              Letters
            </button>
            <button type="button" onClick={() => setTabAndUrl('tasks')} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-xs`}>
              Tasks
            </button>
            <button type="button" onClick={() => setTabAndUrl('notes')} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-xs`}>
              Notes
            </button>
            <button type="button" onClick={() => setTabAndUrl('debt')} className={`${FINELY_OS_SECONDARY_BTN} !py-2 !text-xs`}>
              Debt
            </button>
            {!reports.length ? (
              <button type="button" onClick={() => setTabAndUrl('reports')} className={`${FINELY_OS_PRIMARY_BTN} !py-2 !text-xs`}>
                Upload report
              </button>
            ) : !letters.length ? (
              <button type="button" onClick={() => setTabAndUrl('letters')} className={`${FINELY_OS_PRIMARY_BTN} !py-2 !text-xs`}>
                Open letters
              </button>
            ) : (
              <button type="button" onClick={() => setTabAndUrl('letters')} className={`${FINELY_OS_PRIMARY_BTN} !py-2 !text-xs`}>
                Letter studio
              </button>
            )}
          </div>
        </div>
      }
    >
      {partner && evidencePicker && (
        <EvidencePickerModal
          open={Boolean(evidencePicker)}
          title={
            evidencePickerCandidate
              ? `Attach evidence • ${evidencePickerCandidate.account}`
              : 'Evidence vault'
          }
          subtitle={
            evidencePickerCandidate
              ? `${bureauShortCode(evidencePickerCandidate.bureau)} • ${evidencePickerCandidate.type}`
              : 'Upload, categorize, and manage evidence without leaving this flow.'
          }
          partnerId={partner.id}
          reportId={selectedReport?.id}
          items={evidence}
          selectedEvidenceId={evidencePicker.candidateId ? evidenceByCandidateId[evidencePicker.candidateId] : undefined}
          pickLabel="Attach"
          onPick={
            evidencePicker.candidateId
              ? (evidenceId) => {
                  const cid = evidencePicker.candidateId!;
                  setEvidenceByCandidateId((prev) => ({ ...prev, [cid]: evidenceId }));
                  setEvidencePicker(null);
                }
              : undefined
          }
          onUpsert={(item) => {
            upsertEvidence(item);
            setNotesVersion((v) => v + 1);
          }}
          onDelete={(eId) => {
            deleteEvidence(eId);
            setNotesVersion((v) => v + 1);
          }}
          onOpenFullVault={() => {
            setEvidencePicker(null);
            setTabAndUrl('evidence');
          }}
          onClose={() => setEvidencePicker(null)}
          autoPickOnUpload={Boolean(evidencePicker.candidateId)}
        />
      )}
      <div className="space-y-8">
        {tab === 'overview' && (
          <PartnerOverviewTab
            partner={partner}
            profileRouteKey={profileRouteKey}
            mailingSummary={mailingSummary}
            emptyCustomFieldSections={emptyCustomFieldSections}
            reportsCount={reports.length}
            evidenceCount={evidence.length}
            lettersCount={letters.length}
            debtCasesCount={debtCases.length}
            overallScore={overallScore}
            openPartnerTasksCount={openPartnerTasks.length}
            openPartnerCasesCount={openPartnerCases.length}
            latestScoresRows={latestScoresRows}
            onStatusChange={async (status) => {
              await adminUpsertPartner({ ...partner, status: status as any });
              setPartnerVersion((v) => v + 1);
              addAuditEvent({
                partnerId: partner.id,
                actorType: 'admin',
                actorEmail,
                action: `partner.status_set:${status}`,
                entityType: 'partner',
                entityId: partner.id,
                meta: { status },
              });
              setNotesVersion((v) => v + 1);
            }}
            onOpenProfile={() => setTabAndUrl('profile')}
            onOpenTab={(t) => setTabAndUrl(t as TabKey)}
            onNavigate={(p) => navigate(p)}
          />
        )}

        {tab === 'profile' && (
          <PartnerProfileTab
            partner={partner}
            tenantId={tenantId}
            profileRouteKey={profileRouteKey}
            profilePersonal={profilePersonal}
            profileDraft={profileDraft}
            setProfileDraft={setProfileDraft}
            customDefs={customDefs}
            partnerFieldLayout={partnerFieldLayout}
            customFieldDraft={customFieldDraft}
            updateCustomField={updateCustomField}
            financialDraft={financialDraft}
            setFinancialDraft={setFinancialDraft}
            dti={dti}
            denefitsContractUrlDraft={denefitsContractUrlDraft}
            setDenefitsContractUrlDraft={setDenefitsContractUrlDraft}
            denefitsContractLabelDraft={denefitsContractLabelDraft}
            setDenefitsContractLabelDraft={setDenefitsContractLabelDraft}
            activeEntitlementKeys={activeEntitlementKeys}
            missingEntitlementKeys={missingEntitlementKeys}
            allPortalEntitlementKeys={allPortalEntitlementKeys}
            latestScoresRows={latestScoresRows}
            actorEmail={actorEmail}
            isAdmin={Boolean(actorEmail && isAdminEmail(actorEmail))}
            deleteOpen={deleteOpen}
            setDeleteOpen={setDeleteOpen}
            deletePhrase={deletePhrase}
            setDeletePhrase={setDeletePhrase}
            onSaveProfile={async () => {
              const name = profileDraft.fullName.trim();
              if (!name) return;
              const email = profileDraft.email.trim().toLowerCase();
              const phone = profileDraft.phone.trim();
              const next = await adminUpsertPartner({
                ...partner,
                profile: { ...partner.profile, fullName: name, email: email || undefined, phone: phone || undefined },
                routes: {
                  ...(partner.routes || {}),
                  [profileRouteKey]: {
                    ...(partner.routes?.[profileRouteKey] as any),
                    personal: {
                      ...(profilePersonal as any),
                      address1: profileDraft.address1.trim() || undefined,
                      address2: profileDraft.address2.trim() || undefined,
                      city: profileDraft.city.trim() || undefined,
                      state: profileDraft.state.trim() || undefined,
                      postalCode: profileDraft.postalCode.trim() || undefined,
                    },
                  },
                } as any,
              });
              addAuditEvent({
                partnerId: partner.id,
                actorType: 'admin',
                actorEmail,
                action: 'partner.profile_updated',
                entityType: 'partner',
                entityId: partner.id,
                meta: { email: next.profile.email ?? null, phone: next.profile.phone ?? null, route: profileRouteKey },
              });
              setPartnerVersion((v) => v + 1);
              setNotesVersion((v) => v + 1);
            }}
            onResetProfileDraft={() => {
              setProfileDraft({
                fullName: partner.profile.fullName || '',
                email: partner.profile.email || '',
                phone: partner.profile.phone || '',
                address1: String(profilePersonal.address1 || ''),
                address2: String(profilePersonal.address2 || ''),
                city: String(profilePersonal.city || ''),
                state: String(profilePersonal.state || ''),
                postalCode: String(profilePersonal.postalCode || ''),
              });
            }}
            onDeletePartner={async () => {
              const ok = await adminDeletePartner(partner.id);
              if (ok) {
                addAuditEvent({
                  partnerId: partner.id,
                  actorType: 'admin',
                  actorEmail,
                  action: 'partner.deleted',
                  entityType: 'partner',
                  entityId: partner.id,
                  meta: { hardDelete: true },
                });
              }
              navigate('/admin/partners');
            }}
            onSaveFinancial={async () => {
              const annual = Number(financialDraft.annualIncome);
              const debt = Number(financialDraft.monthlyDebtPayments);
              const housing = Number(financialDraft.monthlyHousing);
              await adminUpsertPartner({
                ...partner,
                financial: {
                  annualIncome: Number.isFinite(annual) && annual > 0 ? annual : undefined,
                  monthlyDebtPayments: Number.isFinite(debt) && debt >= 0 ? debt : undefined,
                  monthlyHousing: Number.isFinite(housing) && housing >= 0 ? housing : undefined,
                },
              });
              setPartnerVersion((v) => v + 1);
              addAuditEvent({
                partnerId: partner.id,
                actorType: 'admin',
                actorEmail,
                action: 'partner.financial_updated',
                entityType: 'partner',
                entityId: partner.id,
                meta: { annualIncome: annual, monthlyDebtPayments: debt, monthlyHousing: housing, dti },
              });
              setNotesVersion((v) => v + 1);
            }}
            onAssignDenefits={async () => {
              const url = denefitsContractUrlDraft.trim();
              try {
                new URL(url);
              } catch {
                window.alert('Invalid contract URL.');
                return;
              }
              await adminUpsertPartner({
                ...partner,
                denefits: {
                  contractUrl: url,
                  label: denefitsContractLabelDraft.trim() || undefined,
                  assignedAt: new Date().toISOString(),
                  assignedByEmail: actorEmail || undefined,
                },
              });
              setPartnerVersion((v) => v + 1);
              addAuditEvent({
                partnerId: partner.id,
                actorType: 'admin',
                actorEmail,
                action: 'partner.denefits_contract_assigned',
                entityType: 'partner',
                entityId: partner.id,
                meta: { contractUrl: url, label: denefitsContractLabelDraft.trim() || null },
              });
              setNotesVersion((v) => v + 1);
            }}
            onRevertDenefits={() => {
              setDenefitsContractUrlDraft(partner.denefits?.contractUrl ?? '');
              setDenefitsContractLabelDraft(partner.denefits?.label ?? '');
            }}
            onClearDenefits={async () => {
              await adminUpsertPartner({ ...partner, denefits: undefined });
              setDenefitsContractUrlDraft('');
              setDenefitsContractLabelDraft('');
              setPartnerVersion((v) => v + 1);
              addAuditEvent({
                partnerId: partner.id,
                actorType: 'admin',
                actorEmail,
                action: 'partner.denefits_contract_cleared',
                entityType: 'partner',
                entityId: partner.id,
              });
              setNotesVersion((v) => v + 1);
            }}
            onGrantAllEntitlements={() => {
              ensurePartnerEntitlements({ partnerId: partner.id, keys: allPortalEntitlementKeys, sourceAgreementId: 'admin_unlock_all' });
              setNotesVersion((v) => v + 1);
              addAuditEvent({
                partnerId: partner.id,
                actorType: 'admin',
                actorEmail,
                action: 'partner.entitlements_granted_all',
                entityType: 'partner',
                entityId: partner.id,
                meta: { keys: allPortalEntitlementKeys },
              });
            }}
            onRefreshEntitlements={() => setNotesVersion((v) => v + 1)}
            onOpenSettings={() => navigate('/admin/settings')}
          />
        )}

        {tab === 'tasks' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-12 gap-6">
              <div className={`lg:col-span-7 ${FINELY_OS_BOARD_SHELL} space-y-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-violet-700">
                      <ListChecks size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Partner task queue</span>
                    </div>
                    <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                      Tasks are the partner’s action queue. Letters auto-generate mail + follow-up tasks, and automations can generate evidence upload tasks.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Open</div>
                    <div className={`mt-1 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                      {partnerTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length}
                    </div>
                  </div>
                </div>

                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>Create task</div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className={FINELY_OS_ENTITY_LABEL}>Title</label>
                      <input
                        value={tasksDraftTitle}
                        onChange={(e) => setTasksDraftTitle(e.target.value)}
                        className={FINELY_OS_ENTITY_INPUT}
                        placeholder="Example: Upload proof of address + updated ID"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={FINELY_OS_ENTITY_LABEL}>Project</label>
                      <select
                        value={tasksDraftProjectId}
                        onChange={(e) => setTasksDraftProjectId(e.target.value)}
                        className={FINELY_OS_ENTITY_SELECT}
                        title="Every task is linked to a project (auto attaches to the active project)."
                      >
                        <option value="auto">Auto (active project)</option>
                        {partnerProjects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                      {partnerProjects.length === 0 ? (
                        <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                          No projects yet. Creating a task will auto-create a default project.
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className={FINELY_OS_ENTITY_LABEL}>Kind</label>
                      <select
                        value={tasksDraftKind}
                        onChange={(e) => setTasksDraftKind(e.target.value as any)}
                        className={FINELY_OS_ENTITY_SELECT}
                      >
                        <option value="general">General</option>
                        <option value="mail_letter">Mail letter</option>
                        <option value="follow_up">Follow up</option>
                        <option value="upload_document">Upload document</option>
                        <option value="review_results">Review results</option>
                      </select>
                    </div>
                    <div>
                      <label className={FINELY_OS_ENTITY_LABEL}>Due date (optional)</label>
                      <input
                        type="date"
                        value={tasksDraftDueAt}
                        onChange={(e) => setTasksDraftDueAt(e.target.value)}
                        className={FINELY_OS_ENTITY_SELECT}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={FINELY_OS_ENTITY_LABEL}>Notes (optional)</label>
                      <textarea
                        value={tasksDraftNotes}
                        onChange={(e) => setTasksDraftNotes(e.target.value)}
                        rows={3}
                        className={`${FINELY_OS_ENTITY_INPUT} text-sm`}
                        placeholder="Internal context and what to ask for."
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <VoiceToTaskButton
                      onCapture={({ title, notes }) => {
                        setTasksDraftTitle(title);
                        if (notes) setTasksDraftNotes(notes);
                      }}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!tasksDraftTitle.trim()}
                      onClick={() => {
                        const title = tasksDraftTitle.trim();
                        if (!title) return;
                        const dueAt = tasksDraftDueAt ? new Date(tasksDraftDueAt + 'T00:00:00').toISOString() : undefined;
                        const created = createTask({
                          partnerId: partner.id,
                          projectId: tasksDraftProjectId === 'auto' ? undefined : tasksDraftProjectId,
                          title,
                          kind: tasksDraftKind,
                          status: 'pending',
                          dueAt,
                          notes: tasksDraftNotes.trim() || undefined,
                        });
                        addAuditEvent({
                          partnerId: partner.id,
                          actorType: 'admin',
                          actorEmail,
                          action: 'task.created',
                          entityType: 'task',
                          entityId: created.id,
                          meta: { kind: created.kind, title: created.title },
                        });
                        setTasksDraftTitle('');
                        setTasksDraftKind('general');
                        setTasksDraftDueAt('');
                        setTasksDraftNotes('');
                        setTasksDraftProjectId('auto');
                        setNotesVersion((v) => v + 1);
                      }}
                    >
                      Create task
                    </button>
                    <button
                      type="button"
                      className={FINELY_OS_SECONDARY_BTN}
                      onClick={() => setNotesVersion((v) => v + 1)}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                  <WorkBoardShell
                    view={tasksView}
                    onViewChange={setTasksView}
                    stages={TASK_PROGRESS_STAGES}
                    stageFilter={taskCategoryFilter}
                    onStageFilterChange={setTaskCategoryFilter}
                    stageFilterStages={taskStageDefs}
                  />

                  {partnerTasks.length === 0 ? (
                    <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>
                      No tasks yet. Generate a letter in the Letters tab to auto-create mail + follow-up tasks.
                    </div>
                  ) : tasksView === 'kanban' ? (
                    <WorkKanbanBoard
                      stages={TASK_PROGRESS_STAGES}
                      items={taskItems}
                      onStageChange={(id, stageId) => {
                        const t = partnerTasks.find((x) => x.id === id) ?? null;
                        if (!t) return;
                        const next = setTaskStatus(t.id, stageId as any);
                        if (next) {
                          addAuditEvent({
                            partnerId: next.partnerId,
                            actorType: 'admin',
                            actorEmail,
                            action: `task.status_set:${String(stageId)}`,
                            entityType: 'task',
                            entityId: next.id,
                            meta: { kind: next.kind, title: next.title, projectId: next.projectId ?? null, status: stageId },
                          });
                        }
                        setNotesVersion((v) => v + 1);
                      }}
                    />
                  ) : tasksView === 'list' ? (
                    <WorkListView
                      stages={TASK_PROGRESS_STAGES}
                      items={taskItems}
                      onStageChange={(id, stageId) => {
                        const t = partnerTasks.find((x) => x.id === id) ?? null;
                        if (!t) return;
                        const next = setTaskStatus(t.id, stageId as any);
                        if (next) {
                          addAuditEvent({
                            partnerId: next.partnerId,
                            actorType: 'admin',
                            actorEmail,
                            action: `task.status_set:${String(stageId)}`,
                            entityType: 'task',
                            entityId: next.id,
                            meta: { kind: next.kind, title: next.title, projectId: next.projectId ?? null, status: stageId },
                          });
                        }
                        setNotesVersion((v) => v + 1);
                      }}
                    />
                  ) : (
                    <WorkCalendarView
                      items={taskItems}
                      stageColorById={Object.fromEntries(TASK_PROGRESS_STAGES.map((s) => [s.id, String((s as any).color || '')])) as any}
                      dateForItem={(it) => it.dueAt || it.updatedAt}
                      emptyHint="Calendar uses due dates for tasks, else updatedAt."
                    />
                  )}
                </div>
              </div>

              <div className={`lg:col-span-5 ${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 text-violet-700">
                    <Bell size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Partner notifications</span>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                    unread: <span className={FINELY_OS_ENTITY_VALUE}>{partnerUnreadNotifs}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      markAllRead({ partnerId: partner.id, audience: 'partner' });
                      setNotesVersion((v) => v + 1);
                    }}
                    disabled={!partnerUnreadNotifs}
                    className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    Mark all read
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotesVersion((v) => v + 1)}
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    Refresh
                  </button>
                </div>

                <PartnerCompactGrid
                  items={partnerNotifs}
                  initialShow={6}
                  columnsClassName="grid gap-2"
                  emptyMessage="No notifications yet. They'll appear when tasks are created/updated, support replies are sent, letters are generated, or cases change."
                  getKey={(n) => n.id}
                  renderItem={(n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(n.id);
                        setNotesVersion((v) => v + 1);
                      }}
                      className={finelyOsListItem(!n.readAt, 'fuchsia')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{n.title}</div>
                          {n.body && <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{n.body}</div>}
                          <div className={`mt-2 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                            {n.kind} • {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {!n.readAt && (
                          <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest">
                            New
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Auto notes</p>
                <p className={FINELY_OS_ENTITY_BODY}>
                  These are generated from tasks, cases, letters, and audit events — giving you an always-up-to-date “what’s next / what happened” timeline.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    className={FINELY_OS_ENTITY_ACTION}
                    onClick={() => setNotesVersion((v) => v + 1)}
                    title="Refresh auto notes"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <PartnerCompactGrid
                items={systemNotes}
                initialShow={6}
                columnsClassName="grid gap-3"
                emptyMessage="No auto notes yet."
                getKey={(n, i) => `${n.createdAt}-${n.title}-${i}`}
                renderItem={(n) => (
                  <div key={`${n.createdAt}-${n.title}`} className={`${finelyOsInlineListItem()} p-5`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{n.title}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <pre className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{n.body}</pre>
                  </div>
                )}
              />
            </div>

            <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Manual notes</p>
                <p className={FINELY_OS_ENTITY_BODY}>
                  Use this for call summaries, promises made, missing docs, partner tone, objections, and underwriting context. (Internal by default.)
                </p>
              </div>

              <div className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                <label className={FINELY_OS_ENTITY_LABEL}>Add note</label>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={5}
                  className={`${FINELY_OS_ENTITY_INPUT} resize-y min-h-[120px]`}
                  placeholder="Example: 2/2 call — partner will upload updated ID + proof of address by Friday. Wants business route, high urgency, funding target $75k. Needs help with utilization plan."
                />
                <div className="flex flex-wrap items-center gap-4">
                  <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                    <input
                      type="checkbox"
                      checked={notesVisibleToPartner}
                      onChange={(e) => setNotesVisibleToPartner(e.target.checked)}
                      className="accent-amber-500"
                    />
                    Visible to partner
                  </label>
                  <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                    <input
                      type="checkbox"
                      checked={notesPinned}
                      onChange={(e) => setNotesPinned(e.target.checked)}
                      className="accent-amber-500"
                    />
                    Pinned
                  </label>
                  <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                    Partner will only see notes marked visible (recommended: actionable next steps).
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    disabled={!notesDraft.trim()}
                    onClick={() => {
                      const body = notesDraft.trim();
                      if (!body) return;
                      createPartnerNote({
                        partnerId: partner.id,
                        kind: 'manual',
                        authorType: 'admin',
                        authorEmail: actorEmail,
                        visibility: notesVisibleToPartner ? 'partner' : 'internal',
                        body,
                        pinned: notesPinned,
                      });
                      addAuditEvent({
                        partnerId: partner.id,
                        actorType: 'admin',
                        actorEmail,
                        action: 'partner.note_created',
                        entityType: 'partner_note',
                        entityId: 'note',
                        meta: { kind: 'manual', visibility: notesVisibleToPartner ? 'partner' : 'internal', pinned: notesPinned },
                      });
                      setNotesDraft('');
                      setNotesVisibleToPartner(false);
                      setNotesPinned(false);
                      setNotesVersion((v) => v + 1);
                    }}
                  >
                    Save note
                  </button>
                  <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
                    Notes saved: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{manualNotes.length}</span>
                  </div>
                </div>
              </div>

              {sortedManualNotes.length === 0 && partner.notes?.trim() ? (
                <div className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                  <div className={`${FINELY_OS_ENTITY_VALUE}`}>Imported from previous Finely Cred site</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL}`}>Legacy profile notes (will sync to timeline on refresh)</div>
                  <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{partner.notes}</pre>
                  <button
                    type="button"
                    className={FINELY_OS_SECONDARY_BTN}
                    onClick={() => {
                      seedLegacyPartnerNotes({
                        partnerId: partner.id,
                        notesText: partner.notes,
                        externalId: partner.importExternalId || partner.id,
                        forceRefresh: true,
                      });
                      setNotesVersion((v) => v + 1);
                    }}
                  >
                    Import into notes timeline
                  </button>
                </div>
              ) : sortedManualNotes.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_BODY}>No manual notes yet.</div>
                ) : (
                  <PartnerCompactGrid
                    items={sortedManualNotes}
                    initialShow={6}
                    columnsClassName="grid gap-3"
                    emptyMessage="No manual notes yet."
                    getKey={(n) => n.id}
                    renderItem={(n) => (
                      <div key={n.id} className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                        <div className="min-w-0">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{n.title || 'Note'}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            {new Date(n.createdAt).toLocaleString()}
                            {n.authorEmail ? ` • ${n.authorEmail}` : ''}
                            {n.visibility === 'partner' ? ' • partner-visible' : ' • internal'}
                            {n.pinned ? ' • pinned' : ''}
                          </div>
                        </div>
                        <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{n.body}</pre>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.08]">
                          <button
                            type="button"
                            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                              n.visibility === 'partner' ? FINELY_OS_ACTIVE_CHIP : FINELY_OS_ENTITY_CHIP
                            }`}
                            title="Toggle partner visibility"
                            onClick={() => {
                              upsertPartnerNote({ ...n, visibility: n.visibility === 'partner' ? 'internal' : 'partner' });
                              addAuditEvent({
                                partnerId: partner.id,
                                actorType: 'admin',
                                actorEmail,
                                action: 'partner.note_visibility',
                                entityType: 'partner_note',
                                entityId: n.id,
                                meta: { visibility: n.visibility === 'partner' ? 'internal' : 'partner' },
                              });
                              setNotesVersion((v) => v + 1);
                            }}
                          >
                            {n.visibility === 'partner' ? 'Shown to partner' : 'Internal'}
                          </button>
                          <button
                            type="button"
                            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                              n.pinned ? 'border-fuchsia-500/35 bg-fuchsia-500/15 text-fuchsia-200' : FINELY_OS_ENTITY_CHIP
                            }`}
                            title="Toggle pin"
                            onClick={() => {
                              upsertPartnerNote({ ...n, pinned: !Boolean(n.pinned) });
                              addAuditEvent({
                                partnerId: partner.id,
                                actorType: 'admin',
                                actorEmail,
                                action: 'partner.note_pinned',
                                entityType: 'partner_note',
                                entityId: n.id,
                                meta: { pinned: !Boolean(n.pinned) },
                              });
                              setNotesVersion((v) => v + 1);
                            }}
                          >
                            {n.pinned ? 'Pinned' : 'Pin'}
                          </button>
                          <button
                            type="button"
                            className={FINELY_OS_ENTITY_ACTION}
                            title="Delete note"
                            onClick={() => {
                              deletePartnerNote(n.id);
                              addAuditEvent({
                                partnerId: partner.id,
                                actorType: 'admin',
                                actorEmail,
                                action: 'partner.note_deleted',
                                entityType: 'partner_note',
                                entityId: n.id,
                              });
                              setNotesVersion((v) => v + 1);
                            }}
                          >
                            <Trash2 size={14} className="text-red-300" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  />
                )}
            </div>
          </div>
        )}

        {tab === 'debt' && (
          <div className="space-y-6">
            <div className={`${finelyOsCatalogCard('violet')} !p-5`}>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Debt & Summons cases</p>
              <p className={FINELY_OS_ENTITY_BODY}>
                This partner manages debt and summons cases in their portal. Here you see the list; they get validation requests, affidavits, summons answers (e.g. 35-day), and full legal basis at <strong className={FINELY_OS_ENTITY_VALUE}>Debt & Summons Center</strong>.
              </p>
              <a
                href={`/portal/debt`}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_SECONDARY_BTN}`}
              >
                <ExternalLink size={14} /> Open Debt Center (partner view)
              </a>
            </div>
            {debtCases.length === 0 ? (
              <div className={FINELY_OS_ENTITY_EMPTY}>
                No debt or summons cases for this partner yet. They can add cases from their portal (Debt & Summons Center).
              </div>
            ) : (
              <PartnerCompactGrid
                items={debtCases}
                initialShow={6}
                columnsClassName="grid md:grid-cols-2 gap-3"
                emptyMessage="No debt cases."
                getKey={(d) => d.id}
                renderItem={(d) => (
                  <div key={d.id} className={`${finelyOsInlineListItem()} p-4 flex items-center justify-between gap-4`}>
                    <div className="min-w-0">
                      <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{d.name}</div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5`}>
                        {(d.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {d.type} · {d.status}
                        {d.courtCaseNumber ? ` · ${d.courtCaseNumber}` : ''}
                      </div>
                    </div>
                    <a
                      href={`/portal/debt/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${FINELY_OS_SECONDARY_BTN} shrink-0 text-[10px]`}
                    >
                      View <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              />
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-6">
            <ReportUploader
              partnerId={partner.id}
              uploadedBy="admin"
              onCreated={handleReportCreated}
            />

            <div className="grid lg:grid-cols-12 gap-6">
              <div className={`order-2 lg:order-1 lg:col-span-4 ${finelyOsCatalogCard('violet')} !p-5`}>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Reports</p>

                {deleteReportErr && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
                    {deleteReportErr}
                  </div>
                )}
                {reparseReportErr && (
                  <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
                    {reparseReportErr}
                  </div>
                )}

                <div className="mt-4">
                  <PartnerCompactGrid
                    items={reports}
                    initialShow={6}
                    columnsClassName="grid gap-3"
                    emptyMessage="No reports uploaded for this Partner."
                    getKey={(r) => r.id}
                    renderItem={(r) => (
                      <div
                        key={r.id}
                        className={finelyOsListItem((selectedReportId ?? reports[0]?.id) === r.id, 'violet')}
                      >
                        <button type="button" onClick={() => setSelectedReportId(r.id)} className="w-full text-left">
                          <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{r.filename}</div>
                          <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                            {r.fileType} • {r.provider} • {new Date(r.receivedAt).toLocaleString()}
                          </div>
                        </button>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono opacity-70`}>report_id: {r.id}</div>
                          <div className="flex items-center gap-2">
                            {!isLegacyPendingReportBlob(r.rawBlobRef) ? (
                              <button
                                type="button"
                                className={FINELY_OS_SECONDARY_BTN}
                                title="Open stored report file"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void openStoredDocument({
                                    blobRef: r.rawBlobRef,
                                    mimeType: r.mimeType || (r.fileType === 'pdf' ? 'application/pdf' : 'text/html'),
                                  });
                                }}
                              >
                                <ExternalLink size={14} /> Open file
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
                              title="Re-run parsing from stored raw file"
                              disabled={Boolean(reparseReportId) || deletingReportId === r.id}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setReparseReportErr(null);
                                setReparseReportId(r.id);
                                try {
                                  const store = getBlobStore();
                                  const blob = await store.get(r.rawBlobRef);
                                  if (!blob) throw new Error('Stored report file not found.');

                                  if (r.fileType === 'html') {
                                    const html = await blob.text();
                                    const parsed = await parseCreditReportHtmlEnhanced(html);
                                    const provider = parsed.provider ?? detectProviderFromHtml(html);
                                    upsertReport({ ...r, provider, reportDate: parsed.reportDate, parsed });
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
                                  setReportsRefreshKey((v) => v + 1);
                                } catch (err: any) {
                                  setReparseReportErr(err?.message || 'Re-parse failed.');
                                } finally {
                                  setReparseReportId(null);
                                }
                              }}
                            >
                              <RefreshCcw size={14} className="text-fuchsia-300" /> {reparseReportId === r.id ? 'Re-parsing…' : 'Re-parse'}
                            </button>
                            <button
                              type="button"
                              className={`${FINELY_OS_ENTITY_ACTION} disabled:opacity-60 disabled:cursor-not-allowed`}
                              title="Delete report"
                              disabled={deletingReportId === r.id || Boolean(reparseReportId)}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setDeleteReportErr(null);
                                const ok = window.confirm(
                                  `Delete this report?\n\n${r.filename}\n\nThis removes it from the Partner record (and deletes the stored file).`,
                                );
                                if (!ok) return;
                                setDeletingReportId(r.id);
                                try {
                                  const store = getBlobStore();
                                  try {
                                    await store.delete(r.rawBlobRef);
                                  } catch {
                                    // ignore blob delete failures; still remove record
                                  }
                                  deleteReport(r.id);
                                  if (selectedReportId === r.id) setSelectedReportId(null);
                                  setReportsRefreshKey((v) => v + 1);
                                  
                                  // Refresh page after successful deletion to avoid state cascade issues
                                  setTimeout(() => {
                                    window.location.reload();
                                  }, 1000);
                                } catch (err: any) {
                                  setDeleteReportErr(err?.message || 'Delete failed.');
                                } finally {
                                  setDeletingReportId(null);
                                }
                              }}
                            >
                              <Trash2 size={14} className="text-red-300" /> {deletingReportId === r.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>

              <div className="order-1 lg:order-2 lg:col-span-8">
                {selectedReport && isLegacyPendingReportBlob(selectedReport.rawBlobRef) ? (
                  <div className="space-y-6">
                    <LegacyPendingReportNotice
                      filename={selectedReport.filename}
                      rawBlobRef={selectedReport.rawBlobRef}
                      variant="admin"
                    />
                    {selectedReport.parsed ? (
                      <CreditIntelTabs
                        parsed={selectedReport.parsed}
                        reportId={selectedReport.id}
                        partnerId={partner.id}
                        availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
                        onOpenLetterGenerator={() => setTabAndUrl('letters')}
                        onOpenEvidenceVault={() => setEvidencePicker({})}
                        onOpenTasks={() => setTabAndUrl('tasks')}
                      />
                    ) : null}
                  </div>
                ) : selectedReport?.parsed ? (
                  <>
                    <div className="space-y-6">
                      <ParsedReportOverviewPanel parsed={selectedReport.parsed} filename={selectedReport.filename} />
                      <ParsedReportDiagnosticsPanel
                        parsed={selectedReport.parsed}
                        filename={selectedReport.filename}
                        variant="admin"
                        pdfMeta={selectedReport.fileType === 'pdf' ? (selectedReport.pdfMeta as any) : undefined}
                        defaultOpen={
                          (selectedReport.parsed.tradelines?.length ?? 0) === 0 ||
                          Boolean(selectedReport.parsed.debug?.fallbackTradelinesUsed) ||
                          selectedReport.parsed.provider === 'unknown'
                        }
                      />

                      <div className={`${finelyOsCatalogCard('violet')} !p-5 backdrop-blur-xl space-y-4`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Free deliverable</div>
                            <div className={`mt-2 ${FINELY_OS_ENTITY_TITLE} text-base`}>Credit Analysis Report (20+ pages)</div>
                            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                              Generates a multi-page PDF with scores, negatives breakdown, and a roadmap. It will be saved into the partner’s record and shown in Letters → Analysis Reports.
                            </div>
                            <button
                              type="button"
                              onClick={() => setTabAndUrl('analysis')}
                              className={`mt-3 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_ACCENT_LINK}`}
                              title="Open the Analysis Report tab"
                            >
                              Open Analysis Report tab <ExternalLink size={16} />
                            </button>
                          </div>
                          <button
                            type="button"
                            className={FINELY_OS_PRIMARY_BTN}
                            disabled={analysisBusy}
                            onClick={() => runGenerateAnalysis(selectedReport)}
                          >
                            {analysisBusy ? 'Generating…' : 'Generate PDF'}
                          </button>
                        </div>
                        {analysisNotice ? (
                          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm ${FINELY_OS_ENTITY_BODY}`}>{analysisNotice}</div>
                        ) : null}
                      </div>
                    <CreditIntelTabs
                      parsed={selectedReport.parsed}
                      reportId={selectedReport.id}
                      partnerId={partner.id}
                      availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
                      onOpenLetterGenerator={() => setTabAndUrl('letters')}
                      onOpenEvidenceVault={() => setEvidencePicker({})}
                      onOpenTasks={() => setTabAndUrl('tasks')}
                    />
                    </div>
                  </>
                ) : selectedReport ? (
                  selectedReport.fileType === 'pdf' ? (
                    <PdfReportFallbackView
                      pdfText={selectedReport.pdfText}
                      pdfMeta={selectedReport.pdfMeta as any}
                      provider={selectedReport.provider as any}
                      reportDate={selectedReport.reportDate}
                      filename={selectedReport.filename}
                      variant="admin"
                    />
                  ) : (
                    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
                      <div className={FINELY_OS_ENTITY_VALUE}>Parsing data missing</div>
                      <div className={FINELY_OS_ENTITY_BODY}>
                        This upload doesn’t currently have parsed tradelines attached. Use <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Re-parse</span> on the left to generate the overview and tradelines.
                      </div>
                    </div>
                  )
                ) : (
                  <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>
                    Upload a report to view parsed tradelines.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'analysis' && (
          <div className="space-y-6">
            <div className={`${FINELY_OS_BANNER} space-y-4`}>
              <div className="min-w-0">
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300`}>Free deliverable</div>
                <div className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>Credit Analysis Report (20+ pages)</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
                  A multi-page PDF with scores, a full negatives breakdown, and a roadmap — free for every partner.
                  Pick an uploaded report and generate it; it saves to the partner’s Documents/Evidence and lists below.
                </div>
              </div>
              {reports.length === 0 ? (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY}`}>
                  No credit report uploaded yet. Upload one in the{' '}
                  <button type="button" onClick={() => setTabAndUrl('reports')} className={FINELY_OS_ENTITY_ACCENT_LINK}>
                    Reports
                  </button>{' '}
                  tab first.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1">
                    <div className={FINELY_OS_ENTITY_LABEL}>Source report</div>
                    <select
                      value={selectedReport?.id ?? ''}
                      onChange={(e) => setSelectedReportId(e.target.value)}
                      className={FINELY_OS_ENTITY_SELECT}
                    >
                      {reports.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.filename || r.id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    className={FINELY_OS_SUCCESS_BTN}
                    disabled={analysisBusy || !selectedReport?.parsed}
                    onClick={() => runGenerateAnalysis(selectedReport)}
                  >
                    <BarChart3 size={14} /> {analysisBusy ? 'Generating…' : 'Generate Free Analysis Report'}
                  </button>
                </div>
              )}
              {selectedReport && !selectedReport.parsed ? (
                <div className={`${FINELY_OS_NOTICE_WARN} text-sm`}>
                  This report isn’t parsed yet, so an analysis can’t be built from it. Re-upload it in the Reports tab.
                </div>
              ) : null}
              {analysisNotice ? (
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm ${FINELY_OS_ENTITY_BODY}`}>{analysisNotice}</div>
              ) : null}
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 backdrop-blur-xl`}>
              <div className="flex items-center justify-between gap-4">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Saved analysis reports</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                  {analysisReports.length} PDF{analysisReports.length === 1 ? '' : 's'}
                </div>
              </div>
              {analysisReports.length === 0 ? (
                <div className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>None yet — generate one above.</div>
              ) : (
                <div className="mt-4">
                  <PartnerCompactGrid
                    items={analysisReports}
                    initialShow={6}
                    columnsClassName="grid md:grid-cols-2 gap-3"
                    emptyMessage="None yet — generate one above."
                    getKey={(r: any) => r.id}
                    renderItem={(r: any) => (
                      <div key={r.id} className={`${finelyOsInlineListItem()} p-5`}>
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{r.filename || 'Credit Analysis Report.pdf'}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                          {fmtWhen(String(r.createdAt || ''))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            void openStoredDocument({ blobRef: String(r?.blobRef || '').trim(), mimeType: 'application/pdf' })
                          }
                          className={`mt-3 ${FINELY_OS_PRIMARY_BTN}`}
                        >
                          Open PDF
                        </button>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'evidence' && (
          <div className="space-y-6">
            {docOpenErr ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{docOpenErr}</div>
            ) : null}
            <EvidenceUploader
              partnerId={partner.id}
              reportId={selectedReport?.id}
              onCreated={(item) => upsertEvidence(item)}
            />
            <EvidenceList
              items={evidence}
              onDelete={(eId) => {
                deleteEvidence(eId);
                setNotesVersion((v) => v + 1);
              }}
              onUpsert={(item) => {
                upsertEvidence(item);
                setNotesVersion((v) => v + 1);
              }}
            />
          </div>
        )}

        {tab === 'letters' && (
          <div className="space-y-6">
            {partner ? (
              <LettersCommandCenter
                partner={partner as any}
                layout="embedded"
                onOpenVault={openSavedLetterVault}
                onOpenReports={() => setTabAndUrl('reports')}
                onOpenDebtCenter={() => setTabAndUrl('debt')}
                onRequestGrantEntitlements={(keys) => {
                  ensurePartnerEntitlements({ partnerId: partner.id, keys: keys as any });
                  setNotesVersion((v) => v + 1);
                }}
              />
            ) : null}

            <div ref={generatedLettersRef}>
            <details className={`${finelyOsCatalogCard('violet')} !p-5`} open>
              <summary className="cursor-pointer list-none flex flex-wrap items-end justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <div>
                  <p className={FINELY_OS_ENTITY_SUBLABEL}>Letters vault</p>
                  <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Saved dispute PDFs — open, mail, or review snapshots.</p>
                </div>
                {letters.length ? (
                  <span className={`${FINELY_OS_ENTITY_CHIP} text-emerald-200 border-emerald-500/30 bg-emerald-500/10`}>
                    {letters.length} saved
                  </span>
                ) : null}
              </summary>
              <div className="mt-4 space-y-3">
                {mailGateErr ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{mailGateErr}</div>
                ) : null}
                {docOpenErr ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{docOpenErr}</div>
                ) : null}
                {mailOpen && partner && mailLetter ? (
                  <MailLetterModal
                    open={mailOpen}
                    partnerId={partner.id}
                    letter={mailLetter}
                    defaultFromName={partner.profile.fullName || 'Partner'}
                    defaultFromAddress={(() => {
                      const route: any = partner.primaryRoute ? (partner.routes as any)?.[partner.primaryRoute] : null;
                      const p = route?.personal ?? null;
                      if (!p) return undefined;
                      return {
                        addressLine1: p.address1 ?? '',
                        addressLine2: p.address2 ?? '',
                        city: p.city ?? '',
                        state: p.state ?? '',
                        zip: p.postalCode ?? '',
                      };
                    })()}
                    onClose={() => {
                      setMailOpen(false);
                      setMailLetter(null);
                    }}
                    onStatus={({ status: st, error, to, from }) => {
                      upsertLetter({
                        ...mailLetter,
                        status: st,
                        mailing: {
                          provider: 'lob',
                          providerId: mailLetter.mailing?.providerId,
                          createdAt: mailLetter.mailing?.createdAt ?? new Date().toISOString(),
                          expectedDeliveryDate: mailLetter.mailing?.expectedDeliveryDate,
                          status: st === 'mail_pending' ? 'pending' : st === 'mail_failed' ? 'failed' : mailLetter.mailing?.status,
                          lastError: st === 'mail_failed' ? (error ?? 'Mailing failed') : undefined,
                          to,
                          from,
                        },
                      });
                      setNotesVersion((v) => v + 1);
                    }}
                    onMailed={({ providerId, expectedDeliveryDate, to, from }) => {
                      const updated = upsertLetter({
                        ...mailLetter,
                        status: 'mailed',
                        mailing: {
                          provider: 'lob',
                          providerId,
                          createdAt: new Date().toISOString(),
                          expectedDeliveryDate,
                          status: 'mailed',
                          to,
                          from,
                        },
                      });
                      addAuditEvent({
                        partnerId: partner.id,
                        actorType: 'admin',
                        actorEmail: auth.user?.email || undefined,
                        action: 'letter.mailed',
                        entityType: 'letter',
                        entityId: updated.id,
                        meta: { provider: 'lob', providerId, expectedDeliveryDate: expectedDeliveryDate ?? null },
                      });
                      onDisputeLetterMailed({ letter: updated, actor: 'admin' });
                      setNotesVersion((v) => v + 1);
                    }}
                  />
                ) : null}
                {letters.length > 0 ? (
                  <div className="mt-4 grid md:grid-cols-4 gap-4">
                    <KpiCard label="Letters" value={letters.length} hint="Total" tone="amber" />
                    <KpiCard
                      label="PDFs"
                      value={letters.filter((x) => Boolean((x as any).pdfBlobRef)).length}
                      hint="Stored"
                      tone="sky"
                    />
                    <KpiCard
                      label="Mailed"
                      value={letters.filter((x) => String((x as any).status || '').toLowerCase() === 'mailed').length}
                      hint="Workflow"
                      tone="emerald"
                    />
                    <KpiCard
                      label="Needs PDF"
                      value={letters.filter((x) => !Boolean((x as any).pdfBlobRef)).length}
                      hint="Not stored"
                      tone="violet"
                    />
                  </div>
                ) : null}

                <div className="mt-4">
                  <PartnerCompactGrid
                    items={letters}
                    initialShow={4}
                    columnsClassName="grid gap-4"
                    emptyMessage="No letters generated yet. Save a PDF from the Letters studio above to see it here."
                    getKey={(l) => l.id}
                    renderItem={(l) => (
                      <SavedLetterCard
                        id={`letter-${l.id}`}
                        letter={l}
                        highlighted={highlightLetterId === l.id}
                        canMail={isFeatureEnabled('letterMailing')}
                        onOpenPdf={() => {
                          const ref = (l as any).pdfBlobRef as string | undefined;
                          if (ref) {
                            void openStoredDocument({ blobRef: ref, mimeType: 'application/pdf' });
                            return;
                          }
                          setDocOpenErr('No PDF stored for this letter — expand Preview letter text below or regenerate the PDF in Disputes.');
                        }}
                        onMail={() => {
                          if (!(l as any).pdfBlobRef) return;
                          setMailGateErr(null);
                          if (l.type === 'dispute') {
                            const idGate = checkIdentityVaultGate(evidence);
                            if (!idGate.ok) {
                              const proceed = window.confirm(
                                `Missing identity docs: ${idGate.missing.map((m) => m.label).join(', ')}. Mail anyway (admin override)?`,
                              );
                              if (!proceed) {
                                setMailGateErr('Mailing blocked — upload ID/address docs or confirm admin override.');
                                return;
                              }
                            }
                            const evGate = checkDisputeLetterEvidenceGate({ letter: l, evidence, soft: true });
                            if (!evGate.ok) {
                              const proceed = window.confirm(`${evGate.message}\n\nMail anyway (admin override)?`);
                              if (!proceed) {
                                setMailGateErr(evGate.message);
                                return;
                              }
                            }
                          }
                          setMailLetter(l as any);
                          setMailOpen(true);
                        }}
                        mailDisabled={!(l as any).pdfBlobRef}
                        pdfDisabled={false}
                        onDelete={
                          canHardDeleteLetters
                            ? () => {
                                const ok = window.prompt('Type DELETE to permanently remove this letter.') === 'DELETE';
                                if (!ok) return;
                                const did = deleteLetter({ letterId: l.id });
                                if (!did) return;
                                addAuditEvent({
                                  partnerId: partner.id,
                                  actorType: 'admin',
                                  actorEmail: auth.user?.email || undefined,
                                  action: 'letter.deleted',
                                  entityType: 'letter',
                                  entityId: l.id,
                                  meta: { type: l.type, title: l.title },
                                });
                                setNotesVersion((v) => v + 1);
                              }
                            : undefined
                        }
                      />
                    )}
                  />
                </div>
              </div>
            </details>
            </div>

            <div ref={analysisReportsRef} className={`mt-6 ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className={FINELY_OS_ENTITY_SUBLABEL}>Analysis reports</p>
                  <div className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>Saved analysis reports (PDF)</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Generated deliverables stored as evidence artifacts for this partner.</div>
                </div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                  {analysisReports.length} PDF{analysisReports.length === 1 ? '' : 's'}
                </div>
              </div>

              {analysisReports.length === 0 ? (
                <div className={`mt-4 ${FINELY_OS_ENTITY_BODY}`}>
                  None yet. Generate one (free) from the <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Reports</span> tab: upload or select a report, then click <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Generate PDF</span> under “Credit Analysis Report.”
                </div>
              ) : (
                <div className="mt-5">
                  <PartnerCompactGrid
                    items={analysisReports}
                    initialShow={6}
                    columnsClassName="grid md:grid-cols-2 gap-3"
                    emptyMessage="No analysis reports yet."
                    getKey={(r: any) => r.id}
                    renderItem={(r: any) => (
                      <div key={r.id} className={`${finelyOsInlineListItem()} p-5`}>
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{r.filename || 'Credit Analysis Report.pdf'}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                          {fmtWhen(String(r.createdAt || ''))} • report_id:{String(r.reportId || '—').slice(0, 8)}
                        </div>
                        {r.caption ? <div className={`mt-2 ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{r.caption}</div> : null}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void openStoredDocument({ blobRef: String(r?.blobRef || '').trim(), mimeType: 'application/pdf' })
                            }
                            className={FINELY_OS_PRIMARY_BTN}
                          >
                            Open PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => setTabAndUrl('evidence')}
                            className={FINELY_OS_SECONDARY_BTN}
                            title="View in Evidence Vault"
                          >
                            View evidence <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {(tab === 'overview' || tab === 'reports' || tab === 'letters' || tab === 'debt') ? (
          <PartnerBureauResourcesPanel />
        ) : null}

        <AdminPartnerAccessPanel partner={partner} onUpdated={() => setPartnerVersion((v) => v + 1)} />

        <section id="partner-client-journey" className={`${finelyOsCatalogCard('emerald')} !p-6 border-t-4 border-emerald-400/40 scroll-mt-8`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Client journey</p>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                Stage control and restore progress — pinned at the bottom of every partner tab so it stays easy to find.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-5">
            <JourneyStageAdminControl
              partner={partner}
              actorEmail={actorEmail}
              onUpdated={() => setPartnerVersion((v) => v + 1)}
            />
            <PartnerCreditRestoreHud
              reportsCount={reports.length}
              negativesCount={candidates.length}
              evidenceCount={evidence.length}
              lettersCount={letters.length}
              openCasesCount={openPartnerCases.length}
              readinessScore={overallScore?.overall ?? null}
              onOpenTab={(t) => setTabAndUrl(t as TabKey)}
              primaryAction={
                !reports.length
                  ? { label: 'Upload report', tab: 'reports' }
                  : !letters.length
                    ? { label: 'Open letters', tab: 'letters' }
                    : { label: 'Letter studio', tab: 'letters' }
              }
            />
            <details className={`${finelyOsCatalogCard('violet')} !p-4 group`}>
              <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Intake links, workflow & legacy status</summary>
              <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                <PartnerIntakeLinkPanel partner={partner} />
                <RoleWorkflowPanel roleId={adminWorkflowId} compact completedSteps={adminWorkflowProgress} />
                <PartnerCreditRestoreMiniRail
                  reportsCount={reports.length}
                  evidenceCount={evidence.length}
                  lettersCount={letters.length}
                  onOpenTab={(t) => setTabAndUrl(t as TabKey)}
                />
                <LegacyApplicationStatusBanner partner={partner} />
              </div>
            </details>
          </div>
        </section>

        <FinelyOsPageFooter />
</div>
    </EntityDetailShell>
  );
}

export default function PartnerDetailPage() {
  return (
    <ErrorBoundary>
      <PartnerDetailPageInner />
    </ErrorBoundary>
  );
}

