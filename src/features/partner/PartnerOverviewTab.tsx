import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Pin, ScrollText, User, X } from 'lucide-react';
import { bureauShortCode } from '../../utils/bureaus';
import type { PartnerOverallScoreResult } from '../../utils/partnerOverallScore';
import type { ActivityTimelineItem } from '../../components/partner/PartnerActivityTimeline';
import { derivePartnerSignupStatus } from '../../lib/partnerAuthActivity';
import {
  FC_ADMIN_INK_BODY,
  FC_ADMIN_INK_SUBLABEL,
  FC_ADMIN_INK_TITLE,
  FC_ADMIN_INK_VALUE,
  FC_ADMIN_ON_SOLID_SECONDARY_BTN,
  FC_ADMIN_PRIMARY_BTN,
  fcAdminKpi,
  fcAdminScoreCell,
  fcAdminStatusChip,
  fcAdminOnSolidText,
  fcAdminOnSolidMuted,
  type FcAdminTone,
  type FcAdminCardVariant,
} from '../os/finelyOsAdminSurface';

/** Dark-glass aliases keep this overview legible when its admin shell is dark. */
const FINELY_OS_DARK_GLASS_BODY = FC_ADMIN_INK_BODY;
const FINELY_OS_DARK_GLASS_SUBLABEL = FC_ADMIN_INK_SUBLABEL;
const FINELY_OS_DARK_GLASS_TITLE = FC_ADMIN_INK_TITLE;
const FINELY_OS_DARK_GLASS_VALUE = FC_ADMIN_INK_VALUE;
const FINELY_OS_PRIMARY_BTN = FC_ADMIN_PRIMARY_BTN;
const FINELY_OS_DARK_GLASS_SELECT =
  'fc-admin-dark-glass-select mt-1.5 w-full rounded-lg border !border-white/20 !bg-black/25 px-3 py-2 text-sm !text-white [color-scheme:dark] focus:outline-none focus:!border-amber-300/80 focus:!ring-2 focus:!ring-amber-300/20 transition-colors';
const FINELY_OS_SOLID_GLOSS =
  'overflow-hidden after:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.38),inset_0_1px_0_rgba(255,255,255,0.58),inset_0_-1px_0_rgba(0,0,0,0.24)]';
/** Quiet, translucent dark-glass card — activity, nav shortcuts, and secondary detail. */
function finelyOsCatalogCard(tone: FcAdminTone = 'neutral') {
  return `fc-admin-dark-glass-card${tone === 'neutral' ? '' : ` fc-admin-dark-glass-tint-${tone}`} rounded-2xl border p-4 text-white`;
}
/** KPI tile — the number is the point, so it's a rich `solid` fill by default. Pass `variant="soft"` to quiet one down. */
function finelyOsEntityKpi(tone: FcAdminTone = 'neutral', variant: FcAdminCardVariant = 'solid') {
  return `${fcAdminKpi(tone, variant)} ${variant === 'solid' ? FINELY_OS_SOLID_GLOSS : ''}`;
}
function finelyOsStatusChip(tone: 'ok' | 'warn' | 'blocked') {
  return fcAdminStatusChip(tone);
}

type ScoreRow = { model: string; exp?: number | null; eqf?: number | null; tuc?: number | null };

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function statusChipTone(status: string): 'ok' | 'warn' | 'blocked' {
  if (status === 'active') return 'ok';
  if (status === 'lead') return 'warn';
  return 'blocked';
}

function signupChipTone(tone: 'amber' | 'emerald' | 'violet' | 'sky' | 'rose'): 'ok' | 'warn' | 'blocked' {
  if (tone === 'emerald' || tone === 'sky') return 'ok';
  if (tone === 'rose') return 'blocked';
  return 'warn';
}

