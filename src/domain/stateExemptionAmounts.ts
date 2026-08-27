/**
 * Cited homestead / wildcard / personal-property dollar figures for process planning.
 * Educational only — verify before relying. Not legal advice.
 */

export type ExemptionAmountLine = {
  amount: string;
  citation: string;
  asOf: string;
};

export type StateExemptionAmounts = {
  state: string;
  homestead: ExemptionAmountLine;
  wildcard?: ExemptionAmountLine;
  personalProperty?: ExemptionAmountLine;
  verifyNote: string;
};

export const EXEMPTION_AMOUNT_VERIFY_NOTE =
  'Verify before relying. These are 2024–2026 published planning figures for process guidance — not legal advice. CPI tables, Judicial Council schedules, and local rules change.';

const AS_OF = '2024–2026 published schedule';

function line(amount: string, citation: string, asOf = AS_OF): ExemptionAmountLine {
  return { amount, citation, asOf };
}

function row(
  state: string,
  homestead: ExemptionAmountLine,
  extra?: { wildcard?: ExemptionAmountLine; personalProperty?: ExemptionAmountLine },
): StateExemptionAmounts {
  return {
    state,
    homestead,
    wildcard: extra?.wildcard,
    personalProperty: extra?.personalProperty,
    verifyNote: EXEMPTION_AMOUNT_VERIFY_NOTE,
  };
}

