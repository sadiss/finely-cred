import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import { debtLegalPackages, formatPrice, type PricingPackage } from '../../config/pricingCatalog';
import { ServicePackageDetailModal } from '../../components/pricing/ServicePackageDetailModal';
import { usePreviewReveal } from '../../features/personalCredit/preview/usePreviewReveal';
import './debtLegalPreview.css';

const LIVE_PATH = '/pricing/debt-legal';

const MATTERS = [
  {
    key: 'collections',
    accent: 'rose' as const,
    label: 'Collections',
    title: 'Collectors calling or reporting',
    preview: 'Require proof of the debt before you pay, settle, or ignore it.',
    body: 'A collection file starts with validation. We help you send a dated request, keep the call log, and decide whether the item also needs a bureau dispute if it is reporting. Paying first is not the desk’s default move.',
  },
  {
    key: 'summons',
    accent: 'sky' as const,
    label: 'Summons',
    title: 'Court paper in hand',
    preview: 'Deadlines matter more than tone. The packet has to match the matter.',
    body: 'A summons is a calendar problem first. We organize the notice, the alleged account, and the response window so you are not guessing from a stack of envelopes. This desk is workflow support and education. Court representation stays with a licensed attorney when you need one.',
  },
  {
    key: 'foreclosure',
    accent: 'navy' as const,
    label: 'Foreclosure / repo',
    title: 'Housing or vehicle at risk',
    preview: 'High-balance matters need a thicker packet and a clearer sequence.',
    body: 'Foreclosure and repossession files need timelines, notices, and a packet sized to the balance. High-Balance and Custom exist for that depth. If the same debt is also on the bureau file, restore can run beside this desk — it does not replace it.',
  },
] as const;

const PACKAGE_FIT: Record<string, string> = {
  debt_kill_diy: 'You can write, mail, and log on your own and want the templates plus the briefcase.',
  debt_kill_starter_dfy: 'Early collections or one to two items under about $10,000 that need drafted validation.',
  debt_kill_pro: 'A mid-complexity file — multiple reporting items and a case manager on the packet.',
  debt_kill_high_balance: 'Serious balances, roughly $25,000–$100,000, that need sequenced multi-account work.',
  debt_kill_custom: 'A $100,000+ or multi-case file. We scope after intake instead of inventing a public sticker.',
};

const FAQ = [
  {
    q: 'What does validation actually do?',
    a: 'Validation asks the collector to prove they have the right to collect the debt they named. It creates a dated record. If the same item is on your credit file, a separate dispute path may also apply.',
  },
  {
    q: 'Is this a law firm?',
    a: 'No. Finely Cred provides education, letters, evidence organization, and done-for-you packet support. Court strategy and representation stay with a licensed attorney in your state when you need one.',
  },
  {
    q: 'How do I pick a package?',
    a: 'Match the balance and the number of active matters. DIY is tools. Starter is light DFY. Pro is the usual mid-file. High-Balance is the $25k–$100k lane. Custom is for $100k+ or multi-case work after a short intake.',
  },
  {
    q: 'When should I also look at personal credit restore?',
    a: 'Only when the same debt is reporting on Equifax, Experian, or TransUnion. Restore cleans the bureau file. This desk handles the collector, the summons, or the foreclosure packet. They can run together; they are not the same product.',
  },
];

function Reveal({ children }: { children: React.ReactNode }) {
  const { ref, className } = usePreviewReveal<HTMLDivElement>();
  return (
    <div ref={ref} data-reveal={className}>
      {children}
    </div>
  );
}

function priceLabel(pkg: PricingPackage): string {
  if (pkg.isCustomQuote) return 'Custom quote';
  return formatPrice(pkg.priceAmount);
}

