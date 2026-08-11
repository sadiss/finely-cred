import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { buildFinelyCapabilityReport, type FinelyCapabilityDomain } from '../../lib/finelyCapabilityMetrics';
import { computeVideoPipelineMaturity } from '../studioCommandOs/videoPipelineMaturity';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

type Props = {
  /** Compact strip for Content Studio header */
  variant?: 'full' | 'compact';
  /** Show pipeline stage chips under video pipeline bar */
  showPipelineStages?: boolean;
  className?: string;
};

function toneBarClass(tone: FinelyCapabilityDomain['tone']): string {
  if (tone === 'ok') return 'from-emerald-500 via-emerald-400 to-emerald-600';
  if (tone === 'warn') return 'from-amber-500 via-orange-400 to-amber-600';
  return 'from-rose-500 via-rose-400 to-rose-600';
}

function DomainBar({ domain, compact }: { domain: FinelyCapabilityDomain; compact?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-bold text-white/90">{domain.label}</div>
          {!compact ? <div className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{domain.summary}</div> : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={finelyOsStatusChip(domain.tone === 'ok' ? 'ok' : domain.tone === 'warn' ? 'warn' : 'blocked')}>
            {domain.percent}%
          </span>
          {domain.href ? (
            <Link to={domain.href} className={`${FINELY_OS_SECONDARY_BTN} !py-0.5 !px-2 text-[10px] inline-flex items-center gap-1`}>
              Open <ArrowRight size={10} />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="h-2 rounded-full bg-black/25 overflow-hidden border border-white/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all ${toneBarClass(domain.tone)}`}
          style={{ width: `${domain.percent}%` }}
        />
      </div>
      {!compact && domain.blockers.length ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {domain.blockers.slice(0, 2).map((b) => (
            <span key={b.id} className="rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[10px] text-white/55">
              {b.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PipelineStageStrip({ tick }: { tick: number }) {
  const stages = useMemo(() => {
    void tick;
    return computeVideoPipelineMaturity().stages;
  }, [tick]);

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className={FINELY_OS_ENTITY_SUBLABEL}>Active job pipeline</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {stages.map((s) => (
          <span
            key={s.id}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              s.done
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                : s.percent > 0
                  ? 'border-amber-400/30 bg-amber-500/10 text-amber-100'
                  : 'border-white/10 text-white/40'
            }`}
            title={s.hint}
          >
            {s.label} {s.percent}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function FinelyCapabilityScorecard({ variant = 'full', showPipelineStages = false, className = '' }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener('finely:store', bump as EventListener);
    window.addEventListener('finely:platform-event', bump as EventListener);
    return () => {
      window.removeEventListener('finely:store', bump as EventListener);
      window.removeEventListener('finely:platform-event', bump as EventListener);
    };
  }, []);

  const report = useMemo(() => {
    void tick;
    return buildFinelyCapabilityReport();
  }, [tick]);

  const visibleDomains =
    variant === 'compact'
      ? report.domains.filter((d) => ['video_wizard', 'video_pipeline', 'voice_previews', 'course_builder'].includes(d.id))
      : report.domains;

  return (
    <div className={`${finelyOsCatalogCardCompact('sky')} ${className}`} data-fc-accent="sky">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
          <Activity size={14} />
          Capability scorecard
        </div>
        <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
          Live · {new Date(report.computedAt).toLocaleTimeString()}
        </span>
      </div>
      {variant === 'full' ? (
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Domain bars — not one misleading total. Fix blockers to move each lane toward 100%.
        </p>
      ) : null}

      <div className="mt-3 space-y-3">
        {visibleDomains.map((domain) => (
          <DomainBar key={domain.id} domain={domain} compact={variant === 'compact'} />
        ))}
      </div>

      {showPipelineStages ? <PipelineStageStrip tick={tick} /> : null}
    </div>
  );
}