const AMOUNTS: Record<string, StateExemptionAmounts> = {
  AL: row(
    'AL',
    line(
      'About $18,800 (CPI-adjusted planning figure; $15,000 statutory base)',
      'Ala. Code § 6-10-2',
      '2024-01 published CPI-adjusted planning figure',
    ),
    { personalProperty: line('Listed household / tools — modest dollar schedule', 'Ala. Code § 6-10-6') },
  ),
  AK: row(
    'AK',
    line('$72,900', 'Alaska Stat. § 09.38.010'),
    { wildcard: line('$3,000 unused exemption (planning figure)', 'Alaska Stat. § 09.38.017 / § 09.38.020') },
  ),
  AZ: row(
    'AZ',
    line('$400,000 equity', 'Ariz. Rev. Stat. § 33-1101'),
    { personalProperty: line('Household, tools, and vehicle — listed dollar schedule', 'Ariz. Rev. Stat. § 33-1123 et seq.') },
  ),
  AR: row(
    'AR',
    line('Acreage homestead (urban / rural limits) — generally no dollar cap for a qualifying residence', 'Ark. Const. art. 9, §§ 3–5'),
    { personalProperty: line('$800 plus $200 per dependent (planning figure)', 'Ark. Code § 16-66-218') },
  ),
  CA: row(
    'CA',
    line(
      '$361,074–$722,148 by county (2024 Judicial Council table). Official form EJ-156 (rev. July 20, 2026; listed 704.010 amounts effective April 1, 2025) does not publish the CCP 704.730 homestead band. A later 2025+ homestead table may exist — verify before relying; this row does not substitute an unofficial 2025 figure.',
      'Cal. Civ. Proc. Code § 704.730',
      '2024-01-01 Judicial Council CCP 704.730 table; EJ-156 does not list 704.730',
    ),
    {
      personalProperty: line(
        'Motor vehicle, household, tools — listed CCP 704 categories (amounts adjust)',
        'Cal. Civ. Proc. Code §§ 704.010–704.210',
      ),
    },
  ),
  CO: row(
    'CO',
    line('$250,000; $350,000 if elderly or disabled (planning figures)', 'Colo. Rev. Stat. § 38-41-201'),
    { personalProperty: line('Household, vehicles, tools, cash — listed 13-54-102 schedule', 'Colo. Rev. Stat. § 13-54-102') },
  ),
  CT: row(
    'CT',
    line('$75,000; $125,000 if 62+ or disabled (planning figures)', 'Conn. Gen. Stat. § 52-352b'),
    { personalProperty: line('Necessary apparel, furniture, tools, insurance', 'Conn. Gen. Stat. § 52-352b') },
  ),
  DC: row('DC', line('Unlimited homestead for a qualifying residence', 'D.C. Code § 15-501 / § 42-1902.09-style homestead practice')),
  DE: row(
    'DE',
    line('$125,000', '10 Del. C. § 4914'),
    { personalProperty: line('Apparel, tools, household, limited cash', '10 Del. C. §§ 4902–4913') },
  ),
  FL: row(
    'FL',
    line('Unlimited dollar homestead (acreage / municipal-lot limits)', 'Fla. Const. art. X, § 4'),
    {
      wildcard: line('$4,000 if homestead is not claimed', 'Fla. Stat. § 222.25(4)'),
      personalProperty: line('$1,000 personal property', 'Fla. Stat. § 222.25(1)'),
    },
  ),
  GA: row(
    'GA',
    line('$21,500; $43,000 if married and both entitled (planning figures)', 'O.C.G.A. § 44-13-100'),
    { wildcard: line('Listed vehicle / household / tools on the same schedule', 'O.C.G.A. § 44-13-100') },
  ),
  HI: row(
    'HI',
    line('About $30,000 head-of-family (planning figure)', 'Haw. Rev. Stat. § 651-92'),
    { personalProperty: line('Listed household and tools', 'Haw. Rev. Stat. § 651-121') },
  ),
  ID: row(
    'ID',
    line('$175,000', 'Idaho Code § 55-1003'),
    { personalProperty: line('Household, tools, and vehicle — listed schedule', 'Idaho Code § 11-605') },
  ),
  IL: row(
    'IL',
    line('$15,000; $30,000 joint', '735 ILCS 5/12-901'),
    { wildcard: line('$4,000', '735 ILCS 5/12-1001(b)') },
  ),
  IN: row(
    'IN',
    line('About $19,300; about $38,600 joint (CPI-adjusted planning figures)', 'Ind. Code § 34-55-10-2'),
    { personalProperty: line('Listed household / tools on the same statute', 'Ind. Code § 34-55-10-2') },
  ),
  IA: row(
    'IA',
    line('Unlimited dollar homestead (40 acres rural / ½ acre urban, typical)', 'Iowa Code § 561.2'),
    { personalProperty: line('Listed household and tools', 'Iowa Code § 627.6') },
  ),
  KS: row(
    'KS',
    line('Unlimited dollar homestead (1 acre urban / 160 rural, typical)', 'Kan. Const. art. 15, § 9; K.S.A. 60-2301'),
    { personalProperty: line('Listed household, tools, and vehicle', 'K.S.A. 60-2304') },
  ),
  KY: row(
    'KY',
    line('$5,000', 'Ky. Rev. Stat. § 427.060'),
    { wildcard: line('$1,000 plus listed household / tools', 'Ky. Rev. Stat. § 427.010 et seq.') },
  ),
  LA: row(
    'LA',
    line('$35,000', 'La. Const. art. XII, § 9; La. R.S. 20:1'),
    { personalProperty: line('Listed household and tools', 'La. R.S. 13:3881') },
  ),
  ME: row(
    'ME',
    line('$80,000; $160,000 if minor child, elderly, or disabled (planning figures)', '14 M.R.S. § 4422'),
    { personalProperty: line('Listed household, tools, and vehicle', '14 M.R.S. § 4422') },
  ),
  MD: row(
    'MD',
    line('No traditional judgment homestead (owner-occupied residence is not a large homestead exemption here)', 'Md. Cts. & Jud. Proc. § 11-504'),
    { wildcard: line('About $25,015 (CPI-adjusted planning figure)', 'Md. Cts. & Jud. Proc. § 11-504(b)') },
  ),
  MA: row(
    'MA',
    line('$125,000 automatic; $500,000 declared; $1,000,000 elderly/disabled/minor (planning figures)', 'Mass. Gen. Laws c. 188'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Mass. Gen. Laws c. 235, § 34') },
  ),
  MI: row(
    'MI',
    line('About $40,475; about $60,725 if 65+ or disabled (CPI-adjusted planning figures)', 'Mich. Comp. Laws § 600.6023'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Mich. Comp. Laws § 600.6023') },
  ),
  MN: row(
    'MN',
    line(
      'About $480,000–$510,000 (adjusts; $450,000 statutory floor in older text)',
      'Minn. Stat. § 510.02',
      '2024-01 published CPI-adjusted planning figure',
    ),
    { personalProperty: line('Listed household, tools, and vehicle', 'Minn. Stat. § 550.37') },
  ),
  MS: row(
    'MS',
    line('$75,000', 'Miss. Code § 85-3-21'),
    { personalProperty: line('Listed household and tools', 'Miss. Code § 85-3-1') },
  ),
  MO: row(
    'MO',
    line('$15,000', 'Mo. Rev. Stat. § 513.475'),
    { wildcard: line('$1,500 plus listed household / tools (planning figure)', 'Mo. Rev. Stat. § 513.430') },
  ),
  MT: row(
    'MT',
    line('$350,000', 'Mont. Code § 70-32-104'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Mont. Code § 25-13-609') },
  ),
  NE: row(
    'NE',
    line('$60,000', 'Neb. Rev. Stat. § 40-101'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Neb. Rev. Stat. § 25-1556') },
  ),
  NV: row(
    'NV',
    line('$605,000', 'Nev. Rev. Stat. § 115.010'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Nev. Rev. Stat. § 21.090') },
  ),
  NH: row(
    'NH',
    line('$120,000', 'N.H. Rev. Stat. § 480:1'),
    { personalProperty: line('Listed household, tools, and vehicle', 'N.H. Rev. Stat. § 511:2') },
  ),
  NJ: row(
    'NJ',
    line('No large judgment homestead (tax homestead rebate is not a levy exemption)', 'N.J.S.A. 2A:17-17 et seq.'),
    {
      wildcard: line('$1,000 personal property plus wearing apparel', 'N.J.S.A. 2A:17-19'),
      personalProperty: line('Clothing, household necessities, and listed benefit protections', 'N.J.S.A. 2A:17-17–2A:17-19'),
    },
  ),
  NM: row(
    'NM',
    line('$60,000', 'N.M. Stat. § 42-10-9'),
    { personalProperty: line('Listed household, tools, and vehicle', 'N.M. Stat. § 42-10-1 et seq.') },
  ),
  NY: row(
    'NY',
    line('$89,975 / $149,975 / $179,950 by county band (CPLR 5206 planning figures)', 'N.Y. CPLR 5206'),
    {
      personalProperty: line(
        'CPLR 5205 listed personal property; EIPA bank-account floor under CPLR 5222-a (adjusts)',
        'N.Y. CPLR 5205, 5222-a',
      ),
    },
  ),
  NC: row(
    'NC',
    line('$35,000; $60,000 if 65+ and spouse deceased (planning figures)', 'N.C. Gen. Stat. § 1C-1601'),
    { personalProperty: line('Listed household, tools, and vehicle', 'N.C. Gen. Stat. § 1C-1601') },
  ),
  ND: row(
    'ND',
    line('About $100,000–$150,000 plus acreage limits (verify current published cap)', 'N.D. Cent. Code § 47-18-01'),
    { personalProperty: line('Listed household, tools, and vehicle', 'N.D. Cent. Code § 28-22-02') },
  ),
  OH: row(
    'OH',
    line(
      'About $182,625 (triennial CPI-adjusted planning figure)',
      'Ohio Rev. Code § 2329.66(A)(1)',
      '2025-04-01 R.C. 2329.66 triennial adjustment',
    ),
    { wildcard: line('$400 cash plus listed household / tools (planning figures)', 'Ohio Rev. Code § 2329.66') },
  ),
  OK: row(
    'OK',
    line('Unlimited dollar homestead (acreage limits)', 'Okla. Const. art. 12; 31 O.S. § 1'),
    { personalProperty: line('Listed household, tools, and vehicle', '31 O.S. § 1') },
  ),
  OR: row(
    'OR',
    line('$150,000', 'Or. Rev. Stat. § 18.395'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Or. Rev. Stat. § 18.345') },
  ),
  PA: row(
    'PA',
    line('No traditional judgment homestead', '42 Pa.C.S. §§ 8123–8124'),
    {
      wildcard: line('$300 cash plus clothing and $300 tools (planning figures)', '42 Pa.C.S. §§ 8123–8124'),
      personalProperty: line('Retirement / insurance categories on the same schedule', '42 Pa.C.S. § 8124'),
    },
  ),
  RI: row(
    'RI',
    line('$500,000', 'R.I. Gen. Laws § 9-26-4.1'),
    { personalProperty: line('Listed household, tools, and vehicle', 'R.I. Gen. Laws § 9-26-4') },
  ),
  SC: row(
    'SC',
    line(
      'About $63,250 (CPI-adjusted planning figure)',
      'S.C. Code § 15-41-30',
      '2022-07-01 S.C. Code § 15-41-30 CPI adjustment',
    ),
    { personalProperty: line('Listed household, tools, and vehicle', 'S.C. Code § 15-41-30') },
  ),
  SD: row(
    'SD',
    line('Unlimited dollar homestead (acreage limits)', 'S.D. Codified Laws ch. 43-31'),
    { personalProperty: line('Listed household and tools', 'S.D. Codified Laws ch. 43-45') },
  ),
  TN: row(
    'TN',
    line('$5,000; $7,500 joint (planning figures)', 'Tenn. Code § 26-2-301'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Tenn. Code § 26-2-103 et seq.') },
  ),
  TX: row(
    'TX',
    line('Unlimited dollar homestead (10 urban acres / 100 rural acres, typical)', 'Tex. Prop. Code ch. 41; Tex. Const. art. XVI, §§ 50–51'),
    {
      wildcard: line('$50,000 single adult / $100,000 family aggregate personal property', 'Tex. Prop. Code § 42.001'),
      personalProperty: line('Listed categories inside the aggregate cap (home furnishings, tools, vehicles)', 'Tex. Prop. Code §§ 42.001–42.002'),
    },
  ),
  UT: row(
    'UT',
    line('About $42,700; about $85,400 joint (planning figures)', 'Utah Code § 78B-5-503'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Utah Code § 78B-5-505') },
  ),
  VT: row(
    'VT',
    line('$125,000', '27 V.S.A. § 101'),
    { personalProperty: line('Listed household, tools, and vehicle', '12 V.S.A. § 2740') },
  ),
  VA: row(
    'VA',
    line('$50,000', 'Va. Code § 34-4'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Va. Code § 34-26') },
  ),
  WA: row(
    'WA',
    line('$125,000', 'Wash. Rev. Code § 6.13.030'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Wash. Rev. Code § 6.15.010') },
  ),
  WV: row(
    'WV',
    line('$25,000', 'W. Va. Code § 38-9-1'),
    { personalProperty: line('Listed household, tools, and vehicle', 'W. Va. Code § 38-8-1') },
  ),
  WI: row(
    'WI',
    line('$75,000', 'Wis. Stat. § 815.20'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Wis. Stat. § 815.18') },
  ),
  WY: row(
    'WY',
    line('$20,000', 'Wyo. Stat. § 1-20-101'),
    { personalProperty: line('Listed household, tools, and vehicle', 'Wyo. Stat. § 1-20-105 et seq.') },
  ),
};

function fallbackAmounts(state: string): StateExemptionAmounts {
  return row(
    state,
    line('Confirm the current homestead schedule with counsel', `${state} homestead / exemption statute`),
    { personalProperty: line('Confirm listed personal-property amounts with counsel', `${state} exemption statute`) },
  );
}

export function getStateExemptionAmounts(state: string | undefined | null): StateExemptionAmounts | null {
  const normalized = String(state ?? '').trim().toUpperCase();
  if (!normalized) return null;
  return AMOUNTS[normalized] ?? fallbackAmounts(normalized);
}

export function describeExemptionAmountLine(line: ExemptionAmountLine): string {
  return `${line.amount} (${line.citation}; ${line.asOf})`;
}

export function countCitedExemptionAmountProfiles(): { total: number; cited: number } {
  return { total: Object.keys(AMOUNTS).length, cited: Object.keys(AMOUNTS).length };
}
