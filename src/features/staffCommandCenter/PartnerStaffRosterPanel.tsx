import React, { useMemo, useState } from 'react';
import { Bot, Clock, Plus, Save, Trash2, UserCircle2, UserRound, Users } from 'lucide-react';
import {
  loadAgentStaffConfig,
  listAllPersonas,
  saveAgentStaffConfig,
  type AgentStaffConfig,
} from '../../data/agentPersonasRepo';
import type { AgentPersonaId } from '../../domain/agentPersonas';
import { getAgentPersona } from '../../domain/agentPersonas';
import { personaOnDutyAt } from '../../data/agentPersonasRepo';
import { FinelyOsGlassPanel } from '../os/FinelyOsGlassPanel';
import { FinelyOsOverviewStatTile } from '../os/FinelyOsOverviewStatTile';
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
} from '../os/finelyOsLightUi';
import {
  listStaffByRole,
  loadStaffRoster,
  listRoleCoverageGaps,
  listStaffOnDutyNow,
  resolveStaffOnDuty,
  updateStaffMemberShifts,
} from '../../data/staffRoster';
import { staffMemberFullName, type StaffMember, type StaffShiftBlock } from '../../domain/staffMember';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';
import { syncStaffRosterToSupabase } from '../../data/staffSupabaseSync';
import { AdminAgentPersonaEditor } from '../../components/admin/AdminAgentPersonaEditor';
import { STAFF_CMD_BODY, STAFF_CMD_EYEBROW, STAFF_CMD_PANEL, STAFF_CMD_TITLE } from './staffCommandUi';

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
              on ? 'bg-amber-500/25 border-amber-400/40 text-amber-100' : FINELY_OS_ENTITY_CHIP
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

