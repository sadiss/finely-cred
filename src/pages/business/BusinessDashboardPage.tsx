import React, { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Building2, Crown, Layers, ShieldCheck, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessReadinessChecklist } from '../../components/business/BusinessReadinessChecklist';
import { BusinessCommandStrip } from '../../components/business/BusinessCommandStrip';
import { BusinessNav } from '../../components/business/BusinessNav';
import { BusinessCreditWorkspaceHero } from '../../components/business/BusinessCreditWorkspaceHero';
import { BusinessFundabilityScorecard } from '../../components/business/BusinessFundabilityScorecard';
import { RoleWorkflowPanel } from '../../components/workflow/RoleWorkflowPanel';
import { computeRoleWorkflowProgress } from '../../lib/roleWorkflowProgress';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { BusinessCreditLadderPanel } from '../../components/business/BusinessCreditLadderPanel';
import { BusinessCreditRoadmapPanel } from '../../components/business/BusinessCreditRoadmapPanel';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout, FinelyUnifiedSection } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildBusinessNoticedItems } from '../../lib/finelyProactiveSignals';
import { ROLE_WORKFLOWS } from '../../config/roleWorkflows';
import { BUSINESS_ROADMAP_STEPS } from '../../domain/businessCredit';
import { getBusinessCreditProfile } from '../../data/businessCreditRepo';
import { evaluateFoundationSteps } from '../../lib/businessVendorSequencing';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type BizTab = 'overview' | 'actions' | 'readiness' | 'workflow';

const MODULE_CARDS = [
  { path: '/business/profile', title: 'Business profile', body: 'Entity, EIN, NAICS, address hygiene — the identity layer funders verify first.', cta: 'Open profile', icon: Building2, accent: 'amber' as const },
  { path: '/business/vendors', title: 'Vendor center', body: 'Tier 1–4 sequencing with foundation gates — no premature applications.', cta: 'Open vendors', icon: Target, accent: 'fuchsia' as const },
  { path: '/business/bureaus', title: 'Bureau & scores', body: 'D&B, Experian Business, Equifax Business — track PAYDEX and reporting depth.', cta: 'Track scores', icon: TrendingUp, accent: 'sky' as const },
  { path: '/business/lender-logic', title: 'Lender logic engine', body: 'Model fit before you apply — reduce wasted inquiries and denials.', cta: 'Run engine', icon: Sparkles, accent: 'emerald' as const },
  { path: '/business/billion-path', title: 'Capital readiness', body: 'Entity structure, relationships, and underwriting doc package.', cta: 'Open capital hub', icon: Crown, accent: 'violet' as const },
  { path: '/business/disputes', title: 'Business disputes', body: 'Challenge inaccurate commercial bureau entries with letter workflow.', cta: 'Dispute center', icon: ShieldCheck, accent: 'amber' as const },
];

