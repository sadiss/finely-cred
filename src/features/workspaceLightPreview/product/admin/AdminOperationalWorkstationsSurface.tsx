import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Gavel,
  Inbox,
  Target,
  Users,
  Sparkles,
  UserRoundCheck,
  FileCheck2,
  ShieldCheck,
  Building2,
  FileText,
  Check,
  Phone,
  Mail,
  KeyRound,
  UserPlus,
  Layers,
  Activity,
  Plus,
  X,
  Eye,
  Trash2,
  MoveRight,
  GripVertical,
  AlertCircle,
  Search,
  StickyNote,
  Undo2,
  Link2,
  MessageSquare,
  CalendarClock,
  UserCog,
  Filter,
  Scale,
} from 'lucide-react';
import {
  listCrmRecords,
  setCrmRecordStage,
  convertCrmRecordToPartner,
  createCrmInboundLead,
  addCrmRecordNote,
} from '../../../../data/crmRecordsRepo';
import { isClosedStage, type CrmRecord, type CrmRecordStage, crmRecordDisplayName } from '../../../../domain/crmRecords';
import { listTasks, setTaskStatus, toggleTaskChecklistItem, createTask, upsertTask } from '../../../../data/tasksRepo';
import type { TaskItem, TaskStatus } from '../../../../domain/tasks';
import {
  listCases,
  markCaseRoundMailed,
  markCaseRoundResponseReceived,
  createDisputeCase,
  updateCaseRound,
} from '../../../../data/casesRepo';
import type { DisputeCase } from '../../../../domain/cases';
import { inferRoundStatus, getLatestCaseRound, suggestNextRound, ROUND_STATUS_LABELS } from '../../../../domain/disputeWorkflow';
import type { DisputeRoundLabel, DisputeRoundStatus, DisputeCaseAction } from '../../../../domain/disputeWorkflow';
import type { ResponseOutcome } from '../../../../domain/disputeRoundResponsePlaybook';
import { listDisputeActionsByCase, recordDisputeCaseAction } from '../../../../data/disputeWorkflowRepo';
import { bureauShortCode } from '../../../../utils/bureaus';
import type { Bureau } from '../../../../domain/creditReports';
import { trashLead, listLeadTrash, restoreLead, emptyLeadTrash } from '../../../../features/studioCommandOs/leadTrashRepo';
import type { LeadTrashRecord } from '../../../../features/studioCommandOs/types';
import { listMemberships } from '../../../../data/tenantsRepo';
import { FINELY_TENANT_ID, type Membership } from '../../../../domain/tenants';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { fetchAllPartnersAsAdmin } from '../../../../data/partnersRepo';
import type { Partner } from '../../../../domain/partners';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import {
  AdminContextCommand,
  AdminSignalRail,
  AdminStageHero,
  AdminStageShell,
  type AdminStageNavItem,
  type AdminStageSignal,
} from '../components/ProductAdminStage';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN } from '../../../os/finelyOsLightUi';
import { CrmAICopilotPanel } from '../../../crm/components/CrmAICopilotPanel';
import { CourtListenerOpinionSearch } from '../../../admin/CourtListenerOpinionSearch';
import { buildDailyBriefing } from '../../../ai/briefing/buildDailyBriefing';
import { listAllSlaBreaches } from '../../../work/sla/listSlaBreaches';
import { unreadCount } from '../../../../data/notificationsRepo';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import AdminCrmRecordPage from '../../../../pages/admin/AdminCrmRecordPage';
import AdminCaseDetailPage from '../../../../pages/admin/AdminCaseDetailPage';
import './adminOperationalWorkstations.css';
import './adminInboxProductSurface.css';

function formatFreshness(iso?: string): string {
  if (!iso) return 'just now';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? '1 month ago' : `${months} months ago`;
}

