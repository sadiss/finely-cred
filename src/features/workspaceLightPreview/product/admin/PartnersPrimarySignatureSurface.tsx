import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Clock3,
  KeyRound,
  Mail,
  Radar,
  Search,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { adminGetPartner, adminUpsertPartner, fetchAllPartnersAsAdmin, getPartnerSync } from '../../../../data/partnersRepo';
import { listReportsByPartner } from '../../../../data/reportsRepo';
import { listTasks, listTasksByPartner } from '../../../../data/tasksRepo';
import { listAllSlaBreaches } from '../../../work/sla/listSlaBreaches';
import { listLettersByPartner } from '../../../../data/lettersRepo';
import { listDebtByPartner } from '../../../../data/debtRepo';
import { listEvidenceByPartner } from '../../../../data/evidenceRepo';
import { createDisputeCase, listCasesByPartner } from '../../../../data/casesRepo';
import { nowIso } from '../../../../domain/cases';
import { listAuditEventsByPartner } from '../../../../data/auditRepo';
import { listPartnerNotesByPartner, createPartnerNote } from '../../../../data/partnerNotesRepo';
import { listEntitlementsByPartner } from '../../../../data/billingRepo';
import { getStaffRoster, staffPortraitUrl } from '../../../staffCommandCenter/staffRoster';
import { bureauFullName } from '../../../../utils/bureaus';
import { newId } from '../../../../utils/ids';
import { AdminPartnerAccessPanel } from '../../../../components/admin/AdminPartnerAccessPanel';
import { PartnerCreatePanel } from '../../../../components/admin/PartnerCreatePanel';
import { PartnerSpecialistAssignmentPanel } from '../../../../components/admin/PartnerSpecialistAssignmentPanel';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import PartnerRecordInspector from './PartnerRecordInspector';
import type { Partner } from '../../../../domain/partners';
import type { EvidenceItem } from '../../../../domain/evidence';
import type { Bureau, CreditReportRecord } from '../../../../domain/creditReports';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { ProductDashboardSkeleton } from '../components/ProductUi';
import { finelyOsCatalogCard, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_LABEL, FINELY_OS_ENTITY_TITLE } from '../../../os/finelyOsLightUi';
import './adminPrimarySignature.css';
import './adminPartnersProductSurface.css';

function formatShortDate(iso?: string): string {
  if (!iso) return 'Recently';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Recently';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function monthStartMs(): number {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function adminWorkspacePath(pathname: string, pageId: string, suffix = ''): string {
  const item = getWorkspaceProductNavItem('admin', pageId);
  const previewBase = item?.path ?? `/preview/workspace-light/admin/${pageId}`;
  const liveBase = item?.legacyPath ?? `/admin/${pageId === 'dashboard' ? '' : pageId}`;
  const base = pathname.startsWith('/preview/workspace-light')
    ? previewBase
    : liveBase || '/admin';
  return `${base}${suffix}`;
}

function adminPartnersListPath(pathname: string): string {
  return adminWorkspacePath(pathname, 'partners');
}

function adminPartnerRecordPath(pathname: string, partnerId: string): string {
  return adminWorkspacePath(pathname, 'partners', `/${partnerId}`);
}