/** Human partner-facing specialists — portal chat, disputes, funding (unified under Staff Command Center). */
export function PartnerStaffRosterPanel() {
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

  const tabBtn = (id: Tab, label: string) => (
    <button type="button" onClick={() => setTab(id)} className={finelyOsViewTab(tab === id, 'amber')}>
      {label}
    </button>
  );

  return (
    <div className={`${STAFF_CMD_PANEL} space-y-5`}>
      <div>
        <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW} text-amber-300`}>
          <UserRound size={16} /> Human · partner-facing
        </div>
        <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>Portal & chat specialists</h2>
        <p className={`mt-2 max-w-3xl text-sm ${STAFF_CMD_BODY}`}>
          Real named humans clients see in chat and the partner portal — shifts, roles, and routing. Separate from AI growth operators on the company roster.
        </p>
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
      ) : null}

      <div className={FINELY_OS_VIEW_TABS}>
        {tabBtn('on_duty', 'On duty now')}
        {tabBtn('roster', 'Human roster')}
        {tabBtn('personas', 'AI behavior roles')}
        {tabBtn('routing', 'Routing & shifts')}
      </div>

      {tab === 'on_duty' ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FinelyOsOverviewStatTile icon={Clock} label="On shift" value={onDutyNow.length} accent="amber" hint="Human roster in shift" />
            <FinelyOsOverviewStatTile icon={Users} label="Roles" value={COVERAGE_ROLE_IDS.length} accent="violet" hint="Coverage monitored" />
            <FinelyOsOverviewStatTile icon={Bot} label="Gaps" value={coverageGaps.length} accent="rose" hint="Off shift or empty" />
            <FinelyOsOverviewStatTile icon={UserCircle2} label="Roster" value={roster.filter((s) => s.active).length} accent="sky" hint="Active humans" />
          </div>
          <FinelyOsGlassPanel icon={Clock} title="Primary on duty" accent="amber">
            <div className="flex flex-wrap items-center gap-4">
              {onDutyStaff ? (
                <StaffPortraitImg staff={onDutyStaff} className="w-16 h-16 rounded-2xl border-2 border-amber-400/40" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 grid place-items-center">
                  <UserCircle2 className="text-amber-300" size={28} />
                </div>
              )}
              <div>
                <div className="text-lg font-bold text-white">{onDutyStaff ? staffMemberFullName(onDutyStaff) : onDutyPersona.name}</div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  {onDutyPersona.displayTitle ?? onDutyPersona.role}
                  {onDutyStaff ? ` · ${onDutyStaff.department.replace(/_/g, ' ')}` : ''}
                </div>
              </div>
            </div>
          </FinelyOsGlassPanel>
          <FinelyOsGlassPanel icon={Users} title="On shift now" accent="violet">
            <div className="space-y-3">
              {onDutyNow.length === 0 ? (
                <p className={FINELY_OS_ENTITY_BODY}>No roster members match current shift blocks.</p>
              ) : (
                onDutyNow.map((s) => {
                  const role = personas.find((p) => p.id === s.primaryRoleId);
                  return (
                    <div key={s.id} className={`${finelyOsInlineListItem()} flex items-center gap-4 p-4`}>
                      <StaffPortraitImg staff={s} className="w-12 h-12 rounded-2xl border border-amber-400/25" />
                      <div className="min-w-0">
                        <div className="font-semibold text-white">{staffMemberFullName(s)}</div>
                        <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{role?.displayTitle ?? s.primaryRoleId}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </FinelyOsGlassPanel>
          {coverageGaps.length ? (
            <FinelyOsGlassPanel icon={Bot} title="Coverage gaps" accent="amber">
              <ul className="space-y-2 text-sm text-amber-200/90">
                {coverageGaps.map((g) => {
                  const roleId = g.split(':')[0] as AgentPersonaId;
                  const label = getAgentPersona(roleId)?.displayTitle ?? roleId;
                  return <li key={g}>{label} — {g.includes('no roster') ? 'add roster members' : 'no one on shift'}</li>;
                })}
              </ul>
            </FinelyOsGlassPanel>
          ) : null}
        </div>
      ) : null}

      {tab === 'roster' ? (
        <FinelyOsGlassPanel icon={Users} title="Human team roster" accent="amber">
          <div className="mb-4">
            <label className={FINELY_OS_ENTITY_SUBLABEL}>Filter by role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as AgentPersonaId | 'all')}
              className={`${FINELY_OS_ENTITY_SELECT} mt-1 max-w-md`}
            >
              <option value="all">All roles ({roster.filter((s) => s.active).length})</option>
              {personas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayTitle ?? p.name} ({listStaffByRole(p.id).length})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {filteredRoster.map((s) => {
              const persona = personas.find((p) => p.id === s.primaryRoleId);
              const isOnDuty = onDutyStaff?.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaffId(s.id);
                    setEditShifts(s.shiftBlocks.map((b) => ({ ...b, days: [...b.days] })));
                  }}
                  className={`w-full text-left ${finelyOsListItem(isOnDuty || selectedStaffId === s.id, isOnDuty ? 'emerald' : 'amber')} p-4`}
                >
                  <div className="flex items-start gap-4">
                    <StaffPortraitImg staff={s} className="w-14 h-14 rounded-2xl border border-amber-400/25" />
                    <div className="min-w-0 flex-1">
                      <div className={`${FINELY_OS_ENTITY_VALUE}`}>{staffMemberFullName(s)}</div>
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5`}>{persona?.displayTitle ?? persona?.name ?? s.primaryRoleId}</div>
                      <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2`}>{s.bioLine}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedStaff ? (
            <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
              <div className="font-semibold text-white">{staffMemberFullName(selectedStaff)} — shift editor</div>
              {editShifts.map((block, i) => (
                <div key={i} className={`${finelyOsInlineListItem()} p-3 space-y-2`}>
                  <div className="flex flex-wrap gap-3">
                    <div>
                      <label className={FINELY_OS_ENTITY_SUBLABEL}>Start</label>
                      <input type="number" min={0} max={23} value={block.startHour} onChange={(e) => {
                        const shifts = [...editShifts];
                        shifts[i] = { ...block, startHour: parseInt(e.target.value, 10) || 0 };
                        setEditShifts(shifts);
                      }} className={FINELY_OS_ENTITY_INPUT} />
                    </div>
                    <div>
                      <label className={FINELY_OS_ENTITY_SUBLABEL}>End</label>
                      <input type="number" min={0} max={23} value={block.endHour} onChange={(e) => {
                        const shifts = [...editShifts];
                        shifts[i] = { ...block, endHour: parseInt(e.target.value, 10) || 0 };
                        setEditShifts(shifts);
                      }} className={FINELY_OS_ENTITY_INPUT} />
                    </div>
                  </div>
                  <ShiftDayPicker days={block.days} onChange={(days) => {
                    const shifts = [...editShifts];
                    shifts[i] = { ...block, days };
                    setEditShifts(shifts);
                  }} />
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditShifts([...editShifts, { days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17 }])} className={FINELY_OS_SECONDARY_BTN}>
                  <Plus size={14} /> Add block
                </button>
                <button type="button" onClick={() => {
                  if (!selectedStaffId) return;
                  updateStaffMemberShifts(selectedStaffId, editShifts);
                  void syncStaffRosterToSupabase();
                  setNotice('Shift schedule saved.');
                  setSelectedStaffId(null);
                }} className={FINELY_OS_SUCCESS_BTN}>
                  <Save size={14} /> Save shifts
                </button>
              </div>
            </div>
          ) : null}
        </FinelyOsGlassPanel>
      ) : null}

      {tab === 'personas' ? (
        <div className="space-y-5">
          <AdminAgentPersonaEditor />
          <FinelyOsGlassPanel icon={Bot} title="AI behavior roles (behind the humans)" accent="violet">
            <p className={`${FINELY_OS_ENTITY_BODY} text-sm mb-4`}>Roles define tone and tools. Human roster members map to these for chat presentation.</p>
            <div className="space-y-3">
              {personas.map((p) => (
                <div key={p.id} className={`${finelyOsInlineListItem()} p-4`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>{p.displayTitle ?? p.name}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-2`}>{listStaffByRole(p.id).length} human roster member(s)</div>
                </div>
              ))}
            </div>
          </FinelyOsGlassPanel>
        </div>
      ) : null}

      {tab === 'routing' ? (
        <div className="space-y-5">
          <FinelyOsGlassPanel icon={Users} title="Default routing" accent="violet">
            <div className="space-y-4 max-w-lg">
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Public chat default</label>
                <select value={cfg.publicDefaultPersonaId} onChange={(e) => setCfg((c) => ({ ...c, publicDefaultPersonaId: e.target.value as AgentPersonaId }))} className={FINELY_OS_ENTITY_SELECT}>
                  {personas.map((p) => <option key={p.id} value={p.id}>{p.displayTitle ?? p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Portal hub default</label>
                <select value={cfg.portalDefaultPersonaId} onChange={(e) => setCfg((c) => ({ ...c, portalDefaultPersonaId: e.target.value as AgentPersonaId }))} className={FINELY_OS_ENTITY_SELECT}>
                  {personas.map((p) => <option key={p.id} value={p.id}>{p.displayTitle ?? p.name}</option>)}
                </select>
              </div>
            </div>
            <button type="button" onClick={() => { saveAgentStaffConfig(cfg); setNotice('Routing defaults saved.'); }} className={`${FINELY_OS_SUCCESS_BTN} mt-4`}>
              <Save size={14} /> Save defaults
            </button>
          </FinelyOsGlassPanel>
        </div>
      ) : null}
    </div>
  );
}
