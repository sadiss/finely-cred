import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, HelpCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsInlineListItem,
} from '../features/os/finelyOsLightUi';

type FaqItem = {
  id: string;
  q: string;
  a: React.ReactNode;
  searchText: string;
};

const muted = FINELY_OS_ENTITY_SUBLABEL;
const codeChip = 'px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs text-emerald-200';

export default function FaqPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'FAQ',
    description: 'Answers about credit restore, disputes, tradelines, billing, and the Finely Cred platform.',
    path: '/faq',
  });
  const [openId, setOpenId] = useState<string | null>('getting-started');
  const [query, setQuery] = useState('');

  const items = useMemo<FaqItem[]>(
    () => [
      {
        id: 'what-is-credit-repair',
        q: 'What is credit repair?',
        searchText: 'what is credit repair definition disputes errors inaccuracies bureaus furnishers',
        a: (
          <div className="space-y-2">
            <p>
              Credit repair is the process of identifying potentially inaccurate, incomplete, duplicated, or outdated information on your credit
              reports and challenging it through the appropriate channels (credit bureaus and/or furnishers).
            </p>
            <p className={muted}>
              Important: accurate and properly verified information may remain on a report. Credit repair is not a promise of score increase or
              deletion of accurate items.
            </p>
          </div>
        ),
      },
      {
        id: 'getting-started',
        q: 'How do I get started?',
        searchText: 'how do i get started onboarding intake credit report tradelines evidence',
        a: (
          <div className="space-y-2">
            <p>
              Start with onboarding/intake, then upload your credit report(s) in the Partner Portal. From there you’ll see detected
              tradelines, dispute candidates, and an evidence checklist.
            </p>
            <p className={muted}>
              Shortcut: go to <code className={codeChip}>/onboarding</code>.
            </p>
          </div>
        ),
      },
      {
        id: 'reports',
        q: 'What credit reports can I upload?',
        searchText: 'credit reports upload html pdf parser tradelines scanned',
        a: (
          <div className="space-y-2">
            <p>
              You can upload HTML or PDF credit reports. The parser extracts tradelines and highlights dispute angles (e.g. inconsistent
              dates, balances, or status codes).
            </p>
            <p className={muted}>
              Tip: if the PDF is scanned, upload the best-quality version available or export a text-based PDF if possible.
            </p>
          </div>
        ),
      },
      {
        id: 'evidence',
        q: 'What kind of evidence should I upload?',
        searchText: 'evidence upload id proof address receipts statements bureau letters documents',
        a: (
          <div className="space-y-2">
            <p>
              Upload anything that supports your dispute position: ID + proof of address, payment receipts, account statements, creditor
              letters, police/FTC reports (identity theft), and bureau mail responses.
            </p>
            <p className={muted}>Store documents in the Documents Vault so they can be attached to disputes and support threads.</p>
          </div>
        ),
      },
      {
        id: 'credit-repair-disclaimer',
        q: 'Is this legal advice? Do you guarantee results?',
        searchText: 'legal advice law firm attorney educational information guarantee results refund',
        a: (
          <div className="space-y-2">
            <p>
              No—Finely Cred is not a law firm and does not provide legal advice. We provide educational information, software tools, templates,
              and workflow support.
            </p>
            <p className={muted}>
              Results vary by file and bureau responses. We do not guarantee deletions, approvals, or specific score increases.
            </p>
          </div>
        ),
      },
      {
        id: 'what-can-be-removed',
        q: 'Can accurate negative items be removed?',
        searchText: 'accurate negatives removed delete accurate items fair credit reporting act fcrA',
        a: (
          <div className="space-y-2">
            <p>
              In general, accurate and properly verified information can remain on your reports for the reporting period allowed by law/policy.
              Disputes are typically focused on accuracy, completeness, duplications, outdated reporting, and verification.
            </p>
            <p className={muted}>If you believe an item is inaccurate or incomplete, document it and dispute it appropriately.</p>
          </div>
        ),
      },
      {
        id: 'how-long-does-it-take',
        q: 'How long does credit repair take?',
        searchText: 'timeline how long does it take 30 days 45 days rounds bureau response',
        a: (
          <div className="space-y-2">
            <p>
              Timelines vary. Many workflows operate in rounds: gather documentation, submit challenges, wait for responses, then follow up or
              escalate when appropriate.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Some updates can appear in 30–45 days, but complex files can take longer.</li>
              <li>Consistency matters: evidence discipline, deadlines, and tracking improve outcomes.</li>
            </ul>
            <p className={muted}>We focus on execution quality and sequencing, not “instant fixes.”</p>
          </div>
        ),
      },
      {
        id: 'will-disputes-hurt-score',
        q: 'Will disputing items hurt my score?',
        searchText: 'disputes hurt score impact fico vantage score drops inquiries',
        a: (
          <div className="space-y-2">
            <p>
              Disputing an item does not automatically lower your score. Scores can change when the underlying report data changes (for example,
              an account updates, balances shift, or an item is removed/updated).
            </p>
            <p className={muted}>
              If you’re about to apply for credit, consider timing and strategy—especially around utilization and new inquiries.
            </p>
          </div>
        ),
      },
      {
        id: 'restore-vs-building',
        q: 'What’s the difference between Credit Restore vs Credit Building?',
        searchText: 'restore vs building difference cleanup strengthening thin file utilization installment',
        a: (
          <div className="space-y-2">
            <p>
              <strong>Restore</strong> focuses on cleanup: disputing inaccurate/negative reporting, fixing inconsistencies, and improving profile
              stability.
            </p>
            <p>
              <strong>Building</strong> focuses on strengthening: adding/optimizing positive reporting, utilization strategy, and long-term
              maintenance habits.
            </p>
            <p className={muted}>Many partners do Restore first, then transition into Building once the file stabilizes.</p>
          </div>
        ),
      },
      {
        id: 'late-payments',
        q: 'Can late payments be disputed?',
        searchText: 'late payments dispute goodwill inaccurate delinquency',
        a: (
          <div className="space-y-2">
            <p>
              Sometimes—if the reporting is inaccurate, incomplete, duplicated, or not properly verified. If the late payment is accurate, you
              may explore goodwill or other options, but outcomes vary.
            </p>
            <p className={muted}>Document everything and keep a clear timeline of statements, receipts, and communications.</p>
          </div>
        ),
      },
      {
        id: 'identity-theft',
        q: 'What if I’m dealing with identity theft?',
        searchText: 'identity theft ftc police report fraud alert freeze disputes',
        a: (
          <div className="space-y-2">
            <p>If you suspect identity theft, prioritize safety first: secure accounts, set alerts, and document the event.</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Consider a fraud alert or credit freeze.</li>
              <li>Collect supporting reports and communications (FTC/police, as applicable).</li>
              <li>Upload documentation to your vault and track disputes by bureau.</li>
            </ul>
            <p className={muted}>If you need legal advice, consult a licensed attorney in your jurisdiction.</p>
          </div>
        ),
      },
      {
        id: 'billing',
        q: 'How does billing and module access work?',
        searchText: 'billing plans pricing module access entitlements subscription payment',
        a: (
          <div className="space-y-2">
            <p>
              Plans activate entitlements that unlock portal modules (reports, documents, disputes, debt, escalations, etc.). You can view
              what’s unlocked in Profile & Billing.
            </p>
            <p className={muted}>
              You can still upload key documents any time—keeping your vault current makes everything faster.
            </p>
          </div>
        ),
      },
      {
        id: 'refunds-cancellations',
        q: 'Do you offer refunds or cancellations?',
        searchText: 'refund cancel cancellation policy subscription',
        a: (
          <div className="space-y-2">
            <p>
              Refund and cancellation policies depend on what you purchased (one-time vs membership), delivery status, and the terms shown at
              checkout.
            </p>
            <p className={muted}>If you need help, contact support with your email and purchase details so we can triage quickly.</p>
          </div>
        ),
      },
      {
        id: 'chexsystems',
        q: 'What is ChexSystems (and Early Warning Systems)?',
        searchText: 'chexsystems early warning systems ews banking report checking account',
        a: (
          <div className="space-y-2">
            <p>
              ChexSystems and Early Warning Systems (EWS) are consumer reporting systems used by many banks to evaluate checking account
              applications and risk.
            </p>
            <p>
              If you’ve been denied a bank account, you may have negative banking report items. Cleanup workflows typically focus on
              documentation, accuracy review, and appropriate challenges.
            </p>
            <p className={muted}>
              These are separate from the “big three” credit bureaus. The workflow and templates can differ.
            </p>
          </div>
        ),
      },
      {
        id: 'business-credit-basics',
        q: 'What is business credit building?',
        searchText: 'business credit building ein duns vendor accounts fundability',
        a: (
          <div className="space-y-2">
            <p>
              Business credit building is the process of establishing a fundable business profile and building payment history with vendors and
              business bureaus (where applicable).
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Entity + compliance basics (address, phone, listings)</li>
              <li>Vendor sequencing and trade accounts</li>
              <li>Monitoring and readiness milestones</li>
            </ul>
            <p className={muted}>Not all outcomes are guaranteed; lenders make independent decisions.</p>
          </div>
        ),
      },
      {
        id: 'debt-summons-answer',
        q: 'I was served with a debt collection lawsuit (summons) — what do I do first?',
        searchText:
          'summons lawsuit debt collector sued answer deadline default judgment affirmative defenses statute of limitations chain of assignment debt buyer',
        a: (
          <div className="space-y-2">
            <p>
              The single most important step is filing a timely written <strong>answer</strong> with the court — missing the
              deadline on the summons commonly results in an automatic default judgment, which is far harder to undo than
              answering on time. Calendar the exact deadline from the date you were served (not the date you opened the
              mail).
            </p>
            <p>
              A properly drafted answer generally responds to each numbered allegation and raises applicable affirmative
              defenses — most commonly the <strong>statute of limitations</strong>, <strong>lack of standing</strong> from a
              broken chain of assignment (common with third-party debt buyers), and failure to properly itemize the amount
              claimed.
            </p>
            <p className={muted}>
              This is general legal education, not legal advice — debt-collection and civil-procedure rules vary by state.
              If a deadline is close, contact the court clerk or a licensed consumer-law attorney right away.
            </p>
          </div>
        ),
      },
      {
        id: 'debt-validation-rights',
        q: 'Can I dispute a debt before I\u2019m sued? What are my validation rights?',
        searchText:
          'debt validation dispute before lawsuit fdcpa cease communication 30 days written demand collector',
        a: (
          <div className="space-y-2">
            <p>
              Yes. Under the Fair Debt Collection Practices Act (FDCPA, 15 U.S.C. § 1692g), you generally have the right to
              send a written request within 30 days of first contact demanding the collector verify the debt before
              continuing collection. You can also send a written cease-communication demand under § 1692c(c).
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Send requests in writing (certified mail with return receipt is common practice for a paper trail).</li>
              <li>
                Before responding, try to pin down the last-payment or default date — many states have a 3–6 year statute of
                limitations on old debts, though this varies and should be researched for your state.
              </li>
              <li>
                Avoid making a payment or a written/verbal promise on an old debt before confirming its status — that can
                restart (re-age) the statute-of-limitations clock in many states.
              </li>
            </ul>
            <p className={muted}>
              A validation request pauses collection but does not erase the debt or prevent a future lawsuit — never ignore
              a later summons because validation was requested. General legal education only, not legal advice.
            </p>
          </div>
        ),
      },
      {
        id: 'debt-garnishment-levy',
        q: 'What if my wages are already being garnished or my bank account was levied?',
        searchText:
          'wage garnishment bank levy exemption post judgment motion to vacate default judgment collections emergency',
        a: (
          <div className="space-y-2">
            <p>
              Both wage garnishment and bank levies are post-judgment collection actions — meaning a court judgment already
              exists. Depending on your state, certain funds and a portion of wages may be exempt from garnishment (for
              example, some federal benefit deposits or a statutory minimum-income threshold), and it's often possible to
              file a claim of exemption or a motion to quash a levy.
            </p>
            <p>
              If a default judgment was entered without you being properly served or responding, you may be able to file a
              <strong> motion to vacate</strong> — but these motions typically have strict, short deadlines once you learn of
              the judgment, so time matters.
            </p>
            <p className={muted}>
              Exemption categories and filing deadlines vary significantly by state and are time-sensitive — this is general
              education, not legal advice. Speak with a licensed attorney in your state as soon as possible.
            </p>
          </div>
        ),
      },
      {
        id: 'noncitizen-no-ssn-funding',
        q: 'I don\u2019t have an SSN — can I still build business credit or get funding in the U.S.?',
        searchText:
          'no ssn itin holder business credit funding ein non resident llc foreign national',
        a: (
          <div className="space-y-2">
            <p>
              Often yes, if the funding is underwritten against a U.S.-registered business entity (LLC or corporation) with
              its own EIN rather than your personal SSN. ITIN holders commonly have realistic paths through equipment
              financing (collateral-backed, generally the most accessible), merchant cash advances (receivables-based,
              faster but higher cost), and business lines of credit once there is 6–12 months of consistent U.S. business
              deposit history.
            </p>
            <p>
              Non-resident-owned LLCs (owners who never enter the U.S.) face more friction — approval usually hinges almost
              entirely on demonstrated U.S. bank deposit history, so the realistic first step is often establishing a
              fintech-friendly business bank account and building a clean deposit record.
            </p>
            <p className={muted}>
              SBA 7(a) loans are the exception: SBA generally requires 51%+ ownership by a U.S. citizen or lawful permanent
              resident, which an ITIN-only or non-resident owner typically cannot satisfy alone. General educational
              guidance only — not legal, immigration, or lending advice; confirm current requirements with a qualified
              immigration attorney and the specific lender.
            </p>
          </div>
        ),
      },
      {
        id: 'noncitizen-daca-greencard-sba',
        q: 'Can DACA recipients or green card holders qualify for SBA loans?',
        searchText:
          'daca green card lawful permanent resident sba 7a eligibility ownership citizenship',
        a: (
          <div className="space-y-2">
            <p>
              <strong>Green card holders (lawful permanent residents)</strong> generally satisfy SBA's citizenship/LPR
              ownership requirement the same way a U.S. citizen owner would, and are typically evaluated on standard SBA
              criteria (creditworthiness, cash flow, collateral) with immigration status as a documentation step, not a risk
              factor.
            </p>
            <p>
              <strong>DACA recipients</strong> present a genuinely unsettled area — DACA status is neither U.S. citizenship
              nor lawful permanent residency, so eligibility for SBA's 51%+ ownership test has been inconsistently applied
              and has shifted with agency guidance and litigation over time. Outside of SBA-guaranteed products, most
              conventional and fintech lenders process a DACA recipient's SSN-based application like any other applicant's.
            </p>
            <p className={muted}>
              Because SBA policy in this area changes, current eligibility should always be confirmed directly with an
              SBA-approved lender and, where useful, an immigration attorney. General educational guidance only — not legal
              or immigration advice.
            </p>
          </div>
        ),
      },
      {
        id: 'noncitizen-foreign-credit-history',
        q: 'I have credit history from Canada, the UK, or Germany — does it transfer to a U.S. credit score?',
        searchText:
          'foreign credit history transfer canada uk germany schufa equifax canada experian uk score does not transfer',
        a: (
          <div className="space-y-2">
            <p>
              No — credit history does not transfer across borders. Canada, the UK, Germany, and the rest of the EU each run
              separate bureau systems (e.g., Equifax Canada/TransUnion Canada on a 300–900 scale; Experian/Equifax/TransUnion
              UK on three different proprietary scales; Germany's SCHUFA as a percentage-based probability score) with their
              own reporting rules — none of it feeds into a U.S. FICO/VantageScore file.
            </p>
            <p>
              This means a newcomer to the U.S. typically starts with a thin or non-existent U.S. credit file regardless of
              how strong their credit history was abroad, and needs to build U.S.-specific history from scratch (e.g., a
              secured card, an EIN-based business credit line, or becoming an authorized user).
            </p>
            <p className={muted}>
              General educational guidance only — not legal or financial advice; consumer-reporting and dispute-rights rules
              differ meaningfully by country (e.g., GDPR-based rights in the EU vs. FCRA in the U.S.).
            </p>
          </div>
        ),
      },
      {
        id: 'wealth-builder-what-is-it',
        q: 'What is the Wealth Builder program and how is it different from credit repair?',
        searchText:
          'wealth builder program what is it different from credit repair business credit funding readiness capital',
        a: (
          <div className="space-y-2">
            <p>
              Wealth Builder is the next step after credit stability: a guided program that transitions you from personal
              credit repair into business structure, business credit building, and funding-readiness milestones — with the
              goal of qualifying for real capital (business lines of credit, equipment financing, SBA products, etc.)
              instead of stopping once your personal score improves.
            </p>
            <p>
              Where credit repair focuses on cleaning up your personal file, Wealth Builder focuses on building something
              new: an EIN-based business entity, vendor/trade payment history, and a funding-readiness scorecard that lenders
              actually look at.
            </p>
            <p className={muted}>
              Shortcut: see current tiers at{' '}
              <code className={codeChip}>/pricing?tab=wealth_builder</code>. Results vary; funding is subject to underwriting.
            </p>
          </div>
        ),
      },
      {
        id: 'wealth-builder-diy-vs-dfy',
        q: 'What\u2019s the difference between Wealth Builder DIY and the Advanced (done-for-you) tiers?',
        searchText:
          'wealth builder diy vs dfy advanced starter growth pro prime elite superior price difference',
        a: (
          <div className="space-y-2">
            <p>
              <strong>Wealth Builder DIY</strong> is a self-guided program: business credit foundation roadmap, a funding
              readiness scorecard/checklist, transition playbooks, and a resource library you execute yourself.
            </p>
            <p>
              The <strong>Advanced Wealth Builder</strong> tiers (Starter → Growth → Pro → Prime → Elite → Superior) are
              done-for-you: guided/managed execution windows, help registering your entity, hands-on business credit
              sequencing, a weekly strategy call cadence, and Wealth Paths lane unlocks — scaling up in support depth and
              target funding pathway from roughly $100K–$150K at Starter to $400K+ at the flagship Superior tier.
            </p>
            <p className={muted}>
              See exact current pricing and inclusions per tier at <code className={codeChip}>/pricing?tab=wealth_builder</code>.
            </p>
          </div>
        ),
      },
      {
        id: 'wealth-builder-funding-guarantee',
        q: 'Do you guarantee I\u2019ll get the funding amount listed for each Wealth Builder tier?',
        searchText:
          'wealth builder funding guarantee target amount underwriting lenders decision no guarantee',
        a: (
          <div className="space-y-2">
            <p>
              No. The dollar ranges shown for each Advanced Wealth Builder tier (e.g., "$100K–$150K funding pathway") describe
              a <strong>target milestone we build toward</strong>, not a guaranteed outcome. Every funding decision is made
              independently by the lender based on your business's financials, time in business, credit profile, and their
              own underwriting criteria at the time you apply.
            </p>
            <p className={muted}>Results vary · not legal or financial advice · funding subject to underwriting.</p>
          </div>
        ),
      },
      {
        id: 'privacy-security',
        q: 'How do you handle privacy and sensitive documents?',
        searchText: 'privacy security pii documents storage encryption access',
        a: (
          <div className="space-y-2">
            <p>
              We treat uploaded documents as sensitive. Your vault is designed to keep evidence organized and access-controlled for your account.
            </p>
            <p className={muted}>
              Tip: only upload what’s necessary for your workflow (ID, proof of address, statements, and responses).
            </p>
          </div>
        ),
      },
      {
        id: 'support',
        q: 'How do I contact support?',
        searchText: 'contact support help messages email partner portal',
        a: (
          <div className="space-y-2">
            <p>
              Partners can use Messages & Support inside the portal to keep threads organized and attach documents from the vault.
            </p>
            <p className={muted}>
              For large attachments, you can email <code className={codeChip}>partnersupport@finelycred.com</code>.
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter((it) => it.q.toLowerCase().includes(q) || it.searchText.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <PageShell badge="Public" title="FAQ" subtitle="Common questions about onboarding, reports, disputes, and support.">
      <div className={FINELY_OS_PAGE}>
        <FinelyUnifiedHubLayout
          eyebrow="Help center"
          title="Frequently asked questions"
          subtitle="Onboarding, reports, disputes, billing, and platform support."
          accent="fuchsia"
          kpis={[
            { label: 'Topics', value: String(items.length), accent: 'fuchsia' },
            { label: 'Showing', value: String(filtered.length), accent: 'emerald' },
          ]}
          tabs={[{ id: 'faq', label: 'All questions' }]}
          activeTab="faq"
          primaryAction={{ label: 'Contact support', onClick: () => navigate('/contact') }}
          secondaryAction={{ label: 'Book session', onClick: () => navigate('/consultation') }}
        >
        <div className={`${FINELY_OS_TOOLBAR} !p-2 w-full sm:max-w-md mb-4`}>
          <Search size={14} className="text-emerald-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions..."
            className={`bg-transparent outline-none text-sm w-full min-w-0 ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
          />
        </div>

        <FinelyOsPaginatedStack
          items={filtered}
          pageSize={8}
          itemSpacingClassName="space-y-3"
          emptyMessage="No questions match your search."
          renderItem={(it) => {
            const open = openId === it.id;
            return (
              <details key={it.id} className={`${finelyOsInlineListItem(open)} overflow-hidden group`} open={open}>
                <summary
                  onClick={(e) => { e.preventDefault(); setOpenId(open ? null : it.id); }}
                  className={`cursor-pointer select-none px-6 py-5 ${FINELY_OS_ENTITY_VALUE} flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-all`}
                >
                  {it.q}
                  <ChevronDown size={18} className={`text-fuchsia-400 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`} />
                </summary>
                {open && <div className={`px-6 pb-5 ${FINELY_OS_ENTITY_BODY} leading-relaxed`}>{it.a}</div>}
              </details>
            );
          }}
        />

        <div className={`${FINELY_OS_NOTICE_WARN} space-y-3 mt-6`}>
          <div className={FINELY_OS_ENTITY_BODY}>Still have questions? Partners can sign in for faster triage in the Communication Hub.</div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/contact')} className={FINELY_OS_SUCCESS_BTN}>Contact us</button>
            <button type="button" onClick={() => navigate('/login')} className={FINELY_OS_SECONDARY_BTN}>Partner sign in</button>
          </div>
        </div>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="support_specialist"
          goal="not_sure"
          roleLabel="support specialist"
          subline="Still have questions after reading the FAQ? Chat with our on-duty team member."
          buttonTone="secondary"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
