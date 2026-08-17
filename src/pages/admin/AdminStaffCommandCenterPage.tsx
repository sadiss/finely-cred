import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { PartnerStaffRosterPanel } from '../../features/staffCommandCenter/PartnerStaffRosterPanel';
import { StaffDirectoryPanel, type StaffKindFilter } from '../../features/staffCommandCenter/StaffDirectoryPanel';
import { isHumanStaffKind, StaffKindBadge } from '../../features/staffCommandCenter/StaffKindBadge';
import { staffCmdSelectedChip } from '../../features/staffCommandCenter/staffCommandUi';
import { StaffGeoWarRoomPanel } from '../../features/staffCommandCenter/StaffGeoWarRoomPanel';
import { StaffMissionBuilder } from '../../features/staffCommandCenter/StaffMissionBuilder';
import { StaffOrgChartPanel } from '../../features/staffCommandCenter/StaffOrgChartPanel';
import { StaffWorkroomPanel } from '../../features/staffCommandCenter/StaffWorkroomPanel';
import { LeadIntelStaffRosterPanel } from '../../features/staffCommandCenter/LeadIntelStaffRosterPanel';
import { loadStaffCommandStore, resetStaffCommandDemo } from '../../features/staffCommandCenter/staffCommandRepo';
import { GEO_CLUSTERS, STAFF_DEPARTMENTS } from '../../features/staffCommandCenter/staffDirectory';
import { findStaff, getStaffRoster, refreshStaffRoster, staffFullName } from '../../features/staffCommandCenter/staffRoster';
import { StaffAvatar } from '../../features/staffCommandCenter/StaffAvatar';
import { HumanStaffConversationPanel } from '../../features/humanStaffOs/HumanStaffConversationPanel';
import { HumanStaffKnowledgePanel } from '../../features/humanStaffOs/HumanStaffKnowledgePanel';
import { HumanStaffMissionControlPanel } from '../../features/humanStaffOs/HumanStaffMissionControlPanel';
import { HumanStaffNotificationsPanel } from '../../features/humanStaffOs/HumanStaffNotificationsPanel';
import { getHumanStaffAgent } from '../../features/humanStaffOs/humanStaffDirectory';
import { loadHumanStaffStore, resetHumanStaffDemo } from '../../features/humanStaffOs/humanStaffRepo';
import { HumanStaffAvatar } from '../../features/humanStaffOs/HumanStaffAvatar';
import { humanStaffDisplayName } from '../../features/humanStaffOs/humanStaffRosterBridge';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { STAFF_CMD_SECONDARY_BTN } from '../../features/staffCommandCenter/staffCommandUi';
import { StaffSocialPresenceStrip } from '../../features/staffCommandCenter/StaffSocialPresenceStrip';
import { StaffSocialPageAssignWizard } from '../../features/staffCommandCenter/StaffSocialPageAssignWizard';

const VALID_VIEWS = ['overview', 'roster', 'partner', 'departments', 'missions', 'talk', 'inbox', 'knowledge', 'geo', 'workroom', 'social'] as const;
type View = (typeof VALID_VIEWS)[number];

function parseView(raw: string | null): View {
  if (raw && VALID_VIEWS.includes(raw as View)) return raw as View;
  return 'overview';
}

