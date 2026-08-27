import React, { useMemo } from 'react';
import { Moon, Sun, TrendingUp } from 'lucide-react';
import { AdminWorkstationFrame, type AdminEmbeddablePageProps } from '../../features/workspaceLightPreview/product/admin/AdminWorkstationFrame';
import { buildMicroBudgetPlan } from '../../lib/geo/microBudgetBrain';
import { LeadIntelSwarmDashboard } from '../../features/overnight50/LeadIntelSwarmDashboard';
import { SyntheticStaffFloor } from '../../features/overnight50/SyntheticStaffFloor';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyOsGlassPanel } from '../../features/os/FinelyOsGlassPanel';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export default function AdminOvernight50Page({ embedded = false }: AdminEmbeddablePageProps = {}) {
  const budget = useMemo(() => buildMicroBudgetPlan(), []);
  const target = budget.freeLeadPlan.reduce((n, x) => n + x.targetLeads, 0) + budget.paidLeadEstimate.high;
  const cellAccents = ['emerald', 'violet', 'sky', 'rose'] as const;
  const sourceAccents = ['violet', 'sky', 'emerald', 'rose', 'violet'] as const;

  return (
    <AdminWorkstationFrame embedded={embedded} kind="overnight-workstation" badge="Admin" title="Overnight50 War Room" subtitle="Simulation labs — live finds run on Caleb Find / Marketing Desk.">
      <div className={FINELY_OS_PAGE}>
        <FinelyOsAlertBanner tone="warning" message="Simulation only · not live finds. Use Caleb desk or Marketing Desk → Find for real Serper imports." />

        <FinelyOsGlassPanel
          icon={Moon}
          title="Last-night target model"
          subtitle="The math is transparent: $25/day cannot buy 50 leads by itself. Geo SEO, revival, partner referrals, community capture, and Lead Intel close the gap."
          accent="violet"
        >
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className={`${FINELY_OS_ENTITY_VALUE} text-3xl md:text-5xl max-w-4xl`}>
              Wake up goal: 50 leads. Honest paid estimate: {budget.paidLeadEstimate.low}-{budget.paidLeadEstimate.high}.
            </h2>
            <FinelyOsOverviewStatTile
              icon={TrendingUp}
              label="Modeled high case"
              value={target}
              hint="Paid + owned sources"
              accent="emerald"
              iconAccent="emerald"
            />
          </div>
        </FinelyOsGlassPanel>

        <div className="grid lg:grid-cols-4 gap-4">
          {budget.cells.map((c, i) => (
            <div key={c.bucket} className={finelyOsCatalogCard(cellAccents[i % cellAccents.length])}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{c.bucket}</div>
              <div className={`${FINELY_OS_ENTITY_VALUE} mt-2 text-3xl`}>${(c.amountCents / 100).toFixed(2)}</div>
              <p className={`${FINELY_OS_ENTITY_BODY} mt-3`}>{c.purpose}</p>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-4`}>Expected paid leads: {c.expectedLeadsLow}-{c.expectedLeadsHigh}</div>
            </div>
          ))}
        </div>

        <FinelyOsGlassPanel icon={Sun} title="Free and owned sources needed to make 50 possible" accent="sky">
          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
            {budget.freeLeadPlan.map((p, i) => (
              <div key={p.source} className={finelyOsCatalogCard(sourceAccents[i % sourceAccents.length])}>
                <div className={`${FINELY_OS_ENTITY_VALUE} text-3xl`}>{p.targetLeads}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-2`}>{p.source.replace('_', ' ')}</div>
                <p className={`${FINELY_OS_ENTITY_BODY} mt-3`}>{p.action}</p>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} mt-4`}>Owner: {p.owner}</div>
              </div>
            ))}
          </div>
        </FinelyOsGlassPanel>

        <LeadIntelSwarmDashboard />
        <SyntheticStaffFloor />
      </div>
    </AdminWorkstationFrame>
  );
}
