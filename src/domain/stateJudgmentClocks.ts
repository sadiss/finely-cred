/**
 * Per-state vacate / confession-of-judgment / appeal clocks.
 * Separate from levy exemption claim days. Educational only — confirm with counsel.
 */

import type { ClaimDeadlineKind } from './stateExemptions';

export type JudgmentClockKind = 'vacate' | 'appeal' | 'coj';

/** Conservative COJ flag — `available` is only for a live general consumer path. */
export type CojAvailability = 'available' | 'limited' | 'rare' | 'unused';

export type PostJudgmentProcedureClock = {
  kind: JudgmentClockKind;
  days: number | null;
  deadlineKind: ClaimDeadlineKind;
  citation: string;
  note: string;
  /** True only when a general consumer timer should spawn. Limited / rare / unused stay false. */
  available: boolean;
  /** Counsel-style COJ status. Omitted on vacate / appeal clocks. */
  cojAvailability?: CojAvailability;
};

export type AppealExtensionClock = PostJudgmentProcedureClock & {
  /** Gate only — days still count from judgment entry, never from the motion date. */
  trigger: 'post_trial_motion';
};

export type CollateralReviewClock = {
  kind: 'restricted_appeal' | 'bill_of_review';
  days: number;
  deadlineKind: ClaimDeadlineKind;
  citation: string;
  note: string;
  /** Timer appears only when the matching case fact already exists. */
  trigger: 'no_participation' | 'bill_of_review_noted';
};

export type StateJudgmentClocks = {
  state: string;
  vacate: PostJudgmentProcedureClock;
  appeal: PostJudgmentProcedureClock;
  coj: PostJudgmentProcedureClock;
  /** Optional longer appeal track. Timer is created only when a motion date is on the case. */
  appealExtension?: AppealExtensionClock;
  restrictedAppeal?: CollateralReviewClock;
  billOfReview?: CollateralReviewClock;
};

const CONFIRM =
  'Confirm the triggering event (entry, notice of entry, or service) and any motion that extends the clock with counsel. Not legal advice.';

function vacate(
  days: number | null,
  citation: string,
  note: string,
  deadlineKind: ClaimDeadlineKind = 'calendar',
): PostJudgmentProcedureClock {
  return { kind: 'vacate', days, deadlineKind, citation, note: `${note} ${CONFIRM}`, available: true };
}

function appeal(
  days: number | null,
  citation: string,
  note: string,
  deadlineKind: ClaimDeadlineKind = 'calendar',
): PostJudgmentProcedureClock {
  return { kind: 'appeal', days, deadlineKind, citation, note: `${note} ${CONFIRM}`, available: true };
}

function coj(
  state: string,
  args: {
    days?: number | null;
    citation: string;
    note: string;
    available?: boolean;
    availability?: CojAvailability;
    deadlineKind?: ClaimDeadlineKind;
  },
): PostJudgmentProcedureClock {
  const cojAvailability: CojAvailability = args.availability ?? (args.available ? 'available' : 'unused');
  const available = cojAvailability === 'available';
  return {
    kind: 'coj',
    days: available ? args.days ?? null : null,
    deadlineKind: args.deadlineKind ?? 'calendar',
    citation: args.citation,
    note: `${args.note} ${CONFIRM}`,
    available,
    cojAvailability,
  };
}

function residual(days: number, citation: string, note: string): CollateralReviewClock {
  return {
    kind: 'bill_of_review',
    days,
    deadlineKind: 'calendar',
    citation,
    note: `${note} ${CONFIRM}`,
    trigger: 'bill_of_review_noted',
  };
}

function pack(
  state: string,
  vacateClock: PostJudgmentProcedureClock,
  appealClock: PostJudgmentProcedureClock,
  cojClock: PostJudgmentProcedureClock,
  extras?: {
    appealExtension?: AppealExtensionClock;
    restrictedAppeal?: CollateralReviewClock;
    billOfReview?: CollateralReviewClock;
  },
): StateJudgmentClocks {
  return {
    state,
    vacate: vacateClock,
    appeal: appealClock,
    coj: cojClock,
    ...(extras?.appealExtension ? { appealExtension: extras.appealExtension } : {}),
    ...(extras?.restrictedAppeal ? { restrictedAppeal: extras.restrictedAppeal } : {}),
    ...(extras?.billOfReview ? { billOfReview: extras.billOfReview } : {}),
  };
}

