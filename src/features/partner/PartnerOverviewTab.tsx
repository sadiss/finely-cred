import React from 'react';
import { ArrowRight } from 'lucide-react';
import { KpiCard } from '../../components/ui/KpiCards';
import { bureauShortCode } from '../../utils/bureaus';
import type { PartnerOverallScoreResult } from '../../utils/partnerOverallScore';
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
} from '../os/finelyOsLightUi';

type ScoreRow = { model: string; exp?: number | null; eqf?: number | null; tuc?: number | null };

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
          { label: 'Letters', tab: 'letters', hint: 'Dispute letter studio' },
          { label: 'Letters', tab: 'letters', hint: `${args.lettersCount} saved` },
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
    </div>
  );
}