function ActivityInsightCards({
  items,
  onOpenNotes,
}: {
  items: ActivityTimelineItem[];
  onOpenNotes: () => void;
}) {
  const [activeBucket, setActiveBucket] = useState<'recent' | 'manual' | 'system' | 'pinned' | 'partner'>('recent');
  const [modalBucket, setModalBucket] = useState<keyof ReturnType<typeof buildBuckets> | null>(null);
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
        return b.createdAt.localeCompare(a.createdAt);
      }),
    [items],
  );
  function buildBuckets(list: ActivityTimelineItem[]) {
    return {
      recent: list.slice(0, 12),
      manual: list.filter((i) => i.kind === 'manual').slice(0, 20),
      system: list.filter((i) => i.kind === 'system').slice(0, 20),
      pinned: list.filter((i) => i.pinned).slice(0, 20),
      partner: list.filter((i) => i.visibility === 'partner').slice(0, 20),
    };
  }
  const buckets = useMemo(() => buildBuckets(sorted), [sorted]);

  if (!sorted.length) {
    return (
      <div className={`fc-admin-dark-glass-activity rounded-2xl border border-dashed border-white/15 p-4 ${FINELY_OS_DARK_GLASS_BODY}`}>
        No recent partner activity yet.
      </div>
    );
  }

  const cards: Array<{ id: keyof typeof buckets; label: string; value: number; hint: string; tone: FcAdminTone }> = [
    { id: 'recent', label: 'Recent', value: sorted.length, hint: 'Latest activity', tone: 'navy' },
    { id: 'manual', label: 'Team notes', value: sorted.filter((i) => i.kind === 'manual').length, hint: 'Human-entered', tone: 'gold' },
    { id: 'system', label: 'System', value: sorted.filter((i) => i.kind === 'system').length, hint: 'Automatic', tone: 'sky' },
    { id: 'pinned', label: 'Pinned', value: sorted.filter((i) => i.pinned).length, hint: 'Priority', tone: 'rose' },
    { id: 'partner', label: 'Partner-visible', value: sorted.filter((i) => i.visibility === 'partner').length, hint: 'Shared', tone: 'emerald' },
  ];

  const activeItems = buckets[activeBucket] ?? [];

  return (
    <div className="fc-admin-dark-glass-activity rounded-2xl border p-4 text-white space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={FINELY_OS_DARK_GLASS_SUBLABEL}>Activity</p>
          <p className={`mt-1 ${FINELY_OS_DARK_GLASS_BODY}`}>Command view — open Notes for the full timeline.</p>
        </div>
        <button type="button" className={FC_ADMIN_ON_SOLID_SECONDARY_BTN} onClick={onOpenNotes}>
          <ScrollText size={14} /> Notes
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {cards.map((c) => {
          const active = activeBucket === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveBucket(c.id);
                setModalBucket(c.id);
              }}
              className={`fc-admin-dark-glass-chip fc-admin-dark-glass-tint-${c.tone} text-left rounded-xl border px-3 py-2.5 transition-all ${
                active
                  ? 'border-white/45 bg-white/[0.08] shadow-[0_8px_18px_-14px_rgba(0,0,0,0.7)]'
                  : 'hover:bg-white/[0.04]'
              }`}
            >
              <div className={FINELY_OS_DARK_GLASS_SUBLABEL}>{c.label}</div>
              <div className={`mt-1 text-lg ${FINELY_OS_DARK_GLASS_VALUE}`}>{c.value}</div>
            </button>
          );
        })}
      </div>
      <div className="max-h-48 overflow-y-auto border-y border-white/10 pr-1">
        {activeItems.slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-start gap-2 border-b border-white/10 px-1 py-2.5 last:border-b-0">
            {item.pinned ? <Pin size={12} className="mt-1 text-amber-300 shrink-0" /> : <Activity size={12} className="mt-1 text-white/35 shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className={`text-sm truncate ${FINELY_OS_DARK_GLASS_VALUE}`}>{item.title || 'Update'}</div>
              {item.body ? <div className={`mt-0.5 text-xs truncate ${FINELY_OS_DARK_GLASS_BODY}`}>{item.body}</div> : null}
              <div className={`mt-0.5 text-[11px] ${FINELY_OS_DARK_GLASS_BODY}`}>{fmtWhen(item.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
      {modalBucket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalBucket(null)}>
          <div
            className={`${finelyOsCatalogCard('neutral')} !p-5 max-w-lg w-full max-h-[70vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={FINELY_OS_DARK_GLASS_TITLE}>{cards.find((c) => c.id === modalBucket)?.label}</p>
              <button type="button" className={FC_ADMIN_ON_SOLID_SECONDARY_BTN} onClick={() => setModalBucket(null)} aria-label="Close activity list">
                <X size={14} />
              </button>
            </div>
            <div className="mt-4 border-y border-white/10">
              {(buckets[modalBucket] || []).map((item) => (
                <div key={item.id} className="border-b border-white/10 py-3 last:border-b-0">
                  <div className={`text-sm ${FINELY_OS_DARK_GLASS_VALUE}`}>{item.title || 'Update'}</div>
                  <div className={`mt-1 text-xs ${FINELY_OS_DARK_GLASS_BODY}`}>{item.body}</div>
                  <div className={`mt-1 text-[10px] ${FINELY_OS_DARK_GLASS_BODY}`}>{fmtWhen(item.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PartnerOverviewTab(args: {
  partner: any;
  mailingSummary: string | null;
  profileRouteKey: string;
  emptyCustomFieldSections: number;
  reportsCount: number;
  evidenceCount: number;
  lettersCount: number;
  debtCasesCount: number;
  overallScore: PartnerOverallScoreResult | null;
  openPartnerTasksCount: number;
  openPartnerCasesCount: number;
  latestScoresRows: ScoreRow[];
  onStatusChange: (status: string) => void;
  onOpenProfile: () => void;
  onOpenTab: (tab: string) => void;
  onNavigate: (path: string) => void;
  activityItems?: ActivityTimelineItem[];
}) {
  const { partner } = args;
  const primaryScore = args.latestScoresRows[0];
  const signup = derivePartnerSignupStatus(partner);

  /** EXP / EQF / TUC each get a maximally distinct tone — blue / gold / green — so the trio never reads as "three identical blues". */
  const SCORE_TONES: FcAdminTone[] = ['sky', 'gold', 'emerald'];

  return (
    <div className="space-y-4">
      {/* Identity command panel — transparent smoky glass with the radiance supplied by the admin glass surface. */}
      <div className="fc-admin-dark-glass-hero rounded-2xl border p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={FINELY_OS_DARK_GLASS_SUBLABEL}>Overview</p>
              <span className={finelyOsStatusChip(statusChipTone(partner.status))}>
                {String(partner.status || 'lead').toUpperCase()}
              </span>
              <span className={finelyOsStatusChip(signupChipTone(signup.tone))}>{signup.label}</span>
            </div>
            <p className={`mt-2 ${FINELY_OS_DARK_GLASS_TITLE}`}>{partner.profile.fullName}</p>
            <p className={`mt-1 ${FINELY_OS_DARK_GLASS_BODY}`}>
              {[partner.profile.email, partner.profile.phone].filter(Boolean).join(' · ') || 'No contact yet'}
            </p>
            <p className={`mt-1 ${FINELY_OS_DARK_GLASS_BODY}`}>{args.mailingSummary || 'Mailing address not set'}</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            <div className="text-right">
              <div className={FINELY_OS_DARK_GLASS_SUBLABEL}>Profile type</div>
              <select
                value={partner.status}
                onChange={(e) => args.onStatusChange(e.target.value)}
                className={`sm:w-[160px] ${FINELY_OS_DARK_GLASS_SELECT}`}
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={args.onOpenProfile}>
                <User size={14} /> Profile & access
              </button>
            </div>
          </div>
        </div>

        {primaryScore ? (
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={FINELY_OS_DARK_GLASS_SUBLABEL}>Credit scores · {primaryScore.model}</p>
              {args.latestScoresRows.length > 1 ? (
                <button type="button" className={FC_ADMIN_ON_SOLID_SECONDARY_BTN} onClick={args.onOpenProfile}>
                  All models on Profile
                </button>
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 max-w-md">
              {[
                { label: 'EXP', value: primaryScore.exp },
                { label: 'EQF', value: primaryScore.eqf },
                { label: bureauShortCode('TUC'), value: primaryScore.tuc },
              ].map((cell, i) => {
                const tone = SCORE_TONES[i];
                return (
                  <div key={cell.label} className={`${fcAdminScoreCell(tone)} ${FINELY_OS_SOLID_GLOSS}`}>
                    <div className={`text-[11px] font-semibold uppercase tracking-wide ${fcAdminOnSolidMuted(tone)}`}>{cell.label}</div>
                    <div className={`mt-1 text-2xl font-semibold font-mono ${fcAdminOnSolidText(tone)}`}>{cell.value ?? '—'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={`mt-5 border-t border-white/10 pt-4 ${FINELY_OS_DARK_GLASS_BODY}`}>
            No scores yet — upload a report to surface EXP / EQF / TU here.
          </div>
        )}
      </div>

      {/* KPIs — hard counts, each its own solid color so the four read as distinct facts, not a repeated tile. */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          [
            { label: 'Reports', value: args.reportsCount, tone: 'sky' as FcAdminTone },
            { label: 'Letters', value: args.lettersCount, tone: 'navy' as FcAdminTone },
            { label: 'Debt / summons', value: args.debtCasesCount, tone: 'rose' as FcAdminTone },
            { label: 'Open tasks', value: args.openPartnerTasksCount, tone: 'gold' as FcAdminTone },
          ]
        ).map((k) => (
          <div key={k.label} className={finelyOsEntityKpi(k.tone)}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${fcAdminOnSolidMuted(k.tone)}`}>{k.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${fcAdminOnSolidText(k.tone)}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {args.overallScore ? (
        <div className="grid md:grid-cols-4 gap-3">
          {(
            [
              { label: 'Overall', value: args.overallScore.overall, hint: 'Readiness', tone: 'emerald' as FcAdminTone, surface: 'solid' as const },
              { label: 'Open cases', value: args.openPartnerCasesCount, hint: 'Disputes', tone: 'rose' as FcAdminTone, surface: 'solid' as const },
              { label: 'Evidence', value: args.evidenceCount, hint: 'On file', tone: 'gold' as FcAdminTone, surface: 'solid' as const },
              { label: 'Improvements', value: args.overallScore.topActions.length, hint: 'Fast wins', tone: 'teal' as FcAdminTone, surface: 'glass' as const },
            ]
          ).map((k) => (
            <div key={k.label} className={k.surface === 'solid' ? finelyOsEntityKpi(k.tone, 'solid') : finelyOsCatalogCard(k.tone)}>
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${k.surface === 'solid' ? fcAdminOnSolidMuted(k.tone) : FINELY_OS_DARK_GLASS_SUBLABEL}`}>{k.label}</p>
              <p className={`mt-2 text-3xl font-semibold leading-none ${k.surface === 'solid' ? fcAdminOnSolidText(k.tone) : FINELY_OS_DARK_GLASS_VALUE}`}>{k.value}</p>
              <p className={`mt-2 text-xs ${k.surface === 'solid' ? fcAdminOnSolidMuted(k.tone) : FINELY_OS_DARK_GLASS_BODY}`}>{k.hint}</p>
            </div>
          ))}
        </div>
      ) : null}

      {args.overallScore?.topActions?.length ? (
        // A subdued tinted-glass disclosure keeps the shortcuts distinct from the vivid KPI tiles.
        <details className={`${finelyOsCatalogCard('teal')} !p-4`}>
          <summary className={`cursor-pointer select-none ${FINELY_OS_DARK_GLASS_VALUE}`}>Top improvements</summary>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {args.overallScore.topActions.slice(0, 6).map((a, index) => {
              const tone = (['sky', 'gold', 'emerald', 'navy', 'teal', 'rose'] as const)[index % 6];
              return (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => args.onNavigate(a.path || `/portal/dashboard?debugUi=1`)}
                  className={`fc-admin-dark-glass-action fc-admin-dark-glass-tint-${tone} text-left rounded-xl border px-3 py-3 transition-all hover:bg-white/[0.06]`}
                >
                  <div className={`text-sm ${FINELY_OS_DARK_GLASS_VALUE}`}>{a.title}</div>
                  <div className={`mt-1 text-xs ${FINELY_OS_DARK_GLASS_BODY}`}>{a.desc}</div>
                </button>
              );
            })}
          </div>
        </details>
      ) : null}

      {/* Quick-nav — same labels as the KPIs above, so these stay quiet/soft on purpose: they're shortcuts, not the data itself. */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(
          [
            { label: 'Reports', tab: 'reports', hint: `${args.reportsCount} on file`, tone: 'teal' as FcAdminTone },
            { label: 'Evidence', tab: 'evidence', hint: `${args.evidenceCount} files`, tone: 'gold' as FcAdminTone },
            { label: 'Letters', tab: 'letters', hint: 'Letter studio', tone: 'navy' as FcAdminTone },
            { label: 'Tasks', tab: 'tasks', hint: `${args.openPartnerTasksCount} open`, tone: 'emerald' as FcAdminTone },
          ]
        ).map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => args.onOpenTab(item.tab)}
            className={`text-left ${finelyOsCatalogCard(item.tone)} !p-4 hover:bg-white/[0.06] transition-all`}
          >
            <div className={FINELY_OS_DARK_GLASS_SUBLABEL}>{item.label}</div>
            <div className={`mt-1 ${FINELY_OS_DARK_GLASS_BODY}`}>{item.hint}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/80">
              Open <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {args.emptyCustomFieldSections > 0 ? (
        <button
          type="button"
          onClick={args.onOpenProfile}
          className={`fc-admin-solid-gold w-full text-left rounded-xl border px-4 py-3 text-sm ${fcAdminOnSolidText('gold')}`}
        >
          {args.emptyCustomFieldSections} profile section{args.emptyCustomFieldSections === 1 ? '' : 's'} still empty — open Profile to finish.
        </button>
      ) : null}

      {args.activityItems?.length ? (
        <ActivityInsightCards items={args.activityItems} onOpenNotes={() => args.onOpenTab('notes')} />
      ) : null}

      <p className="text-[11px] text-white/50">
        Route {String(args.profileRouteKey).replaceAll('_', ' ')} · Tenant{' '}
        <span className="font-mono">{partner.tenantId}</span> · Updated {new Date(partner.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
