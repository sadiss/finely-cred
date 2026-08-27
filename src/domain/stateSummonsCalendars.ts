/**
 * Per-state civil summons / complaint answer windows.
 * Educational process guidance — confirm the paper you received and local rules. Not legal advice.
 */

import type { ClaimDeadlineKind } from './stateExemptions';

export type SummonsCountRule = 'fixed' | 'texas_monday_after_20';

export type SmallClaimsAnswerTrack = {
  /** Appearance-on-the-notice-date tracks do not get an invented day count. */
  kind: 'appearance_date' | 'fixed';
  days?: number;
  deadlineKind?: ClaimDeadlineKind;
  citation: string;
  note: string;
};

export type AlternateGeneralAnswerTrack = {
  days: number;
  deadlineKind: ClaimDeadlineKind;
  citation: string;
  note: string;
  /** Which case fact unlocks this longer general-jurisdiction window. */
  trigger: 'non_personal_or_out_of_state' | 'summons_only';
};

export type StateSummonsCalendar = {
  state: string;
  /** Planning days for the ordinary general-jurisdiction civil answer. */
  days: number;
  deadlineKind: ClaimDeadlineKind;
  countRule: SummonsCountRule;
  citation: string;
  note: string;
  /** Only filled where the small-claims split is well-known and citable. */
  smallClaims?: SmallClaimsAnswerTrack;
  /** Second general-jurisdiction track (e.g. NY 30-day non-personal service). */
  alternateGeneral?: AlternateGeneralAnswerTrack;
};

const VERIFY =
  'Confirm the summons you received, the court (small-claims vs. general civil), and how service was made. Not legal advice.';

function cal(
  state: string,
  days: number,
  citation: string,
  note: string,
  extra?: { smallClaims?: SmallClaimsAnswerTrack; alternateGeneral?: AlternateGeneralAnswerTrack },
): StateSummonsCalendar {
  return {
    state,
    days,
    deadlineKind: 'calendar',
    countRule: 'fixed',
    citation,
    note: `${note} ${VERIFY}`,
    ...(extra?.smallClaims ? { smallClaims: extra.smallClaims } : {}),
    ...(extra?.alternateGeneral ? { alternateGeneral: extra.alternateGeneral } : {}),
  };
}

function appear(citation: string, note: string): SmallClaimsAnswerTrack {
  return { kind: 'appearance_date', citation, note };
}

function scFixed(days: number, citation: string, note: string): SmallClaimsAnswerTrack {
  return { kind: 'fixed', days, deadlineKind: 'calendar', citation, note };
}

