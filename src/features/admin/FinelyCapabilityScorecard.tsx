import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import {
  buildFinelyCapabilityReport,
  type FinelyCapabilityDomain,
  type FinelyCapabilityDomainId,
} from '../../lib/finelyCapabilityMetrics';
import { computeVideoPipelineMaturity } from '../studioCommandOs/videoPipelineMaturity';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  type FinelyOsDeckAccent,
} from '../os/finelyOsLightUi';
import { MARKETING_HUB_CONTENT_SHELL, marketingVividShell, MarketingSectionHeader } from '../marketingDepartment/marketingHubUi';
import { MarketingHelpButton } from '../marketingDepartment/MarketingHelpModal';
import { capabilityDomainHelpId } from '../marketingDepartment/marketingMetricHelp';

type Props = {
  variant?: 'full' | 'compact';
  showPipelineStages?: boolean;
  className?: string;
};

/** Each domain gets its own color so cards never look identical. */
const DOMAIN_ACCENT: Record<FinelyCapabilityDomainId, FinelyOsDeckAccent> = {
  video_wizard: 'sky',
  video_pipeline: 'violet',
  voice_previews: 'fuchsia',
  course_builder: 'rose',
  marketing: 'emerald',
  ctas: 'sky',
  agents: 'violet',
};

const DOMAIN_TAGLINE: Partial<Record<FinelyCapabilityDomainId, string>> = {
  video_wizard: 'Short-form & pillar video setup',
  video_pipeline: 'Import → publish lifecycle',
  voice_previews: 'AI voice render health',
  course_builder: 'Academy lessons & videos',
  marketing: 'Find, mail, desk readiness',
  ctas: 'Public CTA wiring',
  agents: 'Growth specialist maturity',
};

function healthLabel(domain: FinelyCapabilityDomain): { text: string; shell: string } {
  if (domain.tone === 'ok') return { text: 'Healthy', shell: 'bg-emerald-950/50 border-emerald-200/60 text-emerald-100' };
  if (domain.tone === 'warn') return { text: 'Needs attention', shell: 'bg-fuchsia-950/50 border-fuchsia-200/60 text-fuchsia-100' };
  return { text: 'Blocked', shell: 'bg-rose-950/50 border-rose-200/60 text-rose-100' };
}

function DomainCard({ domain, compact }: { domain: FinelyCapabilityDomain; compact?: boolean }) {
  const accent = DOMAIN_ACCENT[domain.id] ?? 'violet';
  const health = healthLabel(domain);
  const tagline = DOMAIN_TAGLINE[domain.id];

  return (
    <div className={`${marketingVividShell(accent)} !p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/75">{tagline}</p>
          <div className="mt-1 text-xl font-black leading-tight">{domain.label}</div>
          {!compact ? <div className="mt-2 text-sm leading-snug text-white/92">{domain.summary}</div> : null}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <MarketingHelpButton helpId={capabilityDomainHelpId(domain.id)} />
          <span className={`text-3xl font-black tabular-nums leading-none`}>{domain.percent}%</span>
          <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${health.shell}`}>
            {health.text}
          </span>
        </div>
      </div>
      <div className="mt-3 h-3 rounded-full bg-black/40 overflow-hidden border border-white/25">
        <div
          className="h-full rounded-full bg-white transition-all duration-700"
          style={{ width: `${domain.percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-white/85">
        {domain.percent >= 70
          ? 'This lane is in good shape — keep your weekly cadence.'
          : domain.percent >= 40
            ? 'Finish the blockers below to raise this score.'
            : 'Start with the Open button — this lane needs foundational setup.'}
      </p>
      {!compact && domain.blockers.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {domain.blockers.slice(0, 2).map((b) => (
            <span key={b.id} className="rounded-lg bg-black/35 border border-white/20 px-2 py-1 text-xs font-semibold">
              {b.label}
            </span>
          ))}
        </div>
      ) : null}
      {domain.href ? (
        <Link
          to={domain.href}
          className={`${FINELY_OS_SECONDARY_BTN} !mt-3 !py-1.5 !px-3 text-xs !bg-black/30 !border-white/35`}
        >
          Open {domain.label}
        </Link>
      ) : null}
    </div>
  );
}

function PipelineStageStrip({ tick }: { tick: number }) {
  const stages = useMemo(() => {
    void tick;
    return computeVideoPipelineMaturity().stages;
  }, [tick]);

    const stageAccents: FinelyOsDeckAccent[] = ['sky', 'violet', 'fuchsia', 'emerald', 'rose'];

  return (
    <div className="mt-3 pt-3 border-t border-white/15">
      <div className={FINELY_OS_ENTITY_SUBLABEL}>Video pipeline stages</div>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {stages.map((s, i) => (
          <div
            key={s.id}
            className={`${marketingVividShell(stageAccents[i % stageAccents.length], false)} !p-3`}
            title={s.hint}
          >
            <div className="text-xs font-bold uppercase tracking-wide">{s.label}</div>
            <div className="text-2xl font-black tabular-nums">{s.percent}%</div>
          </div>
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
    <div className={`${MARKETING_HUB_CONTENT_SHELL} ${className}`} data-fc-accent="sky">
      <MarketingSectionHeader
        eyebrow="Capability scorecard"
        title="Each lane has its own color and %"
        subtitle="Sky = video wizard, violet = pipeline, fuchsia = voice, etc. Percent = readiness for that lane only."
        helpId="capability_percent"
      />
      <div className={`inline-flex items-center gap-2 text-[10px] ${FINELY_OS_ENTITY_BODY} mb-3`}>
        <Activity size={14} className="text-sky-300" />
        Live · {new Date(report.computedAt).toLocaleTimeString()}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {visibleDomains.map((domain) => (
          <DomainCard key={domain.id} domain={domain} compact={variant === 'compact'} />
        ))}
      </div>

      {showPipelineStages ? <PipelineStageStrip tick={tick} /> : null}
    </div>
  );
}
