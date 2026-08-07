/**
 * Deepen e-guide messaging in corePartnerGuides + extendedFreeGuides.
 * Does NOT touch credit-dispute-letter-guide or PDF builders.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Load via tsx register
const require = createRequire(import.meta.url);

function hasPrefix(bullets, re) {
  return bullets.some((b) => re.test(String(b).trim()));
}

function ensureCallout(bullets, prefix, text) {
  const re = new RegExp(`^${prefix}\\s*:`, 'i');
  if (hasPrefix(bullets, re)) return bullets;
  return [...bullets, `${prefix}: ${text}`];
}

function normalizeCompliance(bullets) {
  return bullets.map((b) => {
    const s = String(b);
    if (/^COMPLIANCE\s+FOOTNOTE\s*:/i.test(s.trim())) {
      return s.replace(/^(\s*)COMPLIANCE\s+FOOTNOTE\s*:/i, '$1COMPLIANCE:');
    }
    if (/^COMPLIANCE\s+FOOTNOTE/i.test(s.trim()) && !/^COMPLIANCE\s*:/i.test(s.trim())) {
      return s.replace(/COMPLIANCE\s+FOOTNOTE/i, 'COMPLIANCE:');
    }
    return s;
  });
}

function deepenSection(sec, guideId, index, total) {
  let bullets = normalizeCompliance([...(sec.bullets || [])]);

  // First section: worth (guide-specific KEY injected in cleanup / EXTRA blocks)
  if (index === 0) {
    if (!bullets.some((b) => /partner/i.test(b))) {
      bullets.push('Worth it for partners who want a decisive next action — not another vague tip list.');
    }
  }

  // Mid sections: inject a vault tip only when sparse (avoid callout spam)
  if (bullets.length < 4) {
    bullets.push(
      'TIP: Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
    );
  }

  // Last content section before disclaimer-like endings: ensure COMPLIANCE
  const h = (sec.heading || '').toLowerCase();
  if (/disclaimer|compliance/.test(h)) {
    bullets = ensureCallout(
      bullets,
      'COMPLIANCE',
      'Results vary · not legal advice · funding subject to underwriting.',
    );
  }

  return { ...sec, bullets };
}

const CTA_BY_THEME = {
  business: [
    'Open Business Credit OS and complete the fundability scorecard before the next vendor or LOC app.',
    'Upload EIN, SOS good-standing, and bank PDFs to Documents vault — underwriters ask for them in the first 10 minutes.',
    'Ask Finely: “Build my vendor → revolving → funding calendar from these entity docs.”',
    'Book a session when you are 30–60 days from a capital ask so sequencing can be calibrated.',
    'KEY: Sequence beats volume — one clean ladder outperforms five panic apps.',
  ],
  dispute: [
    'Upload tri-bureau screenshots to Documents vault with [BUREAU]_[CREDITOR]_[YYYY-MM-DD] labels.',
    'Draft one claim per bureau branch in Letter Studio — you approve every sentence before mail.',
    'Ask Finely: “List the highest-ROI field contradictions on this tradeline.”',
    'Create Tasks for Day 0 mail and Day 35 follow-up; never rely on memory for CRA clocks.',
    'Book a session if Round 2 stalls or a summons arrives — letter strategy alone is not enough for court.',
    'TIP: Watch how / Ask Finely after uploads — attach exhibits; never ask AI to invent balances or dates.',
  ],
  funding: [
    'Stage utilization and inquiry budget in portal Tasks before any hard pull.',
    'Ask Finely: “Given my inquiry count and util, what is my next eligible application window?”',
    'Upload every approval/denial letter to Documents vault the same day.',
    'Book a session 60–90 days before mortgage or large LOC goals so overlays can be reviewed.',
    'WARNING: Do not shotgun apps while disputes are open on accounts underwriters will re-pull.',
  ],
  compliance: [
    'Stay on documentable FCRA / FDCPA / commercial-credit processes — reject always-works myth kits.',
    'Ask Finely for a checklist and exhibit list — not for discharge scripts or strawman language.',
    'Store every letter and tracking receipt in Documents vault before you escalate.',
    'Book a session (or counsel) the same week if a summons or court deadline appears.',
    'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
  ],
};

function themeFor(id) {
  if (/business|vendor|ucc1|loan-funding|primary-tradeline|combo-tradeline|sequence-ladder/i.test(id)) return 'business';
  if (/strawman|ucc-article|settlement|identity-theft/i.test(id)) return 'compliance';
  if (/funding|utilization|application|optics|fraud-alert|mortgage|inquiry-removal|bankruptcy/i.test(id)) return 'funding';
  return 'dispute';
}

const EXTRA_BY_ID = {
  'primary-tradeline-insider': {
    heading: '13. Power moves inside Finely Cred',
    bullets: [
      '1) Map primaries vs AU on all three bureaus in Documents vault.',
      '2) Ask Finely to flag thin-file vs overlay risk before you buy anything.',
      '3) Freeze non-essential hard pulls in Tasks for 60–90 days.',
      '4) Book a session if a reseller promises fixed FICO points — walk that offer through a Credit Specialist first.',
      'KEY: Primaries thicken a fundable file; they do not erase Metro2 contradictions.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'metro2-consistency-trap': {
    heading: '11. Power moves inside Finely Cred',
    bullets: [
      '1) Build a three-bureau conflict table and upload it to Documents vault.',
      '2) Ask Finely: “Which contradiction should be Round 1 on Equifax only?”',
      '3) Draft the one-claim letter in Letter Studio; mail certified; Task Day 35.',
      '4) On “updated,” re-run the full map — do not celebrate until fields agree.',
      'TIP: Watch how after your first upload if you are new to exhibit labeling.',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'bureau-response-decoder': {
    heading: '11. Power moves inside Finely Cred',
    bullets: [
      '1) Tag each CRA letter Verified / Updated / Deleted / Frivolous / Silence in the dispute case.',
      '2) Ask Finely to draft the next-branch outline — you edit facts before mail.',
      '3) Keep EXP / EQF / TUC timelines separate in Tasks.',
      '4) Escalate to CFPB only with a chronology + exhibits from Documents vault.',
      'KEY: Response type chooses the next action — emotion does not.',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'collections-proof-pack': {
    heading: '11. Power moves inside Finely Cred',
    bullets: [
      '1) Mirror the 00–05 folder structure inside Documents vault today.',
      '2) Ask Finely: “Build a chronology index from these collector PDFs.”',
      '3) Link the pack to both CRA and validation Tasks — one source of truth.',
      '4) Book a session before settlement talks if validation is incomplete.',
      'WARNING: Paying without a written agreement and a complete pack is how partners lose leverage.',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'permissible-purpose-scriptbook': {
    heading: '11. Power moves inside Finely Cred',
    bullets: [
      '1) Inventory hard inquiries across three bureaus; vault screenshots.',
      '2) Ask Finely to triage authorized vs unknown vs soft (ignore soft for score work).',
      '3) One inquiry per CRA packet; log tracking in Tasks.',
      '4) Use furnisher path for same-day duplicate pulls when that is faster.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'utilization-sniper-rules': {
    heading: '11. Power moves inside Finely Cred',
    bullets: [
      '1) Enter every statement close date into portal Tasks for the next 90 days.',
      '2) Ask Finely: “Which cards should I sniper-pay before my funding week?”',
      '3) Re-pull 7–14 days after a coordinated paydown; vault the before/after.',
      '4) Book a session if you are within 45 days of mortgage/auto apps.',
      'KEY: Control reported balances — due-date payments alone are not enough.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'business-sequence-ladder': {
    heading: '21. Power moves inside Finely Cred',
    bullets: [
      '1) Complete the Business Credit OS fundability scorecard this week.',
      '2) Upload EIN + SOS + bank statements to Documents vault before Vendor A.',
      '3) Ask Finely for a Tier-1 spacing calendar matched to your entity state.',
      '4) Book a session before your first PG-backed business card if the personal file is mid-dispute.',
      'KEY: Entity truth → bureau match → vendors → revolving → funding — never reverse.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  'ucc-article-3-primer': {
    heading: '11. Power moves inside Finely Cred',
    bullets: [
      '1) Classify your issue: reporting accuracy vs collector validation vs lawsuit.',
      '2) Ask Finely for the evidence checklist for that track — refuse myth templates.',
      '3) Build a Collections Proof Pack in Documents vault before advanced theories.',
      '4) Book counsel the same week if a note is in litigation — not after more videos.',
      'WARNING: UCC jargon in CRA letters often triggers frivolous responses.',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
  'strawman-myths-reality': {
    heading: '11. Power moves inside Finely Cred',
    bullets: [
      '1) Replace myth kits with Metro2 contradiction work in Letter Studio.',
      '2) Ask Finely only for documentable next steps — never for strawman scripts.',
      '3) Calendar every court deadline; Book a session or counsel immediately if served.',
      '4) Keep your mail log clean so CFPB escalation stays credible.',
      'KEY: Facts, procedure, and exhibits beat catchphrases every time.',
      'COMPLIANCE: Results vary · not legal advice.',
    ],
  },
};

/** Shared insight blocks reused across related extended guides */
const INSIGHT_LIBRARY = {
  decisionRulesTradelines: {
    heading: 'Decision rules partners actually use',
    bullets: [
      'If mortgage overlays discount AU: prioritize primary depth or skip AU purchases entirely.',
      'If funding is <60 days away: do not open a new primary that adds inquiry shock — stage util instead.',
      'If Metro2 contradictions remain on funding-critical accounts: dispute first, thicken later.',
      'If seller cannot name target bureau(s) and post window in writing: walk away.',
      'KEY: Match tradeline type to the next underwriting lane — not to a sale price.',
      'TIP: Reassess at day ~35–45 and again at ~90 — not the morning after payment.',
      'WARNING: Promises of fixed FICO points or guaranteed approvals are marketing — not underwriting.',
    ],
  },
  businessLadder: {
    heading: 'Numbered partner ladder (print this)',
    bullets: [
      '1) Entity truth: SOS / EIN / bank / phone / address match character-for-character.',
      '2) Bureau footprint: D-U-N-S (if used) + ghost listings fixed; NAICS consistent.',
      '3) Tier-1 vendors: 2–3 reporting net-30s; pay early; max ~2 apps/month early stage.',
      '4) Revolving: first business card knowing PG exposure; util often under ~30% before LOC apps.',
      '5) Funding pack: 3–6 mo bank PDFs + ownership docs; soft-qualify then one hard ask.',
      'KEY: Many denials are match failures — fix the file before the ask.',
      'TIP: Upload every denial letter to Documents vault; it trains the next application.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
  disputeLoop: {
    heading: 'Numbered dispute loop (one bureau branch)',
    bullets: [
      '1) Screenshot conflicting fields same day; vault with bureau + creditor + date labels.',
      '2) Write one claim in one sentence; attach minimum necessary exhibits.',
      '3) Mail certified; Task Day 0 and Day 35.',
      '4) Decode response: verified / updated / deleted / frivolous / silence.',
      '5) Open a new branch — never paste Round 1 unchanged into Round 2.',
      'KEY: Isolate one contradiction per dispute branch per bureau.',
      'TIP: Ask Finely to list contradictions after uploads — you approve every mailed sentence.',
      'WARNING: Shotgun multi-item letters produce mushy responses that are hard to escalate.',
    ],
  },
  fundingOptics: {
    heading: 'Underwriting optics decision rules',
    bullets: [
      'Aggregate revolving util: many partners stage under ~30% before material apps; single-card spikes still matter.',
      'Inquiry appetite: treat each hard pull as budget; 30–45 days spacing when building; longer near mortgage.',
      'Open disputes on key tradelines: finish or pause before rate locks / LOC apps.',
      'Identity: name / address / phone must match app + bureaus — mismatches trigger fraud queues.',
      'KEY: Make the first 90-second review boringly clean, then support with documents.',
      'WARNING: Never fake payroll, alter statements, or invent employment — underwriting fraud is a crime.',
      'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
    ],
  },
};

function expandInsightBullets(guide) {
  const id = guide.id;
  const extras = {
    'primary-tradeline-insider': [INSIGHT_LIBRARY.decisionRulesTradelines],
    'metro2-consistency-trap': [
      {
        heading: 'Insider field pairs that win rounds',
        bullets: [
          'Status "current" + recent charge-off or collection codes in the payment grid.',
          'DOFD newer than charge-off / collection open with no new delinquency event.',
          'Past due > balance on a simple revolving snapshot.',
          'Responsibility AU on your knowledge vs individual on the bureau — only dispute if true.',
          'KEY: Quote both fields with pull dates — "as you can see here on [bureau]…"',
          'WARNING: Emotional "delete everything" letters burn the same 30-day clock as precise ones.',
        ],
      },
    ],
    'bureau-response-decoder': [
      {
        heading: 'Decision tree after every CRA letter',
        bullets: [
          '1) Re-screenshot the live tradeline before drafting anything.',
          '2) Classify outcome (verified / updated / deleted / frivolous / silence).',
          '3) Choose one next action only — MOFV, new branch, archive, rewrite, or escalate.',
          '4) Update Tasks + Documents vault the same day the letter arrives.',
          '5) Freeze non-essential apps if the item is funding-critical.',
          'TIP: Partial wins still need a before/after table — mixed results create new contradictions.',
        ],
      },
    ],
    'collections-proof-pack': [
      {
        heading: 'Collector vs CRA pack slices',
        bullets: [
          'CRA slice: identity + conflicting Metro2 screenshots + prior CRA response if Round 2.',
          'Validation slice: first collector letter + your validation request + their gaps + itemization asks.',
          'Escalation slice: one-page chronology + tracking + 3–7 key PDFs — not a 200-page dump.',
          'KEY: Minimum necessary exhibits win clarity contests.',
          'TIP: "We cannot locate" replies are exhibits — vault them.',
        ],
      },
    ],
    'permissible-purpose-scriptbook': [
      {
        heading: 'Inquiry decision rules',
        bullets: [
          'Soft / promo pulls you authorized: ignore for score work.',
          'Hard pulls you applied for: explanation letter for mortgage — not fake "not mine."',
          'Unknown hard pulls: one CRA claim per inquiry + identity pack.',
          'Same lender / same day duplicates: try furnisher-direct first.',
          'KEY: Authorization truth beats template volume.',
          'COMPLIANCE: Do not fabricate fraud claims for inquiries you caused.',
        ],
      },
    ],
    'utilization-sniper-rules': [
      {
        heading: 'Sniper ranges and decision rules',
        bullets: [
          'Building band: often aim aggregate revolvers under ~30%; avoid single-card spikes above ~50–70%.',
          'Funding band (30–45 days out): drive target cards into band before statement close; freeze hard pulls.',
          'All-zeros on every card can look inactive — a small reported balance on one card is a common pattern.',
          'CLI requests can lower util math but may hard-pull — ask issuer first.',
          'KEY: Statement close controls the snapshot; due date controls interest.',
          'WARNING: Manufactured spend / cycling can violate cardholder agreements.',
        ],
      },
    ],
    'business-sequence-ladder': [INSIGHT_LIBRARY.businessLadder],
    'ucc-article-3-primer': [
      {
        heading: 'Track selector (do not mix frameworks)',
        bullets: [
          'Inaccurate bureau fields → FCRA / CRA reinvestigation (Metro2 map).',
          'Collector contacts → validation + documentation discipline.',
          'Note enforcement / lawsuit → licensed counsel + civil procedure.',
          'UCC-1 financing statements on business assets → state commercial filings (see UCC-1 primer).',
          'KEY: Article 3 is not a consumer credit delete button.',
          'WARNING: Always-works UCC discharge kits are a compliance red flag.',
        ],
      },
    ],
    'strawman-myths-reality': [
      {
        heading: 'Replace the myth with this numbered playbook',
        bullets: [
          '1) Pull reports; build a contradiction table.',
          '2) Build a proof pack; label exhibits.',
          '3) Send narrow CRA or validation letters as appropriate.',
          '4) Decode responses; branch cleanly.',
          '5) Escalate with chronology only when the packet is complete.',
          '6) For summons: attorney + calendar — no myth detours.',
          'KEY: Courts respond to procedure and documents — not all-caps theories.',
        ],
      },
    ],
    // Extended library
    'business-credit-jumpstart': [INSIGHT_LIBRARY.businessLadder],
    'loan-funding-sequence': [INSIGHT_LIBRARY.fundingOptics],
    'ai-dispute-workflows': [INSIGHT_LIBRARY.disputeLoop],
    'combo-tradeline-ladder': [INSIGHT_LIBRARY.decisionRulesTradelines],
    'ucc1-business-filing-primer': [
      {
        heading: 'Partner search & release playbook',
        bullets: [
          '1) Search debtor name + trade styles in filing state(s).',
          '2) List secured party, collateral, file date, file number.',
          '3) Flag stale filings that should have terminated after payoff.',
          '4) After payoff: written payoff + UCC-3 termination + re-search in 2–4 weeks.',
          '5) Vault PDFs under Business / Liens in Documents vault.',
          'KEY: UCC-1 is a notice of security interest — not an FCRA dispute tool.',
          'WARNING: "UCC redemption / strawman" schemes are not Finely Cred strategy.',
          'COMPLIANCE: Consult licensed counsel for filings and litigation.',
        ],
      },
    ],
    'smart-application-timing': [INSIGHT_LIBRARY.fundingOptics],
    'funding-ready-underwriting-optics': [INSIGHT_LIBRARY.fundingOptics],
    'inquiry-removal-advanced': [
      {
        heading: 'Inquiry triage decision rules',
        bullets: [
          'Hard — you applied: explanation / natural decay; not fake "not mine."',
          'Hard — unauthorized / unknown: CRA dispute + ID pack; consider furnisher.',
          'Soft / promotional: ignore for score work.',
          'Duplicate same lender same day: furnisher-direct often faster.',
          'KEY: One inquiry per letter for clean escalation later.',
          'TIP: Ask Finely to triage score-relevant vs ignore before you mail.',
          'COMPLIANCE: Do not fabricate fraud claims for authorized pulls.',
        ],
      },
    ],
    'collections-validation-deep-dive': [
      {
        heading: 'Validation-first numbered playbook',
        bullets: [
          '1) Within ~30 days of first written collector contact, send validation (certified).',
          '2) Demand itemization, agreement if claimed, and chain of assignment.',
          '3) Screenshot Metro2 collection fields (balance / DOFD / OC name) same week.',
          '4) If reporting inaccurate: open a separate FCRA bureau branch — do not merge envelopes.',
          '5) Summons = licensed attorney same week — letters alone are not enough.',
          'KEY: Challenge before you pay as the default path.',
          'WARNING: Settling without written terms can create tax and reporting surprises.',
          'COMPLIANCE: Results vary · not legal advice.',
        ],
      },
    ],
    'metro2-k-segment-field-guide': [INSIGHT_LIBRARY.disputeLoop],
    'eoscar-acdv-decoder': [
      {
        heading: 'ACDV outcome → next action matrix',
        bullets: [
          'Verified → Round 2 MOFV with same contradiction + response letter.',
          'Updated → re-screenshot all bureaus; new branch from changed fields.',
          'Deleted → archive proof; do not re-dispute the ghost.',
          'No match / incomplete → fix identifiers; identity / furnisher path.',
          'KEY: Fast "verified" often means automated confirm — not deep manual review.',
          'TIP: Decode each CRA letter into outcome → next branch → Task due date the same day.',
          'COMPLIANCE: Accurate negatives may remain after reasonable investigation.',
        ],
      },
    ],
    'dofd-reaging-audit': [
      {
        heading: 'DOFD audit decision rules',
        bullets: [
          'Never use Date Opened or Last Activity as if it were DOFD.',
          'Circle DOFD jumps after small "good faith" payments or transfers.',
          'Multi-bureau DOFD mismatch = high-ROI accuracy claim with dated exhibits.',
          'One claim per letter per bureau — do not mix three bureaus in one packet.',
          'KEY: DOFD anchors most 7-year negative reporting windows for charge-offs/collections.',
          'WARNING: Do not invent DOFD dates — only document what bureaus already show.',
          'COMPLIANCE: SOL and reporting rules vary by state and account type — get counsel when needed.',
        ],
      },
    ],
    'fraud-alert-funding-timing': [
      {
        heading: 'Thaw / apply / re-freeze playbook',
        bullets: [
          '1) Week −14: map which bureau each lender typically pulls.',
          '2) Week −7: confirm freeze/alert status on EXP / EQF / TUC; vault PINs securely.',
          '3) Week −2: identity consistency; stage util; finish key disputes.',
          '4) 24–48h before pull: thaw required bureaus.',
          '5) Day 0: apply once with a complete pack — no shotgun while thawed.',
          '6) Day +1–3: re-freeze if your security plan requires it; log inquiries.',
          'KEY: Freeze blocks pulls; alerts slow them — plan both on one calendar.',
          'TIP: Business LOC with PG still needs personal thaw even if the business file is clean.',
        ],
      },
    ],
    'student-loan-metro2-playbook': [INSIGHT_LIBRARY.disputeLoop],
    'bankruptcy-rebuild-sequencer': [
      {
        heading: 'Post-discharge decision rules',
        bullets: [
          'Fix post-discharge balance / status errors before emotional "remove bankruptcy" campaigns.',
          'Months 1–3: one clean secured tradeline + inquiry freeze; util under ~30% at statement close.',
          'Mortgage overlays often want years post-discharge — know your lane before rate shopping.',
          'Included accounts still showing open/past-due after discharge = priority accuracy claim + discharge order exhibit.',
          'KEY: Accuracy first, then rebuild — myths that deny the public record backfire.',
          'WARNING: Do not ignore a summons on a debt you believe was discharged — call your attorney the same week.',
          'COMPLIANCE: Results vary · funding subject to underwriting · not legal advice.',
        ],
      },
    ],
    'certified-mail-evidence-system': [
      {
        heading: 'Day-0 mail playbook (print)',
        bullets: [
          '1) One claim, one bureau, numbered exhibits, identity docs.',
          '2) Mail certified; upload letter + receipt to Documents vault same day.',
          '3) Task Day 35; confirm tracking acceptance within 1–3 days.',
          '4) Scan responses the day they arrive; never lose the green card.',
          '5) Escalation binder: timeline → Round 1 → tracking → response → Round 2.',
          'KEY: Third-party timestamps beat portal screenshot fog.',
          'WARNING: Three bureaus in one envelope "to save money" destroys clean escalation.',
        ],
      },
    ],
    'round-2-method-verification': [
      {
        heading: 'MOFV ask checklist',
        bullets: [
          'Who verified (name/department/path if available)?',
          'What documents or system records were reviewed?',
          'Which field was authoritative when screenshots conflict?',
          'Attach Round 1 letter + tracking + response + sharpened exhibits.',
          'KEY: "Verified" means the furnisher stood by existing data — not that your contradiction is wrong.',
          'TIP: Add side-by-side response date vs unchanged screenshot date.',
          'WARNING: Copy-pasting Round 1 unchanged usually fails — deepen the exhibit angle.',
        ],
      },
    ],
    'vendor-tier-matrix-free': [INSIGHT_LIBRARY.businessLadder],
    'debt-settlement-tax-traps': [
      {
        heading: 'Settlement decision rules (before any payment)',
        bullets: [
          'Validate and dispute inaccurate reporting first — settlement is rarely step one.',
          'Get amount, reporting language, and satisfaction terms in writing before you pay.',
          'Budget for possible 1099-C taxable income — ask a CPA, not a collector on the phone.',
          'Re-pull 30–45 days later; if status still past-due after paid/settled agreement, that is a factual claim.',
          'KEY: Written agreement beats phone promises about how the account "will show."',
          'WARNING: Large upfront fees + "delete everything" promises are scam patterns.',
          'COMPLIANCE: Not tax or legal advice · Results vary · funding subject to underwriting.',
        ],
      },
    ],
    'mortgage-overlay-dispute-prep': [INSIGHT_LIBRARY.fundingOptics],
    'identity-theft-block-unblock': [
      {
        heading: 'Identity-theft recovery playbook',
        bullets: [
          '1) File IdentityTheft.gov; vault the FTC report.',
          '2) Place extended fraud alert; confirm on all three bureaus.',
          '3) Block fraudulent tradelines with FTC report + ID per bureau checklist.',
          '4) Notify furnishers certified; consider freezes; monitor new inquiries weekly.',
          '5) Police report only when required — keep report number in the vault.',
          '6) Funding: tell lenders about alerts/freezes early; finish blocks before rate shopping when possible.',
          'KEY: This path is for accounts you did not open — supported by FTC process.',
          'WARNING: Lying about theft to remove accurate debts is fraud — do not do it.',
          'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
        ],
      },
    ],
  };
  return extras[id] || [];
}

function deepenGuide(guide) {
  const theme = themeFor(guide.id);
  let sections = guide.sections.map((s, i) => deepenSection(s, guide.id, i, guide.sections.length));

  // Insert insight expansions before disclaimer/compliance ending
  const extras = expandInsightBullets(guide);
  const insertAt = (() => {
    const idx = sections.findIndex((s) => /disclaimer|compliance footnotes|compliance$/i.test(s.heading));
    return idx === -1 ? sections.length : idx;
  })();

  for (const ex of extras) {
    if (!sections.some((s) => s.heading === ex.heading)) {
      sections.splice(insertAt, 0, ex);
    }
  }

  // Power CTA section
  const powerHeading = 'Power moves inside Finely Cred';
  const hasPower = sections.some((s) => /power moves inside finely|finely cred (partner )?workflow|finely cred workflow/i.test(s.heading));
  if (!hasPower) {
    const cta = EXTRA_BY_ID[guide.id] || {
      heading: powerHeading,
      bullets: CTA_BY_THEME[theme],
    };
    // rename if EXTRA has numbered heading
    const block = EXTRA_BY_ID[guide.id]
      ? EXTRA_BY_ID[guide.id]
      : {
          heading: powerHeading,
          bullets: [
            ...CTA_BY_THEME[theme],
            ...(theme === 'business'
              ? ['Open Business Credit OS when entity docs are ready — do not apply blind.']
              : []),
          ],
        };
    const idx = sections.findIndex((s) => /disclaimer|compliance footnotes|^compliance$/i.test(s.heading.trim()));
    if (idx === -1) sections.push(block);
    else sections.splice(idx, 0, block);
  } else {
    // Strengthen existing workflow sections with decisive CTAs
    sections = sections.map((s) => {
      if (!/finely cred|power moves/i.test(s.heading)) return s;
      let bullets = [...s.bullets];
      if (!bullets.some((b) => /Ask Finely/i.test(b))) {
        bullets.push('Ask Finely after you upload exhibits — attach screenshots; never invent fields.');
      }
      if (!bullets.some((b) => /Documents vault|Documents Vault/i.test(b))) {
        bullets.push('Store every letter, screenshot, and tracking PDF in Documents vault the same day.');
      }
      if (!bullets.some((b) => /Book a session/i.test(b)) && /funding|mortgage|business|settlement|identity|bankruptcy|vendor/i.test(guide.id + s.heading)) {
        bullets.push('Book a session when the next decision is high-stakes (funding, settlement, summons, or identity theft).');
      }
      if (!hasPrefix(bullets, /^KEY\s*:/i)) {
        bullets = ensureCallout(bullets, 'KEY', 'One obvious next action beats five open tabs — finish the current branch.');
      }
      return { ...s, bullets };
    });
  }

  // Ensure a disclaimer/compliance ending exists with COMPLIANCE:
  const last = sections[sections.length - 1];
  if (!/disclaimer|compliance/i.test(last.heading)) {
    sections.push({
      heading: 'Compliance & disclaimer',
      bullets: [
        'Educational only; not legal, tax, or financial advice. Outcomes depend on facts, furnishers, lenders, and jurisdiction.',
        'COMPLIANCE: Results vary · not legal advice · funding subject to underwriting.',
      ],
    });
  } else {
    sections[sections.length - 1] = {
      ...last,
      bullets: ensureCallout(
        normalizeCompliance(last.bullets),
        'COMPLIANCE',
        'Results vary · not legal advice · funding subject to underwriting.',
      ),
    };
  }

  // Fill still-sparse sections (once, without repeating the same filler everywhere)
  sections = sections.map((s) => {
    let bullets = [...s.bullets];
    if (!/disclaimer|compliance/i.test(s.heading) && bullets.length < 5) {
      if (!hasPrefix(bullets, /^TIP\s*:/i)) {
        bullets = ensureCallout(
          bullets,
          'TIP',
          'Screenshot and vault the fields you rely on the same day you act — memory is not an exhibit.',
        );
      }
      if (bullets.length < 5) {
        bullets.push('Partner rule: finish one clear next action before opening a second branch.');
      }
    }
    return { ...s, bullets };
  });

  return { ...guide, sections };
}

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n');
}

function emitGuide(g, indent = 2) {
  const sp = ' '.repeat(indent);
  const sp2 = ' '.repeat(indent + 2);
  const sp3 = ' '.repeat(indent + 4);
  const sp4 = ' '.repeat(indent + 6);
  let out = `${sp}{\n`;
  out += `${sp2}id: '${g.id}',\n`;
  out += `${sp2}title: '${esc(g.title)}',\n`;
  out += `${sp2}desc: '${esc(g.desc)}',\n`;
  out += `${sp2}sections: [\n`;
  for (const sec of g.sections) {
    out += `${sp3}{\n`;
    out += `${sp4}heading: '${esc(sec.heading)}',\n`;
    out += `${sp4}bullets: [\n`;
    for (const b of sec.bullets) {
      out += `${' '.repeat(indent + 8)}'${esc(b)}',\n`;
    }
    out += `${sp4}],\n`;
    out += `${sp3}},\n`;
  }
  out += `${sp2}],\n`;
  out += `${sp}}`;
  return out;
}

async function main() {
  // Dynamic import through tsx
  const { register } = await import('node:module');
  // Use child process via npx tsx to dump JSON instead
  const { spawnSync } = await import('node:child_process');
  const dump = `
import { CORE_PARTNER_GUIDES } from './src/resources/corePartnerGuides.ts';
import { EXTENDED_FREE_GUIDES } from './src/resources/extendedFreeGuides.ts';
import fs from 'node:fs';
fs.writeFileSync('.tmp-guides-dump.json', JSON.stringify({ core: CORE_PARTNER_GUIDES, extended: EXTENDED_FREE_GUIDES }, null, 2));
`;
  fs.writeFileSync(path.join(root, '.tmp-dump-guides.ts'), dump);
  const r = spawnSync('npx', ['tsx', '.tmp-dump-guides.ts'], { cwd: root, encoding: 'utf8', shell: true });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(path.join(root, '.tmp-guides-dump.json'), 'utf8'));

  const coreDeep = data.core.map(deepenGuide);
  const extDeep = data.extended.map(deepenGuide);

  const coreSrc =
    `import type { FreeGuide } from './freeGuides';\n\n` +
    `/**\n` +
    ` * Core FREE_GUIDES bodies (excludes credit-dispute-letter-guide).\n` +
    ` * Full partner-facing education copy for PDF generation.\n` +
    ` */\n` +
    `export const CORE_PARTNER_GUIDES: FreeGuide[] = [\n` +
    coreDeep.map((g) => emitGuide(g)).join(',\n') +
    `\n];\n`;

  const extSrc =
    `import type { FreeGuide } from './freeGuides';\n\n` +
    `/** Premium education library — insider topics, partner-first voice. Educational only. */\n` +
    `export const EXTENDED_FREE_GUIDES: FreeGuide[] = [\n` +
    extDeep.map((g) => emitGuide(g)).join(',\n') +
    `\n];\n`;

  fs.writeFileSync(path.join(root, 'src/resources/corePartnerGuides.ts'), coreSrc);
  fs.writeFileSync(path.join(root, 'src/resources/extendedFreeGuides.ts'), extSrc);

  const stats = (guides) =>
    guides.map((g) => ({
      id: g.id,
      sections: g.sections.length,
      bullets: g.sections.reduce((n, s) => n + s.bullets.length, 0),
      callouts: g.sections.reduce(
        (n, s) => n + s.bullets.filter((b) => /^(KEY|TIP|WARNING|COMPLIANCE)\s*:/i.test(String(b).trim())).length,
        0,
      ),
    }));

  console.log(JSON.stringify({ core: stats(coreDeep), extended: stats(extDeep) }, null, 2));

  fs.unlinkSync(path.join(root, '.tmp-dump-guides.ts'));
  fs.unlinkSync(path.join(root, '.tmp-guides-dump.json'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
