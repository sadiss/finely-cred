import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, HelpCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';

type FaqItem = {
  id: string;
  q: string;
  a: React.ReactNode;
  searchText: string;
};

export default function FaqPage() {
  const navigate = useNavigate();
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
            <p className="text-white/60">
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
            <p className="text-white/60">
              Shortcut: go to <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">/onboarding</code>.
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
            <p className="text-white/60">
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
            <p className="text-white/60">Store documents in the Documents Vault so they can be attached to disputes and support threads.</p>
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
            <p className="text-white/60">
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
            <p className="text-white/60">If you believe an item is inaccurate or incomplete, document it and dispute it appropriately.</p>
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
            <p className="text-white/60">We focus on execution quality and sequencing, not “instant fixes.”</p>
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
            <p className="text-white/60">
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
            <p className="text-white/60">Many partners do Restore first, then transition into Building once the file stabilizes.</p>
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
            <p className="text-white/60">Document everything and keep a clear timeline of statements, receipts, and communications.</p>
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
            <p className="text-white/60">If you need legal advice, consult a licensed attorney in your jurisdiction.</p>
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
            <p className="text-white/60">
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
            <p className="text-white/60">If you need help, contact support with your email and purchase details so we can triage quickly.</p>
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
            <p className="text-white/60">
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
            <p className="text-white/60">Not all outcomes are guaranteed; lenders make independent decisions.</p>
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
            <p className="text-white/60">
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
            <p className="text-white/60">
              For large attachments, you can email <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">partnersupport@finelycred.com</code>.
            </p>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <PageShell badge="Public" title="FAQ" subtitle="Common questions about onboarding, reports, disputes, and support.">
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft size={16} /> Home
          </a>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 md:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <HelpCircle size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Frequently asked</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 w-full sm:w-[340px]">
              <Search size={14} className="text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions..."
                className="bg-transparent outline-none text-white/80 placeholder:text-white/25 text-sm w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            {items
              .filter((it) => {
                if (!query.trim()) return true;
                const q = query.trim().toLowerCase();
                return it.q.toLowerCase().includes(q) || it.searchText.toLowerCase().includes(q);
              })
              .map((it) => {
              const open = openId === it.id;
              return (
                <details key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden group" open={open}>
                  <summary
                    onClick={(e) => { e.preventDefault(); setOpenId(open ? null : it.id); }}
                    className="cursor-pointer select-none px-6 py-5 text-white font-semibold flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-all"
                  >
                    {it.q}
                    <ChevronDown
                      size={18}
                      className={`text-amber-400 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
                    />
                  </summary>
                  {open && <div className="px-6 pb-5 text-white/70 text-sm leading-relaxed">{it.a}</div>}
                </details>
              );
            })}
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-white/70 text-sm">
            Still have questions? Use the contact form or message us inside the portal for faster triage.
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
              >
                Contact us
              </button>
              <button
                type="button"
                onClick={() => navigate('/portal/messages')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              >
                Partner messages
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

