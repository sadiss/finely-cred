import React from 'react';
import { Building2, Crown } from 'lucide-react';
import { STAFF_DEPARTMENTS } from './staffDirectory';
import { getStaffRoster, listDepartmentStaff, staffFullName } from './staffRoster';
import { StaffAvatar, StaffStatusPill } from './StaffAvatar';
import { StaffKindBadge } from './StaffKindBadge';
import { STAFF_CMD_BODY, STAFF_CMD_EYEBROW, STAFF_CMD_HERO, STAFF_CMD_PANEL, STAFF_CMD_TITLE, staffCmdCardBorder } from './staffCommandUi';

export function StaffOrgChartPanel({ onSelectDepartment }: { onSelectDepartment?: (id: string) => void }) {
  const roster = getStaffRoster();
  const executives = roster.filter((x) =>
    ['professor_apex', 'cmo_prime', 'pipeline_titan', 'switchboard', 'velvet_hammer'].includes(x.id),
  );

  return (
    <div className={STAFF_CMD_PANEL}>
      <div>
        <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW}`}>
          <Building2 size={16} /> Staff hierarchy
        </div>
        <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>One company floor — departments stack vertically</h2>
        <p className={`mt-2 max-w-4xl text-sm ${STAFF_CMD_BODY}`}>
          Lead Intel is a department inside Staff Command. Lead Research, overnight discovery, Lead Discovery, and Switchboard own lead search tools — not a separate mystery agent list.
        </p>
      </div>

      <div className={`${STAFF_CMD_HERO} space-y-3`}>
        <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Executive layer</div>
        {executives.map((x) => (
          <div key={x.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${staffCmdCardBorder(x, false)}`}>
            <StaffAvatar staff={x} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Crown size={13} className="text-violet-300 shrink-0" />
                <div className="text-white font-bold">{staffFullName(x)}</div>
                <StaffKindBadge kind={x.kind} compact />
              </div>
              <div className="text-sm text-violet-200/80">{x.title}</div>
              <div className="text-[11px] text-white/40">{x.departmentId.replace(/_/g, ' ')}</div>
            </div>
            <StaffStatusPill status={x.status} />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Departments</div>
        {STAFF_DEPARTMENTS.map((dept) => {
          const members = listDepartmentStaff(dept.id);
          const owner = roster.find((s) => s.id === dept.primaryOwnerId);
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => onSelectDepartment?.(dept.id)}
              className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-violet-400/30 transition-all"
            >
              <div className="flex flex-wrap items-start gap-4">
                {owner ? <StaffAvatar staff={owner} size="md" /> : null}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">{dept.shortName}</div>
                  <div className="mt-1 text-white font-bold text-lg">{dept.name}</div>
                  <p className="mt-2 text-sm text-white/55">{dept.description}</p>
                  {owner ? (
                    <p className="mt-2 text-xs text-violet-200/70">
                      Owner: {staffFullName(owner)} · {owner.title}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {members.slice(0, 6).map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] text-white/60"
                  >
                    {staffFullName(m)}
                  </span>
                ))}
                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white/50">
                  {members.length} staff
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {dept.workProducts.slice(0, 4).map((w) => (
                  <div key={w} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-white/60">
                    {w}
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