const UNUSED_COJ_NOTE =
  'Consumer confession-of-judgment / cognovit practice is generally unused or tightly restricted here. Treat any “confessed” paper as an emergency for counsel — do not assume a long window.';

const CLOCKS: Record<string, StateJudgmentClocks> = {
  AL: pack(
    'AL',
    vacate(30, 'Ala. R. Civ. P. 60', 'Rule 60 relief — some grounds have a one-year outer limit; move promptly after you learn of the judgment.'),
    appeal(42, 'Ala. R. App. P. 4', 'Notice of appeal is commonly 42 days from entry of the judgment appealed.'),
    coj('AL', { days: null, available: false, citation: 'Ala. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  AK: pack(
    'AK',
    vacate(30, 'Alaska R. Civ. P. 60', 'Rule 60 — mistake / new evidence / fraud often have a one-year outer limit; treat 30 days after notice as the first-action window.'),
    appeal(30, 'Alaska R. App. P. 204(a)', 'Notice of appeal is commonly 30 days from the date shown on the judgment or distribution.'),
    coj('AK', { days: null, available: false, citation: 'Alaska confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  AZ: pack(
    'AZ',
    vacate(30, 'Ariz. R. Civ. P. 60', 'Rule 60 relief — some grounds run six months from entry. Move as soon as you have notice.'),
    appeal(30, 'ARCAP 9', 'Civil notice of appeal is commonly 30 days from entry of judgment.'),
    coj('AZ', { days: null, available: false, citation: 'Ariz. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  AR: pack(
    'AR',
    vacate(90, 'Ark. R. Civ. P. 60', 'Many Rule 60 motions must be filed within 90 days of entry; other grounds differ. Do not wait 90 days if a levy is active.'),
    appeal(30, 'Ark. R. App. P. 4', 'Notice of appeal is commonly 30 days from entry of judgment.'),
    coj('AR', {
      availability: 'rare',
      citation: 'Ark. cognovit / warrant-of-attorney practice (restricted)',
      note: 'Rare in consumer cases. A confession or warrant of attorney is not a general Arkansas collection path — treat any such paper as an emergency for counsel, not a routine 30-day track.',
    }),
  ),
  CA: pack(
    'CA',
    vacate(180, 'Cal. Civ. Proc. Code §§ 473(b), 473.5', 'CCP 473(b) attorney-fault / mistake relief is often six months from entry. CCP 473.5 (no actual notice) can be longer. File as soon as you have notice. An independent action in equity has no single day count here — note only, no invented timer.'),
    appeal(60, 'Cal. Rules of Court 8.104', 'Notice of appeal is commonly 60 days after notice of entry (or 180 days after entry if no notice).'),
    coj('CA', {
      availability: 'rare',
      citation: 'Cal. Civ. Proc. Code §§ 1132–1134',
      note: 'Rare. CCP 1132–1134 remain on the books but require a verified statement after the obligation arose (often with attorney involvement). This is not a general consumer collection path. If a confessed judgment appeared without a normal lawsuit, treat it as an emergency for counsel.',
    }),
    {
      billOfReview: residual(
        730,
        'Cal. Civ. Proc. Code § 473.5',
        'Residual no-actual-notice relief under CCP 473.5 is often discussed as two years from entry (or about 180 days after notice of the judgment). The timer appears only when a residual-review date is already on the case and uses the judgment date. Do not invent that date.',
      ),
    },
  ),
  CO: pack(
    'CO',
    vacate(30, 'C.R.C.P. 60', 'Rule 60 — some grounds have a six-month outer limit. Move promptly after notice.'),
    appeal(49, 'C.A.R. 4', 'Colorado civil notices of appeal are commonly 49 days from entry of judgment.'),
    coj('CO', { days: null, available: false, citation: 'Colo. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  CT: pack(
    'CT',
    vacate(20, 'Conn. Practice Book § 17-43', 'Motions to open a judgment are often due within four months of notice — treat the printed order as controlling and move immediately if a levy is running.'),
    appeal(20, 'Conn. Practice Book § 63-1', 'Appeal period is commonly 20 days from notice of judgment.'),
    coj('CT', { days: null, available: false, citation: 'Conn. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  DE: pack(
    'DE',
    vacate(30, 'Del. Super. Ct. Civ. R. 60', 'Rule 60 relief — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Del. Supr. Ct. R. 6', 'Notice of appeal is commonly 30 days from the date of the order.'),
    coj('DE', { days: null, available: false, citation: 'Del. cognovit practice', note: UNUSED_COJ_NOTE }),
  ),
  DC: pack(
    'DC',
    vacate(30, 'D.C. Super. Ct. Civ. R. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'D.C. App. R. 4', 'Notice of appeal is commonly 30 days from entry of judgment.'),
    coj('DC', { days: null, available: false, citation: 'D.C. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  FL: pack(
    'FL',
    vacate(30, 'Fla. R. Civ. P. 1.540', 'Rule 1.540 — some grounds have a one-year outer limit. File as soon as you have notice of the judgment or levy. Coram nobis is mainly criminal; a civil independent action in equity has no single day count here — note only, no invented timer.'),
    appeal(30, 'Fla. R. App. P. 9.110', 'Notice of appeal is commonly 30 days from rendition of the order.'),
    coj('FL', { days: null, available: false, citation: 'Fla. Stat. confession / cognovit limits', note: UNUSED_COJ_NOTE }),
    {
      billOfReview: residual(
        365,
        'Fla. R. Civ. P. 1.540(b)',
        'After the short first-action window, some Rule 1.540(b) grounds (mistake, fraud, new evidence) have a one-year outer limit. Void-judgment grounds can be longer. The timer appears only when a residual-review date is already on the case.',
      ),
    },
  ),
  GA: pack(
    'GA',
    vacate(30, 'O.C.G.A. § 9-11-60', 'Motions to set aside have short and ground-specific windows. Treat 30 days after knowledge as the first-action target.'),
    appeal(30, 'O.C.G.A. § 5-6-38', 'Notice of appeal is commonly 30 days from entry of judgment.'),
    coj('GA', { days: null, available: false, citation: 'Ga. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
    {
      billOfReview: residual(
        1095,
        'O.C.G.A. § 9-11-60(d)',
        'Some motions to set aside have a three-year outer limit. This is not the 30-day first-action window. The timer appears only when a residual-review date is already on the case.',
      ),
    },
  ),
  HI: pack(
    'HI',
    vacate(30, 'Haw. R. Civ. P. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Haw. R. App. P. 4', 'Notice of appeal is commonly 30 days from entry of judgment.'),
    coj('HI', { days: null, available: false, citation: 'Haw. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  ID: pack(
    'ID',
    vacate(30, 'I.R.C.P. 60', 'Rule 60 — some grounds have a six-month outer limit. Move promptly after notice.'),
    appeal(42, 'I.A.R. 14', 'Idaho civil appeals are commonly 42 days from the file-stamped judgment.'),
    coj('ID', { days: null, available: false, citation: 'Idaho confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  IL: pack(
    'IL',
    vacate(30, '735 ILCS 5/2-1301; 735 ILCS 5/2-1401', 'A default may be vacated within 30 days of entry under 2-1301; a 2-1401 petition can reach further (often two years) on different grounds.'),
    appeal(30, 'Ill. Sup. Ct. R. 303', 'Notice of appeal is commonly 30 days from the final judgment.'),
    coj('IL', {
      availability: 'limited',
      citation: '735 ILCS 5/2-1301(c)',
      note: 'Limited. Section 2-1301(c) still mentions confession, but consumer confession-of-judgment is not a general Illinois path. If a judgment appeared without a normal summons, ask counsel about opening it immediately — do not treat this as an available consumer timer.',
    }),
    {
      billOfReview: residual(
        730,
        '735 ILCS 5/2-1401',
        'A 2-1401 petition is residual relief after the 30-day 2-1301 window — commonly two years from entry, on different grounds. The timer appears only when a residual-review date is already on the case. Do not invent that date.',
      ),
    },
  ),
  IN: pack(
    'IN',
    vacate(30, 'Ind. Trial Rule 60', 'Trial Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Ind. Appellate Rule 9', 'Notice of appeal is commonly 30 days from the date of the judgment or appealable order.'),
    coj('IN', { days: null, available: false, citation: 'Ind. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
    {
      billOfReview: residual(
        365,
        'Ind. Trial Rule 60(B)',
        'Some Trial Rule 60(B) grounds have a one-year outer limit after the short first-action window. The timer appears only when a residual-review date is already on the case.',
      ),
    },
  ),
  IA: pack(
    'IA',
    vacate(30, 'Iowa R. Civ. P. 1.1012', 'Motions to vacate or modify have short, ground-specific windows. Move promptly after notice.'),
    appeal(30, 'Iowa R. App. P. 6.101', 'Notice of appeal is commonly 30 days from the final order.'),
    coj('IA', { days: null, available: false, citation: 'Iowa confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  KS: pack(
    'KS',
    vacate(30, 'K.S.A. 60-260', 'Rule 60-style relief — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'K.S.A. 60-2103', 'Notice of appeal is commonly 30 days from entry of judgment.'),
    coj('KS', { days: null, available: false, citation: 'Kan. cognovit limits', note: UNUSED_COJ_NOTE }),
  ),
  KY: pack(
    'KY',
    vacate(30, 'Ky. CR 60.02', 'CR 60.02 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Ky. CR 73.02', 'Notice of appeal is commonly 30 days from the date of notation of service of the judgment.'),
    coj('KY', { days: null, available: false, citation: 'Ky. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  LA: pack(
    'LA',
    vacate(30, 'La. C.C.P. arts. 2002–2006', 'Actions to annul a judgment have distinct “vices of form” vs. “vices of substance” clocks. Treat 30 days after knowledge as the first-action target.'),
    appeal(30, 'La. C.C.P. arts. 2087, 2123', 'Suspensive appeals are often 30 days; devolutive appeals can be longer. Confirm which track counsel is using.'),
    coj('LA', { days: null, available: false, citation: 'La. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  ME: pack(
    'ME',
    vacate(30, 'M.R. Civ. P. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(21, 'M.R. App. P. 2B', 'Notice of appeal is commonly 21 days from entry of judgment.'),
    coj('ME', { days: null, available: false, citation: 'Me. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  MD: pack(
    'MD',
    vacate(30, 'Md. Rule 2-535', 'Revisory power is often 30 days after entry; later relief is narrower. Move immediately if a levy is running.'),
    appeal(30, 'Md. Rule 8-202', 'Notice of appeal is commonly 30 days after entry of the judgment or order.'),
    coj('MD', {
      availability: 'limited',
      citation: 'Md. Rules 2-611, 3-611',
      note: 'Limited. Maryland still has a live confessed-judgment procedure on some notes. Consumer use is restricted. Treat any confessed paper as an emergency for counsel — not a general consumer timer.',
    }),
  ),
  MA: pack(
    'MA',
    vacate(30, 'Mass. R. Civ. P. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Mass. R. App. P. 4', 'Notice of appeal is commonly 30 days from entry of judgment.'),
    coj('MA', { days: null, available: false, citation: 'Mass. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  MI: pack(
    'MI',
    vacate(21, 'MCR 2.612', 'Relief from judgment — some grounds have a one-year outer limit. Circuit-court appeal windows can be 21 days; do not wait.'),
    appeal(21, 'MCR 7.204', 'Claim of appeal from a circuit-court judgment is commonly 21 days from entry.'),
    coj('MI', { days: null, available: false, citation: 'Mich. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  MN: pack(
    'MN',
    vacate(30, 'Minn. R. Civ. P. 60.02', 'Rule 60.02 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(60, 'Minn. R. Civ. App. P. 104.01', 'Appeal time is commonly 60 days after service of notice of filing by the prevailing party.'),
    coj('MN', { days: null, available: false, citation: 'Minn. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  MS: pack(
    'MS',
    vacate(30, 'Miss. R. Civ. P. 60', 'Rule 60 — some grounds have a six-month outer limit. Move promptly after notice.'),
    appeal(30, 'Miss. R. App. P. 4', 'Notice of appeal is commonly 30 days from entry of the judgment or order.'),
    coj('MS', { days: null, available: false, citation: 'Miss. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  MO: pack(
    'MO',
    vacate(30, 'Mo. Sup. Ct. R. 74.05, 74.06', 'Motions to set aside a default are short. Rule 74.06 has ground-specific outer limits. Move immediately if you just learned of the judgment.'),
    appeal(10, 'Mo. Sup. Ct. R. 81.04', 'Missouri’s notice-of-appeal window after a judgment becomes final is commonly 10 days — confirm finality and any after-trial motion that changes the count.'),
    coj('MO', { days: null, available: false, citation: 'Mo. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  MT: pack(
    'MT',
    vacate(30, 'M. R. Civ. P. 60', 'Rule 60 — some grounds have a one-year or six-month outer limit. Move promptly after notice.'),
    appeal(30, 'M. R. App. P. 4', 'Notice of appeal is commonly 30 days from entry of judgment.'),
    coj('MT', { days: null, available: false, citation: 'Mont. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  NE: pack(
    'NE',
    vacate(30, 'Neb. Rev. Stat. § 25-2001', 'Vacate statutes mix term-of-court and later grounds (including a common six-month track). Treat 30 days after notice as the first-action window.'),
    appeal(30, 'Neb. Rev. Stat. § 25-1912', 'Notice of appeal is commonly 30 days from entry of the judgment or final order.'),
    coj('NE', {
      availability: 'rare',
      citation: 'Neb. confession-of-judgment / warrant practice (restricted)',
      note: 'Rare in consumer cases. Historical confession statutes are not a general Nebraska collection path. If a confessed paper appeared, ask counsel about opening it immediately.',
    }),
  ),
  NV: pack(
    'NV',
    vacate(30, 'N.R.C.P. 60', 'Rule 60 — some grounds have a six-month outer limit. Move promptly after notice.'),
    appeal(30, 'N.R.A.P. 4', 'Notice of appeal is commonly 30 days from entry of the written judgment.'),
    coj('NV', { days: null, available: false, citation: 'Nev. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  NH: pack(
    'NH',
    vacate(30, 'N.H. Super. Ct. Civ. R. 12 / Dist. Div. rules', 'Motions to strike or vacate a default have short local windows. Move promptly after notice.'),
    appeal(30, 'N.H. Sup. Ct. R. 7', 'Supreme Court appeal is commonly 30 days from the date on the clerk’s written notice of the decision.'),
    coj('NH', { days: null, available: false, citation: 'N.H. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  NJ: pack(
    'NJ',
    vacate(30, 'N.J. Ct. R. 4:50-1, 4:50-2', 'Rule 4:50 — mistake / new evidence / fraud often have a one-year outer limit. Move as soon as you have notice of the judgment or levy.'),
    appeal(45, 'N.J. Ct. R. 2:4-1', 'Notice of appeal is commonly 45 days from the date of the judgment or order.'),
    coj('NJ', { days: null, available: false, citation: 'N.J. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
    {
      billOfReview: residual(
        365,
        'N.J. Ct. R. 4:50-2',
        'Some Rule 4:50-1 grounds have a one-year outer limit after the short first-action window. The timer appears only when a residual-review date is already on the case.',
      ),
    },
  ),
  NM: pack(
    'NM',
    vacate(30, 'Rule 1-060 NMRA', 'Rule 1-060 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Rule 12-201 NMRA', 'Notice of appeal is commonly 30 days after the judgment or order is filed.'),
    coj('NM', { days: null, available: false, citation: 'N.M. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  NY: pack(
    'NY',
    vacate(365, 'CPLR 5015(a); CPLR 317', 'CPLR 5015(a)(1) is commonly one year from service of the judgment with notice of entry. CPLR 317 can be longer if you were not personally served. Do not wait a year if a levy is active. An independent action for fraud has no single day count here — note only, no invented timer.'),
    appeal(30, 'CPLR 5513', 'Time to take an appeal is commonly 30 days from service of the judgment or order with notice of entry.'),
    coj('NY', {
      availability: 'limited',
      citation: 'CPLR 3218; 2019 confession reforms; CPLR 5015',
      note: 'Limited. CPLR 3218 still allows some in-state confessions; 2019 reforms sharply restricted out-of-state and consumer / merchant-cash-advance style filings. This is not a general consumer path. Treat any confessed judgment as an immediate vacate / stay question for counsel.',
    }),
    {
      billOfReview: residual(
        365,
        'CPLR 5015(a); CPLR 317',
        'Residual vacate practice after the first levy emergency: CPLR 5015(a)(1) is commonly one year from service of the judgment with notice of entry. CPLR 317 can reach further (up to five years from entry) if the partner was not personally served. The timer uses the one-year planning figure and appears only when a residual-review date is already on the case.',
      ),
    },
  ),
  NC: pack(
    'NC',
    vacate(30, 'N.C. R. Civ. P. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'N.C. R. App. P. 3', 'Notice of appeal is commonly 30 days from entry of judgment.'),
    coj('NC', { days: null, available: false, citation: 'N.C. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  ND: pack(
    'ND',
    vacate(30, 'N.D.R.Civ.P. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(60, 'N.D.R.App.P. 4', 'Notice of appeal is commonly 60 days from service of notice of entry of the judgment.'),
    coj('ND', { days: null, available: false, citation: 'N.D. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  OH: pack(
    'OH',
    vacate(30, 'Ohio Civ.R. 60', 'Civ.R. 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Ohio App.R. 4', 'Notice of appeal is commonly 30 days from entry of the judgment or order.'),
    coj('OH', {
      availability: 'limited',
      citation: 'Ohio Rev. Code § 2323.13; Civ.R. 60',
      note: 'Limited. Cognovit / warrant-of-attorney judgments still exist with statutory warning language, but consumer transactions are tightly restricted. If a confessed judgment appeared, treat it as an emergency for counsel — not a routine available timer.',
    }),
    {
      billOfReview: residual(
        365,
        'Ohio Civ.R. 60(B)',
        'Civ.R. 60(B)(1)–(3) grounds commonly have a one-year outer limit after the short first-action window. The timer appears only when a residual-review date is already on the case.',
      ),
    },
  ),
  OK: pack(
    'OK',
    vacate(30, '12 O.S. § 1031', 'Vacate statutes have ground-specific outer limits (including a common 30-day track). Move immediately if a levy is running.'),
    appeal(30, 'Okla. Sup. Ct. R. 1.21', 'Petition in error is commonly 30 days from the date of the judgment.'),
    coj('OK', { days: null, available: false, citation: 'Okla. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
    {
      billOfReview: residual(
        730,
        '12 O.S. § 1038',
        'Proceedings to vacate after the short first-action window often have a two-year outer limit (some fraud grounds can be three). The timer uses the two-year planning figure and appears only when a residual-review date is already on the case.',
      ),
    },
  ),
  OR: pack(
    'OR',
    vacate(30, 'ORCP 71', 'ORCP 71 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'ORS 19.255', 'Notice of appeal is commonly 30 days after the judgment is entered.'),
    coj('OR', { days: null, available: false, citation: 'Or. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  PA: pack(
    'PA',
    vacate(10, 'Pa.R.C.P. 237.3; Pa.R.C.P. 3051', 'A petition to open a default can be extremely short. Some strike/open practice is measured in days. File immediately if you just learned of the judgment.'),
    appeal(30, 'Pa.R.A.P. 903', 'Notice of appeal is commonly 30 days from entry of the order.'),
    coj('PA', {
      availability: 'limited',
      citation: 'Pa.R.C.P. 2950–2967; 42 Pa.C.S. confession practice',
      note: 'Limited. Pennsylvania still uses confession-of-judgment on many commercial notes; consumer and residential use is restricted. Petitions to strike or open are emergency filings with short printed deadlines — not a general consumer “available” track.',
    }),
  ),
  RI: pack(
    'RI',
    vacate(30, 'R.I. Super. R. Civ. P. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(20, 'R.I. Supreme Court Article I, Rule 4', 'Notice of appeal is commonly 20 days from entry of judgment.'),
    coj('RI', {
      availability: 'rare',
      citation: 'R.I. cognovit / confession practice (restricted)',
      note: 'Rare in consumer cases. Confession / warrant practice is not a general Rhode Island collection path. If such a paper appeared, ask counsel about opening it immediately.',
    }),
  ),
  SC: pack(
    'SC',
    vacate(30, 'Rule 60, SCRCP', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Rule 203, SCACR', 'Notice of appeal is commonly 30 days from receipt of written notice of entry.'),
    coj('SC', { days: null, available: false, citation: 'S.C. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  SD: pack(
    'SD',
    vacate(30, 'SDCL 15-6-60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'SDCL 15-26A-6', 'Notice of appeal is commonly 30 days from the date of the judgment or order.'),
    coj('SD', { days: null, available: false, citation: 'S.D. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  TN: pack(
    'TN',
    vacate(30, 'Tenn. R. Civ. P. 60.02', 'Rule 60.02 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'Tenn. R. App. P. 4', 'Notice of appeal is commonly 30 days after entry of the judgment appealed.'),
    coj('TN', { days: null, available: false, citation: 'Tenn. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  TX: pack(
    'TX',
    vacate(30, 'Tex. R. Civ. P. 329b', 'Plenary power / motion for new trial is commonly 30 days from the date the judgment is signed. Missing that window can close ordinary trial-court relief.'),
    appeal(30, 'Tex. R. App. P. 26.1', 'Notice of appeal is commonly 30 days after the judgment is signed. A qualifying timely post-trial motion can extend the notice to 90 days from the judgment date — not from the motion date. The extended timer appears only when a motion date is already on this case.'),
    coj('TX', {
      availability: 'rare',
      citation: 'Tex. R. Civ. P. 314',
      note: 'Rare. Texas does not use Pennsylvania-style consumer cognovit notes. Rule 314 is a confession in the pending action. If a judgment appeared without a normal answer opportunity, the live tracks are usually a restricted appeal or a bill of review — not a confession-of-judgment timer.',
    }),
    {
      appealExtension: {
        kind: 'appeal',
        days: 90,
        deadlineKind: 'calendar',
        citation: 'Tex. R. App. P. 26.1(a)(1)',
        note: `${CONFIRM} Ninety days from the date the judgment is signed if a qualifying motion for new trial, motion to modify, motion to reinstate, or request for findings was timely filed. Do not invent a motion date. The extra timer uses the judgment date, not the motion date.`,
        available: true,
        trigger: 'post_trial_motion',
      },
      restrictedAppeal: {
        kind: 'restricted_appeal',
        days: 180,
        deadlineKind: 'calendar',
        citation: 'Tex. R. App. P. 26.1(c), 30',
        note: `${CONFIRM} Restricted appeal is commonly six months from the date the judgment is signed if the partner did not participate in the hearing and did not timely file a post-judgment motion. The timer appears only when “did not participate” is already marked and a judgment date is on the case. Do not invent either fact.`,
        trigger: 'no_participation',
      },
      billOfReview: {
        kind: 'bill_of_review',
        days: 1461,
        deadlineKind: 'calendar',
        citation: 'Tex. equitable bill of review (trial-court residual relief)',
        note: `${CONFIRM} A bill of review is extraordinary residual relief after plenary power closes — often discussed with a four-year outer limit, but grounds are narrow. The timer appears only when a bill-of-review date is already on the case. Do not invent that date.`,
        trigger: 'bill_of_review_noted',
      },
    },
  ),
  UT: pack(
    'UT',
    vacate(28, 'Utah R. Civ. P. 60', 'Rule 60 — some grounds have a 90-day or reasonable-time outer limit. Move promptly after notice.'),
    appeal(30, 'Utah R. App. P. 4', 'Notice of appeal is commonly 30 days from entry of the judgment or order.'),
    coj('UT', { days: null, available: false, citation: 'Utah confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  VT: pack(
    'VT',
    vacate(30, 'V.R.C.P. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'V.R.A.P. 4', 'Notice of appeal is commonly 30 days from entry of the judgment or order.'),
    coj('VT', { days: null, available: false, citation: 'Vt. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  VA: pack(
    'VA',
    vacate(21, 'Va. Code § 8.01-428; Rule 1:1', 'Trial-court control of a final judgment is commonly 21 days after entry. After that, relief narrows sharply.'),
    appeal(30, 'Va. Code § 8.01-675.3; Rule 5A:6', 'Notice of appeal is commonly 30 days from entry of the final order.'),
    coj('VA', {
      availability: 'limited',
      citation: 'Va. Code §§ 8.01-431–8.01-441',
      note: 'Limited. Virginia still has a live confession-of-judgment clerk procedure. Consumer use is restricted. Treat any confessed paper as an emergency for counsel — not a general consumer timer.',
    }),
  ),
  WA: pack(
    'WA',
    vacate(30, 'CR 60', 'CR 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'RAP 5.2', 'Notice of appeal is commonly 30 days from the entry of the decision.'),
    coj('WA', { days: null, available: false, citation: 'Wash. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  WV: pack(
    'WV',
    vacate(30, 'W. Va. R. Civ. P. 60', 'Rule 60 — some grounds have an eight-month or one-year outer limit. Move promptly after notice.'),
    appeal(30, 'W. Va. R. App. P. 5', 'Notice of appeal is commonly 30 days from entry of the judgment or order.'),
    coj('WV', { days: null, available: false, citation: 'W. Va. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
  WI: pack(
    'WI',
    vacate(30, 'Wis. Stat. § 806.07', 'Relief from judgment — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(45, 'Wis. Stat. § 808.04', 'Civil appeal time is commonly 45 days from entry if notice of entry is given (longer if not). Confirm which track applies.'),
    coj('WI', { days: null, available: false, citation: 'Wis. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
    {
      billOfReview: residual(
        365,
        'Wis. Stat. § 806.07',
        'Some § 806.07 grounds have a one-year outer limit after the short first-action window. The timer appears only when a residual-review date is already on the case.',
      ),
    },
  ),
  WY: pack(
    'WY',
    vacate(30, 'W.R.C.P. 60', 'Rule 60 — some grounds have a one-year outer limit. Move promptly after notice.'),
    appeal(30, 'W.R.A.P. 2.01', 'Notice of appeal is commonly 30 days from entry of the appealable order.'),
    coj('WY', { days: null, available: false, citation: 'Wyo. confession-of-judgment practice', note: UNUSED_COJ_NOTE }),
  ),
};

function fallbackClocks(state: string): StateJudgmentClocks {
  return pack(
    state,
    vacate(30, `${state} analog to Fed. R. Civ. P. 60`, 'Confirm the local motion-to-vacate / set-aside rule and outer limits.'),
    appeal(30, `${state} appellate rules`, 'Confirm the notice-of-appeal window and what starts the clock.'),
    coj(state, { days: null, available: false, citation: `${state} confession-of-judgment practice`, note: UNUSED_COJ_NOTE }),
  );
}

export function getStateJudgmentClocks(state: string | undefined | null): StateJudgmentClocks | null {
  const normalized = String(state ?? '').trim().toUpperCase();
  if (!normalized) return null;
  return CLOCKS[normalized] ?? fallbackClocks(normalized);
}

export function describeCojAvailability(clock: PostJudgmentProcedureClock): string {
  if (clock.kind !== 'coj') return describeJudgmentClock(clock);
  if (clock.cojAvailability === 'limited') return 'Limited / restricted — not a general consumer path';
  if (clock.cojAvailability === 'rare') return 'Rare in practice — confirm with counsel';
  if (clock.cojAvailability === 'unused' || !clock.available) return 'Generally unused or barred — confirm with counsel';
  return describeJudgmentClock(clock);
}

export function describeJudgmentClock(clock: PostJudgmentProcedureClock): string {
  if (clock.kind === 'coj' && clock.cojAvailability && clock.cojAvailability !== 'available') {
    return describeCojAvailability(clock);
  }
  if (!clock.available) return 'Generally unused or restricted — confirm with counsel';
  if (clock.days == null || clock.days <= 0) return 'Confirm the window with counsel';
  const unit = clock.deadlineKind === 'business' ? 'business' : 'calendar';
  return `${clock.days} ${unit} day${clock.days === 1 ? '' : 's'} (planning estimate)`;
}

export function describeCollateralReview(clock: CollateralReviewClock): string {
  const unit = clock.deadlineKind === 'business' ? 'business' : 'calendar';
  const label = clock.kind === 'restricted_appeal' ? 'Restricted appeal' : 'Residual review';
  return `${label}: ${clock.days} ${unit} day${clock.days === 1 ? '' : 's'} (planning estimate)`;
}

export function listActionableJudgmentClocks(clocks: StateJudgmentClocks): PostJudgmentProcedureClock[] {
  return [clocks.vacate, clocks.appeal, clocks.coj].filter((c) => c.available && c.days != null && c.days > 0);
}
