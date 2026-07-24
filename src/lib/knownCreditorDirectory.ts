/**
 * Last-resort mailing directory for common debt buyers / national collectors.
 * Used only when report/document extraction has no address. Educational — verify before mailing.
 */

export type KnownCreditorEntry = {
  /** Match aliases (lowercased substrings / names) */
  aliases: string[];
  displayName: string;
  address: string;
  phone?: string;
  kind: 'debt_buyer' | 'collector' | 'law_firm' | 'bank';
};

export const KNOWN_CREDITOR_DIRECTORY: KnownCreditorEntry[] = [
  {
    aliases: ['midland credit', 'midland funding', 'mcm'],
    displayName: 'Midland Credit Management, Inc.',
    address: 'P.O. Box 939069\nSan Diego, CA 92193',
    phone: '877-600-6800',
    kind: 'debt_buyer',
  },
  {
    aliases: ['portfolio recovery', 'pra ', 'portfolio recovery associates'],
    displayName: 'Portfolio Recovery Associates, LLC',
    address: '120 Corporate Blvd\nNorfolk, VA 23502',
    phone: '866-428-1098',
    kind: 'debt_buyer',
  },
  {
    aliases: ['lvnv', 'resurgent'],
    displayName: 'LVNV Funding LLC c/o Resurgent Capital Services',
    address: 'P.O. Box 10485\nGreenville, SC 29603',
    kind: 'debt_buyer',
  },
  {
    aliases: ['cavalry', 'cavalry spv', 'cavalry portfolio'],
    displayName: 'Cavalry Portfolio Services, LLC',
    address: '500 Summit Lake Drive, Suite 400\nValhalla, NY 10595',
    kind: 'debt_buyer',
  },
  {
    aliases: ['jefferson capital', 'jcap'],
    displayName: 'Jefferson Capital Systems, LLC',
    address: '16 McLeland Road\nSt. Cloud, MN 56303',
    kind: 'debt_buyer',
  },
  {
    aliases: ['velocity investments'],
    displayName: 'Velocity Investments, LLC',
    address: '1800 Route 34 North, Suite 404A\nWall, NJ 07719',
    kind: 'debt_buyer',
  },
  {
    aliases: ['absolute resolutions', 'absolute resolution'],
    displayName: 'Absolute Resolutions Investments, LLC',
    address: '8000 Norman Center Drive, Suite 350\nBloomington, MN 55437',
    kind: 'debt_buyer',
  },
  {
    aliases: ['stenger & stenger', 'stenger and stenger'],
    displayName: 'Stenger & Stenger, P.C.',
    address: '2618 East Paris Avenue SE\nGrand Rapids, MI 49546',
    kind: 'law_firm',
  },
  {
    aliases: ['weber & olcese', 'weber and olcese'],
    displayName: 'Weber & Olcese, P.L.C.',
    address: '2655 Woodward Avenue, Suite 200\nBloomfield Hills, MI 48304',
    kind: 'law_firm',
  },
  {
    aliases: ['stillman law', 'stillman & associates', 'stillman and associates'],
    displayName: 'Stillman Law Office',
    address: '30057 Orchard Lake Road, Suite 200\nFarmington Hills, MI 48334',
    kind: 'law_firm',
  },
  {
    aliases: ['shermeta', 'shermeta law', 'shermeta adams'],
    displayName: 'Shermeta Law Group, PLLC',
    address: 'P.O. Box 1056\nRochester, MI 48308',
    kind: 'law_firm',
  },
  {
    aliases: ['mancinelli', 'mancinelli & associates', 'goeman law', 'mancinelli goeman'],
    displayName: 'Mancinelli & Associates, P.C.',
    address: '2950 W. Square Lake Road, Suite 105\nTroy, MI 48098',
    kind: 'law_firm',
  },
  {
    aliases: ['weltman weinberg', 'weltman, weinberg', 'weltman weinberg & reis'],
    displayName: 'Weltman, Weinberg & Reis Co., L.P.A.',
    address: '323 W. Lakeside Avenue, Suite 200\nCleveland, OH 44113',
    kind: 'law_firm',
  },
  {
    aliases: ['dobberstein', 'dobberstein law'],
    displayName: 'Dobberstein Law Firm, LLC',
    address: '225 S. Executive Drive, Suite 201\nBrookfield, WI 53005',
    kind: 'law_firm',
  },
  {
    aliases: ['lloyd mcdaniel', 'lloyd & mcdaniel'],
    displayName: 'Lloyd & McDaniel, PLC',
    address: 'P.O. Box 23200\nLouisville, KY 40223',
    kind: 'law_firm',
  },
  {
    aliases: ['citibank', 'citi bank', 'citibank n.a', 'citibank, n.a'],
    displayName: 'Citibank, N.A.',
    address: 'P.O. Box 790017\nSt. Louis, MO 63179',
    kind: 'bank',
  },
  {
    aliases: ['discover bank', 'discover card'],
    displayName: 'Discover Bank',
    address: 'P.O. Box 30943\nSalt Lake City, UT 84130',
    kind: 'bank',
  },
  {
    aliases: ['capital one', 'cap one'],
    displayName: 'Capital One, N.A.',
    address: 'P.O. Box 30285\nSalt Lake City, UT 84130',
    kind: 'bank',
  },
  {
    aliases: ['synchrony', 'synchrony bank'],
    displayName: 'Synchrony Bank',
    address: 'P.O. Box 965033\nOrlando, FL 32896',
    kind: 'bank',
  },
  {
    aliases: ['bank of america', 'bofa', 'boa '],
    displayName: 'Bank of America, N.A.',
    address: 'P.O. Box 982238\nEl Paso, TX 79998',
    kind: 'bank',
  },
  {
    aliases: ['uhg', 'uhg i', 'united holding group'],
    displayName: 'UHG I LLC',
    address: '200 Crossings Boulevard\nWarwick, RI 02886',
    kind: 'debt_buyer',
  },
  {
    aliases: ['rock creek capital'],
    displayName: 'Rock Creek Capital, LLC',
    address: '7950 Jones Branch Drive\nMcLean, VA 22102',
    kind: 'debt_buyer',
  },
  {
    aliases: ['sallie mae', 'navient', 'slm private education'],
    displayName: 'Sallie Mae Bank',
    address: 'P.O. Box 3319\nWilmington, DE 19804',
    kind: 'bank',
  },
  {
    aliases: ['timothy baxter', 'baxter law'],
    displayName: 'Timothy Baxter & Associates',
    address: '30057 Orchard Lake Road, Suite 200\nFarmington Hills, MI 48334',
    kind: 'law_firm',
  },
];

function norm(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function lookupKnownCreditor(name: string): KnownCreditorEntry | null {
  const n = norm(name);
  if (!n || n.length < 3) return null;
  for (const entry of KNOWN_CREDITOR_DIRECTORY) {
    if (entry.aliases.some((a) => n.includes(norm(a)) || norm(a).includes(n))) return entry;
  }
  return null;
}

/** Try firm / collector / attorney / creditor names in priority order. */
export function lookupKnownCreditorFromCandidates(
  names: Array<string | null | undefined>,
): KnownCreditorEntry | null {
  for (const raw of names) {
    const hit = lookupKnownCreditor(String(raw || ''));
    if (hit) return hit;
  }
  return null;
}
