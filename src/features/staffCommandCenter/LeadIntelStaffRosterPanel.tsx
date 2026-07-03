import React from 'react';
import { ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStaffRoster, leadIntelStaffIds, staffFullName } from './staffRoster';
import { StaffAvatar, StaffStatusPill } from './StaffAvatar';
import { StaffKindBadge } from './StaffKindBadge';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  STAFF_CMD_HERO,
  STAFF_CMD_PRIMARY_BTN,
  STAFF_CMD_SECONDARY_BTN,
  STAFF_CMD_TITLE,
  staffCmdCardBorder,
} from './staffCommandUi';

/** Lead Intel operators pulled from the canonical Staff Command Center roster — not a duplicate agent list. */
export function LeadIntelStaffRosterPanel({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const roster = leadIntelStaffIds()
    .map((id) => getStaffRoster().find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className={`${STAFF_CMD_HERO} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
            <Users size={16} /> Lead Intel staff (from Command Center)
          </div>
          <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>
            {compact ? 'Your swarm operators' : 'One roster — Lead Intel pulls from Staff Command Center'}
          </h2>
          <p className={`mt-2 text-sm ${STAFF_CMD_BODY}`}>
            Deep Swarm is the system process. These named staff own discovery, pipeline, overnight runs, geo routing,
            automation queues, and compliance gates. Edit their profiles in Staff Command Center → Roster.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/admin/staff?view=roster')} className={STAFF_CMD_SECONDARY_BTN}>
            Edit roster
          </button>
          {!compact ? (
            <button type="button" onClick={() => navigate('/admin/staff')} className={STAFF_CMD_PRIMARY_BTN}>
              Staff Command Center <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {roster.map((s) => (
          <div
            key={s.id}
            className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${staffCmdCardBorder(s, false)}`}
          >
            <StaffAvatar staff={s} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-bold text-white">{staffFullName(s)}</div>
                <StaffKindBadge kind={s.kind} compact />
              </div>
              <div className="text-sm font-semibold text-violet-200/90">{s.title}</div>
              <div className="mt-1 text-[11px] text-white/40">Codename: {s.codename}</div>
              <p className="mt-2 text-sm text-white/60 line-clamp-2">{s.personality.bio}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StaffStatusPill status={s.status} />
              <span className="text-[10px] text-white/35 uppercase tracking-widest font-black">{s.workMode.replace(/_/g, ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** @deprecated use LeadIntelStaffRosterPanel */
export const LeadIntelStaffOwnershipPanel = LeadIntelStaffRosterPanel;
