import React from 'react';
import { CalendarDays } from 'lucide-react';
import { listSocialWeeklyWorkflow } from '../../domain/socialContentSop';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../os/finelyOsLightUi';

/** Seven-day SOP cadence strip for Social Hub autopilot. */
export function SocialWorkflowWeekStrip() {
  const week = listSocialWeeklyWorkflow();
  const today = new Date().getDay();

  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
      <div className="flex items-center gap-2 text-sky-300/90 mb-3">
        <CalendarDays size={14} />
        <span className={FINELY_OS_ENTITY_SUBLABEL}>Weekly SOP workflow</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {week.map((day) => {
          const active = day.dayIndex === today;
          return (
            <div
              key={day.dayIndex}
              className={`rounded-xl border p-2 min-h-[5.5rem] transition-all ${
                active
                  ? 'border-emerald-500/35 bg-emerald-500/10 ring-1 ring-emerald-400/25'
                  : 'border-white/[0.08] fc-light-glass-panel fc-light-chrome-panel'
              }`}
            >
              <div className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-emerald-200' : 'text-white/50'}`}>
                {day.label}
              </div>
              {day.sops.length ? (
                <ul className={`mt-1.5 space-y-1 ${FINELY_OS_ENTITY_BODY} text-[10px] leading-snug`}>
                  {day.sops.map((s) => (
                    <li key={s.id} className="line-clamp-2">
                      <span className={FINELY_OS_ENTITY_VALUE}>{s.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-2 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Rest day</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
