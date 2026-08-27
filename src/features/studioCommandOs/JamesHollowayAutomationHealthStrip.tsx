import React, { useMemo } from 'react';
import { Activity, AlertTriangle, Bot, Plug, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listAutomationRules } from '../../data/automationStudioRepo';
import { AUTOMATION_TRIGGER_CATALOG } from '../automation/automationTriggerCatalog';
import { findStaff, staffFullName } from '../staffCommandCenter/staffRoster';
import { StaffPortraitImg } from '../../components/staff/StaffPortraitImg';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

export function JamesHollowayAutomationHealthStrip() {
  const navigate = useNavigate();
  const james = findStaff('james_holloway');
  const rules = useMemo(() => listAutomationRules(), []);
  const liveTriggers = AUTOMATION_TRIGGER_CATALOG.filter((t) => t.tier === 'live').length;
  const enabled = rules.filter((r) => r.enabled).length;
  const blocked = rules.filter((r) => !r.enabled).length;
  const healthScore = Math.min(100, Math.round((enabled / Math.max(rules.length, 1)) * 60 + (liveTriggers / 20) * 40));

  return (
    <div className="rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 via-black/40 to-black/60 p-5">
      <div className="flex flex-wrap items-start gap-4">
        {james ? (
          <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-sky-400/30 shrink-0">
            <StaffPortraitImg
              staff={{
                id: james.id,
                firstName: james.firstName,
                lastName: james.lastName,
                portraitGender: james.portrait?.portraitGender ?? 'masculine',
                avatarPath: `staff-portrait://${james.id}`,
              }}
              className="h-full w-full"
              alt={staffFullName(james)}
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-sky-300/80">VP Technology & Automation</div>
          <div className="text-lg font-black text-white">{james ? staffFullName(james) : 'James Holloway'}</div>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Integration health, trigger wiring, and honest automation status — no silent failures.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{healthScore}%</div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">Ops health</div>
        </div>
      </div>
      <div className="grid sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Enabled rules', value: enabled, icon: Bot, tone: 'text-emerald-300' },
          { label: 'Paused rules', value: blocked, icon: AlertTriangle, tone: 'text-rose-300' },
          { label: 'Live triggers', value: liveTriggers, icon: Plug, tone: 'text-violet-300' },
          { label: 'Event bridge', value: 'Active', icon: Server, tone: 'text-sky-300' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-black/25 p-3">
            <k.icon size={14} className={k.tone} />
            <div className="mt-2 text-xl font-black text-white">{k.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/integrations')}>
          <Plug size={14} /> Integrations
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/monitoring')}>
          <Activity size={14} /> Monitoring
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/staff?view=talk&staff=james_holloway')}>
          Talk to James
        </button>
      </div>
    </div>
  );
}
