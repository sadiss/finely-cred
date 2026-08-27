import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  MapPinned,
  Radar,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { isHumanStaffKind, StaffKindBadge } from '../../../staffCommandCenter/StaffKindBadge';
import { StaffDirectoryPanel, type StaffKindFilter } from '../../../staffCommandCenter/StaffDirectoryPanel';
import { StaffGeoWarRoomPanel } from '../../../staffCommandCenter/StaffGeoWarRoomPanel';
import { StaffMissionBuilder } from '../../../staffCommandCenter/StaffMissionBuilder';
import { PartnerStaffRosterPanel } from '../../../staffCommandCenter/PartnerStaffRosterPanel';
import { StaffAvatar, StaffStatusPill } from '../../../staffCommandCenter/StaffAvatar';
import {
  loadStaffCommandStore,
  resetStaffCommandDemo,
} from '../../../staffCommandCenter/staffCommandRepo';
import {
  getStaffRoster,
  refreshStaffRoster,
  staffFullName,
} from '../../../staffCommandCenter/staffRoster';
import { STAFF_DEPARTMENTS } from '../../../staffCommandCenter/staffDirectory';
import type { StaffMember } from '../../../staffCommandCenter/types';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import {
  AdminContextCommand,
  AdminStageHero,
  AdminStageSection,
  AdminStageShell,
} from '../components/ProductAdminStage';
import { ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminStaffSignature.css';

type StaffRoom = 'floor' | 'roster' | 'departments' | 'missions' | 'geo' | 'partner';

type StaffControlTile = {
  id: StaffRoom;
  label: string;
  purpose: string;
  icon: LucideIcon;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  count?: number;
  status: 'attention' | 'live' | 'muted';
  statusLabel: string;
};

function staffTileChipTone(status: StaffControlTile['status']): 'ok' | 'warn' | 'blocked' {
  if (status === 'attention') return 'warn';
  if (status === 'muted') return 'blocked';
  return 'ok';
}

export default function AdminStaffSignatureSurface({
  dataMode,
}: WorkspaceProductSurfaceProps) {
  const [room, setRoom] = useState<StaffRoom>('floor');
  const [kindFilter, setKindFilter] = useState<StaffKindFilter>('all');
  const [version, setVersion] = useState(0);

  const refresh = () => setVersion((current) => current + 1);

  useEffect(() => {
    refreshStaffRoster();
    refresh();
    const onStore = () => refresh();
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const model = useMemo(() => {
    void version;
    const roster = getStaffRoster();
    const store = loadStaffCommandStore();
    const working = roster.filter((member) => member.status === 'working');
    const blocked = roster.filter((member) => member.status === 'blocked');
    const needsApproval = roster.filter((member) => member.status === 'needs_approval');
    const humans = roster.filter((member) => isHumanStaffKind(member.kind));
    const ai = roster.filter(
      (member) => member.kind === 'ai_staff' || member.kind === 'system_team',
    );
    const departmentCoverage = STAFF_DEPARTMENTS.map((department) => ({
      department,
      staff: roster.filter((member) => member.departmentId === department.id),
    })).sort((a, b) => a.staff.length - b.staff.length);

    return {
      roster,
      store,
      working,
      blocked,
      needsApproval,
      humans,
      ai,
      departmentCoverage,
      selectedIds: store.selectedStaffIds,
    };
  }, [version]);

  const critical = model.blocked.length || model.needsApproval.length;

  const controlTiles: StaffControlTile[] = [
    {
      id: 'floor',
      label: 'Command floor',
      purpose: 'Who is working, blocked, and where ownership sits.',
      icon: Radar,
      accent: 'violet',
      count: model.working.length,
      status: critical ? 'attention' : 'live',
      statusLabel: critical ? 'Needs attention' : 'Coverage steady',
    },
    {
      id: 'roster',
      label: 'Company roster',
      purpose: 'Portraits, responsibilities, shifts, and status.',
      icon: Users,
      accent: 'emerald',
      count: model.roster.length,
      status: model.blocked.length ? 'attention' : 'live',
      statusLabel: model.blocked.length ? `${model.blocked.length} blocked` : 'All profiles',
    },
    {
      id: 'departments',
      label: 'Department map',
      purpose: 'Leadership, staffing depth, and work products by line.',
      icon: Building2,
      accent: 'sky',
      count: STAFF_DEPARTMENTS.length,
      status: 'live',
      statusLabel: `${model.ai.length} AI operators`,
    },
    {
      id: 'missions',
      label: 'Mission control',
      purpose: 'Build a staffed plan with ownership and handoff steps.',
      icon: Target,
      accent: 'rose',
      count: model.store.missions.length,
      status: model.store.missions.length ? 'live' : 'muted',
      statusLabel: model.store.missions.length ? 'Missions active' : 'No missions',
    },
    {
      id: 'geo',
      label: 'Geo war room',
      purpose: 'City ownership, funnels, blockers, and next moves.',
      icon: MapPinned,
      accent: 'emerald',
      status: 'live',
      statusLabel: 'Regional view',
    },
    {
      id: 'partner',
      label: 'Partner team',
      purpose: 'Specialist coverage visible to partners in chat and portal.',
      icon: Sparkles,
      accent: 'sky',
      status: 'live',
      statusLabel: 'Partner-facing',
    },
  ];

  const activeTile = controlTiles.find((tile) => tile.id === room) ?? controlTiles[0]!;

  const alertRail = useMemo(() => {
    const items = [
      ...model.blocked.map((member) => ({
        id: member.id,
        title: `${staffFullName(member)} is blocked`,
        detail: member.title,
        tone: 'blocked' as const,
        room: 'roster' as StaffRoom,
      })),
      ...model.needsApproval.map((member) => ({
        id: member.id,
        title: `${staffFullName(member)} needs approval`,
        detail: member.title,
        tone: 'warn' as const,
        room: 'roster' as StaffRoom,
      })),
    ];
    return items.slice(0, 6);
  }, [model.blocked, model.needsApproval]);

  const heroRoster = (
    <div className="fc-wlp-staff-hero-roster" aria-label="Staff on the command floor">
      {model.roster.slice(0, 7).map((member, index) => (
        <div
          key={member.id}
          className="fc-wlp-staff-hero-person"
          data-status={member.status}
          style={{ '--fc-staff-index': index } as React.CSSProperties}
          title={`${staffFullName(member)} — ${member.title}`}
        >
          <StaffAvatar staff={member} size="sm" active={member.status === 'working'} />
          <span>{staffFullName(member)}</span>
        </div>
      ))}
      <div className="fc-wlp-staff-hero-roster-count">
        <strong>{model.roster.length}</strong>
        <span>on the floor</span>
      </div>
    </div>
  );

  const renderRoomBody = () => {
    if (room === 'roster') {
      return (
        <StaffDirectoryPanel
          selectedIds={model.selectedIds}
          onChanged={refresh}
          kindFilter={kindFilter}
          onKindFilterChange={setKindFilter}
        />
      );
    }

    if (room === 'departments') {
      return (
        <DepartmentConstellation
          departments={model.departmentCoverage}
          onOpenRoster={() => setRoom('roster')}
        />
      );
    }

    if (room === 'missions') {
      return <StaffMissionBuilder selectedIds={model.selectedIds} onChanged={refresh} />;
    }

    if (room === 'geo') {
      return <StaffGeoWarRoomPanel activeIds={model.selectedIds} />;
    }

    if (room === 'partner') {
      return <PartnerStaffRosterPanel />;
    }

    return (
      <StaffCommandFloor
        roster={model.roster}
        selectedIds={model.selectedIds}
        onSelectRoster={() => setRoom('roster')}
        onSelectDepartments={() => setRoom('departments')}
      />
    );
  };

  const renderRoomSection = () => {
    const sectionMeta: Record<StaffRoom, { eyebrow: string; title: string; description: string }> = {
      floor: {
        eyebrow: 'Command floor',
        title: 'The people behind today’s work',
        description: 'Featured profile is the most urgent staff signal; the constellation shows ownership and state.',
      },
      roster: {
        eyebrow: 'Company roster',
        title: 'Profiles carry the work',
        description: 'Portrait, role, responsibility, shift, status, and selection stay together.',
      },
      departments: {
        eyebrow: 'Department map',
        title: 'The company floor by outcomes',
        description: 'Each department shows depth, owner, active people, and the work it produces.',
      },
      missions: {
        eyebrow: 'Mission control',
        title: 'Build the team around the outcome',
        description: 'Staff a plan with ownership and handoff steps.',
      },
      geo: {
        eyebrow: 'Regional command',
        title: 'Growth ownership city by city',
        description: 'Staff, funnels, zip focus, source mix, blockers, and next moves in one war room.',
      },
      partner: {
        eyebrow: 'Partner team',
        title: 'Specialist coverage stays personal',
        description: 'The same roster, roles, portraits, and shifts partners see in the portal.',
      },
    };

    const meta = sectionMeta[room];

    return (
      <AdminStageSection
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        tone="dark"
        action={
          room === 'floor' ? (
            <button type="button" className="fc-wlp-btn-secondary" onClick={() => setRoom('departments')}>
              Open department map <ArrowUpRight size={14} />
            </button>
          ) : null
        }
      >
        {renderRoomBody()}
      </AdminStageSection>
    );
  };

  return (
    <AdminStageShell family="department-suite" signature="staff-constellation-floor" accent="emerald">
      <AdminStageHero
        tone="people"
        accent="emerald"
        eyebrow="Staff"
        title={
          <>
            See ownership as a <span className="fc-wlp-staff-title-accent">living company floor.</span>
          </>
        }
        description="Human team, AI operators, partner specialists, departments, missions, and regional coverage — pick a room, then work the inspector."
        status={
          critical
            ? `${critical} staff signal${critical === 1 ? '' : 's'} need attention`
            : 'Coverage steady'
        }
        freshness="just now"
        icon={Users}
        feature={heroRoster}
        primaryAction={
          <ProductPagePrimaryAction label="Open roster" onClick={() => setRoom('roster')} />
        }
      >
        <div className="fc-wlp-staff-duty-line">
          {model.working.slice(0, 5).map((member) => (
            <span key={member.id}>
              <i /> {member.firstName}
            </span>
          ))}
          <em>{model.working.length} active now</em>
        </div>
      </AdminStageHero>

      <div className="fc-wlp-staff-control-room space-y-4">
        <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6`} data-fc-accent="violet">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Control room pulse</p>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {critical > 0
                  ? `${critical} staff signal${critical === 1 ? '' : 's'} need attention — check the alert rail first.`
                  : `${model.working.length} people active now. Scan departments, missions, or partner coverage.`}
              </p>
            </div>
            <span className={finelyOsStatusChip(critical > 0 ? 'warn' : 'ok')}>
              {critical > 0 ? 'Needs attention' : 'Coverage steady'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={`${finelyOsCatalogCard('emerald')} p-4`} data-fc-accent="emerald">
              <div className="flex items-center gap-2">
                <Activity size={18} />
                <span className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{model.working.length}</span>
              </div>
              <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Working now</p>
            </div>
            <div className={`${finelyOsCatalogCard('rose')} p-4`} data-fc-accent="rose">
              <div className="flex items-center gap-2">
                <Target size={18} />
                <span className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{critical}</span>
              </div>
              <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Need attention</p>
            </div>
            <div className={`${finelyOsCatalogCard('sky')} p-4`} data-fc-accent="sky">
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{model.humans.length}</span>
              </div>
              <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Human team</p>
            </div>
            <div className={`${finelyOsCatalogCard('violet')} p-4`} data-fc-accent="violet">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{model.ai.length}</span>
              </div>
              <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>AI operators</p>
            </div>
          </div>
        </div>

        <div className="fc-wlp-staff-control-layout">
          <aside className="fc-wlp-staff-status-grid">
            <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Status grid</h2>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Pick a room to open its inspector.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {controlTiles.map((tile) => {
                const Icon = tile.icon;
                const selected = room === tile.id;
                const chipTone = staffTileChipTone(tile.status);
                return (
                  <button
                    key={tile.id}
                    type="button"
                    data-selected={selected ? 'true' : undefined}
                    className={`text-left ${finelyOsCatalogCard(tile.accent)} p-4 lg:p-5 transition-all ${
                      selected ? 'ring-2 ring-white/30' : ''
                    }`}
                    data-fc-accent={tile.accent}
                    onClick={() => {
                      setRoom(tile.id);
                      if (tile.id === 'roster') setKindFilter('all');
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Icon size={20} className="shrink-0 opacity-90" />
                      <span className={finelyOsStatusChip(chipTone)}>{tile.statusLabel}</span>
                    </div>
                    <div className={`mt-3 text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.label}</div>
                    <p className={`mt-1 text-sm font-bold leading-snug ${FINELY_OS_ENTITY_BODY}`}>{tile.purpose}</p>
                    {tile.count !== undefined ? (
                      <div className="mt-3 text-2xl font-extrabold">{tile.count}</div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="fc-wlp-staff-inspector-column space-y-4 min-w-0">
            <div className={`${finelyOsCatalogCard(activeTile.accent)} p-5 lg:p-6`} data-fc-accent={activeTile.accent}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={FINELY_OS_ENTITY_SUBLABEL}>Room inspector</p>
                  <h2 className="mt-1 text-2xl font-extrabold lg:text-3xl">{activeTile.label}</h2>
                  <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeTile.purpose}</p>
                </div>
                {activeTile.id === 'roster' ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`fc-wlp-btn-secondary ${kindFilter === 'human' ? '!border-emerald-400/50' : ''}`}
                      onClick={() => setKindFilter('human')}
                    >
                      Human team
                    </button>
                    <button
                      type="button"
                      className={`fc-wlp-btn-secondary ${kindFilter === 'ai_staff' ? '!border-violet-400/50' : ''}`}
                      onClick={() => setKindFilter('ai_staff')}
                    >
                      AI staff
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="fc-wlp-staff-inspector-stage">{renderRoomSection()}</div>
          </div>

          <aside className="fc-wlp-staff-alert-rail space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`} data-fc-accent="rose">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <h3 className="text-lg font-extrabold">Alert rail</h3>
              </div>
              {alertRail.length === 0 ? (
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No blocked profiles or approval queues.</p>
              ) : (
                <div className="space-y-2">
                  {alertRail.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => setRoom(alert.room)}
                      className={`fc-wlp-staff-alert-item w-full text-left ${finelyOsCatalogCard('sky')} p-4`}
                      data-fc-accent="sky"
                    >
                      <span className={finelyOsStatusChip(alert.tone === 'blocked' ? 'blocked' : 'warn')}>
                        {alert.title}
                      </span>
                      <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{alert.detail}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6 space-y-3`} data-fc-accent="emerald">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Floor snapshot</p>
              <div className="space-y-2">
                {model.working.slice(0, 4).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <StaffAvatar staff={member} size="sm" active />
                    <div className="min-w-0">
                      <p className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{staffFullName(member)}</p>
                      <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{member.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AdminContextCommand
        label="Assignment"
        title={critical ? 'Resolve visible people blockers first.' : 'Use open capacity deliberately.'}
        description={
          critical
            ? 'A blocked person or approval queue is slowing the floor. Start there before launching another mission.'
            : 'Every active line has coverage. Place available capacity where it creates the most movement.'
        }
        steps={
          critical
            ? ['Open the blocked profile.', 'Resolve setup or approval.', 'Confirm every mission has an owner.']
            : ['Scan thin departments.', 'Check the next shift change.', 'Staff the highest-value mission.']
        }
        prompt="Who should own the next highest-value staff action, and why?"
        contextLabel="Staff"
      />

      <p className="fc-wlp-section-description fc-wlp-compliance-line">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </AdminStageShell>
  );
}

function StaffCommandFloor({
  roster,
  selectedIds,
  onSelectRoster,
  onSelectDepartments,
}: {
  roster: StaffMember[];
  selectedIds: string[];
  onSelectRoster: () => void;
  onSelectDepartments: () => void;
}) {
  const sorted = [...roster].sort((a, b) => {
    const rank = { blocked: 0, needs_approval: 1, working: 2, idle: 3, offline: 4 };
    return rank[a.status] - rank[b.status];
  });
  const featured = sorted[0];
  const supporting = sorted.slice(1, 7);

  if (!featured) {
    return (
      <div className="fc-wlp-staff-floor-empty">
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
          The roster is empty. Restore the demo roster or open the live command center to add staff.
        </p>
        <button
          type="button"
          className="fc-wlp-btn-primary"
          onClick={() => {
            resetStaffCommandDemo();
            refreshStaffRoster();
            window.dispatchEvent(new CustomEvent('finely:store'));
          }}
        >
          Restore staff roster
        </button>
      </div>
    );
  }

  return (
    <div className="fc-wlp-staff-floor">
      <article className="fc-wlp-staff-featured" data-status={featured.status}>
        <div className="fc-wlp-staff-featured-portrait">
          <StaffAvatar staff={featured} size="xl" active={featured.status === 'working'} />
          <span className="fc-wlp-staff-featured-pulse" aria-hidden />
        </div>
        <div className="fc-wlp-staff-featured-copy">
          <span>Priority profile</span>
          <h3>{staffFullName(featured)}</h3>
          <p>{featured.title}</p>
          <div className="fc-wlp-staff-featured-badges">
            <StaffKindBadge kind={featured.kind} compact />
            <StaffStatusPill status={featured.status} />
          </div>
          <blockquote>{featured.tagline}</blockquote>
        </div>
        <button type="button" onClick={onSelectRoster}>
          Open profile <ArrowUpRight size={14} />
        </button>
      </article>

      <div className="fc-wlp-staff-constellation">
        <span className="fc-wlp-staff-constellation-line" aria-hidden />
        {supporting.map((member, index) => (
          <button
            key={member.id}
            type="button"
            className="fc-wlp-staff-node"
            data-status={member.status}
            data-selected={selectedIds.includes(member.id) ? 'true' : undefined}
            style={{ '--fc-staff-node': index } as React.CSSProperties}
            onClick={onSelectRoster}
          >
            <StaffAvatar staff={member} size="md" active={member.status === 'working'} />
            <span>
              <strong>{staffFullName(member)}</strong>
              <em>{member.title}</em>
            </span>
            <StaffStatusPill status={member.status} />
          </button>
        ))}
      </div>
    </div>
  );
}

function DepartmentConstellation({
  departments,
  onOpenRoster,
}: {
  departments: Array<{
    department: (typeof STAFF_DEPARTMENTS)[number];
    staff: StaffMember[];
  }>;
  onOpenRoster: () => void;
}) {
  return (
    <div className="fc-wlp-staff-departments">
      {departments.map(({ department, staff }, index) => {
        const owner = staff.find((member) => member.id === department.primaryOwnerId) ?? staff[0];
        const working = staff.filter((member) => member.status === 'working').length;
        return (
          <button
            key={department.id}
            type="button"
            className="fc-wlp-staff-department"
            data-empty={staff.length === 0 ? 'true' : undefined}
            style={{ '--fc-staff-dept': index } as React.CSSProperties}
            onClick={onOpenRoster}
          >
            <span className="fc-wlp-staff-department-index">{String(index + 1).padStart(2, '0')}</span>
            {owner ? <StaffAvatar staff={owner} size="md" active={owner.status === 'working'} /> : <Building2 size={24} />}
            <span className="fc-wlp-staff-department-copy">
              <em>{department.shortName}</em>
              <strong>{department.name}</strong>
              <small>{department.description}</small>
            </span>
            <span className="fc-wlp-staff-department-state">
              <strong>{staff.length}</strong>
              <small>{working} working</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
