import React from 'react';
import { ArrowRight, CheckCircle2, Shield, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsLightMeshSection,
} from '../features/os/finelyOsLightUi';

const PHASES = [
  {
    n: 1,
    title: 'Intake & tri-bureau reports',
    body: 'Secure upload, identity verification, and evidence vault — the foundation lenders and Bridge origination expect.',
  },
  {
    n: 2,
    title: 'Restore & dispute sequencing',
    body: 'Round-disciplined disputes, bureau response tracking, and utilization stabilization before funding applications.',
  },
  {
    n: 3,
    title: 'Monitoring & fundability optics',
    body: 'Reporting-cycle discipline, score volatility control, and readiness scorecards aligned with underwriting optics.',
  },
  {
    n: 4,
    title: 'Fund-ready gate',
    body: 'When your file clears fund-ready, Finely Cred opens the Bridge export gate and queues underwriting tasks automatically.',
  },
  {
    n: 5,
    title: 'Bridge handoff & origination',
    body: 'Provider Gateway receives credit program context, ML funding path advisory, LEG-201 consent verification, and packet export v2.',
  },
];

const RESULTS = [
  'Structured 5-phase journey — not random dispute letters',
  'ML advisory v4 with funding path and pipeline insights',
  'Bridge connector with guided next steps at fund-ready',
  'Underwriting packet v2 embeds Finely Cred credit program for lenders',
  'Consent-aware handoff (LEG-201) before origination export',
];

export default function FinelyCredServicesPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Finely Cred — Credit program & Bridge handoff',
    description:
      'Five-phase credit restoration journey with fund-ready gate, ML advisory, and Bridge origination handoff for lending readiness.',
    path: '/services/finelycred',
  });

  return (
    <PageShell title="Finely Cred" subtitle="Credit program · Bridge handoff · Results-driven">
      <div className={FINELY_OS_PAGE}>
        <section className={`${finelyOsLightMeshSection()} py-10 px-4 md:px-8`}>
          <div className="max-w-3xl mx-auto text-center">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Finely Cred services</p>
            <h1 className={`text-3xl md:text-4xl font-bold mt-2 ${FINELY_OS_ENTITY_VALUE}`}>
              Credit program built for fund-ready Bridge handoff
            </h1>
            <p className={`mt-4 text-lg ${FINELY_OS_ENTITY_BODY}`}>
              A full five-phase journey from intake through disputes, monitoring, fund-ready, and Bridge origination — with ML advisory,
              consent gates, and underwriting packet export that lenders can actually use.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/onboarding')}>
                Start partner portal
                <ArrowRight size={16} className="inline ml-1" />
              </button>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/free-guide')}>
                Free dispute guide
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-10 space-y-4">
          <h2 className={`text-xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>Five-phase journey</h2>
          <div className="space-y-3">
            {PHASES.map((p) => (
              <div key={p.n} className={`${finelyOsCatalogCard('violet')} p-4 flex gap-4`}>
                <div className="shrink-0 h-10 w-10 rounded-full bg-violet-500/20 border border-violet-400/30 flex items-center justify-center font-bold text-violet-200">
                  {p.n}
                </div>
                <div>
                  <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{p.title}</div>
                  <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-8">
          <div className={`${finelyOsCatalogCard('emerald')} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-emerald-400" size={20} />
              <h2 className={`text-lg font-bold ${FINELY_OS_ENTITY_VALUE}`}>Bridge handoff & ML advisory v4</h2>
            </div>
            <p className={`text-sm mb-4 ${FINELY_OS_ENTITY_BODY}`}>
              At fund-ready, Finely Cred sets Bridge handoff timestamps, creates five underwriting tasks (pre-qual, ML funding path,
              lender match, LEG-201 consent, packet export), and returns bridge suggestions to Provider Gateway webhooks.
            </p>
            <ul className="space-y-2">
              {RESULTS.map((r) => (
                <li key={r} className={`flex items-start gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-8">
          <div className={`${finelyOsCatalogCard('amber')} p-6 flex flex-col md:flex-row gap-4 items-start`}>
            <Shield className="text-amber-400 shrink-0" size={28} />
            <div>
              <h2 className={`font-bold ${FINELY_OS_ENTITY_VALUE}`}>Consent & export gate</h2>
              <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Bridge packet export requires fund-ready phase. Non-admins see a clear blocker until the credit program phase clears.
                LEG-201 consent is verified before origination export. Admins can override via ops dashboard when appropriate.
              </p>
            </div>
          </div>
        </section>

        <MarketingStaffChatStrip
          roleId="funding_strategist"
          goal="personal"
          roleLabel="funding strategist"
          subline="Questions about fund-ready timing or Bridge handoff? Chat with our team."
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
