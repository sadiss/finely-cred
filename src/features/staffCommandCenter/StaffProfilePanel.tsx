import React, { useState } from 'react';
import { Save, UserCircle2 } from 'lucide-react';
import type { StaffMember } from './types';
import { StaffAvatar, StaffStatusPill } from './StaffAvatar';
import { updateStaffProfileOverride } from './staffProfileRepo';
import { refreshStaffRoster, staffFullName } from './staffRoster';
import { STAFF_CMD_BODY, STAFF_CMD_EYEBROW, STAFF_CMD_PANEL, STAFF_CMD_TITLE } from './staffCommandUi';

const PERSONALITY_FIELDS = [
  { key: 'bio', label: 'Profile bio', rows: 3 },
  { key: 'voice', label: 'Voice', rows: 2 },
  { key: 'cadence', label: 'Cadence', rows: 2 },
  { key: 'humor', label: 'Humor', rows: 2 },
  { key: 'conflictStyle', label: 'Conflict style', rows: 2 },
  { key: 'decisionStyle', label: 'Decision style', rows: 2 },
] as const;

type Props = {
  staff: StaffMember;
  onSaved?: () => void;
};

export function StaffProfilePanel({ staff, onSaved }: Props) {
  const [draft, setDraft] = useState(staff.personality);
  const [title, setTitle] = useState(staff.title);
  const [firstName, setFirstName] = useState(staff.firstName);
  const [lastName, setLastName] = useState(staff.lastName);
  const [notice, setNotice] = useState<string | null>(null);

  function save() {
    updateStaffProfileOverride(staff.id, {
      firstName,
      lastName,
      title,
      personality: draft,
    });
    refreshStaffRoster();
    setNotice('Profile saved — roster updated.');
    onSaved?.();
  }

  return (
    <div className={`${STAFF_CMD_PANEL} space-y-5`}>
      <div className="flex flex-wrap items-start gap-5">
        <StaffAvatar staff={staff} size="xl" active />
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
            <UserCircle2 size={16} /> Staff profile
          </div>
          <h2 className={STAFF_CMD_TITLE}>{staffFullName(staff)}</h2>
          <p className={`text-sm ${STAFF_CMD_BODY}`}>
            Codename <span className="text-violet-200 font-semibold">{staff.codename}</span> · {staff.departmentId.replace(/_/g, ' ')}
          </p>
          <div className="flex flex-wrap gap-2">
            <StaffStatusPill status={staff.status} />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/55">
              {staff.kind.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      {notice ? (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">First name</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/90"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Last name</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/90"
          />
        </label>
        <label className="block space-y-1 md:col-span-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/90"
          />
        </label>
      </div>

      <div className="space-y-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Personality & voice</div>
        {PERSONALITY_FIELDS.map((field) => (
          <label key={field.key} className="block space-y-1">
            <span className="text-xs font-semibold text-white/70">{field.label}</span>
            <textarea
              rows={field.rows}
              value={draft[field.key]}
              onChange={(e) => setDraft((cur) => ({ ...cur, [field.key]: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white/85 resize-y"
            />
          </label>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Responsibilities</div>
        <ul className="mt-2 space-y-1 text-sm text-white/65 list-disc pl-5">
          {staff.responsibilities.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      <button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white hover:brightness-110">
        <Save size={14} /> Save profile
      </button>
    </div>
  );
}
