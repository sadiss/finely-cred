import React, { useMemo } from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { BUSINESS_ROADMAP_STEPS, type BusinessRoadmapStepId } from '../../domain/businessCredit';
import { getBusinessCreditProfile, setRoadmapStepDone } from '../../data/businessCreditRepo';
import {
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
  finelyOsInlineListItem,
  finelyOsKpiTile,
} from '../../features/os/finelyOsLightUi';

export function BusinessCreditRoadmapPanel({ partnerId }: { partnerId: string }) {
  const profile = useMemo(() => getBusinessCreditProfile(partnerId), [partnerId]);
  const steps = BUSINESS_ROADMAP_STEPS;
  const doneCount = steps.filter((s) => profile.roadmap?.[s.id]?.done).length;
  const pct = Math.round((doneCount / Math.max(1, steps.length)) * 100);

  return (
    <div className={`${finelyOsGlassShell('panel', 'emerald')} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>A→Z roadmap</div>
          <div className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>Business Credit Roadmap (guided)</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Execute in sequence. Keep every "why" collapsed unless you need it — no walls of text.</div>
        </div>
        <div className={finelyOsKpiTile(1)}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Progress</div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>
            {doneCount}/{steps.length} • {pct}%
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {steps.map((s) => {
          const done = Boolean(profile.roadmap?.[s.id]?.done);
          const Icon = done ? CheckCircle2 : Circle;
          return (
            <details key={s.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony overflow-hidden`}>
              <summary className="cursor-pointer select-none px-5 py-4 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <Icon size={18} className={done ? 'text-emerald-400' : 'text-white/25'} />
                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{s.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRoadmapStepDone({ partnerId, stepId: s.id as BusinessRoadmapStepId, done: !done });
                    }}
                    className={done ? FINELY_OS_SUCCESS_BTN : FINELY_OS_SECONDARY_BTN}
                    title={done ? 'Mark not done' : 'Mark done'}
                  >
                    {done ? 'Done' : 'Mark done'}
                  </button>
                </div>
              </summary>
              <div className="px-5 pb-5 pt-0 border-t border-white/[0.08]">
                <div className={`pt-4 ${FINELY_OS_ENTITY_BODY} space-y-3`}>
                  <div>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Why underwriters care</div>
                    <div className="mt-1">{s.whyItMatters}</div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className={finelyOsInlineListItem()}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Do</div>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                        {s.do.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                    <div className={finelyOsInlineListItem()}>
                      <div className={FINELY_OS_ENTITY_SUBLABEL}>Avoid</div>
                      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                        {s.avoid.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pt-1">
                    <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      Next action: execute this step <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
