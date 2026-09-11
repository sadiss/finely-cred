import React, { Suspense, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  FileSearch,
  FileUp,
  FolderOpen,
  Gavel,
  KeyRound,
  ListChecks,
  PenLine,
  ShieldCheck,
  TrendingUp,
  Vault,
} from 'lucide-react';
import { StaffEntitlementBypass } from '../../../../components/billing/EntitlementGate';
import { PartnerSessionOverrideProvider } from '../../../../auth/PartnerSessionContext';
import type { Partner } from '../../../../domain/partners';
import {
  adminPartnerDeskFromTab,
  defaultTabForAdminDesk,
  resolveAdminPartnerTab,
  type AdminPartnerDesk,
  type AdminPartnerTabKey,
} from '../../../../lib/adminPartnerRoutes';
import { listReportsByPartner } from '../../../../data/reportsRepo';
import { PartnerDashboardProductSurface } from '../../surfaces/PartnerDashboardProductSurface';
import { ProductDashboardSkeleton } from '../components/ProductUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { AdminPartnerCreditWorkSurface } from './AdminPartnerCreditWorkSurface';
import './adminPartnerCreditWorkSurface.css';

const PartnerRestoreProductSurface = React.lazy(() => import('../partner/PartnerRestoreProductSurface'));
const PartnerEvidenceVaultProductSurface = React.lazy(() => import('../partner/PartnerEvidenceVaultProductSurface'));
const PartnerDebtProductSurface = React.lazy(() => import('../partner/PartnerDebtProductSurface'));
const PartnerBuildProductSurface = React.lazy(() => import('../partner/PartnerBuildProductSurface'));
const PartnerBusinessProductSurface = React.lazy(() => import('../partner/PartnerBusinessProductSurface'));
const PartnerBusinessProfileProductSurface = React.lazy(() => import('../partner/PartnerBusinessProfileProductSurface'));
const PartnerBusinessVendorsProductSurface = React.lazy(() => import('../partner/PartnerBusinessVendorsProductSurface'));
const PartnerBusinessBureausProductSurface = React.lazy(() => import('../partner/PartnerBusinessBureausProductSurface'));
const PartnerAccountProductSurface = React.lazy(() => import('../partner/PartnerAccountProductSurface'));
const PartnerWorkProductSurface = React.lazy(() => import('../partner/PartnerWorkProductSurface'));
const PartnerNotesProductSurface = React.lazy(() => import('../partner/PartnerNotesProductSurface'));
const PartnerCalendarProductSurface = React.lazy(() => import('../partner/PartnerCalendarProductSurface'));
const PartnerBillingProductSurface = React.lazy(() => import('../partner/PartnerBillingProductSurface'));

const DESKS: Array<{
  id: AdminPartnerDesk;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: typeof ShieldCheck;
}> = [
  { id: 'restore', label: 'Restore', hint: 'Reports, letters, SOP', accent: 'emerald', icon: ShieldCheck },
  { id: 'debt', label: 'Debt', hint: 'Validation and court', accent: 'rose', icon: Gavel },
  { id: 'build', label: 'Building', hint: 'Tradelines and use', accent: 'violet', icon: TrendingUp },
  { id: 'business', label: 'Business', hint: 'EIN and vendors', accent: 'sky', icon: Building2 },
  { id: 'file', label: 'File', hint: 'Profile, tasks, calendar', accent: 'emerald', icon: FolderOpen },
];

const RESTORE_ROOMS: Array<{
  id: AdminPartnerTabKey;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: typeof FileUp;
}> = [
  { id: 'reports', label: 'Process report', hint: 'Upload and parse', accent: 'emerald', icon: FileUp },
  { id: 'findings', label: 'Findings', hint: 'Accounts and signals', accent: 'sky', icon: FileSearch },
  { id: 'letters', label: 'Letters', hint: 'Write and mail', accent: 'violet', icon: PenLine },
  { id: 'checklist', label: 'Restore SOP', hint: 'Sequence and next step', accent: 'rose', icon: ListChecks },
  { id: 'evidence', label: 'Evidence', hint: 'Screenshots and proof', accent: 'emerald', icon: Vault },
  { id: 'access', label: 'Access', hint: 'Invite and entitlements', accent: 'violet', icon: KeyRound },
];

