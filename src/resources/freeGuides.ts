import { EXTENDED_FREE_GUIDES } from './extendedFreeGuides';

export type FreeGuideId =
  | 'credit-dispute-letter-guide'
  | 'metro2-consistency-trap'
  | 'bureau-response-decoder'
  | 'collections-proof-pack'
  | 'permissible-purpose-scriptbook'
  | 'utilization-sniper-rules'
  | 'business-sequence-ladder'
  | 'ucc-article-3-primer'
  | 'strawman-myths-reality'
  | 'primary-tradeline-insider'
  | 'business-credit-jumpstart'
  | 'loan-funding-sequence'
  | 'ai-dispute-workflows'
  | 'combo-tradeline-ladder'
  | 'ucc1-business-filing-primer'
  | 'smart-application-timing'
  | 'funding-ready-underwriting-optics'
  | 'inquiry-removal-advanced'
  | 'collections-validation-deep-dive'
  | 'metro2-k-segment-field-guide'
  | 'eoscar-acdv-decoder'
  | 'dofd-reaging-audit'
  | 'fraud-alert-funding-timing'
  | 'student-loan-metro2-playbook'
  | 'bankruptcy-rebuild-sequencer'
  | 'certified-mail-evidence-system'
  | 'round-2-method-verification'
  | 'vendor-tier-matrix-free'
  | 'debt-settlement-tax-traps'
  | 'mortgage-overlay-dispute-prep'
  | 'identity-theft-block-unblock';

export type FreeGuide = {
  id: FreeGuideId;
  title: string;
  desc: string;
  /** Printable content body for PDF generation. */
  sections: {
    heading: string;
    bullets: string[];
    attachmentBlobRef?: string;
    attachmentFilename?: string;
    attachmentMimeType?: string;
  }[];
};

