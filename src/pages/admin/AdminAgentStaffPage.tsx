import React, { useMemo, useState } from 'react';
import { Bot, Clock, Plus, Save, Trash2, UserCircle2, Users } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import {
  loadAgentStaffConfig,
  listAllPersonas,
  saveAgentStaffConfig,
  type AgentStaffConfig,
} from '../../data/agentPersonasRepo';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { getAgentPersona } from '../../domain/agentPersonas';
import { personaOnDutyAt } from '../../data/agentPersonasRepo';
import { toolsForPersona } from '../../lib/agentPersonaTools';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsListItem,
  finelyOsViewTab,
} from '../../features/os/finelyOsLightUi';
import { listStaffByRole, loadStaffRoster, listRoleCoverageGaps, listStaffOnDutyNow, resolveStaffOnDuty, updateStaffMemberShifts } from '../../data/staffRoster';
import { staffMemberFullName, type StaffMember, type StaffShiftBlock } from '../../domain/staffMember';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';
import type { PersonaShiftBlock } from '../../data/agentPersonasRepo';
import { syncStaffRosterToSupabase } from '../../data/staffSupabaseSync';

type Tab = 'on_duty' | 'roster' | 'personas' | 'routing';

const COVERAGE_ROLE_IDS: AgentPersonaId[] = [
  'finely_advisor',
  'dispute_coach',
  'processing_agent',
  'letter_ops_agent',
  'support_specialist',
  'debt_strategist',
  'appointment_setter',
  'compliance_agent',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function ShiftDayPicker({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {DAY_LABELS.map((label, d) => {
        const on = days.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => {
              const next = on ? days.filter((x) => x !== d) : [...days, d].sort((a, b) => a - b);
              onChange(next);
            }}
            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition ${
              on
                ? 'bg-sky-500/25 border-sky-400/40 text-sky-100'
                : FINELY_OS_ENTITY_CHIP
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function shiftLabel(block: StaffMember['shiftBlocks'][0]): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = block.days.map((d) => dayNames[d]).join(', ');
  return `${days} ${block.startHour}:00–${block.endHour}:00`;
}

export default function AdminAgentStaffPage() {
  const [cfg, setCfg] = useState<AgentStaffConfig>(() => loadAgentStaffConfig());
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('on_duty');
  const [roleFilter, setRoleFilter] = useState<AgentPersonaId | 'all'>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [editShifts, setEditShifts] = useState<StaffShiftBlock[]>([]);
  const personas = useMemo(() => listAllPersonas(), []);
  const roster = useMemo(() => loadStaffRoster(), [notice]);
  const onDutyPersona = personaOnDutyAt();
  const onDutyStaff = resolveStaffOnDuty(onDutyPersona.id);

  const onDutyNow = useMemo(() => listStaffOnDutyNow(), [notice]);
  const coverageGaps = useMemo(() => listRoleCoverageGaps(COVERAGE_ROLE_IDS), [notice]);

  const filteredRoster = useMemo(() => {
    if (roleFilter === 'all') return roster.filter((s) => s.active);
    return listStaffByRole(roleFilter);
  }, [roster, roleFilter]);

  const selectedStaff = useMemo(
    () => (selectedStaffId ? roster.find((s) => s.id === selectedStaffId) ?? null : null),
    [roster, selectedStaffId],
  );

  const openStaffEditor = (member: StaffMember) => {
    setSelectedStaffId(member.id);
    setEditShifts(member.shiftBlocks.map((b) => ({ ...b, days: [...b.days] })));
  };

  const saveStaffShifts = () => {
    if (!selectedStaffId) return;
    updateStaffMemberShifts(selectedStaffId, editShifts);
    void syncStaffRosterToSupabase();
    setNotice('Staff shift schedule saved.');
    setSelectedStaffId(null);
  };

  const save = () => {
    saveAgentStaffConfig(cfg);
    setNotice('Agent staff configuration saved.');
  };

  const tabBtn = (id: Tab, label: string) => (
    <button type="button" onClick={() => setTab(id)} className={finelyOsViewTab(tab === id, 'emerald')}>
      {label}
    </button>
  );

  return (
    <PageShell title="Agent Staff" subtitle="Named roster, behavior roles, shifts, and routing for public chat + portal">
      <div className="space-y-6">
        {notice ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
        ) : null}

        <div className={FINELY_OS_VIEW_TABS}>
          {tabBtn('on_duty', 'On duty now')}
          {tabBtn('roster', 'Team roster')}
          {tabBtn('personas', 'Behavior roles')}
          {tabBtn('routing', 'Routing & shifts')}
        </div>

        {tab === 'on_duty' ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <FinelyOsOverviewStatTile
                icon={Clock}
                label="On shift now"
                value={onDutyNow.length}
                accent="emerald"
                hint="Active roster members in a shift block"
              />
              <FinelyOsOverviewStatTile
                icon={Users}
                label="Roles monitored"
                value={COVERAGE_ROLE_IDS.length}
                accent="violet"
                hint="Public chat + ops coverage"
              />
              <FinelyOsOverviewStatTile
                icon={Bot}
                label="Coverage gaps"
                value={coverageGaps.length}
                accent="amber"
                hint="No roster or off-shift"
              />
              <FinelyOsOverviewStatTile
                icon={UserCircle2}
                label="Roster total"
                value={roster.filter((s) => s.active).length}
                accent="sky"
                hint="Named specialists"
              />
            </div>

            <FinelyOsGlassPanel icon={Clock} title="Primary on duty" accent="emerald">
              <div className="flex flex-wrap items-center gap-4">
                {onDutyStaff ? (
                  <StaffPortraitImg
                    staff={onDutyStaff}
                    className="w-14 h-14 rounded-full border-2 border-emerald-400/40"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                    <UserCircle2 className="text-emerald-300" size={28} />
                  </div>
                )}
                <div>
                  <div className="text-lg font-bold text-white">
                    {onDutyStaff ? staffMemberFullName(onDutyStaff) : onDutyPersona.name}
                  </div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    {onDutyPersona.displayTitle ?? onDutyPersona.role}
                    {onDutyStaff ? ` · ${onDutyStaff.department.replace(/_/g, ' ')}` : ''}
                  </div>
                </div>
              </div>
            </FinelyOsGlassPanel>

            <FinelyOsGlassPanel icon={Users} title="On shift roster" accent="violet">
              {onDutyNow.length === 0 ? (
                <p className={FINELY_OS_ENTITY_BODY}>No roster members match current shift blocks.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {onDutyNow.map((s) => {
                    const role = personas.find((p) => p.id === s.primaryRoleId);
                    return (
                      <div key={s.id} className={`${finelyOsInlineListItem()} flex items-center gap-3`}>
                        <StaffPortraitImg staff={s} className="w-10 h-10 rounded-full border border-white/[0.08]" />
                        <div className="min-w-0">
                          <div className="font-semibold text-white text-sm truncate">{staffMemberFullName(s)}</div>
                          <div className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`}>{role?.displayTitle ?? s.primaryRoleId}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </FinelyOsGlassPanel>

            {coverageGaps.length ? (
              <FinelyOsGlassPanel icon={Bot} title="Coverage gaps" accent="amber">
                <ul className="space-y-2 text-sm text-amber-200/90">
                  {coverageGaps.map((g) => {
                    const roleId = g.split(':')[0] as AgentPersonaId;
                    const label = getAgentPersona(roleId)?.displayTitle ?? roleId;
                    return (
                      <li key={g}>
                        {label} — {g.includes('no roster') ? 'add roster members' : 'no one on shift'}
                      </li>
                    );
                  })}
                </ul>
              </FinelyOsGlassPanel>
            ) : null}
          </>
        ) : null}

        {tab === 'roster' ? (
          <FinelyOsGlassPanel icon={Users} title="Named team roster" accent="violet">
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Filter by role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as AgentPersonaId | 'all')}
                  className={FINELY_OS_ENTITY_SELECT}
                >
                  <option value="all">All roles ({roster.filter((s) => s.active).length})</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayTitle ?? p.name} ({listStaffByRole(p.id).length})
                    </option>
                  ))}
                </select>
              </div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs pb-2`}>
                {filteredRoster.length} members · shift-aware assignment for chat portraits
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredRoster.map((s) => {
                const persona = personas.find((p) => p.id === s.primaryRoleId);
                const isOnDuty = onDutyStaff?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openStaffEditor(s)}
                    className={`w-full text-left ${finelyOsListItem(isOnDuty || selectedStaffId === s.id, isOnDuty ? 'emerald' : 'violet')}`}
                  >
                    <div className="flex items-start gap-3">
                      <StaffPortraitImg staff={s} className="w-10 h-10 rounded-full border border-white/[0.08]" />
                      <div className="min-w-0 flex-1">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{staffMemberFullName(s)}</div>
                        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5 truncate`}>
                          {persona?.displayTitle ?? persona?.name ?? s.primaryRoleId}
                        </div>
                        {isOnDuty ? (
                          <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                            On duty
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2 line-clamp-2`}>{s.bioLine}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.shiftBlocks.slice(0, 2).map((b, i) => (
                        <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full ${FINELY_OS_ENTITY_CHIP}`}>
                          {shiftLabel(b)}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedStaff ? (
              <div className="mt-6 rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-white">{staffMemberFullName(selectedStaff)}</div>
                    <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Edit shift blocks — determines on-duty portrait for chat</div>
                  </div>
                  <button type="button" onClick={() => setSelectedStaffId(null)} className={FINELY_OS_SECONDARY_BTN}>
                    Cancel
                  </button>
                </div>
                {editShifts.map((block, i) => (
                  <div key={i} className={`${finelyOsInlineListItem()} p-3 space-y-2`}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className={FINELY_OS_ENTITY_SUBLABEL}>Start hour</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={block.startHour}
                          onChange={(e) => {
                            const shifts = [...editShifts];
                            shifts[i] = { ...block, startHour: parseInt(e.target.value, 10) || 0 };
                            setEditShifts(shifts);
                          }}
                          className={FINELY_OS_ENTITY_INPUT}
                        />
                      </div>
                      <div>
                        <label className={FINELY_OS_ENTITY_SUBLABEL}>End hour</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={block.endHour}
                          onChange={(e) => {
                            const shifts = [...editShifts];
                            shifts[i] = { ...block, endHour: parseInt(e.target.value, 10) || 0 };
                            setEditShifts(shifts);
                          }}
                          className={FINELY_OS_ENTITY_INPUT}
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => setEditShifts(editShifts.filter((_, j) => j !== i))}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 text-rose-200/90"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={FINELY_OS_ENTITY_SUBLABEL}>Days</label>
                      <ShiftDayPicker
                        days={block.days}
                        onChange={(days) => {
                          const shifts = [...editShifts];
                          shifts[i] = { ...block, days };
                          setEditShifts(shifts);
                        }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditShifts([
                        ...editShifts,
                        { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 },
                      ])
                    }
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    <Plus size={14} /> Add block
                  </button>
                  <button type="button" onClick={saveStaffShifts} className={FINELY_OS_SUCCESS_BTN}>
                    <Save size={14} /> Save member shifts
                  </button>
                </div>
              </div>
            ) : null}
          </FinelyOsGlassPanel>
        ) : null}

        {tab === 'personas' ? (
          <FinelyOsGlassPanel icon={Bot} title="Behavior roles (AI personas)" accent="amber">
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4`}>
              Roles define tone, tools, and routing. Named staff members map to these roles for chat presentation.
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {personas.map((p) => (
                <div key={p.id} className={`${finelyOsInlineListItem()} p-4`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>{p.displayTitle ?? p.name}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5`}>{p.role}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2`}>
                    {listStaffByRole(p.id).length} roster member(s)
                  </div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2 line-clamp-3`}>{p.systemPrompt.slice(0, 180)}…</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {toolsForPersona(p.id).map((t) => (
                      <span key={t.id} className="text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-500/25 text-emerald-200/80">
                        {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FinelyOsGlassPanel>
        ) : null}

        {tab === 'routing' ? (
          <>
            <FinelyOsGlassPanel icon={Users} title="Default routing" accent="violet">
              <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Public chat default</label>
                  <select
                    value={cfg.publicDefaultPersonaId}
                    onChange={(e) => setCfg((c) => ({ ...c, publicDefaultPersonaId: e.target.value as AgentPersonaId }))}
                    className={FINELY_OS_ENTITY_SELECT}
                  >
                    {personas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayTitle ?? p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Portal hub default</label>
                  <select
                    value={cfg.portalDefaultPersonaId}
                    onChange={(e) => setCfg((c) => ({ ...c, portalDefaultPersonaId: e.target.value as AgentPersonaId }))}
                    className={FINELY_OS_ENTITY_SELECT}
                  >
                    {personas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayTitle ?? p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="button" onClick={save} className={`${FINELY_OS_SUCCESS_BTN} mt-4`}>
                <Save size={14} /> Save defaults
              </button>
            </FinelyOsGlassPanel>

            <FinelyOsGlassPanel icon={Clock} title="Role shift schedule" accent="sky">
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4`}>
                Persona-level blocks determine which behavior role is on duty when no named member shift matches.
              </p>
              <div className="space-y-3">
                {cfg.shifts.map((block, i) => (
                  <div key={i} className={`${finelyOsInlineListItem()} p-3 space-y-2`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-end">
                      <div>
                        <label className={FINELY_OS_ENTITY_SUBLABEL}>Role on duty</label>
                        <select
                          value={block.personaId}
                          onChange={(e) => {
                            const shifts = [...cfg.shifts];
                            shifts[i] = { ...block, personaId: e.target.value as AgentPersonaId };
                            setCfg((c) => ({ ...c, shifts }));
                          }}
                          className={FINELY_OS_ENTITY_SELECT}
                        >
                          {personas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.displayTitle ?? p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={FINELY_OS_ENTITY_SUBLABEL}>Start hour</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={block.startHour}
                          onChange={(e) => {
                            const shifts = [...cfg.shifts];
                            shifts[i] = { ...block, startHour: parseInt(e.target.value, 10) || 0 };
                            setCfg((c) => ({ ...c, shifts }));
                          }}
                          className={FINELY_OS_ENTITY_INPUT}
                        />
                      </div>
                      <div>
                        <label className={FINELY_OS_ENTITY_SUBLABEL}>End hour</label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={block.endHour}
                          onChange={(e) => {
                            const shifts = [...cfg.shifts];
                            shifts[i] = { ...block, endHour: parseInt(e.target.value, 10) || 0 };
                            setCfg((c) => ({ ...c, shifts }));
                          }}
                          className={FINELY_OS_ENTITY_INPUT}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCfg((c) => ({ ...c, shifts: c.shifts.filter((_, j) => j !== i) }))}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-rose-500/30 text-rose-200/90 hover:bg-rose-500/10"
                          title="Remove shift block"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={FINELY_OS_ENTITY_SUBLABEL}>Days</label>
                      <ShiftDayPicker
                        days={block.days}
                        onChange={(days) => {
                          const shifts = [...cfg.shifts];
                          shifts[i] = { ...block, days };
                          setCfg((c) => ({ ...c, shifts }));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={() =>
                    setCfg((c) => ({
                      ...c,
                      shifts: [
                        ...c.shifts,
                        {
                          personaId: c.publicDefaultPersonaId,
                          days: [1, 2, 3, 4, 5],
                          startHour: 9,
                          endHour: 17,
                        } satisfies PersonaShiftBlock,
                      ],
                    }))
                  }
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  <Plus size={14} /> Add shift block
                </button>
                <button type="button" onClick={save} className={FINELY_OS_PRIMARY_BTN}>
                  <Save size={14} /> Save shifts
                </button>
              </div>
            </FinelyOsGlassPanel>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
