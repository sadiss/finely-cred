/** Local shapes — avoid importing freeGuides (circular with guide arrays). */
type GuideSection = {
  heading: string;
  bullets: string[];
  attachmentBlobRef?: string;
  attachmentFilename?: string;
  attachmentMimeType?: string;
};

type GuideLike = {
  id: string;
  title: string;
  desc: string;
  sections: GuideSection[];
};

/** Shared fundability OS language — pillars match BusinessFundabilityScorecard weights. */
export const FUNDABILITY_PILLARS_TABLE: string[] = [
  'TABLE — Pillar | Weight | Exit signal (educational)',
  'Entity & identity | 25% | SOS / EIN / bank / phone / address match character-for-character',
  'Vendor reporting | 30% | 2–3 Tier-1 net-30s posting; pay-early habit proven',
  'Bureau scores | 25% | D-U-N-S (if used) + ghost listings fixed; NAICS consistent',
  'Capital package | 20% | 3–6 mo bank PDFs + ownership docs; sequenced ask ready',
];

export const FUNDABILITY_STAGE_GATES: string[] = [
  'TABLE — Stage gate | Do not advance until | Typical weeks (varies)',
  'G0 Foundation | Entity truth + business bank open | 1–2',
  'G1 Matchable file | Bureau footprint clean; no split identity | 2–4',
  'G2 Trade depth | Tier-1 reporters posting on target bureaus | 4–10',
  'G3 Revolving optics | First business card (know PG); util staged | 8–14',
  'G4 Capital ask | Doc pack + relationship runway; soft-qualify first | 12+',
];

export const FUNDABILITY_BLOCKERS: string[] = [
  'KEY: A red blocker means pause applications — fix the match, then ask.',
  'SOS inactive / name mismatch across bank and EIN.',
  'Ghost bureau profiles (wrong address, phone, or NAICS).',
  'Zero business banking history or NSF / overdraft pattern on the pack.',
  'Inquiry stacking (personal + business) in the same 30-day window.',
  'Personal file mid-dispute on accounts a PG lender will re-pull.',
  'Missing CP 575 / articles / ownership percentages when underwriter asks.',
  'WARNING: Misrepresenting entity age, revenue, or ownership is fraud — not “optimization.”',
];

export const FUNDABILITY_OS_SCORECARD: string[] = [
  'Finely Cred Business Credit OS scorecard bands (educational):',
  '0–54 Foundation phase — entity + footprint first; max ~2 vendor apps/month.',
  '55–79 Building momentum — deepen reporters; stage revolving; build bank runway.',
  '80+ Funding-ready optics — still subject to underwriting; soft-qualify then one hard ask.',
  'TIP: Complete the live scorecard in Business Credit OS — this PDF is the playbook, the OS is the tracker.',
  'Ask Finely: “Which fundability pillar is my lowest, and what is the one next action?”',
  'Book a session before your first PG-backed card if the personal file is unstable.',
  'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
];

function fundabilityCore(lensNote: string): GuideSection[] {
  return [
    {
      heading: 'Fundability roadmap — four pillars',
      bullets: [
        'KEY: Fundability is sequenced capital readiness — not a random stack of vendor apps.',
        lensNote,
        ...FUNDABILITY_PILLARS_TABLE,
        'Partner rule: lift the lowest pillar first. A strong vendor stack on a mismatched EIN still declines.',
        'TIP: Re-check pillars after every approval, denial, or bureau update — the scorecard moves.',
      ],
    },
    {
      heading: 'Fundability roadmap — stage gates',
      bullets: [
        'KEY: Stage gates protect your inquiry budget. Skipping G0–G1 for a “hot lender list” trains declines.',
        ...FUNDABILITY_STAGE_GATES,
        'Decision rule: if you fail a gate, open a Task for the fix — do not open a new hard pull.',
        'See companions: business-sequence-ladder · vendor-tier-matrix-free · loan-funding-sequence · smart-application-timing.',
      ],
    },
    {
      heading: 'Fundability roadmap — blockers & OS scorecard',
      bullets: [...FUNDABILITY_BLOCKERS, ...FUNDABILITY_OS_SCORECARD],
    },
  ];
}

