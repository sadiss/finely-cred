import React, { useMemo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { DailyBriefing, BriefingItem } from '../ai/schemas/briefing';
import { FinelyOsPaginatedStack } from '../os/FinelyOsPaginatedStack';
import { FinelyOsIconBadge } from '../os/FinelyOsIconBadge';
import {
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsInlineListItem,
} from '../os/finelyOsLightUi';

const BRIEFING_KIND_LABEL: Record<BriefingItem['kind'], string> = {
  task: 'Work',
  crm: 'CRM',
  notification: 'Alert',
  automation: 'Autopilot',
  social: 'Social',
  support: 'Support',
  comms: 'Comms',
};

export function OpsBriefingPanel({ briefing }: { briefing: DailyBriefing }) {
  const navigate = useNavigate();
  const top = useMemo(() => briefing.items.slice(0, 20), [briefing.items]);

  return (
    <div className={`${FINELY_OS_BANNER} flex-col sm:flex-row items-start`}>
      <FinelyOsIconBadge icon={Sparkles} accent="violet" size={18} className="p-2.5 shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>AI daily briefing</div>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{briefing.summary}</p>
        </div>
        <FinelyOsPaginatedStack
          items={top}
          pageSize={5}
          emptyMessage="No briefing items today."
          renderItem={(item: BriefingItem, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => item.href && navigate(item.href)}
              className={`w-full text-left ${finelyOsInlineListItem()} p-3 hover:shadow-md transition-all`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>#{idx + 1}</span>
                    <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300/90 normal-case tracking-normal`}>
                      {BRIEFING_KIND_LABEL[item.kind]}
                    </span>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{item.title}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`}>{item.subtitle}</div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-300/80 mt-1 normal-case tracking-normal font-normal`}>{item.reason}</div>
                </div>
                {item.href ? <ArrowRight size={14} className="text-white/40 shrink-0 mt-1" /> : null}
              </div>
            </button>
          )}
        />
      </div>
    </div>
  );
}