const CALENDARS: Record<string, StateSummonsCalendar> = {
  AL: cal('AL', 30, 'Ala. R. Civ. P. 12', 'Responsive pleading is commonly 30 days after service.'),
  AK: cal('AK', 20, 'Alaska R. Civ. P. 12', 'Responsive pleading is commonly 20 days after service.'),
  AZ: cal('AZ', 20, 'Ariz. R. Civ. P. 12', 'Responsive pleading is commonly 20 days after service.'),
  AR: cal('AR', 30, 'Ark. R. Civ. P. 12', 'Responsive pleading is commonly 30 days after service.'),
  CA: cal(
    'CA',
    30,
    'Cal. Civ. Proc. Code §§ 412.20, 430.40',
    'Response is commonly 30 days after service of the summons and complaint in limited / unlimited civil.',
    { smallClaims: appear('Cal. Civ. Proc. Code §§ 116.330, 116.340', 'Small claims has no formal answer — appear on the hearing date printed on the claim.') },
  ),
  CO: cal(
    'CO',
    21,
    'C.R.C.P. 12',
    'District-court responsive pleading is commonly 21 days after service.',
    { smallClaims: scFixed(14, 'C.R.C.P. 312(a)', 'County-court answer is commonly 14 days after service. Small-claims appearance rules can be even more informal — confirm the paper.') },
  ),
  CT: cal('CT', 30, 'Conn. Practice Book § 10-8', 'Appearance / response is commonly 30 days after the return date — confirm the return date on the summons.'),
  DC: cal('DC', 21, 'D.C. Super. Ct. Civ. R. 12', 'Responsive pleading is commonly 21 days after service.'),
  DE: cal('DE', 20, 'Del. Super. Ct. Civ. R. 12', 'Responsive pleading is commonly 20 days after service.'),
  FL: cal(
    'FL',
    20,
    'Fla. R. Civ. P. 1.140',
    'County / circuit responsive pleading is commonly 20 days after service of process.',
    { smallClaims: appear('Fla. Sm. Cl. R. 7.090', 'Small claims uses a pretrial conference — appear on the date in the notice rather than filing a 20-day answer.') },
  ),
  GA: cal('GA', 30, 'O.C.G.A. § 9-11-12', 'Answer is commonly 30 days after service.'),
  HI: cal('HI', 20, 'Haw. R. Civ. P. 12', 'Responsive pleading is commonly 20 days after service.'),
  ID: cal('ID', 21, 'Idaho R. Civ. P. 12', 'Responsive pleading is commonly 21 days after service.'),
  IL: cal(
    'IL',
    30,
    '735 ILCS 5/2-301; Ill. S. Ct. R. 181',
    'Appearance / answer is commonly 30 days after service in the circuit court.',
    { smallClaims: appear('Ill. S. Ct. R. 286', 'Small claims: a written answer is often not required — appear / answer on the return date on the summons.') },
  ),
  IN: cal('IN', 20, 'Ind. Trial Rule 6(C) / 12', 'Responsive pleading is commonly 20 days after service (longer if service was by publication — confirm).'),
  IA: cal('IA', 20, 'Iowa R. Civ. P. 1.303', 'Motion or answer is commonly 20 days after service.'),
  KS: cal('KS', 21, 'K.S.A. 60-212', 'Responsive pleading is commonly 21 days after service.'),
  KY: cal('KY', 20, 'Ky. CR 12.01', 'Responsive pleading is commonly 20 days after service.'),
  LA: cal('LA', 15, 'La. Code Civ. Proc. art. 1001', 'Answer is commonly 15 days after service of the petition. Confirm parish and city-court exceptions.'),
  ME: cal('ME', 20, 'Me. R. Civ. P. 12', 'Responsive pleading is commonly 20 days after service.'),
  MD: cal(
    'MD',
    30,
    'Md. Rule 2-321',
    'Answer is commonly 30 days after service in the circuit court.',
    { smallClaims: scFixed(15, 'Md. Rule 3-307', 'District Court notice of intention to defend is commonly 15 days after service (covers most small-claims-style civil cases).') },
  ),
  MA: cal(
    'MA',
    20,
    'Mass. R. Civ. P. 12',
    'Responsive pleading is commonly 20 days after service in the district / superior court.',
    { smallClaims: appear('Unif. Small Claims R. 3', 'Small claims: a written answer is generally not required — appear on the trial date on the notice.') },
  ),
  MI: cal(
    'MI',
    21,
    'MCR 2.108',
    'Answer is commonly 21 days after service (28 if served by mail — confirm).',
    { smallClaims: appear('MCL 600.8401 et seq.; MCR 4.301', 'Small claims: appear at the hearing on the notice. There is typically no formal 21-day answer.') },
  ),
  MN: cal('MN', 21, 'Minn. R. Civ. P. 12.01', 'Responsive pleading is commonly 21 days after service.'),
  MS: cal('MS', 30, 'Miss. R. Civ. P. 12', 'Responsive pleading is commonly 30 days after service.'),
  MO: cal('MO', 30, 'Mo. R. Civ. P. 55.25', 'Answer is commonly 30 days after service.'),
  MT: cal('MT', 21, 'Mont. R. Civ. P. 12', 'Responsive pleading is commonly 21 days after service.'),
  NE: cal('NE', 30, 'Neb. Ct. R. Pldg. § 6-1112', 'Responsive pleading is commonly 30 days after service.'),
  NV: cal('NV', 21, 'Nev. R. Civ. P. 12', 'Responsive pleading is commonly 21 days after service.'),
  NH: cal('NH', 30, 'N.H. Super. Ct. Civ. R. 9', 'Appearance / answer is commonly 30 days after the return day — confirm the summons.'),
  NJ: cal(
    'NJ',
    35,
    'N.J. Court R. 4:6-1',
    'Answer is commonly 35 days after service of the summons and complaint in the Superior Court.',
    { smallClaims: appear('N.J. Court R. 6:2-1, 6:11', 'Special Civil / small claims often require appearance on the return date printed on the summons rather than a 35-day formal answer.') },
  ),
  NM: cal('NM', 30, 'NMRA 1-012', 'Responsive pleading is commonly 30 days after service.'),
  NY: cal(
    'NY',
    20,
    'N.Y. CPLR 320, 3012',
    '20 days after personal service inside New York. This planner uses the shorter personal-service track unless you mark another method.',
    {
      alternateGeneral: {
        days: 30,
        deadlineKind: 'calendar',
        citation: 'N.Y. CPLR 320, 3012',
        note: '30 days if served other than personally inside New York, or if served outside the state.',
        trigger: 'non_personal_or_out_of_state',
      },
      smallClaims: appear(
        'N.Y. City Civ. Ct. Act § 1803; Uniform City Ct. Act § 1803',
        'Small claims: appear on the date in the notice — there is no 20-day formal answer.',
      ),
    },
  ),
  NC: cal('NC', 30, 'N.C. R. Civ. P. 12', 'Answer is commonly 30 days after service.'),
  ND: cal('ND', 21, 'N.D.R.Civ.P. 12', 'Responsive pleading is commonly 21 days after service.'),
  OH: cal(
    'OH',
    28,
    'Ohio Civ.R. 12',
    'Municipal / common-pleas responsive pleading is commonly 28 days after service of the summons and complaint.',
    { smallClaims: appear('Ohio Rev. Code § 1925.05', 'Small claims: appear at the hearing stated on the notice. A formal 28-day answer is typically not used.') },
  ),
  OK: cal('OK', 20, '12 O.S. § 2012', 'Responsive pleading is commonly 20 days after service.'),
  OR: cal('OR', 30, 'ORCP 7 / 21', 'Appearance is commonly 30 days after service. Confirm the summons text.'),
  PA: cal(
    'PA',
    20,
    'Pa.R.C.P. 1026',
    'Court of Common Pleas responsive pleading is commonly 20 days after service of the complaint.',
    { smallClaims: appear('Pa.R.C.P.M.D.J. 305, 314', 'Magisterial District Court: appear on the hearing date on the complaint — there is no 20-day formal answer.') },
  ),
  RI: cal('RI', 20, 'R.I. Super. R. Civ. P. 12', 'Responsive pleading is commonly 20 days after service.'),
  SC: cal('SC', 30, 'S.C.R.C.P. 12', 'Responsive pleading is commonly 30 days after service.'),
  SD: cal('SD', 30, 'S.D.C.L. 15-6-12(a)', 'Responsive pleading is commonly 30 days after service.'),
  TN: cal('TN', 30, 'Tenn. R. Civ. P. 12', 'Responsive pleading is commonly 30 days after service.'),
  TX: {
    state: 'TX',
    days: 20,
    deadlineKind: 'calendar',
    countRule: 'texas_monday_after_20',
    citation: 'Tex. R. Civ. P. 99(b), 15',
    note: `District / county-court answer is due by 10:00 a.m. on the Monday next after 20 days from service — not a flat 20th calendar day. ${VERIFY}`,
    smallClaims: scFixed(14, 'Tex. R. Civ. P. 502.5', 'Justice-court answer is commonly due by the end of the 14th day after service (next open day if that date is a weekend or legal holiday).'),
  },
  UT: cal('UT', 21, 'Utah R. Civ. P. 12', 'Responsive pleading is commonly 21 days after service.'),
  VT: cal('VT', 21, 'Vt. R. Civ. P. 12', 'Responsive pleading is commonly 21 days after service.'),
  VA: cal(
    'VA',
    21,
    'Va. Sup. Ct. R. 3:8',
    'Circuit-court responsive pleading is commonly 21 days after service.',
    { smallClaims: appear('Va. Code §§ 16.1-79, 16.1-88', 'General District Court: appear on the return date on the warrant / summons rather than filing a 21-day circuit answer.') },
  ),
  WA: cal('WA', 20, 'Wash. CR 12', 'Responsive pleading is commonly 20 days after service.'),
  WV: cal('WV', 20, 'W. Va. R. Civ. P. 12', 'Responsive pleading is commonly 20 days after service.'),
  WI: cal(
    'WI',
    20,
    'Wis. Stat. §§ 801.09, 802.06',
    'Answer is commonly 20 days after service of the complaint. This planner uses the shorter track unless only a summons was served first.',
    {
      alternateGeneral: {
        days: 45,
        deadlineKind: 'calendar',
        citation: 'Wis. Stat. §§ 801.09, 802.06',
        note: '45 days if only the summons was served first (complaint to follow).',
        trigger: 'summons_only',
      },
      smallClaims: appear('Wis. Stat. ch. 799', 'Small claims: appear on the return date in the summons. Chapter 799 does not use the 20/45-day circuit answer tracks.'),
    },
  ),
  WY: cal('WY', 20, 'Wyo. R. Civ. P. 12', 'Responsive pleading is commonly 20 days after service.'),
};