/** Lens-specific fundability inserts for business e-guides. */
export function fundabilityRoadmapFor(
  lens: 'jumpstart' | 'ladder' | 'vendor' | 'optics' | 'loan' | 'timing',
): GuideSection[] {
  const notes: Record<typeof lens, string> = {
    jumpstart:
      'Jumpstart lens: weeks 1–12 map directly to G0→G4. Finish entity truth before Tier-1 volume.',
    ladder:
      'Ladder lens: each rung is a stage gate. Vendor tiers only after matchable identity.',
    vendor:
      'Vendor lens: Tier-1 reporters are the Vendor pillar — they do not replace entity or bureau match.',
    optics:
      'Optics lens: underwriters scan pillars in ~90 seconds — entity match, trade count, bank story, then docs.',
    loan:
      'Loan lens: capital asks sit on G4. Personal PG still exposes the personal file — sequence both lanes.',
    timing:
      'Timing lens: hard pulls belong after the active stage gate is green — never during a blocker week.',
  };
  return fundabilityCore(notes[lens]);
}

/** One more insight wave for non-business guides — decision rules + Finely CTAs. */
export const INSIGHT_WAVE_BY_ID: Partial<Record<string, GuideSection>> = {
  'business-credit-jumpstart': {
    heading: 'Worth-opening insight — zero to fundable decisions',
    bullets: [
      'KEY: Entity truth before vendor volume — most early denials are match failures, not “bad credit.”',
      'Decision rule: if SOS / EIN / bank / phone disagree, fix G0 before any Tier-1 app.',
      'Decision rule: max ~2 vendor apps/month in Foundation band; pay early; calendar 45-day report checks.',
      'If personal PG is required: stabilize the personal file in parallel — business thickness does not hide personal chaos.',
      'TIP: Upload every denial letter to Documents vault; it trains the next application.',
      'WARNING: Shelf entities without real activity are a red flag — never misrepresent age or revenue.',
      'Ask Finely: “Where am I on the fundability scorecard and what is gate G1 vs G2 for me?”',
      'Book a session before your first capital ask or PG-backed card if the personal lane is mid-dispute.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'business-sequence-ladder': {
    heading: 'Worth-opening insight — ladder vs spray-and-pray',
    bullets: [
      'KEY: Each ladder rung is a stage gate — skipping rungs burns inquiries and trains decline patterns.',
      'Decision rule: Tier-2/3 only after Tier-1 reporters post; revolving only after trade depth exists.',
      'Decision rule: one funding path as primary for 90 days — do not run LOC + five cards + mortgage simultaneously.',
      'TIP: Keep a vendor matrix: date | vendor | result | bureau | next eligible.',
      'WARNING: Mixing personal and business signals (wrong tax ID on forms) confuses underwriters.',
      'Ask Finely for a Tier-1 spacing calendar after you upload EIN + SOS docs.',
      'Complete the Business Credit OS fundability scorecard this week — then execute the lowest pillar.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'vendor-tier-matrix-free': {
    heading: 'Worth-opening insight — reporters over logos',
    bullets: [
      'KEY: “Offers net-30” ≠ Tier-1 reporter — research who posts to D&B / Experian Business / Equifax Business.',
      'Decision rule: minimum reportable order + pay early + 45-day check before Vendor B.',
      'Decision rule: if entity prerequisites fail, pause the matrix — applications will not fix a mismatch.',
      'TIP: Screenshot vendor statements and store beside the fundability scorecard notes.',
      'WARNING: Five same-week vendor apps often produce declines and a thin, noisy commercial file.',
      'Ask Finely / Funding Strategist before burning a month of applications.',
      'Upgrade path: Foundation → Builder → Elite when you want DFY sequencing instead of solo guesswork.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'funding-ready-underwriting-optics': {
    heading: 'Worth-opening insight — 90-second clean file',
    bullets: [
      'KEY: Manual review assigns your risk bucket in ~90 seconds — make identity, util, inquiries, and business presence boringly clean.',
      'Decision rule: close dispute branches that will appear on the lender pull before you hard-ask.',
      'Decision rule: assemble the PDF pack before the app — speed of documents is itself an optic.',
      'TIP: Run the 14-day polish sprint, then soft-qualify, then one best-fit hard pull.',
      'WARNING: Fake payroll, altered statements, or invented employment is underwriting fraud.',
      'Ask Finely: “What will a manual reviewer flag on this file in 90 seconds?”',
      'Pair with fundability pillars — optics without stage gates still declines.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'loan-funding-sequence': {
    heading: 'Worth-opening insight — one stack, one budget',
    bullets: [
      'KEY: Personal and business funding share one inquiry and optics budget — stage the stack or underwriters see chaos.',
      'Decision rule: 90-day banking relationship at the target lender before a cold LOC ask when possible.',
      'Decision rule: 5–10 targeted apps beat “500-app” lists; log bureau, date, result, next eligible.',
      'TIP: Soft-qualify → hard-pull only on best-fit products; cool down before app #2.',
      'WARNING: Never falsify income, employment, or entity data on applications.',
      'Ask Finely: “Given my inquiry count, what’s my next eligible funding window?”',
      'Fundability gate G4 must be green before large capital asks — vendors and bank pack first.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'smart-application-timing': {
    heading: 'Worth-opening insight — calendar beats hype',
    bullets: [
      'KEY: Apps are scarce — sequence them against reporting dates, inquiry budgets, and dispute freezes.',
      'Decision rule: no hard pulls during open disputes on accounts underwriters will re-pull.',
      'Decision rule: util sniper week (close −2–5 days) before material personal apps; business vendors max ~2/month early.',
      'TIP: Track personal card pulls, mortgage shopping, and business bureau pulls as separate lanes.',
      'WARNING: “Best day to apply” social posts ignore your file state — your calendar wins.',
      'Ask Finely: “Build my next 90-day application calendar from these reports.”',
      'If fundability scorecard is Foundation band: prioritize entity/vendor gates over loan apps.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'primary-tradeline-insider': {
    heading: 'Worth-opening insight — tradeline fundability filter',
    bullets: [
      'KEY: Buy thickness only after the next underwriter’s lane is clear (mortgage / auto / PG / business).',
      'If AU is discounted on your path: skip AU spend; protect inquiry budget for a primary that reports where you need it.',
      'If Metro2 contradictions remain on funding-critical accounts: dispute first — tradelines do not hide field errors.',
      'Decision rule: one new primary strategy per 60–90 days until it posts cleanly on target bureaus.',
      'TIP: Map P vs AU on all three bureaus before you pay any reseller.',
      'WARNING: Fixed-point FICO or “guaranteed approval” pitches are marketing — walk away.',
      'Ask Finely: “Given my next funding goal, do I need primary depth or utilization optics?”',
      'Book a session before purchasing combo packages if a mortgage window is inside 90 days.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'metro2-consistency-trap': {
    heading: 'Worth-opening insight — contradiction triage',
    bullets: [
      'KEY: Rank contradictions by funding impact: status/DOFD/balance/ownership beat cosmetic spelling.',
      'Decision rule: one claim · one bureau · one mail packet — never three bureaus in one envelope.',
      'If “verified” with no field change: tighten exhibits and consider method-of-verification — do not resend Round 1 verbatim.',
      'If “updated”: re-run the full consistency map before celebrating.',
      'TIP: Circle conflicting fields on a printed PDF the same day you pull.',
      'WARNING: Invented dates or balances destroy credibility and can create legal risk.',
      'Ask Finely after uploads: “List the highest-impact Metro2 contradiction on Equifax only.”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'bureau-response-decoder': {
    heading: 'Worth-opening insight — response → next action',
    bullets: [
      'KEY: Every bureau phrase maps to one next action — never to “mail everything again.”',
      'Verified + unchanged → new evidence angle or MOFV path; Updated → re-map fields; Deleted → archive and re-pull.',
      'Decision rule: open a new Task branch per response; close the old branch the same day.',
      'Silence past your calendar window → confirm delivery, then escalate with a clean packet — not anger.',
      'TIP: Screenshot the response header + tradeline block; vault before you draft follow-up.',
      'WARNING: Frivolous/duplicate findings mean you must change the claim or exhibits — not the tone.',
      'Ask Finely: “Decode this CRA response into the single next mail.”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'collections-proof-pack': {
    heading: 'Worth-opening insight — validate before you pay',
    bullets: [
      'KEY: Validation and accuracy come before settlement talk — paying first often freezes your leverage.',
      'Decision rule: if the collector cannot produce a coherent chain, document that trail before dollars.',
      'Build the proof pack: original creditor, balance math, DOFD, ownership, and mail dates in one vault folder.',
      'TIP: Keep mini-Miranda and validation requests in the same case log as dispute letters.',
      'WARNING: Phone promises about “deletion after payment” are not exhibits — get written terms.',
      'Ask Finely: “What is missing from my collections proof pack before I respond?”',
      'Book a session if you have a summons or lawsuit — do not rely on a free guide alone.',
      'COMPLIANCE: Results vary · not legal advice · not a promise of deletion.',
    ],
  },
  'permissible-purpose-scriptbook': {
    heading: 'Worth-opening insight — inquiry purpose discipline',
    bullets: [
      'KEY: Permissible-purpose fights need authorization facts — not slogans.',
      'Decision rule: if you applied, explain or age the pull; if unauthorized/unknown, CRA + furnisher with ID pack.',
      'Soft/promotional pulls rarely deserve dispute energy — protect focus for hard pulls that block funding.',
      'TIP: Log every hard pull (bureau, date, result, next eligible) before the next app.',
      'WARNING: Fabricating “not mine” on pulls you authorized creates legal exposure.',
      'Ask Finely: “Which inquiries are worth a purpose challenge vs natural decay?”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'utilization-sniper-rules': {
    heading: 'Worth-opening insight — util as underwriting optic',
    bullets: [
      'KEY: Statement close date beats due date for reported utilization — pay the snapshot, not just the interest.',
      'Decision rule: stage aggregate util (often under ~30%) before material apps; still watch single-card spikes.',
      'If funding is <21 days away: sniper-pay the cards that report this week — do not open a new revolving primary.',
      'TIP: Calendar close-minus-2–5 days for every target card; confirm posted balance in the issuer app.',
      'WARNING: Maxing a new line the week after approval invites early review and CLI friction.',
      'Ask Finely: “Build my util sniper week from these statement close dates.”',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'ucc-article-3-primer': {
    heading: 'Worth-opening insight — myth filter',
    bullets: [
      'KEY: Article 3 is about negotiable instruments — not a consumer bureau delete button.',
      'Decision rule: if advice promises debt discharge via magic UCC wording alone, treat it as misinformation and pause.',
      'Use this primer to spot myths fast; use Letter Studio + evidence for real accuracy disputes.',
      'TIP: When in doubt, ask what exhibit supports the claim — slogans are not exhibits.',
      'WARNING: Filing frivolous UCC theories into consumer disputes can harm credibility with furnishers and courts.',
      'Ask Finely: “Is this claim Article 3, UCC-1, or a consumer reporting issue?”',
      'Book a session before filing anything court-facing.',
      'COMPLIANCE: Educational only · not legal advice.',
    ],
  },
  'strawman-myths-reality': {
    heading: 'Worth-opening insight — reality over ritual',
    bullets: [
      'KEY: Strawman / redemption myths do not replace FCRA accuracy work or underwriting docs.',
      'Decision rule: if a tactic requires you to deny your identity or invent trusts on a credit app, stop.',
      'Fundable partners win with matchable files, clean optics, and honest applications — not secret names.',
      'TIP: Redirect energy to Metro2 contradictions, validation, and fundability sequencing.',
      'WARNING: Fraudulent identity theories create real legal risk.',
      'Ask Finely for a grounded next dispute or funding step after you upload reports.',
      'COMPLIANCE: Educational only · not legal advice · funding subject to underwriting.',
    ],
  },
  'ai-dispute-workflows': {
    heading: 'Worth-opening insight — AI quality gate',
    bullets: [
      'KEY: AI drafts; partners decide. Never mail invented dates, balances, or multi-claim mashups.',
      'Decision rule: attach screenshots first; if a field is not in the exhibit, it does not enter the letter.',
      'One claim per bureau branch per prompt — shotgun prompts produce shotgun responses.',
      'TIP: Link every AI draft to a portal Task and Documents vault — chat history is not your case file.',
      'WARNING: Do not use AI to invent affidavits, fake ID theft, or fabricated exhibits.',
      'Ask Finely: “Draft Round 1 for this one Equifax contradiction only.”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'combo-tradeline-ladder': {
    heading: 'Worth-opening insight — combo calendar discipline',
    bullets: [
      'KEY: Combos target AAoA / seasoning narratives — they are not magic score jumps.',
      'Decision rule: never stack a combo while funding-critical disputes are open or inquiry budget is blown.',
      'Verify primary vs AU, bureau targets, and post windows in writing before payment.',
      'TIP: Reassess at day ~35–45 and ~90; do not judge a combo the morning after purchase.',
      'WARNING: Misrepresenting ownership or age is fraud.',
      'Ask Finely: “Does my file need seasoning, revolving util help, or neither right now?”',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'ucc1-business-filing-primer': {
    heading: 'Worth-opening insight — UCC-1 vs consumer myths',
    bullets: [
      'KEY: UCC-1 is a financing statement tool in commercial contexts — not a personal credit erase spell.',
      'Decision rule: only pursue filings that match real secured transactions and counsel guidance.',
      'Business fundability still requires entity match, vendors, and bank optics — filings do not replace them.',
      'TIP: Store any legitimate filing PDFs in Documents vault with dates and secured-party names.',
      'WARNING: DIY “UCC redemption” kits that promise secret debt discharge are a red flag.',
      'Ask Finely / book a session before any filing that could affect lenders or title.',
      'COMPLIANCE: Educational only · not legal advice.',
    ],
  },
  'inquiry-removal-advanced': {
    heading: 'Worth-opening insight — inquiry budget vs removal',
    bullets: [
      'KEY: Prevention (spacing + soft-qual) beats cleanup. Removal fights need purpose facts.',
      'Decision rule: unauthorized/unknown → dispute path; authorized apps → explanation letters or aging.',
      'Near mortgage: finish inquiry hygiene months ahead — mid-process fights trigger re-underwrites.',
      'TIP: One inquiry per letter for clean tracking; vault subscriber name + date.',
      'WARNING: Fake fraud claims on authorized pulls create legal risk.',
      'Ask Finely: “Which of these hard pulls is actionable vs decay?”',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'collections-validation-deep-dive': {
    heading: 'Worth-opening insight — validation clock',
    bullets: [
      'KEY: Validation-first protects options — settlement and payment come after the paper trail.',
      'Decision rule: if sued, calendar court deadlines separately from bureau dispute clocks — both matter.',
      'Build ownership chain + balance math exhibits before you negotiate dollars.',
      'TIP: Keep collector letters, envelopes, and call logs in one vault folder labeled by account.',
      'WARNING: Ignoring a summons to “wait on validation” can produce default judgments.',
      'Ask Finely / book a session immediately if you have court papers.',
      'COMPLIANCE: Not legal advice · results vary.',
    ],
  },
  'metro2-k-segment-field-guide': {
    heading: 'Worth-opening insight — K-segment focus',
    bullets: [
      'KEY: K-segments carry specialized fields — dispute the field that is wrong, not the whole alphabet.',
      'Decision rule: screenshot the segment + surrounding tradeline context the same day.',
      'If you cannot see the field on your consumer report view, note the limitation — do not invent codes.',
      'TIP: Pair this guide with the Metro2 consistency map for status/date/balance conflicts.',
      'WARNING: Guessing segment codes in letters weakens reinvestigation.',
      'Ask Finely: “Which visible fields on this tradeline conflict?”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'eoscar-acdv-decoder': {
    heading: 'Worth-opening insight — e-OSCAR reality',
    bullets: [
      'KEY: e-OSCAR/ACDV is the furnisher↔CRA pipe — your leverage is still accurate, exhibit-backed claims.',
      'Decision rule: after “verified,” change the evidence angle or request method of verification — do not spam identical packets.',
      'Track response codes and dates in Tasks; silence and “frivolous” need different next steps.',
      'TIP: Never assume the furnisher saw your full exhibit set — label and reference clearly.',
      'WARNING: Threatening language does not improve ACDV outcomes.',
      'Ask Finely: “Given this response code path, what is Round 2?”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'dofd-reaging-audit': {
    heading: 'Worth-opening insight — DOFD as aging control',
    bullets: [
      'KEY: DOFD controls how long many negatives remain relevant — re-aging without new delinquency is high-signal.',
      'Decision rule: capture DOFD + status + payment grid the same day across all three bureaus before you write.',
      'If DOFD moves newer with no new late: open a dedicated DOFD branch — do not bury it in a multi-claim letter.',
      'TIP: Calendar the aging story; do not rely on memory of “when it went bad.”',
      'WARNING: Do not invent a DOFD — only dispute what screenshots show.',
      'Ask Finely: “Did DOFD re-age on this tradeline vs my prior pull?”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'fraud-alert-funding-timing': {
    heading: 'Worth-opening insight — alerts vs apps',
    bullets: [
      'KEY: Fraud alerts and freezes protect identity — they also change how and when funding apps succeed.',
      'Decision rule: thaw/understand alert mechanics before rate locks or time-sensitive pulls.',
      'Active identity-theft work: finish evidence and bureau steps before stacking new credit.',
      'TIP: Document alert placement/removal dates in portal case notes.',
      'WARNING: Fake identity-theft claims to erase accurate negatives are illegal.',
      'Ask Finely: “Can I apply this week with my current alert/freeze state?”',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'student-loan-metro2-playbook': {
    heading: 'Worth-opening insight — student loan optics',
    bullets: [
      'KEY: Student loans move DTI and payment fields — dispute inaccuracy, do not invent forgiveness.',
      'Decision rule: separate servicing errors, DOFD issues, and rehabilitation/IDR reporting into distinct branches.',
      'Before mortgage apps: stabilize reported payment and status; mid-dispute files get manual delays.',
      'TIP: Screenshot payment, status, and DOFD together — student loan Metro2 is dense.',
      'WARNING: Ignoring a federal loan default while disputing cosmetics can block funding harder than the dispute helps.',
      'Ask Finely: “Which student-loan fields are inaccurate vs painful but accurate?”',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'bankruptcy-rebuild-sequencer': {
    heading: 'Worth-opening insight — rebuild sequence',
    bullets: [
      'KEY: After bankruptcy, sequence is everything — hygiene → thin positive history → funding asks later.',
      'Decision rule: do not stack five new cards the month after discharge; prove on-time depth first.',
      'Keep public-record reporting accurate; dispute only true inaccuracies.',
      'TIP: Pair rebuild with utilization sniper rules and inquiry budgets.',
      'WARNING: Misrepresenting discharge status or reaffirmation facts is fraud.',
      'Ask Finely: “What is my 90-day rebuild ladder from this file?”',
      'Book a session before mortgage shopping post-BK — overlays vary.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'certified-mail-evidence-system': {
    heading: 'Worth-opening insight — mail is the exhibit spine',
    bullets: [
      'KEY: If you cannot prove what was mailed when, escalation gets harder.',
      'Decision rule: green card / tracking / contents hash (or photo of packet) go in vault the same day.',
      'One bureau branch per packet; label Tasks Day 0 and Day 35.',
      'TIP: Photograph the sealed envelope label with tracking visible before drop-off.',
      'WARNING: Online-only disputes can be faster but weaker for paper-trail escalations — choose consciously.',
      'Ask Finely: “Checklist my certified mail pack for this Equifax letter.”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'round-2-method-verification': {
    heading: 'Worth-opening insight — Round 2 discipline',
    bullets: [
      'KEY: Round 2 is a new angle — not Round 1 with louder adjectives.',
      'Decision rule: only escalate MOFV when Round 1 left material fields unchanged and your claim remains accurate.',
      'Attach new exhibits or a tighter field pair; reference prior tracking numbers.',
      'TIP: Re-pull before Round 2 — fighting a tradeline that already updated wastes a cycle.',
      'WARNING: Copy-paste Round 1 invites frivolous/duplicate responses.',
      'Ask Finely: “Draft Round 2 MOFV for this verified-unchanged tradeline.”',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'debt-settlement-tax-traps': {
    heading: 'Worth-opening insight — settle only with eyes open',
    bullets: [
      'KEY: Settlement is a later tool — validate, get written reporting terms, budget 1099-C risk.',
      'Decision rule: no wire on a phone promise about how the account “will show.”',
      'Funding optics: “settled” remarks can linger — model that against your next underwriting lane.',
      'TIP: CPA for forgiven-debt tax questions; attorney if sued.',
      'WARNING: Settlement companies that guarantee deletions or tax outcomes are a red flag.',
      'Ask Finely / book a session before you pay a large settlement.',
      'COMPLIANCE: Not tax or legal advice · results vary · funding subject to underwriting.',
    ],
  },
  'mortgage-overlay-dispute-prep': {
    heading: 'Worth-opening insight — mortgage clock',
    bullets: [
      'KEY: Finish high-impact disputes months before rate shopping — mid-process updates trigger re-underwrites.',
      'Decision rule: overlays may discount AU, collections, and inquiry patterns differently than FICO marketing charts.',
      'Stage util and freeze non-essential apps inside the shopping window.',
      'TIP: Build a mortgage-ready packet: tri-merge story, LOE drafts, and vaulted exhibits.',
      'WARNING: Opening new revolving accounts mid-underwrite can delay or kill a lock.',
      'Ask Finely: “Am I overlay-ready or still in dispute mode?”',
      'Book a session before you start rate shopping.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'identity-theft-block-unblock': {
    heading: 'Worth-opening insight — protect then unblock for funding',
    bullets: [
      'KEY: Identity theft workflows protect the file — funding apps need a deliberate unblock/thaw plan.',
      'Decision rule: complete FTC/affidavit/evidence steps before arguing with furnishers about fraud tradelines.',
      'Do not mix fake ID-theft claims with ordinary accuracy disputes.',
      'TIP: Calendar alert/freeze status before any hard pull week.',
      'WARNING: False identity-theft claims are illegal.',
      'Ask Finely: “Ordered checklist from my uploads — block, dispute, then funding unblock.”',
      'Book a session for complex multi-bureau fraud cases.',
      'COMPLIANCE: Not legal advice · results vary · funding subject to underwriting.',
    ],
  },
};

export function insightWaveSection(guideId: string): GuideSection | null {
  return INSIGHT_WAVE_BY_ID[guideId] ?? null;
}

const BUSINESS_FUNDABILITY_LENS: Partial<
  Record<string, 'jumpstart' | 'ladder' | 'vendor' | 'optics' | 'loan' | 'timing'>
> = {
  'business-credit-jumpstart': 'jumpstart',
  'business-sequence-ladder': 'ladder',
  'vendor-tier-matrix-free': 'vendor',
  'funding-ready-underwriting-optics': 'optics',
  'loan-funding-sequence': 'loan',
  'smart-application-timing': 'timing',
};

const BUSINESS_DESC_SUFFIX =
  ' Includes fundability sequencing: pillars, stage gates, blockers, and the Business Credit OS scorecard. Results vary · not legal advice · funding subject to underwriting.';

function isTerminalComplianceSection(heading: string): boolean {
  const h = heading.toLowerCase();
  return (
    h === 'disclaimer' ||
    h === 'compliance' ||
    h.includes('compliance footnotes') ||
    h.startsWith('disclaimer')
  );
}

const WAVE_MARKERS = [
  'Fundability roadmap — four pillars',
  'Worth-opening insight —',
];

function alreadyEnhanced(sections: GuideSection[]): boolean {
  return sections.some((s) => WAVE_MARKERS.some((m) => s.heading.includes(m) || s.heading.startsWith(m)));
}

/** Insert fundability roadmap + worth-opening insight sections before terminal compliance. Idempotent. */
export function enhancePartnerGuides<T extends GuideLike>(guides: T[]): T[] {
  return guides.map((guide) => {
    if (guide.id === 'credit-dispute-letter-guide') return guide;
    if (alreadyEnhanced(guide.sections)) return guide;

    const inserts: GuideSection[] = [];
    const lens = BUSINESS_FUNDABILITY_LENS[guide.id];
    if (lens) inserts.push(...fundabilityRoadmapFor(lens));
    const insight = insightWaveSection(guide.id);
    if (insight) inserts.push(insight);
    if (inserts.length === 0) return guide;

    const sections = [...guide.sections];
    let insertAt = sections.length;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (isTerminalComplianceSection(sections[i]!.heading)) {
        insertAt = i;
        break;
      }
    }
    sections.splice(insertAt, 0, ...inserts);

    let desc = guide.desc;
    if (lens && !/fundability sequencing/i.test(desc)) {
      const trimmed = desc.replace(/\s*Results vary.*$/i, '').trim();
      desc = `${trimmed}${BUSINESS_DESC_SUFFIX}`;
    }

    return { ...guide, desc, sections };
  });
}
