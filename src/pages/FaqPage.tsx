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
