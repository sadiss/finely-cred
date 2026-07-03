import React from 'react';
import { MapPinned } from 'lucide-react';
import { getHumanStaffAgent } from './humanStaffDirectory';
import { humanStaffDisplayName } from './humanStaffRosterBridge';
import { HumanStaffAvatar } from './HumanStaffAvatar';
import {
  STAFF_CMD_BODY,
  STAFF_CMD_EYEBROW,
  STAFF_CMD_KPI,
  STAFF_CMD_PANEL,
  STAFF_CMD_TITLE,
  staffCmdRecommendPanel,
} from './humanStaffOsUi';

const cityBoards = [
  { id: 'dallas', city: 'Dallas', state: 'TX', readiness: 82, owners: ['geo_commander', 'scout_supreme', 'appointment_architect'], focus: ['business credit', 'funding readiness', 'credit specialist recruiting'], blockers: ['needs 2 more local proof blocks', 'retarget pixel not verified'], next: 'Publish city guide and route business owner leads to appointment flow.' },
  { id: 'houston', city: 'Houston', state: 'TX', readiness: 74, owners: ['geo_commander', 'local_news_radar', 'pipeline_titan'], focus: ['business funding', 'affiliate partners', 'AU sellers'], blockers: ['source mix thin on partner referrals'], next: 'Run partner recruiting sprint and create local source board.' },
  { id: 'atlanta', city: 'Atlanta', state: 'GA', readiness: 69, owners: ['cmo_prime', 'goldframe', 'liora_lifecycle'], focus: ['agency partners', 'credit repair guide', 'events'], blockers: ['lead magnet page needs premium rebuild'], next: 'Assign Goldframe to page upgrade and Liora to nurture.' },
  { id: 'phoenix', city: 'Phoenix', state: 'AZ', readiness: 61, owners: ['scout_supreme', 'night_owl_intel', 'analytics_beast'], focus: ['credit specialist recruiting', 'business credit'], blockers: ['need more local queries', 'no city-specific content'], next: 'Expand query pool and generate 10 local content hooks.' },
  { id: 'charlotte', city: 'Charlotte', state: 'NC', readiness: 58, owners: ['pr_sentinel', 'local_news_radar', 'partner_recruiter'], focus: ['PR authority', 'partner recruiting', 'funding readiness'], blockers: ['PR list not built', 'tracking links missing'], next: 'Build authority outreach list and partner route.' },
];

export function HumanStaffGeoOpsPanel() {
  return (
    <div className={STAFF_CMD_PANEL}>
      <div>
        <div className={`inline-flex items-center gap-2 ${STAFF_CMD_EYEBROW} text-sky-300`}>
          <MapPinned size={18} />
          <span>Geo war room</span>
        </div>
        <h2 className={`mt-2 ${STAFF_CMD_TITLE}`}>Every city board — staffed and actionable.</h2>
        <p className={`mt-2 text-sm ${STAFF_CMD_BODY} max-w-3xl`}>
          City readiness, assigned staff, focus funnels, blockers, and next moves — no orphan city names.
        </p>
      </div>
      <div className="space-y-4">
        {cityBoards.map((board) => (
          <div key={board.id} className={`${STAFF_CMD_KPI} p-4`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xl font-bold text-white">
                  {board.city}, {board.state}
                </div>
                <div className="mt-1 text-xs text-white/40">Readiness {board.readiness}%</div>
              </div>
              <div className="h-12 w-12 rounded-xl border border-sky-500/25 bg-sky-500/10 grid place-items-center text-base font-black text-sky-100">
                {board.readiness}
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400" style={{ width: `${board.readiness}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {board.owners.map((id) => {
                const agent = getHumanStaffAgent(id as Parameters<typeof getHumanStaffAgent>[0]);
                return (
                  <div key={id} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-2 py-1.5">
                    <HumanStaffAvatar agent={agent} size="sm" />
                    <span className="text-[11px] font-semibold text-white/70">{humanStaffDisplayName(agent)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Focus</div>
                <ul className={`mt-1 space-y-0.5 text-xs ${STAFF_CMD_BODY} list-disc pl-4`}>
                  {board.focus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-widest text-white/35 font-black">Blockers</div>
                <ul className={`mt-1 space-y-0.5 text-xs ${STAFF_CMD_BODY} list-disc pl-4`}>
                  {board.blockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={`mt-3 ${staffCmdRecommendPanel()} p-3 text-sm`}>
              <span className="font-bold">Next:</span> {board.next}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
