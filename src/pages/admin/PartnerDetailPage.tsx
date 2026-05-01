import React, { useEffect, useMemo, useRef, useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Gavel,
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
} from 'lucide-react';
import { downloadBlob } from '../../utils/download';
import { PageShell } from '../../components/layout/PageShell';
import { EntityDetailShell } from '../../components/layout/EntityDetailShell';
import { KpiCard } from '../../components/ui/KpiCards';
import { PdfReportFallbackView } from '../../components/reports/PdfReportFallbackView';
import { deletePartner, getPartner, upsertPartner } from '../../data/partnersRepo';
import { deleteReport, listReportsByPartner, upsertReport } from '../../data/reportsRepo';
import { listEvidenceByPartner, upsertEvidence, deleteEvidence } from '../../data/evidenceRepo';
import { deleteLetter, listLettersByPartner, upsertLetter } from '../../data/lettersRepo';
import { getBlobStore } from '../../storage/getBlobStore';
import { getBlobUrl } from '../../storage/getBlobUrl';
import { openUrlInNewTab } from '../../utils/download';
import { bureauShortCode } from '../../utils/bureaus';
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
import { suggestDisputeReasons } from '../../creditReports/disputeReasons';
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
import { createProject, listProjectsByPartner } from '../../data/projectsRepo';
import { addThreadMessage, getOrCreateThreadBySubject } from '../../data/supportRepo';
import { listPartnerNotesByPartner, createPartnerNote, deletePartnerNote, upsertPartnerNote } from '../../data/partnerNotesRepo';
import { listDebtByPartner } from '../../data/debtRepo';
import { newId } from '../../utils/ids';
import { listNotifications, markAllRead, markNotificationRead, unreadCount } from '../../data/notificationsRepo';
import { getWorkboardSettings, isFeatureEnabled } from '../../data/settingsRepo';
import { MailLetterModal } from '../../components/letters/MailLetterModal';
import { LettersCommandCenter } from '../../components/letters/LettersCommandCenter';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { canDeleteLetters, getMembershipByUserAndTenant } from '../../data/tenantsRepo';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { PartnerRoute } from '../../domain/partners';
import { listCustomFieldDefinitionsByScope } from '../../data/customFieldsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { getFieldLayout } from '../../data/fieldLayoutsRepo';
import { FieldLayoutRenderer } from '../../components/fields/FieldLayoutRenderer';
import { listEntitlementsByPartner } from '../../data/billingRepo';
import { ENTITLEMENT_KEYS, type EntitlementKey, ensurePartnerEntitlements } from '../../billing/entitlements';
import { TASK_PROGRESS_STAGES, WorkBoardShell, WorkCalendarView, WorkKanbanBoard, WorkListView, type WorkBoardItem } from '../../components/workboard';
import type { WorkStageDefinition } from '../../domain/settings';
import type { TaskStatus } from '../../domain/tasks';

type TabKey = 'overview' | 'reports' | 'evidence' | 'disputes' | 'letters' | 'tasks' | 'notes' | 'debt';

function tabBtn(active: boolean) {
  return `px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
    active ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
  }`;
}

