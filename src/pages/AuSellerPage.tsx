import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CreditCard, Megaphone, ShoppingBag, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { CS_PUBLIC } from '../components/creditSpecialist/creditSpecialistPublicUi';
import {
  AU_SELLER,
  AU_SELLER_ACTIVATION_BULLETS,
  AU_SELLER_MARKETING_HEADLINE,
  AU_SELLER_OFFERINGS,
} from '../config/auSellerProgram';
import { signupUrlForRole } from '../lib/onboardingRoleRouting';
import { BackToSiteButton } from '../components/navigation/BackToSiteButton';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
} from '../features/os/finelyOsLightUi';

export default function AuSellerPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'AU sellers',
    description:
      'List authorized-user tradeline inventory on Finely — we market to buyers, you fulfill placements and track payouts.',
    path: AU_SELLER.publicPath,
  });

  const [laneTab, setLaneTab] = useState<'program' | 'economics' | 'start'>('program');
  const sellerSignupUrl = signupUrlForRole('au_seller', { next: AU_SELLER.hubPath }) ?? '/onboarding?lane=au_seller';

  return (
    <PageShell
      badge="Public"
      title={AU_SELLER.programName}
      subtitle="Supply tradelines — Finely markets to buyers and routes fulfillment."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center gap-4">
          <BackToSiteButton variant="ghost" label="Back to home" />
          <button type="button" onClick={() => navigate(sellerSignupUrl)} className={FINELY_OS_SUCCESS_BTN}>
            Start AU seller signup
          </button>
          <button type="button" onClick={() => navigate(AU_SELLER.hubPath)} className={FINELY_OS_PRIMARY_BTN}>
            Open {AU_SELLER.hubName}
          </button>
        </div>

        <CareersQuickNav active="au_sellers" className="mt-6" />

        <FinelyUnifiedHubLayout
          eyebrow={AU_SELLER.programName}
          title="AU tradeline sellers"
          subtitle="Program = marketplace & tools · Fees & pay = activation · Get started = join"
          accent="emerald"
          tabs={[
            { id: 'program', label: '① Program' },
            { id: 'economics', label: '② Fees & pay' },
            { id: 'start', label: '③ Get started' },
          ]}
          activeTab={laneTab}
          onTabChange={(id) => setLaneTab(id as typeof laneTab)}
          primaryAction={{ label: 'Start signup', onClick: () => navigate(sellerSignupUrl) }}
          secondaryAction={{ label: AU_SELLER.hubName, onClick: () => navigate(AU_SELLER.hubPath) }}
        >
          {laneTab === 'program' && (
            <>
              <div className={`space-y-5 ${finelyOsCatalogCard('emerald')} !p-8 sm:!p-10 border-2`} data-fc-accent="emerald">
                <p className={CS_PUBLIC.pageKicker}>AU seller program</p>
                <h2 className={CS_PUBLIC.pageTitle}>{AU_SELLER_MARKETING_HEADLINE}</h2>
                <p className={CS_PUBLIC.pageLead}>
                  You list verified tradeline inventory. Finely runs buyer marketing, intake, and order routing — you
                  fulfill placements and get paid. No ads or DMs required.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 text-center">
                  {[
                    { icon: Megaphone, label: 'Buyer marketing', sub: 'Finely brings demand' },
                    { icon: CreditCard, label: 'Your inventory', sub: 'list & rotate cards' },
                    { icon: Wallet, label: 'Payouts', sub: 'per fulfilled slot' },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="rounded-xl border-2 border-emerald-200 bg-white px-4 py-5">
                      <Icon className="mx-auto text-emerald-600 mb-2" size={28} />
                      <div className="text-base font-bold text-slate-900">{label}</div>
                      <div className="text-sm text-slate-500">{sub}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => setLaneTab('economics')} className={FINELY_OS_PRIMARY_BTN}>
                    See fees &amp; pay <ArrowRight size={16} />
                  </button>
                  <button type="button" onClick={() => navigate(AU_SELLER.marketplacePath)} className={FINELY_OS_SECONDARY_BTN}>
                    View buyer marketplace <ShoppingBag size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className={CS_PUBLIC.sectionKicker}>What you get</p>
                  <h3 className={`mt-2 ${CS_PUBLIC.sectionTitle}`}>Seller operating stack</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {AU_SELLER_OFFERINGS.map((offering) => (
                    <div key={offering.title} className={`${finelyOsCatalogCard('emerald')} !p-6 sm:!p-8 border-2 space-y-3`}>
                      <h4 className={CS_PUBLIC.cardTitle}>{offering.title}</h4>
                      <p className={CS_PUBLIC.body}>{offering.description}</p>
                      <ul className="space-y-2">
                        {offering.included.map((item) => (
                          <li key={item} className={`flex gap-2 ${CS_PUBLIC.bodySm}`}>
                            <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
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

          {laneTab === 'economics' && (
            <div className="space-y-8">
              <header className="space-y-4">
                <p className={CS_PUBLIC.pageKicker}>Fees &amp; pay</p>
                <h2 className={CS_PUBLIC.pageTitle}>How AU sellers earn</h2>
                <p className={CS_PUBLIC.pageLead}>
                  One-time activation gets your first marketing season. Ongoing earnings come from fulfilled buyer
                  placements — not from running dispute files.
                </p>
              </header>

              <div className={`${finelyOsCatalogCard('emerald')} !p-6 sm:!p-10 space-y-5`}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 text-center">
                    <div className={CS_PUBLIC.cardLabel}>Activation</div>
                    <div className={`${CS_PUBLIC.statHuge} text-emerald-700 mt-2`}>{AU_SELLER.startupFeeLabel}</div>
                    <div className={CS_PUBLIC.bodySm}>one-time · first {AU_SELLER.listingSeasonDays}-day season included</div>
                  </div>
                  <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 text-center">
                    <div className={CS_PUBLIC.cardLabel}>Typical commission</div>
                    <div className={`${CS_PUBLIC.statHuge} text-slate-800 mt-2`}>{AU_SELLER.defaultCommissionPct}%</div>
                    <div className={CS_PUBLIC.bodySm}>of placement fee · varies by listing</div>
                  </div>
                </div>
                <ul className="space-y-3">
                  {AU_SELLER_ACTIVATION_BULLETS.map((b) => (
                    <li key={b} className={`flex gap-2 ${CS_PUBLIC.body}`}>
                      <Check size={18} className="text-emerald-600 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <p className={FINELY_OS_ENTITY_BODY}>
                Running client restore or build files instead? That&apos;s the{' '}
                <button type="button" className="underline font-semibold text-violet-700" onClick={() => navigate('/credit-specialists')}>
                  Credit specialists
                </button>{' '}
                track — separate from AU supply.
              </p>
            </div>
          )}

          {laneTab === 'start' && (
            <div className={`space-y-6 ${finelyOsCatalogCard('emerald')} !p-8 sm:!p-10`}>
              <header className="space-y-3">
                <p className={CS_PUBLIC.sectionKicker}>Step 3</p>
                <h2 className={CS_PUBLIC.sectionTitle}>Join as an AU seller</h2>
                <p className={CS_PUBLIC.sectionLead}>
                  Create your account, complete seller onboarding, pay activation, and publish your first listings.
                </p>
              </header>
              <ol className={`${CS_PUBLIC.body} space-y-2 list-decimal pl-5`}>
                <li>Sign up with the AU seller role.</li>
                <li>Verify your supply-side profile and payout method.</li>
                <li>Pay {AU_SELLER.startupFeeLabel} — includes your first marketing season.</li>
                <li>Publish listings in {AU_SELLER.hubName} — Finely routes buyers to you.</li>
              </ol>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate(sellerSignupUrl)} className={FINELY_OS_PRIMARY_BTN}>
                  Start signup <ArrowRight size={16} />
                </button>
                <button type="button" onClick={() => navigate(AU_SELLER.hubPath)} className={FINELY_OS_SECONDARY_BTN}>
                  Already a seller? Open hub
                </button>
              </div>
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
          Tradeline supply involves issuer risk — follow marketplace rules and rotation best practices.
        </p>

        <MarketingStaffChatStrip
          roleId="support_specialist"
          goal="tradelines"
          roleLabel="AU marketplace specialist"
          subline="Questions about listing seasons, activation, or buyer fulfillment before you join?"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
