import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Moon,
  Sun,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildMicroBudgetPlan } from '../../../../lib/geo/microBudgetBrain';
import { LeadIntelSwarmDashboard } from '../../../overnight50/LeadIntelSwarmDashboard';
import { SyntheticStaffFloor } from '../../../overnight50/SyntheticStaffFloor';
import { FinelyOsAlertBanner } from '../../../os/FinelyOsAlertBanner';
import { FinelyOsOverviewStatTile } from '../../../os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

export default function AdminOvernightProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'violet';

  const budget = useMemo(() => buildMicroBudgetPlan(), []);
  const target =
    budget.freeLeadPlan.reduce((n, x) => n + x.targetLeads, 0) + budget.paidLeadEstimate.high;
  const cellAccents = ['emerald', 'violet', 'sky', 'rose'] as const;
  const sourceAccents = ['violet', 'sky', 'emerald', 'rose', 'violet'] as const;

  const statusCells = [
    {
      id: 'goal',
      label: 'Wake-up goal',
      value: '50',
      hint: 'Modeled leads',
      accent: 'emerald' as const,
      icon: Moon,
    },
    {
      id: 'paid',
      label: 'Paid estimate',
      value: `${budget.paidLeadEstimate.low}-${budget.paidLeadEstimate.high}`,
      hint: 'Honest paid range',
      accent: 'violet' as const,
      icon: TrendingUp,
    },
    {
      id: 'high',
      label: 'High case',
      value: String(target),
      hint: 'Paid + owned',
      accent: 'sky' as const,
      icon: Zap,
    },
    {
      id: 'budget',
      label: 'Daily budget',
      value: `$${(budget.totalBudgetCents / 100).toFixed(0)}`,
      hint: 'Micro-budget plan',
      accent: 'rose' as const,
      icon: Clock,
    },
  ];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Growth"
      title="Overnight50"
      description="Control room for overnight lead jobs — budget cells, owned sources, swarm practice, and staff shifts."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      metrics={[
        {
          label: 'Wake-up goal',
          value: '50',
          hint: 'Modeled leads',
          accent: 'emerald',
        },
        {
          label: 'Paid estimate',
          value: `${budget.paidLeadEstimate.low}-${budget.paidLeadEstimate.high}`,
          hint: 'Honest paid range',
          accent: 'violet',
        },
        {
          label: 'High case',
          value: String(target),
          hint: 'Paid + owned',
          accent: 'sky',
        },
        {
          label: 'Budget',
          value: `$${(budget.totalBudgetCents / 100).toFixed(0)}`,
          hint: 'Daily micro-budget',
          accent: 'rose',
        },
      ]}
      metricTitle="Overnight control room"
      metricDescription="Status grid, alert rail, and live job floors below."
      primaryAction={
        <ProductPagePrimaryAction label="Open Marketing Desk Find" onClick={() => navigate('/admin/marketing-desk?helper=find')} />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/marketing-desk')}>
          Marketing desk
        </button>
      }
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="control-room">
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Main control floor */}
          <div className="lg:col-span-9 space-y-6">
            {/* Status grid — control room signature */}
            <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {statusCells.map((cell) => {
                const Icon = cell.icon;
                return (
                  <div key={cell.id} className={finelyOsCatalogCard(cell.accent)} data-fc-accent={cell.accent}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>{cell.label}</div>
                        <div className={`${FINELY_OS_ENTITY_VALUE} mt-2 text-3xl font-extrabold`}>{cell.value}</div>
                        <div className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{cell.hint}</div>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                        <Icon size={20} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* Target model band */}
            <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-violet-300 text-sm font-black uppercase tracking-[0.2em]">
                    <Moon size={18} /> Overnight target model
                  </div>
                  <p className={`mt-4 max-w-3xl text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                    $25/day cannot buy 50 leads alone. Geo SEO, revival, partner referrals, community capture, and Lead
                    Intel close the gap.
                  </p>
                  <h3 className={`${FINELY_OS_ENTITY_VALUE} mt-4 text-3xl md:text-4xl max-w-4xl font-extrabold`}>
                    Wake up goal: 50 leads. Paid estimate: {budget.paidLeadEstimate.low}-
                    {budget.paidLeadEstimate.high}.
                  </h3>
                </div>
                <FinelyOsOverviewStatTile
                  icon={TrendingUp}
                  label="Modeled high case"
                  value={target}
                  hint="Paid + owned sources"
                  accent="emerald"
                  iconAccent="emerald"
                />
              </div>
            </div>

            {/* Paid allocation grid */}
            <section className="space-y-4">
              <h2 className="text-2xl font-extrabold">Paid spend cells</h2>
              <div className="grid lg:grid-cols-4 gap-4">
                {budget.cells.map((c, i) => (
                  <div key={c.bucket} className={finelyOsCatalogCard(cellAccents[i % cellAccents.length])}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{c.bucket}</div>
                    <div className={`${FINELY_OS_ENTITY_VALUE} mt-2 text-3xl font-extrabold`}>
                      ${(c.amountCents / 100).toFixed(2)}
                    </div>
                    <p className={`${FINELY_OS_ENTITY_BODY} mt-3 text-base font-semibold`}>{c.purpose}</p>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-4`}>
                      Expected paid leads: {c.expectedLeadsLow}-{c.expectedLeadsHigh}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Owned sources mosaic */}
            <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-5`} data-fc-accent="sky">
              <div className="flex items-center gap-2">
                <Sun size={20} />
                <span className={`${FINELY_OS_ENTITY_VALUE} text-2xl font-extrabold`}>
                  Owned sources to reach 50
                </span>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                {budget.freeLeadPlan.map((p, i) => (
                  <div key={p.source} className={finelyOsCatalogCard(sourceAccents[i % sourceAccents.length])}>
                    <div className={`${FINELY_OS_ENTITY_VALUE} text-3xl font-extrabold`}>{p.targetLeads}</div>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-2`}>{p.source.replace('_', ' ')}</div>
                    <p className={`${FINELY_OS_ENTITY_BODY} mt-3 text-base font-semibold`}>{p.action}</p>
                    <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-4`}>Owner: {p.owner}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Swarm + staff floors — embedded overnight tools */}
            <section className="space-y-6">
              <h2 className="text-2xl font-extrabold">Lead Intel swarm</h2>
              <LeadIntelSwarmDashboard />
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-extrabold">Synthetic staff shifts</h2>
              <SyntheticStaffFloor />
            </section>

            {/* Morning handoff deck */}
            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
              <h2 className="text-2xl font-extrabold">Morning handoff</h2>
              <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                Hand off to Marketing Desk and Caleb Brooks (Lead Discovery) for live Serper imports. Review staging
                queue before CRM import.
              </p>
              {budget.feasibilityWarnings.map((w) => (
                <p key={w} className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                  {w}
                </p>
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={FINELY_OS_PRIMARY_BTN}
                  onClick={() => navigate('/admin/marketing-desk?helper=find')}
                >
                  Open Find
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/crm')}>
                  Review CRM queue
                </button>
              </div>
            </div>
          </div>

          {/* Alert rail — control room side panel */}
          <aside className="lg:col-span-3 space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`} data-fc-accent="rose">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <AlertTriangle size={16} />
                <span>Alert rail</span>
              </div>
              <FinelyOsAlertBanner
                tone="warning"
                message="Simulation only · not live finds. Use Caleb Brooks desk or Marketing Desk → Find for real Serper imports."
              />
              <ul className={`space-y-3 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                {budget.feasibilityWarnings.map((w) => (
                  <li key={w} className="flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-400" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6 space-y-4`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_VALUE}>Quick jumps</div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => navigate('/admin/marketing-desk?helper=find')}
                >
                  Marketing Desk Find <ArrowRight size={14} />
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing-desk')}>
                  Marketing desk <ArrowRight size={14} />
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/crm')}>
                  CRM queue <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-3`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Run schedule</div>
              <ul className={`space-y-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                <li>6:00 PM — Set wake-up target</li>
                <li>8:00 PM — Allocate paid spend</li>
                <li>10:00 PM — Queue owned sources</li>
                <li>12:00 AM — Lead Intel practice</li>
                <li>4:00 AM — Staff shifts</li>
                <li>6:00 AM — Morning handoff</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </ProductHubScaffold>
  );
}
