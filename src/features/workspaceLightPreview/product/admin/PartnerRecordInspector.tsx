/**
 * Enhanced partner record inspector — GLOBAL template instance #1.
 *
 * Card click → this popup over the portfolio. Body is the NEW partner product UI
 * for the clicked partner (not PartnerDetailPage). Theme follows the site Light/Dark toggle.
 * No classic PartnerDetailPage embed.
 */
import React, { Suspense, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ExternalLink,
  LayoutDashboard,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import type { Partner } from '../../../../domain/partners';
import { PartnerSessionOverrideProvider } from '../../../../auth/PartnerSessionContext';
import { openPortalAsPartner } from '../../../../lib/adminPartnerViewAs';
import { openCommunicationHub } from '../../../../components/chat/communicationHubModel';
import { AdminPartnerViewAsButton } from '../../../../components/admin/AdminPartnerViewAsButton';
import { PartnerDashboardProductSurface } from '../../surfaces/PartnerDashboardProductSurface';
import { ProductDashboardSkeleton } from '../components/ProductUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { AdminPartnerFulfillmentSurface } from './AdminPartnerFulfillmentSurface';

const PartnerAccountProductSurface = React.lazy(() => import('../partner/PartnerAccountProductSurface'));
const PartnerReportsProductSurface = React.lazy(() => import('../partner/PartnerReportsProductSurface'));
const PartnerAnalysisProductSurface = React.lazy(() => import('../partner/PartnerAnalysisProductSurface'));
const PartnerEvidenceVaultProductSurface = React.lazy(() => import('../partner/PartnerEvidenceVaultProductSurface'));
const PartnerLettersProductSurface = React.lazy(() => import('../partner/PartnerLettersProductSurface'));
const PartnerWorkProductSurface = React.lazy(() => import('../partner/PartnerWorkProductSurface'));
const PartnerNotesProductSurface = React.lazy(() => import('../partner/PartnerNotesProductSurface'));
const PartnerDebtProductSurface = React.lazy(() => import('../partner/PartnerDebtProductSurface'));

export type PartnerInspectorLens = 'admin-file' | 'partner-view';

export const PARTNER_INSPECTOR_TAB_IDS = [
  'overview',
  'profile',
  'reports',
  'analysis',
  'evidence',
  'letters',
  'tasks',
  'notes',
  'debt',
] as const;

export type PartnerInspectorTabId = (typeof PARTNER_INSPECTOR_TAB_IDS)[number];

const PARTNER_INSPECTOR_TABS: {
  id: PartnerInspectorTabId;
  label: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
}[] = [
  { id: 'overview', label: 'Overview', accent: 'emerald' },
  { id: 'profile', label: 'Profile', accent: 'violet' },
  { id: 'reports', label: 'Reports', accent: 'sky' },
  { id: 'analysis', label: 'Analysis', accent: 'rose' },
  { id: 'evidence', label: 'Evidence', accent: 'emerald' },
  { id: 'letters', label: 'Letters', accent: 'violet' },
  { id: 'tasks', label: 'Tasks', accent: 'sky' },
  { id: 'notes', label: 'Notes', accent: 'rose' },
  { id: 'debt', label: 'Debt', accent: 'emerald' },
];

function resolveInspectorTab(raw: string | null): PartnerInspectorTabId {
  const t = (raw || '').toLowerCase();
  if (t === 'disputes') return 'letters';
  if ((PARTNER_INSPECTOR_TAB_IDS as readonly string[]).includes(t)) {
    return t as PartnerInspectorTabId;
  }
  return 'overview';
}

type PartnerRecordInspectorProps = {
  partner: Partner;
  dataMode: WorkspaceProductSurfaceProps['dataMode'];
  onClose: () => void;
  onOpenSecondaryDrawer?: () => void;
  onStatusChange?: (status: Partner['status']) => void;
  statusSaving?: boolean;
  onOpenCareTeam?: () => void;
  onOpenPortalAccess?: () => void;
  onOpenSendInvite?: () => void;
  onOpenGrantAccess?: () => void;
  statusChip?: React.ReactNode;
  breach?: boolean;
  missingReport?: boolean;
  careOwnerName?: string | null;
};

function InspectorTabBody({
  tab,
  partnerId,
  dataMode,
}: {
  tab: PartnerInspectorTabId;
  partnerId: string;
  dataMode: WorkspaceProductSurfaceProps['dataMode'];
}) {
  const surfaceProps: WorkspaceProductSurfaceProps = {
    role: 'partner',
    pageId: tab === 'notes' ? 'messages' : tab === 'tasks' ? 'work' : tab === 'profile' ? 'account' : tab,
    partnerId,
    dataMode,
  };

  switch (tab) {
    case 'overview':
      return <PartnerDashboardProductSurface embedded dataMode={dataMode} />;
    case 'profile':
      return <PartnerAccountProductSurface {...surfaceProps} pageId="account" />;
    case 'reports':
      return <PartnerReportsProductSurface {...surfaceProps} pageId="reports" />;
    case 'analysis':
      return <PartnerAnalysisProductSurface {...surfaceProps} pageId="analysis" />;
    case 'evidence':
      return <PartnerEvidenceVaultProductSurface {...surfaceProps} pageId="evidence" />;
    case 'letters':
      return <PartnerLettersProductSurface {...surfaceProps} pageId="letters" />;
    case 'tasks':
      return <PartnerWorkProductSurface {...surfaceProps} pageId="work" />;
    case 'notes':
      return <PartnerNotesProductSurface {...surfaceProps} pageId="notes" />;
    case 'debt':
      return <PartnerDebtProductSurface {...surfaceProps} pageId="debt" />;
    default:
      return <PartnerDashboardProductSurface embedded dataMode={dataMode} />;
  }
}

export default function PartnerRecordInspector({
  partner,
  dataMode,
  onClose,
  onOpenSecondaryDrawer: _onOpenSecondaryDrawer,
  onStatusChange,
  statusSaving,
  onOpenCareTeam,
  onOpenPortalAccess,
  onOpenSendInvite,
  onOpenGrantAccess: _onOpenGrantAccess,
  statusChip,
  breach,
  missingReport,
  careOwnerName,
}: PartnerRecordInspectorProps) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  /** Default is the admin credit file. Partner portal preview is opt-in. */
  const lens: PartnerInspectorLens =
    searchParams.get('view') === 'partner' ? 'partner-view' : 'admin-file';
  const activeTab = resolveInspectorTab(searchParams.get('tab'));

  const writeQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams);
      mutate(params);
      navigate(`${pathname}?${params.toString()}`, { replace: true });
    },
    [navigate, pathname, searchParams],
  );

  const setLens = useCallback(
    (next: PartnerInspectorLens) => {
      writeQuery((params) => {
        if (next === 'admin-file') params.set('view', 'admin');
        else params.set('view', 'partner');
        if (next === 'partner-view') params.set('tab', 'overview');
      });
    },
    [writeQuery],
  );

  const displayName = partner.profile?.fullName?.trim() || partner.profile?.email?.trim() || 'Partner';
  const initials = useMemo(
    () =>
      displayName
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'FC',
    [displayName],
  );

  const bodyTab: PartnerInspectorTabId = activeTab;

  return (
    <aside
      className="fc-wlp-inspector-panel fc-wlp-partner-record-inspector"
      data-bed="dark"
      data-lens={lens}
      data-partner-id={partner.id}
      aria-label={`Partner record inspector for ${displayName}`}
    >
      <div className="fc-wlp-inspector-header fc-wlp-partner-inspector-header">
        <div className="fc-wlp-inspector-title">
          <button
            type="button"
            className="fc-wlp-btn-secondary !py-2 !px-3 text-sm font-extrabold shrink-0"
            onClick={onClose}
            aria-label="Close partner inspector and return to list"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            Back
          </button>
          <div className="fc-wlp-partner-inspector-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2 flex-wrap m-0">
              {displayName}
              {onStatusChange ? (
                <select
                  id={`partner-status-${partner.id}`}
                  aria-label="Partner file status"
                  className="fc-wlp-partner-status-select"
                  value={partner.status}
                  disabled={statusSaving}
                  onChange={(event) => onStatusChange(event.target.value as Partner['status'])}
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              ) : (
                <span className="text-sm uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
                  {partner.status}
                </span>
              )}
            </h3>
            <p className="text-base font-semibold text-white/80 m-0 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
              <span>{partner.profile?.email || 'No email on file'}</span>
              <span aria-hidden="true">·</span>
              <span>{partner.profile?.phone || 'No phone on file'}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--sky">Admin record</span>
              {breach ? (
                <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--rose">SLA breach</span>
              ) : (
                <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--emerald">SLA on track</span>
              )}
              {missingReport ? (
                <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--violet">Missing report</span>
              ) : null}
              {careOwnerName ? (
                <span className="fc-wlp-atlas-tag fc-wlp-atlas-tag--emerald">Owner: {careOwnerName}</span>
              ) : null}
              {statusChip}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AdminPartnerViewAsButton
            partnerId={partner.id}
            label="View as partner"
            className="fc-wlp-btn-primary !py-2 !px-3 text-sm font-extrabold"
          />
          <button
            type="button"
            className="fc-wlp-btn-secondary !py-2 !px-3 text-sm font-extrabold"
            onClick={() => openPortalAsPartner(partner.id)}
            title="Open live portal in a new tab"
          >
            <ExternalLink size={13} /> Portal tab
          </button>
          <button
            type="button"
            className="fc-wlp-btn-secondary !py-2 !px-2 text-sm font-extrabold"
            onClick={onClose}
            aria-label="Close inspector"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="fc-wlp-partner-lens-bar" role="tablist" aria-label="Partner record lenses">
        <button
          type="button"
          role="tab"
          aria-selected={lens === 'admin-file'}
          className={`fc-wlp-partner-lens-btn ${lens === 'admin-file' ? 'is-active accent-emerald' : ''}`}
          onClick={() => setLens('admin-file')}
        >
          <ShieldCheck size={15} /> Admin file
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={lens === 'partner-view'}
          className={`fc-wlp-partner-lens-btn ${lens === 'partner-view' ? 'is-active accent-violet' : ''}`}
          onClick={() => setLens('partner-view')}
        >
          <LayoutDashboard size={15} /> View as partner
        </button>
      </div>

      {lens === 'partner-view' ? (
        <div className="fc-wlp-partner-workflow-tabs" role="tablist" aria-label="Partner portal preview">
          {PARTNER_INSPECTOR_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`fc-wlp-partner-workflow-tab accent-${tab.accent} ${
                activeTab === tab.id ? 'is-active' : ''
              }`}
              onClick={() => {
                writeQuery((params) => {
                  params.set('view', 'partner');
                  params.set('tab', tab.id);
                });
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="fc-wlp-partner-quick-actions">
        <button
          type="button"
          className="fc-wlp-partner-quick-action accent-sky"
          onClick={() =>
            openCommunicationHub({
              tab: 'team',
              expanded: true,
              partnerId: partner.id,
              partnerDisplayName: displayName,
              lane: partner.lane,
            })
          }
        >
          <MessageSquare size={14} /> Message
        </button>
        <button
          type="button"
          className="fc-wlp-partner-quick-action accent-violet"
          onClick={() =>
            openCommunicationHub({
              partnerId: partner.id,
              tab: 'ai',
              expanded: true,
              partnerDisplayName: displayName,
              lane: partner.lane,
            })
          }
        >
          <Sparkles size={14} /> Ask Finely
        </button>
        <button
          type="button"
          className="fc-wlp-partner-quick-action accent-rose"
          onClick={() => onOpenCareTeam?.()}
          disabled={!onOpenCareTeam}
        >
          <UserCheck size={14} /> Care team
        </button>
        <button
          type="button"
          className="fc-wlp-partner-quick-action accent-emerald"
          onClick={() => (onOpenSendInvite ?? onOpenPortalAccess)?.()}
          disabled={!onOpenSendInvite && !onOpenPortalAccess}
        >
          <Mail size={14} /> Send invite
        </button>
      </div>

      <div className="fc-wlp-partner-view-embed" data-fc-partner-portal="1" data-partner-id={partner.id} data-bed="dark">
        <Suspense fallback={<ProductDashboardSkeleton label="Loading partner workspace" />}>
          {lens === 'admin-file' ? (
            <AdminPartnerFulfillmentSurface
              partner={partner}
              dataMode={dataMode}
              missingReport={Boolean(missingReport)}
            />
          ) : (
            <PartnerSessionOverrideProvider partner={partner}>
              <InspectorTabBody tab={bodyTab} partnerId={partner.id} dataMode={dataMode} />
            </PartnerSessionOverrideProvider>
          )}
        </Suspense>
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line !mb-0 !mt-1 text-sm font-semibold text-white/80">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </aside>
  );
}