const BUSINESS_ROOMS: Array<{
  id: AdminPartnerTabKey;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: typeof Building2;
}> = [
  { id: 'business', label: 'Hub', hint: 'Roadmap and score', accent: 'sky', icon: Building2 },
  { id: 'business-profile', label: 'Profile', hint: 'Entity and EIN', accent: 'violet', icon: FolderOpen },
  { id: 'business-vendors', label: 'Vendors', hint: 'Reporting stack', accent: 'rose', icon: TrendingUp },
  { id: 'business-bureaus', label: 'Bureaus', hint: 'Commercial files', accent: 'emerald', icon: ShieldCheck },
];

const FILE_ROOMS: Array<{
  id: AdminPartnerTabKey;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: typeof FolderOpen;
}> = [
  { id: 'overview', label: 'Overview', hint: 'What matters now', accent: 'emerald', icon: FolderOpen },
  { id: 'profile', label: 'Profile', hint: 'Identity on file', accent: 'violet', icon: FolderOpen },
  { id: 'tasks', label: 'Tasks', hint: 'Work and follow-up', accent: 'sky', icon: ListChecks },
  { id: 'notes', label: 'Notes', hint: 'File notes', accent: 'rose', icon: PenLine },
  { id: 'calendar', label: 'Calendar', hint: 'Sessions', accent: 'emerald', icon: Calendar },
  { id: 'billing', label: 'Billing', hint: 'Plan on this file', accent: 'violet', icon: KeyRound },
];

const DESK_COPY: Record<AdminPartnerDesk, { kicker: string; title: string; lede: string }> = {
  restore: {
    kicker: 'Credit restore',
    title: 'Restore this file',
    lede: 'Process the bureau report, name the findings, mail letters, and walk the SOP in order.',
  },
  debt: {
    kicker: 'Debt and legal',
    title: 'Validation and court',
    lede: 'Work collector letters, validation clocks, and court paper from this partner file.',
  },
  build: {
    kicker: 'Credit building',
    title: 'Building plan',
    lede: 'Activate tradeline work and keep utilization honest on this partner file.',
  },
  business: {
    kicker: 'Business credit',
    title: 'Company file',
    lede: 'Entity, EIN, vendors that report, and the company ask — not the owner SSN.',
  },
  file: {
    kicker: 'Partner file',
    title: 'Profile and follow-up',
    lede: 'Identity, tasks, notes, sessions, and billing for this partner.',
  },
};

function FulfillmentBody({
  desk,
  tab,
  partner,
  dataMode,
}: {
  desk: AdminPartnerDesk;
  tab: AdminPartnerTabKey;
  partner: Partner;
  dataMode: WorkspaceProductSurfaceProps['dataMode'];
}) {
  const surfaceProps: WorkspaceProductSurfaceProps = {
    role: 'partner',
    pageId: 'dashboard',
    partnerId: partner.id,
    dataMode,
  };

  if (desk === 'debt') {
    return <PartnerDebtProductSurface {...surfaceProps} pageId="debt" />;
  }
  if (desk === 'build') {
    return <PartnerBuildProductSurface {...surfaceProps} pageId="build" />;
  }
  if (desk === 'business') {
    if (tab === 'business-profile') {
      return <PartnerBusinessProfileProductSurface {...surfaceProps} pageId="business-profile" />;
    }
    if (tab === 'business-vendors') {
      return <PartnerBusinessVendorsProductSurface {...surfaceProps} pageId="business-vendors" />;
    }
    if (tab === 'business-bureaus') {
      return <PartnerBusinessBureausProductSurface {...surfaceProps} pageId="business-bureaus" />;
    }
    return <PartnerBusinessProductSurface {...surfaceProps} pageId="business" />;
  }
  if (desk === 'file') {
    if (tab === 'profile') return <PartnerAccountProductSurface {...surfaceProps} pageId="account" />;
    if (tab === 'tasks') return <PartnerWorkProductSurface {...surfaceProps} pageId="work" />;
    if (tab === 'notes') return <PartnerNotesProductSurface {...surfaceProps} pageId="notes" />;
    if (tab === 'calendar') return <PartnerCalendarProductSurface {...surfaceProps} pageId="calendar" />;
    if (tab === 'billing') return <PartnerBillingProductSurface {...surfaceProps} pageId="billing" />;
    return <PartnerDashboardProductSurface embedded dataMode={dataMode} />;
  }

  if (tab === 'checklist') {
    return <PartnerRestoreProductSurface {...surfaceProps} pageId="checklist" />;
  }
  if (tab === 'evidence') {
    return <PartnerEvidenceVaultProductSurface {...surfaceProps} pageId="evidence" />;
  }
  return (
    <AdminPartnerCreditWorkSurface
      partner={partner}
      dataMode={dataMode}
      hideChrome
      accessFocus={tab === 'grant' ? 'grant' : tab === 'invite' ? 'invite' : undefined}
    />
  );
}