/** Historical product default when the case has no usable state. */
export const SUMMONS_ANSWER_FALLBACK_DAYS = 35;

function fallbackCalendar(state: string): StateSummonsCalendar {
  return cal(
    state,
    SUMMONS_ANSWER_FALLBACK_DAYS,
    `${state} civil appearance / answer rule`,
    'State code was not in the published table — using the 35-day planning default. Confirm the local answer window.',
  );
}

export function getStateSummonsCalendar(state: string | undefined | null): StateSummonsCalendar | null {
  const normalized = String(state ?? '').trim().toUpperCase();
  if (!normalized) return null;
  return CALENDARS[normalized] ?? fallbackCalendar(normalized);
}

export function describeSummonsWindow(calendar: StateSummonsCalendar): string {
  if (calendar.countRule === 'texas_monday_after_20') {
    return 'Monday after 20 calendar days (Tex. R. Civ. P. 99) — planning estimate';
  }
  const unit = calendar.deadlineKind === 'business' ? 'business' : 'calendar';
  return `${calendar.days} ${unit} day${calendar.days === 1 ? '' : 's'} (planning estimate)`;
}

export function describeSmallClaimsWindow(calendar: StateSummonsCalendar): string | null {
  const track = calendar.smallClaims;
  if (!track) return null;
  if (track.kind === 'appearance_date') {
    return `Small claims: appear on the date printed on the notice (${track.citation})`;
  }
  if (track.days == null) return `Small claims: confirm the window (${track.citation})`;
  const unit = (track.deadlineKind ?? 'calendar') === 'business' ? 'business' : 'calendar';
  return `Small claims: ${track.days} ${unit} day${track.days === 1 ? '' : 's'} (${track.citation})`;
}

export function countSummonsCalendars(): { total: number; specified: number } {
  return { total: Object.keys(CALENDARS).length, specified: Object.keys(CALENDARS).length };
}
