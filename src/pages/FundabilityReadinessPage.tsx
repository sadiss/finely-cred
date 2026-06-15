import React, { useMemo, useState } from 'react';
import { ArrowRight, Building2, CreditCard, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../components/tours/FinelyNoticedStrip';
import { buildFundabilityNoticedItems } from '../lib/finelyProactiveSignals';
import { FinelyOsOverviewStatTile } from '../features/os/FinelyOsOverviewStatTile';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { BusinessReadinessChecklist } from '../components/business/BusinessReadinessChecklist';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

type Tab = 'overview' | 'personal' | 'business' | 'roadmap';

const READINESS_PILLARS = [
  { id: 'utilization', label: 'Utilization', target: '<30% per card', status: 'Focus first', accent: 'emerald' as const },
  { id: 'inquiries', label: 'Inquiries', target: 'Age 6+ months', status: 'Plan pulls', accent: 'sky' as const },
  { id: 'entity', label: 'Entity hygiene', target: 'EIN + address match', status: 'Business lane', accent: 'violet' as const },
  { id: 'vendor', label: 'Vendor stack', target: '3–5 reporting vendors', status: 'Sequence', accent: 'amber' as const },
  { id: 'docs', label: 'Underwriting docs', target: 'Bank statements + P&L ready', status: 'Capital stage', accent: 'fuchsia' as const },
];

export default function FundabilityReadinessPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  usePublicSeoMeta({
    title: 'Fundability readiness hub',
    description: 'Unified personal + business fundability readiness — utilization, entity hygiene, vendor sequencing, and capital prep.',
    path: '/fundability-readiness',
  });

  const kpis = useMemo(
    () => [
      { label: 'Personal lane', value: 'Restore → 700+ path', hint: 'Disputes + utilization' },
      { label: 'Business lane', value: 'EIN fundability', hint: 'Vendor + lender logic' },
      { label: 'Timeline', value: '90-day sprint', hint: 'Typical first review window' },
      { label: 'Capital handoff', value: 'Nora-ready', hint: 'When file is green' },
    ],
    [],
  );

  return (
    <PageShell
      badge="Funding readiness"
      title="Fundability Readiness Hub"
      subtitle="One calm workspace for personal restore, business credit, and capital prep."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        <FinelyNoticedStrip items={buildFundabilityNoticedItems({ tab })} />
        <FinelyNowDoThisStrip currentIndex={tab === 'personal' ? 0 : tab === 'business' ? 1 : tab === 'roadmap' ? 2 : 0} />
        <FinelyUnifiedHubLayout
          eyebrow="Unified fundability OS"
          title="Your path to capital readiness"
          subtitle="Start with the lane that matches your goal. Deeper detail stays one click away."
          accent="emerald"
          kpis={kpis}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'personal', label: 'Personal' },
            { id: 'business', label: 'Business' },
            { id: 'roadmap', label: '90-day roadmap' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as Tab)}
          primaryAction={{ label: 'Start onboarding', onClick: () => navigate('/onboarding?lane=funding_readiness') }}
          secondaryAction={{ label: 'Book strategy call', onClick: () => navigate('/enlightenment-session?focus=funding') }}
          detailSlot={
            <ul className={`${FINELY_OS_ENTITY_BODY} text-sm space-y-2 list-disc pl-4`}>
              <li>Educational only — not legal or lending advice.</li>
              <li>Funding outcomes vary; we map readiness signals, not guarantees.</li>
            </ul>
          }
        >
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <FinelyOsOverviewStatTile icon={CreditCard} label="Personal restore" value="Dispute + util" accent="violet" iconAccent="violet" />
                <FinelyOsOverviewStatTile icon={Building2} label="Business build" value="EIN + vendors" accent="fuchsia" iconAccent="fuchsia" />
                <FinelyOsOverviewStatTile icon={Target} label="Funding prep" value="Lender logic" accent="emerald" iconAccent="emerald" />
                <FinelyOsOverviewStatTile icon={TrendingUp} label="Funding path" value="Capital prep" accent="amber" iconAccent="amber" />
              </div>
              <FinelyUnifiedSection title="Readiness pillars" subtitle="What lenders and bureaus weigh — in plain language.">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {READINESS_PILLARS.map((p) => (
                    <div key={p.id} className={`${finelyOsCatalogCard(p.accent)} !p-4`} data-fc-accent={p.accent}>
                      <div className="font-semibold">{p.label}</div>
                      <div className={`text-xs mt-1 ${FINELY_OS_ENTITY_BODY}`}>{p.target}</div>
                      <div className="text-[10px] text-emerald-700 mt-2 uppercase tracking-wider">{p.status}</div>
                    </div>
                  ))}
                </div>
              </FinelyUnifiedSection>
            </div>
          )}
          {tab === 'personal' && (
            <FinelyUnifiedSection title="Personal fundability" subtitle="Restore reporting first — then stack funding prep.">
              <div className="flex flex-wrap gap-3">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/personal-credit')}>
                  Personal credit packages <ArrowRight size={14} />
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/free-guide')}>
                  Free dispute guide
                </button>
              </div>
            </FinelyUnifiedSection>
          )}
          {tab === 'business' && (
            <FinelyUnifiedSection title="Business fundability" subtitle="Entity → vendors → lender logic → docs.">
              <BusinessReadinessChecklist />
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/business/dashboard')}>
                  Business dashboard <ArrowRight size={14} />
                </button>
              </div>
            </FinelyUnifiedSection>
          )}
          {tab === 'roadmap' && (
            <FinelyUnifiedSection title="90-day fundability sprint" subtitle="Week-by-week focus.">
              <div className="space-y-3">
                {[
                  { w: 'Weeks 1–2', t: 'Pull reports · dispute inaccurate items · utilization under 30%' },
                  { w: 'Weeks 3–4', t: 'Evidence vault · round-1 mail · re-pull for updates' },
                  { w: 'Weeks 5–8', t: 'Business profile · vendor stack · D-U-N-S if applicable' },
                  { w: 'Weeks 9–12', t: 'Lender logic · doc package · Nora handoff' },
                ].map((row, i) => (
                  <div key={row.w} className={`${finelyOsCatalogCard(i % 2 === 0 ? 'emerald' : 'sky')} !p-4 flex flex-col sm:flex-row sm:items-center gap-2`} data-fc-accent={i % 2 === 0 ? 'emerald' : 'sky'}>
                    <span className="text-xs font-bold uppercase tracking-wider shrink-0">{row.w}</span>
                    <span className={`${FINELY_OS_ENTITY_BODY} text-sm`}>{row.t}</span>
                  </div>
                ))}
              </div>
            </FinelyUnifiedSection>
          )}
        </FinelyUnifiedHubLayout>
        <MarketingStaffChatStrip
          roleId="funding_strategist"
          goal="not_sure"
          roleLabel="funding readiness advisor"
          subline="Ask about fundability pillars, personal vs business lanes, and your 90-day roadmap."
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