export default function DebtLegalPreviewPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [matterKey, setMatterKey] = useState<(typeof MATTERS)[number]['key']>('collections');
  const [selectedId, setSelectedId] = useState('debt_kill_pro');
  const [detailPkg, setDetailPkg] = useState<PricingPackage | null>(null);

  const packages = useMemo(
    () => debtLegalPackages.filter((p) => p.isPublic).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [],
  );
  const selected = packages.find((p) => p.id === selectedId) ?? packages[0];
  const matter = MATTERS.find((item) => item.key === matterKey) ?? MATTERS[0];
  const stampReveal = usePreviewReveal<HTMLElement>(0.18);
  const [stampPulse, setStampPulse] = useState(true);

  useEffect(() => {
    setStampPulse(false);
    const timer = window.setTimeout(() => setStampPulse(true), 40);
    return () => window.clearTimeout(timer);
  }, [matterKey]);

  usePublicSeoMeta({
    title: 'Debt and legal | Finely Cred',
    description:
      'A validation desk for collections, summons, and foreclosure. Packets matched to the matter — education and workflow, not a generic inbox.',
    path: LIVE_PATH,
  });

  const checkout = (pkg: PricingPackage) => {
    if (pkg.isCustomQuote) {
      finelyCtaNavigate(navigate, 'debt_intake');
      return;
    }
    navigate(
      resolvePackageSelectPath({
        packageId: pkg.id,
        rail: pkg.rail === 'in_house' ? 'in_house' : pkg.rail === 'stripe' ? 'stripe' : undefined,
        isAuthed: Boolean(auth.user),
      }),
    );
  };

  const bookSession = () => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Debt & Legal' });
  const freeGuide = () => navigate('/free-debt-guide');
  const scrollPackages = () => document.getElementById('dl-prev-packages')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <PageShell
        hideHero
        hideLaunchHelpStrip
        surface="ivory"
        contentWidth="full"
        title="Finely Cred · Debt and legal"
      >
        <div data-fc-debt-preview="1">
          <header className="dl-prev-hero">
            <div className="dl-prev-inner dl-prev-hero__grid">
              <div>
                <p className="dl-prev-eyebrow">Validation desk · collections · summons · foreclosure</p>
                <h1 className="dl-prev-hero__title">
                  <span className="dl-prev-hero__brand">Finely Cred</span>
                  Debt and legal
                </h1>
                <p className="dl-prev-hero__sub">
                  Answer the collector from a <span>desk, not a panic.</span>
                </p>
                <p className="dl-prev-hero__lede">
                  Collections, a summons, and foreclosure are different matters. The first job is usually validation:
                  require proof of the debt, keep a dated file, and choose the packet that matches the balance and the
                  risk.
                </p>
                <div className="dl-prev-hero__actions">
                  <button type="button" className="dl-prev-btn-primary" onClick={scrollPackages}>
                    See packages <ArrowRight size={15} aria-hidden />
                  </button>
                  <button type="button" className="dl-prev-btn-secondary" onClick={bookSession}>
                    Book a session
                  </button>
                  <button type="button" className="dl-prev-btn-ghost" onClick={freeGuide}>
                    Free debt guide
                  </button>
                </div>
              </div>
              <aside
                ref={stampReveal.ref}
                className={`dl-docket${stampReveal.visible && stampPulse ? ' is-on' : ''}`}
                aria-label="Validation file"
              >
                <span className="dl-docket__tab">Matter file</span>
                <h3>Validation docket</h3>
                <p>The desk starts with the notice in front of you, then the packet that matches it.</p>
                <div className="dl-notice">
                  <span>{matter.label}</span>
                  <strong>{matter.title}</strong>
                  <p>{matter.preview}</p>
                </div>
                <div className="dl-stamp" aria-hidden>
                  Require
                  <br />
                  proof
                </div>
              </aside>
            </div>
          </header>

          <section className="dl-prev-section">
            <div className="dl-prev-inner">
              <Reveal>
                <p className="dl-prev-kicker">Three matters</p>
                <h2 className="dl-prev-h2">Start with the paper in front of you.</h2>
                <p className="dl-prev-lede">
                  Open the matter you actually have. The notice on the desk changes with it.
                </p>
              </Reveal>
              <div className="dl-prev-matters" style={{ marginTop: '1.75rem' }} role="tablist" aria-label="Debt matters">
                {MATTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={matterKey === item.key}
                    className={`dl-prev-matter dl-prev-matter--${item.accent}`}
                    onClick={() => setMatterKey(item.key)}
                  >
                    <em>{item.label}</em>
                    <strong>{item.title}</strong>
                    <p>{item.preview}</p>
                  </button>
                ))}
              </div>
              <article className="dl-prev-brief">
                <h3>{matter.title}</h3>
                <p>{matter.body}</p>
              </article>

              <div className="dl-papers">
                <p className="dl-prev-kicker">What the papers look like</p>
                <h2 className="dl-prev-h2">A summons and a complaint.</h2>
                <p className="dl-prev-lede">
                  The summons names the court, the parties, and the days you have to answer. The complaint is the claim
                  that arrives with it.
                </p>
                <div className="dl-papers__grid">
                  <article className="dl-paper dl-writ" aria-labelledby="dl-summons-title" aria-describedby="dl-papers-note">
                    <header className="dl-writ__court">
                      <p>IN THE COUNTY COURT OF THE ELEVENTH JUDICIAL CIRCUIT</p>
                      <p>IN AND FOR MIAMI-DADE COUNTY, FLORIDA</p>
                      <p>CIVIL DIVISION</p>
                    </header>
                    <div className="dl-writ__caption">
                      <div className="dl-writ__parties">
                        <p>MIDLAND CREDIT MANAGEMENT, INC.,</p>
                        <p className="dl-writ__role">Plaintiff,</p>
                        <p className="dl-writ__vs">v.</p>
                        <p>ELENA R. BAPTISTE,</p>
                        <p className="dl-writ__role">Defendant.</p>
                      </div>
                      <div className="dl-writ__case">
                        <p>
                          Case No. <strong>2024-018472-CC-23</strong>
                        </p>
                        <p>Division 05</p>
                      </div>
                    </div>
                    <h3 id="dl-summons-title" className="dl-writ__title">
                      SUMMONS
                    </h3>
                    <p className="dl-writ__state">THE STATE OF FLORIDA:</p>
                    <p>To Each Sheriff of the State:</p>
                    <p>
                      YOU ARE COMMANDED to serve this summons and a copy of the complaint in this action on Defendant:
                    </p>
                    <p className="dl-writ__serve">
                      Elena R. Baptiste
                      <br />
                      1842 NW 17th Avenue
                      <br />
                      Miami, Florida 33125
                    </p>
                    <p>
                      Each defendant is required to serve written defenses to the complaint on Plaintiff&apos;s attorney,
                      whose name and address appear below, within <strong>20 days</strong> after service of this summons,
                      exclusive of the day of service, and to file the original of the defenses with the Clerk of this
                      Court either before service on Plaintiff&apos;s attorney or immediately thereafter. If a defendant
                      fails to do so, a default will be entered against that defendant for the relief demanded in the
                      complaint.
                    </p>
                    <p>
                      <strong>IMPORTANT.</strong> A lawsuit has been filed against you. You have 20 calendar days after
                      this summons is served on you to file a written response to the attached complaint with this court
                      and to serve a copy on Plaintiff&apos;s attorney. A phone call does not protect you. You may want
                      to call an attorney right away. If you do not file your response on time, you may lose the case,
                      and your wages, money, and property may later be taken without further warning from the court.
                    </p>
                    <p>DATED this 14th day of March, 2024.</p>
                    <div className="dl-writ__clerk">
                      <div className="dl-writ__seal" aria-hidden>
                        <span>CLERK</span>
                        <small>Miami-Dade County</small>
                      </div>
                      <div className="dl-writ__sign">
                        <p>Clerk of the Court</p>
                        <p>Miami-Dade County, Florida</p>
                        <p className="dl-writ__line">By: ___________________________</p>
                        <p>Deputy Clerk</p>
                      </div>
                    </div>
                    <p className="dl-writ__counsel">
                      Rivas &amp; Hale, P.A.
                      <br />
                      200 South Biscayne Boulevard, Suite 3100
                      <br />
                      Miami, Florida 33131
                      <br />
                      (305) 555-0148
                      <br />
                      Attorneys for Plaintiff
                    </p>
                  </article>
                  <article className="dl-paper dl-writ" aria-labelledby="dl-complaint-title" aria-describedby="dl-papers-note">
                    <header className="dl-writ__court">
                      <p>IN THE COUNTY COURT OF THE ELEVENTH JUDICIAL CIRCUIT</p>
                      <p>IN AND FOR MIAMI-DADE COUNTY, FLORIDA</p>
                      <p>CIVIL DIVISION</p>
                    </header>
                    <div className="dl-writ__caption">
                      <div className="dl-writ__parties">
                        <p>MIDLAND CREDIT MANAGEMENT, INC.,</p>
                        <p className="dl-writ__role">Plaintiff,</p>
                        <p className="dl-writ__vs">v.</p>
                        <p>ELENA R. BAPTISTE,</p>
                        <p className="dl-writ__role">Defendant.</p>
                      </div>
                      <div className="dl-writ__case">
                        <p>
                          Case No. <strong>2024-018472-CC-23</strong>
                        </p>
                        <p>Division 05</p>
                      </div>
                    </div>
                    <h3 id="dl-complaint-title" className="dl-writ__title">
                      COMPLAINT
                    </h3>
                    <p>Plaintiff Midland Credit Management, Inc. sues Defendant Elena R. Baptiste and alleges:</p>
                    <ol className="dl-writ__counts">
                      <li>
                        This is an action for damages that exceed $8,000.00, exclusive of interest, costs, and
                        attorney&apos;s fees, and that do not exceed $50,000.00.
                      </li>
                      <li>
                        Plaintiff is a Delaware corporation. Defendant is an individual residing in Miami-Dade County,
                        Florida. Venue is proper in this Court.
                      </li>
                      <li>
                        On or about June 11, 2019, Defendant opened a credit-card account with Capital One, N.A.,
                        account ending 4418.
                      </li>
                      <li>
                        Defendant defaulted on the account. The last payment posted on January 7, 2023.
                      </li>
                      <li>
                        Plaintiff purchased the account from Capital One, N.A. and is the current owner entitled to
                        collect the balance.
                      </li>
                      <li>
                        The principal balance due is $4,817.36, plus interest as allowed by the agreement and by law.
                        Despite demand, Defendant has failed to pay.
                      </li>
                    </ol>
                    <p>
                      WHEREFORE, Plaintiff demands judgment against Defendant for $4,817.36, plus interest, court costs,
                      and such other relief as this Court deems proper.
                    </p>
                    <p className="dl-writ__exhibits">
                      Exhibits: Account summary attached. Bill of sale attached.
                    </p>
                    <p className="dl-writ__counsel">
                      Respectfully submitted,
                      <br />
                      Rivas &amp; Hale, P.A.
                      <br />
                      200 South Biscayne Boulevard, Suite 3100
                      <br />
                      Miami, Florida 33131
                      <br />
                      Attorneys for Plaintiff
                    </p>
                  </article>
                </div>
                <p className="dl-prev-compliance" id="dl-papers-note">
                  These are fictional, redacted teaching copies — not a partner’s court papers.
                </p>
              </div>
            </div>
          </section>

          <section className="dl-prev-section dl-prev-section--tight">
            <div className="dl-prev-inner">
              <p className="dl-prev-kicker">Why validation</p>
              <h2 className="dl-prev-h2">Proof first, then the packet that matches it.</h2>
              <div className="dl-prev-desk" style={{ marginTop: '1.5rem' }}>
                <article className="dl-prev-desk__card dl-prev-desk__card--rose">
                  <h3>Require the collector to prove the debt.</h3>
                  <p>
                    Validation is an FDCPA-adjacent first move: a dated letter that asks for ownership, amount, and
                    the right to collect. It gives you a file. Court deadlines still stand on their own. We write and
                    track that letter on done-for-you packages; the do-it-yourself kit gives you the templates and the
                    log.
                  </p>
                </article>
                <article className="dl-prev-desk__card dl-prev-desk__card--sky">
                  <h3>Match the package to the balance.</h3>
                  <p>
                    Do-it-yourself fits any balance if you will do the work. Starter is lighter files. Pro is the
                    mid-complexity desk. High-Balance is the $25,000–$100,000 lane. Custom is scoped after intake for
                    $100,000+ or multi-case files. The queue on this page is that map.
                  </p>
                </article>
              </div>
              <p className="dl-prev-compliance">Court dates still stand on their own calendar.</p>
            </div>
          </section>

          <section className="dl-prev-section" id="dl-prev-packages">
            <div className="dl-prev-inner">
              <p className="dl-prev-kicker">Packages</p>
              <h2 className="dl-prev-h2">Pick a packet. See what you purchase.</h2>
              <p className="dl-prev-lede">
                Open a row to see who it is for, what is in the packet, and the price. A custom quote opens debt intake
                instead of a public price.
              </p>
              <div className="dl-prev-queue" style={{ marginTop: '1.75rem' }}>
                <div className="dl-prev-queue__list" role="listbox" aria-label="Debt packages">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      role="option"
                      aria-selected={selected?.id === pkg.id}
                      className="dl-prev-queue__item"
                      onClick={() => setSelectedId(pkg.id)}
                    >
                      <strong>{pkg.name}</strong>
                      <span>
                        {priceLabel(pkg)}
                        {pkg.debtBalanceGuidance?.label ? ` · ${pkg.debtBalanceGuidance.label}` : ''}
                      </span>
                    </button>
                  ))}
                </div>
                {selected ? (
                  <article className="dl-prev-showcase">
                    <div className="dl-prev-showcase__price">{priceLabel(selected)}</div>
                    <h3 className="dl-prev-showcase__name">{selected.name}</h3>
                    <p className="dl-prev-showcase__fit">
                      <span>Who it is for</span>
                      {PACKAGE_FIT[selected.id] ?? selected.tagline}
                    </p>
                    <ul className="dl-prev-showcase__list">
                      {(selected.highlights ?? []).slice(0, 5).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="dl-prev-showcase__actions">
                      <button type="button" className="dl-prev-btn-primary" onClick={() => checkout(selected)}>
                        {selected.isCustomQuote ? 'Start custom intake' : 'Select this packet'}{' '}
                        <ArrowRight size={15} aria-hidden />
                      </button>
                      <button type="button" className="dl-prev-btn-secondary" onClick={() => setDetailPkg(selected)}>
                        <Info size={14} aria-hidden /> What&apos;s included
                      </button>
                    </div>
                  </article>
                ) : null}
              </div>
            </div>
          </section>

          <section className="dl-prev-section dl-prev-section--tight">
            <div className="dl-prev-inner">
              <p className="dl-prev-kicker">Questions</p>
              <h2 className="dl-prev-h2">Straight answers before you choose a packet</h2>
              <div className="dl-prev-faq">
                {FAQ.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="dl-prev-section dl-prev-section--tight">
            <div className="dl-prev-inner">
              <div className="dl-prev-final">
                <h2>Put the notice on the desk.</h2>
                <p>
                  Get the free guide if you need the map tonight. Choose a packet if you already know the matter.
                  Book a session when the paper is a summons, a foreclosure, or more than one account.
                </p>
                <div className="dl-prev-final__actions">
                  <button type="button" className="dl-prev-btn-primary" onClick={scrollPackages}>
                    See packages <ArrowRight size={15} aria-hidden />
                  </button>
                  <button type="button" className="dl-prev-btn-secondary" onClick={freeGuide}>
                    Free debt guide
                  </button>
                  <button type="button" className="dl-prev-btn-ghost" onClick={bookSession}>
                    Book a session
                  </button>
                </div>
              </div>
              <div className="dl-prev-exits" style={{ marginTop: '1.5rem' }}>
                <Link className="dl-prev-exit dl-prev-exit--rose" to="/free-debt-guide">
                  <strong>Free debt guide</strong>
                  <span>Cover preview on this page. The full reader opens when you start the guide.</span>
                </Link>
                <button type="button" className="dl-prev-exit dl-prev-exit--sky" onClick={bookSession}>
                  <strong>Book a session</strong>
                  <span>Walk the notice with a specialist before you pick a packet.</span>
                </button>
                <Link className="dl-prev-exit dl-prev-exit--navy" to="/pricing/personal-credit-restore">
                  <strong>Personal credit restore</strong>
                  <span>Only if this debt is also on the bureau file. That is a different product.</span>
                </Link>
              </div>
              <p className="dl-prev-compliance">Results vary · not legal advice · funding subject to underwriting</p>
              <div className="dl-prev-page-end" />
            </div>
          </section>
        </div>
      </PageShell>
      <ServicePackageDetailModal
        pkg={detailPkg}
        onClose={() => setDetailPkg(null)}
        onSelect={(packageId) => {
          const pkg = packages.find((item) => item.id === packageId) ?? null;
          setDetailPkg(null);
          if (pkg) checkout(pkg);
        }}
        selectLabel="Select packet"
      />
    </>
  );
}
