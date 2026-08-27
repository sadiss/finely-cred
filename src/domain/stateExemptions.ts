/**
 * State bank-levy / exemption procedure profiles for post-judgment debt cases.
 * Educational reference — confirm all deadlines and forms with licensed counsel.
 */

export type ClaimDeadlineKind = 'calendar' | 'business';

export type StateExemptionProfile = {
  state: string;
  levyProcedure: string;
  noticeAutomatic: boolean;
  claimDeadlineDays: number | null;
  /** How the claim window is counted — many wage/garnishment notices use business days. */
  deadlineKind: ClaimDeadlineKind;
  wageCapNote: string;
  personalPropertyNote: string;
  formName: string;
  citation: string;
  lastVerified: string;
};

export const PLACEHOLDER_LAST_VERIFIED = 'Confirm with counsel — entry not fully verified';

const CCPA_WAGE =
  'Federal Consumer Credit Protection Act (15 U.S.C. § 1673) generally caps ordinary garnishment at the lesser of 25% of disposable earnings or the amount above 30× the federal minimum wage; state law may be more protective.';

function placeholderProfile(state: string): StateExemptionProfile {
  return {
    state,
    levyProcedure:
      'Verify local writ-of-execution, bank levy, and turnover procedure with counsel — state execution and exemption rules apply.',
    noticeAutomatic: false,
    claimDeadlineDays: null,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Confirm state wage exemption amounts with counsel.`,
    personalPropertyNote:
      'State personal-property and homestead exemption schedules may apply — confirm amounts and categories with counsel.',
    formName:
      'Confirm court-issued levy / restraining notice and any state exemption claim form with counsel before filing.',
    citation: `${state} execution and exemption statutes — confirm with counsel.`,
    lastVerified: PLACEHOLDER_LAST_VERIFIED,
  };
}

function verified(profile: Omit<StateExemptionProfile, 'lastVerified'> & { lastVerified?: string }): StateExemptionProfile {
  return {
    ...profile,
    lastVerified:
      profile.lastVerified ??
      `2026-08 — statute cites drafted from published codes; confirm current forms, dollar amounts, and post-notice window with counsel.`,
  };
}

const NJ_PROFILE: StateExemptionProfile = {
  state: 'NJ',
  levyProcedure:
    'After judgment, creditor obtains writ of execution. Sheriff or authorized officer serves the financial institution with the writ and turnover demand. The institution must identify leviable funds, restrain them, and provide notice to the account holder. Partner may object and claim exemptions under the turnover procedure codified at N.J.S.A. 2A:17-19.',
  noticeAutomatic: true,
  claimDeadlineDays: 10,
  deadlineKind: 'calendar',
  wageCapNote:
    'New Jersey wage garnishment is limited by state law and the federal CCPA. Portions of wages and certain public benefits may be exempt under N.J.S.A. 2A:17-23 and related provisions — confirm current amounts with counsel.',
  personalPropertyNote:
    'N.J.S.A. 2A:17-19 lists about $1,000 personal property plus wearing apparel. New Jersey has no large judgment homestead (a tax homestead rebate is not a levy exemption). Clothing, household necessities, and benefit protections may still apply. Verify before relying.',
  formName:
    'Court-filed objection / claim of exemption under N.J.S.A. 2A:17-19 turnover practice (no single statewide bank exemption form).',
  citation: 'N.J.S.A. 2A:17-19 (levy / turnover on financial institution); N.J.S.A. 2A:17-17–2A:17-63 (exemptions)',
  lastVerified: '2026-08 — NJ writ + turnover practice under N.J.S.A. 2A:17-19; confirm current court forms and post-notice window with counsel.',
};

const NY_PROFILE: StateExemptionProfile = {
  state: 'NY',
  levyProcedure:
    'Judgment creditor serves execution / restraining notice on the bank under CPLR Article 52. Institution restrains the account and must send the partner an exemption notice. The Exempt Income Protection Act (EIPA) protects a minimum balance in the account under CPLR 5222-a; protected benefit deposits are addressed in CPLR 5205(l).',
  noticeAutomatic: true,
  claimDeadlineDays: 15,
  deadlineKind: 'calendar',
  wageCapNote:
    'Wage garnishment limits under CPLR 5231 and federal CCPA. Social Security, public assistance, and other benefit categories may be fully or partially exempt under CPLR 5205.',
  personalPropertyNote:
    'CPLR 5206 homestead planning bands are $89,975 / $149,975 / $179,950 by county. CPLR 5205 lists personal-property categories; EIPA (CPLR 5222-a) protects a minimum bank-account floor that adjusts. CPLR 5205(l) addresses protected payments. Verify current figures before relying.',
  formName:
    'Exemption claim form served with restraining notice (CPLR 5232 procedure); EIPA worksheets referenced in CPLR 5222-a as applicable.',
  citation:
    'N.Y. CPLR 5222-a (EIPA exempt income protection); CPLR 5205(l) (protected payments); CPLR 5232 (exemption claim procedure)',
  lastVerified:
    '2026-08 — NY EIPA / CPLR 5222-a and 5205(l) bank-levy procedure; confirm current EIPA dollar floor with counsel.',
};

const FULL_PROFILES: Record<string, StateExemptionProfile> = {
  NJ: NJ_PROFILE,
  NY: NY_PROFILE,
  CA: verified({
    state: 'CA',
    levyProcedure:
      'After money judgment, creditor obtains a writ of execution. A levying officer serves the financial institution; the institution freezes the deposit account and the partner receives a notice of levy. Claim of exemption is filed with the levying officer under Code of Civil Procedure § 703.520. Wage garnishment uses a separate earnings-withholding procedure (CCP § 706.010 et seq.).',
    noticeAutomatic: true,
    claimDeadlineDays: 15,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} California earnings withholding uses CCP §§ 706.050–706.052 (state formula can be more protective than the federal floor).`,
    personalPropertyNote:
      'CCP § 704.010 et seq. (motor vehicle, household, tools) and homestead under CCP § 704.730. 2024 Judicial Council homestead band is $361,074–$722,148 by county. A later 2025+ table exists — verify the current Judicial Council figures before relying.',
    formName: 'EJ-160 Claim of Exemption (Enforcement of Judgment); WG-006 Claim of Exemption for earnings withholding.',
    citation: 'Cal. Civ. Proc. Code §§ 703.520, 704.010–704.210, 704.730, 706.050–706.052',
  }),
  TX: verified({
    state: 'TX',
    levyProcedure:
      'Texas generally forbids garnishment of current wages for consumer debts (Tex. Const. art. XVI § 28). Bank accounts and other non-wage property can be reached by writ of garnishment after judgment. The garnishee answers the writ; the partner may move to dissolve or claim exemptions under the Property Code. Act immediately — do not wait for a long automatic stay of turnover.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote:
      'Current wages for personal services are generally exempt from garnishment for ordinary consumer judgments (Tex. Const. art. XVI § 28; Tex. Prop. Code § 42.001(b)(1)). Child-support, taxes, and certain other debts are excepted. Deposited wage proceeds may lose protection unless they remain traceable — confirm with counsel.',
    personalPropertyNote:
      'Tex. Prop. Code § 42.001 aggregate personal-property cap is $50,000 (single adult) / $100,000 (family). Homestead under Chapter 41 is acreage-based with no dollar cap (typically 10 urban / 100 rural acres). Verify before relying.',
    formName:
      'Motion to dissolve writ of garnishment / claim of exemption (no single statewide bank-levy form). File in the court that issued the writ.',
    citation: 'Tex. Const. art. XVI § 28; Tex. Prop. Code §§ 41.001, 42.001–42.005; Tex. R. Civ. P. 657–679',
  }),
  FL: verified({
    state: 'FL',
    levyProcedure:
      'Judgment creditor files a motion for writ of garnishment (Fla. Stat. ch. 77). The bank is served as garnishee and restrains funds. The partner must be served with a Claim of Exemption and Request for Hearing notice. File the signed claim before the statutory cutoff or the bank may be ordered to turn funds over.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote:
      'Fla. Stat. § 222.11 protects disposable earnings of a head of family in many consumer cases; federal CCPA still matters when state protection does not apply. Confirm head-of-family status and exceptions with counsel.',
    personalPropertyNote:
      'Fla. Stat. § 222.25: $1,000 personal property, or $4,000 if homestead is not claimed. Art. X homestead is unlimited in dollar amount (acreage / municipal-lot limits). Benefit deposits may be exempt under § 222.201 and federal 31 C.F.R. Part 212. Verify before relying.',
    formName: 'Florida Claim of Exemption and Request for Hearing (Fla. Stat. § 77.041 form language).',
    citation: 'Fla. Stat. §§ 77.01–77.28, 77.041, 222.11, 222.25, 222.201',
  }),
  PA: verified({
    state: 'PA',
    levyProcedure:
      'Pennsylvania execution uses Pa.R.C.P. 3101 et seq. A writ of execution may attach a bank account; the sheriff or bank receives the writ and the partner is notified. Claim exemption property under 42 Pa.C.S. § 8123 and related sections. Wage attachment for ordinary consumer judgments is tightly limited.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote:
      'Pennsylvania generally restricts attachment of wages for ordinary consumer judgments (42 Pa.C.S. § 8127). Support, taxes, and student-loan-style exceptions exist. Confirm whether any wage attachment in your case is even authorized.',
    personalPropertyNote:
      '42 Pa.C.S. §§ 8123–8124: no traditional judgment homestead; planning figures include $300 cash, clothing, and $300 tools, plus retirement / insurance protections. Verify the current schedule before relying.',
    formName: 'Claim of exemption / property claim under Pa.R.C.P. 3123 and 42 Pa.C.S. § 8123 (local sheriff forms vary).',
    citation: '42 Pa.C.S. §§ 8123–8127; Pa.R.C.P. 3101–3149',
  }),
  IL: verified({
    state: 'IL',
    levyProcedure:
      'Illinois uses citation to discover assets, non-wage garnishment (735 ILCS 5/12-701 et seq.), and wage deduction (735 ILCS 5/12-801 et seq.). A bank served with garnishment or a citation freezes funds. For wage deduction, the partner may request a hearing within a short business-day window after notice. Bank garnishment appearance windows can be longer — confirm the paper you received.',
    noticeAutomatic: true,
    claimDeadlineDays: 5,
    deadlineKind: 'business',
    wageCapNote: `${CCPA_WAGE} Illinois wage-deduction formula is in 735 ILCS 5/12-803. Head-of-family and necessity arguments may apply.`,
    personalPropertyNote:
      '735 ILCS 5/12-901 homestead is $15,000 ($30,000 joint). 735 ILCS 5/12-1001(b) wildcard is $4,000 plus listed clothing, vehicle equity, and tools. Verify before relying.',
    formName:
      'Wage-deduction “request for hearing” on the notice form; citation / garnishment exemption claim filed with the clerk (local packets vary by county).',
    citation: '735 ILCS 5/12-701–12-719, 5/12-801–12-819, 5/12-901, 5/12-1001',
  }),
  OH: verified({
    state: 'OH',
    levyProcedure:
      'Ohio garnishment of personal earnings and of other property (including deposit accounts) is governed by R.C. Chapter 2716. After the bank or employer is served, the partner receives a notice and may request a hearing on exemptions. Hearing-request windows for many Ohio garnishment notices are counted in business days.',
    noticeAutomatic: true,
    claimDeadlineDays: 5,
    deadlineKind: 'business',
    wageCapNote: `${CCPA_WAGE} Ohio personal-earnings exemptions and extra protections are in R.C. 2329.66 and 2716.03–2716.06.`,
    personalPropertyNote:
      'R.C. 2329.66 homestead planning figure is about $182,625 (2025 CPI adjustment) plus listed cash, tools, and household categories. Verify the current official amount before relying.',
    formName: 'Request for Hearing on the Ohio garnishment notice (R.C. 2716.06 earnings; R.C. 2716.13 other property).',
    citation: 'Ohio Rev. Code §§ 2329.66, 2716.01–2716.21',
  }),
  GA: verified({
    state: 'GA',
    levyProcedure:
      'Georgia post-judgment garnishment is O.C.G.A. Title 18, Chapter 4. The bank is served with a summons of garnishment and holds funds. The partner (defendant) may file a claim or traverse. Statutory claim windows are short — treat the summons date as the clock start and confirm the exact count with the clerk.',
    noticeAutomatic: true,
    claimDeadlineDays: 15,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Georgia also applies O.C.G.A. § 18-4-5 and related earnings exemptions. Confirm current state formula.`,
    personalPropertyNote:
      'O.C.G.A. § 44-13-100 homestead planning figures are $21,500, or $43,000 if married and both entitled, plus listed vehicle / household / tools. Confirm whether you elect state vs. federal-style protections with counsel. Verify before relying.',
    formName: 'Defendant’s claim / traverse of garnishment (O.C.G.A. § 18-4-15 practice; local magistrate / state court packets).',
    citation: 'O.C.G.A. §§ 18-4-1–18-4-90, 18-4-15, 44-13-1 et seq.',
  }),
  NC: verified({
    state: 'NC',
    levyProcedure:
      'North Carolina execution and designation of exemptions are in Chapter 1C of the General Statutes. After notice of right to have exemptions designated, the partner must file a motion to designate exempt property. Missing that window can waive the listing — file even a conservative designation and amend with counsel if needed.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} N.C.G.S. § 1-362 and related execution limits; earnings exemptions appear in the Chapter 1C schedule.`,
    personalPropertyNote:
      'N.C.G.S. § 1C-1601 homestead planning figures are $35,000, or $60,000 if 65+ and the spouse is deceased, plus listed vehicle, household, tools, and a wildcard. Verify AOC-CV-406 current amounts before relying.',
    formName: 'AOC-CV-406 Motion to Claim Exempt Property (and related AOC execution notices).',
    citation: 'N.C.G.S. §§ 1-362, 1C-1601–1C-1604',
  }),
  MI: verified({
    state: 'MI',
    levyProcedure:
      'Michigan post-judgment garnishment is MCR 3.101 and MCL 600.4011 et seq. Periodic and non-periodic garnishments can reach wages or bank accounts. Objections and exemption claims are filed with the court that issued the writ within the objection period stated on the writ (commonly 14 days — confirm the paper).',
    noticeAutomatic: true,
    claimDeadlineDays: 14,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Michigan periodic-garnishment calculations follow MCR 3.101 and MCL 600.4012. Head-of-household arguments may apply.`,
    personalPropertyNote:
      'MCL 600.6023 homestead planning figures are about $40,475, or about $60,725 if 65+ or disabled, plus listed household, vehicle, tools, and some unlimited benefit categories. Verify before relying.',
    formName: 'MC 48 / local objection to garnishment and claim of exemption (form numbers vary by court).',
    citation: 'MCL 600.4011–600.4065, 600.6023; MCR 3.101',
  }),
  VA: verified({
    state: 'VA',
    levyProcedure:
      'Virginia garnishment uses Va. Code § 8.01-511 et seq. The partner receives a garnishment summons and an exemption-claim form. Return the claim so it is received before the return date / stated cutoff. Homestead deeds (Va. Code § 34-14) are a separate filing that can protect additional value if timely.',
    noticeAutomatic: true,
    claimDeadlineDays: 7,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Virginia disposable-earnings protections are in Va. Code §§ 34-29 and 8.01-512.4. Confirm the form’s listed percentages.`,
    personalPropertyNote:
      'Va. Code Title 34 exemptions (homestead deed, poor debtor’s exemption, tools, clothing). A homestead deed must often be filed before the funds are paid — timing is critical.',
    formName: 'Form DC-407 / CC-1482-style Exemption Claim (number varies circuit vs. general district) plus homestead deed if used.',
    citation: 'Va. Code §§ 8.01-511–8.01-525, 8.01-512.4, 34-4, 34-14, 34-26, 34-29',
  }),
  WA: verified({
    state: 'WA',
    levyProcedure:
      'Washington writs of garnishment (RCW 6.27) reach banks and employers. The partner may object and claim exemptions. Many objections are due within a stated number of days after service of the writ — confirm RCW 6.27.160 timing on your papers.',
    noticeAutomatic: true,
    claimDeadlineDays: 28,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} RCW 6.27.150 and 6.15.010 include Washington-specific earnings and necessity protections that can exceed the federal floor.`,
    personalPropertyNote:
      'RCW 6.15.010 personal-property and homestead (RCW 6.13) protections. Dollar amounts are periodically adjusted by the state treasurer.',
    formName: 'Objection to garnishment / exemption claim (RCW 6.27.160; local superior-court packets).',
    citation: 'RCW 6.13, 6.15.010, 6.27.010–6.27.350, 6.27.160',
  }),
  AZ: verified({
    state: 'AZ',
    levyProcedure:
      'Arizona post-judgment garnishment of monies and earnings is A.R.S. §§ 12-1570–12-1598. The bank or employer is served; the partner receives a notice of garnishment and may request a hearing. Hearing-request clocks are short (often 10 days from receipt — confirm the notice).',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Arizona earnings exemptions are in A.R.S. § 33-1131. Confirm disposable-earnings math on the notice.`,
    personalPropertyNote:
      'A.R.S. Title 33, Chapter 8 exemptions (homestead § 33-1101, household, tools, vehicle). Confirm current homestead and personal-property caps.',
    formName: 'Request for Hearing on Notice of Garnishment (A.R.S. § 12-1598.16 earnings; § 12-1572 et seq. monies).',
    citation: 'A.R.S. §§ 12-1570–12-1598.17, 33-1101, 33-1121–33-1133',
  }),
  MA: verified({
    state: 'MA',
    levyProcedure:
      'Massachusetts uses trustee process (G.L. c. 246) to reach banks and supplementary process for examination. A bank served as trustee holds funds pending further order. Appear and assert exemptions under G.L. c. 235, § 34 and related statutes. Deadlines often track the summons return — confirm with the court.',
    noticeAutomatic: true,
    claimDeadlineDays: 30,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Massachusetts has additional wage-exemption practice under G.L. c. 246 and c. 235, § 34. Confirm whether trustee process reached earnings vs. a deposit account.`,
    personalPropertyNote:
      'G.L. c. 235, § 34 (clothing, furniture, tools, limited cash, automobile equity) and homestead under G.L. c. 188. Confirm current amounts and whether a homestead declaration is on record.',
    formName: 'Answer / assertion of exemptions in trustee process; local BMC / Superior Court packets.',
    citation: 'Mass. Gen. Laws c. 235, § 34; c. 246; c. 188',
  }),
  MD: verified({
    state: 'MD',
    levyProcedure:
      'Maryland writy of garnishment of property other than wages (Md. Rule 3-645 / 2-645) reaches bank accounts. Wage garnishment is a separate writ (Rules 3-646 / 2-646). File a motion asserting exemptions under Cts. & Jud. Proc. § 11-504 before the writ is condemned or wages are withheld beyond exempt amounts.',
    noticeAutomatic: true,
    claimDeadlineDays: 30,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Maryland wage-garnishment limits and extra protections are in CJ § 15-601.1 and related Labor & Employment provisions.`,
    personalPropertyNote:
      'Md. Code, Cts. & Jud. Proc. § 11-504 (cash, household, tools, wildcard). Homestead-style protections are limited; retirement and benefit categories are often listed separately.',
    formName: 'Motion asserting exemption / request for release of garnished property (Md. Rules 2-645, 3-645).',
    citation: 'Md. Code, Cts. & Jud. Proc. §§ 11-504, 15-601.1; Md. Rules 2-645, 2-646, 3-645, 3-646',
  }),
  CO: verified({
    state: 'CO',
    levyProcedure:
      'Colorado writs of garnishment (C.R.S. Title 13, Article 54.5) reach earnings and deposit accounts. The partner may request a hearing to claim exemptions under C.R.S. § 13-54-102. Many notices give a 14-day hearing-request window — confirm the writ.',
    noticeAutomatic: true,
    claimDeadlineDays: 14,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Colorado earnings exemptions and a higher state percentage may apply under C.R.S. §§ 13-54-104 and 13-54.5-101 et seq.`,
    personalPropertyNote:
      'C.R.S. § 38-41-201 homestead planning figures are $250,000, or $350,000 if elderly or disabled. C.R.S. § 13-54-102 lists household, vehicles, tools, cash, and insurance. Verify before relying.',
    formName: 'JDF 89 / Claim of Exemption to Writ of Garnishment (form number confirm with current Colorado Judicial Branch packet).',
    citation: 'C.R.S. §§ 13-54-102, 13-54-104, 13-54.5-101–13-54.5-110, 38-41-201',
  }),
  TN: verified({
    state: 'TN',
    levyProcedure:
      'Tennessee execution and garnishment are Title 26. A bank or employer served with garnishment holds funds. The partner may file a claim of exemption. Statutory personal-property and wildcard amounts are modest — list every eligible category on the claim.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Tenn. Code § 26-2-106 sets Tennessee’s disposable-earnings formula. Confirm whether your notice is earnings vs. levy of a deposit account.`,
    personalPropertyNote:
      'Tenn. Code § 26-2-301 homestead planning figures are $5,000, or $7,500 joint, plus listed clothing, tools, and insurance. Verify before relying.',
    formName: 'Claim of exemption (Tenn. Code § 26-2-114 practice; local general-sessions packets).',
    citation: 'Tenn. Code Ann. §§ 26-2-102–26-2-114, 26-2-404',
  }),
  IN: verified({
    state: 'IN',
    levyProcedure:
      'Indiana proceedings supplemental and garnishment (Ind. Code 34-25-3 and related Trial Rules) can freeze bank accounts and garnish wages. File an exemption claim listing Ind. Code 34-55-10 property. Confirm the hearing date on the order to appear — missing court can waive arguments.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Indiana earnings exemptions interact with Ind. Code 24-4.5-5-105 and 34-25-3. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'Ind. Code § 34-55-10-2 homestead planning figures are about $19,300, or about $38,600 joint (CPI-adjusted), plus listed personal property and retirement. Verify before relying.',
    formName: 'Verbatim exemption list / motion in proceedings supplemental (local county clerk packets).',
    citation: 'Ind. Code §§ 24-4.5-5-105, 34-25-3, 34-55-10-2',
  }),
  MO: verified({
    state: 'MO',
    levyProcedure:
      'Missouri garnishment and sequestration (Chapter 525) plus exemptions in Chapter 513. A bank served with garnishment impounds funds. File a claim of exemption promptly — many local courts treat the return date as the practical cutoff.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Mo. Rev. Stat. § 525.030 and related earnings provisions. Head-of-family protections may apply.`,
    personalPropertyNote:
      'Mo. Rev. Stat. § 513.475 homestead is $15,000. § 513.430 lists wearing apparel, household, tools, and about $1,500 wildcard-style categories. Verify before relying.',
    formName: 'Claim of exemption / motion to quash garnishment (Chapter 525; local circuit packets).',
    citation: 'Mo. Rev. Stat. §§ 513.430, 513.475, 525.010–525.310',
  }),
  WI: verified({
    state: 'WI',
    levyProcedure:
      'Wisconsin earnings garnishment (Wis. Stat. § 812.30 et seq.) and non-earnings garnishment / execution can reach paychecks and accounts. Exemption objections on earnings garnishments are often due within a few business days of service of the garnishment notice.',
    noticeAutomatic: true,
    claimDeadlineDays: 5,
    deadlineKind: 'business',
    wageCapNote: `${CCPA_WAGE} Wis. Stat. § 812.34 lists Wisconsin earnings-exemption percentages and necessity standards.`,
    personalPropertyNote:
      'Wis. Stat. § 815.20 homestead is $75,000. § 815.18 lists depository accounts, household, tools, vehicle, and retirement — confirm whether a depository-account exemption covers the levied bank. Verify before relying.',
    formName: 'Answer / exemption claim on CV-422-style earnings garnishment forms (confirm current Wisconsin court form id).',
    citation: 'Wis. Stat. §§ 812.30–812.44, 812.34, 815.18',
  }),
  MN: verified({
    state: 'MN',
    levyProcedure:
      'Minnesota garnishment (Minn. Stat. ch. 571) reaches earnings and financial institutions. The partner may claim exemptions; levy on a bank account typically includes an exemption notice. Deadlines are short after service of the notice of intent to garnish or the levy papers.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Minn. Stat. § 571.922 and related earnings exemptions; Minnesota often provides a higher protected earnings amount than the federal floor.`,
    personalPropertyNote:
      'Minn. Stat. § 510.02 homestead planning figures are about $480,000–$510,000 (adjusts). § 550.37 lists household, vehicle, tools, benefits, and a wildcard. Verify before relying.',
    formName: 'Exemption form served with the garnishment / levy (Minn. Stat. §§ 550.143, 571.72–571.932).',
    citation: 'Minn. Stat. §§ 550.37, 550.143, 571.71–571.932, 571.922',
  }),
  SC: verified({
    state: 'SC',
    levyProcedure:
      'South Carolina executions and garnishments follow Title 15. A financial institution served with process holds funds. Claim exemptions under S.C. Code § 15-41-30. Confirm magistrate vs. circuit procedure on your papers.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} South Carolina earnings protections appear in Title 15 and related family-court exceptions. Confirm whether wages vs. a deposit account were reached.`,
    personalPropertyNote:
      'S.C. Code § 15-41-30 homestead planning figure is about $63,250 (CPI-adjusted), plus listed vehicle, household, cash, and tools. Verify before relying.',
    formName: 'Claim of exemption / homestead (S.C. Code Title 15, Chapter 41; local clerk forms).',
    citation: 'S.C. Code §§ 15-39-10 et seq., 15-41-30',
  }),
  AL: verified({
    state: 'AL',
    levyProcedure:
      'Alabama garnishment practice (Ala. Code Title 6, Article 9 and Rule 64) lets a judgment creditor reach wages and bank accounts. File a claim of exemption under Ala. Code § 6-10-1 et seq. Personal-property and homestead amounts are modest — list every category.',
    noticeAutomatic: true,
    claimDeadlineDays: 15,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Alabama also applies Ala. Code § 6-10-7 and related earnings provisions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'Ala. Code § 6-10-2 homestead planning figure is about $18,800 (CPI-adjusted from a $15,000 base). §§ 6-10-6 lists modest personal property. Confirm whether a homestead declaration is required. Verify before relying.',
    formName: 'Claim of exemption (Ala. Code § 6-10-20 et seq.; local circuit / district packets).',
    citation: 'Ala. Code §§ 6-10-1–6-10-126; Ala. R. Civ. P. 64',
  }),
  LA: verified({
    state: 'LA',
    levyProcedure:
      'Louisiana garnishment of bank accounts and wages uses La. Code of Civil Procedure arts. 2411–2417. The garnishee answers; the partner may intervene and assert exemptions under La. R.S. 13:3881. Deadlines track the garnishment citation — confirm parish practice.',
    noticeAutomatic: true,
    claimDeadlineDays: 15,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Louisiana wage-exemption percentages are in La. R.S. 13:3881. Confirm disposable-pay definitions.`,
    personalPropertyNote:
      'La. Const. art. XII / R.S. 20:1 homestead is $35,000. La. R.S. 13:3881 lists tools, household, limited vehicle, and benefits. Verify before relying.',
    formName: 'Intervention / motion asserting exemption in the garnishment proceeding (parish-specific packets).',
    citation: 'La. C.C.P. arts. 2411–2417; La. R.S. 13:3881',
  }),
  KY: verified({
    state: 'KY',
    levyProcedure:
      'Kentucky execution and garnishment (KRS Chapter 425 and 427) can freeze accounts and garnish earnings. File an exemption affidavit. Many notices require a prompt written claim — confirm the days stated on the order.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} KRS 427.010 and related earnings sections. Confirm whether the levy is earnings or a deposit account.`,
    personalPropertyNote:
      'KRS 427.060 homestead is $5,000. KRS 427.010 et seq. add about $1,000 wildcard plus listed household, tools, vehicle, and health aids. Verify before relying.',
    formName: 'Affidavit of exemption (KRS 427; local district / circuit packets).',
    citation: 'KRS 425.501–425.526, 427.010–427.170',
  }),
  OR: verified({
    state: 'OR',
    levyProcedure:
      'Oregon writs of garnishment (ORS 18.600–18.850) reach banks and employers. The partner may challenge the garnishment and claim exemptions under ORS 18.345. Challenge windows are stated on the writ — often about 14 days, but confirm the face of the writ.',
    noticeAutomatic: true,
    claimDeadlineDays: 14,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} ORS 18.385 earnings exemptions. Oregon’s protected-earnings amount can exceed the federal floor.`,
    personalPropertyNote:
      'ORS 18.395 homestead is $150,000. ORS 18.345 lists household, books, tools, vehicle, and cash. Verify before relying.',
    formName: 'Challenge to Garnishment form served with the writ (ORS 18.700–18.736).',
    citation: 'ORS 18.345, 18.385, 18.395, 18.600–18.850',
  }),
  OK: verified({
    state: 'OK',
    levyProcedure:
      'Oklahoma garnishment (12 O.S. § 1171 et seq.) reaches wages and accounts. The partner may file a claim of exemption. Some notices use a very short (including 5-day) objection window — read the writ the day it arrives.',
    noticeAutomatic: true,
    claimDeadlineDays: 5,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} 31 O.S. § 1 and 12 O.S. § 1173 earnings / exemption interaction. Confirm disposable-earnings math.`,
    personalPropertyNote:
      '31 O.S. § 1 (personal property, tools, vehicle, homestead-related). Confirm current amounts and rural vs. urban homestead rules.',
    formName: 'Claim of exemption (12 O.S. § 1172.2 / § 1174 practice; local court clerk packets).',
    citation: '12 O.S. §§ 1171–1190; 31 O.S. § 1',
  }),
  CT: verified({
    state: 'CT',
    levyProcedure:
      'Connecticut post-judgment executions (Gen. Stat. § 52-356a et seq.) and bank executions can restrain deposit accounts. The partner may claim exemptions. Wage executions are a separate track (§ 52-361a). Deadlines appear on the execution packet — commonly about 20 days to claim, confirm the form.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Conn. Gen. Stat. § 52-361a wage-execution limits and additional state protections.`,
    personalPropertyNote:
      'Conn. Gen. Stat. § 52-352b homestead planning figures are $75,000, or $125,000 if 62+ or disabled, plus necessary apparel, furniture, tools, insurance, and public assistance. Verify before relying.',
    formName: 'Exemption claim on the bank / wage execution form (JD-CV-5b and related Judicial Branch forms — confirm current id).',
    citation: 'Conn. Gen. Stat. §§ 52-352b, 52-356a, 52-361a, 52-367b',
  }),
  NV: verified({
    state: 'NV',
    levyProcedure:
      'Nevada writs of execution and garnishment (NRS Chapter 21 and 31) reach banks and employers. File a claim of exemption (NRS 21.112). The claim window is short after notice — confirm the days printed on the writ.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} NRS 21.090 and 31.295 earnings-related exemptions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'NRS 21.090 (homestead-related, vehicle, household, tools, benefits). Homestead NRS Chapter 115. Confirm current amounts.',
    formName: 'Claim of exemption (NRS 21.112; Nevada stipulation / justice-court packets).',
    citation: 'NRS 21.090, 21.112, 31.240–31.460, Ch. 115',
  }),
  DC: verified({
    state: 'DC',
    levyProcedure:
      'District of Columbia attachment and garnishment follow Super. Ct. Civ. R. 69-I and D.C. Code § 16-572 et seq. Banks served with a writ restrain accounts. Claim exemptions under D.C. Code § 15-501. Confirm the Rule 69-I timeline on the writ.',
    noticeAutomatic: true,
    claimDeadlineDays: 14,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} D.C. Code § 16-572 and related earnings attachments. D.C. may apply a higher protected amount than the federal floor.`,
    personalPropertyNote:
      'D.C. Code § 15-501 (clothing, furniture, tools, insurance, public-assistance). Confirm current amounts.',
    formName: 'Claim of exemption / motion to release attachment (D.C. Super. Ct. Civ. R. 69-I).',
    citation: 'D.C. Code §§ 15-501, 16-571–16-584; D.C. Super. Ct. Civ. R. 69-I',
  }),
  UT: verified({
    state: 'UT',
    levyProcedure:
      'Utah writs of garnishment (Utah R. Civ. P. 64D) reach earnings and deposit accounts. The partner may request a hearing to claim exemptions under Utah Code Title 78B, Chapter 5, Part 5. Confirm the days-to-object printed on the writ.',
    noticeAutomatic: true,
    claimDeadlineDays: 14,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Utah Code § 78B-5-505 and Rule 64D earnings formula. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'Utah Code § 78B-5-505 (household, vehicle, tools, benefits) and homestead § 78B-5-503. Confirm current amounts.',
    formName: 'Reply and request for hearing on the Utah garnishment forms (Judicial Council packets).',
    citation: 'Utah Code §§ 78B-5-503–78B-5-508; Utah R. Civ. P. 64D',
  }),
  IA: verified({
    state: 'IA',
    levyProcedure:
      'Iowa garnishment (Iowa Code ch. 642) reaches wages and accounts. File an exemption claim under Iowa Code § 627.6. Confirm the appearance / answer date on the notice.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Iowa Code § 642.21 and related earnings exemptions.`,
    personalPropertyNote:
      'Iowa Code § 627.6 (wearing apparel, household, tools, motor vehicle, cash). Homestead Chapter 561. Confirm current amounts.',
    formName: 'Exemption claim / motion in the garnishment (Iowa Code ch. 642; local clerk packets).',
    citation: 'Iowa Code §§ 627.6, 642.1–642.21, ch. 561',
  }),
  NM: verified({
    state: 'NM',
    levyProcedure:
      'New Mexico garnishment (NMSA 1978, §§ 35-12-1 et seq. and related execution statutes) can freeze accounts and wages. Claim exemptions under NMSA 1978, § 42-10-1 et seq. Confirm magistrate vs. district procedure.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} New Mexico earnings exemptions interact with § 35-12-7 and related sections.`,
    personalPropertyNote:
      'NMSA 1978, §§ 42-10-1–42-10-10 (personal property, tools, vehicle, homestead-related). Confirm current amounts.',
    formName: 'Claim of exemption (magistrate / district packets; § 35-12 practice).',
    citation: 'NMSA 1978, §§ 35-12-1–35-12-19, 42-10-1–42-10-10',
  }),
  AK: verified({
    state: 'AK',
    levyProcedure:
      'Alaska post-judgment execution and garnishment follow AS 09.35 / 09.40 and Alaska Civil Rule 69. A financial institution served with a writ restrains funds. Claim exemptions under AS 09.38. Protected benefits and a portion of earnings remain off-limits unless a listed exception applies.',
    noticeAutomatic: true,
    claimDeadlineDays: 15,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Alaska earnings and benefit protections are in AS 09.38.015–09.38.030. Confirm disposable-earnings math on the writ.`,
    personalPropertyNote:
      'AS 09.38.020–09.38.025 (household, tools, vehicle) and homestead-related residence protection. Confirm current official amounts.',
    formName: 'Claim of exemption / objection on the Alaska execution or garnishment packet (Civil Rule 69 local forms).',
    citation: 'AS 09.35, 09.38.015–09.38.030, 09.40; Alaska R. Civ. P. 69',
  }),
  AR: verified({
    state: 'AR',
    levyProcedure:
      'Arkansas writs of garnishment and execution (Ark. Code Title 16, Chapters 66 and 110) reach banks and employers. The partner may claim exemptions. File the claim before the return or the date printed on the notice.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Arkansas earnings exemptions interact with Ark. Code §§ 16-66-218 and 16-110-402. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'Ark. Code § 16-66-218 and related homestead / personal-property schedules. Confirm current amounts and whether a homestead claim must be scheduled separately.',
    formName: 'Claim of exemption / assertion of exemptions (circuit or district clerk garnishment packet).',
    citation: 'Ark. Code Ann. §§ 16-66-201–16-66-221, 16-110-101–16-110-417',
  }),
  DE: verified({
    state: 'DE',
    levyProcedure:
      'Delaware attachment and execution (10 Del. C. and Super. Ct. Civ. R. 69) can freeze a deposit account. Claim exemptions under 10 Del. C. § 4902 et seq. Confirm Superior Court vs. Justice of the Peace procedure on the papers.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Delaware wage-attachment limits appear in 10 Del. C. and related labor provisions. Confirm whether the writ reached earnings or a bank account.`,
    personalPropertyNote:
      '10 Del. C. § 4914 homestead is $125,000. §§ 4902–4913 list wearing apparel, tools, household, insurance, and limited cash. Verify before relying.',
    formName: 'Claim of exemption / motion to vacate attachment (Superior Court or JP court packet).',
    citation: '10 Del. C. §§ 3501–3513, 4902–4914; Del. Super. Ct. Civ. R. 69',
  }),
  HI: verified({
    state: 'HI',
    levyProcedure:
      'Hawaii garnishment of wages and deposit accounts is HRS Chapter 652; exemptions are HRS § 651-121 et seq. A bank served with garnishment holds funds. File the exemption claim stated on the notice.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} HRS § 652-1 and related earnings sections. Hawaii may protect a larger share of wages than the federal floor — confirm the notice.`,
    personalPropertyNote:
      'HRS § 651-121 (household, tools, insurance, motor vehicle). Confirm current official amounts and any homestead election.',
    formName: 'Exemption claim on the Hawaii garnishment / execution packet (district or circuit).',
    citation: 'Haw. Rev. Stat. §§ 651-91–651-124, 652-1–652-14',
  }),
  ID: verified({
    state: 'ID',
    levyProcedure:
      'Idaho garnishment and execution (Idaho Code Titles 8 and 11) reach banks and employers. The partner may object and claim exemptions under Idaho Code § 11-603 et seq. Many notices use a short objection window — confirm the days printed on the writ.',
    noticeAutomatic: true,
    claimDeadlineDays: 14,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Idaho Code § 11-207 and related earnings exemptions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'Idaho Code §§ 11-603–11-607 (household, tools, vehicle, benefits). Homestead Idaho Code § 55-1001 et seq. Confirm current amounts.',
    formName: 'Claim of exemption / request for hearing (Idaho garnishment forms; local sheriff or clerk packet).',
    citation: 'Idaho Code §§ 8-507–8-540, 11-201–11-207, 11-603–11-607, 55-1001–55-1011',
  }),
  KS: verified({
    state: 'KS',
    levyProcedure:
      'Kansas wage and non-wage garnishment is K.S.A. 60-716 et seq. A bank served with an order of garnishment holds funds. Request a hearing and claim exemptions under K.S.A. 60-2301 et seq. Hearing-request windows are often about 14 days — confirm the order.',
    noticeAutomatic: true,
    claimDeadlineDays: 14,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} K.S.A. 60-2310 earnings exemptions. Kansas disposable-earnings math can exceed the federal floor.`,
    personalPropertyNote:
      'K.S.A. 60-2304 (household, vehicle, tools, benefits) and homestead K.S.A. 60-2301. Confirm current official amounts.',
    formName: 'Request for hearing / claim of exemption (K.S.A. 60-735 practice; judicial-council forms).',
    citation: 'K.S.A. 60-716–60-744, 60-2301–60-2315',
  }),
  ME: verified({
    state: 'ME',
    levyProcedure:
      'Maine uses trustee process (14 M.R.S. § 2601 et seq.) to reach banks. The trustee holds funds pending further order. Appear and assert exemptions under 14 M.R.S. § 4422. Deadlines often track the disclosure / appearance date on the summons.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} 14 M.R.S. § 3126-A and related earnings / installment-payment practice. Confirm whether trustee process reached wages or a deposit account.`,
    personalPropertyNote:
      '14 M.R.S. § 4422 (household, tools, vehicle, benefits, wild-card style items). Homestead 14 M.R.S. § 4422(1). Confirm current amounts.',
    formName: 'Disclosure / claim of exemptions in trustee process (District Court packets).',
    citation: '14 M.R.S. §§ 2601–2614, 3126-A, 4422',
  }),
  MS: verified({
    state: 'MS',
    levyProcedure:
      'Mississippi garnishment (Miss. Code § 11-35-1 et seq.) reaches wages and accounts. File a claim of exemption under Miss. Code § 85-3-1 et seq. before the funds are condemned.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Miss. Code § 85-3-4 and related earnings provisions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'Miss. Code §§ 85-3-1–85-3-47 (household, tools, homestead-related). Confirm current official amounts.',
    formName: 'Claim of exemption (circuit or county court garnishment packet).',
    citation: 'Miss. Code Ann. §§ 11-35-1–11-35-61, 85-3-1–85-3-47',
  }),
  MT: verified({
    state: 'MT',
    levyProcedure:
      'Montana execution and garnishment (Title 25, chapter 13) can freeze a deposit account. Claim exemptions under MCA 25-13-608 et seq. Confirm the days printed on the notice of levy.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} MCA 25-13-614 earnings exemptions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'MCA 25-13-609–25-13-617 (household, tools, vehicle, benefits). Homestead MCA Title 70, chapter 32. Confirm current amounts.',
    formName: 'Claim of exemption (Montana execution / garnishment packet; local clerk forms).',
    citation: 'Mont. Code Ann. §§ 25-13-501–25-13-826, 25-13-608–25-13-617',
  }),
  NE: verified({
    state: 'NE',
    levyProcedure:
      'Nebraska garnishment and execution (Neb. Rev. Stat. § 25-1001 et seq. and § 25-1056) reach banks and employers. Claim exemptions under § 25-1552 et seq. File before the garnishee pays or the court condemns the funds.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Neb. Rev. Stat. § 25-1558 earnings exemptions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'Neb. Rev. Stat. §§ 25-1552–25-1556 (household, tools, vehicle) and homestead Chapter 40. Confirm current amounts.',
    formName: 'Exemption claim / objection to garnishment (county or district court packet).',
    citation: 'Neb. Rev. Stat. §§ 25-1001–25-1056, 25-1552–25-1563',
  }),
  NH: verified({
    state: 'NH',
    levyProcedure:
      'New Hampshire trustee process (RSA 512) reaches banks. The trustee holds funds. Appear and claim exemptions under RSA 511:2 and related sections. Confirm the return / disclosure date on the writ.',
    noticeAutomatic: true,
    claimDeadlineDays: 30,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} RSA 512 and related earnings-trustee practice. Confirm whether the writ reached wages or a deposit account.`,
    personalPropertyNote:
      'RSA 511:2 (necessary apparel, furniture, tools, limited cash) and homestead RSA 480. Confirm current amounts.',
    formName: 'Trustee disclosure / claim of exemptions (Circuit Court / Superior Court packets).',
    citation: 'N.H. Rev. Stat. Ann. §§ 511:2, 512:1–512:51, 480:1–480:9',
  }),
  ND: verified({
    state: 'ND',
    levyProcedure:
      'North Dakota garnishment (N.D.C.C. ch. 32-09.1) reaches earnings and financial institutions. Claim exemptions under N.D.C.C. ch. 28-22. Deadlines are stated on the garnishment notice — often about 10 days to object.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} N.D.C.C. § 32-09.1-03 earnings exemptions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'N.D.C.C. §§ 28-22-02–28-22-03.1 (household, tools, vehicle, benefits). Homestead N.D.C.C. ch. 47-18. Confirm current amounts.',
    formName: 'Claim of exemption / objection to garnishment (N.D.C.C. 32-09.1 forms).',
    citation: 'N.D. Cent. Code §§ 28-22-01–28-22-19, 32-09.1-01–32-09.1-22',
  }),
  RI: verified({
    state: 'RI',
    levyProcedure:
      'Rhode Island trustee process (R.I. Gen. Laws § 10-17-1 et seq.) reaches banks. Assert exemptions under § 9-26-4. Confirm the citation return date — missing court can waive the listing.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} R.I. Gen. Laws earnings / trustee-process limits. Confirm whether the citation reached wages or a deposit account.`,
    personalPropertyNote:
      'R.I. Gen. Laws § 9-26-4 (necessary wearing apparel, furniture, tools, insurance, public assistance). Homestead § 9-26-4.1. Confirm current amounts.',
    formName: 'Claim of exemption / answer in trustee process (District or Superior Court packets).',
    citation: 'R.I. Gen. Laws §§ 9-26-4–9-26-4.1, 10-17-1–10-17-24',
  }),
  SD: verified({
    state: 'SD',
    levyProcedure:
      'South Dakota garnishment (SDCL ch. 21-18) and execution can freeze accounts. Claim exemptions under SDCL ch. 43-45. File the claim before the garnishee pays.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} SDCL 21-18-27 and related earnings exemptions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'SDCL 43-45-2–43-45-4 (household, tools, vehicle, additional wildcard-style items). Homestead SDCL ch. 43-31. Confirm current amounts.',
    formName: 'Claim of exemption (circuit court garnishment / execution packet).',
    citation: 'S.D. Codified Laws §§ 21-18-1–21-18-51, 43-45-1–43-45-9',
  }),
  VT: verified({
    state: 'VT',
    levyProcedure:
      'Vermont trustee process (12 V.S.A. and V.R.C.P. 4.2) reaches banks. Claim exemptions under 12 V.S.A. § 2740. Confirm the disclosure date on the trustee summons.',
    noticeAutomatic: true,
    claimDeadlineDays: 20,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Vermont earnings / trustee-process limits. Confirm whether the summons reached wages or a deposit account.`,
    personalPropertyNote:
      '12 V.S.A. § 2740 (goods, wearing apparel, tools, vehicle, benefits, wild-card). Homestead 27 V.S.A. § 101. Confirm current amounts.',
    formName: 'Trustee disclosure / claim of exemptions (Vermont Superior Court Civil Division packets).',
    citation: '12 V.S.A. §§ 2731–2740; 27 V.S.A. § 101; V.R.C.P. 4.2',
  }),
  WV: verified({
    state: 'WV',
    levyProcedure:
      'West Virginia suggestee execution (wages) is W. Va. Code § 38-5A; levy on personal property and accounts uses Chapter 38 execution practice. Claim exemptions under § 38-8-1 et seq. Deadlines are short — read the suggestee or levy notice the day it arrives.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} W. Va. Code § 38-5A-3 and related suggestee-execution limits. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'W. Va. Code §§ 38-8-1–38-8-15 (household, tools, prescribed health items) and homestead § 38-9-1. Confirm current amounts.',
    formName: 'Claim of exemption / suggestee-execution exemption (magistrate or circuit packet).',
    citation: 'W. Va. Code §§ 38-5A-1–38-5A-13, 38-8-1–38-8-15, 38-9-1–38-9-6',
  }),
  WY: verified({
    state: 'WY',
    levyProcedure:
      'Wyoming garnishment (Wyo. Stat. § 1-15-401 et seq.) reaches earnings and accounts. Claim exemptions under § 1-20-101 et seq. File before the garnishee is ordered to pay.',
    noticeAutomatic: true,
    claimDeadlineDays: 10,
    deadlineKind: 'calendar',
    wageCapNote: `${CCPA_WAGE} Wyo. Stat. § 1-15-408 and related earnings exemptions. Confirm disposable-earnings math.`,
    personalPropertyNote:
      'Wyo. Stat. §§ 1-20-101–1-20-110 (household, tools, vehicle, benefits). Homestead § 1-20-101. Confirm current amounts.',
    formName: 'Claim of exemption (circuit court garnishment packet).',
    citation: 'Wyo. Stat. Ann. §§ 1-15-401–1-15-511, 1-20-101–1-20-110',
  }),
};

const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
] as const;

/** All 50 states + DC. Levy / exemption profiles are fully specified; vacate / appeal / COJ clocks live in stateJudgmentClocks.ts. */
export const STATE_EXEMPTION_PROFILES: StateExemptionProfile[] = STATE_CODES.map((code) => {
  return FULL_PROFILES[code] ?? placeholderProfile(code);
});

export function getStateExemptionProfile(state: string | undefined | null): StateExemptionProfile | null {
  const normalized = String(state ?? '').trim().toUpperCase();
  if (!normalized) return null;
  return STATE_EXEMPTION_PROFILES.find((p) => p.state === normalized) ?? null;
}

export function countVerifiedStateProfiles(): { fullySpecified: number; placeholder: number } {
  let fullySpecified = 0;
  let placeholder = 0;
  for (const p of STATE_EXEMPTION_PROFILES) {
    if (p.lastVerified === PLACEHOLDER_LAST_VERIFIED) placeholder += 1;
    else fullySpecified += 1;
  }
  return { fullySpecified, placeholder };
}

export function describeClaimWindow(profile: StateExemptionProfile): string {
  if (profile.claimDeadlineDays == null || profile.claimDeadlineDays <= 0) {
    return 'Confirm the claim window with counsel — this profile does not list a safe default count.';
  }
  const unit = profile.deadlineKind === 'business' ? 'business' : 'calendar';
  return `${profile.claimDeadlineDays} ${unit} day${profile.claimDeadlineDays === 1 ? '' : 's'} after notice`;
}
