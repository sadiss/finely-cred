import React, { useMemo, useState } from 'react';
import { Activity, ArrowRight, Pin, ScrollText, User, X } from 'lucide-react';
import { KpiCard } from '../../components/ui/KpiCards';
import { bureauShortCode } from '../../utils/bureaus';
import type { PartnerOverallScoreResult } from '../../utils/partnerOverallScore';
import type { ActivityTimelineItem } from '../../components/partner/PartnerActivityTimeline';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsEntityKpi,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

type ScoreRow = { model: string; exp?: number | null; eqf?: number | null; tuc?: number | null };

function fmtWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
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
      <div className={`${finelyOsCatalogCard('emerald')} !p-6 ${FINELY_OS_ENTITY_BODY}`}>
        No recent partner activity yet.
      </div>
    );
  }

  const cards: Array<{ id: keyof typeof buckets; label: string; value: number; hint: string; accent: string }> = [
    { id: 'recent', label: 'Recent', value: sorted.length, hint: 'Latest activity', accent: 'emerald' },
    { id: 'manual', label: 'Team notes', value: sorted.filter((i) => i.kind === 'manual').length, hint: 'Human-entered', accent: 'violet' },
    { id: 'system', label: 'System updates', value: sorted.filter((i) => i.kind === 'system').length, hint: 'Automatic events', accent: 'sky' },
    { id: 'pinned', label: 'Pinned', value: sorted.filter((i) => i.pinned).length, hint: 'Priority context', accent: 'amber' },
    { id: 'partner', label: 'Partner-visible', value: sorted.filter((i) => i.visibility === 'partner').length, hint: 'Shared notes', accent: 'emerald' },
  ];

  const activeItems = buckets[activeBucket] ?? [];

  return (
    <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Activity command cards</p>
          <p className={`mt-2 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
            Click a card to open the related timeline details
          </p>
          <p className={`mt-1 max-w-2xl ${FINELY_OS_ENTITY_BODY}`}>
            Timeline details stay compact until you need them. Use Notes for the full running record.
          </p>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={onOpenNotes}>
          Full notes <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {cards.map((card) => {
          const active = activeBucket === card.id;
          return (
            <button
              key={card.id}
              type="button"
            onClick={() => {
              setActiveBucket(card.id);
              setModalBucket(card.id);
            }}
              className={
                'rounded-2xl border px-3.5 py-3 text-left transition-all min-h-[92px] ' +
                (active
                  ? 'border-amber-400/45 bg-amber-500/14 shadow-lg shadow-amber-500/5'
                  : 'border-white/10 bg-white/[0.035] hover:bg-white/[0.06] hover:border-white/20')
              }
            >
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{card.label}</div>
              <div className={`mt-1 text-2xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{card.value}</div>
              <div className={`mt-0.5 text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{card.hint}</div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm text-white/65">
          <Activity size={15} className="text-emerald-300" />
          Selected: <span className={FINELY_OS_ENTITY_VALUE}>{cards.find((c) => c.id === activeBucket)?.label}</span>
        </div>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setModalBucket(activeBucket)}>
          Open details
        </button>
      </div>

      {modalBucket ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalBucket(null)} />
          <div className={`${finelyOsCatalogCard('emerald')} relative z-10 w-full max-w-5xl !p-0 overflow-hidden shadow-2xl`}>
            <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Activity details</div>
                <div className={`mt-1 text-2xl font-black ${FINELY_OS_ENTITY_VALUE}`}>{cards.find((c) => c.id === modalBucket)?.label}</div>
              </div>
              <button type="button" onClick={() => setModalBucket(null)} className={FINELY_OS_SECONDARY_BTN}>
                <X size={14} /> Close
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto p-5 grid md:grid-cols-2 gap-3">
              {(buckets[modalBucket] ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{item.title}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} normal-case font-mono text-[11px]`}>{fmtWhen(item.createdAt)}</div>
                    </div>
                    <div className="shrink-0 w-9 h-9 rounded-xl border border-white/10 bg-black/25 flex items-center justify-center">
                      {item.kind === 'manual' ? <ScrollText size={15} className="text-violet-300" /> : <Activity size={15} className="text-sky-300" />}
                    </div>
                  </div>
                  <div className={`mt-3 text-sm leading-relaxed ${FINELY_OS_ENTITY_BODY} whitespace-pre-wrap`}>{item.body}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.pinned ? <span className={finelyOsStatusChip('warn')}><Pin size={10} className="inline mr-1" />Pinned</span> : null}
                    {item.visibility === 'partner' ? <span className={finelyOsStatusChip('ok')}>Partner-visible</span> : item.kind === 'manual' ? <span className={finelyOsStatusChip('blocked')}>Internal</span> : <span className={finelyOsStatusChip('ok')}>System</span>}
                    {item.authorEmail ? <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] text-white/50"><User size={10} /> {item.authorEmail}</span> : null}
                  </div>
                </div>
              ))}
              {!(buckets[modalBucket] ?? []).length ? <div className={`${FINELY_OS_ENTITY_BODY} rounded-2xl border border-white/10 bg-white/[0.03] p-4`}>No entries in this group.</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PartnerOverviewTab(args: {
  partner: any;
  profileRouteKey: string;
  mailingSummary: string | null;
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

  return (
    <div className="space-y-6">
      <div className={`${finelyOsCatalogCard('emerald')} !p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Partner snapshot</p>
            <p className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>{partner.profile.fullName}</p>
            <div className={`mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3 ${FINELY_OS_ENTITY_BODY} text-sm`}>
              <div>
                <div className="opacity-60 text-xs uppercase tracking-wider">Email</div>
                <div className={`mt-0.5 ${FINELY_OS_ENTITY_VALUE}`}>{partner.profile.email || '—'}</div>
              </div>
              <div>
                <div className="opacity-60 text-xs uppercase tracking-wider">Phone</div>
                <div className={`mt-0.5 ${FINELY_OS_ENTITY_VALUE}`}>{partner.profile.phone || '—'}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="opacity-60 text-xs uppercase tracking-wider">Mailing (letters)</div>
                <div className={`mt-0.5 ${FINELY_OS_ENTITY_VALUE}`}>{args.mailingSummary || '—'}</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            <div className="text-right">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Status</div>
              <select
                value={partner.status}
                onChange={(e) => args.onStatusChange(e.target.value)}
                className={`mt-2 w-full sm:w-[180px] ${FINELY_OS_ENTITY_INPUT}`}
              >
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={args.onOpenProfile}>
              Profile
            </button>
          </div>
        </div>
        {args.emptyCustomFieldSections > 0 ? (
          <div className={`mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 ${FINELY_OS_ENTITY_BODY} text-sm`}>
            <span className={FINELY_OS_ENTITY_VALUE}>{args.emptyCustomFieldSections}</span> extended profile section
            {args.emptyCustomFieldSections === 1 ? '' : 's'} not filled yet — open <span className={FINELY_OS_ENTITY_VALUE}>Profile</span> below to add monitoring logins, bureau credentials, business IDs, and notes.
          </div>
        ) : null}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={finelyOsEntityKpi(0)}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Activity</p>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            Reports: <span className={FINELY_OS_ENTITY_VALUE}>{args.reportsCount}</span>
          </p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            Evidence: <span className={FINELY_OS_ENTITY_VALUE}>{args.evidenceCount}</span>
          </p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            Letters: <span className={FINELY_OS_ENTITY_VALUE}>{args.lettersCount}</span>
          </p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            Debt / Summons: <span className={FINELY_OS_ENTITY_VALUE}>{args.debtCasesCount}</span>
          </p>
        </div>
        <div className={finelyOsEntityKpi(1)}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Timestamps</p>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            Created: <span className={FINELY_OS_ENTITY_VALUE}>{new Date(partner.createdAt).toLocaleString()}</span>
          </p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            Updated: <span className={FINELY_OS_ENTITY_VALUE}>{new Date(partner.updatedAt).toLocaleString()}</span>
          </p>
        </div>
        <div className={finelyOsEntityKpi(2)}>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Identity source</p>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            Route: <span className={FINELY_OS_ENTITY_VALUE}>{String(args.profileRouteKey).replaceAll('_', ' ')}</span>
          </p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            Claimed: <span className={FINELY_OS_ENTITY_VALUE}>{partner.claimedUserId ? 'Yes' : 'No'}</span>
          </p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
            Tenant: <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{partner.tenantId}</span>
          </p>
        </div>
      </div>

      {args.overallScore ? (
        <div className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <KpiCard
              label="Overall score"
              value={args.overallScore.overall}
              hint="Profile + execution readiness"
              tone={args.overallScore.overall >= 80 ? 'emerald' : args.overallScore.overall >= 60 ? 'amber' : 'violet'}
            />
            <KpiCard label="Open tasks" value={args.openPartnerTasksCount} hint="Queue" tone="fuchsia" />
            <KpiCard label="Open cases" value={args.openPartnerCasesCount} hint="Disputes" tone="emerald" />
            <KpiCard label="Top improvements" value={args.overallScore.topActions.length} hint="Fast wins" tone="sky" />
          </div>
          {args.overallScore.topActions.length ? (
            <details className={`${finelyOsCatalogCard('violet')} !p-5 backdrop-blur-xl`}>
              <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Top improvements</summary>
              <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {args.overallScore.topActions.slice(0, 6).map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => args.onNavigate(a.path || `/portal/dashboard?debugUi=1`)}
                    className={`text-left ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony hover:border-violet-500/30 p-5 transition-all`}
                  >
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300/80`}>
                      {a.severity === 'warn' ? 'Priority' : 'Improvement'}
                    </div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_TITLE} text-base`}>{a.title}</div>
                    <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{a.desc}</div>
                    <div className={`mt-4 inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      Open <ArrowRight size={12} />
                    </div>
                  </button>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Reports', tab: 'reports', hint: `${args.reportsCount} on file` },
          { label: 'Evidence', tab: 'evidence', hint: `${args.evidenceCount} files` },
          { label: 'Letters', tab: 'letters', hint: 'Dispute letter studio' },
          { label: 'Tasks', tab: 'tasks', hint: `${args.openPartnerTasksCount} open` },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => args.onOpenTab(item.tab)}
            className={`text-left ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony hover:border-violet-400/35 transition-all`}
          >
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{item.label}</div>
            <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>{item.hint}</div>
            <div className={`mt-3 inline-flex items-center gap-1 text-xs ${FINELY_OS_ENTITY_VALUE}`}>
              Open <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>

      {primaryScore ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Latest scores · {primaryScore.model}</p>
            {args.latestScoresRows.length > 1 ? (
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => args.onOpenTab('reports')}>
                All models in reports
              </button>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 max-w-xl">
            {[
              { label: 'EXP', value: primaryScore.exp },
              { label: 'EQF', value: primaryScore.eqf },
              { label: bureauShortCode('TUC'), value: primaryScore.tuc },
            ].map((cell) => (
              <div key={cell.label} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-center`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{cell.label}</div>
                <div className={`mt-1 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE} font-mono`}>{cell.value ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {args.activityItems?.length ? (
        <ActivityInsightCards
          items={args.activityItems}
          onOpenNotes={() => args.onOpenTab('notes')}
        />
      ) : null}
    </div>
  );
}
