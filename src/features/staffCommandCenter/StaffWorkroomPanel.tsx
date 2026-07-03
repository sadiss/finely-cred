import React from 'react';
import { Activity, ExternalLink, Zap } from 'lucide-react';
import type { StaffMissionPlan } from './types';
import { StaffAvatar } from './StaffAvatar';
import { isStaffMemberHydrated, staffFullName } from './staffRoster';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  STAFF_CMD_PANEL,
  STAFF_CMD_SECONDARY_BTN,
  STAFF_CMD_TITLE,
} from './staffCommandUi';

export function StaffWorkroomPanel({ missions }: { missions: StaffMissionPlan[] }) {
  const safeMissions = missions.filter((m) => isStaffMemberHydrated(m.leadOwner));
  return (
    <div className={STAFF_CMD_PANEL}>
      <div>
        <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
          <Activity size={16} /> Staff Workroom
        </div>
        <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>Current missions and handoffs</h2>
        <p className={`mt-2 max-w-3xl text-sm ${STAFF_CMD_BODY}`}>
          Every run has an owner, a department, first steps, and a handoff checklist.
        </p>
      </div>

      {safeMissions.length === 0 ? (
        <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center ${STAFF_CMD_BODY}`}>
          No staff missions yet. Create one from Mission Builder.
        </div>
      ) : (
        <div className="space-y-4">
          {safeMissions.map((m) => (
            <div key={m.request.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <StaffAvatar staff={m.leadOwner} size="lg" />
                  <div>
                    <div className="text-white font-bold text-xl">{m.request.title}</div>
                    <div className="mt-1 text-sm text-violet-200/80">
                      Lead owner: {staffFullName(m.leadOwner)} • {m.systemOwnerLabel}
                    </div>
                    <p className={`mt-2 max-w-3xl text-sm ${STAFF_CMD_BODY}`}>{m.request.objective}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/55">
                  {m.executionLane.replace(/_/g, ' ')}
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="inline-flex items-center gap-2 text-white font-bold text-sm">
                    <Zap size={14} className="text-emerald-300" /> First steps
                  </div>
                  <div className="mt-3 space-y-2">
                    {m.firstThreeSteps.map((s) => (
                      <div key={s} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65">
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-white font-bold text-sm">Support staff</div>
                  <div className="mt-3 space-y-2">
                    {m.supportStaff.filter(isStaffMemberHydrated).map((s) => (
                      <div key={s.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2">
                        <StaffAvatar staff={s} size="sm" />
                        <span className="text-sm text-white/70">{staffFullName(s)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-white font-bold text-sm">Handoff checklist</div>
                  <div className="mt-3 space-y-2">
                    {m.handoffChecklist.map((s) => (
                      <div key={s} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65">
                        ✓ {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {m.blockedUntil ? (
                <div className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-rose-100">
                  Blocked until: {m.blockedUntil}
                </div>
              ) : null}
              <button type="button" className={`mt-4 ${STAFF_CMD_SECONDARY_BTN}`}>
                {m.suggestedNextButton} <ExternalLink size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