export default function BusinessDashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<BizTab>('overview');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'overview' || t === 'actions' || t === 'readiness' || t === 'workflow') setTab(t);
  }, [searchParams]);

  const selectTab = (id: BizTab) => {
    setTab(id);
    navigate(`/business/dashboard?tab=${id}`, { replace: true });
  };

  const businessWorkflowProgress = useMemo(
    () => computeRoleWorkflowProgress('business', { partner }),
    [partner],
  );

  const kpis = useMemo(() => {
    if (!partner) {
      return [
        { label: 'Foundation', value: '—', hint: 'Entity + EIN', accent: 'amber' as const },
        { label: 'Vendor stack', value: '—', hint: 'Reporting vendors', accent: 'fuchsia' as const },
        { label: 'Biz score', value: '—', hint: 'Bureau snapshots', accent: 'sky' as const },
        { label: 'Roadmap', value: '—', hint: '10-step path', accent: 'violet' as const },
      ];
    }
    const profile = getBusinessCreditProfile(partner.id);
    const roadmapDone = BUSINESS_ROADMAP_STEPS.filter((s) => profile.roadmap?.[s.id]?.done).length;
    const foundation = evaluateFoundationSteps({
      business: (partner.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build?.business,
      partnerId: partner.id,
    });
    return [
      { label: 'Foundation', value: `${foundation.percent}%`, hint: foundation.complete ? 'Entity signals aligned' : 'Profile hygiene', accent: 'amber' as const },
      { label: 'Vendor stack', value: profile.roadmap?.vendor_tier1?.done ? 'Tier 1+' : 'Start', hint: 'Reporting depth', accent: 'fuchsia' as const },
      { label: 'Roadmap', value: `${roadmapDone}/10`, hint: `${Math.round((roadmapDone / 10) * 100)}% complete`, accent: 'sky' as const },
      { label: 'Capital', value: profile.roadmap?.funding_package?.done ? 'Ready' : 'Building', hint: 'Doc package', accent: 'violet' as const },
    ];
  }, [partner]);

  return (
    <PageShell
      badge="Business Portal"
      title="Business Credit OS"
      subtitle="Entity fundability, vendor sequencing, bureau scores, and capital readiness — one execution layer."
    >
      <div className={FINELY_OS_PAGE}>
        <BusinessNav />
        <BusinessCommandStrip partner={partner ?? null} />
        <BusinessCreditWorkspaceHero partner={partner ?? null} />

        <FinelyNoticedStrip
          items={buildBusinessNoticedItems({
            tab,
            workflowStepsComplete: businessWorkflowProgress.size,
            workflowStepsTotal: ROLE_WORKFLOWS.business?.steps.length ?? 4,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={tab === 'readiness' ? 0 : tab === 'actions' ? 1 : 0} />

        {partner ? <BusinessFundabilityScorecard partner={partner} /> : null}

        <FinelyUnifiedHubLayout
          eyebrow="Business credit OS"
          title="Your fundability workspace"
          subtitle="Six modules — profile, vendors, bureaus, lender logic, capital, disputes — wired to the same roadmap."
          accent="amber"
          kpis={kpis}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'actions', label: 'Modules' },
            { id: 'readiness', label: 'Readiness' },
            { id: 'workflow', label: 'Workflow' },
          ]}
          activeTab={tab}
          onTabChange={(id) => selectTab(id as BizTab)}
          primaryAction={{ label: 'Business profile', onClick: () => navigate('/business/profile') }}
          secondaryAction={{ label: 'Vendor center', onClick: () => navigate('/business/vendors') }}
        >
          {tab === 'overview' && (
            <FinelyUnifiedSection title="How fundability is built" subtitle="Sequencing beats random applications.">
              <ul className={`list-disc pl-5 ${FINELY_OS_ENTITY_BODY} space-y-2`}>
                <li>Establish a coherent commercial identity — name, address, phone, EIN, and domain must match everywhere.</li>
                <li>Open Tier 1 net-30 vendors that report before chasing revolving or high-limit products.</li>
                <li>Track bureau scores and tradeline depth — PAYDEX and Intelliscore move with payment behavior.</li>
                <li>Run lender logic before applications — protect personal and business inquiry budgets.</li>
              </ul>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                {[
                  { icon: Layers, t: 'Foundation', d: 'Entity + address + 411 + domain email' },
                  { icon: ShieldCheck, t: 'Sequence', d: 'Vendor tiers unlock as foundation completes' },
                  { icon: Crown, t: 'Capital', d: 'Doc package + relationships for underwriting' },
                ].map(({ icon: Icon, t, d }, idx) => (
                  <div key={t} className={`${finelyOsCatalogCard((['amber', 'emerald', 'violet'] as const)[idx % 3])} !p-4`} data-fc-accent={(['amber', 'emerald', 'violet'] as const)[idx % 3]}>
                    <Icon size={16} className="text-amber-700 mb-2" />
                    <div className={`font-semibold text-sm ${FINELY_OS_ENTITY_VALUE}`}>{t}</div>
                    <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{d}</p>
                  </div>
                ))}
              </div>
            </FinelyUnifiedSection>
          )}

          {tab === 'actions' && (
            <FinelyUnifiedSection title="Business credit modules" subtitle="Jump to any workstation.">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {MODULE_CARDS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.path} type="button" onClick={() => navigate(item.path)} className={`text-left !p-5 ${finelyOsCatalogCard(item.accent)}`} data-fc-accent={item.accent}>
                      <Icon size={16} className="text-amber-700 mb-2" />
                      <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{item.title}</div>
                      <div className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{item.body}</div>
                      <div className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-700">
                        {item.cta} <ArrowRight size={12} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </FinelyUnifiedSection>
          )}

          {tab === 'readiness' && (
            <div className="space-y-6">
              {partner ? <BusinessCreditLadderPanel partnerId={partner.id} /> : null}
              {partner ? <BusinessCreditRoadmapPanel partnerId={partner.id} /> : null}
              <BusinessReadinessChecklist />
            </div>
          )}

          {tab === 'workflow' && (
            <RoleWorkflowPanel roleId="business" compact completedSteps={businessWorkflowProgress} />
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