/** Explicit sample partner collection for demo mode when repository has no partners */
const SAMPLE_DEMO_PARTNERS: Partner[] = [
  {
    id: 'demo_p_marcus_vance',
    tenantId: 'finely_cred',
    status: 'active',
    profile: {
      fullName: 'Marcus Vance (Sample)',
      email: 'marcus.vance.demo@finelycred.com',
      phone: '(555) 234-8901',
    },
    primaryRoute: 'personal_restore',
    lane: 'funding_readiness',
    journeyStage: 'analysis',
    fundingStage: 'ready',
    consents: { eSignConsentAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    routes: {
      personal_restore: {
        goal: 'Delete 4 late payments, 1 collection, reach 720+ FICO for $150k funding window',
        fundingTarget: 150000,
        score: 642,
        personal: {
          address1: '1044 Beacon Street',
          address2: 'Suite 300',
          city: 'Boston',
          state: 'MA',
          postalCode: '02115',
          dob: '1988-04-14',
          ssnLast4: '8842',
        },
      },
    },
    journeySignals: {
      creditMonitoringProvider: 'SmartCredit Direct API',
      creditMonitoringConnected: true,
      vaultToken: 'vault_token_sample_8842_gcm',
    },
  },
  {
    id: 'demo_p_elena_rostova',
    tenantId: 'finely_cred',
    status: 'active',
    profile: {
      fullName: 'Elena Rostova (Sample)',
      email: 'elena.rostova.demo@finelycred.com',
      phone: '(555) 876-5432',
    },
    primaryRoute: 'business_build',
    lane: 'business_credit',
    journeyStage: 'evidence',
    fundingStage: 'in_review',
    consents: { eSignConsentAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    routes: {
      business_build: {
        goal: 'Establish Paydex 80+ and $100k business line of credit',
        fundingTarget: 100000,
        business: {
          businessName: 'Rostova Capital Management LLC',
          entityState: 'DE',
          einLast4: '4410',
          naics: '541611',
        },
      },
    },
    journeySignals: {
      creditMonitoringProvider: 'IdentityIQ Direct',
      creditMonitoringConnected: true,
      vaultToken: 'vault_token_sample_4410_gcm',
    },
  },
  {
    id: 'demo_p_devon_sterling',
    tenantId: 'finely_cred',
    status: 'active',
    profile: {
      fullName: 'Devon Sterling (Sample)',
      email: 'devon.sterling.demo@finelycred.com',
      phone: '(555) 345-6789',
    },
    primaryRoute: 'personal_restore',
    lane: 'funding_readiness',
    journeyStage: 'intake',
    fundingStage: 'not_ready',
    consents: { eSignConsentAt: new Date().toISOString() },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    routes: {
      personal_restore: {
        goal: 'Remove 2 medical collections and inquiry sweep',
        fundingTarget: 75000,
        score: 618,
      },
    },
  },
];

/**
 * Prepares partner object for rendering without inventing fake PII in real mode.
 * In demo mode, provides safe sample fallbacks clearly identified as sample data.
 */
function preparePartnerRecord(partner: Partner, isDemo: boolean): Partner {
  const p = { ...partner };

  if (!p.profile) {
    p.profile = {
      fullName: 'Partner File',
    };
  }

  if (isDemo && !p.profile.fullName.includes('(Sample)')) {
    p.profile = {
      fullName: p.profile.fullName || 'Sample Partner',
      email: p.profile.email || `sample-${p.id.slice(0, 6)}@finelycred.com`,
      phone: p.profile.phone || '(555) 234-8901',
    };
    p.primaryRoute = p.primaryRoute || 'personal_restore';
    p.lane = p.lane || 'funding_readiness';
    p.journeyStage = p.journeyStage || 'analysis';
    p.fundingStage = p.fundingStage || 'ready';
  }

  return p;
}

function getPartnerAddressInfo(partner: Partner, isDemo: boolean) {
  const routeKey = partner.primaryRoute || 'personal_restore';
  const personal =
    partner.routes?.[routeKey]?.personal ||
    partner.routes?.personal_restore?.personal ||
    partner.routes?.personal_build?.personal;

  if (personal && (personal.address1 || personal.city || personal.state || personal.postalCode)) {
    const cityStateZip = [
      personal.city,
      personal.state,
      personal.postalCode,
    ]
      .filter(Boolean)
      .join(' ');
    return {
      address1: personal.address1 || 'Not provided',
      address2: personal.address2 || '—',
      cityStateZip: cityStateZip || 'Not provided',
      dob: personal.dob || 'Not provided',
      ssnLast4: personal.ssnLast4 ? `***-**-${personal.ssnLast4}` : 'Not provided',
      isSample: false,
    };
  }

  if (isDemo) {
    return {
      address1: '1044 Beacon Street (Sample)',
      address2: 'Suite 300',
      cityStateZip: 'Boston, MA 02115',
      dob: '1988-04-14',
      ssnLast4: '***-**-8842',
      isSample: true,
    };
  }

  return {
    address1: 'Not provided',
    address2: '—',
    cityStateZip: 'Not provided',
    dob: 'Not provided',
    ssnLast4: 'Not provided',
    isSample: false,
  };
}

function getPartnerGoalInfo(partner: Partner, isDemo: boolean) {
  const routeKey = partner.primaryRoute || 'personal_restore';
  const goal =
    partner.routes?.[routeKey]?.goal ||
    partner.routes?.personal_restore?.goal ||
    partner.routes?.personal_build?.goal ||
    partner.routes?.business_build?.goal;
  const target =
    partner.routes?.[routeKey]?.fundingTarget ||
    partner.routes?.personal_restore?.fundingTarget;

  if (goal || target) {
    return {
      goal: goal || 'Not specified',
      fundingTarget: target ? `$${target.toLocaleString()}` : 'Not specified',
      isSample: false,
    };
  }

  if (isDemo) {
    return {
      goal: 'Delete 4 late payments, 1 collection, reach 720+ FICO for $150k funding window (Sample)',
      fundingTarget: '$150,000',
      isSample: true,
    };
  }

  return {
    goal: 'Not specified',
    fundingTarget: 'Not specified',
    isSample: false,
  };
}

function getPartnerCreditMonitoringStatus(partner: Partner, isDemo: boolean) {
  const provider = partner.journeySignals?.creditMonitoringProvider;
  const isConnected = !!partner.journeySignals?.creditMonitoringConnected;
  const vaultToken = partner.journeySignals?.vaultToken;

  if (provider || isConnected || vaultToken) {
    return {
      provider: provider || 'Connected Provider',
      status: isConnected ? 'Active (Connected)' : 'Disconnected',
      vaultTokenStatus: vaultToken ? 'Encrypted Vault Token Active' : 'No token linked',
      isSample: false,
    };
  }

  if (isDemo) {
    return {
      provider: 'SmartCredit Direct API (Sample)',
      status: 'Active (Connected)',
      vaultTokenStatus: 'Encrypted Vault Token Active (Sample)',
      isSample: true,
    };
  }

  return {
    provider: 'Not connected',
    status: 'No active monitoring linked',
    vaultTokenStatus: 'No vault token on file',
    isSample: false,
  };
}

function getPartnerCareTeamOwnership(partner: Partner, isDemo: boolean) {
  const staff = getStaffRoster();
  const adminOwner = partner.assignedAdminId ? staff.find((s) => s.id === partner.assignedAdminId) : null;
  const agentOwner = partner.assignedAgentId ? staff.find((s) => s.id === partner.assignedAgentId) : null;

  const defaultEzra = staff.find((s) => s.firstName === 'Ezra') || staff[0];
  const defaultCaleb = staff.find((s) => s.firstName === 'Caleb') || staff[1] || staff[0];

  const adminMember = adminOwner || (isDemo ? defaultEzra : null);
  const agentMember = agentOwner || (isDemo ? defaultCaleb : null);

  return {
    adminOwnerName: adminMember ? `${adminMember.firstName} ${adminMember.lastName}`.trim() : 'Unassigned',
    adminOwnerTitle: adminMember ? adminMember.title : 'Team Coordinator',
    adminOwnerPortraitUrl: adminMember ? staffPortraitUrl(adminMember) : null,
    agentOwnerName: agentMember ? `${agentMember.firstName} ${agentMember.lastName}`.trim() : 'Unassigned',
    agentOwnerTitle: agentMember ? agentMember.title : 'Lead Discovery',
    agentOwnerPortraitUrl: agentMember ? staffPortraitUrl(agentMember) : null,
    isSample: !adminOwner && !agentOwner && isDemo,
  };
}

type PortfolioRoom = 'portfolio' | 'needs_attention' | 'directory';
type AccessFocus = 'invite' | 'grant';

type PortfolioLens = {
  id: PortfolioRoom;
  label: string;
  description: string;
  icon: typeof Radar;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  badge?: number;
};

function PartnersPrimarySignatureSurface({ role, pageId, dataMode, entityId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const [searchParams] = useSearchParams();
  const { id: paramPartnerId } = useParams<{ id?: string }>();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
  const PageIcon = navItem?.icon ?? Users;
  /** Prefer ProductRoutedPage entityId plumbing; fall back to route params. */
  const routePartnerId = entityId || paramPartnerId;
  const isDemo = dataMode === 'demo';
  const [rawPartners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(() => routePartnerId ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'action' | 'active'>('all');
  const [room, setRoom] = useState<PortfolioRoom>('portfolio');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [accessPartnerId, setAccessPartnerId] = useState<string | null>(null);
  const [accessFocus, setAccessFocus] = useState<AccessFocus>('grant');

  const [newNoteText, setNewNoteText] = useState('');
  const [noteVersion, setNoteVersion] = useState(0);
  const [casesVersion, setCasesVersion] = useState(0);

  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [parseTargetReportId, setParseTargetReportId] = useState<string | null>(null);

  const [newCaseBureau, setNewCaseBureau] = useState<Bureau>('TUC');
  const [newCaseAccount, setNewCaseAccount] = useState('');
  const [newCaseIssueType, setNewCaseIssueType] = useState('');
  const [newCaseSaving, setNewCaseSaving] = useState(false);
  const [newCaseError, setNewCaseError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!routePartnerId) setLoading(true);
    fetchAllPartnersAsAdmin()
      .then(async (data) => {
        if (cancelled) return;
        let next = data;
        if (routePartnerId && !data.some((partner) => partner.id === routePartnerId)) {
          const missing = (await adminGetPartner(routePartnerId)) ?? getPartnerSync(routePartnerId);
          if (missing) next = [missing, ...data];
        }
        setPartners(next);
        setSelectedPartnerId((prev) => {
          if (routePartnerId) return routePartnerId;
          if (prev && next.some((partner) => partner.id === prev)) return prev;
          return null;
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dataMode, refreshKey, routePartnerId]);

  const partners = useMemo(() => {
    if (isDemo && rawPartners.length === 0) {
      return SAMPLE_DEMO_PARTNERS.map((p) => preparePartnerRecord(p, true));
    }
    return rawPartners.map((p) => preparePartnerRecord(p, isDemo));
  }, [rawPartners, isDemo]);

  useEffect(() => {
    if (routePartnerId) {
      setSelectedPartnerId(routePartnerId);
      return;
    }
    setSelectedPartnerId(null);
  }, [routePartnerId]);

  const openPartnerRecord = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    const nextPath = `${adminPartnerRecordPath(pathname, partnerId)}?tab=overview`;
    navigate(nextPath, { replace: false });
  };

  const openPartnerAccess = (partnerId: string, focus: AccessFocus) => {
    setAccessPartnerId(partnerId);
    setAccessFocus(focus);
    setActiveModal('portal_access');
  };

  const closePartnerRecord = () => {
    setSelectedPartnerId(null);
    if (routePartnerId) {
      navigate(adminPartnersListPath(pathname), { replace: false });
    }
  };

  useEffect(() => {
    if (searchParams.get('create') === '1' || hash === '#create-partner') {
      setActiveModal('add_partner');
    }
  }, [searchParams, hash]);

  useEffect(() => {
    const access = searchParams.get('access');
    if (!routePartnerId) return;
    if (hash === '#admin-partner-access-panel' || access === 'invite' || access === 'grant') {
      setAccessPartnerId(routePartnerId);
      setAccessFocus(access === 'invite' ? 'invite' : 'grant');
      setActiveModal('portal_access');
    }
  }, [routePartnerId, hash, searchParams]);

  const partnerIdSet = useMemo(() => new Set(partners.map((p) => p.id)), [partners]);
  const slaBreaches = useMemo(() => listAllSlaBreaches(partnerIdSet), [partnerIdSet]);
  const breachPartnerIds = useMemo(() => new Set(slaBreaches.map((b) => b.partnerId)), [slaBreaches]);
  const openTasks = useMemo(
    () => listTasks().filter((t) => t.partnerId && partnerIdSet.has(t.partnerId) && t.status !== 'completed'),
    [partnerIdSet],
  );
  const missingReportIds = useMemo(
    () => new Set(partners.filter((p) => listReportsByPartner(p.id).length === 0).map((p) => p.id)),
    [partners],
  );

  const activePartners = partners.filter((p) => p.status === 'active');
  const needingAction = partners.filter(
    (p) => breachPartnerIds.has(p.id) || missingReportIds.has(p.id) || openTasks.some((t) => t.partnerId === p.id),
  );
  const newThisMonth = partners.filter((p) => Date.parse(p.createdAt) >= monthStartMs());

  const filteredPartners = partners.filter((p) => {
    const name = p.profile?.fullName ?? 'Partner';
    const email = p.profile?.email ?? '';
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) || email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === 'action') {
      return breachPartnerIds.has(p.id) || missingReportIds.has(p.id);
    }
    if (filterMode === 'active') {
      return p.status === 'active';
    }
    return true;
  });

  const selectedPartner = selectedPartnerId
    ? partners.find((p) => p.id === selectedPartnerId)
      ?? (() => {
        const seeded = getPartnerSync(selectedPartnerId);
        return seeded ? preparePartnerRecord(seeded, isDemo) : null;
      })()
    : null;

  const accessPartner = accessPartnerId
    ? partners.find((p) => p.id === accessPartnerId)
      ?? selectedPartner
      ?? (() => {
        const seeded = getPartnerSync(accessPartnerId);
        return seeded ? preparePartnerRecord(seeded, isDemo) : null;
      })()
    : selectedPartner;

  // Live Partner Sub-Repositories with Demo Fallbacks
  const selectedReports = useMemo(() => {
    if (!selectedPartner) return [];
    const real = listReportsByPartner(selectedPartner.id);
    if (real.length > 0) return real;
    if (isDemo) {
      return [
        {
          id: `rpt_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          provider: 'identityiq',
          fileType: 'pdf',
          uploadedBy: 'admin',
          receivedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          filename: '3-Bureau-Credit-Report-Sample.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1048576,
          rawBlobRef: 'demo_blob_123',
          parsed: {
            provider: 'identityiq',
            tradelines: [],
            scores: [
              { model: 'VantageScore 3.0', bureau: 'TUC', value: 682 },
              { model: 'VantageScore 3.0', bureau: 'EQF', value: 694 },
              { model: 'VantageScore 3.0', bureau: 'EXP', value: 678 },
            ],
          },
        } as CreditReportRecord,
      ];
    }
    return [];
  }, [selectedPartner, isDemo]);

  const selectedCases = useMemo(() => {
    if (!selectedPartner) return [];
    const real = listCasesByPartner(selectedPartner.id);
    if (real.length > 0) return real;
    if (isDemo) {
      return [
        {
          id: `case_tu_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          bureau: 'TUC',
          status: 'open',
          items: [{ id: '1', account: 'Chase Bank', code: 'late_payment' }],
          rounds: [{ round: 'Round 1', status: 'sent', sentAt: new Date(Date.now() - 10 * 86400000).toISOString() }],
          createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `case_eq_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          bureau: 'EQF',
          status: 'open',
          items: [{ id: '2', account: 'Midland Credit', code: 'collection' }],
          rounds: [{ round: 'Round 1', status: 'draft', sentAt: undefined }],
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
    return [];
  }, [selectedPartner, isDemo, casesVersion]);

  const selectedLetters = useMemo(() => {
    if (!selectedPartner) return [];
    return listLettersByPartner(selectedPartner.id);
  }, [selectedPartner]);

  const selectedDebtCases = useMemo(() => {
    if (!selectedPartner) return [];
    return listDebtByPartner(selectedPartner.id);
  }, [selectedPartner]);

  const selectedTasks = useMemo(() => {
    if (!selectedPartner) return [];
    const real = listTasksByPartner(selectedPartner.id);
    if (real.length > 0) return real;
    if (isDemo) {
      return [
        {
          id: `task_1_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          title: 'Audit TransUnion Factual Dispute Items',
          stage: 'investigation',
          status: 'in_progress',
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: `task_2_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          title: 'Verify Driver License & Proof of Address Exhibits',
          stage: 'evidence',
          status: 'completed',
          dueAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
      ];
    }
    return [];
  }, [selectedPartner, isDemo]);

  const selectedEvidence = useMemo(() => {
    if (!selectedPartner) return [];
    const real = listEvidenceByPartner(selectedPartner.id);
    if (real.length > 0) return real;
    if (isDemo) {
      return [
        {
          id: `ev_1_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          type: 'upload',
          caption: 'Government Issued Photo ID (Driver License)',
          filename: 'driver_license_redacted.png',
          mimeType: 'image/png',
          sizeBytes: 245000,
          blobRef: 'blob_dl_sample',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        } as EvidenceItem,
        {
          id: `ev_2_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          type: 'upload',
          caption: 'Utility Bill Proof of Address (Beacon St)',
          filename: 'utility_bill_boston.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 512000,
          blobRef: 'blob_ub_sample',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        } as EvidenceItem,
      ];
    }
    return [];
  }, [selectedPartner, isDemo]);

  const selectedAuditEvents = useMemo(() => {
    if (!selectedPartner) return [];
    const real = listAuditEventsByPartner(selectedPartner.id);
    if (real.length > 0) return real;
    if (isDemo) {
      return [
        {
          id: `audit_1_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          action: 'Credit report uploaded & parsed',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        },
        {
          id: `audit_2_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          action: 'Driver License evidence exhibit verified',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        },
      ];
    }
    return [];
  }, [selectedPartner, isDemo]);

  const selectedNotes = useMemo(() => {
    if (!selectedPartner) return [];
    const real = listPartnerNotesByPartner(selectedPartner.id);
    if (real.length > 0) return real;
    if (isDemo) {
      return [
        {
          id: `note_1_${selectedPartner.id}`,
          partnerId: selectedPartner.id,
          kind: 'manual',
          authorType: 'admin',
          visibility: 'internal',
          title: 'Intake Strategy Brief',
          body: 'Partner requested priority sweep on TransUnion late payments ahead of Q4 funding application.',
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
      ];
    }
    return [];
  }, [selectedPartner, isDemo, noteVersion]);

  const selectedEntitlements = useMemo(() => (selectedPartner ? listEntitlementsByPartner(selectedPartner.id) : []), [selectedPartner]);

  // Derived Info (Real vs Demo safe)
  const selectedAddress = useMemo(() => (selectedPartner ? getPartnerAddressInfo(selectedPartner, isDemo) : null), [selectedPartner, isDemo]);
  const selectedGoal = useMemo(() => (selectedPartner ? getPartnerGoalInfo(selectedPartner, isDemo) : null), [selectedPartner, isDemo]);
  const selectedCreditMonitoring = useMemo(() => (selectedPartner ? getPartnerCreditMonitoringStatus(selectedPartner, isDemo) : null), [selectedPartner, isDemo]);
  const selectedCareTeam = useMemo(() => (selectedPartner ? getPartnerCareTeamOwnership(selectedPartner, isDemo) : null), [selectedPartner, isDemo]);

  const bureauScores = useMemo(() => {
    if (!selectedPartner) return { tu: null, eq: null, ex: null, isSample: false };
    if (selectedReports.length > 0) {
      const latest = selectedReports[0];
      const scores = latest.parsed?.scores ?? [];
      const tu = scores.find((s) => s.bureau === 'TUC')?.value ?? null;
      const eq = scores.find((s) => s.bureau === 'EQF')?.value ?? null;
      const ex = scores.find((s) => s.bureau === 'EXP')?.value ?? null;
      if (tu !== null || eq !== null || ex !== null) {
        return { tu, eq, ex, isSample: false };
      }
    }
    const intakeScore = selectedPartner.routes?.personal_restore?.score || selectedPartner.routes?.personal_build?.score;
    if (intakeScore) {
      return { tu: intakeScore, eq: null, ex: null, isSample: false };
    }
    if (isDemo) {
      return { tu: 682, eq: 694, ex: 678, isSample: true };
    }
    return { tu: null, eq: null, ex: null, isSample: false };
  }, [selectedPartner, selectedReports, isDemo]);

  const handleSaveNote = () => {
    if (!newNoteText.trim() || !selectedPartner) return;
    createPartnerNote({
      partnerId: selectedPartner.id,
      kind: 'manual',
      authorType: 'admin',
      visibility: 'internal',
      title: 'Staff Note',
      body: newNoteText.trim(),
    });
    setNewNoteText('');
    setNoteVersion((v) => v + 1);
  };

  const handleStatusChange = async (nextStatus: Partner['status']) => {
    if (!selectedPartner || selectedPartner.status === nextStatus) return;
    setStatusSaving(true);
    setStatusError(null);
    try {
      const updated = await adminUpsertPartner({ ...selectedPartner, status: nextStatus });
      setPartners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch (e: unknown) {
      setStatusError((e as Error)?.message || 'Could not update partner status.');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleCreateCase = () => {
    if (!selectedPartner) return;
    if (!newCaseAccount.trim()) {
      setNewCaseError('Enter the creditor or account name.');
      return;
    }
    setNewCaseSaving(true);
    setNewCaseError(null);
    try {
      createDisputeCase({
        partnerId: selectedPartner.id,
        bureau: newCaseBureau,
        title: `${bureauFullName(newCaseBureau)} dispute — ${newCaseAccount.trim()}`,
        items: [
          {
            id: newId('case_item'),
            bureau: newCaseBureau,
            account: newCaseAccount.trim(),
            type: newCaseIssueType.trim() || 'Inaccurate reporting',
            status: 'Requesting deletion',
            code: 'factual_dispute',
            reasons: [],
          },
        ],
        initialRound: { round: 'Round 1', tone: 'formal', createdAt: nowIso() },
      });
      setNewCaseAccount('');
      setNewCaseIssueType('');
      setCasesVersion((v) => v + 1);
      navigate(
        `${adminPartnerRecordPath(pathname, selectedPartner.id)}?tab=letters`,
        { replace: true },
      );
      setActiveModal(null);
    } catch (e: unknown) {
      setNewCaseError((e as Error)?.message || 'Could not create the dispute case.');
    } finally {
      setNewCaseSaving(false);
    }
  };

  const PARTNER_ROOMS: PortfolioLens[] = [
    {
      id: 'portfolio',
      label: 'Partner portfolio',
      description: 'Overview of partner accounts, risk signals, and service priority.',
      icon: Radar,
      accent: 'emerald',
      badge: partners.length,
    },
    {
      id: 'needs_attention',
      label: 'Needs attention',
      description: 'Partners grouped by SLA posture, missing proof, and work status.',
      icon: AlertTriangle,
      accent: 'rose',
      badge: needingAction.length || undefined,
    },
    {
      id: 'directory',
      label: 'Partner directory',
      description: 'Searchable roster with direct partner file access.',
      icon: Users,
      accent: 'sky',
    },
  ];

  const portfolioMetrics = [
    {
      label: 'Active partners',
      value: activePartners.length,
      hint: `${partners.length} total on file`,
      icon: Users,
      accent: 'emerald' as const,
      onClick: () => {
        setFilterMode('active');
        setRoom('portfolio');
      },
    },
    {
      label: 'Needing action',
      value: needingAction.length,
      hint: needingAction.length ? 'Missing report or SLA risk' : 'Portfolio current',
      icon: AlertTriangle,
      accent: 'rose' as const,
      onClick: () => {
        setFilterMode('action');
        setRoom('needs_attention');
      },
    },
    {
      label: 'New this month',
      value: newThisMonth.length,
      hint: 'Joined since the 1st',
      icon: UserCheck,
      accent: 'violet' as const,
      onClick: () => {
        setFilterMode('all');
        setRoom('directory');
      },
    },
    {
      label: 'Past SLA target',
      value: slaBreaches.length,
      hint: 'Requires immediate review',
      icon: Clock3,
      accent: 'sky' as const,
      onClick: () => {
        setFilterMode('action');
        setRoom('needs_attention');
      },
    },
  ];

  if (loading) {
    return <ProductDashboardSkeleton label="Loading partner portfolio" />;
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Partner operations"
      title="Partner portfolio"
      description="Create a partner, send their invite, or grant portal access from this roster — then open a card to work the file."
      status={
        needingAction.length
          ? `${needingAction.length} partner file${needingAction.length === 1 ? '' : 's'} need action`
          : 'Portfolio current'
      }
      freshness="just now"
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={PageIcon}
      metricsVariant="grid"
      metrics={portfolioMetrics}
      metricTitle="Portfolio signals"
      metricDescription="Tap a signal to filter the mosaic."
      primaryAction={
        <ProductPagePrimaryAction label="Add partner" onClick={() => setActiveModal('add_partner')} />
      }
      secondaryAction={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="fc-wlp-btn-secondary"
            onClick={() => navigate(adminWorkspacePath(pathname, 'partners-import'))}
          >
            <Upload size={15} /> Import partners
          </button>
          <button
            type="button"
            className="fc-wlp-btn-secondary"
            onClick={() => navigate(adminWorkspacePath(pathname, 'mail'))}
          >
            <Mail size={15} /> Mail letters
          </button>
        </div>
      }
    >
      <div
        className="fc-partners-portfolio-workbench"
        data-page-signature="partner-portfolio"
        data-inspector={selectedPartner ? 'open' : 'closed'}
      >
        <nav className="fc-partners-portfolio-lenses" aria-label="Portfolio perspectives">
          {PARTNER_ROOMS.map((lens) => {
            const LensIcon = lens.icon;
            return (
              <button
                key={lens.id}
                type="button"
                className="fc-partners-portfolio-lens"
                data-accent={lens.accent}
                data-active={room === lens.id ? 'true' : undefined}
                onClick={() => setRoom(lens.id)}
              >
                <span className="fc-partners-portfolio-lens-icon">
                  <LensIcon size={18} strokeWidth={2.2} />
                </span>
                <span className="fc-partners-portfolio-lens-copy">
                  <strong>{lens.label}</strong>
                  <em>{lens.description}</em>
                </span>
                {lens.badge ? (
                  <span className="fc-partners-portfolio-lens-badge">{lens.badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <section className={`${finelyOsCatalogCard('violet')} fc-partners-portfolio-mosaic p-6 lg:p-8`} data-fc-accent="violet" data-bed="dark">
          <div className="fc-partners-portfolio-mosaic-head">
            <div>
              <p className={`${FINELY_OS_ENTITY_LABEL} m-0`}>Portfolio mosaic</p>
              <h2 className={`${FINELY_OS_ENTITY_TITLE} m-0 mt-1`}>
                {selectedPartner?.profile?.fullName ?? 'Select a partner'}
              </h2>
              <p className={`${FINELY_OS_ENTITY_BODY} m-0 mt-2 max-w-3xl`}>
                {selectedPartner
                  ? 'File open. Send invite and Grant access stay on this roster and on the file.'
                  : 'Send invite or Grant access from any card — or open the file to work reports, letters, and debt.'}
              </p>
            </div>
          </div>

          <div
            className="fc-wlp-atlas-grid fc-admin-workspace"
            data-inspector={selectedPartner ? 'open' : 'closed'}
          >
            <div className="fc-wlp-atlas-canvas">
              <div className="fc-wlp-atlas-toolbar">
                <div className="fc-wlp-atlas-search">
                  <Search size={16} />
                  <input
                    type="text"
                    aria-label="Search partners"
                    placeholder="Search partner name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="fc-wlp-atlas-filters">
                  <button
                    type="button"
                    className="fc-wlp-atlas-filter-btn"
                    data-active={filterMode === 'all' ? 'true' : undefined}
                    onClick={() => setFilterMode('all')}
                  >
                    All ({partners.length})
                  </button>
                  <button
                    type="button"
                    className="fc-wlp-atlas-filter-btn"
                    data-active={filterMode === 'action' ? 'true' : undefined}
                    onClick={() => setFilterMode('action')}
                  >
                    Needs action ({needingAction.length})
                  </button>
                  <button
                    type="button"
                    className="fc-wlp-atlas-filter-btn"
                    data-active={filterMode === 'active' ? 'true' : undefined}
                    onClick={() => setFilterMode('active')}
                  >
                    Active ({activePartners.length})
                  </button>
                </div>
              </div>

              <FinelyOsPaginatedStack
                items={filteredPartners}
                pageSize={12}
                itemSpacingClassName="fc-wlp-atlas-nodes"
                emptyMessage="No partners match your search."
                renderItem={(partner) => {
                  const name = partner.profile?.fullName ?? 'Partner';
                  const isSelected = selectedPartnerId === partner.id;
                  const hasBreach = breachPartnerIds.has(partner.id);
                  const hasNoReport = missingReportIds.has(partner.id);
                  const riskState = hasBreach ? 'high' : hasNoReport ? 'attention' : 'normal';
                  const initials = name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <article
                      key={partner.id}
                      className="fc-wlp-atlas-node-card"
                      data-selected={isSelected ? 'true' : undefined}
                      data-risk={riskState}
                    >
                      <button
                        type="button"
                        className="fc-wlp-atlas-node-open"
                        onClick={() => openPartnerRecord(partner.id)}
                      >
                        <div className="fc-wlp-atlas-node-header">
                          <div className="fc-wlp-atlas-node-avatar">{initials}</div>
                          <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--emerald">{partner.status}</span>
                        </div>
                        <strong className="fc-wlp-atlas-node-name">{name}</strong>
                        <div className="fc-wlp-atlas-node-signals">
                          {hasBreach ? <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--rose">SLA breach</span> : null}
                          {hasNoReport ? <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--violet">No report</span> : null}
                          {!hasBreach && !hasNoReport ? (
                            <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--sky">Current</span>
                          ) : null}
                        </div>
                      </button>
                      <div className="fc-wlp-atlas-node-ops">
                        <button
                          type="button"
                          className="fc-wlp-atlas-node-op accent-emerald"
                          onClick={() => openPartnerAccess(partner.id, 'invite')}
                        >
                          <UserPlus size={13} /> Send invite
                        </button>
                        <button
                          type="button"
                          className="fc-wlp-atlas-node-op accent-violet"
                          onClick={() => openPartnerAccess(partner.id, 'grant')}
                        >
                          <KeyRound size={13} /> Grant access
                        </button>
                      </div>
                    </article>
                  );
                }}
              />
            </div>

            {selectedPartner ? (
              <PartnerRecordInspector
                key={selectedPartner.id}
                partner={selectedPartner}
                dataMode={dataMode}
                onClose={closePartnerRecord}
                onStatusChange={handleStatusChange}
                statusSaving={statusSaving}
                onOpenCareTeam={() => setActiveModal('care_team')}
                onOpenSendInvite={() => openPartnerAccess(selectedPartner.id, 'invite')}
                onOpenGrantAccess={() => openPartnerAccess(selectedPartner.id, 'grant')}
                breach={breachPartnerIds.has(selectedPartner.id)}
                missingReport={missingReportIds.has(selectedPartner.id)}
                careOwnerName={selectedCareTeam?.adminOwnerName ?? null}
              />
            ) : null}
          </div>
        </section>
      </div>

      {/* Local Modals & Drawers */}
      {activeModal ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Partner record action"
          onClick={() => setActiveModal(null)}
        >
          <div
            className={`fc-wlp-local-modal ${activeModal === 'portal_access' ? 'fc-wlp-wide-drawer' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-2xl font-extrabold text-white">
                {activeModal === 'add_partner' && 'Add New Partner File'}
                {activeModal === 'new_case' && `New Dispute Case: ${selectedPartner?.profile?.fullName || 'Partner'}`}
                {activeModal === 'parse_overview' && `Parse Overview: ${selectedPartner?.profile?.fullName || 'Partner'}`}
                {activeModal === 'care_team' && `Care Team Assignment: ${selectedPartner?.profile?.fullName || 'Partner'}`}
                {activeModal === 'portal_access' &&
                  `${accessFocus === 'invite' ? 'Send invite' : 'Grant access'}: ${accessPartner?.profile?.fullName || 'Partner'}`}
              </h3>
              <button type="button" aria-label="Close partner record action" className="text-white/80 hover:text-white font-bold" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            {activeModal === 'add_partner' ? (
              <div className="text-base font-semibold text-white">
                <PartnerCreatePanel
                  canCreate
                  onCreated={() => {
                    setActiveModal(null);
                    setRefreshKey((v) => v + 1);
                  }}
                />
              </div>
            ) : activeModal === 'care_team' && selectedPartner ? (
              <div className="text-base font-semibold text-white">
                <PartnerSpecialistAssignmentPanel
                  partner={selectedPartner}
                  onUpdated={() => setRefreshKey((v) => v + 1)}
                />
              </div>
            ) : activeModal === 'portal_access' && accessPartner ? (
              <div className="max-h-[72vh] overflow-y-auto pr-1 text-base font-semibold text-white">
                <AdminPartnerAccessPanel
                  partner={accessPartner}
                  userRole="admin"
                  focusSection={accessFocus}
                  onUpdated={() => setRefreshKey((v) => v + 1)}
                />
              </div>
            ) : activeModal === 'new_case' && selectedPartner ? (
              <div className="text-base font-semibold text-white/90 space-y-3">
                <label className="block space-y-1">
                  <span className="text-white/80 font-bold">Bureau</span>
                  <select
                    aria-label="Case bureau"
                    value={newCaseBureau}
                    onChange={(e) => setNewCaseBureau(e.target.value as Bureau)}
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
                  >
                    <option value="TUC">TransUnion</option>
                    <option value="EQF">Equifax</option>
                    <option value="EXP">Experian</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-white/80 font-bold">Creditor / account name</span>
                  <input
                    type="text"
                    aria-label="Creditor or account name"
                    value={newCaseAccount}
                    onChange={(e) => setNewCaseAccount(e.target.value)}
                    placeholder="e.g. Midland Credit Management"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-white/80 font-bold">Issue type</span>
                  <input
                    type="text"
                    aria-label="Case issue type"
                    value={newCaseIssueType}
                    onChange={(e) => setNewCaseIssueType(e.target.value)}
                    placeholder="e.g. Late payment, collection, not mine"
                    className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white"
                  />
                </label>
                {newCaseError ? <p className="text-rose-300">{newCaseError}</p> : null}
                <button
                  type="button"
                  disabled={newCaseSaving}
                  onClick={handleCreateCase}
                  className="fc-wlp-btn-primary !w-full !py-3 text-base font-extrabold disabled:opacity-60"
                >
                  {newCaseSaving ? 'Creating…' : 'Create dispute case'}
                </button>
              </div>
            ) : activeModal === 'parse_overview' && selectedPartner ? (
              (() => {
                const report = selectedReports.find((r) => r.id === parseTargetReportId) ?? selectedReports[0];
                const scores = report?.parsed?.scores ?? [];
                const tradelineCount = report?.parsed?.tradelines?.length ?? 0;
                return (
                  <div className="text-base font-semibold text-white/90 space-y-3">
                    {report ? (
                      <>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                          <strong className="text-white block">{report.provider} ({report.fileType})</strong>
                          <span className="text-white/75">Received {formatShortDate(report.receivedAt)}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                          <span className="fc-wlp-inspector-section-label">Parsed scores</span>
                          {scores.length ? (
                            <ul className="list-none m-0 p-0 space-y-1">
                              {scores.map((s, i) => (
                                <li key={i} className="flex items-center justify-between">
                                  <span>{s.model} · {s.bureau ? bureauFullName(s.bureau) : 'All bureaus'}</span>
                                  <strong className="text-emerald-300">{s.value}</strong>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-white/75">No scores parsed from this report.</span>
                          )}
                        </div>
                        <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                          <span className="fc-wlp-inspector-section-label">Tradelines parsed</span>
                          <p className="m-0 text-white text-sm font-semibold">{tradelineCount}</p>
                        </div>
                        <button
                          type="button"
                          className="fc-wlp-btn-secondary !w-full !py-3 text-base font-extrabold"
                          onClick={() => setActiveModal(null)}
                        >
                          Return to partner inspector
                        </button>
                      </>
                    ) : (
                      <p>No report selected.</p>
                    )}
                  </div>
                );
              })()
            ) : (
            <div className="text-base font-semibold text-white/90 space-y-3">
              <div className="p-3 bg-black/40 rounded border border-white/10 font-mono text-[11px] text-emerald-300">
                {isDemo ? 'Demo preview mode active — sample fixtures rendered.' : 'Live operating mode active — repository values rendered.'}
              </div>
            </div>
            )}

            <button
              type="button"
              className="fc-wlp-btn-primary !w-full !py-3 text-base font-extrabold"
              onClick={() => setActiveModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}

export default PartnersPrimarySignatureSurface;
