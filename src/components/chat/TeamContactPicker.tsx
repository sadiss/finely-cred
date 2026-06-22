import React, { useMemo, useState } from 'react';
import type { TeamContact } from '../../lib/teamContacts';
import { departmentLabel, listAllTeamContacts } from '../../lib/staffMessagingContacts';
import type { StaffDepartment } from '../../domain/staffMember';
import { FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

const DEPT_ORDER: StaffDepartment[] = [
  'credit_operations',
  'dispute_processing',
  'partner_success',
  'funding',
  'debt_resolution',
  'growth_sessions',
  'marketing',
  'internal_ops',
];

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  maxHeightClassName?: string;
  title?: string;
  hint?: string;
};

export function TeamContactPicker({ selectedIds, onChange, maxHeightClassName = 'max-h-44', title, hint }: Props) {
  const [dept, setDept] = useState<StaffDepartment | 'all'>('all');
  const [query, setQuery] = useState('');

  const contacts = useMemo(() => listAllTeamContacts(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (dept !== 'all' && c.department !== dept) return false;
      if (!q) return true;
      const hay = `${c.name} ${c.title ?? ''} ${c.department ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, dept, query]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  const deptsPresent = useMemo(() => {
    const set = new Set<StaffDepartment>();
    contacts.forEach((c) => {
      if (c.department) set.add(c.department);
    });
    return DEPT_ORDER.filter((d) => set.has(d));
  }, [contacts]);

  return (
    <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 p-3 space-y-2">
      <div>
        <p className="text-[9px] uppercase tracking-widest text-sky-200/85 font-black">
          {title ?? 'Choose who to message'}
        </p>
        {hint ? <p className="mt-1 text-[11px] text-white/55">{hint}</p> : null}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search staff, role, department…"
        className="w-full bg-fc-input border border-white/[0.08] rounded-lg px-2 py-1.5 text-white text-xs placeholder:text-white/30"
      />

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setDept('all')}
          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
            dept === 'all' ? 'border-sky-400/50 bg-sky-500/20 text-sky-100' : 'border-white/10 text-white/45'
          }`}
        >
          All team
        </button>
        {deptsPresent.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDept(d)}
            className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
              dept === d ? 'border-sky-400/50 bg-sky-500/20 text-sky-100' : 'border-white/10 text-white/45'
            }`}
          >
            {departmentLabel(d)}
          </button>
        ))}
      </div>

      <div className={`overflow-y-auto flex flex-wrap gap-2 ${maxHeightClassName}`}>
        {filtered.length === 0 ? (
          <p className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case`}>No matches — try another department or search.</p>
        ) : (
          filtered.map((c: TeamContact) => {
            const on = selectedIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] transition-all text-left max-w-full ${
                  on
                    ? 'border-sky-500/45 bg-sky-500/18 text-sky-50 ring-1 ring-sky-400/30'
                    : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:text-white/85 hover:border-white/20'
                }`}
                title={c.title}
              >
                <span>{c.emoji}</span>
                <span className="truncate max-w-[140px]">{c.name}</span>
              </button>
            );
          })
        )}
      </div>

      {selectedIds.length > 0 ? (
        <p className="text-[10px] text-sky-200/80">
          {selectedIds.length} selected — {selectedIds.length === 1 ? 'direct thread' : 'group thread'}
        </p>
      ) : null}
    </div>
  );
}