function generateDisputeLetter(args: { partnerName: string; candidate: DisputeCandidate }) {
  const { partnerName, candidate } = args;
  const today = new Date().toLocaleDateString();
  return `DATE: ${today}

TO WHOM IT MAY CONCERN,

I am writing to dispute inaccurate and/or unverified information appearing on my credit file with ${candidate.bureau}.

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
  const header = `DATE: ${today}\nROUND: ${round}\nBUREAU: ${candidate.bureau}\n\n`;

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
  const [showAllPartnerNotifs, setShowAllPartnerNotifs] = useState(false);
  const [showAllSystemNotes, setShowAllSystemNotes] = useState(false);
  const [showAllManualNotes, setShowAllManualNotes] = useState(false);
  const [showAllDebtCases, setShowAllDebtCases] = useState(false);
  const didAutoTab = useRef(false);
  const generatedLettersRef = useRef<HTMLDivElement | null>(null);
  const analysisReportsRef = useRef<HTMLDivElement | null>(null);

  const PARTNER_NOTIFS_LIMIT = 10;
  const SYSTEM_NOTES_LIMIT = 10;
  const MANUAL_NOTES_LIMIT = 10;
  const DEBT_CASES_LIMIT = 12;

  useEffect(() => {
    const onStore = () => setNotesVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const partner = useMemo(() => {
    if (!id) return null;
    const p = getPartner(id);
    if (!p || !p.profile || typeof p.profile.fullName !== 'string') return null;
    return p;
  }, [id, partnerVersion]);

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

  const access = useMemo(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u || !id) return { ok: false, reason: 'Not signed in.' };
    if (!partner) return { ok: false, reason: 'Partner not found.' };
    if ((partner as any).tenantId && (partner as any).tenantId !== tenantId) return { ok: false, reason: 'Wrong tenant.' };
    const allowed = getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId });
    if (!allowed.has(partner.id)) return { ok: false, reason: 'Not assigned.' };
    return { ok: true, reason: null as any };
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

  const reports = useMemo(() => (partner ? listReportsByPartner(partner.id) : []), [partner, reportsVersion]);
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
      setFocusedCandidateId(null);
      setSelectedCandidateIds([]);
      return;
    }
    if (focusedCandidateId && candidates.some((c) => c.id === focusedCandidateId)) return;
    const nextFocus = selectedCandidateIds.find((cid) => candidates.some((c) => c.id === cid)) ?? candidates[0].id;
    setFocusedCandidateId(nextFocus);
  }, [candidates, focusedCandidateId, selectedCandidateIds]);

  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidateIds((prev) => {
      const has = prev.includes(candidateId);
      const next = has ? prev.filter((x) => x !== candidateId) : [...prev, candidateId];
      return next;
    });
  };

  const partnerName = partner?.profile.fullName ?? '';
  const actorEmail = auth.user?.email || undefined;

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
        : t === 'reports'
          ? 'reports'
          : t === 'evidence'
            ? 'evidence'
            : t === 'disputes'
              ? 'disputes'
              :       t === 'letters'
                ? 'letters'
                : t === 'notes'
                  ? 'notes'
                  : t === 'debt'
                    ? 'debt'
                    : null;
    if (next && next !== tab) setTab(next);

    // If no explicit tab is requested and this is a brand-new partner with no reports,
    // default them into the Reports tab so the “modules” feel immediately live.
    const hasTabParam = Boolean(sp.get('tab'));
    if (!hasTabParam && !didAutoTab.current) {
      if (reports.length === 0 && tab === 'overview') {
        setTab('reports');
      }
      didAutoTab.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, partner?.id, reports.length]);

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
      const suggestions = suggestDisputeReasons(parsed, c);
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
  }, [partner, selectedReport?.id, selectedReport?.parsed, selectedCandidates, setReasonsVersion]);

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
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/70 text-sm">
            Reason: <span className="font-mono text-white/80">{String(access.reason || 'unknown')}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/partners')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-sm font-medium transition-colors"
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
          return `• ${c.bureau}: ${c.title}${due}`;
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
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
            title="Back to Finely Cred Dashboard"
          >
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="h-4 w-px bg-white/10" />
          <button onClick={() => navigate('/admin/partners')} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Back to Partners
          </button>
        </div>
      }
      headerRight={<div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">partner_id: {partner.id}</div>}
      tabs={[
        { key: 'overview', label: 'Overview', icon: <Layers size={12} className="inline mr-2" /> },
        { key: 'reports', label: 'Reports', icon: <FileText size={12} className="inline mr-2" /> },
        { key: 'evidence', label: 'Evidence', icon: <ShieldAlert size={12} className="inline mr-2" /> },
        { key: 'disputes', label: 'Disputes', icon: <Gavel size={12} className="inline mr-2" /> },
        { key: 'letters', label: 'Letters', icon: <PenLine size={12} className="inline mr-2" /> },
        {
          key: 'tasks',
          label: partnerUnreadNotifs > 0 ? `Tasks (${partnerUnreadNotifs})` : 'Tasks',
          icon: <ListChecks size={12} className="inline mr-2" />,
        },
        { key: 'notes', label: 'Notes', icon: <ScrollText size={12} className="inline mr-2" /> },
        { key: 'debt', label: 'Debt & Summons', icon: <Scale size={12} className="inline mr-2" /> },
      ]}
      activeTabKey={tab}
      onTabChange={(k) => setTab(k as any)}
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
              ? `${evidencePickerCandidate.bureau} • ${evidencePickerCandidate.type}`
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
            setTab('evidence');
          }}
          onClose={() => setEvidencePicker(null)}
          autoPickOnUpload={Boolean(evidencePicker.candidateId)}
        />
      )}
      <div className="space-y-8">
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Partner</p>
                    <p className="mt-2 text-xl font-semibold text-white">{partner.profile.fullName}</p>
                    <p className="mt-1 text-white/50 text-xs">Edit contact + mailing info used across letters.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Status</div>
                    <select
                      value={partner.status}
                      onChange={(e) => {
                        upsertPartner({ ...partner, status: e.target.value as any });
                        setPartnerVersion((v) => v + 1);
                        addAuditEvent({
                          partnerId: partner.id,
                          actorType: 'admin',
                          actorEmail,
                          action: `partner.status_set:${e.target.value}`,
                          entityType: 'partner',
                          entityId: partner.id,
                          meta: { status: e.target.value },
                        });
                        setNotesVersion((v) => v + 1);
                      }}
                      className="mt-2 w-[180px] bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white/80 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                    >
                      <option value="lead">Lead</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Full name</label>
                    <input
                      value={profileDraft.fullName}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, fullName: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Full legal name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Email</label>
                    <input
                      value={profileDraft.email}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Phone</label>
                    <input
                      value={profileDraft.phone}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, phone: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Address line 1</label>
                    <input
                      value={profileDraft.address1}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, address1: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Address line 2</label>
                    <input
                      value={profileDraft.address2}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, address2: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Apt, suite, unit (optional)"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">City</label>
                    <input
                      value={profileDraft.city}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, city: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">State</label>
                    <input
                      value={profileDraft.state}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, state: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="ST"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Postal code</label>
                    <input
                      value={profileDraft.postalCode}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, postalCode: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    onClick={() => {
                      const name = profileDraft.fullName.trim();
                      if (!name) return;
                      const email = profileDraft.email.trim().toLowerCase();
                      const phone = profileDraft.phone.trim();
                      const next = upsertPartner({
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
                    title="Save partner contact + mailing info"
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    onClick={() => {
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
                  >
                    Reset
                  </button>
                </div>

                {actorEmail && isAdminEmail(actorEmail) ? (
                  <div className="mt-6 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-rose-200/80 font-black">Danger zone</div>
                    <div className="mt-2 text-rose-100/80 text-sm">
                      Hard delete removes the partner profile. (This does not yet purge all related records.)
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-[10px] font-black uppercase tracking-widest text-rose-100 transition-all"
                        onClick={() => {
                          setDeleteOpen(true);
                          setDeletePhrase('');
                        }}
                      >
                        Delete partner
                      </button>
                    </div>

                    {deleteOpen ? (
                      <div className="mt-4 rounded-xl border border-rose-500/25 bg-black/30 p-4 space-y-3">
                        <div className="text-white/80 text-sm">
                          Type <span className="font-mono text-rose-200">DELETE</span> to confirm.
                        </div>
                        <input
                          value={deletePhrase}
                          onChange={(e) => setDeletePhrase(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-rose-500 transition-colors"
                          placeholder="DELETE"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={deletePhrase.trim().toUpperCase() !== 'DELETE'}
                            className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                              const ok = deletePartner(partner.id);
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
                          >
                            Confirm delete
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                            onClick={() => setDeleteOpen(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Custom fields</p>
                    <p className="mt-2 text-white/60 text-sm">
                      Extra partner fields (PII, notes, internal attributes) live here. Manage definitions in{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/admin/settings')}
                        className="text-amber-300 hover:text-amber-200 underline underline-offset-4"
                      >
                        Admin Settings
                      </button>
                      .
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                      <span className="px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-white/60 font-mono">
                        tenant: <span className="text-white/80">{tenantId}</span>
                      </span>
                      <span className="px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-white/60">
                        defs <span className="text-white/80">{customDefs.length}</span>
                      </span>
                      <span className="px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-white/60">
                        layout <span className="text-white/80">{partnerFieldLayout ? 'custom' : 'default'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {customDefs.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-white/60 text-sm">
                    No custom fields configured yet.
                  </div>
                ) : (
                  <div className="mt-4">
                    <FieldLayoutRenderer
                      layout={partnerFieldLayout}
                      definitions={customDefs}
                      values={customFieldDraft || {}}
                      onChangeValue={updateCustomField}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Activity</p>
                <p className="mt-2 text-white/60 text-sm">
                  Reports: <span className="text-white/90">{reports.length}</span>
                </p>
                <p className="mt-1 text-white/60 text-sm">
                  Evidence: <span className="text-white/90">{evidence.length}</span>
                </p>
                <p className="mt-1 text-white/60 text-sm">
                  Letters: <span className="text-white/90">{letters.length}</span>
                </p>
                <p className="mt-1 text-white/60 text-sm">
                  Debt / Summons: <span className="text-white/90">{debtCases.length}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Timestamps</p>
                <p className="mt-2 text-white/60 text-sm">
                  Created: <span className="text-white/90">{new Date(partner.createdAt).toLocaleString()}</span>
                </p>
                <p className="mt-1 text-white/60 text-sm">
                  Updated: <span className="text-white/90">{new Date(partner.updatedAt).toLocaleString()}</span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Identity source</p>
                <p className="mt-2 text-white/60 text-sm">
                  Route: <span className="text-white/90">{String(profileRouteKey).replaceAll('_', ' ')}</span>
                </p>
                <p className="mt-1 text-white/60 text-sm">
                  Claimed: <span className="text-white/90">{partner.claimedUserId ? 'Yes' : 'No'}</span>
                </p>
                <p className="mt-1 text-white/60 text-sm">
                  Tenant: <span className="text-white/90 font-mono">{partner.tenantId}</span>
                </p>
              </div>
            </div>

            {overallScore ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <KpiCard
                    label="Overall score"
                    value={overallScore.overall}
                    hint="Profile + execution readiness"
                    tone={overallScore.overall >= 80 ? 'emerald' : overallScore.overall >= 60 ? 'amber' : 'violet'}
                  />
                  <KpiCard label="Open tasks" value={openPartnerTasks.length} hint="Queue" tone="amber" />
                  <KpiCard label="Open cases" value={openPartnerCases.length} hint="Disputes" tone="emerald" />
                  <KpiCard label="Top improvements" value={overallScore.topActions.length} hint="Fast wins" tone="sky" />
                </div>

                {overallScore.topActions.length ? (
                  <details className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
                    <summary className="cursor-pointer select-none text-white font-semibold">Top improvements</summary>
                    <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overallScore.topActions.slice(0, 6).map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => navigate(a.path || `/portal/dashboard?debugUi=1`)}
                          className="text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-5 transition-all"
                          title={a.path ? `Open ${a.path}` : 'Open'}
                        >
                          <div className="text-[10px] uppercase tracking-widest text-amber-400">
                            {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                          </div>
                          <div className="mt-2 text-white font-semibold">{a.title}</div>
                          <div className="mt-2 text-white/60 text-sm">{a.desc}</div>
                          <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                            Open <ArrowRight size={12} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Portal entitlements</p>
                  <p className="mt-2 text-white/60 text-sm">
                    These keys control which Partner Portal modules show up (Templates, Debt/Validation/Court, Disputes, etc.).
                  </p>
                  <p className="mt-1 text-white/40 text-xs font-mono">
                    Active: {Array.from(activeEntitlementKeys).length} • Missing: {missingEntitlementKeys.length}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    onClick={() => {
                      if (!partner) return;
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
                    title="Grant every portal module entitlement to this partner (dev/admin utility)"
                  >
                    Grant all portal modules
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    onClick={() => setNotesVersion((v) => v + 1)}
                    title="Refresh entitlements list"
                  >
                    <RefreshCcw size={14} /> Refresh
                  </button>
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Active keys</div>
                  {Array.from(activeEntitlementKeys).length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Array.from(activeEntitlementKeys)
                        .sort()
                        .map((k) => (
                          <span key={k} className="px-2 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 text-[10px] font-black tracking-widest">
                            {k}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-white/50 text-sm">None</div>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Missing keys</div>
                  {missingEntitlementKeys.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {missingEntitlementKeys
                        .slice()
                        .sort()
                        .map((k) => (
                          <span key={k} className="px-2 py-1 rounded-full border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black tracking-widest">
                            {k}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <div className="mt-2 text-white/50 text-sm">None</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/40">Debt-to-income (DTI)</p>
                    <p className="mt-2 text-white/60 text-sm">
                      Enter partner-provided income + monthly obligations to compute DTI. (Used for underwriting readiness and planning.)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">DTI</div>
                    <div className="mt-1 text-2xl font-semibold text-white">{dti == null ? '-' : `${dti}%`}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Annual income</label>
                    <input
                      type="number"
                      value={financialDraft.annualIncome}
                      onChange={(e) => setFinancialDraft((p) => ({ ...p, annualIncome: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="90000"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Monthly debt payments</label>
                    <input
                      type="number"
                      value={financialDraft.monthlyDebtPayments}
                      onChange={(e) => setFinancialDraft((p) => ({ ...p, monthlyDebtPayments: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="850"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Monthly housing</label>
                    <input
                      type="number"
                      value={financialDraft.monthlyHousing}
                      onChange={(e) => setFinancialDraft((p) => ({ ...p, monthlyHousing: e.target.value }))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="1700"
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    onClick={() => {
                      const annual = Number(financialDraft.annualIncome);
                      const debt = Number(financialDraft.monthlyDebtPayments);
                      const housing = Number(financialDraft.monthlyHousing);
                      upsertPartner({
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
                  >
                    Save DTI inputs
                  </button>
                  <div className="text-[11px] text-white/40">
                    DTI formula: \( (monthlyDebt + monthlyHousing) \div (annualIncome/12) \)
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Custom Denefits contract</p>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                  <div className="text-white/80 text-sm">
                    Assign any Denefits embed/contract URL directly to this partner (independent of packages). The partner will see it in{' '}
                    <span className="font-mono text-white/80">/portal/billing</span>.
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Contract URL</label>
                      <input
                        value={denefitsContractUrlDraft}
                        onChange={(e) => setDenefitsContractUrlDraft(e.target.value)}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm font-mono"
                        placeholder="https://… (Denefits embed/contract URL)"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Label (optional)</label>
                      <input
                        value={denefitsContractLabelDraft}
                        onChange={(e) => setDenefitsContractLabelDraft(e.target.value)}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        placeholder="e.g. Custom contract — AU bundle"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60"
                      disabled={!denefitsContractUrlDraft.trim()}
                      onClick={() => {
                        const url = denefitsContractUrlDraft.trim();
                        let ok = true;
                        try {
                          // eslint-disable-next-line no-new
                          new URL(url);
                        } catch {
                          ok = false;
                        }
                        if (!ok) {
                          window.alert('Invalid contract URL.');
                          return;
                        }
                        upsertPartner({
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
                    >
                      Assign contract
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      onClick={() => {
                        setDenefitsContractUrlDraft(partner.denefits?.contractUrl ?? '');
                        setDenefitsContractLabelDraft(partner.denefits?.label ?? '');
                      }}
                      title="Discard unsaved changes"
                    >
                      Revert
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all"
                      onClick={() => {
                        upsertPartner({ ...partner, denefits: undefined });
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
                      title="Remove assigned contract from partner"
                    >
                      Clear
                    </button>
                    {partner.denefits?.contractUrl ? (
                      <a
                        href={partner.denefits.contractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/15 transition-all"
                      >
                        Open current
                      </a>
                    ) : null}
                  </div>
                  {partner.denefits?.assignedAt ? (
                    <div className="text-white/40 text-xs font-mono">
                      Assigned: {new Date(partner.denefits.assignedAt).toLocaleString()}
                      {partner.denefits.assignedByEmail ? ` • by ${partner.denefits.assignedByEmail}` : ''}
                    </div>
                  ) : null}
                </div>

                <p className="text-[10px] uppercase tracking-widest text-white/40">Scores (latest report)</p>
                {latestScoresRows.length ? (
                  <div className="space-y-3">
                    {latestScoresRows.map((r) => (
                      <div key={r.model} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="text-white font-semibold">{r.model}</div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                          <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                            <div className="text-white/40 uppercase tracking-widest text-[9px]">EXP</div>
                            <div className="text-white/80 font-mono">{r.exp ?? '-'}</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                            <div className="text-white/40 uppercase tracking-widest text-[9px]">EQF</div>
                            <div className="text-white/80 font-mono">{r.eqf ?? '-'}</div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-black/30 p-2">
                            <div className="text-white/40 uppercase tracking-widest text-[9px]">{bureauShortCode('TUC')}</div>
                            <div className="text-white/80 font-mono">{r.tuc ?? '-'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">
                    No score values detected yet. Upload an HTML report that includes score summary (some exports omit it).
                  </div>
                )}

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-white/60 space-y-2">
                  <div className="text-white/80 font-semibold">Model cheat-sheet</div>
                  <div>FICO 8: common general lending score.</div>
                  <div>Mortgage classics: EQF FICO 5, EXP FICO 2, Trans FICO 4 (many lenders still use these).</div>
                  <div>VantageScore: common in monitoring apps; underwriting may differ by lender/product.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-amber-400">
                      <ListChecks size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Partner task queue</span>
                    </div>
                    <p className="mt-2 text-white/60 text-sm">
                      Tasks are the partner’s action queue. Letters auto-generate mail + follow-up tasks, and automations can generate evidence upload tasks.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Open</div>
                    <div className="mt-1 text-2xl font-semibold text-white">
                      {partnerTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Create task</div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Title</label>
                      <input
                        value={tasksDraftTitle}
                        onChange={(e) => setTasksDraftTitle(e.target.value)}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Example: Upload proof of address + updated ID"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Project</label>
                      <select
                        value={tasksDraftProjectId}
                        onChange={(e) => setTasksDraftProjectId(e.target.value)}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
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
                        <div className="mt-2 text-[11px] text-white/50">
                          No projects yet. Creating a task will auto-create a default project.
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Kind</label>
                      <select
                        value={tasksDraftKind}
                        onChange={(e) => setTasksDraftKind(e.target.value as any)}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      >
                        <option value="general">General</option>
                        <option value="mail_letter">Mail letter</option>
                        <option value="follow_up">Follow up</option>
                        <option value="upload_document">Upload document</option>
                        <option value="review_results">Review results</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Due date (optional)</label>
                      <input
                        type="date"
                        value={tasksDraftDueAt}
                        onChange={(e) => setTasksDraftDueAt(e.target.value)}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Notes (optional)</label>
                      <textarea
                        value={tasksDraftNotes}
                        onChange={(e) => setTasksDraftNotes(e.target.value)}
                        rows={3}
                        className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                        placeholder="Internal context and what to ask for."
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
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
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      onClick={() => setNotesVersion((v) => v + 1)}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <WorkBoardShell
                    view={tasksView}
                    onViewChange={setTasksView}
                    stages={TASK_PROGRESS_STAGES}
                    stageFilter={taskCategoryFilter}
                    onStageFilterChange={setTaskCategoryFilter}
                    stageFilterStages={taskStageDefs}
                  />

                  {partnerTasks.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60 text-sm">
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

              <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center gap-2 text-amber-400">
                    <Bell size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Partner notifications</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    unread: <span className="text-white/80">{partnerUnreadNotifs}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {partnerNotifs.length > PARTNER_NOTIFS_LIMIT ? (
                      <button
                        type="button"
                        onClick={() => setShowAllPartnerNotifs((v) => !v)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        title={showAllPartnerNotifs ? 'Show less' : 'Show all notifications'}
                      >
                        {showAllPartnerNotifs ? 'Show less' : `Show all (${partnerNotifs.length})`}
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        markAllRead({ partnerId: partner.id, audience: 'partner' });
                        setNotesVersion((v) => v + 1);
                      }}
                      disabled={!partnerUnreadNotifs}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesVersion((v) => v + 1)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {partnerNotifs.length === 0 ? (
                    <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-white/60 text-sm">
                      No notifications yet. They’ll appear when tasks are created/updated, support replies are sent, letters are generated, or cases change.
                    </div>
                  ) : (
                    (showAllPartnerNotifs ? partnerNotifs : partnerNotifs.slice(0, PARTNER_NOTIFS_LIMIT)).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          markNotificationRead(n.id);
                          setNotesVersion((v) => v + 1);
                        }}
                        className={`w-full text-left rounded-2xl border p-4 transition-all ${
                          n.readAt
                            ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.03]'
                            : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{n.title}</div>
                            {n.body && <div className="mt-1 text-white/70 text-sm whitespace-pre-wrap">{n.body}</div>}
                            <div className="mt-2 text-[10px] uppercase tracking-widest text-white/40 font-mono">
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
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Auto notes</p>
                <p className="mt-2 text-white/60 text-sm">
                  These are generated from tasks, cases, letters, and audit events — giving you an always-up-to-date “what’s next / what happened” timeline.
                </p>
                <div className="mt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {systemNotes.length > SYSTEM_NOTES_LIMIT ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                        onClick={() => setShowAllSystemNotes((v) => !v)}
                        title={showAllSystemNotes ? 'Show less' : 'Show all auto notes'}
                      >
                        {showAllSystemNotes ? 'Show less' : `Show all (${systemNotes.length})`}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      onClick={() => setNotesVersion((v) => v + 1)}
                      title="Refresh auto notes"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {(showAllSystemNotes ? systemNotes : systemNotes.slice(0, SYSTEM_NOTES_LIMIT)).map((n) => (
                    <div key={`${n.createdAt}-${n.title}`} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{n.title}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                            {new Date(n.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <pre className="mt-3 whitespace-pre-wrap text-white/70 text-sm leading-relaxed">{n.body}</pre>
                    </div>
                  ))}
              </div>
            </div>

            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Manual notes</p>
                <p className="mt-2 text-white/60 text-sm">
                  Use this for call summaries, promises made, missing docs, partner tone, objections, and underwriting context. (Internal by default.)
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Add note</label>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                  placeholder="Example: 2/2 call — partner will upload updated ID + proof of address by Friday. Wants business route, high urgency, funding target $75k. Needs help with utilization plan."
                />
                <div className="flex flex-wrap items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                    <input
                      type="checkbox"
                      checked={notesVisibleToPartner}
                      onChange={(e) => setNotesVisibleToPartner(e.target.checked)}
                      className="accent-amber-500"
                    />
                    Visible to partner
                  </label>
                  <label className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                    <input
                      type="checkbox"
                      checked={notesPinned}
                      onChange={(e) => setNotesPinned(e.target.checked)}
                      className="accent-amber-500"
                    />
                    Pinned
                  </label>
                  <div className="text-[11px] text-white/40">
                    Partner will only see notes marked visible (recommended: actionable next steps).
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
                  <div className="text-[11px] text-white/40">
                    Notes saved: <span className="text-white/70 font-mono">{manualNotes.length}</span>
                  </div>
                  {manualNotes.length > MANUAL_NOTES_LIMIT ? (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      onClick={() => setShowAllManualNotes((v) => !v)}
                      title={showAllManualNotes ? 'Show less' : 'Show all manual notes'}
                    >
                      {showAllManualNotes ? 'Show less' : `Show all (${manualNotes.length})`}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {manualNotes.length === 0 ? (
                  <div className="md:col-span-2 text-white/50 text-sm">No manual notes yet.</div>
                ) : (
                  manualNotes
                    .slice()
                    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.createdAt.localeCompare(a.createdAt))
                    .slice(0, showAllManualNotes ? 999 : MANUAL_NOTES_LIMIT)
                    .map((n) => (
                      <div key={n.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white font-semibold truncate">{n.title || 'Note'}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                            {new Date(n.createdAt).toLocaleString()}
                            {n.authorEmail ? ` • ${n.authorEmail}` : ''}
                            {n.visibility === 'partner' ? ' • partner-visible' : ' • internal'}
                            {n.pinned ? ' • pinned' : ''}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            type="button"
                            className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                              n.visibility === 'partner'
                                ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                                : 'border-white/10 bg-black/30 text-white/70 hover:bg-white/[0.03]'
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
                              n.pinned
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
                                : 'border-white/10 bg-black/30 text-white/70 hover:bg-white/[0.03]'
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
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70"
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
                      <pre className="mt-3 whitespace-pre-wrap text-white/75 text-sm leading-relaxed">{n.body}</pre>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'debt' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <p className="text-[10px] uppercase tracking-widest text-white/40">Debt & Summons cases</p>
              <p className="mt-2 text-white/60 text-sm">
                This partner manages debt and summons cases in their portal. Here you see the list; they get validation requests, affidavits, summons answers (e.g. 35-day), and full legal basis at <strong className="text-white/80">Debt & Summons Center</strong>.
              </p>
              <a
                href={`/portal/debt`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
              >
                <ExternalLink size={14} /> Open Debt Center (partner view)
              </a>
            </div>
            {debtCases.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/50 text-sm">
                No debt or summons cases for this partner yet. They can add cases from their portal (Debt & Summons Center).
              </div>
            ) : (
              <div className="space-y-3">
                {debtCases.length > DEBT_CASES_LIMIT ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      onClick={() => setShowAllDebtCases((v) => !v)}
                      title={showAllDebtCases ? 'Show less' : 'Show all debt cases'}
                    >
                      {showAllDebtCases ? 'Show less' : `Show all (${debtCases.length})`}
                    </button>
                  </div>
                ) : null}
                <div className="grid md:grid-cols-2 gap-3">
                  {(showAllDebtCases ? debtCases : debtCases.slice(0, DEBT_CASES_LIMIT)).map((d) => (
                    <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-white font-semibold truncate">{d.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">
                        {(d.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} · {d.type} · {d.status}
                        {d.courtCaseNumber ? ` · ${d.courtCaseNumber}` : ''}
                      </div>
                    </div>
                    <a
                      href={`/portal/debt/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest"
                    >
                      View <ExternalLink size={12} />
                    </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="space-y-6">
            <ReportUploader
              partnerId={partner.id}
              uploadedBy="admin"
              onCreated={(r) => {
                upsertReport(r);
                setSelectedReportId(r.id);
                setReportsVersion((v) => v + 1);
              }}
            />

            <div className="grid lg:grid-cols-12 gap-6">
              <div className="order-2 lg:order-1 lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Reports</p>

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

                <div className="mt-4 space-y-3">
                  {reports.length === 0 ? (
                    <div className="text-white/50 text-sm">No reports uploaded for this Partner.</div>
                  ) : (
                    reports.map((r) => (
                      <div
                        key={r.id}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          (selectedReportId ?? reports[0]?.id) === r.id
                            ? 'border-amber-500/40 bg-amber-500/10'
                            : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
                        }`}
                      >
                        <button type="button" onClick={() => setSelectedReportId(r.id)} className="w-full text-left">
                          <div className="text-white font-semibold truncate">{r.filename}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {r.fileType} • {r.provider} • {new Date(r.receivedAt).toLocaleString()}
                          </div>
                        </button>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="text-[10px] uppercase tracking-widest text-white/30 font-mono">report_id: {r.id}</div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-60 disabled:cursor-not-allowed"
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
                                  setReportsVersion((v) => v + 1);
                                } catch (err: any) {
                                  setReparseReportErr(err?.message || 'Re-parse failed.');
                                } finally {
                                  setReparseReportId(null);
                                }
                              }}
                            >
                              <RefreshCcw size={14} className="text-amber-300" /> {reparseReportId === r.id ? 'Re-parsing…' : 'Re-parse'}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 disabled:opacity-60 disabled:cursor-not-allowed"
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
                                  setReportsVersion((v) => v + 1);
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
                    ))
                  )}
                </div>
              </div>

              <div className="order-1 lg:order-2 lg:col-span-8">
                {selectedReport?.parsed ? (
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

                      <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-widest text-white/40">Premium deliverable</div>
                            <div className="mt-2 text-white font-semibold">Credit Analysis Report (20+ pages)</div>
                            <div className="mt-1 text-white/60 text-sm">
                              Generates a multi-page PDF with scores, negatives breakdown, and a roadmap. It will be saved into the partner’s record and shown in Letters → Analysis Reports.
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setTab('letters');
                                window.setTimeout(() => {
                                  analysisReportsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 60);
                              }}
                              className="mt-3 inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 text-sm"
                              title="Jump to Analysis Reports section"
                            >
                              View saved analysis reports <ExternalLink size={16} />
                            </button>
                          </div>
                          <button
                            type="button"
                            disabled={analysisBusy}
                            onClick={async () => {
                              if (!partner || !selectedReport?.parsed) return;
                              setAnalysisNotice(null);
                              setAnalysisBusy(true);
                              try {
                                const candidates = deriveDisputeCandidates(selectedReport.parsed, selectedReport.id);
                                const { blob, filename, pages } = await generateCreditAnalysisReportPdf({
                                  partner: partner as any,
                                  report: selectedReport as any,
                                  candidates,
                                });
                                const store = getBlobStore();
                                const put = await store.put(blob, { partnerId: partner.id, reportId: selectedReport.id, kind: 'analysis_report' });
                                const item = {
                                  id: newId('evidence'),
                                  partnerId: partner.id,
                                  reportId: selectedReport.id,
                                  type: 'upload' as const,
                                  source: 'upload' as const,
                                  caption: `Credit Analysis Report • ${selectedReport.filename}`,
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
                                  meta: { pages, filename, reportId: selectedReport.id },
                                });
                                setAnalysisNotice(`Generated and saved (${pages} pages). View it in Letters → Analysis Reports.`);
                                setTab('letters');
                                window.setTimeout(() => {
                                  analysisReportsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 60);
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
                        {analysisNotice ? (
                          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/70">{analysisNotice}</div>
                        ) : null}
                      </div>
                    <CreditIntelTabs
                      parsed={selectedReport.parsed}
                      reportId={selectedReport.id}
                      partnerId={partner.id}
                      availableReports={reports.map((r) => ({ id: r.id, receivedAt: r.receivedAt, filename: r.filename, parsed: r.parsed }))}
                      onOpenLetterGenerator={() => setTab('disputes')}
                      onOpenEvidenceVault={() => setEvidencePicker({})}
                      onOpenTasks={() => setTab('tasks')}
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
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-white/70 space-y-3">
                      <div className="text-white font-semibold">Parsing data missing</div>
                      <div className="text-white/60 text-sm">
                        This upload doesn’t currently have parsed tradelines attached. Use <span className="text-white/80 font-semibold">Re-parse</span> on the left to generate the overview and tradelines.
                      </div>
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-white/60">
                    Upload a report to view parsed tradelines.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'evidence' && (
          <div className="space-y-6">
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

        {tab === 'disputes' && (
          <div className="space-y-6">
            {partner ? (
              <LettersCommandCenter
                partner={partner as any}
                layout="embedded"
                onOpenVault={() => setTab('letters')}
                onOpenReports={() => setTab('reports')}
                onOpenDebtCenter={() => setTab('debt')}
                onRequestGrantEntitlements={(keys) => {
                  ensurePartnerEntitlements({ partnerId: partner.id, keys: keys as any });
                  setNotesVersion((v) => v + 1);
                }}
              />
            ) : null}
          </div>
        )}

        {tab === 'letters' && (
          <div className="space-y-6">
            {partner ? (
              <LettersCommandCenter
                partner={partner as any}
                layout="embedded"
                onOpenVault={() => generatedLettersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                onOpenReports={() => setTab('reports')}
                onOpenDisputeCenter={() => setTab('disputes')}
                onOpenDebtCenter={() => setTab('debt')}
                onRequestGrantEntitlements={(keys) => {
                  ensurePartnerEntitlements({ partnerId: partner.id, keys: keys as any });
                  setNotesVersion((v) => v + 1);
                }}
              />
            ) : null}

            <div ref={generatedLettersRef} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
              <p className="text-[10px] uppercase tracking-widest text-white/40">Generated letters</p>
              <div className="mt-4 space-y-3">
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
                      createTask({
                        partnerId: partner.id,
                        title: `Follow up: bureau response window for "${updated.title}"`,
                        kind: 'follow_up',
                        status: 'pending',
                        stage: 'disputes',
                        dueAt: addDaysIso(nowIso(), 35),
                        relatedLetterId: updated.id,
                        notes: 'Watch for bureau response mail. Upload the response immediately when it arrives.',
                        assignedTo: 'both',
                      });
                      setNotesVersion((v) => v + 1);
                    }}
                  />
                ) : null}
                {letters.length === 0 ? (
                  <div className="text-white/50 text-sm">No letters generated yet.</div>
                ) : (
                  <>
                    {/* KPI row */}
                    <div className="grid md:grid-cols-4 gap-4">
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

                    {/* Modern: collapsible letter cards (page scroll, no internal scroll panes) */}
                    <div className="grid lg:grid-cols-2 gap-4">
                      {letters.map((l) => {
                        const status = String((l as any).status || '').trim();
                        const statusChip =
                          status.toLowerCase() === 'mailed'
                            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
                            : status.toLowerCase() === 'generated'
                              ? 'border-amber-500/25 bg-amber-500/10 text-amber-200'
                              : 'border-white/10 bg-white/[0.02] text-white/55';
                        const created = new Date(l.createdAt);
                        const createdLabel = Number.isFinite(created.getTime()) ? created.toLocaleString() : l.createdAt;

                        return (
                          <details key={l.id} className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-5">
                            <summary className="cursor-pointer select-none">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-white font-semibold truncate">{l.title}</div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                      {createdLabel}
                                    </span>
                                    {status ? (
                                      <span className={`px-2 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusChip}`}>
                                        {status}
                                      </span>
                                    ) : null}
                                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                      {l.pdfFilename ? `PDF: ${l.pdfFilename}` : (l as any).pdfBlobRef ? 'PDF stored' : 'PDF not stored'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {(l as any).pdfBlobRef ? (
                                    <button
                                      type="button"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const ref = (l as any).pdfBlobRef as string | undefined;
                                        if (!ref) return;
                                        const res = await getBlobUrl(ref, { mimeType: 'application/pdf' });
                                        if (!res?.url) return;
                                        openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
                                      }}
                                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                                    >
                                      Open PDF
                                    </button>
                                  ) : null}
                                  {isFeatureEnabled('letterMailing') ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!(l as any).pdfBlobRef) return;
                                        setMailLetter(l as any);
                                        setMailOpen(true);
                                      }}
                                      disabled={!(l as any).pdfBlobRef}
                                      className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                      title="Mail this letter (US only)"
                                    >
                                      <Send size={14} className="inline mr-2" />
                                      Mail
                                    </button>
                                  ) : null}
                                  {canHardDeleteLetters ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
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
                                      }}
                                      className="px-3 py-2 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 text-[10px] font-black uppercase tracking-widest text-red-100/90 transition-all"
                                      title="Admin-only: permanently delete this letter"
                                    >
                                      <Trash2 size={14} className="inline mr-2" />
                                      Delete
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </summary>

                            <div className="mt-4 pt-4 border-t border-white/10">
                              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-[12px] text-white/75 leading-relaxed">
                                <div dangerouslySetInnerHTML={{ __html: l.body }} />
                              </div>
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div ref={analysisReportsRef} className="mt-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-white/40">Analysis reports</p>
                  <div className="mt-2 text-white font-semibold">Saved analysis reports (PDF)</div>
                  <div className="mt-1 text-white/60 text-sm">Generated deliverables stored as evidence artifacts for this partner.</div>
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  {analysisReports.length} PDF{analysisReports.length === 1 ? '' : 's'}
                </div>
              </div>

              {analysisReports.length === 0 ? (
                <div className="mt-4 text-white/60 text-sm">
                  None yet. Generate one from the <span className="text-white/85 font-semibold">Reports</span> tab (Premium deliverable).
                </div>
              ) : (
                <div className="mt-5 grid lg:grid-cols-2 gap-4">
                  {analysisReports.slice(0, 12).map((r: any) => (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="text-white font-semibold truncate">{r.filename || 'Credit Analysis Report.pdf'}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {fmtWhen(String(r.createdAt || ''))} • report_id:{String(r.reportId || '—').slice(0, 8)}
                      </div>
                      {r.caption ? <div className="mt-2 text-white/60 text-sm line-clamp-2">{r.caption}</div> : null}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const ref = String(r?.blobRef || '').trim();
                            if (!ref) return;
                            const res = await getBlobUrl(ref, { mimeType: 'application/pdf' });
                            if (!res?.url) return;
                            openUrlInNewTab({ url: res.url, revoke: res.revoke, revokeAfterMs: 60_000 });
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all"
                        >
                          Open PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab('evidence')}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          title="View in Evidence Vault"
                        >
                          View evidence <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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

