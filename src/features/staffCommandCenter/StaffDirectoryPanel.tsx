import React, { useMemo, useState } from 'react';
import { CheckCircle2, Filter, Search, Users, Clapperboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentStudioUrlForStaff, isCreativeStaffId } from '../studioCommandOs/contentStudioHandoff';
import type { StaffDepartmentId } from './types';
import { STAFF_DEPARTMENTS } from './staffDirectory';
import { getStaffRoster, staffFullName } from './staffRoster';
import { setSelectedStaff } from './staffCommandRepo';
import { syncStaffSelectionToHumanOs } from './staffSelectionSync';
import { StaffAvatar, StaffStatusPill } from './StaffAvatar';
import { StaffKindBadge, isHumanStaffKind } from './StaffKindBadge';
import { formatStaffCommandDutyLine } from '../../lib/staffCommandShift';
import { StaffProfilePanel } from './StaffProfilePanel';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  staffCmdHighlightPanel,
  STAFF_CMD_PANEL,
  STAFF_CMD_TITLE,
  staffCmdCardBorder,
  staffCmdSelected,
} from './staffCommandUi';

export type StaffKindFilter = 'all' | 'ai_staff' | 'human';

export function StaffDirectoryPanel({
  selectedIds,
  onChanged,
  kindFilter = 'all',
  onKindFilterChange,
}: {
  selectedIds: string[];
  onChanged: () => void;
  kindFilter?: StaffKindFilter;
  onKindFilterChange?: (k: StaffKindFilter) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [departmentId, setDepartmentId] = useState<StaffDepartmentId | 'all'>('all');
  const [showFuture, setShowFuture] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [rosterVersion, setRosterVersion] = useState(0);

  const staff = useMemo(() => {
    const roster = getStaffRoster();
    const q = query.trim().toLowerCase();
    return roster.filter((x) => {
      if (!showFuture && isHumanStaffKind(x.kind)) return false;
      if (kindFilter === 'ai_staff' && x.kind !== 'ai_staff' && x.kind !== 'system_team') return false;
      if (kindFilter === 'human' && !isHumanStaffKind(x.kind)) return false;
      if (departmentId !== 'all' && x.departmentId !== departmentId) return false;
      if (!q) return true;
      return `${staffFullName(x)} ${x.codename} ${x.title} ${x.departmentId} ${x.tagline} ${x.personality.bio} ${x.responsibilities.join(' ')}`
        .toLowerCase()
        .includes(q);
    });
  }, [departmentId, kindFilter, query, showFuture, rosterVersion]);

  const profileStaff = profileId ? getStaffRoster().find((s) => s.id === profileId) ?? null : null;

  function toggleStaff(id: string) {
    const selected = selectedIds.includes(id);
    const next = selected ? selectedIds.filter((x) => x !== id) : [...selectedIds, id].slice(0, 3);
    setSelectedStaff(next.length ? next : [id]);
    syncStaffSelectionToHumanOs(next.length ? next : [id]);
    onChanged();
  }

  function refreshRoster() {
    setRosterVersion((v) => v + 1);
    onChanged();
  }

  return (
    <div className="space-y-6">
      <div className={STAFF_CMD_PANEL}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
              <Users size={16} /> Staff roster
            </div>
            <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>Company roster — AI operators & human team</h2>
            <p className={`mt-2 max-w-3xl text-sm ${STAFF_CMD_BODY}`}>
              <span className="text-violet-200 font-semibold">AI operators</span> run growth systems.{' '}
              <span className="text-rose-200 font-semibold">Human team</span> slots are real hires. Partner-facing humans live under the Partner team tab.
            </p>
          </div>
          <div className={`${staffCmdHighlightPanel()} p-3 text-xs`}>
            Selected: <span className="font-black">{selectedIds.length}/3</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 flex items-center gap-2">
            <Search size={16} className="text-white/35 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, title, department, personality…"
              className="w-full bg-transparent py-2 text-sm text-white/80 outline-none placeholder:text-white/30"
            />
          </div>
          {onKindFilterChange ? (
            <div className="flex flex-wrap gap-2">
              {(['all', 'ai_staff', 'human'] as StaffKindFilter[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onKindFilterChange(k)}
                  className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest ${staffCmdSelected(kindFilter === k)}`}
                >
                  {k === 'all' ? 'All company' : k === 'ai_staff' ? 'AI operators' : 'Human team'}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] rounded-2xl border border-white/10 bg-black/20 px-3 py-2 flex items-center gap-2">
              <Filter size={16} className="text-white/35 shrink-0" />
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value as StaffDepartmentId | 'all')}
                className="w-full bg-transparent py-2 text-sm text-white/80 outline-none"
              >
                <option value="all">All departments</option>
                {STAFF_DEPARTMENTS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2 flex items-center gap-3 text-sm text-white/70">
              <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
              Show future hires
            </label>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {staff.map((x) => {
            const selected = selectedIds.includes(x.id);
            const showingProfile = profileId === x.id;
            return (
              <div key={x.id} className="space-y-3">
                <div
                  className={`rounded-2xl border p-4 transition-all ${staffCmdCardBorder(x, selected)}`}
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <StaffAvatar staff={x} active={selected} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-xl font-bold text-white">{staffFullName(x)}</div>
                          <div className="mt-1 text-sm font-semibold text-violet-200/90">{x.title}</div>
                          <div className="mt-1 text-[11px] text-white/40">{x.departmentId.replace(/_/g, ' ')}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setProfileId(showingProfile ? null : x.id)}
                            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/[0.08]"
                          >
                            {showingProfile ? 'Close profile' : 'Edit profile'}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStaff(x.id)}
                            className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                              selected
                                ? 'border-violet-400/40 bg-violet-500/15 text-violet-100'
                                : 'border-white/10 bg-black/20 text-white/65 hover:border-violet-400/30'
                            }`}
                          >
                            {selected ? 'Selected' : 'Select for mission'}
                          </button>
                          {isCreativeStaffId(x.id) ? (
                            <button
                              type="button"
                              onClick={() => navigate(contentStudioUrlForStaff(x.id, x.id === 'shorts_factory' ? 'video' : 'intake'))}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/12 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-sky-100 hover:bg-sky-500/18"
                            >
                              <Clapperboard size={12} /> Content Studio
                            </button>
                          ) : null}
                          {selected ? <CheckCircle2 size={20} className="text-violet-300" /> : null}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <StaffStatusPill status={x.status} />
                        <StaffKindBadge kind={x.kind} />
                      </div>
                      <p className="mt-2 text-[10px] text-white/45 leading-snug">{formatStaffCommandDutyLine(x.shift)}</p>
                      <p className="mt-3 text-sm text-white/65">{x.personality.bio}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-[9px] uppercase tracking-widest text-white/35 font-black">Voice</div>
                          <div className="mt-1 text-xs text-white/60">{x.personality.voice}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <div className="text-[9px] uppercase tracking-widest text-white/35 font-black">Owns</div>
                          <div className="mt-1 text-xs text-white/60 line-clamp-2">{x.responsibilities.slice(0, 2).join(' • ')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {showingProfile && profileStaff ? (
                  <StaffProfilePanel staff={profileStaff} onSaved={refreshRoster} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
