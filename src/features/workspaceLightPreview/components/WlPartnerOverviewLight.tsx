import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { PartnerOverallScoreResult } from '../../../utils/partnerOverallScore';
import {
  fcAdminCard,
  fcAdminOnSolidMuted,
  fcAdminOnSolidSublabel,
  fcAdminOnSolidValue,
  type FcAdminTone,
} from '../../os/finelyOsAdminSurface';
import { WlObsidianSlab, WlScoreCell, WlSolidKpi } from './WlContrastTiles';
import type { ActivityTimelineItem } from '../../../components/partner/PartnerActivityTimeline';

type ScoreRow = { model: string; exp?: number; eqf?: number; tuc?: number };

export function WlPartnerOverviewLight({
  partner,
  mailingSummary,
  reportsCount,
  evidenceCount,
  lettersCount,
  openPartnerTasksCount,
  openPartnerCasesCount,
  overallScore,
  latestScoresRows,
  onOpenTab,
  onOpenProfile,
  activityItems,
  readinessSlot,
}: {
  partner: { profile: { fullName?: string; email?: string; phone?: string } };
  mailingSummary: string | null;
  reportsCount: number;
  evidenceCount: number;
  lettersCount: number;
  openPartnerTasksCount: number;
  openPartnerCasesCount: number;
  overallScore: PartnerOverallScoreResult | null;
  latestScoresRows: ScoreRow[];
  onOpenTab: (tab: string) => void;
  onOpenProfile: () => void;
  activityItems?: ActivityTimelineItem[];
  readinessSlot?: React.ReactNode;
}) {
  const primaryScore = latestScoresRows[0];
  const scoreCells = primaryScore
    ? [
        { label: 'EXP', value: primaryScore.exp ?? '—', tone: 'sky' as FcAdminTone },
        { label: 'EQF', value: primaryScore.eqf ?? '—', tone: 'violet' as FcAdminTone },
        { label: 'TU', value: primaryScore.tuc ?? '—', tone: 'emerald' as FcAdminTone },
      ]
    : [];

  const taskKpis = [
    { label: 'Open tasks', value: openPartnerTasksCount, tone: 'violet' as FcAdminTone },
    { label: 'Reports', value: reportsCount, tone: 'sky' as FcAdminTone },
    { label: 'Evidence', value: evidenceCount, tone: 'emerald' as FcAdminTone },
    { label: 'Disputes', value: openPartnerCasesCount, tone: 'rose' as FcAdminTone },
  ];

  const quickNav: Array<{ label: string; tab: string; hint: string; tone: FcAdminTone }> = [
    { label: 'Reports', tab: 'reports', hint: `${reportsCount} on file`, tone: 'sky' },
    { label: 'Evidence', tab: 'evidence', hint: `${evidenceCount} files`, tone: 'emerald' },
    { label: 'Letters', tab: 'letters', hint: `${lettersCount} generated`, tone: 'violet' },
    { label: 'Tasks', tab: 'tasks', hint: `${openPartnerTasksCount} open`, tone: 'rose' },
  ];

  return (
    <div className="fc-admin-workspace space-y-4">
      <WlObsidianSlab>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200/75">Your file · overview</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">{partner.profile.fullName || 'Partner'}</h2>
        <p className="mt-1 text-sm text-white/70">
          {[partner.profile.email, partner.profile.phone].filter(Boolean).join(' · ') || 'No contact yet'}
        </p>
        <p className="mt-1 text-sm text-white/55">{mailingSummary || 'Mailing address not set'}</p>
        {scoreCells.length ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {scoreCells.map((c) => (
              <WlScoreCell key={c.label} label={c.label} value={c.value} tone={c.tone} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/65">
            No scores yet — upload a report to surface EXP / EQF / TU here.
          </p>
        )}
      </WlObsidianSlab>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {taskKpis.map((k) => (
          <WlSolidKpi key={k.label} label={k.label} value={k.value} tone={k.tone} />
        ))}
      </div>

      {overallScore || readinessSlot ? (
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#0a1628]/50">Restore readiness</p>
          {overallScore ? (
            <div className="grid gap-3 md:grid-cols-4">
              <WlSolidKpi label="Overall" value={overallScore.overall} hint="Readiness" tone="emerald" />
              <WlSolidKpi label="Open cases" value={openPartnerCasesCount} hint="Disputes" tone="rose" />
              <WlSolidKpi label="Evidence" value={evidenceCount} hint="On file" tone="sky" />
              <WlSolidKpi label="Fast wins" value={overallScore.topActions.length} hint="Improvements" tone="violet" />
            </div>
          ) : null}
          {readinessSlot ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-1 shadow-sm ring-1 ring-emerald-500/15">
              <div className="rounded-xl border border-violet-200/60 bg-gradient-to-b from-violet-500/[0.06] to-white p-3 sm:p-4">
                {readinessSlot}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickNav.map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => onOpenTab(item.tab)}
            className={`${fcAdminCard('!p-4', item.tone, 'solid')} text-left transition-transform hover:-translate-y-0.5`}
          >
            <div className={fcAdminOnSolidSublabel(item.tone)}>{item.label}</div>
            <div className={`mt-1 text-sm ${fcAdminOnSolidMuted(item.tone)}`}>{item.hint}</div>
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${fcAdminOnSolidValue(item.tone)}`}>
              Open <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {activityItems?.length ? (
        <details className={`${fcAdminCard('!p-4', 'navy', 'solid')}`}>
          <summary className={`cursor-pointer select-none ${fcAdminOnSolidValue('navy')}`}>Recent activity</summary>
          <ul className="mt-3 space-y-2">
            {activityItems.slice(0, 6).map((a) => (
              <li key={a.id} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80">
                <div className="font-semibold text-white">{a.title}</div>
                <div className="text-white/60">{a.body}</div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <button type="button" onClick={onOpenProfile} className={`${fcAdminCard('!p-3 w-full text-left', 'navy', 'solid')}`}>
        <span className={fcAdminOnSolidSublabel('navy')}>Profile</span>
        <span className={`mt-1 block text-sm ${fcAdminOnSolidMuted('navy')}`}>Open settings & mailing address</span>
      </button>
    </div>
  );
}
