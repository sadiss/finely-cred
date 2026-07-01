import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { CareersQuickNav } from '../../components/careers/CareersQuickNav';
import { AgencyPartnersCareerGuide } from '../../components/agency/AgencyPartnersCareerGuide';
import { CS_PUBLIC } from '../../components/creditSpecialist/creditSpecialistPublicUi';
import { AGENCY, AGENCY_OFFERINGS } from '../../config/agencyPartnersProgram';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export default function AgencyPartnersPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Agency partners',
    description:
      'Launch a branded credit services agency on Finely OS — white-label tenant, team seats, compliance workflows, and capacity tiers.',
    path: AGENCY.publicPath,
  });

  const [laneTab, setLaneTab] = useState<'program' | 'economics' | 'signup'>('program');

  return (
    <PageShell
      badge="Public"
      title={AGENCY.programName}
      subtitle="Company-level partnership — your brand, your team, Finely powers the operating system."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Home
          </a>
          <button type="button" onClick={() => navigate(AGENCY.signupPath)} className={FINELY_OS_SUCCESS_BTN}>
            Agency workspace signup
          </button>
        </div>

        <CareersQuickNav active="agency_partners" className="mt-6" />

        <FinelyUnifiedHubLayout
          eyebrow={AGENCY.programName}
          title="Agency partner program"
          subtitle="Program & stack = your company OS · Tiers & pay = capacity & splits · Sign up = create tenant"
          accent="amber"
          tabs={[
            { id: 'program', label: '① Program & stack' },
            { id: 'economics', label: '② Tiers & pay' },
            { id: 'signup', label: '③ Sign up' },
          ]}
          activeTab={laneTab}
          onTabChange={(id) => setLaneTab(id as typeof laneTab)}
          primaryAction={{ label: 'Create agency workspace', onClick: () => navigate(AGENCY.signupPath) }}
          secondaryAction={{ label: 'Credit specialists', onClick: () => navigate('/credit-specialists') }}
        >
          {laneTab === 'program' && (
            <>
              <div className={`space-y-5 ${finelyOsCatalogCard('amber')} !p-8 sm:!p-10 border-2`} data-fc-accent="amber">
                <p className={CS_PUBLIC.pageKicker}>Agency partner program</p>
                <h2 className={CS_PUBLIC.pageTitle}>Own a branded credit services company</h2>
                <p className={CS_PUBLIC.pageLead}>
                  <strong className="text-slate-900">Agency partner</strong> = you run a tenant with team seats, client
                  routing, and white-label portal. This is not the solo credit specialist apprenticeship — that&apos;s a
                  separate track.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 text-center">
                  {[
                    { n: 'Tenant', label: 'Your company', sub: 'branded workspace' },
                    { n: 'Seats', label: 'Team capacity', sub: 'per tier' },
                    { n: 'WL', label: 'White-label', sub: 'co-brand → enterprise' },
                  ].map((x) => (
                    <div key={x.label} className="rounded-xl border-2 border-amber-200 bg-white px-4 py-5">
                      <div className="text-3xl sm:text-4xl font-black text-amber-700">{x.n}</div>
                      <div className="mt-1 text-base font-bold text-slate-900">{x.label}</div>
                      <div className="text-sm text-slate-500">{x.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setLaneTab('economics')} className={FINELY_OS_PRIMARY_BTN}>
                    See tiers &amp; pay <ArrowRight size={16} />
                  </button>
                  <button type="button" onClick={() => navigate(AGENCY.signupPath)} className={FINELY_OS_SECONDARY_BTN}>
                    Sign up workspace
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className={CS_PUBLIC.sectionKicker}>What you get</p>
                  <h3 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>Agency operating stack</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {AGENCY_OFFERINGS.map((offering) => (
                    <div key={offering.title} className={`${finelyOsCatalogCard('amber')} !p-6 sm:!p-8 border-2 space-y-3`}>
                      <h4 className={CS_PUBLIC.cardTitle}>{offering.title}</h4>
                      <p className={CS_PUBLIC.body}>{offering.description}</p>
                      <ul className="space-y-2">
                        {offering.included.map((item) => (
                          <li key={item} className={`flex gap-2 ${CS_PUBLIC.bodySm}`}>
                            <Check size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {laneTab === 'economics' && <AgencyPartnersCareerGuide />}

          {laneTab === 'signup' && (
            <div className={`space-y-6 ${finelyOsCatalogCard('amber')} !p-8 sm:!p-10`}>
              <header className="space-y-3">
                <p className={CS_PUBLIC.sectionKicker}>Step 3</p>
                <h2 className={CS_PUBLIC.sectionTitle}>Create your agency workspace</h2>
                <p className={CS_PUBLIC.sectionLead}>
                  Sign in or create a Finely account, then provision your tenant — agency name, tier, and branding.
                </p>
              </header>
              <ul className={`${CS_PUBLIC.body} space-y-2 list-disc pl-5`}>
                <li>Pick a capacity tier (you can upgrade later).</li>
                <li>Set your agency name and white-label preferences.</li>
                <li>Invite team seats and route customers into your portal.</li>
              </ul>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate(AGENCY.signupPath)} className={FINELY_OS_PRIMARY_BTN}>
                  Open agency signup <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => navigate('/credit-specialists')} className={FINELY_OS_SECONDARY_BTN}>
                  Solo specialist instead?
                </button>
              </div>
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-5 flex gap-4">
                <Building2 className="text-amber-600 shrink-0" size={28} />
                <p className={CS_PUBLIC.bodySm}>
                  Agency signup requires a Finely login. If you only want to run your own client files without a company
                  tenant, use the Credit specialists track instead.
                </p>
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
          Results vary · not legal advice · agency partners are independent operators, not employees.
        </p>

        <MarketingStaffChatStrip
          roleId="lead_converter"
          goal="business"
          roleLabel="agency onboarding specialist"
          subline="Questions about white-label tiers, tenant setup, or team seats before you sign up?"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
