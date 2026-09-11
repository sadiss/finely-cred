import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileSearch, FileUp, KeyRound, Mail, PenLine } from 'lucide-react';
import { StaffEntitlementBypass } from '../../../../components/billing/EntitlementGate';
import { AdminPartnerAccessPanel } from '../../../../components/admin/AdminPartnerAccessPanel';
import { LettersCommandCenter } from '../../../../components/letters/LettersCommandCenter';
import { listReportsByPartner } from '../../../../data/reportsRepo';
import type { Partner } from '../../../../domain/partners';
import { ProductReportWorkspace } from '../components/ProductReportWorkspace';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import './adminPartnerCreditWorkSurface.css';

export type AdminCreditWorkRoom = 'process' | 'findings' | 'letters' | 'access';

function roomFromTab(tab: string | null, missingReport: boolean): AdminCreditWorkRoom {
  if (tab === 'letters') return 'letters';
  if (tab === 'analysis' || tab === 'findings') return 'findings';
  if (tab === 'access' || tab === 'invite' || tab === 'grant') return 'access';
  if (tab === 'reports' || missingReport) return 'process';
  return 'process';
}

function tabFromRoom(room: AdminCreditWorkRoom): string {
  if (room === 'findings') return 'findings';
  if (room === 'letters') return 'letters';
  if (room === 'access') return 'access';
  return 'reports';
}

const COMMANDS: Array<{
  id: AdminCreditWorkRoom;
  label: string;
  hint: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  icon: typeof FileUp;
}> = [
  { id: 'process', label: 'Process report', hint: 'Upload and parse the bureau file', accent: 'emerald', icon: FileUp },
  { id: 'findings', label: 'Findings', hint: 'Accounts, scores, and dispute signals', accent: 'sky', icon: FileSearch },
  { id: 'letters', label: 'Letters', hint: 'Write and mail from this file', accent: 'violet', icon: PenLine },
];

export function AdminPartnerCreditWorkSurface({
  partner,
  dataMode,
  missingReport,
  hideChrome = false,
  accessFocus: accessFocusProp,
}: {
  partner: Partner;
  dataMode: WorkspaceProductSurfaceProps['dataMode'];
  missingReport?: boolean;
  /** Parent fulfillment floor already shows the service + room strips. */
  hideChrome?: boolean;
  accessFocus?: 'invite' | 'grant';
}) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const searchParams = React.useMemo(() => new URLSearchParams(search), [search]);
  const [accessFocus, setAccessFocus] = useState<'invite' | 'grant'>(accessFocusProp ?? 'invite');
  const [refreshKey, setRefreshKey] = useState(0);
  const reports = useMemo(() => {
    void refreshKey;
    return listReportsByPartner(partner.id);
  }, [partner.id, refreshKey]);
  const noReport = Boolean(missingReport) || reports.length === 0;
  const room = roomFromTab(searchParams.get('tab'), noReport);

  React.useEffect(() => {
    if (accessFocusProp) setAccessFocus(accessFocusProp);
  }, [accessFocusProp]);

  const setRoom = (next: AdminCreditWorkRoom, focus?: 'invite' | 'grant') => {
    if (focus) setAccessFocus(focus);
    const params = new URLSearchParams(searchParams);
    params.set('view', 'admin');
    params.set('tab', tabFromRoom(next));
    navigate(`${pathname}?${params.toString()}`, { replace: true });
  };

  const latest = reports[0] ?? null;

  const roomBody =
    room === 'letters' ? (
      <LettersCommandCenter partner={partner} layout="embedded" unifiedShell />
    ) : room === 'access' ? (
      <AdminPartnerAccessPanel
        partner={partner}
        userRole="admin"
        focusSection={accessFocus}
        onUpdated={() => setRefreshKey((n) => n + 1)}
      />
    ) : (
      <ProductReportWorkspace
        partnerId={partner.id}
        layout="embedded"
        dataMode={dataMode === 'demo' ? 'demo' : 'real'}
        room={room === 'findings' ? 'findings' : 'upload'}
        onRoomChange={(next) => setRoom(next === 'findings' ? 'findings' : 'process')}
        onActiveReportChange={() => setRefreshKey((n) => n + 1)}
      />
    );

  if (hideChrome) {
    return <StaffEntitlementBypass>{roomBody}</StaffEntitlementBypass>;
  }

  return (
    <StaffEntitlementBypass>
      <div className="fc-admin-credit-floor" data-room={room}>
        <p className="fc-admin-credit-floor__kicker">Admin work on this partner</p>
        <h2 className="fc-admin-credit-floor__title">Credit file</h2>
        <p className="fc-admin-credit-floor__lede">
          {noReport
            ? 'No bureau report on file yet. Process a report first, then open findings and letters.'
            : `${reports.length} report${reports.length === 1 ? '' : 's'} on file${
                latest?.filename ? ` · ${latest.filename}` : ''
              }.`}
        </p>

        <div className="fc-admin-credit-strip" role="tablist" aria-label="Admin credit work">
          {COMMANDS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={room === item.id}
                className="fc-admin-credit-strip__btn"
                data-fc-accent={item.accent}
                data-active={room === item.id ? 'true' : undefined}
                onClick={() => setRoom(item.id)}
              >
                <Icon size={18} aria-hidden />
                <span>
                  <strong>{item.label}</strong>
                  <em>{item.hint}</em>
                </span>
              </button>
            );
          })}
          <button
            type="button"
            className="fc-admin-credit-strip__btn"
            data-fc-accent="rose"
            data-active={room === 'access' && accessFocus === 'invite' ? 'true' : undefined}
            onClick={() => setRoom('access', 'invite')}
          >
            <Mail size={18} aria-hidden />
            <span>
              <strong>Send invite</strong>
              <em>Email the portal signup link</em>
            </span>
          </button>
          <button
            type="button"
            className="fc-admin-credit-strip__btn"
            data-fc-accent="violet"
            data-active={room === 'access' && accessFocus === 'grant' ? 'true' : undefined}
            onClick={() => setRoom('access', 'grant')}
          >
            <KeyRound size={18} aria-hidden />
            <span>
              <strong>Grant access</strong>
              <em>Unlock services on this file</em>
            </span>
          </button>
        </div>

        <div className="fc-admin-credit-room">
          {room === 'letters' ? (
            <LettersCommandCenter partner={partner} layout="embedded" unifiedShell />
          ) : room === 'access' ? (
            <AdminPartnerAccessPanel
              partner={partner}
              userRole="admin"
              focusSection={accessFocus}
              onUpdated={() => setRefreshKey((n) => n + 1)}
            />
          ) : (
            <ProductReportWorkspace
              partnerId={partner.id}
              layout="embedded"
              dataMode={dataMode === 'demo' ? 'demo' : 'real'}
              room={room === 'findings' ? 'findings' : 'upload'}
              onRoomChange={(next) => setRoom(next === 'findings' ? 'findings' : 'process')}
              onActiveReportChange={() => setRefreshKey((n) => n + 1)}
            />
          )}
        </div>
      </div>
    </StaffEntitlementBypass>
  );
}