export function AdminPartnerFulfillmentSurface({
  partner,
  dataMode,
  missingReport,
}: {
  partner: Partner;
  dataMode: WorkspaceProductSurfaceProps['dataMode'];
  missingReport?: boolean;
}) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const tab = resolveAdminPartnerTab(searchParams.get('tab'));
  const desk = adminPartnerDeskFromTab(tab);
  const rooms =
    desk === 'restore' ? RESTORE_ROOMS : desk === 'file' ? FILE_ROOMS : desk === 'business' ? BUSINESS_ROOMS : [];
  const copy = DESK_COPY[desk];
  const reports = useMemo(() => listReportsByPartner(partner.id), [partner.id]);
  const noReport = Boolean(missingReport) || reports.length === 0;

  const writeTab = (next: AdminPartnerTabKey) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', 'admin');
    params.set('tab', next);
    navigate(`${pathname}?${params.toString()}`, { replace: true });
  };

  const setDesk = (next: AdminPartnerDesk) => {
    const nextTab = next === 'restore' && noReport ? 'reports' : defaultTabForAdminDesk(next);
    writeTab(nextTab);
  };

  const setTab = (next: AdminPartnerTabKey) => {
    writeTab(next);
  };

  const restoreRoomActive = (roomId: AdminPartnerTabKey) => {
    if (roomId === 'access') return tab === 'access' || tab === 'invite' || tab === 'grant';
    return tab === roomId;
  };

  return (
    <StaffEntitlementBypass>
      <PartnerSessionOverrideProvider partner={partner}>
        <div className="fc-admin-credit-floor" data-desk={desk} data-tab={tab}>
          <p className="fc-admin-credit-floor__kicker">{copy.kicker}</p>
          <h2 className="fc-admin-credit-floor__title">{copy.title}</h2>
          <p className="fc-admin-credit-floor__lede">
            {desk === 'restore' && noReport
              ? 'No bureau report on file yet. Process a report first, then open findings, letters, and the SOP.'
              : copy.lede}
          </p>

          <div className="fc-admin-service-strip" role="tablist" aria-label="Partner services">
            {DESKS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={desk === item.id}
                  className="fc-admin-credit-strip__btn"
                  data-fc-accent={item.accent}
                  data-active={desk === item.id ? 'true' : undefined}
                  onClick={() => setDesk(item.id)}
                >
                  <Icon size={18} aria-hidden />
                  <span>
                    <strong>{item.label}</strong>
                    <em>{item.hint}</em>
                  </span>
                </button>
              );
            })}
          </div>

          {rooms.length ? (
            <div
              className="fc-admin-room-strip"
              data-cols={String(rooms.length)}
              role="tablist"
              aria-label={`${copy.title} rooms`}
            >
              {rooms.map((item) => {
                const Icon = item.icon;
                const active = desk === 'restore' ? restoreRoomActive(item.id) : tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className="fc-admin-credit-strip__btn"
                    data-fc-accent={item.accent}
                    data-active={active ? 'true' : undefined}
                    onClick={() => setTab(item.id)}
                  >
                    <Icon size={16} aria-hidden />
                    <span>
                      <strong>{item.label}</strong>
                      <em>{item.hint}</em>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="fc-admin-credit-room">
            <Suspense fallback={<ProductDashboardSkeleton label="Loading partner work" />}>
              <FulfillmentBody desk={desk} tab={tab} partner={partner} dataMode={dataMode} />
            </Suspense>
          </div>
        </div>
      </PartnerSessionOverrideProvider>
    </StaffEntitlementBypass>
  );
}
