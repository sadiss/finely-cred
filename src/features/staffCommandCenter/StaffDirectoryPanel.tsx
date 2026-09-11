import React, { useMemo, useState } from 'react';
import { CheckCircle2, Filter, Search, Users, Clapperboard, X } from 'lucide-react';
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
import { staffCmdSelected } from './staffCommandUi';

export type StaffKindFilter = 'all' | 'ai_staff' | 'human';

const ROSTER_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

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
    <div className="fc-wlp-staff-roster">
      <div className="fc-wlp-staff-roster-toolbar">
        <div className="fc-wlp-staff-roster-toolbar-copy">
          <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/55">
            <Users size={14} /> Company roster
          </div>
          <p className="mt-1 text-sm font-semibold text-white/70">
            Selected {selectedIds.length}/3 · open a card for the full profile
          </p>
        </div>
        <div className="fc-wlp-staff-roster-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, title, department…"
            aria-label="Search roster"
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
          <label className="fc-wlp-staff-roster-filter">
            <Filter size={14} />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value as StaffDepartmentId | 'all')}
            >
              <option value="all">All departments</option>
              {STAFF_DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="fc-wlp-staff-roster-check">
            <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
            Future hires
          </label>
        </div>
      </div>

      <div className="fc-wlp-staff-roster-grid">
        {staff.map((x, index) => {
          const selected = selectedIds.includes(x.id);
          const accent = ROSTER_ACCENTS[index % ROSTER_ACCENTS.length];
          return (
            <button
              key={x.id}
              type="button"
              className="fc-wlp-staff-roster-card"
              data-accent={accent}
              data-selected={selected ? 'true' : undefined}
              onClick={() => setProfileId(x.id)}
            >
              <StaffAvatar staff={x} active={selected} size="md" />
              <strong>{staffFullName(x)}</strong>
              <em>{x.title}</em>
              <div className="fc-wlp-staff-roster-card-meta">
                <StaffStatusPill status={x.status} />
                <StaffKindBadge kind={x.kind} />
              </div>
              <span>{formatStaffCommandDutyLine(x.shift)}</span>
            </button>
          );
        })}
      </div>

      {profileStaff ? (
        <div
          className="fc-wlp-local-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${staffFullName(profileStaff)} profile`}
          onClick={() => setProfileId(null)}
        >
          <div className="fc-wlp-local-modal fc-wlp-wide-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[11px] font-black uppercase tracking-widest text-emerald-300">Staff profile</p>
                <h3 className="m-0 mt-1 text-xl font-extrabold text-white">{staffFullName(profileStaff)}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleStaff(profileStaff.id)}
                  className="rounded-xl border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/80"
                >
                  {selectedIds.includes(profileStaff.id) ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={12} /> Selected
                    </span>
                  ) : (
                    'Select for mission'
                  )}
                </button>
                {isCreativeStaffId(profileStaff.id) ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(contentStudioUrlForStaff(profileStaff.id, profileStaff.id === 'shorts_factory' ? 'video' : 'intake'))
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/12 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-sky-100"
                  >
                    <Clapperboard size={12} /> Content Studio
                  </button>
                ) : null}
                <button
                  type="button"
                  className="fc-wlp-btn-secondary !py-1.5 !px-2.5 !text-xs"
                  onClick={() => setProfileId(null)}
                  aria-label="Close profile"
                >
                  <X size={14} /> Close
                </button>
              </div>
            </div>
            <StaffProfilePanel staff={profileStaff} onSaved={refreshRoster} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
