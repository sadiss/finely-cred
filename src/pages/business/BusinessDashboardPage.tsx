import React, { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Building2, Crown, Layers, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessReadinessChecklist } from '../../components/business/BusinessReadinessChecklist';
import { BusinessCommandStrip } from '../../components/business/BusinessCommandStrip';
import { BusinessNav } from '../../components/business/BusinessNav';
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
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_PAGE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type BizTab = 'overview' | 'actions' | 'readiness' | 'workflow';

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

  const kpis = useMemo(
    () => [
      { label: 'Foundation', value: 'Entity + EIN', hint: 'Profile hygiene first', accent: 'amber' as const },
      { label: 'Vendor stack', value: '3–5 seq', hint: 'Reporting vendors', accent: 'fuchsia' as const },
      { label: 'Lender logic', value: 'Model fit', hint: 'When file is green', accent: 'emerald' as const },
      { label: 'Capital', value: 'Doc package', hint: 'Underwriting ready', accent: 'violet' as const },
    ],
    [],
  );

  return (
    <PageShell
      badge="Business Portal"
      title="Business Dashboard"
      subtitle="Fundability, structure, and vendor sequencing — one tab at a time."
    >
      <div className={FINELY_OS_PAGE}>
        <BusinessNav />
        <BusinessCommandStrip partner={partner ?? null} />

        <FinelyNoticedStrip
          items={buildBusinessNoticedItems({
            tab,
            workflowStepsComplete: businessWorkflowProgress.size,
            workflowStepsTotal: ROLE_WORKFLOWS.business?.steps.length ?? 4,
          })}
        />
        <FinelyNowDoThisStrip currentIndex={tab === 'readiness' ? 0 : tab === 'actions' ? 1 : 0} />

        <FinelyUnifiedHubLayout
          eyebrow="Business credit OS"
          title="Build EIN fundability with sequencing, not luck"
          subtitle="Profile → vendors → lender logic → docs. Deeper panels stay in their tabs."
          accent="amber"
          kpis={kpis}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'actions', label: 'Fast actions' },
            { id: 'readiness', label: 'Readiness' },
            { id: 'workflow', label: 'Workflow' },
          ]}
          activeTab={tab}
          onTabChange={(id) => selectTab(id as BizTab)}
          primaryAction={{ label: 'Business profile', onClick: () => navigate('/business/profile') }}
          secondaryAction={{ label: 'Fundability hub', onClick: () => navigate('/fundability-readiness') }}
        >
          {tab === 'overview' && (
            <FinelyUnifiedSection title="What this portal does" subtitle="Your EIN execution layer.">
              <ul className={`list-disc pl-5 ${FINELY_OS_ENTITY_BODY} space-y-2`}>
                <li>Turns your business into a fundable profile with its own bureau signals.</li>
                <li>Keeps sequencing clean: profile → vendors → lender logic → documents.</li>
                <li>Single checklist you can execute without guessing next steps.</li>
              </ul>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                {[
                  { icon: Layers, t: 'Foundation', d: 'Entity + address hygiene + compliance signals' },
                  { icon: ShieldCheck, t: 'Sequence', d: 'Vendor stack → credit products when ready' },
                  { icon: Crown, t: 'Capital readiness', d: 'Docs + relationships + underwriting package' },
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
            <FinelyUnifiedSection title="Fast actions" subtitle="Jump to the module you need.">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { path: '/business/profile', title: 'Complete business profile', body: 'Entity, address, NAICS, compliance signals.', cta: 'Open profile', icon: Building2 },
                  { path: '/business/vendors', title: 'Vendor center', body: 'Sequenced vendor stack with readiness discipline.', cta: 'Open vendors', icon: Target },
                  { path: '/business/lender-logic', title: 'Run Lender Logic', body: 'Model lender fit and generate next-best actions.', cta: 'Open engine', icon: Sparkles },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  const accent = (['fuchsia', 'emerald', 'sky'] as const)[idx % 3];
                  return (
                    <button key={item.path} type="button" onClick={() => navigate(item.path)} className={`text-left !p-5 ${finelyOsCatalogCard(accent)}`} data-fc-accent={accent}>
                      <Icon size={16} className="text-fuchsia-700 mb-2" />
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