function WorkflowDailyBriefingStrip({ tasks }: { tasks: TaskItem[] }) {
  const navigate = useNavigate();
  const briefing = useMemo(() => {
    try {
      return buildDailyBriefing({
        openTasks: tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
        crmRecords: listCrmRecords(),
        unreadCount: unreadCount({ audience: 'admin' }),
        slaBreaches: listAllSlaBreaches(),
      });
    } catch {
      return null;
    }
  }, [tasks]);

  if (!briefing || briefing.items.length === 0) return null;

  return (
    <section className="fc-wlp-op-daily-focus-strip" aria-label="What needs you now">
      <header className="fc-wlp-op-daily-focus-head">
        <span>Today</span>
        <h2>What needs you now</h2>
        <p>{briefing.summary}</p>
      </header>
      <div className="fc-wlp-op-daily-focus-grid">
        {briefing.items.slice(0, 6).map((item, index) => {
          const accent = (['rose', 'violet', 'sky', 'emerald'] as const)[index % 4];
          return (
            <button
              key={item.id}
              type="button"
              className="fc-wlp-op-daily-focus-card"
              data-fc-accent={accent}
              onClick={() => item.href && navigate(item.href)}
            >
              <div className="fc-wlp-op-daily-focus-kind">{item.kind}</div>
              <div className="fc-wlp-op-daily-focus-title">{item.title}</div>
              <div className="fc-wlp-op-daily-focus-sub">{item.subtitle}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function adminWorkspacePath(pathname: string, pageId: string, suffix = ''): string {
  return pathname.startsWith('/preview/workspace-light')
    ? `/preview/workspace-light/admin/${pageId}${suffix}`
    : `/admin/${pageId}${suffix}`;
}

/** Live CRM record deep-link; preview uses ?recordId= on the CRM hub. */
function crmRecordHref(pathname: string, recordId: string): string {
  if (pathname.startsWith('/preview/workspace-light')) {
    return `/preview/workspace-light/admin/crm?recordId=${encodeURIComponent(recordId)}`;
  }
  return `/admin/crm/records/${encodeURIComponent(recordId)}`;
}

function crmHubHref(pathname: string): string {
  return adminWorkspacePath(pathname, 'crm');
}

/** Live case deep-link; preview uses ?caseId= on the cases hub. */
function caseRecordHref(pathname: string, caseId: string): string {
  if (pathname.startsWith('/preview/workspace-light')) {
    return `/preview/workspace-light/admin/cases?caseId=${encodeURIComponent(caseId)}`;
  }
  return `/admin/cases/${encodeURIComponent(caseId)}`;
}

function casesHubHref(pathname: string): string {
  return adminWorkspacePath(pathname, 'cases');
}

function formatCents(cents?: number): string {
  if (!cents || cents <= 0) return '$0';
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function ageInDays(iso?: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 86_400_000));
}

function isOverdueTask(task: TaskItem): boolean {
  if (!task.dueAt) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  return Date.parse(task.dueAt) < Date.now();
}

function isDueTodayTask(task: TaskItem): boolean {
  if (!task.dueAt) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  const due = new Date(task.dueAt);
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

function priorityWeight(p?: string) {
  if (p === 'urgent') return 4;
  if (p === 'high') return 3;
  if (p === 'normal') return 2;
  return 1;
}

function compareWorkflowTasks(a: TaskItem, b: TaskItem): number {
  const od = Number(isOverdueTask(b)) - Number(isOverdueTask(a));
  if (od !== 0) return od;
  const pw = priorityWeight(b.priority) - priorityWeight(a.priority);
  if (pw !== 0) return pw;
  const aDue = a.dueAt ? Date.parse(a.dueAt) : Infinity;
  const bDue = b.dueAt ? Date.parse(b.dueAt) : Infinity;
  if (aDue !== bDue) return aDue - bDue;
  return (a.createdAt || '').localeCompare(b.createdAt || '');
}

type WorkflowRiverLane = 'overdue' | 'due_today' | 'unassigned';

/** One lane per task: overdue beats due-today beats unassigned. */
function assignWorkflowRiverLane(task: TaskItem): WorkflowRiverLane | null {
  if (isOverdueTask(task)) return 'overdue';
  if (isDueTodayTask(task)) return 'due_today';
  if (!(task.assigneeUserIds ?? []).length) return 'unassigned';
  return null;
}

function membershipDisplayLabel(member: Pick<Membership, 'email' | 'userId'>): string {
  const raw = member.email?.split('@')[0] || member.userId;
  return raw
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function partnerDisplayLabel(partners: Partner[], partnerId: string): string {
  return partners.find((partner) => partner.id === partnerId)?.profile?.fullName || partnerId;
}

// Demo Fixtures for rich preview when dataMode === 'demo'
const DEMO_CRM_RECORDS: CrmRecord[] = [
  {
    id: 'demo_crm_1',
    kind: 'inbound_lead',
    target: 'clients',
    stage: 'new',
    source: 'lead_capture',
    score: 92,
    tags: ['credit-restore', 'high-intent'],
    contact: { fullName: 'Marcus Vance', email: 'mvance@example.com', phone: '(555) 234-5678', company: 'Cedar Logistics' },
    dealValueCents: 249000,
    timeline: [{ id: 't1', kind: 'capture', label: 'Inbound lead captured via Credit Restore Funnel', createdAt: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_crm_2',
    kind: 'inbound_lead',
    target: 'clients',
    stage: 'contact_ready',
    source: 'resources',
    score: 85,
    tags: ['dispute-guide', 'ready-touch'],
    contact: { fullName: 'Elena Rostova', email: 'elena@example.com', phone: '(555) 876-5432', company: 'Rostova Capital' },
    dealValueCents: 199000,
    timeline: [{ id: 't2', kind: 'capture', label: 'Downloaded Free Dispute Guide', createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo_crm_3',
    kind: 'prospect',
    target: 'agents',
    stage: 'outreach_sent',
    source: 'referral',
    score: 78,
    tags: ['partner-referral', 'follow-up'],
    contact: { fullName: 'Derrick Thorne', email: 'dthorne@example.com', phone: '(555) 345-6789', company: 'Thorne Advisory' },
    dealValueCents: 350000,
    timeline: [{ id: 't3', kind: 'email', label: 'Outreach email sent by Lead Discovery team', createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo_crm_4',
    kind: 'inbound_lead',
    target: 'clients',
    stage: 'replied',
    source: 'chat',
    score: 95,
    tags: ['personal-restore', 'proposal'],
    contact: { fullName: 'Sophia Chen', email: 'schen@example.com', phone: '(555) 987-6543', company: 'Chen Design Co' },
    dealValueCents: 299000,
    timeline: [{ id: 't4', kind: 'proposal', label: 'Personal Restore agreement generated', createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'demo_crm_5',
    kind: 'client',
    target: 'clients',
    stage: 'converted',
    source: 'consultation',
    score: 99,
    tags: ['converted-partner', 'active-file'],
    contact: { fullName: 'Jonathan Hayes', email: 'jhayes@example.com', phone: '(555) 456-7890', company: 'Hayes Enterprises' },
    dealValueCents: 499000,
    timeline: [{ id: 't5', kind: 'converted', label: 'Converted to active partner file', createdAt: new Date().toISOString() }],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEMO_PARTNERS: Partner[] = [
  {
    id: 'partner_1',
    tenantId: FINELY_TENANT_ID,
    status: 'active',
    profile: { fullName: 'Marcus Vance', email: 'mvance@example.com', phone: '(555) 234-5678' },
    primaryRoute: 'personal_restore',
    routes: {},
    consents: {},
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'partner_2',
    tenantId: FINELY_TENANT_ID,
    status: 'active',
    profile: { fullName: 'Sophia Chen', email: 'schen@example.com', phone: '(555) 987-6543' },
    primaryRoute: 'personal_restore',
    routes: {},
    consents: {},
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'partner_3',
    tenantId: FINELY_TENANT_ID,
    status: 'active',
    profile: { fullName: 'Jonathan Hayes', email: 'jhayes@example.com', phone: '(555) 456-7890' },
    primaryRoute: 'personal_restore',
    routes: {},
    consents: {},
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_TEAM_MEMBERS: Membership[] = [
  {
    id: 'demo_membership_1',
    tenantId: FINELY_TENANT_ID,
    userId: 'demo_staff_maya',
    email: 'maya.chen@finelycred.com',
    role: 'support_lead',
    status: 'active',
    department: 'Operations',
    jobTitle: 'Credit Specialist',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_membership_2',
    tenantId: FINELY_TENANT_ID,
    userId: 'demo_staff_andre',
    email: 'andre.brooks@finelycred.com',
    role: 'agent',
    status: 'active',
    department: 'Credit Operations',
    jobTitle: 'Case Specialist',
    createdAt: new Date(Date.now() - 75 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_TASKS: TaskItem[] = [
  {
    id: 'demo_task_1',
    partnerId: 'partner_1',
    projectId: 'proj_1',
    title: 'Review Round 2 dispute letter responses for Equifax',
    kind: 'review_results',
    stage: 'disputes',
    status: 'pending',
    priority: 'urgent',
    assigneeUserIds: ['demo_staff_maya'],
    dueAt: new Date(Date.now() - 14 * 3600000).toISOString(), // overdue
    checklist: [
      { id: 'c1', text: 'Verify bureau response letter scan', done: true },
      { id: 'c2', text: 'Check factual findings against source report', done: false },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_task_2',
    partnerId: 'partner_2',
    projectId: 'proj_2',
    title: 'Upload fresh credit report and parse items',
    kind: 'upload_document',
    stage: 'reports',
    status: 'in_progress',
    priority: 'high',
    assigneeUserIds: ['demo_staff_andre'],
    dueAt: new Date(Date.now() + 4 * 3600000).toISOString(), // due today
    checklist: [
      { id: 'c3', text: 'Confirm identity verification docs', done: true },
      { id: 'c4', text: 'Run HTML report parser', done: false },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_task_3',
    partnerId: 'partner_3',
    projectId: 'proj_3',
    title: 'Assign partner onboarding specialist',
    kind: 'follow_up',
    stage: 'intake',
    status: 'pending',
    priority: 'high',
    assigneeUserIds: [], // unassigned
    dueAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    checklist: [{ id: 'c5', text: 'Assign team coordinator', done: false }],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_CASES: DisputeCase[] = [
  {
    id: 'demo_case_1',
    partnerId: 'partner_1',
    projectId: 'proj_1',
    bureau: 'EQF',
    title: 'Round 2 Formal Bureau Dispute — Equifax',
    status: 'open',
    items: [
      { id: 'i1', bureau: 'EQF', account: 'Chase Card Services', type: 'Late Payment', status: 'Disputed', code: 'late_pay', reasons: ['Inaccurate payment history timestamp'] },
      { id: 'i2', bureau: 'EQF', account: 'Midland Credit Management', type: 'Collection', status: 'Disputed', code: 'collection', reasons: ['Unverified collection balance'] },
    ],
    rounds: [
      {
        round: 'Round 2',
        tone: 'formal',
        status: 'letter_generated',
        letterId: 'ltr_101',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        dueAt: new Date(Date.now() + 5 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_case_2',
    partnerId: 'partner_2',
    projectId: 'proj_2',
    bureau: 'EXP',
    title: 'Round 1 Initial Evidence Challenge — Experian',
    status: 'open',
    items: [
      { id: 'i3', bureau: 'EXP', account: 'Portfolio Recovery Assoc', type: 'Collection', status: 'Disputed', code: 'collection', reasons: ['Missing debt validation'] },
    ],
    rounds: [
      {
        round: 'Round 1',
        tone: 'formal',
        status: 'mailed',
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
        mailedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
        dueAt: new Date(Date.now() + 18 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'demo_case_3',
    partnerId: 'partner_3',
    projectId: 'proj_3',
    bureau: 'TUC',
    title: 'Round 3 Direct Creditor Escalation — TransUnion',
    status: 'open',
    items: [
      { id: 'i4', bureau: 'TUC', account: 'Capital One Bank', type: 'Charge-off', status: 'Disputed', code: 'charge_off', reasons: ['Incorrect balance calculation'] },
    ],
    rounds: [
      {
        round: 'Round 3',
        tone: 'formal',
        status: 'response_received',
        responseReceivedAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
        dueAt: new Date(Date.now() + 2 * 86400000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export type WorkflowRiverSurfaceVariant = 'workflow' | 'inbox';

export type WorkflowRiverWorkstationProps = WorkspaceProductSurfaceProps & {
  surfaceVariant?: WorkflowRiverSurfaceVariant;
};

/** Shared service-clock river workstation — workflow page uses AdminStageShell; inbox uses ProductHubScaffold. */
export function WorkflowRiverWorkstation(props: WorkflowRiverWorkstationProps) {
  return <WorkflowWorkstation {...props} />;
}

export default function AdminOperationalWorkstationsSurface({
  role,
  pageId,
  entityId,
  dataMode,
}: WorkspaceProductSurfaceProps) {
  if (pageId === 'workflow') {
    return <WorkflowWorkstation role={role} pageId={pageId} entityId={entityId} dataMode={dataMode} />;
  }
  if (pageId === 'cases') {
    return <CasesWorkstation role={role} pageId={pageId} entityId={entityId} dataMode={dataMode} />;
  }
  return <CrmWorkstation role={role} pageId={pageId} entityId={entityId} dataMode={dataMode} />;
}

/* =================================────────────────=========================
   1. CRM Workstation Component (Interactive Drag-and-Drop & Trash)
   ========================================================================== */

function CrmWorkstation({ pageId, entityId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isDemo = dataMode === 'demo';
  const [records, setRecords] = useState<CrmRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string>('pipeline');
  const [refreshCount, setRefreshCount] = useState(0);
  const openRecordId = entityId || searchParams.get('recordId') || null;

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | CrmRecordStage>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all');

  // Drag and drop state
  const [draggedRecordId, setDraggedRecordId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Delete / Trash state
  const [leadToDelete, setLeadToDelete] = useState<CrmRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [trashRecords, setTrashRecords] = useState<LeadTrashRecord[]>([]);
  const [demoTrashedRecords, setDemoTrashedRecords] = useState<CrmRecord[]>([]);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);

  // Notes / outreach state
  const [noteDraft, setNoteDraft] = useState('');

  // Local creation modal state
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [convertedPartnerByRecord, setConvertedPartnerByRecord] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isDemo) {
      setRecords(DEMO_CRM_RECORDS);
      setSelectedRecordId(DEMO_CRM_RECORDS[0].id);
      setTrashRecords([]);
      setDemoTrashedRecords([]);
      return;
    }
    try {
      const live = listCrmRecords();
      if (live.length > 0) {
        setRecords(live);
        setSelectedRecordId(live[0].id);
      } else {
        setRecords([]);
        setSelectedRecordId(null);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to fetch live CRM records.');
      setRecords([]);
      setSelectedRecordId(null);
    }
    if (!isDemo) {
      try {
        setTrashRecords(listLeadTrash());
      } catch {
        setTrashRecords([]);
      }
    }
  }, [isDemo, refreshCount]);

  useEffect(() => {
    if (openRecordId) setSelectedRecordId(openRecordId);
  }, [openRecordId]);

  const openRecordInspector = (recordId: string) => {
    setSelectedRecordId(recordId);
    navigate(crmRecordHref(pathname, recordId));
  };

  const closeRecordInspector = () => {
    navigate(crmHubHref(pathname));
  };

  const selectedRecord = useMemo(
    () => records.find((r) => r.id === selectedRecordId) ?? records[0] ?? null,
    [records, selectedRecordId],
  );

  const sourceOptions = useMemo(
    () => Array.from(new Set(records.map((r) => r.source))).sort((a, b) => a.localeCompare(b)),
    [records],
  );

  const visibleRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (stageFilter !== 'all' && r.stage !== stageFilter) return false;
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (q) {
        const hay = [crmRecordDisplayName(r), r.contact.email, r.contact.company, r.contact.phone, ...(r.tags ?? [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, searchQuery, stageFilter, sourceFilter]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || stageFilter !== 'all' || sourceFilter !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('all');
    setSourceFilter('all');
  };

  const handleStageChange = (recordId: string, newStage: CrmRecordStage) => {
    setActionError(null);
    if (!isDemo) {
      try {
        const updated = setCrmRecordStage(recordId, newStage);
        if (!updated) {
          setActionError('Could not update stage for record ' + recordId);
          return;
        }
        setRefreshCount((c) => c + 1);
      } catch (err: any) {
        setActionError(err?.message || 'Error updating stage.');
      }
    } else {
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, stage: newStage, updatedAt: new Date().toISOString() } : r)),
      );
    }
  };

  const openConvertedPartner = (recordId: string, access?: 'invite' | 'grant') => {
    const partnerId = convertedPartnerByRecord[recordId];
    if (!partnerId || partnerId.startsWith('demo_')) {
      navigate(adminWorkspacePath(pathname, 'partners'));
      return;
    }
    const suffix = access ? `/${partnerId}?access=${access}` : `/${partnerId}`;
    navigate(adminWorkspacePath(pathname, 'partners', suffix));
  };

  const handleConvertToPartner = async (recordId: string) => {
    setActionError(null);
    if (!isDemo) {
      try {
        const result = await convertCrmRecordToPartner({ recordId, primaryRoute: 'personal_restore' });
        if (!result) {
          setActionError('Conversion failed for lead ' + recordId);
          return;
        }
        setConvertedPartnerByRecord((prev) => ({ ...prev, [recordId]: result.partnerId }));
        setRefreshCount((c) => c + 1);
      } catch (err: any) {
        setActionError(err?.message || 'Error converting lead to partner file.');
      }
    } else {
      setConvertedPartnerByRecord((prev) => ({ ...prev, [recordId]: `demo_${recordId}` }));
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, stage: 'converted' as CrmRecordStage } : r)),
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!leadToDelete) return;
    setActionError(null);
    const targetId = leadToDelete.id;
    const sourceId = leadToDelete.sourceRef?.id || targetId;

    // Preserve inspector selection before state removal
    setRecords((prev) => {
      const next = prev.filter((r) => r.id !== targetId);
      if (selectedRecordId === targetId) {
        setSelectedRecordId(next[0]?.id ?? null);
      }
      return next;
    });

    if (isDemo) {
      const deletedAt = new Date().toISOString();
      setDemoTrashedRecords((prev) => [leadToDelete, ...prev.filter((record) => record.id !== targetId)]);
      setTrashRecords((prev) => [
        {
          id: `demo_trash_${targetId}`,
          leadId: sourceId,
          deletedAt,
          reason: 'Trashed from CRM Operational Workstation',
          deletedBy: 'admin',
          originalStage: leadToDelete.stage,
          restoreHint: 'Restore to the prior CRM stage',
        },
        ...prev.filter((record) => record.leadId !== sourceId),
      ]);
    } else {
      try {
        trashLead({
          leadId: sourceId,
          reason: 'Trashed from CRM Operational Workstation',
          originalStage: leadToDelete.stage,
        });
        setCrmRecordStage(targetId, 'disqualified');
        setRefreshCount((c) => c + 1);
      } catch (err: any) {
        setActionError('Failed to trash lead: ' + (err?.message || 'unknown error'));
        try {
          setRecords(listCrmRecords());
        } catch {}
      }
    }
    setLeadToDelete(null);
  };

  const handleAddNote = () => {
    const text = noteDraft.trim();
    if (!text || !selectedRecord) return;
    setActionError(null);
    if (isDemo) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id
            ? {
                ...r,
                timeline: [
                  { id: `note_${Date.now()}`, kind: 'note', label: text, createdAt: new Date().toISOString() },
                  ...(r.timeline ?? []),
                ],
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
    } else {
      try {
        const updated = addCrmRecordNote(selectedRecord.id, text);
        if (!updated) {
          setActionError('Could not save note — this record has no linked source to log against.');
          return;
        }
        setRefreshCount((c) => c + 1);
      } catch (err: any) {
        setActionError(err?.message || 'Failed to save outreach note.');
      }
    }
    setNoteDraft('');
  };

  const handleRestoreLead = (leadId: string) => {
    setActionError(null);
    if (isDemo) {
      const trashedRecord = demoTrashedRecords.find(
        (record) => (record.sourceRef?.id || record.id) === leadId,
      );
      const trashRecord = trashRecords.find((record) => record.leadId === leadId);
      if (!trashedRecord) {
        setActionError('Could not find the demo lead to restore.');
        return;
      }
      setRecords((prev) => [
        {
          ...trashedRecord,
          stage: (trashRecord?.originalStage as CrmRecordStage | undefined) ?? trashedRecord.stage,
          updatedAt: new Date().toISOString(),
        },
        ...prev.filter((record) => record.id !== trashedRecord.id),
      ]);
      setDemoTrashedRecords((prev) => prev.filter((record) => record.id !== trashedRecord.id));
      setTrashRecords((prev) => prev.filter((record) => record.leadId !== leadId));
      setSelectedRecordId(trashedRecord.id);
      return;
    }
    try {
      restoreLead(leadId);
      setRefreshCount((c) => c + 1);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to restore lead.');
    }
  };

  const handleEmptyTrash = () => {
    setActionError(null);
    if (isDemo) {
      setTrashRecords([]);
      setDemoTrashedRecords([]);
      setConfirmEmptyTrash(false);
      return;
    }
    try {
      emptyLeadTrash();
      setRefreshCount((c) => c + 1);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to clear lead trash.');
    }
    setConfirmEmptyTrash(false);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) return;
    setActionError(null);
    if (isDemo) {
      const demoCreated: CrmRecord = {
        id: `demo_crm_${Date.now()}`,
        kind: 'inbound_lead',
        target: 'clients',
        stage: 'new',
        source: 'lead_capture',
        score: 90,
        tags: ['new-lead', 'local-entry'],
        contact: { fullName: newLeadName, email: newLeadEmail || 'lead@example.com', phone: newLeadPhone || '(555) 000-0000' },
        dealValueCents: 249000,
        timeline: [{ id: `t_${Date.now()}`, kind: 'capture', label: 'Inbound lead added via CRM Workstation', createdAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRecords((prev) => [demoCreated, ...prev]);
      setSelectedRecordId(demoCreated.id);
    } else {
      try {
        const created = createCrmInboundLead({
          fullName: newLeadName,
          email: newLeadEmail || 'lead@example.com',
          phone: newLeadPhone || '(555) 000-0000',
          consentToContact: true,
          source: 'contact',
        });
        setRecords((prev) => [created, ...prev]);
        setSelectedRecordId(created.id);
      } catch (err: any) {
        setActionError(err?.message || 'Failed to create lead in database.');
      }
    }
    setNewLeadName('');
    setNewLeadEmail('');
    setNewLeadPhone('');
    setIsCreatingLead(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, recordId: string) => {
    e.dataTransfer.setData('text/plain', recordId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedRecordId(recordId);
  };

  const handleDragOverColumn = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDropColumn = (e: React.DragEvent, targetStage: CrmRecordStage) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('text/plain') || draggedRecordId;
    setDragOverColId(null);
    setDraggedRecordId(null);
    if (recordId) {
      handleStageChange(recordId, targetStage);
    }
  };

  // Stage columns grouping (respects active search/filter)
  const stageColumns = useMemo(() => {
    const colNew = visibleRecords.filter((r) => r.stage === 'new' || r.stage === 'researching' || r.stage === 'contact_ready');
    const colOutreach = visibleRecords.filter((r) => r.stage === 'outreach_sent' || r.stage === 'contacted');
    const colProposal = visibleRecords.filter((r) => r.stage === 'replied' || r.stage === 'booked');
    const colWon = visibleRecords.filter((r) => r.stage === 'converted' || r.stage === 'won' || r.stage === 'active_client');
    const colClosed = visibleRecords.filter((r) => r.stage === 'disqualified' || r.stage === 'lost');

    return [
      { id: 'new', title: 'New & Ready', targetStage: 'new' as CrmRecordStage, count: colNew.length, records: colNew, accent: 'sky' as const },
      { id: 'outreach', title: 'In Outreach', targetStage: 'outreach_sent' as CrmRecordStage, count: colOutreach.length, records: colOutreach, accent: 'violet' as const },
      { id: 'proposal', title: 'Replied & Booked', targetStage: 'replied' as CrmRecordStage, count: colProposal.length, records: colProposal, accent: 'emerald' as const },
      { id: 'won', title: 'Converted Partners', targetStage: 'converted' as CrmRecordStage, count: colWon.length, records: colWon, accent: 'violet' as const },
      { id: 'closed', title: 'Closed / Disqualified', targetStage: 'disqualified' as CrmRecordStage, count: colClosed.length, records: colClosed, accent: 'rose' as const },
    ];
  }, [visibleRecords]);

  // Source performance breakdown (used by the "Source Performance" room)
  const sourceStats = useMemo(() => {
    const map = new Map<string, { source: string; total: number; open: number; ready: number; awaiting: number; converted: number }>();
    for (const r of records) {
      const s = map.get(r.source) ?? { source: r.source, total: 0, open: 0, ready: 0, awaiting: 0, converted: 0 };
      s.total += 1;
      if (!isClosedStage(r.stage)) {
        s.open += 1;
        if (r.stage === 'new' || r.stage === 'contact_ready') s.ready += 1;
        if (r.stage === 'outreach_sent' || r.stage === 'contacted') s.awaiting += 1;
      }
      if (r.stage === 'converted') s.converted += 1;
      map.set(r.source, s);
    }
    return [...map.values()].sort((a, b) => b.open - a.open);
  }, [records]);

  const convertedRecords = useMemo(
    () => records.filter((r) => r.stage === 'converted').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [records],
  );
  const conversionReadyRecords = useMemo(
    () => records.filter((r) => r.stage === 'replied' || r.stage === 'booked'),
    [records],
  );

  const navItems: AdminStageNavItem[] = [
    { id: 'pipeline', label: 'Pipeline', description: 'Leads by stage', icon: Layers, accent: 'sky' },
    { id: 'sources', label: 'Sources', description: 'Where leads came from', icon: Activity, accent: 'violet' },
    { id: 'conversion', label: 'Conversions', description: 'Ready to become partners', icon: Users, accent: 'emerald', badge: conversionReadyRecords.length || undefined },
    { id: 'trash', label: 'Removed leads', description: 'Restore or clear removed leads', icon: Trash2, accent: 'rose', badge: trashRecords.length || undefined },
  ];

  const signals: AdminStageSignal[] = [
    {
      id: 'ready',
      label: 'Ready for Touch',
      value: records.filter((r) => r.stage === 'new' || r.stage === 'contact_ready').length,
      detail: 'Inbound leads ready for outreach',
      icon: UserRoundCheck,
      accent: 'emerald',
      featured: true,
      onClick: () => setActiveRoom('pipeline'),
    },
    {
      id: 'awaiting',
      label: 'Awaiting Reply',
      value: records.filter((r) => r.stage === 'outreach_sent' || r.stage === 'contacted').length,
      detail: 'Outreach sent, waiting on response',
      icon: Clock3,
      accent: 'sky',
      onClick: () => setActiveRoom('pipeline'),
    },
    {
      id: 'aging',
      label: 'Unassigned & Aging',
      value: records.filter((r) => !r.assignedTo?.userId && ageInDays(r.updatedAt) >= 3).length,
      detail: 'No touch in 3+ days',
      icon: AlertTriangle,
      accent: 'rose',
      onClick: () => setActiveRoom('pipeline'),
    },
    {
      id: 'converted',
      label: 'Converted Files',
      value: records.filter((r) => isClosedStage(r.stage) && r.stage === 'converted').length,
      detail: 'Became active partner files',
      icon: Sparkles,
      accent: 'violet',
      onClick: () => setActiveRoom('conversion'),
    },
  ];

  return (
    <AdminStageShell family="pipeline-suite" signature="crm-horizontal-pipeline" accent="sky">
      <AdminStageHero
        tone="pipeline"
        accent="sky"
        eyebrow="Lead Operations · CRM Workstation"
        title={
          <>
            Lead <span className="text-sky-400">pipeline</span>
          </>
        }
        description="Track every lead by stage, then open the file that needs a next touch."
        status={`${records.length} records tracked · ${dataMode} data`}
        freshness={formatFreshness(records[0]?.updatedAt)}
        icon={Target}
        primaryAction={
          <ProductPagePrimaryAction label="Add New Lead" onClick={() => setIsCreatingLead(true)} />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => setActiveRoom('conversion')}>
            <Users size={15} /> Partner Conversions Desk
          </button>
        }
      />

      {actionError ? (
        <div className="fc-wlp-op-error-banner">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{actionError}</span>
          </div>
          <button type="button" onClick={() => setActionError(null)} className="hover:text-white">
            <X size={14} />
          </button>
        </div>
      ) : null}

      <AdminSignalRail label="Pipeline Signals" signals={signals} />

      <div className="fc-wlp-crm-split-workbench">
        <nav className="fc-wlp-crm-split-rail" aria-label="CRM views">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className="fc-wlp-crm-split-rail-btn"
                data-active={activeRoom === item.id ? 'true' : undefined}
                data-accent={item.accent}
                onClick={() => setActiveRoom(item.id)}
              >
                <Icon size={18} aria-hidden />
                <span className="fc-wlp-crm-split-rail-label">{item.label}</span>
                <span className="fc-wlp-crm-split-rail-desc">{item.description}</span>
                {item.badge ? <span className="fc-wlp-crm-split-rail-badge">{item.badge}</span> : null}
              </button>
            );
          })}
        </nav>

        <div className="fc-wlp-crm-split-main">
          <header className="fc-wlp-crm-split-head">
            <div>
              <span>Lead pipeline</span>
              <h2>
                {activeRoom === 'sources'
                  ? 'Source Performance'
                  : activeRoom === 'conversion'
                    ? 'Partner Conversions Desk'
                    : activeRoom === 'trash'
                      ? 'Lead Trash'
                      : 'Full-Width Stage Canvas'}
              </h2>
              <p>
                {activeRoom === 'sources'
                  ? 'Compare every lead channel by open volume, ready-to-touch, and conversions.'
                  : activeRoom === 'conversion'
                    ? 'Leads that replied or booked a call, ready to become an active partner file.'
                    : activeRoom === 'trash'
                      ? 'Restore a lead back to the pipeline or permanently clear the trash.'
                      : 'Drag lead cards across stages or use keyboard controls to update pipeline progress in real time.'}
              </p>
            </div>
            {activeRoom === 'pipeline' ? (
              <div className="fc-wlp-op-toolbar">
                <div className="fc-wlp-op-toolbar-search">
                  <Search size={14} aria-hidden />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, company…"
                    aria-label="Search leads"
                  />
                </div>
                <select
                  className="fc-wlp-op-toolbar-select"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value as 'all' | CrmRecordStage)}
                  aria-label="Filter by stage"
                >
                  <option value="all">All stages</option>
                  <option value="new">New</option>
                  <option value="contact_ready">Contact ready</option>
                  <option value="outreach_sent">In outreach</option>
                  <option value="replied">Replied</option>
                  <option value="converted">Converted</option>
                  <option value="disqualified">Disqualified</option>
                </select>
                <select
                  className="fc-wlp-op-toolbar-select"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  aria-label="Filter by source"
                >
                  <option value="all">All sources</option>
                  {sourceOptions.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                {hasActiveFilters ? (
                  <button type="button" className="fc-wlp-op-toolbar-clear" onClick={clearFilters}>
                    <X size={12} /> Clear
                  </button>
                ) : null}
              </div>
            ) : null}
          </header>

        {activeRoom === 'sources' ? (
          <div className="fc-wlp-op-source-grid">
            {sourceStats.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-4">No lead sources tracked yet.</div>
            ) : (
              sourceStats.map((s) => (
                <button
                  key={s.source}
                  type="button"
                  className="fc-wlp-op-source-card"
                  onClick={() => {
                    setSourceFilter(s.source);
                    setActiveRoom('pipeline');
                  }}
                >
                  <div className="fc-wlp-op-source-card-head">
                    <strong>{s.source.replace(/_/g, ' ')}</strong>
                    <span className="fc-wlp-crm-column-badge">{s.open} open</span>
                  </div>
                  <div className="fc-wlp-op-source-card-row">
                    <span>Ready</span>
                    <strong className="text-emerald-400">{s.ready}</strong>
                  </div>
                  <div className="fc-wlp-op-source-card-row">
                    <span>Awaiting reply</span>
                    <strong className="text-sky-400">{s.awaiting}</strong>
                  </div>
                  <div className="fc-wlp-op-source-card-row">
                    <span>Converted</span>
                    <strong className="text-violet-400">{s.converted}</strong>
                  </div>
                  <div className="fc-wlp-op-source-card-row">
                    <span>Total tracked</span>
                    <strong>{s.total}</strong>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : activeRoom === 'conversion' ? (
          <div className="fc-wlp-op-source-grid">
            {conversionReadyRecords.length === 0 && convertedRecords.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-4">No records are replied, booked, or converted yet.</div>
            ) : (
              <>
                {conversionReadyRecords.map((r) => (
                  <div key={r.id} className="fc-wlp-op-source-card">
                    <div className="fc-wlp-op-source-card-head">
                      <strong>{crmRecordDisplayName(r)}</strong>
                      <span className="fc-wlp-crm-column-badge">{r.stage}</span>
                    </div>
                    <div className="text-xs text-slate-400">{r.contact.email || 'No email on file'}</div>
                    <div className="text-xs text-emerald-400 font-semibold mt-1">{formatCents(r.dealValueCents)} estimated</div>
                    <button
                      type="button"
                      className="fc-wlp-op-btn-primary fc-wlp-op-btn-sm mt-2"
                      onClick={() => handleConvertToPartner(r.id)}
                    >
                      <Check size={13} /> Convert to Partner File
                    </button>
                  </div>
                ))}
                {convertedRecords.map((r) => (
                  <div key={r.id} className="fc-wlp-op-source-card" data-converted="true">
                    <div className="fc-wlp-op-source-card-head">
                      <strong>{crmRecordDisplayName(r)}</strong>
                      <span className="fc-wlp-crm-column-badge">converted</span>
                    </div>
                    <div className="text-xs text-slate-400">Converted {formatFreshness(r.updatedAt)}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        className="fc-wlp-op-btn-primary fc-wlp-op-btn-sm"
                        onClick={() => openConvertedPartner(r.id, 'invite')}
                      >
                        <UserPlus size={13} /> Send invite
                      </button>
                      <button
                        type="button"
                        className="fc-wlp-op-btn-secondary fc-wlp-op-btn-sm"
                        onClick={() => openConvertedPartner(r.id, 'grant')}
                      >
                        <KeyRound size={13} /> Grant access
                      </button>
                      <button
                        type="button"
                        className="fc-wlp-op-btn-secondary fc-wlp-op-btn-sm"
                        onClick={() => openConvertedPartner(r.id)}
                      >
                        Open file
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : activeRoom === 'trash' ? (
          <div className="fc-wlp-op-trash-panel">
            <div className="fc-wlp-op-trash-head">
              <span className="text-xs text-slate-400">{trashRecords.length} lead{trashRecords.length === 1 ? '' : 's'} in trash</span>
              <button
                type="button"
                className="fc-wlp-op-btn-danger fc-wlp-op-btn-sm"
                onClick={() => setConfirmEmptyTrash(true)}
                disabled={trashRecords.length === 0}
              >
                <Trash2 size={13} /> Empty Trash
              </button>
            </div>
            {trashRecords.length === 0 ? (
              <div className="text-xs text-slate-400 italic py-4">Trash is empty — deleted leads appear here for restore.</div>
            ) : (
              <div className="fc-wlp-op-trash-list">
                {trashRecords.map((t) => (
                  <div key={t.id} className="fc-wlp-op-trash-row">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{t.leadId}</div>
                      <div className="text-xs text-slate-400">{t.reason} · trashed {formatFreshness(t.deletedAt)}</div>
                    </div>
                    <button type="button" className="fc-wlp-op-btn-secondary fc-wlp-op-btn-sm" onClick={() => handleRestoreLead(t.leadId)}>
                      <Undo2 size={13} /> Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <div className="fc-wlp-op-stage-wrapper">
          {/* Horizontal Multi-Column Pipeline */}
          <div className="fc-wlp-crm-pipeline-container">
            {stageColumns.map((col) => (
              <div
                key={col.id}
                className="fc-wlp-crm-column"
                data-drag-over={dragOverColId === col.id ? 'true' : undefined}
                onDragOver={(e) => handleDragOverColumn(e, col.id)}
                onDragLeave={() => setDragOverColId(null)}
                onDrop={(e) => handleDropColumn(e, col.targetStage)}
              >
                <div className="fc-wlp-crm-column-head">
                  <span className="fc-wlp-crm-column-title">
                    {col.title}
                  </span>
                  <span className="fc-wlp-crm-column-badge">{col.count}</span>
                </div>
                <div className="fc-wlp-crm-card-list">
                  {col.records.map((record) => {
                    const isSelected = selectedRecord?.id === record.id;
                    const isDragging = draggedRecordId === record.id;
                    return (
                      <div
                        key={record.id}
                        className="fc-wlp-crm-card"
                        draggable
                        data-selected={isSelected ? 'true' : undefined}
                        data-dragging={isDragging ? 'true' : undefined}
                        onDragStart={(e) => handleDragStart(e, record.id)}
                        onDragEnd={() => setDraggedRecordId(null)}
                        onClick={() => openRecordInspector(record.id)}
                      >
                        <div className="fc-wlp-crm-card-header">
                          <div className="flex items-start gap-1">
                            <span className="fc-wlp-crm-card-drag-handle" title="Drag card to move stage">
                              <GripVertical size={13} />
                            </span>
                            <div>
                              <div className="fc-wlp-crm-card-name">{crmRecordDisplayName(record)}</div>
                              {record.contact.company ? (
                                <div className="fc-wlp-crm-card-company">{record.contact.company}</div>
                              ) : null}
                            </div>
                          </div>
                          {record.score ? (
                            <span className="fc-wlp-crm-card-score">{record.score} pts</span>
                          ) : null}
                        </div>

                        <div className="fc-wlp-crm-card-meta">
                          <span>{record.source}</span>
                          <strong>{formatCents(record.dealValueCents)}</strong>
                        </div>

                        <div className="fc-wlp-crm-card-tags">
                          {(record.tags ?? []).slice(0, 2).map((tag) => (
                            <span key={tag} className="fc-wlp-crm-card-tag">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Card Quick Actions & Keyboard Move Fallback */}
                        <div className="fc-wlp-crm-card-actions">
                          <select
                            className="fc-wlp-crm-move-select"
                            value={record.stage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStageChange(record.id, e.target.value as CrmRecordStage);
                            }}
                            title="Keyboard fallback: select stage to move"
                          >
                            <option value="new">New</option>
                            <option value="outreach_sent">Outreach</option>
                            <option value="replied">Replied</option>
                            <option value="converted">Converted</option>
                            <option value="disqualified">Disqualified</option>
                          </select>

                          <button
                            type="button"
                            className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
                            title="Trash / delete lead"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeadToDelete(record);
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {col.records.length === 0 ? (
                    <div className="text-xs text-slate-500 py-6 text-center italic">No records in stage</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Persistent Detail Inspector */}
          {selectedRecord ? (
            <div className="fc-wlp-op-inspector-panel">
              <div className="fc-wlp-op-inspector-header">
                <div>
                  <span className="fc-wlp-op-inspector-eyebrow">
                    <UserRoundCheck size={14} /> Lead Inspector
                  </span>
                  <div className="fc-wlp-op-inspector-title">{crmRecordDisplayName(selectedRecord)}</div>
                </div>
                <span className="fc-wlp-crm-column-badge">{selectedRecord.stage}</span>
              </div>

              <div className="fc-wlp-op-inspector-body">
                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">Pipeline Stage Control</span>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Selected lead stage"
                      className="bg-slate-900 border border-slate-700 text-slate-100 rounded p-1.5 text-xs w-full focus:border-sky-400 focus:outline-none"
                      value={selectedRecord.stage}
                      onChange={(e) => handleStageChange(selectedRecord.id, e.target.value as CrmRecordStage)}
                    >
                      <option value="new">New & Ready</option>
                      <option value="contact_ready">Contact Ready</option>
                      <option value="outreach_sent">In Outreach</option>
                      <option value="replied">Replied & Booked</option>
                      <option value="converted">Converted Partner</option>
                      <option value="disqualified">Disqualified / Trash</option>
                    </select>
                    <button
                      type="button"
                      className="fc-wlp-op-btn-secondary fc-wlp-op-btn-sm whitespace-nowrap"
                      title="Advance to next stage"
                      onClick={() => {
                        const nextMap: Record<string, CrmRecordStage> = {
                          new: 'outreach_sent',
                          contact_ready: 'outreach_sent',
                          outreach_sent: 'replied',
                          replied: 'converted',
                          converted: 'converted',
                          disqualified: 'new',
                        };
                        handleStageChange(selectedRecord.id, nextMap[selectedRecord.stage] || 'outreach_sent');
                      }}
                    >
                      <MoveRight size={13} />
                    </button>
                  </div>
                </div>

                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">Contact Details</span>
                  <div className="text-xs text-slate-300 space-y-1">
                    {selectedRecord.contact.email ? (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-sky-400" /> {selectedRecord.contact.email}
                      </div>
                    ) : null}
                    {selectedRecord.contact.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-emerald-400" /> {selectedRecord.contact.phone}
                      </div>
                    ) : null}
                    {selectedRecord.contact.company ? (
                      <div className="flex items-center gap-2">
                        <Building2 size={13} className="text-violet-400" /> {selectedRecord.contact.company}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">Value & Intelligence</span>
                  <div className="flex items-center justify-between text-xs bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                    <div>
                      <div className="text-slate-400 text-[10px]">ESTIMATED DEAL VALUE</div>
                      <div className="text-base font-bold text-emerald-400">{formatCents(selectedRecord.dealValueCents)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">LEAD SCORE</div>
                      <div className="text-base font-bold text-sky-400">{selectedRecord.score ?? 80} / 100</div>
                    </div>
                  </div>
                </div>

                <div className="fc-wlp-op-inspector-section fc-wlp-op-copilot-slot">
                  <CrmAICopilotPanel record={selectedRecord} />
                </div>

                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">Activity Timeline</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(selectedRecord.timeline ?? []).slice(0, 3).map((item) => (
                      <div key={item.id} className="text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800 text-slate-300">
                        <div className="font-semibold text-slate-200">{item.label}</div>
                        <div className="text-[10px] text-slate-500">{formatFreshness(item.createdAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">
                    <StickyNote size={12} className="inline -mt-0.5 mr-1" /> Log Outreach / Note
                  </span>
                  <textarea
                    aria-label="Outreach note"
                    className="fc-wlp-op-note-textarea"
                    rows={4}
                    placeholder="e.g. Called and left voicemail, will retry Thursday…"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <button
                    type="button"
                    className="fc-wlp-op-btn-secondary fc-wlp-op-btn-sm"
                    onClick={handleAddNote}
                    disabled={!noteDraft.trim()}
                  >
                    <StickyNote size={13} /> Save Note
                  </button>
                </div>

                <div className="fc-wlp-op-inspector-actions">
                  {selectedRecord.stage === 'converted' || convertedPartnerByRecord[selectedRecord.id] ? (
                    <>
                      <button
                        type="button"
                        className="fc-wlp-op-btn-primary"
                        onClick={() => openConvertedPartner(selectedRecord.id, 'invite')}
                      >
                        <UserPlus size={15} /> Send invite
                      </button>
                      <button
                        type="button"
                        className="fc-wlp-op-btn-secondary"
                        onClick={() => openConvertedPartner(selectedRecord.id, 'grant')}
                      >
                        <KeyRound size={14} /> Grant access
                      </button>
                      <button
                        type="button"
                        className="fc-wlp-op-btn-secondary"
                        onClick={() => openConvertedPartner(selectedRecord.id)}
                      >
                        Open partner file
                      </button>
                    </>
                  ) : (
                  <button
                    type="button"
                    className="fc-wlp-op-btn-primary"
                    onClick={() => handleConvertToPartner(selectedRecord.id)}
                  >
                    <Check size={15} /> Convert to Partner File
                  </button>
                  )}
                  <button
                    type="button"
                    className="fc-wlp-op-btn-secondary"
                    onClick={() => openRecordInspector(selectedRecord.id)}
                  >
                    <Sparkles size={14} /> Open enhanced record
                  </button>
                  <button
                    type="button"
                    className="fc-wlp-op-btn-secondary"
                    onClick={() => handleStageChange(selectedRecord.id, 'outreach_sent')}
                  >
                    <Mail size={14} /> Send Follow-up Touch
                  </button>
                  <button
                    type="button"
                    className="fc-wlp-op-btn-danger"
                    onClick={() => setLeadToDelete(selectedRecord)}
                  >
                    <Trash2 size={14} /> Trash / Delete Lead
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        )}
        </div>
      </div>

      {openRecordId ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="CRM record inspector"
          onClick={closeRecordInspector}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-crm-record-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-sky-300 m-0">Enhanced CRM inspector</p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">
                  {selectedRecord ? crmRecordDisplayName(selectedRecord) : 'CRM record'}
                </h3>
              </div>
              <button
                type="button"
                className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs"
                onClick={closeRecordInspector}
                aria-label="Close CRM record inspector"
              >
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <AdminCrmRecordPage embedded recordId={openRecordId} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Empty Trash Confirmation Modal */}
      {confirmEmptyTrash ? (
        <div className="fc-wlp-op-modal-overlay" role="dialog" aria-modal="true" aria-label="Empty lead trash">
          <div className="fc-wlp-op-modal-content">
            <div className="flex justify-between items-center border-b border-rose-500/30 pb-3">
              <div className="font-bold text-rose-300 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} className="text-rose-400" /> Empty Lead Trash
              </div>
              <button type="button" onClick={() => setConfirmEmptyTrash(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p>
                This permanently clears <strong className="text-slate-100">{trashRecords.length}</strong> trashed lead
                {trashRecords.length === 1 ? '' : 's'}. Restored leads must be re-added manually afterward.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setConfirmEmptyTrash(false)} className="fc-wlp-op-btn-secondary">
                Cancel
              </button>
              <button type="button" onClick={handleEmptyTrash} className="fc-wlp-op-btn-danger">
                <Trash2 size={14} /> Empty Trash
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete / Trash Confirmation Modal */}
      {leadToDelete ? (
        <div className="fc-wlp-op-modal-overlay" role="dialog" aria-modal="true" aria-label="Trash lead">
          <div className="fc-wlp-op-modal-content">
            <div className="flex justify-between items-center border-b border-rose-500/30 pb-3">
              <div className="font-bold text-rose-300 flex items-center gap-2 text-sm">
                <AlertTriangle size={18} className="text-rose-400" /> Trash / Archive Lead
              </div>
              <button type="button" onClick={() => setLeadToDelete(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Are you sure you want to remove lead <strong className="text-slate-100">{crmRecordDisplayName(leadToDelete)}</strong>?
              </p>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 space-y-1">
                <div>Email: <span className="text-sky-400">{leadToDelete.contact.email || 'None'}</span></div>
                <div>Stage: <span className="text-violet-400">{leadToDelete.stage}</span></div>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Trashed leads are moved to the Lead Trash repository and can be restored at any time.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="fc-wlp-op-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="fc-wlp-op-btn-danger"
              >
                <Trash2 size={14} /> Trash Lead
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Local Modal for Lead Creation */}
      {isCreatingLead ? (
        <div className="fc-wlp-op-modal-overlay" role="dialog" aria-modal="true" aria-label="Add inbound lead">
          <div className="fc-wlp-op-modal-content">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <Plus size={16} className="text-sky-400" /> Add Inbound Lead
              </div>
              <button type="button" onClick={() => setIsCreatingLead(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  aria-label="Full name"
                  placeholder="e.g. Alex Morgan"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  aria-label="Email address"
                  placeholder="alex@example.com"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  aria-label="Phone number"
                  placeholder="(555) 000-0000"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-sky-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingLead(false)}
                  className="fc-wlp-op-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="fc-wlp-op-btn-primary">
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <AdminContextCommand
        title="Pipeline Operating Standard"
        description="Leads advance based on verified touches, proposals, and partner conversion milestones."
        steps={[
          'Drag lead cards between stages or use keyboard controls.',
          'Send personalized outreach or proposal link.',
          'Convert qualified leads directly into active partner files.',
        ]}
        prompt="Which lead source or stage requires touch first?"
        contextLabel="CRM Pipeline Workstation"
        onWatch={() => openProductCopilot({ prompt: 'Guide me through CRM lead conversion', contextLabel: 'CRM Workstation' })}
      />
    </AdminStageShell>
  );
}

/* =================================────────────────=========================
   2. Workflow Workstation Component (100% Self-Contained)
   ========================================================================== */

function WorkflowWorkstation({ role, pageId, dataMode, surfaceVariant = 'workflow' }: WorkflowRiverWorkstationProps) {
  const isInbox = surfaceVariant === 'inbox';
  const navigate = useNavigate();
  const navItem = isInbox ? getWorkspaceProductNavItem('admin', pageId) : null;
  const archetype = isInbox ? getWorkspaceProductArchetype('admin', pageId) : undefined;
  const isDemo = dataMode === 'demo';
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string>('river');
  const [members, setMembers] = useState<Membership[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<'all' | 'unassigned' | string>('all');

  // Due-date editor draft
  const [dueDateDraft, setDueDateDraft] = useState('');

  // Drag-to-assign state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverMemberId, setDragOverMemberId] = useState<string | null>(null);

  // Local creation modal state
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPartnerId, setNewTaskPartnerId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('high');
  const [newTaskDueAt, setNewTaskDueAt] = useState('');

  useEffect(() => {
    if (isDemo) {
      setTasks(DEMO_TASKS);
      setSelectedTaskId(DEMO_TASKS[0].id);
      setMembers(DEMO_TEAM_MEMBERS);
      setPartners(DEMO_PARTNERS);
      return;
    }
    try {
      const live = listTasks();
      if (live.length > 0) {
        setTasks(live);
        setSelectedTaskId(live[0].id);
      } else {
        setTasks([]);
        setSelectedTaskId(null);
      }
    } catch {
      setTasks([]);
      setSelectedTaskId(null);
    }
    try {
      setMembers(listMemberships(getActiveTenantId()).filter((m) => m.status === 'active' && m.role !== 'partner'));
    } catch {
      setMembers([]);
    }
    fetchAllPartnersAsAdmin()
      .then(setPartners)
      .catch(() => setPartners([]));
  }, [isDemo]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? tasks[0] ?? null,
    [tasks, selectedTaskId],
  );

  useEffect(() => {
    setDueDateDraft(selectedTask?.dueAt ? selectedTask.dueAt.slice(0, 10) : '');
  }, [selectedTask?.id, selectedTask?.dueAt]);

  const refreshTasks = () => {
    if (!isDemo) setTasks(listTasks());
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    if (!isDemo) {
      setTaskStatus(taskId, status);
      refreshTasks();
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t)),
      );
    }
  };

  const handleToggleChecklist = (taskId: string, itemId: string) => {
    if (!isDemo) {
      toggleTaskChecklistItem(taskId, itemId);
      refreshTasks();
    } else {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const checklist = (t.checklist ?? []).map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
          return { ...t, checklist };
        }),
      );
    }
  };

  const handleSetDueDate = (taskId: string, dateValue: string) => {
    const dueAt = dateValue ? new Date(`${dateValue}T17:00:00`).toISOString() : undefined;
    if (!isDemo) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) upsertTask({ ...task, dueAt });
      refreshTasks();
    } else {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, dueAt, updatedAt: new Date().toISOString() } : t)));
    }
  };

  const handleAssignMember = (taskId: string, userId: string) => {
    if (!isDemo) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const current = task.assigneeUserIds ?? [];
      const next = current.includes(userId) ? current : [...current, userId];
      upsertTask({ ...task, assigneeUserIds: next });
      refreshTasks();
    } else {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const current = t.assigneeUserIds ?? [];
          return { ...t, assigneeUserIds: current.includes(userId) ? current : [...current, userId] };
        }),
      );
    }
  };

  const handleUnassignMember = (taskId: string, userId: string) => {
    if (!isDemo) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      upsertTask({ ...task, assigneeUserIds: (task.assigneeUserIds ?? []).filter((id) => id !== userId) });
      refreshTasks();
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, assigneeUserIds: (t.assigneeUserIds ?? []).filter((id) => id !== userId) } : t)),
      );
    }
  };

  const handleClearAssignees = (taskId: string) => {
    if (!isDemo) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      upsertTask({ ...task, assigneeUserIds: [] });
      refreshTasks();
    } else {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assigneeUserIds: [] } : t)));
    }
  };

  const memberLabel = (userId: string) => {
    const m = members.find((x) => x.userId === userId);
    return m ? membershipDisplayLabel(m) : userId;
  };

  const handleDragStartTask = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDropOnMember = (e: React.DragEvent, userId: string | null) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverMemberId(null);
    setDraggedTaskId(null);
    if (!taskId) return;
    if (userId) handleAssignMember(taskId, userId);
    else handleClearAssignees(taskId);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    if (!isDemo && !newTaskPartnerId.trim()) return;
    const dueAt = newTaskDueAt ? new Date(`${newTaskDueAt}T17:00:00`).toISOString() : new Date(Date.now() + 24 * 3600000).toISOString();
    if (isDemo) {
      const demoCreated: TaskItem = {
        id: `demo_task_${Date.now()}`,
        partnerId: newTaskPartnerId || 'partner_local',
        projectId: 'proj_local',
        title: newTaskTitle,
        kind: 'follow_up',
        stage: 'intake',
        status: 'pending',
        priority: newTaskPriority,
        dueAt,
        checklist: [{ id: `c_${Date.now()}`, text: 'Initial triage & outreach', done: false }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [demoCreated, ...prev]);
      setSelectedTaskId(demoCreated.id);
    } else {
      const created = createTask({
        partnerId: newTaskPartnerId,
        title: newTaskTitle,
        kind: 'follow_up',
        priority: newTaskPriority,
        stage: 'intake',
        status: 'pending',
        dueAt,
      });
      setTasks((prev) => [created, ...prev]);
      setSelectedTaskId(created.id);
    }
    setNewTaskTitle('');
    setNewTaskPartnerId('');
    setNewTaskPriority('high');
    setNewTaskDueAt('');
    setIsCreatingTask(false);
  };

  const riverLaneCounts = useMemo(() => {
    const buckets: Record<WorkflowRiverLane, TaskItem[]> = {
      overdue: [],
      due_today: [],
      unassigned: [],
    };
    for (const task of tasks) {
      const lane = assignWorkflowRiverLane(task);
      if (lane) buckets[lane].push(task);
    }
    return buckets;
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && (t.priority ?? 'normal') !== priorityFilter) return false;
      if (assigneeFilter === 'unassigned' && (t.assigneeUserIds ?? []).length > 0) return false;
      if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned' && !(t.assigneeUserIds ?? []).includes(assigneeFilter)) return false;
      if (q) {
        const partnerName = partners.find((p) => p.id === t.partnerId)?.profile?.fullName ?? '';
        const hay = [t.title, t.partnerId, partnerName, t.kind].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, partners]);

  const riverLaneBuckets = useMemo(() => {
    const buckets: Record<WorkflowRiverLane, TaskItem[]> = {
      overdue: [],
      due_today: [],
      unassigned: [],
    };
    const sorted = [...visibleTasks].sort(compareWorkflowTasks);
    for (const task of sorted) {
      const lane = assignWorkflowRiverLane(task);
      if (lane) buckets[lane].push(task);
    }
    return buckets;
  }, [visibleTasks]);

  const mergedRiverTasks = useMemo(
    () =>
      [...visibleTasks]
        .filter((task) => assignWorkflowRiverLane(task) !== null)
        .sort(compareWorkflowTasks),
    [visibleTasks],
  );

  const renderTaskStack = (laneTasks: TaskItem[], emptyMessage: string) => (
    <FinelyOsPaginatedStack
      items={laneTasks}
      pageSize={8}
      emptyMessage={emptyMessage}
      renderItem={(task, rankIndex) => (
        <TaskCard
          key={task.id}
          task={task}
          partnerName={partnerDisplayLabel(partners, task.partnerId)}
          rank={rankIndex + 1}
          isSelected={selectedTask?.id === task.id}
          onSelect={() => setSelectedTaskId(task.id)}
          draggable
          onDragStart={(e) => handleDragStartTask(e, task.id)}
          surfaceVariant={isInbox ? 'inbox' : 'workflow'}
        />
      )}
    />
  );

  const hasActiveFilters =
    Boolean(searchQuery.trim()) || statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
  };

  const navItems: AdminStageNavItem[] = [
    { id: 'river', label: 'Work river', description: 'Ranked by due time', icon: Activity, accent: 'rose' },
    { id: 'overdue', label: 'Past due', description: 'Missed the target time', icon: Clock3, accent: 'rose', badge: riverLaneCounts.overdue.length || undefined },
    { id: 'unassigned', label: 'Unassigned', description: 'Needs a team owner', icon: Users, accent: 'violet', badge: riverLaneCounts.unassigned.length || undefined },
  ];

  const signals: AdminStageSignal[] = [
    {
      id: 'open',
      label: 'Active Queue',
      value: tasks.filter((t) => t.status !== 'completed').length,
      detail: 'Open operational tasks',
      icon: Inbox,
      accent: 'violet',
      featured: true,
      onClick: () => setActiveRoom('river'),
    },
    {
      id: 'overdue',
      label: 'SLA Breaches',
      value: riverLaneCounts.overdue.length,
      detail: 'Past target completion time',
      icon: Clock3,
      accent: 'rose',
      onClick: () => setActiveRoom('overdue'),
    },
    {
      id: 'today',
      label: 'Due Today',
      value: riverLaneCounts.due_today.length,
      detail: 'Same-day completion targets',
      icon: CheckCircle2,
      accent: 'sky',
      onClick: () => setActiveRoom('river'),
    },
    {
      id: 'unassigned',
      label: 'Unassigned Work',
      value: riverLaneCounts.unassigned.length,
      detail: 'Awaiting team assignment',
      icon: Users,
      accent: 'emerald',
      onClick: () => setActiveRoom('unassigned'),
    },
  ];

  const createTaskModal = isCreatingTask ? (
    <div className="fc-wlp-op-modal-overlay" role="dialog" aria-modal="true" aria-label="Create service task">
      <div className="fc-wlp-op-modal-content">
        <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
          <div className="font-bold text-slate-100 flex items-center gap-2">
            <Plus size={16} className="text-rose-400" /> Create Service Task
          </div>
          <button type="button" onClick={() => setIsCreatingTask(false)} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Task Title</label>
            <input
              type="text"
              required
              aria-label="Task title"
              placeholder="e.g. Audit Round 1 dispute response for Equifax"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Partner</label>
            {partners.length > 0 ? (
              <select
                aria-label="Task partner"
                required={!isDemo}
                value={newTaskPartnerId}
                onChange={(e) => setNewTaskPartnerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
              >
                <option value="">Select a partner…</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.profile?.fullName || p.id}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                aria-label="Task partner"
                required={!isDemo}
                placeholder="e.g. partner_1"
                value={newTaskPartnerId}
                onChange={(e) => setNewTaskPartnerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
              />
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-slate-300 font-semibold mb-1">Priority</label>
              <select
                aria-label="Task priority"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-slate-300 font-semibold mb-1">Due date</label>
              <input
                type="date"
                aria-label="Task due date"
                value={newTaskDueAt}
                onChange={(e) => setNewTaskDueAt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCreatingTask(false)} className="fc-wlp-op-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="fc-wlp-op-btn-primary">
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  const taskInspectorPanel = selectedTask ? (
    <div className={isInbox ? 'fc-admin-inbox-inspector fc-wlp-op-inspector-panel' : 'fc-wlp-op-inspector-panel'}>
      <TaskInspectorBody
        task={selectedTask}
        partnerName={partnerDisplayLabel(partners, selectedTask.partnerId)}
        members={members}
        dueDateDraft={dueDateDraft}
        setDueDateDraft={setDueDateDraft}
        onStatusChange={handleStatusChange}
        onToggleChecklist={handleToggleChecklist}
        onSetDueDate={handleSetDueDate}
        onAssign={handleAssignMember}
        onUnassign={handleUnassignMember}
      />
    </div>
  ) : null;

  const inboxQueueTasks =
    activeRoom === 'overdue'
      ? riverLaneBuckets.overdue
      : activeRoom === 'unassigned'
        ? riverLaneBuckets.unassigned
        : mergedRiverTasks;

  const inboxQueueEmpty =
    activeRoom === 'overdue'
      ? 'No overdue SLA breaches right now — clear filters or check back later.'
      : activeRoom === 'unassigned'
        ? 'No unassigned triage items — assign owners from overdue or due-today lanes first.'
        : 'No ranked river tasks match your filters — adjust search or create a new task.';

  if (isInbox) {
    const accent = navItem?.accent ?? 'sky';
    return (
      <>
        <ProductHubScaffold
          role={role}
          pageId={pageId}
          eyebrow="Operations"
          title="Service inbox"
          description="Rank tasks by service clock, assign owners, and close checklist steps."
          accent={accent}
          surfaceMode={navItem?.surfaceMode ?? 'light'}
          archetype={archetype}
          icon={navItem?.icon ?? Inbox}
          freshness={formatFreshness(tasks[0]?.updatedAt)}
          primaryAction={<ProductPagePrimaryAction label="Create task" onClick={() => setIsCreatingTask(true)} />}
          secondaryAction={
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/support')}>
              Partner conversations
            </button>
          }
          metrics={[
            {
              label: 'Active queue',
              value: String(tasks.filter((t) => t.status !== 'completed').length),
              hint: 'Open operational tasks',
              accent: 'violet',
              onClick: () => setActiveRoom('river'),
            },
            {
              label: 'SLA breaches',
              value: String(riverLaneCounts.overdue.length),
              hint: 'Past target completion time',
              accent: 'rose',
              onClick: () => setActiveRoom('overdue'),
            },
            {
              label: 'Due today',
              value: String(riverLaneCounts.due_today.length),
              hint: 'Same-day completion targets',
              accent: 'sky',
              onClick: () => setActiveRoom('river'),
            },
            {
              label: 'Unassigned',
              value: String(riverLaneCounts.unassigned.length),
              hint: 'Awaiting team assignment',
              accent: 'emerald',
              onClick: () => setActiveRoom('unassigned'),
            },
          ]}
          metricTitle="Inbox summary"
          metricDescription="Pick a lane, select a task, then assign or complete checklist steps."
        >
          <div className="fc-admin-inbox-studio" data-surface-layout="inbox-river">
            <WorkflowDailyBriefingStrip tasks={tasks} />

            <section className="fc-admin-inbox-runway" aria-label="Service clock runway">
              <button
                type="button"
                className="fc-admin-inbox-runway-node"
                data-accent="rose"
                data-active={activeRoom === 'overdue' ? 'true' : undefined}
                onClick={() => setActiveRoom('overdue')}
              >
                <span className="fc-admin-inbox-runway-label">
                  <Clock3 size={15} /> Past SLA
                </span>
                <span className="fc-admin-inbox-runway-value">{riverLaneCounts.overdue.length}</span>
                <span className="fc-admin-inbox-runway-hint">Clear breaches before lower-risk work</span>
              </button>
              <button
                type="button"
                className="fc-admin-inbox-runway-node"
                data-accent="sky"
                data-active={activeRoom === 'river' ? 'true' : undefined}
                onClick={() => setActiveRoom('river')}
              >
                <span className="fc-admin-inbox-runway-label">
                  <CheckCircle2 size={15} /> Due today
                </span>
                <span className="fc-admin-inbox-runway-value">{riverLaneCounts.due_today.length}</span>
                <span className="fc-admin-inbox-runway-hint">Same-day service clock targets</span>
              </button>
              <button
                type="button"
                className="fc-admin-inbox-runway-node"
                data-accent="violet"
                data-active={activeRoom === 'unassigned' ? 'true' : undefined}
                onClick={() => setActiveRoom('unassigned')}
              >
                <span className="fc-admin-inbox-runway-label">
                  <Users size={15} /> Unassigned
                </span>
                <span className="fc-admin-inbox-runway-value">{riverLaneCounts.unassigned.length}</span>
                <span className="fc-admin-inbox-runway-hint">Tasks waiting for an owner</span>
              </button>
            </section>

            {members.length > 0 ? (
              <section className="fc-admin-inbox-roster" aria-label="Team roster">
                <div className="fc-admin-inbox-roster-head">
                  <span className={`text-sm font-extrabold uppercase tracking-wide text-violet-600 ${FINELY_OS_ENTITY_BODY}`}>Team roster</span>
                  <h2>Drag a task onto a teammate to assign</h2>
                  <p>Or use Assignees in the inspector when a task is selected.</p>
                </div>
                <div className="fc-admin-inbox-roster-strip">
                  <button
                    type="button"
                    className="fc-admin-inbox-roster-chip"
                    data-unassign="true"
                    data-drag-over={dragOverMemberId === '__unassigned__' ? 'true' : undefined}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverMemberId('__unassigned__');
                    }}
                    onDragLeave={() => setDragOverMemberId(null)}
                    onDrop={(e) => handleDropOnMember(e, null)}
                    onClick={() => selectedTask && handleClearAssignees(selectedTask.id)}
                    title="Drop a task here, or click with a task selected, to clear assignees"
                  >
                    <UserCog size={13} /> Unassigned
                  </button>
                  {members.map((m) => (
                    <button
                      key={m.userId}
                      type="button"
                      className="fc-admin-inbox-roster-chip"
                      data-drag-over={dragOverMemberId === m.userId ? 'true' : undefined}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverMemberId(m.userId);
                      }}
                      onDragLeave={() => setDragOverMemberId(null)}
                      onDrop={(e) => handleDropOnMember(e, m.userId)}
                      onClick={() => selectedTask && handleAssignMember(selectedTask.id, m.userId)}
                      title={`Drop a task here, or click with a task selected, to assign ${membershipDisplayLabel(m)}`}
                    >
                      <UserCog size={13} /> {membershipDisplayLabel(m)}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="fc-admin-inbox-queue-layout" data-surface-layout="queue-detail">
              <aside className="fc-admin-inbox-queue-rail">
                <div className="fc-admin-inbox-queue-head">
                  <div className="fc-admin-inbox-queue-title">Ranked task queue</div>
                  <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                    {inboxQueueTasks.length} task{inboxQueueTasks.length === 1 ? '' : 's'} in view
                  </p>
                  <div className="fc-admin-inbox-lane-pills" role="group" aria-label="Queue lanes">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="fc-admin-inbox-lane-pill"
                          data-accent={item.accent}
                          data-active={activeRoom === item.id ? 'true' : undefined}
                          onClick={() => setActiveRoom(item.id)}
                        >
                          <Icon size={14} />
                          {item.label}
                          {item.badge ? <span className="fc-admin-inbox-lane-badge">{item.badge}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="fc-admin-inbox-queue-toolbar">
                  <div className="fc-wlp-op-toolbar">
                    <div className="fc-wlp-op-toolbar-search">
                      <Search size={14} aria-hidden />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title, partner…"
                        aria-label="Search tasks"
                      />
                    </div>
                    <select
                      className="fc-wlp-op-toolbar-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
                      aria-label="Filter by status"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <select
                      className="fc-wlp-op-toolbar-select"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      aria-label="Filter by priority"
                    >
                      <option value="all">All priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </select>
                    <select
                      className="fc-wlp-op-toolbar-select"
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      aria-label="Filter by assignee"
                    >
                      <option value="all">All assignees</option>
                      <option value="unassigned">Unassigned only</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {membershipDisplayLabel(m)}
                        </option>
                      ))}
                    </select>
                    {hasActiveFilters ? (
                      <button type="button" className="fc-wlp-op-toolbar-clear" onClick={clearFilters}>
                        <X size={12} /> Clear
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="fc-admin-inbox-queue-list">
                  {renderTaskStack(inboxQueueTasks, inboxQueueEmpty)}
                </div>
              </aside>

              <main className="fc-admin-inbox-detail-stage">
                {taskInspectorPanel ?? (
                  <div className="fc-admin-inbox-detail-empty">
                    <h3>Select a task</h3>
                    <p>Pick a queue item to inspect checklist steps, assignees, and SLA status.</p>
                  </div>
                )}
              </main>
            </section>
          </div>

          <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
            Results vary · not legal advice · funding subject to underwriting
          </p>
        </ProductHubScaffold>
        {createTaskModal}
      </>
    );
  }

  return (
    <>
    <AdminStageShell family="service-suite" signature="workflow-ranked-river" accent="rose">
      <AdminStageHero
        tone="control"
        accent="rose"
        eyebrow="Service Operations · Workflow Workstation"
        title={
          <>
            Ranked <span className="text-rose-400">work river</span>
          </>
        }
        description="Prioritized service channels with live SLA clocks, partner links, and real-time task triage."
        status={`${tasks.length} tasks in river · ${dataMode} data`}
        freshness={formatFreshness(tasks[0]?.updatedAt)}
        icon={Inbox}
        primaryAction={
          <ProductPagePrimaryAction label="Create Task" onClick={() => setIsCreatingTask(true)} />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => setActiveRoom('overdue')}>
            <Clock3 size={15} /> SLA Breaches Queue
          </button>
        }
      />

      <WorkflowDailyBriefingStrip tasks={tasks} />

      <AdminSignalRail label="Service Signals" signals={signals} />

      {members.length > 0 ? (
        <section className="fc-wlp-admin-stage-section" data-tone="clear" aria-label="Team roster">
          <div className="fc-wlp-admin-stage-section-head">
            <div>
              <span>Team Roster</span>
              <h2>Drag a task onto a teammate to assign</h2>
              <p>Or use the Assignees control inside the inspector — keyboard and touch friendly.</p>
            </div>
          </div>
          <div className="fc-wlp-op-roster-strip">
            <button
              type="button"
              className="fc-wlp-op-roster-chip"
              data-unassign="true"
              data-drag-over={dragOverMemberId === '__unassigned__' ? 'true' : undefined}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverMemberId('__unassigned__');
              }}
              onDragLeave={() => setDragOverMemberId(null)}
              onDrop={(e) => handleDropOnMember(e, null)}
              onClick={() => selectedTask && handleClearAssignees(selectedTask.id)}
              title="Drop a task here, or click with a task selected, to clear its assignees"
            >
              <UserCog size={13} /> Unassigned
            </button>
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                className="fc-wlp-op-roster-chip"
                data-drag-over={dragOverMemberId === m.userId ? 'true' : undefined}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverMemberId(m.userId);
                }}
                onDragLeave={() => setDragOverMemberId(null)}
                onDrop={(e) => handleDropOnMember(e, m.userId)}
                onClick={() => selectedTask && handleAssignMember(selectedTask.id, m.userId)}
                title={`Drop a task here, or click with a task selected, to assign ${membershipDisplayLabel(m)}`}
              >
                <UserCog size={13} /> {membershipDisplayLabel(m)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="fc-wlp-workflow-queue-deck">
        <div className="fc-wlp-workflow-queue-pane">
          <nav className="fc-wlp-workflow-queue-rail" aria-label="Service queues">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="fc-wlp-workflow-queue-rail-btn"
                  data-active={activeRoom === item.id ? 'true' : undefined}
                  data-accent={item.accent}
                  onClick={() => setActiveRoom(item.id)}
                >
                  <Icon size={15} aria-hidden />
                  {item.label}
                  {item.badge ? <span className="fc-wlp-workflow-queue-rail-badge">{item.badge}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="fc-wlp-op-toolbar">
            <div className="fc-wlp-op-toolbar-search">
              <Search size={14} aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, partner…"
                aria-label="Search tasks"
              />
            </div>
            <select
              className="fc-wlp-op-toolbar-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="fc-wlp-op-toolbar-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
            <select
              className="fc-wlp-op-toolbar-select"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              aria-label="Filter by assignee"
            >
              <option value="all">All assignees</option>
              <option value="unassigned">Unassigned only</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {membershipDisplayLabel(m)}
                </option>
              ))}
            </select>
            {hasActiveFilters ? (
              <button type="button" className="fc-wlp-op-toolbar-clear" onClick={clearFilters}>
                <X size={12} /> Clear
              </button>
            ) : null}
          </div>

          <div className="fc-wlp-workflow-queue-body">
            {activeRoom === 'overdue' || activeRoom === 'unassigned' ? (
              <div className="fc-wlp-workflow-river-list">
                {renderTaskStack(
                  activeRoom === 'overdue' ? riverLaneBuckets.overdue : riverLaneBuckets.unassigned,
                  activeRoom === 'overdue'
                    ? 'No overdue SLA breaches right now — clear filters or check back later.'
                    : 'No unassigned triage items — assign owners from overdue or due-today lanes first.',
                )}
              </div>
            ) : (
              <div className="fc-wlp-workflow-river-container">
                <div className="fc-wlp-workflow-lane" data-lane="overdue">
                  <div className="fc-wlp-workflow-lane-head">
                    <span className="fc-wlp-workflow-lane-title text-rose-400">
                      <Clock3 size={16} /> Past SLA / Overdue ({riverLaneBuckets.overdue.length})
                    </span>
                  </div>
                  <div className="fc-wlp-workflow-river-list">
                    {renderTaskStack(
                      riverLaneBuckets.overdue,
                      'No overdue SLA breaches right now — triage due-today or unassigned lanes next.',
                    )}
                  </div>
                </div>

                <div className="fc-wlp-workflow-lane" data-lane="today">
                  <div className="fc-wlp-workflow-lane-head">
                    <span className="fc-wlp-workflow-lane-title text-sky-400">
                      <CheckCircle2 size={16} /> Due Today ({riverLaneBuckets.due_today.length})
                    </span>
                  </div>
                  <div className="fc-wlp-workflow-river-list">
                    {renderTaskStack(
                      riverLaneBuckets.due_today,
                      'No tasks due today — check overdue breaches or assign unowned work.',
                    )}
                  </div>
                </div>

                <div className="fc-wlp-workflow-lane" data-lane="unassigned">
                  <div className="fc-wlp-workflow-lane-head">
                    <span className="fc-wlp-workflow-lane-title text-violet-400">
                      <Users size={16} /> Unassigned Triage ({riverLaneBuckets.unassigned.length})
                    </span>
                  </div>
                  <div className="fc-wlp-workflow-river-list">
                    {renderTaskStack(
                      riverLaneBuckets.unassigned,
                      'All active tasks have assigned owners — drag from another lane if reassignment is needed.',
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="fc-wlp-workflow-detail-pane">
          {taskInspectorPanel ?? (
            <div className="fc-wlp-workflow-detail-empty">
              <h3>Select a task</h3>
              <p>Pick a queue item to inspect checklist steps, assignees, and SLA status.</p>
            </div>
          )}
        </div>
      </div>

      <AdminContextCommand
        title="Workflow Operating Standard"
        description="Tasks are ranked by service clock risk and partner impact. Overdue items clear before opening low-risk work."
        steps={[
          'Clear past-target SLA breach tasks first.',
          'Assign unowned tasks to team coordinators.',
          'Complete fulfillment checklist steps before closing task.',
        ]}
        prompt="Which task in the river should I assign or complete next?"
        contextLabel="Workflow River Workstation"
        onWatch={() => openProductCopilot({ prompt: 'How do I manage service clock SLA breaches?', contextLabel: 'Workflow Workstation' })}
      />
    </AdminStageShell>
    {createTaskModal}
    </>
  );
}

function TaskCard({
  task,
  partnerName,
  rank,
  isSelected,
  onSelect,
  draggable,
  onDragStart,
  surfaceVariant = 'workflow',
}: {
  task: TaskItem;
  partnerName: string;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  surfaceVariant?: WorkflowRiverSurfaceVariant;
}) {
  const isOverdue = isOverdueTask(task);
  const assigneeCount = (task.assigneeUserIds ?? []).length;
  const isInboxCard = surfaceVariant === 'inbox';
  return (
    <div
      className={isInboxCard ? 'fc-admin-inbox-task-card' : 'fc-wlp-workflow-item-card'}
      data-selected={isSelected ? 'true' : undefined}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onSelect}
      title={draggable ? 'Drag onto a teammate in the roster to assign' : undefined}
    >
      <div className={isInboxCard ? 'fc-admin-inbox-task-head' : 'fc-wlp-workflow-item-head'}>
        <span className={isInboxCard ? 'fc-admin-inbox-rank-badge' : 'fc-wlp-workflow-rank-badge'}>#{rank}</span>
        <span
          className={isInboxCard ? 'fc-admin-inbox-clock-chip' : 'fc-wlp-workflow-clock-chip'}
          data-accent={isOverdue ? 'rose' : 'sky'}
        >
          <Clock3 size={11} /> {isOverdue ? 'SLA Breach' : 'On Track'}
        </span>
      </div>
      <div className={isInboxCard ? 'fc-admin-inbox-task-title' : 'fc-wlp-workflow-item-title'}>{task.title}</div>
      <div className={isInboxCard ? 'fc-admin-inbox-task-partner' : 'fc-wlp-workflow-item-partner'}>
        Partner: <strong className={isInboxCard ? 'text-slate-900' : 'text-slate-200'}>{partnerName}</strong>
        {assigneeCount > 0 ? (
          <span className="ml-2 text-emerald-600">· {assigneeCount} assigned</span>
        ) : (
          <span className="ml-2 text-violet-600">· unassigned</span>
        )}
      </div>
    </div>
  );
}

/** Shared task detail body used by every Workflow room (river / SLA breaches / unassigned triage). */
function TaskInspectorBody({
  task,
  partnerName,
  members,
  dueDateDraft,
  setDueDateDraft,
  onStatusChange,
  onToggleChecklist,
  onSetDueDate,
  onAssign,
  onUnassign,
}: {
  task: TaskItem;
  partnerName: string;
  members: Membership[];
  dueDateDraft: string;
  setDueDateDraft: (v: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onToggleChecklist: (taskId: string, itemId: string) => void;
  onSetDueDate: (taskId: string, dateValue: string) => void;
  onAssign: (taskId: string, userId: string) => void;
  onUnassign: (taskId: string, userId: string) => void;
}) {
  const assignedIds = task.assigneeUserIds ?? [];
  return (
    <>
      <div className="fc-wlp-op-inspector-header">
        <div>
          <span className="fc-wlp-op-inspector-eyebrow text-rose-400">
            <Inbox size={14} /> Task Inspector
          </span>
          <div className="fc-wlp-op-inspector-title">{task.title}</div>
          <div className="mt-1 text-[11px] text-slate-400">Partner: {partnerName}</div>
        </div>
        <span className="fc-wlp-crm-column-badge">{task.priority ?? 'normal'}</span>
      </div>

      <div className="fc-wlp-op-inspector-body">
        <div className="fc-wlp-op-inspector-section">
          <span className="fc-wlp-op-inspector-label">Status &amp; Due Date</span>
          <select
            aria-label="Task status"
            className="bg-slate-900 border border-slate-700 text-slate-100 rounded p-1.5 text-xs w-full focus:border-rose-400 focus:outline-none"
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="fc-wlp-op-field-row">
            <CalendarClock size={14} className="text-sky-400 shrink-0" />
            <input
              type="date"
              aria-label="Task inspector due date"
              className="fc-wlp-op-date-input"
              value={dueDateDraft}
              onChange={(e) => setDueDateDraft(e.target.value)}
            />
            <button
              type="button"
              className="fc-wlp-op-btn-secondary fc-wlp-op-btn-sm whitespace-nowrap"
              onClick={() => onSetDueDate(task.id, dueDateDraft)}
            >
              Save
            </button>
          </div>
        </div>

        <div className="fc-wlp-op-inspector-section">
          <span className="fc-wlp-op-inspector-label">
            <UserCog size={12} className="inline -mt-0.5 mr-1" /> Assignees
          </span>
          {members.length === 0 ? (
            <div className="text-xs text-slate-500 italic">No active team members found for this tenant.</div>
          ) : (
            <div className="space-y-1">
              {members.map((m) => {
                const checked = assignedIds.includes(m.userId);
                return (
                  <label
                    key={m.userId}
                    className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 p-1.5 rounded border border-slate-800 cursor-pointer hover:bg-slate-800/80"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => (checked ? onUnassign(task.id, m.userId) : onAssign(task.id, m.userId))}
                      className="rounded text-emerald-500 bg-slate-900 border-slate-700"
                    />
                    <span>{membershipDisplayLabel(m)}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="fc-wlp-op-inspector-section">
          <span className="fc-wlp-op-inspector-label">Fulfillment Checklist</span>
          <div className="space-y-1.5">
            {(task.checklist ?? []).map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 cursor-pointer hover:bg-slate-800/80"
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => onToggleChecklist(task.id, item.id)}
                  className="rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
                <span className={item.done ? 'line-through text-slate-500' : 'text-slate-200'}>{item.text}</span>
              </label>
            ))}
            {(task.checklist ?? []).length === 0 ? (
              <div className="text-xs text-slate-500 italic">No checklist items defined</div>
            ) : null}
          </div>
        </div>

        <div className="fc-wlp-op-inspector-actions">
          <button
            type="button"
            className="fc-wlp-op-btn-primary"
            onClick={() => onStatusChange(task.id, 'completed')}
          >
            <Check size={15} /> Mark Task Complete
          </button>
          <button
            type="button"
            className="fc-wlp-op-btn-secondary"
            onClick={() => onStatusChange(task.id, 'in_progress')}
          >
            <Activity size={14} /> Start Execution
          </button>
        </div>
      </div>
    </>
  );
}

/* =================================────────────────=========================
   3. Cases Workstation Component (100% Self-Contained)
   ========================================================================== */

function CasesWorkstation({ pageId, entityId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isDemo = dataMode === 'demo';
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeRoom, setActiveRoom] = useState<string>('docket');
  const [showExhibitDrawer, setShowExhibitDrawer] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [actions, setActions] = useState<DisputeCaseAction[]>([]);
  const openCaseId = entityId || searchParams.get('caseId') || null;

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DisputeRoundStatus>('all');
  const [bureauFilter, setBureauFilter] = useState<'all' | Bureau>('all');

  // Bureau response logging draft
  const [responseNoteDraft, setResponseNoteDraft] = useState('');
  const [responseOutcomeDraft, setResponseOutcomeDraft] = useState<ResponseOutcome | ''>('');

  // Round deadline editor draft
  const [deadlineDraft, setDeadlineDraft] = useState('');

  // Collaboration timeline draft
  const [adminNoteDraft, setAdminNoteDraft] = useState('');

  // Local creation modal state
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseBureau, setNewCaseBureau] = useState<'EQF' | 'EXP' | 'TUC'>('EQF');
  const [newCasePartnerId, setNewCasePartnerId] = useState('');

  useEffect(() => {
    if (isDemo) {
      setCases(DEMO_CASES);
      setSelectedCaseId(DEMO_CASES[0].id);
      setPartners(DEMO_PARTNERS);
    } else {
      try {
        const live = listCases();
        if (live.length > 0) {
          setCases(live);
          setSelectedCaseId(live[0].id);
        } else {
          setCases([]);
          setSelectedCaseId(null);
        }
      } catch {
        setCases([]);
        setSelectedCaseId(null);
      }
      fetchAllPartnersAsAdmin()
        .then(setPartners)
        .catch(() => setPartners([]));
    }
  }, [isDemo]);

  useEffect(() => {
    if (openCaseId) setSelectedCaseId(openCaseId);
  }, [openCaseId]);

  const openCaseInspector = (caseId: string) => {
    setSelectedCaseId(caseId);
    navigate(caseRecordHref(pathname, caseId));
  };

  const closeCaseInspector = () => {
    navigate(casesHubHref(pathname));
  };

  const selectedCase = useMemo(
    () => cases.find((c) => c.id === selectedCaseId) ?? cases[0] ?? null,
    [cases, selectedCaseId],
  );

  const refreshActions = (caseId: string) => {
    if (isDemo) return;
    try {
      setActions(listDisputeActionsByCase(caseId));
    } catch {
      setActions([]);
    }
  };

  useEffect(() => {
    if (!selectedCase) {
      setActions([]);
      return;
    }
    const latest = getLatestCaseRound(selectedCase);
    setDeadlineDraft(latest?.dueAt ? latest.dueAt.slice(0, 10) : '');
    if (isDemo) {
      setActions([]);
      return;
    }
    try {
      setActions(listDisputeActionsByCase(selectedCase.id));
    } catch {
      setActions([]);
    }
  }, [selectedCase?.id, isDemo]);

  const handleMarkMailed = (caseId: string) => {
    const c = cases.find((x) => x.id === caseId);
    const round = (c && getLatestCaseRound(c)?.round) ?? 'Round 1';
    if (!isDemo) {
      markCaseRoundMailed({ caseId, round, createdBy: 'admin' });
      setCases(listCases());
      refreshActions(caseId);
    } else {
      setCases((prev) =>
        prev.map((cc) => {
          if (cc.id !== caseId) return cc;
          const rounds = cc.rounds.map((r) =>
            r.round === round ? { ...r, status: 'mailed' as const, mailedAt: new Date().toISOString() } : r,
          );
          return { ...cc, rounds, updatedAt: new Date().toISOString() };
        }),
      );
    }
  };

  const handleLogResponse = (caseId: string) => {
    const c = cases.find((x) => x.id === caseId);
    const round = (c && getLatestCaseRound(c)?.round) ?? 'Round 1';
    const notes = responseNoteDraft.trim() || undefined;
    const responseOutcome = responseOutcomeDraft || undefined;
    if (!isDemo) {
      markCaseRoundResponseReceived({ caseId, round, notes, responseOutcome, createdBy: 'admin' });
      setCases(listCases());
      refreshActions(caseId);
    } else {
      setCases((prev) =>
        prev.map((cc) => {
          if (cc.id !== caseId) return cc;
          const rounds = cc.rounds.map((r) =>
            r.round === round
              ? {
                  ...r,
                  status: 'response_received' as const,
                  responseReceivedAt: new Date().toISOString(),
                  notes: notes ?? r.notes,
                  responseOutcome: responseOutcome ?? r.responseOutcome,
                }
              : r,
          );
          return { ...cc, rounds, updatedAt: new Date().toISOString() };
        }),
      );
    }
    setResponseNoteDraft('');
    setResponseOutcomeDraft('');
  };

  const handleStartNextRound = (caseId: string) => {
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    const latest = getLatestCaseRound(c);
    const nextRound = suggestNextRound(c);
    if (latest && latest.round === nextRound) return;
    const createdAt = new Date().toISOString();
    if (!isDemo) {
      updateCaseRound({ caseId, round: nextRound, patch: { tone: latest?.tone ?? 'formal', createdAt, status: 'draft' } });
      recordDisputeCaseAction({
        caseId,
        partnerId: c.partnerId,
        round: nextRound,
        type: 'note',
        title: `${nextRound} opened`,
        body: 'New dispute round started by admin.',
        createdBy: 'admin',
      });
      setCases(listCases());
      refreshActions(caseId);
    } else {
      setCases((prev) =>
        prev.map((cc) => {
          if (cc.id !== caseId) return cc;
          const idx = cc.rounds.findIndex((r) => r.round === nextRound);
          const rounds = cc.rounds.slice();
          const newRound = { round: nextRound, tone: latest?.tone ?? ('formal' as const), createdAt, status: 'draft' as const };
          if (idx >= 0) rounds[idx] = { ...rounds[idx]!, ...newRound };
          else rounds.push(newRound);
          return { ...cc, rounds, updatedAt: createdAt };
        }),
      );
    }
  };

  const handleSetDeadline = (caseId: string, dateValue: string) => {
    const c = cases.find((x) => x.id === caseId);
    const round = (c && getLatestCaseRound(c)?.round) ?? 'Round 1';
    const dueAt = dateValue ? new Date(`${dateValue}T17:00:00`).toISOString() : undefined;
    if (!isDemo) {
      updateCaseRound({ caseId, round, patch: { dueAt } });
      setCases(listCases());
    } else {
      setCases((prev) =>
        prev.map((cc) =>
          cc.id === caseId
            ? { ...cc, rounds: cc.rounds.map((r) => (r.round === round ? { ...r, dueAt } : r)), updatedAt: new Date().toISOString() }
            : cc,
        ),
      );
    }
  };

  const handleAddAdminNote = (caseId: string) => {
    const text = adminNoteDraft.trim();
    if (!text) return;
    const c = cases.find((x) => x.id === caseId);
    if (!c) return;
    if (!isDemo) {
      recordDisputeCaseAction({
        caseId,
        partnerId: c.partnerId,
        round: getLatestCaseRound(c)?.round,
        type: 'note',
        title: 'Admin note added',
        body: text,
        createdBy: 'admin',
      });
      refreshActions(caseId);
    } else {
      setActions((prev) => [
        {
          id: `demo_act_${Date.now()}`,
          caseId,
          partnerId: c.partnerId,
          round: getLatestCaseRound(c)?.round,
          type: 'note',
          title: 'Admin note added',
          body: text,
          createdAt: new Date().toISOString(),
          createdBy: 'admin',
        },
        ...prev,
      ]);
    }
    setAdminNoteDraft('');
  };

  const visibleCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = cases.filter((c) => {
      if (bureauFilter !== 'all' && c.bureau !== bureauFilter) return false;
      if (statusFilter !== 'all') {
        const latest = getLatestCaseRound(c);
        const status = latest ? inferRoundStatus(latest) : 'draft';
        if (status !== statusFilter) return false;
      }
      if (q) {
        const partnerName = partners.find((p) => p.id === c.partnerId)?.profile?.fullName ?? '';
        const hay = [c.title, c.partnerId, partnerName, c.bureau].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (activeRoom === 'bureau') {
      return filtered.slice().sort((a, b) => a.bureau.localeCompare(b.bureau) || b.updatedAt.localeCompare(a.updatedAt));
    }
    if (activeRoom === 'deadlines') {
      return filtered
        .slice()
        .sort((a, b) => {
          const aDue = getLatestCaseRound(a)?.dueAt;
          const bDue = getLatestCaseRound(b)?.dueAt;
          if (!aDue && !bDue) return 0;
          if (!aDue) return 1;
          if (!bDue) return -1;
          return Date.parse(aDue) - Date.parse(bDue);
        });
    }
    return filtered;
  }, [cases, searchQuery, statusFilter, bureauFilter, partners, activeRoom]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || statusFilter !== 'all' || bureauFilter !== 'all';
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setBureauFilter('all');
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;
    if (!isDemo && !newCasePartnerId.trim()) return;
    if (isDemo) {
      const demoCreated: DisputeCase = {
        id: `demo_case_${Date.now()}`,
        partnerId: newCasePartnerId || 'partner_local',
        projectId: 'proj_local',
        bureau: newCaseBureau,
        title: newCaseTitle,
        status: 'open',
        items: [
          { id: `i_${Date.now()}`, bureau: newCaseBureau, account: 'Unverified Account', type: 'Collection', status: 'Disputed', code: 'collection', reasons: ['Inaccurate reporting'] },
        ],
        rounds: [
          {
            round: 'Round 1',
            tone: 'formal',
            status: 'letter_generated',
            createdAt: new Date().toISOString(),
            dueAt: new Date(Date.now() + 35 * 86400000).toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCases((prev) => [demoCreated, ...prev]);
      setSelectedCaseId(demoCreated.id);
    } else {
      const created = createDisputeCase({
        partnerId: newCasePartnerId,
        bureau: newCaseBureau,
        title: newCaseTitle,
        items: [
          { id: `i_${Date.now()}`, bureau: newCaseBureau, account: 'Unverified Account', type: 'Collection', status: 'Disputed', code: 'collection', reasons: ['Inaccurate reporting'] },
        ],
        initialRound: { round: 'Round 1', tone: 'formal', createdAt: new Date().toISOString() },
      });
      setCases((prev) => [created, ...prev]);
      setSelectedCaseId(created.id);
    }
    setNewCaseTitle('');
    setNewCasePartnerId('');
    setIsCreatingCase(false);
  };

  const navItems: AdminStageNavItem[] = [
    { id: 'docket', label: 'Evidence Docket', description: 'Chronological dispute spine', icon: Gavel, accent: 'rose' },
    { id: 'bureau', label: 'Bureau Breakdown', description: 'Equifax, Experian, TransUnion', icon: Building2, accent: 'violet' },
    { id: 'deadlines', label: 'Mailing Deadlines', description: '30-day response monitors', icon: ShieldCheck, accent: 'sky' },
    { id: 'research', label: 'Opinion research', description: 'CourtListener staff search', icon: Scale, accent: 'emerald' },
  ];

  const signals: AdminStageSignal[] = [
    {
      id: 'active',
      label: 'Open Cases',
      value: cases.filter((c) => c.status === 'open').length,
      detail: 'Active bureau dispute dockets',
      icon: Gavel,
      accent: 'rose',
      featured: true,
      onClick: () => setActiveRoom('docket'),
    },
    {
      id: 'awaiting',
      label: 'Awaiting Bureau',
      value: cases.filter((c) => {
        const latest = getLatestCaseRound(c);
        return latest && inferRoundStatus(latest) === 'awaiting_response';
      }).length,
      detail: 'Letters sent to bureau',
      icon: Clock3,
      accent: 'sky',
      onClick: () => setActiveRoom('docket'),
    },
    {
      id: 'review',
      label: 'Review Ready',
      value: cases.filter((c) => {
        const latest = getLatestCaseRound(c);
        return latest && inferRoundStatus(latest) === 'letter_generated';
      }).length,
      detail: 'Generated letters awaiting signoff',
      icon: FileCheck2,
      accent: 'emerald',
      onClick: () => setActiveRoom('docket'),
    },
    {
      id: 'deadlines',
      label: 'Near Deadlines',
      value: cases.filter((c) => {
        const latest = getLatestCaseRound(c);
        if (!latest?.dueAt) return false;
        return Date.parse(latest.dueAt) - Date.now() < 7 * 86400000;
      }).length,
      detail: 'Due within 7 days',
      icon: ShieldCheck,
      accent: 'violet',
      onClick: () => setActiveRoom('deadlines'),
    },
  ];

  return (
    <AdminStageShell family="docket-suite" signature="cases-evidence-docket" accent="rose">
      <AdminStageHero
        tone="docket"
        accent="rose"
        eyebrow="Case Studio · Docket Workstation"
        title={
          <>
            Dark <span className="text-rose-400">Evidence-First Docket</span>
          </>
        }
        description="Timeline spine connecting bureau rounds, factual dispute items, and evidence exhibits."
        status={`${cases.length} cases on docket · ${dataMode} data`}
        freshness={formatFreshness(cases[0]?.updatedAt)}
        icon={Gavel}
        primaryAction={
          <ProductPagePrimaryAction label="Open New Case" onClick={() => setIsCreatingCase(true)} />
        }
        secondaryAction={
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => setActiveRoom('deadlines')}>
            <ShieldCheck size={15} /> 30-Day Response Monitor
          </button>
        }
      />

      <div className="fc-wlp-cases-timeline-runway" role="tablist" aria-label="Docket rooms">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.id}>
              <button
                type="button"
                role="tab"
                aria-selected={activeRoom === item.id}
                className="fc-wlp-cases-runway-node"
                data-active={activeRoom === item.id ? 'true' : undefined}
                data-accent={item.accent}
                onClick={() => setActiveRoom(item.id)}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </button>
              {index < navItems.length - 1 ? <span className="fc-wlp-cases-runway-spine" aria-hidden /> : null}
            </React.Fragment>
          );
        })}
      </div>

      <AdminSignalRail label="Docket Signals" signals={signals} />

      {activeRoom === 'research' ? (
        <section className="fc-wlp-cases-research-studio" aria-label="Opinion research">
          <header>
            <span>Staff research</span>
            <h2>CourtListener opinions</h2>
            <p>Cached federal opinions for this docket. Not scraped from state court sites. Not legal advice. Results vary.</p>
          </header>
          <CourtListenerOpinionSearch />
        </section>
      ) : (
      <div className="fc-wlp-cases-timeline-body">
        <header className="fc-wlp-cases-timeline-head">
          <div>
            <span>Evidence docket</span>
            <h2>
              {activeRoom === 'bureau'
                ? 'Bureau Breakdown'
                : activeRoom === 'deadlines'
                  ? 'Mailing Deadlines'
                  : 'Bureau Decision Timeline'}
            </h2>
            <p>
              {activeRoom === 'bureau'
                ? 'Cases grouped by credit bureau — Equifax, Experian, TransUnion.'
                : activeRoom === 'deadlines'
                  ? 'Cases sorted by nearest 30-day response deadline first.'
                  : 'Select a case row on the spine to inspect factual findings, evidence exhibits, and round status.'}
            </p>
          </div>
          <div className="fc-wlp-op-toolbar">
            <div className="fc-wlp-op-toolbar-search">
              <Search size={14} aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, partner…"
                aria-label="Search cases"
              />
            </div>
            <select
              className="fc-wlp-op-toolbar-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | DisputeRoundStatus)}
              aria-label="Filter by round status"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="letter_generated">Letter saved</option>
              <option value="mailed">Mailed / sent</option>
              <option value="awaiting_response">Awaiting response</option>
              <option value="response_received">Response received</option>
              <option value="escalated">Escalated</option>
              <option value="ready_for_next_round">Ready for next round</option>
              <option value="litigation_review">Litigation review</option>
            </select>
            <select
              className="fc-wlp-op-toolbar-select"
              value={bureauFilter}
              onChange={(e) => setBureauFilter(e.target.value as 'all' | Bureau)}
              aria-label="Filter by bureau"
            >
              <option value="all">All bureaus</option>
              <option value="EQF">Equifax</option>
              <option value="EXP">Experian</option>
              <option value="TUC">TransUnion</option>
            </select>
            {hasActiveFilters ? (
              <button type="button" className="fc-wlp-op-toolbar-clear" onClick={clearFilters}>
                <X size={12} /> Clear
              </button>
            ) : null}
          </div>
        </header>

        <div className="fc-wlp-op-stage-wrapper">
          {/* Dark Evidence-First Docket with Spine */}
          <div className="fc-wlp-cases-docket-container">
            <div className="fc-wlp-cases-spine-line" aria-hidden />

            {visibleCases.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 italic">No cases match the current filters.</div>
            ) : null}

            {visibleCases.map((caseRow) => {
              const isSelected = selectedCase?.id === caseRow.id;
              const latest = getLatestCaseRound(caseRow);
              const roundStatus = latest ? inferRoundStatus(latest) : 'draft';
              const bureauCode = bureauShortCode(caseRow.bureau);

              return (
                <div
                  key={caseRow.id}
                  className="fc-wlp-cases-docket-row"
                  data-selected={isSelected ? 'true' : undefined}
                  onClick={() => openCaseInspector(caseRow.id)}
                >
                  <div className="fc-wlp-cases-row-head">
                    <div className="fc-wlp-cases-row-title-block">
                      <div className="fc-wlp-cases-row-title">{caseRow.title}</div>
                      <div className="fc-wlp-cases-row-partner">
                        Partner: <strong className="text-slate-200">{partnerDisplayLabel(partners, caseRow.partnerId)}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="fc-wlp-bureau-chip" data-bureau={bureauCode}>
                        {bureauCode}
                      </span>
                      <span className="fc-wlp-crm-column-badge">{latest?.round ?? 'Round 1'}</span>
                    </div>
                  </div>

                  <div className="fc-wlp-cases-row-body">
                    <div className="fc-wlp-cases-exhibits-tag">
                      <FileText size={13} className="text-rose-400" />
                      <span>{caseRow.items.length} dispute item(s) • Status: <strong className="text-violet-400">{roundStatus}</strong></span>
                    </div>

                    <div className="fc-wlp-cases-deadline-bar">
                      <Clock3 size={13} className="text-sky-400" />
                      <span>{latest?.dueAt ? `Target: ${new Date(latest.dueAt).toLocaleDateString()}` : 'No deadline'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Persistent Case Inspector */}
          {selectedCase ? (
            <div className="fc-wlp-op-inspector-panel">
              <div className="fc-wlp-op-inspector-header">
                <div>
                  <span className="fc-wlp-op-inspector-eyebrow text-rose-400">
                    <Gavel size={14} /> Case Inspector
                  </span>
                  <div className="fc-wlp-op-inspector-title">{selectedCase.title}</div>
                </div>
                <span className="fc-wlp-bureau-chip" data-bureau={bureauShortCode(selectedCase.bureau)}>
                  {bureauShortCode(selectedCase.bureau)}
                </span>
              </div>

              <div className="fc-wlp-op-inspector-body">
                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">Dispute Items & Findings</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {selectedCase.items.map((item) => (
                      <div key={item.id} className="text-xs bg-slate-900/70 p-2 rounded border border-slate-800 text-slate-300">
                        <div className="font-bold text-slate-200">{item.account}</div>
                        <div className="text-[11px] text-slate-400 flex justify-between mt-0.5">
                          <span>{item.type}</span>
                          <span className="text-emerald-400 font-semibold">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">Round Details &amp; Deadline</span>
                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 text-xs space-y-2">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Active Round:</span>
                      <strong className="text-violet-400">{getLatestCaseRound(selectedCase)?.round ?? 'Round 1'}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Round Status:</span>
                      <strong className="text-emerald-400">
                        {(() => {
                          const latest = getLatestCaseRound(selectedCase);
                          return latest ? ROUND_STATUS_LABELS[inferRoundStatus(latest)] : ROUND_STATUS_LABELS.draft;
                        })()}
                      </strong>
                    </div>
                    <div className="fc-wlp-op-field-row">
                      <CalendarClock size={14} className="text-sky-400 shrink-0" />
                      <input
                        type="date"
                        aria-label="Case round deadline"
                        className="fc-wlp-op-date-input"
                        value={deadlineDraft}
                        onChange={(e) => setDeadlineDraft(e.target.value)}
                      />
                      <button
                        type="button"
                        className="fc-wlp-op-btn-secondary fc-wlp-op-btn-sm whitespace-nowrap"
                        onClick={() => handleSetDeadline(selectedCase.id, deadlineDraft)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {showExhibitDrawer ? (
                  <div className="bg-slate-900/90 p-3 rounded-lg border border-rose-500/30 text-xs space-y-2">
                    <div className="font-bold text-rose-300 flex items-center justify-between">
                      <span>Evidence Exhibits ({selectedCase.items.length})</span>
                      <button type="button" onClick={() => setShowExhibitDrawer(false)} className="text-slate-400 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                    {selectedCase.items.map((it) => (
                      <div key={it.id} className="text-[11px] text-slate-300 border-b border-slate-800 pb-1">
                        <div>Account: <strong>{it.account}</strong></div>
                        <div className="text-slate-400">Reasons: {(it.reasons ?? []).join(', ') || 'Inaccurate timestamp'}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">Log Bureau Response</span>
                  <select
                    aria-label="Bureau response outcome"
                    className="bg-slate-900 border border-slate-700 text-slate-100 rounded p-1.5 text-xs w-full focus:border-rose-400 focus:outline-none"
                    value={responseOutcomeDraft}
                    onChange={(e) => setResponseOutcomeDraft(e.target.value as ResponseOutcome | '')}
                  >
                    <option value="">Outcome (optional)…</option>
                    <option value="deleted">Deleted</option>
                    <option value="updated">Updated</option>
                    <option value="verified_unchanged">Verified — unchanged</option>
                    <option value="partial">Partial resolution</option>
                    <option value="reinserted">Reinserted</option>
                    <option value="no_response">No response</option>
                  </select>
                  <textarea
                    aria-label="Bureau response note"
                    rows={2}
                    value={responseNoteDraft}
                    onChange={(e) => setResponseNoteDraft(e.target.value)}
                    placeholder="What did the bureau report back? (optional)"
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 focus:border-rose-400 focus:outline-none resize-none"
                  />
                </div>

                <div className="fc-wlp-op-inspector-actions">
                  <button
                    type="button"
                    className="fc-wlp-op-btn-primary"
                    onClick={() => handleMarkMailed(selectedCase.id)}
                  >
                    <Check size={15} /> Mark Round Mailed
                  </button>
                  <button
                    type="button"
                    className="fc-wlp-op-btn-secondary"
                    onClick={() => handleLogResponse(selectedCase.id)}
                  >
                    <FileText size={14} /> Log Bureau Response
                  </button>
                  {(() => {
                    const latest = getLatestCaseRound(selectedCase);
                    const nextRound = suggestNextRound(selectedCase);
                    const canStartNext = !latest || latest.round !== nextRound;
                    if (!canStartNext) return null;
                    return (
                      <button
                        type="button"
                        className="fc-wlp-op-btn-secondary"
                        onClick={() => handleStartNextRound(selectedCase.id)}
                      >
                        <MoveRight size={14} /> Start {nextRound}
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    className="fc-wlp-op-btn-secondary"
                    onClick={() => setShowExhibitDrawer((prev) => !prev)}
                  >
                    <Eye size={14} /> {showExhibitDrawer ? 'Hide Evidence' : 'View Full Evidence Exhibits'}
                  </button>
                  <button
                    type="button"
                    className="fc-wlp-op-btn-secondary"
                    onClick={() => openCaseInspector(selectedCase.id)}
                    title="Opens the enhanced case inspector over the docket. Legacy full-page case detail is not the default."
                  >
                    <FileCheck2 size={14} /> Open enhanced case file
                  </button>
                  <button
                    type="button"
                    className="fc-wlp-op-btn-secondary"
                    onClick={() => navigate(adminWorkspacePath(pathname, 'mail', `?partnerId=${encodeURIComponent(selectedCase.partnerId)}`))}
                  >
                    <Link2 size={14} /> Hand Off to Letters
                  </button>
                </div>

                <div className="fc-wlp-op-inspector-section">
                  <span className="fc-wlp-op-inspector-label">
                    <MessageSquare size={12} className="inline -mt-0.5 mr-1" /> Admin ⇄ Partner Collaboration
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {actions.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">No collaboration notes logged yet.</div>
                    ) : (
                      actions.map((a) => (
                        <div key={a.id} className="text-xs bg-slate-900/70 p-2 rounded border border-slate-800 text-slate-300">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-200">{a.title}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{a.createdBy}</span>
                          </div>
                          {a.body ? <div className="text-[11px] text-slate-400 mt-0.5">{a.body}</div> : null}
                          <div className="text-[10px] text-slate-600 mt-0.5">{new Date(a.createdAt).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="fc-wlp-op-field-row">
                    <textarea
                      aria-label="Admin case note"
                      rows={2}
                      value={adminNoteDraft}
                      onChange={(e) => setAdminNoteDraft(e.target.value)}
                      placeholder="Add an admin note for the partner and team…"
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-100 focus:border-rose-400 focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    className="fc-wlp-op-btn-secondary fc-wlp-op-btn-sm"
                    onClick={() => handleAddAdminNote(selectedCase.id)}
                    disabled={!adminNoteDraft.trim()}
                  >
                    <StickyNote size={13} /> Add Note
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      )}

      {openCaseId ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Case file inspector"
          onClick={closeCaseInspector}
        >
          <div
            className="fc-wlp-local-modal fc-wlp-wide-drawer fc-wlp-case-record-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-rose-300 m-0">Enhanced case inspector</p>
                <h3 className="text-lg font-extrabold text-white m-0 mt-1">
                  {selectedCase?.title ?? 'Case file'}
                </h3>
              </div>
              <button
                type="button"
                className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs"
                onClick={closeCaseInspector}
                aria-label="Close case inspector"
              >
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <AdminCaseDetailPage embedded caseId={openCaseId} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Local Modal for Case Creation */}
      {isCreatingCase ? (
        <div className="fc-wlp-op-modal-overlay" role="dialog" aria-modal="true" aria-label="Open bureau case docket">
          <div className="fc-wlp-op-modal-content">
            <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <Plus size={16} className="text-rose-400" /> Open Bureau Case Docket
              </div>
              <button type="button" onClick={() => setIsCreatingCase(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  aria-label="Case title"
                  placeholder="e.g. Round 1 Initial Challenge — Equifax"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Partner</label>
                {partners.length > 0 ? (
                  <select
                    aria-label="Case partner"
                    required={!isDemo}
                    value={newCasePartnerId}
                    onChange={(e) => setNewCasePartnerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
                  >
                    <option value="">Select a partner…</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.profile?.fullName || p.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    aria-label="Case partner"
                    required={!isDemo}
                    placeholder="e.g. partner_1"
                    value={newCasePartnerId}
                    onChange={(e) => setNewCasePartnerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
                  />
                )}
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Credit Bureau</label>
                <select
                  aria-label="Credit bureau"
                  value={newCaseBureau}
                  onChange={(e) => setNewCaseBureau(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-100 focus:border-rose-400 focus:outline-none"
                >
                  <option value="EQF">Equifax (EQF)</option>
                  <option value="EXP">Experian (EXP)</option>
                  <option value="TUC">TransUnion (TUC)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCase(false)}
                  className="fc-wlp-op-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="fc-wlp-op-btn-primary">
                  Save Case Docket
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <AdminContextCommand
        title="Case Studio Operating Standard"
        description="Cases require factual findings and evidence exhibits. Responses log against 30-day bureau response windows."
        steps={[
          'Verify dispute items against source credit reports.',
          'Attach factual evidence exhibits prior to letter generation.',
          'Track 30-day response deadline after mailing round.',
        ]}
        prompt="Which case on the docket requires evidence review next?"
        contextLabel="Case Studio Workstation"
        onWatch={() => openProductCopilot({ prompt: 'How do I attach evidence to a bureau dispute case?', contextLabel: 'Case Studio' })}
      />
    </AdminStageShell>
  );
}