export const FREE_GUIDES: FreeGuide[] = [
  {
    id: 'credit-dispute-letter-guide',
    title: 'Free Credit Dispute Letter Guide',
    desc: 'The proven 5-step framework — FCRA overview, OCR tactics, mailing workflow, law-per-negative citations, and complaints escalation. Complete Finely Cred edition.',
    sections: [
      {
        heading: 'Step 1 — Identify the target item',
        bullets: [
          'Pull your report and isolate ONE negative tradeline per letter (cleaner disputes win more often).',
          'Screenshot the exact fields: status, balance, dates, payment history grid.',
          'Store evidence in your Documents vault before you draft.',
        ],
      },
      {
        heading: 'Step 2 — Choose your dispute lane',
        bullets: [
          'Inaccurate reporting: internal contradictions across Metro2 fields.',
          'Unverifiable: creditor cannot produce signed agreement or chain of title.',
          'Incomplete: missing required data elements on the tradeline.',
        ],
      },
      {
        heading: 'Step 3 — Structure the letter',
        bullets: [
          'Opening: identity, bureau address, concise request for investigation.',
          'Body: numbered reasons tied to evidence — not emotional arguments.',
          'Closing: deadline for response, request for method of verification, signature block.',
        ],
      },
      {
        heading: 'Step 4 — Attach minimum proof',
        bullets: [
          'Only attach what proves the specific claim — over-attaching weakens the file.',
          'Label exhibits (Exhibit A, B) and reference them in the letter body.',
          'Keep copies of everything sent; track dates in your portal Tasks board.',
        ],
      },
      {
        heading: 'Step 5 — Follow-up cadence',
        bullets: [
          'Round 1 → wait for bureau response → re-evidence what changed.',
          'Round 2 tightens the same claim with new contradictions from responses.',
          'Never mix unrelated items in one letter — it reads as shotgun dispute.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice. Consult a licensed attorney for legal matters.'],
      },
    ],
  },
  {
    id: 'primary-tradeline-insider',
    title: 'Primary Tradeline Insider',
    desc: 'Authorized user vs primary tradelines, timing, inquiry discipline, and how tradelines fit a broader restore plan — no hype.',
    sections: [
      {
        heading: 'Primary vs authorized user',
        bullets: [
          'Primary tradelines are accounts you own; AU tradelines are piggybacked authorized-user history.',
          'Underwriters may treat AU history differently than primary depth and payment patterns.',
          'Education first: understand what reports and what a funder actually sees.',
        ],
      },
      {
        heading: 'Timing and sequencing',
        bullets: [
          'Adding tradelines before dispute cleanup can mask — not fix — underlying file issues.',
          'Space new credit applications to avoid inquiry stacking.',
          'Align tradeline strategy with utilization and negative-item work already in progress.',
        ],
      },
      {
        heading: 'Risk-aware checklist',
        bullets: [
          'Verify seller reputation, reporting behavior, and account age claims independently.',
          'Avoid guarantees; no one can promise a specific score outcome.',
          'Document everything in your portal case log before you pay anyone.',
        ],
      },
      {
        heading: 'When tradelines may help',
        bullets: [
          'Thin files sometimes benefit from additional positive history — after hygiene is stable.',
          'Business funding paths may weight primary business tradelines more heavily than AU personal lines.',
          'Talk with an advisor about fit before buying tradelines.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal or financial advice.'],
      },
    ],
  },
  {
    id: 'metro2-consistency-trap',
    title: 'Metro2 Consistency Map',
    desc: 'A high-signal checklist for internal contradictions across status, dates, balances, and 24‑month payment history.',
    sections: [
      {
        heading: 'The core idea',
        bullets: [
          'Most “hard” disputes become easy when you isolate a reporting contradiction: the file cannot be simultaneously true in all fields.',
          'Your job is not to argue — it’s to force validation of a clean, internally consistent Metro2 record.',
        ],
      },
      {
        heading: 'Consistency checks (quick scan)',
        bullets: [
          'Status vs 24‑month grid: “Current/Paid as agreed” can’t coexist with derogatory history codes without explanation.',
          'Dates: DOFD, Date Opened, Date Closed, Last Reported must form a timeline that makes sense.',
          'Balances: Balance, Past Due, High Balance, Credit Limit/High Credit must not conflict across bureaus.',
          'Account Type vs Responsibility: terms should match the reported category (revolving vs installment vs collection).',
        ],
      },
      {
        heading: 'Execution',
        bullets: [
          'Capture the exact conflicting fields (screenshots) and store them in Documents Vault / Evidence Vault.',
          'Dispute with one clean claim: “inaccurate/incomplete/unverifiable” + request for method of verification.',
          'Follow-up cadence: treat each bureau response as a new branch — do not mix evidence sets across branches.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice.'],
      },
    ],
  },
  {
    id: 'bureau-response-decoder',
    title: 'Bureau Response Decoder',
    desc: 'Translate bureau language into next actions: reinvestigation, verification requests, escalation, and clean follow‑up timing.',
    sections: [
      {
        heading: 'When you see…',
        bullets: [
          '“Verified as accurate” → request method of verification + ensure your evidence set is scoped to the exact contradiction.',
          '“Updated” → treat as a new baseline: re-run consistency checks across bureaus and re-evidence what changed.',
          '“Deleted” → archive proof, update your case log, and avoid reintroducing the tradeline via sloppy future disputes.',
          '“Frivolous/irrelevant” → tighten the claim, attach only the minimum evidence that proves the inconsistency, and resubmit.',
        ],
      },
      {
        heading: 'Timing discipline',
        bullets: [
          'Track dates (sent/received/response). Maintain one timeline per bureau per item.',
          'Do not shotgun: one strong claim beats five weak claims.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice.'],
      },
    ],
  },
  {
    id: 'collections-proof-pack',
    title: 'Collections Proof Pack Checklist',
    desc: 'The documentation stack that prevents “he said/she said” disputes—what to upload, how to label it, and how to reuse it.',
    sections: [
      {
        heading: 'Your proof pack (minimum)',
        bullets: [
          'Identity verification: ID + proof of address (current).',
          'Chronology: any letters, bills, statements, or bureau responses tied to the item.',
          'Screenshots: tradeline fields + payment history grid + any cross-bureau inconsistencies.',
        ],
      },
      {
        heading: 'Labeling rules',
        bullets: [
          'Prefix by case: [BUREAU]_[CREDITOR]_[YYYY-MM-DD]_[TYPE].pdf/png',
          'Never upload “random.pdf”. If you can’t explain it in 5 seconds, it’s mislabeled.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice.'],
      },
    ],
  },
  {
    id: 'permissible-purpose-scriptbook',
    title: 'Permissible Purpose Scriptbook',
    desc: 'A practical template set for disputing inquiries you don’t recognize—organized by bureau process and response handling.',
    sections: [
      {
        heading: 'The claim',
        bullets: [
          'Keep it simple: “I do not recall authorizing this inquiry. Please provide permissible purpose or remove it.”',
          'Avoid over-explaining — focus on authorization and documentation.',
        ],
      },
      {
        heading: 'Evidence + tracking',
        bullets: [
          'Store a clean list of inquiry name + date + bureau.',
          'Treat each bureau separately; do not combine timelines.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice.'],
      },
    ],
  },
  {
    id: 'utilization-sniper-rules',
    title: 'Utilization Control Rules',
    desc: 'How to reduce score volatility: reporting dates, statement balance control, and what tends to look “clean” to underwriting.',
    sections: [
      {
        heading: 'The rules',
        bullets: [
          'Control statement balance, not just payments.',
          'Know the reporting date per card; set a calendar.',
          'Avoid “all zeros” patterns if you’re actively building; keep one card lightly reporting when appropriate.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice.'],
      },
    ],
  },
  {
    id: 'business-sequence-ladder',
    title: 'Business Sequence Ladder',
    desc: 'A step-by-step blueprint (20 sections): entity + address hygiene, vendor stacking logic, and “don’t apply yet” red flags.',
    sections: [
      { heading: '1. Foundation overview', bullets: ['Entity correctness + address + phone + web presence + compliance before any credit applications.', 'Reporting: align bureau files (business bureaus) before applying for vendors.', 'Vendors: start with predictable reporting vendors and build thickness.', 'Only then: move to higher-tier credit products and funding paths.'] },
      { heading: '2. Entity correctness', bullets: ['Ensure your legal entity (LLC, Corp) is filed and in good standing in your state.', 'Verify the exact legal name matches across all filings, bank accounts, and applications.', 'Update your registered agent and state filings if they are outdated.'] },
      { heading: '3. EIN and tax standing', bullets: ['Obtain an EIN from the IRS if you do not have one.', 'File required federal and state returns on time.', 'Avoid tax liens; resolve any existing liens before applying.'] },
      { heading: '4. Business address hygiene', bullets: ['Use a real business address (no virtual-only if underwriters flag it).', 'Ensure your address is consistent across Secretary of State, bank, and bureau files.', 'Avoid obvious residential addresses when applying for business credit.'] },
      { heading: '5. Phone and web presence', bullets: ['Get a dedicated business phone line (not a personal cell).', 'Build a simple website or landing page with your entity name and contact info.', 'Ensure your business appears in online directories (Google, BBB if applicable).'] },
      { heading: '6. Business bank account', bullets: ['Open a business bank account in the exact legal name of your entity.', 'Maintain a consistent balance and avoid overdrafts.', 'Use the account for at least 3–6 months before heavy credit applications.'] },
      { heading: '7. D-U-N-S and bureau alignment', bullets: ['Register for a D-U-N-S number if you plan to build Dun & Bradstreet file.', 'Check Experian, Equifax Business, and D&B for consistency in name, address, industry.', 'Fix any mismatches before applying; underwriters pull from multiple bureaus.'] },
      { heading: '8. Vendor tier 1 — starter vendors', bullets: ['Apply for net-30 or starter vendors that report to business bureaus (e.g., Uline, Quill, Grainger).', 'Use trade references; pay on time or early.', 'Do not rush; 2–3 starter vendors are enough to begin.'] },
      { heading: '9. Vendor tier 2 — mid-tier', bullets: ['After 2–3 months of on-time payments, add mid-tier vendors.', 'Target vendors that report to D&B and/or Experian Business.', 'Keep utilization low and pay before statement date when possible.'] },
      { heading: '10. Vendor tier 3 — higher limits', bullets: ['Once you have 5+ positive trade lines, consider higher-limit vendors.', 'Maintain a mix of net-30 and revolving if available.', 'Do not apply for 10 vendors in one month; space applications.'] },
      { heading: '11. Business credit cards', bullets: ['Apply for business cards only after you have tradelines and a solid file.', 'Personal guarantee is common for new entities; understand the trade-off.', 'Start with cards that report to business bureaus, not just personal.'] },
      { heading: '12. Funding paths — when to apply', bullets: ['Line-of-credit and term loans typically require 1+ year of history for best rates.', 'Factor in revenue, cash flow, and bureau scores for approvals.', 'Avoid applying for multiple loans in a short window; it can hurt your file.'] },
      { heading: '13. Red flag — applying too early', bullets: ['Applying before profile hygiene is complete wastes inquiries and can hurt your file.', 'Underwriters look for consistency; an incomplete profile signals risk.', 'Wait until address, phone, EIN, and at least one tradeline are in place.'] },
      { heading: '14. Red flag — mixing personal and business', bullets: ['Mixing personal and business signals unintentionally can confuse underwriters.', 'Use business accounts for business expenses; keep personal credit separate.', 'Avoid using your SSN when your EIN is required.'] },
      { heading: '15. Red flag — no documentation discipline', bullets: ['No proof pack (statements, incorporation docs, bank statements) slows approvals.', 'Keep a clean folder: articles, EIN letter, bank statement, address proof.', 'Update documents periodically; stale docs can trigger additional review.'] },
      { heading: '16. Red flag — inquiry stacking', bullets: ['Too many applications in a short period can flag you as desperate.', 'Space applications by 30–90 days when building a new file.', 'Track who you applied with and when to avoid duplicate pulls.'] },
      { heading: '17. Maintenance and scaling', bullets: ['Once established, maintain tradelines; do not close old accounts abruptly.', 'Add new credit in line with revenue growth and needs.', 'Re-run bureau checks yearly to catch errors or outdated info.'] },
      { heading: '18. Troubleshooting denials', bullets: ['Request reasons for denial; bureaus and lenders must provide them.', 'Address specific issues (e.g., address mismatch, missing tradeline) before reapplying.', 'Consider a business credit monitoring service to track your file.'] },
      { heading: '19. Long-term best practices', bullets: ['Pay all trade accounts on time or early; one late payment can hurt disproportionately.', 'Keep business and personal finances separate for cleaner reporting.', 'Document everything; disputes and corrections are easier with proof.'] },
      { heading: '20. Disclaimer', bullets: ['Educational only; not legal or financial advice. Consult qualified professionals for your situation.'] },
    ],
  },
  {
    id: 'ucc-article-3-primer',
    title: 'UCC Article 3 Primer (Negotiable Instruments)',
    desc: 'A plain-language overview of what Article 3 is, what it covers, and what it does NOT do — so you can spot misinformation fast.',
    sections: [
      {
        heading: 'What Article 3 actually covers',
        bullets: [
          'UCC Article 3 is about negotiable instruments (for example: certain checks, notes, drafts).',
          'Key ideas you’ll hear: “holder,” “endorsement,” “negotiation,” “transfer,” “dishonor.”',
          'It is not a magic delete button for consumer credit reporting or debt collection.',
        ],
      },
      {
        heading: 'Why it still matters (when used correctly)',
        bullets: [
          'It can help you understand who has the right to enforce an instrument in certain contexts.',
          'It can help you ask better questions when a claim depends on a “note,” “assignment,” or enforcement rights.',
          'It helps you avoid misinformation that confuses UCC concepts with credit bureau/FCRA processes.',
        ],
      },
      {
        heading: 'Common misconceptions (quick filter)',
        bullets: [
          '“UCC 1-308 removes debt” → incorrect; reservation of rights is not a debt eraser.',
          '“Send an affidavit and everything must be deleted” → not true; outcomes depend on facts, law, and procedure.',
          '“All debts are negotiable instruments” → not necessarily; facts and documents matter.',
        ],
      },
      {
        heading: 'Practical, safe next steps (education-first)',
        bullets: [
          'If you’re disputing credit reporting, use FCRA/CRA processes: document inconsistencies, request verification, track timelines.',
          'If you’re facing a lawsuit or summons, get qualified legal counsel in your jurisdiction immediately.',
          'Use this guide to ask clearer questions — not to “DIY legal strategy.”',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice. Laws vary by jurisdiction.'],
      },
    ],
  },
  {
    id: 'strawman-myths-reality',
    title: '“Strawman” Myth vs Reality (Stay Legal, Stay Safe)',
    desc: 'A calm, non-inflammatory guide that separates internet myths from real-world compliance — so you don’t self-sabotage your case.',
    sections: [
      {
        heading: 'The reality check',
        bullets: [
          'A lot of viral “strawman” content is not reliable legal guidance and can create risk if used in filings or disputes.',
          'Courts and creditors respond to facts, procedure, and documentation — not slogans.',
          'If you want results, focus on verifiable inaccuracies, valid defenses, and clean evidence.',
        ],
      },
      {
        heading: 'If you’re trying to fix credit (what works better)',
        bullets: [
          'Identify specific reporting inconsistencies (dates, balances, status codes, ownership).',
          'Keep one claim per dispute and attach only the minimum evidence needed.',
          'Track timelines per bureau; do not mix evidence sets across branches.',
        ],
      },
      {
        heading: 'If you’re dealing with debt/collections (what matters)',
        bullets: [
          'Validate facts: account ownership, amounts, dates, and documentation.',
          'Organize a proof pack (letters, responses, screenshots, identity verification where appropriate).',
          'If there’s a summons, treat it as urgent — procedure and deadlines are everything.',
        ],
      },
      {
        heading: 'Use this as a “risk filter”',
        bullets: [
          'If a tactic requires you to make claims you can’t prove, it’s a red flag.',
          'If a tactic tells you “it always works,” it’s a red flag.',
          'If a tactic discourages real counsel when legal deadlines exist, it’s a red flag.',
        ],
      },
      {
        heading: 'Disclaimer',
        bullets: ['Educational only; not legal advice. If you need legal guidance, consult a licensed attorney.'],
      },
    ],
  },
];

export const ALL_FREE_GUIDES: FreeGuide[] = [...FREE_GUIDES, ...EXTENDED_FREE_GUIDES];

export function findFreeGuideByTitle(title: string | null | undefined): FreeGuide | null {
  const t = (title || '').trim();
  if (!t) return null;
  return FREE_GUIDES.find((g) => g.title === t) ?? EXTENDED_FREE_GUIDES.find((g) => g.title === t) ?? null;
}

export function findFreeGuideById(id: string | null | undefined): FreeGuide | null {
  const key = (id || '').trim();
  if (!key) return null;
  return FREE_GUIDES.find((g) => g.id === key) ?? EXTENDED_FREE_GUIDES.find((g) => g.id === key) ?? null;
}

