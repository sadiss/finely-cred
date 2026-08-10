import React, { useEffect, useMemo, useState } from 'react';
import { Clock, MessageCircle } from 'lucide-react';
import { portalPersonaForLane } from '../../data/agentPersonasRepo';
import {
  forceStaffShiftPolicyResync,
  isStaffOnShift,
  resolveStaffOnDutyForLane,
  resolveStaffForBankruptcyScenario,
  resolveStaffForLaneFocus,
} from '../../data/staffRoster';
import { staffMemberFullName } from '../../domain/staffMember';
import { formatPartnerStaffShiftSummary } from '../../lib/staffShiftDisplay';
import { StaffPortraitImg } from '../staff/StaffPortraitImg';
import { getAgentPersona } from '../../domain/agentPersonas';
import { FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';

type Props = {
  lane?: string;
  scenarioId?: string;
  focusId?: string;
  compact?: boolean;
  subtitle?: string;
};

export function OnDutyStaffCoachHeader({ lane, scenarioId, focusId, compact, subtitle }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    forceStaffShiftPolicyResync();
    setTick((n) => n + 1);
    const refresh = (forcePolicy = false) => {
      if (forcePolicy) forceStaffShiftPolicyResync();
      setTick((n) => n + 1);
    };
    const onStore = () => refresh(false);
    const onFocus = () => {
      if (document.visibilityState === 'hidden') return;
      refresh(true);
    };
    const interval = window.setInterval(() => refresh(false), 30_000);
    window.addEventListener('finely:store', onStore);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('finely:store', onStore);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const { persona, staff } = useMemo(() => {
    void tick;
    const p = portalPersonaForLane(lane);
    const l = (lane || '').toLowerCase();
    const onDuty =
      scenarioId && l.includes('bankruptcy')
        ? resolveStaffForBankruptcyScenario(scenarioId, lane)
        : focusId
          ? resolveStaffForLaneFocus(focusId, lane)
          : resolveStaffOnDutyForLane(lane);
    return { persona: p, staff: onDuty };
  }, [lane, scenarioId, focusId, tick]);

  const displayName = staff ? staffMemberFullName(staff) : persona.name;
  const displayTitle = staff
    ? getAgentPersona(staff.primaryRoleId)?.displayTitle ?? persona.displayTitle ?? persona.role
    : persona.displayTitle ?? persona.role;

  const shiftInfo = staff ? formatPartnerStaffShiftSummary(staff) : null;
  const onShift = staff ? isStaffOnShift(staff) : false;

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 min-w-0">
        {staff ? (
          <StaffPortraitImg staff={staff} className="h-9 w-9 rounded-xl border border-white/15 shrink-0" />
        ) : (
          <div className="h-9 w-9 rounded-xl border border-white/15 bg-violet-500/20 flex items-center justify-center text-xs font-black text-violet-200 shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-bold text-white truncate">{displayName}</div>
          <div className="text-[10px] text-emerald-300/90 uppercase tracking-wider font-semibold flex items-center gap-1">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${onShift ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {onShift ? 'On shift' : 'Coverage partner'}
          </div>
          {shiftInfo?.dutyLine ? (
            <div className="text-[9px] text-white/45 truncate max-w-[200px]">{shiftInfo.dutyLine}</div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-gradient-to-r from-violet-500/10 via-black/40 to-black/30 px-4 py-3">
      {staff ? (
        <StaffPortraitImg staff={staff} className="h-14 w-14 rounded-2xl border-2 border-emerald-400/35 shadow-lg shadow-black/30 shrink-0" />
      ) : (
        <div className="h-14 w-14 rounded-2xl border border-white/15 bg-violet-500/20 flex items-center justify-center text-lg font-black text-violet-100 shrink-0">
          {displayName.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-black text-white">{displayName}</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            <Clock size={10} /> {onShift ? 'On shift now' : 'Coverage partner'}
          </span>
        </div>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-0.5`}>{displayTitle}</div>
        {shiftInfo?.dutyLine ? (
          <p className="text-[11px] text-white/50 mt-0.5 leading-snug">{shiftInfo.dutyLine}</p>
        ) : null}
        <p className="text-xs text-white/55 mt-1 leading-relaxed">
          {subtitle ?? 'Your specialist for this lane — ask questions in the chat below.'}
        </p>
      </div>
      <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 shrink-0">
        <MessageCircle size={18} />
      </div>
    </div>
  );
}
