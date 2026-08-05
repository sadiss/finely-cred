import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Pin, ScrollText, User, X } from 'lucide-react';
import { KpiCard } from '../../components/ui/KpiCards';
import { bureauShortCode } from '../../utils/bureaus';
import type { PartnerOverallScoreResult } from '../../utils/partnerOverallScore';
import type { ActivityTimelineItem } from '../../components/partner/PartnerActivityTimeline';
import { derivePartnerSignupStatus } from '../../lib/partnerAuthActivity';
import {
  FC_ADMIN_BODY,
  FC_ADMIN_INPUT,
  FC_ADMIN_SUBLABEL,
  FC_ADMIN_TITLE,
  FC_ADMIN_VALUE,
  FC_ADMIN_PRIMARY_BTN,
  FC_ADMIN_SECONDARY_BTN,
  fcAdminCard,
  fcAdminKpi,
  fcAdminStatusChip,
} from '../os/finelyOsAdminSurface';

/** Local aliases so existing className call sites stay readable. */
const FINELY_OS_ENTITY_BODY = FC_ADMIN_BODY;
const FINELY_OS_ENTITY_INPUT = FC_ADMIN_INPUT;
const FINELY_OS_ENTITY_SUBLABEL = FC_ADMIN_SUBLABEL;
const FINELY_OS_ENTITY_TITLE = FC_ADMIN_TITLE;
const FINELY_OS_ENTITY_VALUE = FC_ADMIN_VALUE;
const FINELY_OS_PRIMARY_BTN = FC_ADMIN_PRIMARY_BTN;
const FINELY_OS_SECONDARY_BTN = FC_ADMIN_SECONDARY_BTN;
function finelyOsCatalogCard(_accent?: string) {
  return fcAdminCard('p-5');
}
function finelyOsEntityKpi(_i?: number) {
  return fcAdminKpi();
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
      <div className={`${finelyOsCatalogCard('emerald')} !p-5 ${FINELY_OS_ENTITY_BODY}`}>
        No recent partner activity yet.
      </div>
    );
  }

  const cards: Array<{ id: keyof typeof buckets; label: string; value: number; hint: string }> = [
    { id: 'recent', label: 'Recent', value: sorted.length, hint: 'Latest activity' },
    { id: 'manual', label: 'Team notes', value: sorted.filter((i) => i.kind === 'manual').length, hint: 'Human-entered' },
    { id: 'system', label: 'System', value: sorted.filter((i) => i.kind === 'system').length, hint: 'Automatic' },
    { id: 'pinned', label: 'Pinned', value: sorted.filter((i) => i.pinned).length, hint: 'Priority' },
    { id: 'partner', label: 'Partner-visible', value: sorted.filter((i) => i.visibility === 'partner').length, hint: 'Shared' },
  ];

  const activeItems = buckets[activeBucket] ?? [];

  return (
    <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Activity</p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>Command view — open Notes for the full timeline.</p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onOpenNotes}>
          <ScrollText size={14} /> Notes
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {cards.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setActiveBucket(c.id);
              setModalBucket(c.id);
            }}
            className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
              activeBucket === c.id
                ? 'border-[var(--fc-admin-accent)]/40 bg-[var(--fc-admin-accent)]/10'
                : 'border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] hover:border-[var(--fc-admin-border-strong)]'
            }`}
          >
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{c.label}</div>
            <div className={`mt-1 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{c.value}</div>
          </button>
        ))}
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {activeItems.slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-start gap-2 rounded-lg border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] px-3 py-2">
            {item.pinned ? <Pin size={12} className="mt-1 text-amber-300 shrink-0" /> : <Activity size={12} className="mt-1 opacity-40 shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className={`text-sm ${FINELY_OS_ENTITY_VALUE} truncate`}>{item.title || item.body?.slice(0, 80) || 'Update'}</div>
              <div className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{fmtWhen(item.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
      {modalBucket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalBucket(null)}>
          <div
            className={`${finelyOsCatalogCard('emerald')} !p-5 max-w-lg w-full max-h-[70vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={FINELY_OS_ENTITY_TITLE}>{cards.find((c) => c.id === modalBucket)?.label}</p>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setModalBucket(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {(buckets[modalBucket] || []).map((item) => (
                <div key={item.id} className="rounded-lg border border-[var(--fc-admin-border)] px-3 py-2">
                  <div className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{item.title || 'Update'}</div>
                  <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{item.body}</div>
                  <div className={`mt-1 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{fmtWhen(item.createdAt)}</div>
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

  return (
    <div className="space-y-5">
      {/* Hero: identity + status + scores */}
      <div className={`${finelyOsCatalogCard('emerald')} !p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Overview</p>
              <span className={finelyOsStatusChip(statusChipTone(partner.status))}>
                {String(partner.status || 'lead').toUpperCase()}
              </span>
              <span className={finelyOsStatusChip(signupChipTone(signup.tone))}>{signup.label}</span>
            </div>
            <p className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>{partner.profile.fullName}</p>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              {[partner.profile.email, partner.profile.phone].filter(Boolean).join(' · ') || 'No contact yet'}
            </p>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{args.mailingSummary || 'Mailing address not set'}</p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            <div className="text-right">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Profile type</div>
              <select
                value={partner.status}
                onChange={(e) => args.onStatusChange(e.target.value)}
                className={`mt-1.5 w-full sm:w-[160px] ${FINELY_OS_ENTITY_INPUT}`}
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
          <div className="mt-5 pt-5 border-t border-[var(--fc-admin-border)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Credit scores · {primaryScore.model}</p>
              {args.latestScoresRows.length > 1 ? (
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={args.onOpenProfile}>
                  All models on Profile
                </button>
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 max-w-md">
              {[
                { label: 'EXP', value: primaryScore.exp },
                { label: 'EQF', value: primaryScore.eqf },
                { label: bureauShortCode('TUC'), value: primaryScore.tuc },
              ].map((cell) => (
                <div key={cell.label} className="rounded-xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] px-3 py-3 text-center">
                  <div className={FINELY_OS_ENTITY_SUBLABEL}>{cell.label}</div>
                  <div className={`mt-1 text-2xl font-semibold font-mono ${FINELY_OS_ENTITY_VALUE}`}>{cell.value ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`mt-5 pt-5 border-t border-[var(--fc-admin-border)] ${FINELY_OS_ENTITY_BODY} text-sm`}>
            No scores yet — upload a report to surface EXP / EQF / TU here.
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={finelyOsEntityKpi(0)}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Reports</p>
          <p className={`mt-1 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{args.reportsCount}</p>
        </div>
        <div className={finelyOsEntityKpi(1)}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Letters</p>
          <p className={`mt-1 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{args.lettersCount}</p>
        </div>
        <div className={finelyOsEntityKpi(2)}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Debt / summons</p>
          <p className={`mt-1 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{args.debtCasesCount}</p>
        </div>
        <div className={finelyOsEntityKpi(3)}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Open tasks</p>
          <p className={`mt-1 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{args.openPartnerTasksCount}</p>
        </div>
      </div>

      {args.overallScore ? (
        <div className="grid md:grid-cols-4 gap-3">
          <KpiCard
            label="Overall"
            value={args.overallScore.overall}
            hint="Readiness"
            tone={args.overallScore.overall >= 80 ? 'emerald' : args.overallScore.overall >= 60 ? 'amber' : 'violet'}
          />
          <KpiCard label="Open cases" value={args.openPartnerCasesCount} hint="Disputes" tone="emerald" />
          <KpiCard label="Evidence" value={args.evidenceCount} hint="On file" tone="sky" />
          <KpiCard label="Improvements" value={args.overallScore.topActions.length} hint="Fast wins" tone="fuchsia" />
        </div>
      ) : null}

      {args.overallScore?.topActions?.length ? (
        <details className={`${finelyOsCatalogCard('sky')} !p-4`}>
          <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Top improvements</summary>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {args.overallScore.topActions.slice(0, 6).map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => args.onNavigate(a.path || `/portal/dashboard?debugUi=1`)}
                className="text-left rounded-xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] px-3 py-3 hover:border-[var(--fc-admin-border-strong)] transition-all"
              >
                <div className={`text-sm ${FINELY_OS_ENTITY_VALUE}`}>{a.title}</div>
                <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{a.desc}</div>
              </button>
            ))}
          </div>
        </details>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Reports', tab: 'reports', hint: `${args.reportsCount} on file` },
          { label: 'Evidence', tab: 'evidence', hint: `${args.evidenceCount} files` },
          { label: 'Letters', tab: 'letters', hint: 'Letter studio' },
          { label: 'Tasks', tab: 'tasks', hint: `${args.openPartnerTasksCount} open` },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => args.onOpenTab(item.tab)}
            className={`text-left ${finelyOsCatalogCard('sky')} !p-4 hover:border-[var(--fc-admin-border-strong)] transition-all`}
          >
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{item.label}</div>
            <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{item.hint}</div>
            <div className={`mt-2 inline-flex items-center gap-1 text-xs ${FINELY_OS_ENTITY_VALUE}`}>
              Open <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {args.emptyCustomFieldSections > 0 ? (
        <button
          type="button"
          onClick={args.onOpenProfile}
          className={`w-full text-left rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 ${FINELY_OS_ENTITY_BODY} text-sm`}
        >
          {args.emptyCustomFieldSections} profile section{args.emptyCustomFieldSections === 1 ? '' : 's'} still empty — open Profile to finish.
        </button>
      ) : null}

      {args.activityItems?.length ? (
        <ActivityInsightCards items={args.activityItems} onOpenNotes={() => args.onOpenTab('notes')} />
      ) : null}

      <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
        Route {String(args.profileRouteKey).replaceAll('_', ' ')} · Tenant{' '}
        <span className="font-mono">{partner.tenantId}</span> · Updated {new Date(partner.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