export default function AdminStaffCommandCenterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [version, setVersion] = useState(0);
  const view = parseView(searchParams.get('view'));
  const kindFilter = (searchParams.get('kind') as StaffKindFilter) || 'all';
  const setView = (id: View) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', id);
    setSearchParams(next, { replace: true });
  };
  const setKindFilter = (k: StaffKindFilter) => {
    const next = new URLSearchParams(searchParams);
    next.set('view', 'roster');
    if (k === 'all') next.delete('kind');
    else next.set('kind', k);
    setSearchParams(next, { replace: true });
  };

  const store = useMemo(() => loadStaffCommandStore(), [version]);
  const humanStore = useMemo(() => loadHumanStaffStore(), [version]);
  const roster = useMemo(() => getStaffRoster(), [version]);
  const rosterReady = roster.length > 0;
  const selectedStaff = store.selectedStaffIds
    .map((id) => findStaff(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const selectedAgents = humanStore.selectedAgentIds.map((id) => getHumanStaffAgent(id));
  const working = roster.filter((s) => s.status === 'working').length;
  const blocked = roster.filter((s) => s.status === 'blocked').length;
  const aiCount = roster.filter((s) => s.kind === 'ai_staff' || s.kind === 'system_team').length;
  const humanCount = roster.filter((s) => isHumanStaffKind(s.kind)).length;
  const unread = humanStore.notifications.filter((n) => !n.read).length;
  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    refreshStaffRoster();
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!searchParams.get('view')) {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'overview');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const kpis = [
    { label: 'AI operators', value: String(aiCount), hint: 'growth systems', accent: 'violet' as const },
    { label: 'Human team', value: String(humanCount), hint: 'company hires', accent: 'amber' as const },
    { label: 'Working', value: String(working), hint: 'active now', accent: 'emerald' as const },
    { label: 'Blocked', value: String(blocked), hint: 'needs setup', accent: 'rose' as const },
    { label: 'Inbox', value: String(unread), hint: 'handoffs', accent: 'fuchsia' as const },
    { label: 'Departments', value: String(STAFF_DEPARTMENTS.length), hint: 'org chart', accent: 'sky' as const },
  ];

  return (
    <PageShell
      badge="Admin"
      title="Staff Command Center"
      subtitle="AI operators, human team, partner specialists, missions, talk, and Lead Intel — one command center."
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/lead-intel')} className={STAFF_CMD_SECONDARY_BTN}>
              Lead Intel
            </button>
            <button type="button" onClick={() => navigate('/admin/crm')} className={STAFF_CMD_SECONDARY_BTN}>
              CRM
            </button>
            <button
              type="button"
              onClick={() => {
                resetStaffCommandDemo();
                resetHumanStaffDemo();
                refresh();
              }}
              className={FINELY_OS_SECONDARY_BTN}
            >
              Reset demo
            </button>
          </div>
        </div>

        {!rosterReady ? (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-5 space-y-3">
            <div className="text-white font-bold">Staff roster did not load</div>
            <p className="text-sm text-white/65">
              This is usually a one-time module init issue or stale browser data. Try reset demo, then refresh.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  resetStaffCommandDemo();
                  resetHumanStaffDemo();
                  refresh();
                }}
                className={FINELY_OS_SECONDARY_BTN}
              >
                Reset demo data
              </button>
              <button type="button" onClick={() => window.location.reload()} className={STAFF_CMD_SECONDARY_BTN}>
                Refresh page
              </button>
            </div>
          </div>
        ) : (
        <FinelyUnifiedHubLayout
          eyebrow="Staff-first operating system"
          title="AI + human staff in one place"
          subtitle="Violet = AI operators. Amber = human team. Partner tab = client-facing humans in chat & portal."
          accent="violet"
          kpis={kpis}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'roster', label: 'Company roster' },
            { id: 'partner', label: 'Partner team' },
            { id: 'departments', label: 'Departments' },
            { id: 'missions', label: 'Missions' },
            { id: 'talk', label: 'Talk to staff' },
            { id: 'inbox', label: 'Inbox', badge: unread || undefined },
            { id: 'knowledge', label: 'Knowledge' },
            { id: 'geo', label: 'Geo war room' },
            { id: 'social', label: 'Social presence' },
            { id: 'workroom', label: 'Workroom', badge: store.missions.length || undefined },
          ]}
          activeTab={view}
          onTabChange={(id) => setView(id as View)}
          primaryAction={{ label: 'Run Lead Intel', onClick: () => navigate('/admin/lead-intel') }}
          secondaryAction={{ label: 'CMO console', onClick: () => navigate('/admin/cmo') }}
          contentVariant="flush"
          tabDensity="comfortable"
        >
          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 mb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className={`${FINELY_OS_ENTITY_BODY} text-[10px] uppercase tracking-widest font-black mr-2`}>
                Selected staff
              </div>
              {selectedStaff.map((s) => (
                <div
                  key={s.id}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 ${staffCmdSelectedChip(s.kind)}`}
                >
                  <StaffAvatar staff={s} size="sm" active />
                  <span className="text-xs text-white/80 font-bold">{staffFullName(s)}</span>
                  <StaffKindBadge kind={s.kind} compact />
                </div>
              ))}
              {selectedAgents
                .filter((a) => !selectedStaff.some((s) => s.id === a.id))
                .map((agent) => (
                  <div
                    key={agent.id}
                    className="inline-flex items-center gap-2 rounded-2xl border border-amber-400/55 bg-amber-500/10 px-3 py-2"
                  >
                    <HumanStaffAvatar agent={agent} size="sm" />
                    <span className="text-xs text-white/70 font-bold">{humanStaffDisplayName(agent)}</span>
                    <StaffKindBadge kind="human_staff" compact />
                  </div>
                ))}
              {!selectedStaff.length && !selectedAgents.length ? (
                <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>Pick 1–3 people in Roster or Talk.</div>
              ) : null}
            </div>
          </div>

          {view === 'overview' && (
            <div className="space-y-8">
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                <h3 className="text-white font-black text-lg">How this page is organized</h3>
                <ul className="mt-3 space-y-2 text-sm text-white/65 list-disc pl-5">
                  <li><strong className="text-violet-200">Company roster</strong> — AI operators (violet badge) vs human team (amber badge).</li>
                  <li><strong className="text-amber-200">Partner team</strong> — human specialists clients see in chat & portal.</li>
                  <li><strong className="text-violet-200">Talk / Inbox</strong> — conversations and handoffs with selected staff.</li>
                  <li><strong className="text-violet-200">Lead Intel</strong> — discovery uses the same company roster (not a duplicate list).</li>
                </ul>
              </div>
              <StaffSocialPresenceStrip />
              <LeadIntelStaffRosterPanel />
              <StaffOrgChartPanel onSelectDepartment={() => setView('departments')} />
              <StaffMissionBuilder selectedIds={store.selectedStaffIds} onChanged={refresh} />
              <HumanStaffMissionControlPanel selectedIds={humanStore.selectedAgentIds} onChanged={refresh} />
            </div>
          )}
          {view === 'roster' && (
            <StaffDirectoryPanel
              selectedIds={store.selectedStaffIds}
              onChanged={refresh}
              kindFilter={kindFilter}
              onKindFilterChange={setKindFilter}
            />
          )}
          {view === 'partner' && <PartnerStaffRosterPanel />}
          {view === 'departments' && <StaffOrgChartPanel />}
          {view === 'missions' && <StaffMissionBuilder selectedIds={store.selectedStaffIds} onChanged={refresh} />}
          {view === 'talk' && (
            <HumanStaffConversationPanel selectedIds={humanStore.selectedAgentIds} onChanged={refresh} />
          )}
          {view === 'inbox' && (
            <HumanStaffNotificationsPanel notifications={humanStore.notifications} onChanged={refresh} />
          )}
          {view === 'knowledge' && <HumanStaffKnowledgePanel />}
          {view === 'geo' && <StaffGeoWarRoomPanel activeIds={store.settings.activeGeoClusterIds} />}
          {view === 'social' && (
            <div className="space-y-8">
              <StaffSocialPresenceStrip />
              <StaffSocialPageAssignWizard />
            </div>
          )}
          {view === 'workroom' && (
            <div className="space-y-8">
              <StaffWorkroomPanel missions={store.missions} />
              <HumanStaffMissionControlPanel selectedIds={humanStore.selectedAgentIds} onChanged={refresh} />
            </div>
          )}
        </FinelyUnifiedHubLayout>
        )}
      </div>
    </PageShell>
  );
}
