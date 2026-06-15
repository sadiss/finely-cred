import React, { useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { BusinessNav } from '../../components/business/BusinessNav';
import { BusinessCommandStrip } from '../../components/business/BusinessCommandStrip';
import { LenderLogicEngine } from '../../components/dashboard';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

type FundingTab = 'engine' | 'guide';

export default function BusinessFundingPage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();
  const [tab, setTab] = useState<FundingTab>('engine');
  const [score, setScore] = useState(680);
  const [utilization, setUtilization] = useState(9);
  const [revenue, setRevenue] = useState(12000);
  const [timeMonths, setTimeMonths] = useState(12);
  const [zip, setZip] = useState('');
  const [hasRelationship, setHasRelationship] = useState(false);
  const [willingToOpenDeposits, setWillingToOpenDeposits] = useState(true);
  const [noDocPreference, setNoDocPreference] = useState(true);

  const inputs = useMemo(
    () => ({
      score,
      utilizationPct: utilization,
      revenueMonthly: revenue,
      timeInBusinessMonths: timeMonths,
    }),
    [score, utilization, revenue, timeMonths],
  );

  return (
    <PageShell
      badge="Business Portal"
      title="Lender Logic Engine"
      subtitle="AI‑assisted underwriting analysis: lender fit, readiness signals, and next‑best actions across multiple banks."
    >
      <div className={FINELY_OS_PAGE}>
        <BusinessNav />
        <BusinessCommandStrip partner={partner ?? null} />

        <FinelyUnifiedHubLayout
          eyebrow="Business credit OS"
          title="Lender Logic Engine"
          subtitle="Model lender fit, readiness signals, and next-best actions before you apply."
          accent="amber"
          kpis={[
            { label: 'Score model', value: String(score), accent: 'violet' },
            { label: 'Utilization', value: `${utilization}%`, accent: 'amber' },
          ]}
          tabs={[
            { id: 'engine', label: 'Engine' },
            { id: 'guide', label: 'Next steps' },
          ]}
          activeTab={tab}
          onTabChange={(id) => setTab(id as FundingTab)}
          primaryAction={{ label: 'Billion Path', onClick: () => navigate('/business/billion-path') }}
          secondaryAction={{ label: 'Book session', onClick: () => navigate('/consultation?lane=' + encodeURIComponent('Business Credit')) }}
        >
          {tab === 'guide' && (
            <div className={`${finelyOsCatalogCard('amber')} !p-6 space-y-4`} data-fc-accent="amber">
              <div className="inline-flex items-center gap-2 text-amber-700">
                <Sparkles size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Underwriting optics</span>
              </div>
              <div className={FINELY_OS_ENTITY_BODY}>
                Use the Engine tab to model lender fit. Small changes (utilization, time-in-business, revenue consistency) can shift approvals and limits dramatically.
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setTab('engine')} className={FINELY_OS_PRIMARY_BTN}>
                  Open engine <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/business/vendors')} className={FINELY_OS_SECONDARY_BTN}>
                  Vendor sequencing
                </button>
              </div>
            </div>
          )}

          {tab === 'engine' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-4 min-w-0 ${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Inputs</div>
            <div className={`space-y-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Credit score</div>
                <input type="number" value={score} min={300} max={850} onChange={(e) => setScore(parseInt(e.target.value || '680', 10))} className={FINELY_OS_ENTITY_INPUT} />
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Utilization %</div>
                <input type="number" value={utilization} min={0} max={100} onChange={(e) => setUtilization(parseInt(e.target.value || '0', 10))} className={FINELY_OS_ENTITY_INPUT} />
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Monthly revenue (est.)</div>
                <input type="number" value={revenue} min={0} onChange={(e) => setRevenue(parseInt(e.target.value || '0', 10))} className={FINELY_OS_ENTITY_INPUT} />
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Time in business (months)</div>
                <input type="number" value={timeMonths} min={0} onChange={(e) => setTimeMonths(parseInt(e.target.value || '0', 10))} className={FINELY_OS_ENTITY_INPUT} />
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>ZIP (local picks within 50 miles)</div>
                <input value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} className={`${FINELY_OS_ENTITY_INPUT} font-mono`} placeholder="e.g. 75201" />
              </label>
              {[
                { label: 'Existing relationship', hint: 'You already bank with a local institution', checked: hasRelationship, set: setHasRelationship },
                { label: 'Willing to open deposits', hint: 'Relationship + deposits lane', checked: willingToOpenDeposits, set: setWillingToOpenDeposits },
                { label: 'No‑doc preference', hint: 'Prioritize relationship/no‑doc leaning options', checked: noDocPreference, set: setNoDocPreference },
              ].map((row) => (
                <label key={row.label} className={`flex items-center justify-between gap-3 ${finelyOsInlineListItem()}`}>
                  <div>
                    <div className={FINELY_OS_ENTITY_LABEL}>{row.label}</div>
                    <div className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{row.hint}</div>
                  </div>
                  <input type="checkbox" checked={row.checked} onChange={(e) => row.set(e.target.checked)} className="accent-violet-600" />
                </label>
              ))}
            </div>
            <div className={FINELY_OS_NOTICE_WARN}>Tip: tune utilization + revenue consistency first—then re-run analysis for higher approvals.</div>
          </div>

          <div className="lg:col-span-8 min-w-0">
            <LenderLogicEngine
              userScore={inputs.score}
              utilizationPct={inputs.utilizationPct}
              revenueMonthly={inputs.revenueMonthly}
              timeInBusinessMonths={inputs.timeInBusinessMonths}
              zip={zip}
              radiusMiles={50}
              hasRelationship={hasRelationship}
              willingToOpenDeposits={willingToOpenDeposits}
              noDocPreference={noDocPreference}
            />
          </div>
        </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
