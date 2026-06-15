import React, { useMemo, useState } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';
import type { StaffDepartment, StaffMember } from '../../domain/staffMember';
import { staffMemberFullName } from '../../domain/staffMember';
import { getAgentPersona } from '../../domain/agentPersonas';
import { listAllMessageableStaff } from '../../data/staffRoster';
import { departmentLabel } from '../../lib/staffMessagingContacts';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export type StaffDirectoryAction = 'ai' | 'team';

type Props = {
  lane?: string;
  /** Highlighted staff member id */
  selectedId?: string | null;
  onSelect: (staff: StaffMember, action: StaffDirectoryAction) => void;
  compact?: boolean;
  /** Show both AI chat and direct team message buttons */
  showTeamAction?: boolean;
  /** Optional pre-filter */
  department?: StaffDepartment | 'all';
  className?: string;
};

const DEPT_ORDER: StaffDepartment[] = [
  'growth_sessions',
  'marketing',
  'partner_success',
  'credit_operations',
  'dispute_processing',
  'funding',
  'debt_resolution',
  'internal_ops',
];

export function StaffDirectoryGrid({
  lane,
  selectedId,
  onSelect,
  compact,
  showTeamAction = true,
  department = 'all',
  className = '',
}: Props) {
  const [deptFilter, setDeptFilter] = useState<StaffDepartment | 'all'>(department);
  const [query, setQuery] = useState('');

  const roster = useMemo(() => listAllMessageableStaff(lane), [lane]);

  const departments = useMemo(() => {
    const set = new Set<StaffDepartment>();
    for (const m of roster) set.add(m.department);
    return DEPT_ORDER.filter((d) => set.has(d));
  }, [roster]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roster.filter((m) => {
      if (deptFilter !== 'all' && m.department !== deptFilter) return false;
      if (!q) return true;
      const persona = getAgentPersona(m.primaryRoleId);
      const hay = [
        staffMemberFullName(m),
        m.bioLine,
        persona?.displayTitle,
        persona?.role,
        departmentLabel(m.department),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [roster, deptFilter, query]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setDeptFilter('all')}
          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
            deptFilter === 'all'
              ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-100'
              : FINELY_OS_ENTITY_CHIP
          }`}
        >
          All staff
        </button>
        {departments.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDeptFilter(d)}
            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
              deptFilter === d
                ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-100'
                : FINELY_OS_ENTITY_CHIP
            }`}
          >
            {departmentLabel(d)}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search staff by name or role…"
        className="w-full bg-fc-input border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/30"
      />

      <div
        className={`grid gap-2 overflow-y-auto ${
          compact ? 'grid-cols-2 max-h-40' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-h-[280px]'
        }`}
      >
        {filtered.length === 0 ? (
          <p className={`col-span-full text-xs ${FINELY_OS_ENTITY_BODY} py-4 text-center`}>No staff match your filters.</p>
        ) : (
          filtered.map((member) => {
            const persona = getAgentPersona(member.primaryRoleId);
            const title = member.displayTitle ?? persona?.displayTitle ?? persona?.role ?? member.bioLine;
            const selected = selectedId === member.id;
            return (
              <div
                key={member.id}
                className={`${finelyOsCatalogCard('emerald')} !p-3 flex flex-col gap-2 ${
                  selected ? 'ring-1 ring-emerald-400/50' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <StaffPortraitImg staff={member} className="w-10 h-10 rounded-full border border-emerald-400/25 shrink-0" />
                  <div className="min-w-0">
                    <div className={`${FINELY_OS_ENTITY_VALUE} text-xs truncate`}>{member.firstName}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[9px] truncate`}>{title}</div>
                  </div>
                </div>
                <p className={`${FINELY_OS_ENTITY_BODY} text-[10px] line-clamp-2 min-h-[2rem]`}>{member.bioLine}</p>
                <div className="flex flex-wrap gap-1 mt-auto">
                  <button
                    type="button"
                    onClick={() => onSelect(member, 'ai')}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[9px] font-black uppercase text-emerald-100 hover:bg-emerald-500/20"
                    title={`Chat with ${staffMemberFullName(member)}`}
                  >
                    <Sparkles size={10} /> AI
                  </button>
                  {showTeamAction ? (
                    <button
                      type="button"
                      onClick={() => onSelect(member, 'team')}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-[9px] font-black uppercase text-sky-100 hover:bg-sky-500/20"
                      title={`Direct message ${staffMemberFullName(member)}`}
                    >
                      <MessageCircle size={10} /> DM
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
