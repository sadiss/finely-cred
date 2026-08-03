/**
 * Business Credit Partner One-Sheets — eight visually distinct full-page PDF layouts.
 * Shared helpers + one layout function per sheet id (not accent-color clones).
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import {
  BC_CAPITAL_OUTLOOK_COMPLIANCE,
  getBusinessCapitalOutlookForTierSheet,
  listBusinessCreditCapitalTiers,
} from '../config/businessCapitalOutlook';
import { businessCreditPackages, formatPrice } from '../config/pricingCatalog';

export type BusinessCreditOneSheetId =
  | 'fundability_roadmap'
  | 'overview'
  | 'foundation'
  | 'builder'
  | 'elite'
  | 'empire'
  | 'compare'
  | 'named_cards';

export type BusinessCreditOneSheetSpec = {
  id: BusinessCreditOneSheetId;
  title: string;
  eyebrow: string;
  /** Short card blurb for the Resources page */
  summary: string;
  /** Who this sheet is for */
  whoFor: string;
  /** What you get / what’s inside */
  includes: string[];
  /** Time / intensity */
  effort: string;
  /** Proof / outcome signals (not guarantees) */
  proofPoints: string[];
  /** Clear next step */
  cta: string;
  accent: [number, number, number];
  priceLine?: string;
  /** Finely Cred program fee */
  capitalProgramFeeLine?: string;
  /** Est. vendor/trade/deposit outlay (partner cash) */
  capitalOutlayLine?: string;
  /** Approximate potential BC capital band */
  capitalPotentialLine?: string;
  /** Extra PDF body lines (merged after includes when needed) */
  bodyExtra?: string[];
  compliance?: string;
};

const COMPLIANCE = `${BC_CAPITAL_OUTLOOK_COMPLIANCE}. Named-card and lender outcomes are never guaranteed.`;

function tierCapitalLines(sheetId: 'foundation' | 'builder' | 'elite' | 'empire') {
  const outlook = getBusinessCapitalOutlookForTierSheet(sheetId)!;
  return {
    capitalProgramFeeLine: outlook.programFeeLabel,
    capitalOutlayLine: outlook.vendorOutlayLabel,
    capitalPotentialLine: outlook.potentialLabel,
  };
}

const PAGE_W = 612;
const PAGE_H = 792;
const FOOTER_H = 42;

const SHEETS: BusinessCreditOneSheetSpec[] = [
  {
    id: 'fundability_roadmap',
    title: 'Business Credit Fundability Roadmap',
    eyebrow: 'START HERE · TRUE FUNDABILITY · NOT A PRICE SHEET',
    summary:
      'What “fundable” actually means for a commercial file: six pillars, stage gates, blockers vs green lights, and how the Business Credit OS scorecard maps to the build — so partners stop confusing sticker tiers with readiness.',
    whoFor:
      'Every partner before choosing a tier — founders, operators, and advisors who need a shared definition of fundability (entity truth through capital packaging) before quoting hours or chasing named products.',
    includes: [
      'Six pillars: entity truth, commercial identity, reporting vendors, payment optics, docs/packaging, scorecard readiness',
      'Stage gates: what “fundable” looks like week-by-week (W1–2 → W12+)',
      'Common blockers vs green lights partners and specialists watch together',
      'How Business Credit OS scorecard weights map to the roadmap',
      'CTA path: 3-sheet Process Brief → tier sheets → work-calibrated quote',
      'Compliance framing: educational sequencing — underwriting still decides',
    ],
    effort: 'Read in 5–7 minutes · share before anyone applies or picks a tier',
    proofPoints: [
      'Fundability is a file state — not a program fee',
      'Scorecard mirrors the same pillars specialists execute against',
      'Stage gates stop leapfrogging into named-card chaos',
      'Pairs with the 3-sheet Process Brief (how) and Tier Ladder (pricing outlook)',
    ],
    cta: 'Next: download the 3-sheet Process Brief, then Tier Ladder & Capital Outlook + your tier sheet — quote at /pricing/business-credit. Book a session with this roadmap in hand.',
    accent: [0.1, 0.42, 0.48],
    bodyExtra: [
      'This sheet is the readiness map. Tier Ladder is program fee · vendor outlay · potential capital.',
      'Wrong sequence burns inquiries; right sequence compounds reportables.',
    ],
    compliance: COMPLIANCE,
  },
  {
    id: 'overview',
    title: 'Tier Ladder & Capital Outlook',
    eyebrow: 'PRICING LADDER · PROGRAM · OUTLAY · POTENTIAL',
    summary:
      'Side-by-side capital outlook across Foundation → Builder → Elite → Empire: Finely Cred program fee, estimated partner vendor outlay, and approximate potential business-credit capital band — so decision-makers compare intensity and cash posture before quoting.',
    whoFor:
      'Partners comparing tier stickers with eyes open — co-founders, ops leads, and advisors who need program fee vs vendor outlay vs potential capital on one page before a work-calibrated quote.',
    includes: [
      'Four-tier capital cards: Foundation → Builder → Elite → Empire',
      'Program fee · est. vendor outlay · potential BC capital per tier',
      'Destination fit + delivery mode + specialist hour bands',
      'Maturity note: 3+ year files often need more research hours',
      'How this pairs with the Fundability Roadmap (readiness ≠ price)',
      'Next: pick a tier sheet, then run the work-calibrated quote',
    ],
    effort: 'Read in 3–4 minutes · bring to pricing and Book a session',
    proofPoints: [
      'Pricing clarity without fake approval promises',
      'Outlay and potential bands are outlooks — results vary',
      'Pick intensity by destination after the Fundability Roadmap',
      'Same stickers as /pricing/business-credit — no mystery fifth tier',
    ],
    cta: 'After the Fundability Roadmap: download your tier sheet, then open /pricing/business-credit for a work-calibrated quote — bring this ladder to Book a session.',
    accent: [0.72, 0.45, 0.12],
    bodyExtra: [
      'This is a capital outlook ladder — not the fundability sequence.',
      'Use Fundability Roadmap for pillars and stage gates; use this for fee/outlay/potential.',
    ],
    compliance: COMPLIANCE,
  },
  {
    id: 'foundation',
    title: 'Business Foundation',
    eyebrow: 'HYBRID · $2,997 · ENTITY → FIRST REPORTABLES',
    summary:
      'The identity layer every fundable file stands on: entity truth, bureau alignment, and the first reporting net-30 vendors in order — so partners become commercially identifiable before chasing revolving products that reject thin files.',
    whoFor:
      'Startups and clean new LLCs/corps (typically 0–18 months) that need structure, phone/address/domain hygiene, and first reportable trades before a heavier DFY engagement. Ideal when the commercial file is thin and clean — not messy aged chaos.',
    includes: [
      'Entity / EIN / SOS / address / phone / domain hygiene (match what lenders query)',
      'D-U-N-S + commercial bureau alignment so the business is findable',
      'Starter Tier-1 reporting net-30 vendors — sequenced, not spray-and-pray',
      'Business Credit OS scorecard: entity + first-vendor visibility weekly',
      'Partner homework cadence: docs, banking signals, confirmation of reportables',
      'Document vault checklist so underwriting asks do not stall the file',
    ],
    effort: '~8–16 specialist hours · hybrid delivery · partner homework required every week',
    proofPoints: [
      'Stops thin-file leapfrogs into PG-heavy cards that reject early',
      'Builds the identity layer vendors and funders actually match on',
      'First reporting footprint compounds — random apps usually do not',
      'Scorecard shows green lights (or blockers) instead of “vibes”',
    ],
    cta: 'Ready for Foundation? Quote at /pricing/business-credit — or chat with a Funding Strategist if entity docs or SOS status are incomplete.',
    accent: [0.12, 0.48, 0.42],
    priceLine: formatPrice(299700),
    ...tierCapitalLines('foundation'),
    bodyExtra: [
      'Do not skip entity truth on paper — mismatches die before trades are read.',
      'Messy aged trades or named-card goals → review Builder / Elite instead.',
      'Pair with Fundability Roadmap W1–4 gates before stacking vendors.',
    ],
    compliance: COMPLIANCE,
  },
  {
    id: 'builder',
    title: 'Business Builder',
    eyebrow: 'MOST POPULAR · $5,997 · DFY SEQUENCING',
    summary:
      'The execution tier: done-for-you vendor sequencing and trade depth so the commercial file looks fundable — specialist cycles, monitoring cadence, and funding-readiness docs. Most partners land here when they want progress, not another DIY checklist.',
    whoFor:
      'Operators ready for full Tier 1–4 sequencing, or early businesses that want hands-on progress tracking and priority specialist touchpoints without white-glove named-product intensity. Also fits aged files that need structured cleanup before stacking.',
    includes: [
      'Everything in Foundation — hygiene + first reportables already in motion',
      'Full Tier 1–4 vendor sequencing with DFY specialist cycles',
      'Trade account strategy + monitoring cadence (payment optics / Paydex rhythm)',
      'Funding-readiness assessment + doc packaging before capital chase',
      'Priority specialist touchpoints + escalation when a vendor stalls',
      'Aged-file cleanup guidance before stacking depth that poisons optics',
    ],
    effort: '~15–30 specialist hours · DFY · partner provides docs and banking access as needed',
    proofPoints: [
      'Most Popular because partners want execution — not theory PDFs',
      'DFY cycles kill the “which vendor next?” stall that freezes builds',
      'Packaging starts before revolving capital — underwriters hate scramble kits',
      'Works for early operators and for aged files that need structured cleanup',
    ],
    cta: 'Choose Builder for specialist sequencing. Quote at /pricing/business-credit — move to Elite only when named issuers become the destination.',
    accent: [0.85, 0.55, 0.15],
    priceLine: formatPrice(599700),
    ...tierCapitalLines('builder'),
    bodyExtra: [
      'Upgrade to Elite when named issuers/products are the destination.',
      'Established (3+ years) files may price with research uplift — aged data takes time.',
      'Scorecard focus: vendor reporting + bureau momentum (Fundability Roadmap W5–12).',
    ],
    compliance: COMPLIANCE,
  },
  {
    id: 'elite',
    title: 'Business Elite',
    eyebrow: 'WHITE-GLOVE · $12,997 · NAMED PRODUCT PATH',
    summary:
      'White-glove intensity for partners who care about specific cards or lenders — process tracking, lender-ready packaging, and priority ops. Approvals remain underwriting’s call; Elite sells packaging discipline and scarce specialist hours, never fake promises.',
    whoFor:
      'Partners targeting named issuers/products (Amex Business, Chase Ink, and similar paths), or who need a dedicated strategist cadence and lender-ready packaging discipline when the file must look institutional before applications.',
    includes: [
      'Everything in Builder — sequencing depth already compounding',
      'Named card / lender product ladder with status tracking only (never a promise)',
      'Dedicated funding strategist cadence — not a ticket queue',
      'Lender-ready packaging: docs, story, banking optics, ownership clarity',
      'Priority ops queue inside Business Credit OS + 12-month OS access',
      'Hard-pull timing discipline when personal guarantees may still apply',
    ],
    effort: '~25–45 specialist hours · DFY white-glove · partner decision speed matters',
    proofPoints: [
      'Named-product ladder is process — never sold as guaranteed approval',
      'Packaging mirrors what underwriters actually request (and reject)',
      'Priority queue keeps scarce specialist hours on your file',
      'Pairs with Named Cards & Products Path one-sheet for issuer clarity',
    ],
    cta: 'If named products are the destination, quote Elite at /pricing/business-credit and download the Named Cards sheet — list target issuers before kickoff.',
    accent: [0.72, 0.58, 0.28],
    priceLine: formatPrice(1299700),
    ...tierCapitalLines('elite'),
    bodyExtra: [
      'Card and lender approvals are never guaranteed — underwriting decides.',
      'Bring target issuer list to kickoff; status board lives in Business Credit OS.',
      'Fundability green lights first — then named-path applications.',
    ],
    compliance: COMPLIANCE,
  },
  {
    id: 'empire',
    title: 'Business Empire',
    eyebrow: 'EXECUTIVE · $24,997 · MULTI-ENTITY / SCALE',
    summary:
      'Executive scarcity for complex, multi-entity, or aggressive capital goals — war-room cadence and custom scope when starter playbooks break. Priced for specialist hours that cannot be productized into a volume package.',
    whoFor:
      'Established or multi-entity operators, aggressive capital paths, or partners who need executive-level specialist scarcity and custom scope beyond standard Elite delivery. Wrong fit if you only need first net-30 trades.',
    includes: [
      'Everything in Elite — named-path packaging + priority ops included',
      'Multi-entity / complex-file operations under one war-room cadence',
      'Weekly executive loop: vendors + bureaus + capital packaging together',
      'Aggressive capital packaging support for scale destinations',
      'Priority named-product and lender path with status discipline',
      'Custom scope band $29,997–$49,997 when true complexity requires',
    ],
    effort: '40–80+ specialist hours · scarcity-priced DFY · executive partner availability required',
    proofPoints: [
      'Priced for scarce specialist hours — not a volume package',
      'Built for multi-entity messiness that breaks starter playbooks',
      'War-room keeps capital packaging and vendor work in one weekly loop',
      'Custom scope exists when complexity exceeds the $24,997 band',
    ],
    cta: 'Empire is invite-level intensity. Start with a work-calibrated quote at /pricing/business-credit and a Funding Strategist review — bring entity maps and capital targets.',
    accent: [0.55, 0.12, 0.22],
    priceLine: formatPrice(2499700),
    ...tierCapitalLines('empire'),
    bodyExtra: [
      'Document-heavy kickoff: entities, banking, ownership, capital targets.',
      'First net-30 trades only? Foundation or Builder is the better fit.',
      'Scorecard + Fundability Roadmap still apply — complexity does not skip gates.',
    ],
    compliance: COMPLIANCE,
  },
  {
    id: 'compare',
    title: 'Four-Tier Comparison',
    eyebrow: 'SIDE-BY-SIDE · MATURITY × DESTINATION × CAPITAL',
    summary:
      'One grid to choose: Foundation, Builder, Elite, and Empire — program fee, est. outlay, potential BC capital, delivery mode, hours, and destination fit. Built to share with co-founders so everyone picks from the same map.',
    whoFor:
      'Partners and advisors choosing a tier after the Fundability Roadmap and Tier Ladder, or reviewing options beside the work-calibrated quote — especially when decision-makers disagree on intensity.',
    includes: businessCreditPackages.map(
      (p) => `${p.name} — ${formatPrice(p.priceAmount)} — ${p.tagline}`,
    ),
    effort: 'Use with the quote tool at /pricing/business-credit · 2-minute decision aid',
    proofPoints: [
      'Same four stickers as pricing — no hidden fifth “mystery” tier',
      'Maturity uplift called out: 3+ year files often need more research hours',
      'Named products naturally point toward Elite / Empire intensity',
      'Shareable with co-founders so the room decides from one grid',
    ],
    cta: 'Circle one tier, then run the work-calibrated quote — or download that tier’s Partner One-Sheet for includes and homework expectations.',
    accent: [0.2, 0.35, 0.65],
    bodyExtra: [
      'Read Fundability Roadmap first — readiness is not the same as sticker tier.',
      'Established (3+ years) often adds uplift — aged files take more research.',
      'Named products bump toward Elite / Empire; Foundation is hybrid, Builder+ is DFY.',
    ],
    compliance: COMPLIANCE,
  },
  {
    id: 'named_cards',
    title: 'Named Cards & Products Path',
    eyebrow: 'PROCESS TRACKER · NEVER A GUARANTEE',
    summary:
      'How Finely Cred tracks the specific cards or lenders you asked for — ladder steps, document checklist, and status in Business Credit OS — without promising approvals. Process transparency is the product; underwriting is the gate.',
    whoFor:
      'Partners who already know which issuers or products they want pursued, and want operational tracking plus packaging support instead of vague “we will try” promises. Best paired with Elite or Empire specialist cadence.',
    includes: [
      'Capture target issuers/products (e.g. Amex Business, Chase Ink, capital products)',
      'Custom ladder steps + document checklist per target before any hard pull',
      'Status board in Business Credit OS (applied / pending / parked / blocked)',
      'Included in Elite & Empire; add-on path discussion on Foundation / Builder',
      'Underwriting reality checks — green lights from Fundability Roadmap first',
      'Partner-facing status language you can share with co-founders and advisors',
    ],
    effort: 'Operational tracking + packaging support — underwriting decides outcomes',
    proofPoints: [
      'Approvals are never promised — process transparency is the product',
      'Stops silent “we applied somewhere” chaos with a visible status board',
      'Document checklist reduces stalled applications and missing-doc loops',
      'Pairs with Elite / Empire specialist cadence for highest intensity',
    ],
    cta: 'List target issuers, download Elite or Empire next, then quote at /pricing/business-credit — freeze/alert timing matters if personal guarantees apply.',
    accent: [0.65, 0.2, 0.55],
    bodyExtra: [
      'Named products sit inside Business Credit packaging (Elite / Empire) — still not guaranteed.',
      'Personal guarantees may still expose the personal credit file — plan freeze/alert timing.',
      'Do not chase issuers while entity or reporting pillars are red on the scorecard.',
    ],
    compliance: COMPLIANCE,
  },
];

export function listBusinessCreditOneSheets(): BusinessCreditOneSheetSpec[] {
  return SHEETS;
}

export function getBusinessCreditOneSheet(id: BusinessCreditOneSheetId): BusinessCreditOneSheetSpec {
  return SHEETS.find((s) => s.id === id) ?? SHEETS[0]!;
}

type Fonts = { regular: PDFFont; bold: PDFFont };

function pdfSafe(s: string): string {
  return String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/[·•]/g, ' | ')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/…/g, '...')
    .replace(/©/g, '(c)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\s+\|\s+/g, ' | ')
    .replace(/\s{2,}/g, ' ');
}

function wrapLines(
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  text: string,
  size: number,
  maxWidth: number,
): string[] {
  const words = pdfSafe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let row = '';
  for (const w of words) {
    const test = row ? `${row} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth) {
      if (row) lines.push(row);
      row = w;
    } else {
      row = test;
    }
  }
  if (row) lines.push(row);
  return lines;
}

function drawWrapped(
  page: PDFPage,
  font: PDFFont,
  text: string,
  opts: { x: number; y: number; size: number; maxW: number; color: RGB; lineGap?: number; maxLines?: number },
): number {
  const gap = opts.lineGap ?? opts.size + 2.5;
  const lines = wrapLines(font, text, opts.size, opts.maxW);
  const use = opts.maxLines ? lines.slice(0, opts.maxLines) : lines;
  let y = opts.y;
  for (const line of use) {
    page.drawText(line, { x: opts.x, y, size: opts.size, font, color: opts.color });
    y -= gap;
  }
  return y;
}

function drawFooter(page: PDFPage, fonts: Fonts, bg: RGB, fg: RGB = rgb(0.72, 0.72, 0.75)) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: FOOTER_H, color: bg });
  page.drawText(
    pdfSafe('finelycred.com/resources/business-credit-one-sheets  ·  Partner materials  ·  Book a session'),
    { x: 28, y: 18, size: 7, font: fonts.regular, color: fg },
  );
  page.drawText('FINELY CRED', {
    x: 500,
    y: 18,
    size: 7,
    font: fonts.bold,
    color: rgb(0.85, 0.7, 0.35),
  });
}

function drawComplianceStrip(
  page: PDFPage,
  fonts: Fonts,
  y: number,
  text: string,
  color: RGB = rgb(0.35, 0.35, 0.38),
): number {
  return drawWrapped(page, fonts.regular, text, {
    x: 28,
    y,
    size: 7,
    maxW: 556,
    color,
    lineGap: 9,
  });
}

/** Prominent triple metric: program fee · vendor outlay · potential capital. Returns y below the box. */
function drawTripleCapitalMetric(
  page: PDFPage,
  fonts: Fonts,
  opts: {
    x: number;
    y: number;
    w: number;
    programFee: string;
    outlay: string;
    potential: string;
    bg: RGB;
    border: RGB;
    labelColor: RGB;
    valueColor: RGB;
    potentialValueColor?: RGB;
  },
): number {
  const h = 56;
  const boxY = opts.y - h;
  const colW = opts.w / 3;
  page.drawRectangle({
    x: opts.x,
    y: boxY,
    width: opts.w,
    height: h,
    color: opts.bg,
    borderColor: opts.border,
    borderWidth: 1.5,
  });
  const cols: Array<{ label: string; value: string; color: RGB }> = [
    { label: 'PROGRAM FEE', value: opts.programFee, color: opts.valueColor },
    { label: 'EST. VENDOR OUTLAY', value: opts.outlay, color: opts.valueColor },
    {
      label: 'POTENTIAL CAPITAL',
      value: opts.potential,
      color: opts.potentialValueColor ?? opts.valueColor,
    },
  ];
  cols.forEach((c, i) => {
    const cx = opts.x + i * colW;
    if (i > 0) {
      page.drawRectangle({
        x: cx,
        y: boxY + 8,
        width: 0.7,
        height: h - 16,
        color: opts.border,
      });
    }
    page.drawText(c.label, {
      x: cx + 8,
      y: boxY + h - 14,
      size: 6.5,
      font: fonts.bold,
      color: opts.labelColor,
    });
    const valueSize = c.value.length > 12 ? 11 : 13;
    page.drawText(pdfSafe(c.value), {
      x: cx + 8,
      y: boxY + 14,
      size: valueSize,
      font: fonts.bold,
      color: c.color,
    });
  });
  return boxY - 8;
}

// ─── Tier meta for overview / compare ───────────────────────────────────────

const CAPITAL_TIERS = listBusinessCreditCapitalTiers();

const TIER_CARDS = [
  {
    key: 'F',
    name: 'Foundation',
    programFee: CAPITAL_TIERS[0]!.programFeeLabel,
    outlay: CAPITAL_TIERS[0]!.vendorOutlayLabel,
    potential: CAPITAL_TIERS[0]!.potentialLabel,
    dest: 'Vendor-ready',
    mode: 'Hybrid',
    hours: '8-16 hrs',
    note: 'Entity truth + first reportables',
  },
  {
    key: 'B',
    name: 'Builder',
    programFee: CAPITAL_TIERS[1]!.programFeeLabel,
    outlay: CAPITAL_TIERS[1]!.vendorOutlayLabel,
    potential: CAPITAL_TIERS[1]!.potentialLabel,
    dest: 'Fundability depth',
    mode: 'DFY',
    hours: '15-30 hrs',
    note: 'Tier 1-4 sequencing + monitoring',
  },
  {
    key: 'E',
    name: 'Elite',
    programFee: CAPITAL_TIERS[2]!.programFeeLabel,
    outlay: CAPITAL_TIERS[2]!.vendorOutlayLabel,
    potential: CAPITAL_TIERS[2]!.potentialLabel,
    dest: 'Named products',
    mode: 'White-glove',
    hours: '25-45 hrs',
    note: 'Lender packaging + status ladder',
  },
  {
    key: 'X',
    name: 'Empire',
    programFee: CAPITAL_TIERS[3]!.programFeeLabel,
    outlay: CAPITAL_TIERS[3]!.vendorOutlayLabel,
    potential: CAPITAL_TIERS[3]!.potentialLabel,
    dest: 'Multi-entity scale',
    mode: 'Executive',
    hours: '40-80+ hrs',
    note: 'War-room + custom capital path',
  },
] as const;

// ─── Layout: fundability_roadmap — Pillars + stage gates (NOT a price grid) ─

function layoutFundabilityRoadmap(page: PDFPage, fonts: Fonts, spec: BusinessCreditOneSheetSpec) {
  const ink = rgb(0.08, 0.12, 0.14);
  const white = rgb(1, 1, 1);
  const deep = rgb(0.06, 0.22, 0.26);
  const teal = rgb(0.1, 0.48, 0.52);
  const mint = rgb(0.9, 0.96, 0.95);
  const soft = rgb(0.94, 0.97, 0.97);
  const rose = rgb(0.62, 0.22, 0.28);
  const green = rgb(0.12, 0.48, 0.38);
  const gold = rgb(0.78, 0.55, 0.18);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: soft });
  page.drawRectangle({ x: 0, y: 708, width: PAGE_W, height: 84, color: deep });
  page.drawRectangle({ x: 0, y: 704, width: PAGE_W, height: 4, color: teal });

  page.drawText(pdfSafe(spec.eyebrow), { x: 24, y: 768, size: 7.5, font: fonts.bold, color: gold });
  page.drawText(pdfSafe(spec.title), { x: 24, y: 742, size: 18, font: fonts.bold, color: white });
  page.drawText(pdfSafe('Fundability is a file state — not a program fee. Pillars, gates, blockers, scorecard.'), {
    x: 24,
    y: 720,
    size: 8.5,
    font: fonts.regular,
    color: rgb(0.78, 0.88, 0.9),
  });

  let y = 690;
  y = drawWrapped(page, fonts.regular, spec.summary, {
    x: 24,
    y,
    size: 8,
    maxW: 564,
    color: ink,
    lineGap: 10.5,
    maxLines: 2,
  });
  y -= 8;

  page.drawText('SIX PILLARS OF FUNDABILITY', { x: 24, y, size: 8, font: fonts.bold, color: teal });
  y -= 10;

  const pillars: { t: string; d: string }[] = [
    { t: 'Entity truth', d: 'EIN, SOS, address, phone, domain match' },
    { t: 'Commercial ID', d: 'D-U-N-S / bureau profiles findable' },
    { t: 'Reporting vendors', d: 'Net-30 trades that actually report' },
    { t: 'Payment optics', d: 'On-time cadence that builds Paydex' },
    { t: 'Docs / packaging', d: 'Vault ready before capital chase' },
    { t: 'Scorecard ready', d: 'OS weights green before named apps' },
  ];
  const pW = 90;
  const pH = 52;
  pillars.forEach((p, i) => {
    const x = 24 + i * (pW + 4);
    page.drawRectangle({
      x,
      y: y - pH,
      width: pW,
      height: pH,
      color: white,
      borderColor: teal,
      borderWidth: 1,
    });
    page.drawRectangle({ x, y: y - 14, width: pW, height: 14, color: i < 3 ? teal : deep });
    page.drawText(pdfSafe(p.t), {
      x: x + 4,
      y: y - 10,
      size: 6.5,
      font: fonts.bold,
      color: white,
    });
    drawWrapped(page, fonts.regular, p.d, {
      x: x + 4,
      y: y - 24,
      size: 6.5,
      maxW: pW - 8,
      color: ink,
      lineGap: 8,
      maxLines: 3,
    });
  });
  y -= pH + 10;

  page.drawText('STAGE GATES — WHAT "FUNDABLE" LOOKS LIKE', {
    x: 24,
    y,
    size: 8,
    font: fonts.bold,
    color: teal,
  });
  y -= 8;

  const gates: { w: string; gate: string; meaning: string }[] = [
    { w: 'W1-2', gate: 'Identity lock', meaning: 'Entity + SOS + contact signals match; docs staged; no apps yet' },
    { w: 'W3-4', gate: 'Visible file', meaning: 'Commercial profiles live; Tier-1 reporting vendors sequenced open' },
    { w: 'W5-8', gate: 'Reportables', meaning: 'Trades posting; payment optics clean; scorecard vendors rising' },
    { w: 'W9-12', gate: 'Depth', meaning: 'Tier 2-3 momentum; packaging draft; bureau checks in motion' },
    { w: 'W12+', gate: 'Capital optics', meaning: 'Scorecard band up; only then named products / capital packaging' },
  ];
  const gH = 28;
  gates.forEach((g, i) => {
    const gy = y - gH;
    page.drawRectangle({
      x: 24,
      y: gy,
      width: 564,
      height: gH - 2,
      color: i % 2 === 0 ? mint : white,
      borderColor: rgb(0.75, 0.86, 0.86),
      borderWidth: 0.6,
    });
    page.drawRectangle({ x: 24, y: gy, width: 48, height: gH - 2, color: deep });
    page.drawText(g.w, { x: 30, y: gy + 9, size: 7.5, font: fonts.bold, color: white });
    page.drawText(pdfSafe(g.gate), { x: 80, y: gy + 14, size: 8, font: fonts.bold, color: teal });
    page.drawText(pdfSafe(g.meaning), { x: 80, y: gy + 3, size: 7, font: fonts.regular, color: ink });
    y = gy;
  });
  y -= 8;

  // Blockers vs green lights
  const colW = 274;
  const colH = 118;
  page.drawRectangle({
    x: 24,
    y: y - colH,
    width: colW,
    height: colH,
    color: rgb(0.98, 0.93, 0.93),
    borderColor: rose,
    borderWidth: 1.2,
  });
  page.drawRectangle({
    x: 314,
    y: y - colH,
    width: colW,
    height: colH,
    color: mint,
    borderColor: green,
    borderWidth: 1.2,
  });
  page.drawText('COMMON BLOCKERS', { x: 34, y: y - 12, size: 7.5, font: fonts.bold, color: rose });
  page.drawText('GREEN LIGHTS', { x: 324, y: y - 12, size: 7.5, font: fonts.bold, color: green });

  const blockers = [
    'EIN / address / phone / domain mismatches',
    'SOS inactive or ownership unclear',
    'Non-reporting vanity trades',
    'Leapfrog to named cards on thin file',
    'Missing docs when underwriting asks',
  ];
  const greens = [
    'Identity match across SOS + bureaus',
    'Reporting Tier-1 trades posting on time',
    'Payment optics clean for 2+ cycles',
    'Packaging vault ready before capital',
    'Scorecard band rising week over week',
  ];
  let by = y - 26;
  for (const b of blockers) {
    by = drawWrapped(page, fonts.regular, `- ${b}`, {
      x: 34,
      y: by,
      size: 7,
      maxW: colW - 20,
      color: ink,
      lineGap: 9,
      maxLines: 1,
    });
    by -= 1;
  }
  let gy2 = y - 26;
  for (const g of greens) {
    gy2 = drawWrapped(page, fonts.regular, `- ${g}`, {
      x: 324,
      y: gy2,
      size: 7,
      maxW: colW - 20,
      color: ink,
      lineGap: 9,
      maxLines: 1,
    });
    gy2 -= 1;
  }
  y -= colH + 8;

  page.drawText('BUSINESS CREDIT OS SCORECARD -> ROADMAP', {
    x: 24,
    y,
    size: 7.5,
    font: fonts.bold,
    color: teal,
  });
  y -= 8;
  page.drawRectangle({
    x: 24,
    y: y - 48,
    width: 564,
    height: 52,
    color: white,
    borderColor: deep,
    borderWidth: 1,
  });
  const scoreMap = [
    { w: '25%', label: 'Entity & identity', map: 'Pillars 1-2' },
    { w: '30%', label: 'Vendor reporting', map: 'Pillars 3-4' },
    { w: '25%', label: 'Bureau scores', map: 'Optics + depth' },
    { w: '20%', label: 'Capital package', map: 'Pillars 5-6' },
  ];
  scoreMap.forEach((s, i) => {
    const x = 34 + i * 140;
    page.drawText(s.w, { x, y: y - 14, size: 11, font: fonts.bold, color: teal });
    page.drawText(pdfSafe(s.label), { x, y: y - 28, size: 7.5, font: fonts.bold, color: ink });
    page.drawText(pdfSafe(s.map), { x, y: y - 40, size: 7, font: fonts.regular, color: rgb(0.35, 0.4, 0.42) });
  });
  y -= 58;

  page.drawRectangle({ x: 24, y: y - 46, width: 564, height: 50, color: deep });
  page.drawText('NEXT STEP', { x: 34, y: y - 12, size: 7, font: fonts.bold, color: gold });
  drawWrapped(page, fonts.regular, spec.cta, {
    x: 34,
    y: y - 26,
    size: 7.5,
    maxW: 544,
    color: white,
    lineGap: 9.5,
    maxLines: 2,
  });

  drawComplianceStrip(
    page,
    fonts,
    52,
    'Results vary · not guaranteed · business credit only · funding subject to underwriting · not legal advice. Named-card and lender outcomes are never guaranteed.',
    rgb(0.35, 0.42, 0.44),
  );
  drawFooter(page, fonts, deep, rgb(0.7, 0.82, 0.84));
}

// ─── Layout: overview — Tier Ladder & Capital Outlook ───────────────────────

function layoutOverview(page: PDFPage, fonts: Fonts, spec: BusinessCreditOneSheetSpec) {
  const ink = rgb(0.1, 0.1, 0.12);
  const white = rgb(1, 1, 1);
  const slate = rgb(0.18, 0.22, 0.28);
  const warm = rgb(0.72, 0.45, 0.12);
  const cream = rgb(0.97, 0.95, 0.9);
  const cardBg = rgb(0.98, 0.97, 0.94);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: cream });
  page.drawRectangle({ x: 0, y: 700, width: PAGE_W, height: 92, color: slate });
  page.drawRectangle({ x: 0, y: 694, width: PAGE_W, height: 6, color: warm });

  page.drawText(pdfSafe(spec.eyebrow), { x: 28, y: 762, size: 8, font: fonts.bold, color: rgb(0.9, 0.78, 0.45) });
  page.drawText(pdfSafe(spec.title), { x: 28, y: 732, size: 18, font: fonts.bold, color: white });
  page.drawText(pdfSafe('Program fee · vendor outlay · potential BC capital — pick intensity with eyes open.'), {
    x: 28,
    y: 712,
    size: 8.5,
    font: fonts.regular,
    color: rgb(0.85, 0.85, 0.88),
  });

  let y = drawWrapped(page, fonts.regular, spec.whoFor, {
    x: 28,
    y: 678,
    size: 9,
    maxW: 556,
    color: ink,
    lineGap: 11.5,
  });
  y -= 8;

  // Ladder label
  page.drawText('FOUR-TIER CAPITAL OUTLOOK LADDER', {
    x: 28,
    y,
    size: 8,
    font: fonts.bold,
    color: warm,
  });
  y -= 12;

  const cardW = 130;
  const cardH = 198;
  const gap = 10;
  const startX = 28;
  const cardY = y - cardH;

  TIER_CARDS.forEach((t, i) => {
    const x = startX + i * (cardW + gap);
    const isTop = i === 3;
    const muted = isTop ? rgb(0.78, 0.78, 0.8) : rgb(0.45, 0.42, 0.38);
    const strong = isTop ? rgb(1, 0.9, 0.55) : warm;
    page.drawRectangle({
      x,
      y: cardY,
      width: cardW,
      height: cardH,
      color: isTop ? slate : cardBg,
      borderColor: isTop ? warm : rgb(0.82, 0.78, 0.7),
      borderWidth: 1.2,
    });
    page.drawRectangle({
      x,
      y: cardY + cardH - 24,
      width: cardW,
      height: 24,
      color: isTop ? warm : rgb(0.9, 0.86, 0.78),
    });
    page.drawText(`STEP ${i + 1}`, {
      x: x + 8,
      y: cardY + cardH - 16,
      size: 7.5,
      font: fonts.bold,
      color: isTop ? white : slate,
    });
    page.drawText(t.name, {
      x: x + 8,
      y: cardY + cardH - 42,
      size: 11,
      font: fonts.bold,
      color: isTop ? white : ink,
    });
    page.drawText('Program', {
      x: x + 8,
      y: cardY + cardH - 56,
      size: 6.5,
      font: fonts.bold,
      color: muted,
    });
    page.drawText(t.programFee, {
      x: x + 8,
      y: cardY + cardH - 70,
      size: 11,
      font: fonts.bold,
      color: strong,
    });
    page.drawText('Vendor outlay', {
      x: x + 8,
      y: cardY + cardH - 86,
      size: 6.5,
      font: fonts.bold,
      color: muted,
    });
    page.drawText(pdfSafe(t.outlay), {
      x: x + 8,
      y: cardY + cardH - 100,
      size: 9,
      font: fonts.bold,
      color: isTop ? rgb(0.92, 0.9, 0.85) : ink,
    });
    page.drawText('Potential BC', {
      x: x + 8,
      y: cardY + cardH - 116,
      size: 6.5,
      font: fonts.bold,
      color: muted,
    });
    page.drawText(pdfSafe(t.potential), {
      x: x + 8,
      y: cardY + cardH - 130,
      size: 10,
      font: fonts.bold,
      color: strong,
    });
    page.drawText(t.dest, {
      x: x + 8,
      y: cardY + cardH - 148,
      size: 7.5,
      font: fonts.bold,
      color: isTop ? rgb(0.9, 0.88, 0.8) : rgb(0.3, 0.35, 0.4),
    });
    page.drawText(`${t.mode} · ${t.hours}`, {
      x: x + 8,
      y: cardY + cardH - 162,
      size: 7,
      font: fonts.regular,
      color: isTop ? rgb(0.8, 0.8, 0.82) : rgb(0.4, 0.4, 0.42),
    });
    drawWrapped(page, fonts.regular, t.note, {
      x: x + 8,
      y: cardY + cardH - 176,
      size: 7,
      maxW: cardW - 16,
      color: isTop ? rgb(0.82, 0.82, 0.85) : rgb(0.28, 0.28, 0.3),
      lineGap: 9,
      maxLines: 2,
    });
  });

  y = cardY - 12;
  page.drawText('HOW TO READ THIS LADDER', { x: 28, y, size: 8, font: fonts.bold, color: warm });
  y -= 11;
  y = drawWrapped(page, fonts.regular, spec.summary, {
    x: 28,
    y,
    size: 8.5,
    maxW: 556,
    color: ink,
    lineGap: 11,
    maxLines: 3,
  });
  y -= 8;

  // Two insight columns (compact)
  const colW = 268;
  page.drawRectangle({ x: 28, y: y - 88, width: colW, height: 92, color: white, borderColor: rgb(0.85, 0.82, 0.75), borderWidth: 1 });
  page.drawRectangle({ x: 316, y: y - 88, width: colW, height: 92, color: white, borderColor: rgb(0.85, 0.82, 0.75), borderWidth: 1 });
  page.drawText('OUTLOOK NOTES (NOT GUARANTEES)', { x: 38, y: y - 12, size: 7, font: fonts.bold, color: warm });
  page.drawText('PAIR WITH FUNDABILITY ROADMAP', { x: 326, y: y - 12, size: 7, font: fonts.bold, color: warm });

  let ly = y - 26;
  for (const p of spec.proofPoints.slice(0, 3)) {
    ly = drawWrapped(page, fonts.regular, `- ${p}`, {
      x: 38,
      y: ly,
      size: 7,
      maxW: colW - 20,
      color: ink,
      lineGap: 9,
      maxLines: 2,
    });
    ly -= 1;
  }
  ly = y - 26;
  const osItems = [
    'Roadmap = pillars + stage gates (readiness)',
    'This ladder = fee · outlay · potential capital',
    'Then download your tier sheet + quote',
  ];
  for (const item of osItems) {
    ly = drawWrapped(page, fonts.regular, `- ${item}`, {
      x: 326,
      y: ly,
      size: 7,
      maxW: colW - 20,
      color: ink,
      lineGap: 9,
      maxLines: 2,
    });
    ly -= 1;
  }

  y = y - 100;
  page.drawRectangle({ x: 28, y: y - 44, width: 556, height: 48, color: slate });
  page.drawText('NEXT STEP', { x: 38, y: y - 12, size: 7, font: fonts.bold, color: rgb(0.9, 0.78, 0.45) });
  drawWrapped(page, fonts.regular, spec.cta, {
    x: 38,
    y: y - 26,
    size: 8,
    maxW: 536,
    color: white,
    lineGap: 10,
    maxLines: 2,
  });

  drawComplianceStrip(page, fonts, 52, spec.compliance ?? COMPLIANCE, rgb(0.4, 0.38, 0.35));
  drawFooter(page, fonts, slate);
}

// ─── Layout: foundation — Calm teal CHECKLIST ───────────────────────────────

function layoutFoundation(page: PDFPage, fonts: Fonts, spec: BusinessCreditOneSheetSpec) {
  const teal = rgb(0.1, 0.42, 0.38);
  const tealDeep = rgb(0.06, 0.28, 0.26);
  const mist = rgb(0.93, 0.96, 0.95);
  const ink = rgb(0.12, 0.16, 0.16);
  const white = rgb(1, 1, 1);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: mist });
  page.drawRectangle({ x: 0, y: 720, width: PAGE_W, height: 72, color: teal });
  page.drawText(pdfSafe(spec.eyebrow), { x: 32, y: 760, size: 8, font: fonts.bold, color: rgb(0.75, 0.92, 0.88) });
  page.drawText(pdfSafe(spec.title), { x: 32, y: 736, size: 22, font: fonts.bold, color: white });
  if (spec.priceLine) {
    page.drawText(pdfSafe(spec.priceLine), { x: 420, y: 736, size: 18, font: fonts.bold, color: rgb(0.85, 0.95, 0.9) });
  }

  let y = 708;
  if (spec.capitalProgramFeeLine && spec.capitalOutlayLine && spec.capitalPotentialLine) {
    y = drawTripleCapitalMetric(page, fonts, {
      x: 32,
      y,
      w: 548,
      programFee: spec.capitalProgramFeeLine,
      outlay: spec.capitalOutlayLine,
      potential: spec.capitalPotentialLine,
      bg: white,
      border: teal,
      labelColor: tealDeep,
      valueColor: ink,
      potentialValueColor: teal,
    });
  }

  page.drawText('WHO THIS IS FOR', { x: 32, y, size: 8, font: fonts.bold, color: teal });
  y -= 12;
  y = drawWrapped(page, fonts.regular, spec.whoFor, {
    x: 32,
    y,
    size: 8.5,
    maxW: 548,
    color: ink,
    lineGap: 11,
    maxLines: 3,
  });
  y -= 6;
  page.drawText('WHY FOUNDATION MATTERS', { x: 32, y, size: 8, font: fonts.bold, color: teal });
  y -= 11;
  y = drawWrapped(page, fonts.regular, spec.summary, {
    x: 32,
    y,
    size: 8.5,
    maxW: 548,
    color: ink,
    lineGap: 11,
    maxLines: 3,
  });
  y -= 8;

  page.drawText('PARTNER CHECKLIST — SIX STEPS', { x: 32, y, size: 9, font: fonts.bold, color: tealDeep });
  y -= 12;

  const steps = spec.includes.slice(0, 6);
  const stepH = 42;
  steps.forEach((step, i) => {
    const boxY = y - stepH;
    page.drawRectangle({
      x: 32,
      y: boxY,
      width: 548,
      height: stepH - 4,
      color: white,
      borderColor: rgb(0.7, 0.82, 0.8),
      borderWidth: 1,
    });
    page.drawRectangle({ x: 32, y: boxY, width: 40, height: stepH - 4, color: i % 2 === 0 ? teal : tealDeep });
    page.drawText(String(i + 1), {
      x: 44,
      y: boxY + 12,
      size: 14,
      font: fonts.bold,
      color: white,
    });
    drawWrapped(page, fonts.regular, step, {
      x: 84,
      y: boxY + 24,
      size: 8.5,
      maxW: 480,
      color: ink,
      lineGap: 10.5,
      maxLines: 2,
    });
    y = boxY;
  });

  y -= 8;
  // Homework box
  page.drawRectangle({
    x: 32,
    y: y - 72,
    width: 548,
    height: 76,
    color: rgb(0.88, 0.94, 0.92),
    borderColor: teal,
    borderWidth: 1.5,
  });
  page.drawText('PARTNER HOMEWORK BOX', { x: 44, y: y - 14, size: 7.5, font: fonts.bold, color: tealDeep });
  page.drawText(pdfSafe(spec.effort), { x: 44, y: y - 28, size: 7.5, font: fonts.bold, color: ink });
  let hy = y - 40;
  for (const note of (spec.bodyExtra ?? []).slice(0, 3)) {
    hy = drawWrapped(page, fonts.regular, `- ${note}`, {
      x: 44,
      y: hy,
      size: 7,
      maxW: 524,
      color: ink,
      lineGap: 9,
      maxLines: 1,
    });
  }

  y = y - 84;
  page.drawText('NEXT STEP', { x: 32, y, size: 8, font: fonts.bold, color: teal });
  y -= 11;
  drawWrapped(page, fonts.regular, spec.cta, {
    x: 32,
    y,
    size: 8,
    maxW: 548,
    color: ink,
    lineGap: 10.5,
    maxLines: 2,
  });
  drawComplianceStrip(page, fonts, 52, spec.compliance ?? COMPLIANCE, rgb(0.35, 0.45, 0.42));
  drawFooter(page, fonts, tealDeep, rgb(0.75, 0.88, 0.85));
}

// ─── Layout: builder — Two-column sales sheet ───────────────────────────────

function layoutBuilder(page: PDFPage, fonts: Fonts, spec: BusinessCreditOneSheetSpec) {
  const amber = rgb(0.85, 0.55, 0.15);
  const amberDeep = rgb(0.55, 0.32, 0.05);
  const ink = rgb(0.1, 0.1, 0.12);
  const white = rgb(1, 1, 1);
  const soft = rgb(0.99, 0.97, 0.93);
  const leftBg = rgb(0.16, 0.14, 0.12);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: soft });

  // MOST POPULAR flag
  page.drawRectangle({ x: 0, y: 748, width: PAGE_W, height: 44, color: amber });
  page.drawText('MOST POPULAR', { x: 28, y: 764, size: 11, font: fonts.bold, color: white });
  page.drawText(pdfSafe(spec.eyebrow), { x: 160, y: 764, size: 8, font: fonts.bold, color: rgb(0.25, 0.15, 0.05) });

  page.drawText(pdfSafe(spec.title), { x: 28, y: 718, size: 22, font: fonts.bold, color: ink });
  if (spec.priceLine) {
    page.drawText(pdfSafe(spec.priceLine), { x: 28, y: 696, size: 18, font: fonts.bold, color: amberDeep });
  }
  page.drawText(pdfSafe(spec.effort), { x: 200, y: 700, size: 7.5, font: fonts.regular, color: rgb(0.4, 0.35, 0.3) });

  let y = 682;
  if (spec.capitalProgramFeeLine && spec.capitalOutlayLine && spec.capitalPotentialLine) {
    y = drawTripleCapitalMetric(page, fonts, {
      x: 28,
      y,
      w: 556,
      programFee: spec.capitalProgramFeeLine,
      outlay: spec.capitalOutlayLine,
      potential: spec.capitalPotentialLine,
      bg: white,
      border: amber,
      labelColor: amberDeep,
      valueColor: ink,
      potentialValueColor: amberDeep,
    });
  }

  y = drawWrapped(page, fonts.regular, spec.whoFor, {
    x: 28,
    y,
    size: 8.5,
    maxW: 556,
    color: ink,
    lineGap: 11,
    maxLines: 3,
  });
  y -= 6;
  y = drawWrapped(page, fonts.regular, spec.summary, {
    x: 28,
    y,
    size: 8.5,
    maxW: 556,
    color: rgb(0.25, 0.22, 0.18),
    lineGap: 11,
    maxLines: 3,
  });
  y -= 10;

  const colTop = y;
  const colH = 268;
  const colW = 268;

  // Includes column
  page.drawRectangle({ x: 28, y: colTop - colH, width: colW, height: colH, color: leftBg });
  page.drawText('INCLUDES', { x: 42, y: colTop - 22, size: 11, font: fonts.bold, color: amber });
  let iy = colTop - 42;
  for (const item of spec.includes) {
    iy = drawWrapped(page, fonts.regular, `- ${item}`, {
      x: 42,
      y: iy,
      size: 8.5,
      maxW: colW - 28,
      color: rgb(0.92, 0.9, 0.86),
      lineGap: 11,
      maxLines: 3,
    });
    iy -= 6;
    if (iy < colTop - colH + 20) break;
  }

  // Proof column
  page.drawRectangle({
    x: 316,
    y: colTop - colH,
    width: colW,
    height: colH,
    color: white,
    borderColor: amber,
    borderWidth: 2,
  });
  page.drawRectangle({ x: 316, y: colTop - 36, width: colW, height: 36, color: amber });
  page.drawText('PROOF (NOT GUARANTEES)', {
    x: 330,
    y: colTop - 22,
    size: 10,
    font: fonts.bold,
    color: white,
  });
  let py = colTop - 54;
  for (const p of spec.proofPoints) {
    page.drawRectangle({ x: 330, y: py - 2, width: 6, height: 6, color: amber });
    py = drawWrapped(page, fonts.regular, p, {
      x: 344,
      y: py,
      size: 8.5,
      maxW: colW - 40,
      color: ink,
      lineGap: 11,
      maxLines: 3,
    });
    py -= 10;
    if (py < colTop - colH + 20) break;
  }

  y = colTop - colH - 14;
  page.drawRectangle({ x: 28, y: y - 58, width: 556, height: 62, color: amberDeep });
  page.drawText('NEXT STEP', { x: 40, y: y - 16, size: 8, font: fonts.bold, color: amber });
  drawWrapped(page, fonts.regular, spec.cta, {
    x: 40,
    y: y - 32,
    size: 8.5,
    maxW: 532,
    color: white,
    lineGap: 11,
    maxLines: 2,
  });

  drawComplianceStrip(page, fonts, 52, spec.compliance ?? COMPLIANCE, rgb(0.45, 0.38, 0.28));
  drawFooter(page, fonts, rgb(0.12, 0.1, 0.08));
}

// ─── Layout: elite — Dark luxury ────────────────────────────────────────────

function layoutElite(page: PDFPage, fonts: Fonts, spec: BusinessCreditOneSheetSpec) {
  const black = rgb(0.06, 0.05, 0.04);
  const gold = rgb(0.78, 0.62, 0.28);
  const goldSoft = rgb(0.9, 0.8, 0.55);
  const ivory = rgb(0.93, 0.9, 0.84);
  const muted = rgb(0.65, 0.62, 0.56);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: black });
  // Full-bleed luxury header
  page.drawRectangle({ x: 0, y: 668, width: PAGE_W, height: 124, color: rgb(0.1, 0.09, 0.08) });
  page.drawRectangle({ x: 40, y: 760, width: 80, height: 1, color: gold });
  page.drawText(pdfSafe(spec.eyebrow), { x: 40, y: 742, size: 8, font: fonts.bold, color: gold });
  page.drawText(pdfSafe(spec.title), { x: 40, y: 712, size: 26, font: fonts.bold, color: ivory });
  if (spec.priceLine) {
    page.drawText(pdfSafe(spec.priceLine), { x: 40, y: 686, size: 18, font: fonts.bold, color: goldSoft });
  }
  page.drawText(pdfSafe(spec.effort), { x: 200, y: 688, size: 7.5, font: fonts.regular, color: muted });

  let y = 652;
  if (spec.capitalProgramFeeLine && spec.capitalOutlayLine && spec.capitalPotentialLine) {
    y = drawTripleCapitalMetric(page, fonts, {
      x: 40,
      y,
      w: 532,
      programFee: spec.capitalProgramFeeLine,
      outlay: spec.capitalOutlayLine,
      potential: spec.capitalPotentialLine,
      bg: rgb(0.12, 0.1, 0.09),
      border: gold,
      labelColor: muted,
      valueColor: ivory,
      potentialValueColor: goldSoft,
    });
  }

  page.drawText('FOR PARTNERS WHO', { x: 40, y, size: 7.5, font: fonts.bold, color: gold });
  y -= 12;
  y = drawWrapped(page, fonts.regular, spec.whoFor, {
    x: 40,
    y,
    size: 8.5,
    maxW: 532,
    color: ivory,
    lineGap: 11,
    maxLines: 3,
  });
  y -= 10;
  page.drawRectangle({ x: 40, y: y + 4, width: 40, height: 0.6, color: gold });
  y -= 10;
  page.drawText('THE BRIEF', { x: 40, y, size: 7.5, font: fonts.bold, color: gold });
  y -= 12;
  y = drawWrapped(page, fonts.regular, spec.summary, {
    x: 40,
    y,
    size: 8.5,
    maxW: 532,
    color: muted,
    lineGap: 11,
    maxLines: 3,
  });
  y -= 12;

  page.drawText('INCLUDED', { x: 40, y, size: 7.5, font: fonts.bold, color: gold });
  y -= 4;
  page.drawRectangle({ x: 40, y: y, width: 532, height: 0.5, color: rgb(0.3, 0.26, 0.18) });
  y -= 14;

  for (const item of spec.includes.slice(0, 6)) {
    page.drawText('-', { x: 40, y, size: 9, font: fonts.regular, color: gold });
    y = drawWrapped(page, fonts.regular, item, {
      x: 58,
      y,
      size: 8,
      maxW: 514,
      color: ivory,
      lineGap: 10.5,
      maxLines: 2,
    });
    y -= 4;
  }

  y -= 4;
  page.drawRectangle({ x: 40, y: y, width: 532, height: 0.5, color: rgb(0.3, 0.26, 0.18) });
  y -= 10;
  page.drawText('DISCIPLINE SIGNALS', { x: 40, y, size: 7.5, font: fonts.bold, color: gold });
  y -= 11;
  for (const p of spec.proofPoints.slice(0, 3)) {
    y = drawWrapped(page, fonts.regular, p, {
      x: 40,
      y,
      size: 7.5,
      maxW: 532,
      color: muted,
      lineGap: 10,
      maxLines: 2,
    });
    y -= 3;
  }

  y -= 10;
  page.drawText('NEXT', { x: 40, y, size: 7.5, font: fonts.bold, color: gold });
  y -= 12;
  y = drawWrapped(page, fonts.regular, spec.cta, {
    x: 40,
    y,
    size: 8.5,
    maxW: 532,
    color: ivory,
    lineGap: 11,
  });

  drawComplianceStrip(page, fonts, 52, spec.compliance ?? COMPLIANCE, rgb(0.45, 0.4, 0.32));
  drawFooter(page, fonts, rgb(0.04, 0.03, 0.02), rgb(0.55, 0.5, 0.4));
}

// ─── Layout: empire — Asymmetric editorial magazine ─────────────────────────

function layoutEmpire(page: PDFPage, fonts: Fonts, spec: BusinessCreditOneSheetSpec) {
  const wine = rgb(0.42, 0.08, 0.16);
  const ink = rgb(0.08, 0.08, 0.1);
  const paper = rgb(0.96, 0.94, 0.9);
  const rail = rgb(0.12, 0.1, 0.12);
  const white = rgb(1, 1, 1);
  const accent = rgb(0.7, 0.2, 0.28);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: paper });

  // Side rail
  page.drawRectangle({ x: 0, y: 0, width: 118, height: PAGE_H, color: rail });
  page.drawRectangle({ x: 118, y: 0, width: 6, height: PAGE_H, color: wine });

  // Vertical rail labels
  page.drawText('EMPIRE', {
    x: 28,
    y: 720,
    size: 10,
    font: fonts.bold,
    color: rgb(0.85, 0.55, 0.45),
  });
  page.drawText('EXEC', { x: 28, y: 700, size: 9, font: fonts.bold, color: white });
  page.drawText('SCALE', { x: 28, y: 684, size: 9, font: fonts.bold, color: white });
  if (spec.priceLine) {
    page.drawText(pdfSafe(spec.priceLine), {
      x: 22,
      y: 620,
      size: 11,
      font: fonts.bold,
      color: rgb(0.95, 0.75, 0.55),
    });
  }
  page.drawText('40-80+', { x: 28, y: 560, size: 14, font: fonts.bold, color: white });
  page.drawText('SPECIALIST', { x: 22, y: 544, size: 7, font: fonts.bold, color: rgb(0.7, 0.65, 0.6) });
  page.drawText('HOURS', { x: 28, y: 532, size: 7, font: fonts.bold, color: rgb(0.7, 0.65, 0.6) });

  const railNotes = ['Multi-entity', 'War-room', 'Custom scope', 'Capital path'];
  let ry = 400;
  for (const n of railNotes) {
    page.drawRectangle({ x: 18, y: ry, width: 82, height: 22, color: wine });
    page.drawText(n, { x: 24, y: ry + 7, size: 7.5, font: fonts.bold, color: white });
    ry -= 32;
  }

  page.drawText('FINELY', { x: 26, y: 80, size: 8, font: fonts.bold, color: rgb(0.6, 0.55, 0.5) });
  page.drawText('CRED', { x: 32, y: 66, size: 8, font: fonts.bold, color: rgb(0.6, 0.55, 0.5) });

  // Oversized title in main column
  const mx = 140;
  page.drawText(pdfSafe(spec.eyebrow), { x: mx, y: 750, size: 7.5, font: fonts.bold, color: accent });
  const titleLines = wrapLines(fonts.bold, spec.title, 36, 430);
  let ty = 710;
  for (const line of titleLines.slice(0, 2)) {
    page.drawText(line, { x: mx, y: ty, size: 34, font: fonts.bold, color: ink });
    ty -= 40;
  }

  page.drawRectangle({ x: mx, y: ty + 20, width: 60, height: 3, color: wine });
  ty -= 8;

  ty = drawWrapped(page, fonts.regular, spec.whoFor, {
    x: mx,
    y: ty,
    size: 8.5,
    maxW: 440,
    color: ink,
    lineGap: 11,
    maxLines: 3,
  });
  ty -= 8;

  if (spec.capitalProgramFeeLine && spec.capitalOutlayLine && spec.capitalPotentialLine) {
    ty = drawTripleCapitalMetric(page, fonts, {
      x: mx,
      y: ty,
      w: 440,
      programFee: spec.capitalProgramFeeLine,
      outlay: spec.capitalOutlayLine,
      potential: spec.capitalPotentialLine,
      bg: white,
      border: wine,
      labelColor: accent,
      valueColor: ink,
      potentialValueColor: wine,
    });
  }

  // Editorial pull quote box
  page.drawRectangle({ x: mx, y: ty - 56, width: 440, height: 60, color: rgb(0.92, 0.88, 0.84) });
  page.drawRectangle({ x: mx, y: ty - 56, width: 5, height: 60, color: wine });
  drawWrapped(page, fonts.regular, `"${spec.summary}"`, {
    x: mx + 16,
    y: ty - 14,
    size: 8,
    maxW: 408,
    color: rgb(0.25, 0.18, 0.18),
    lineGap: 10.5,
    maxLines: 3,
  });
  ty -= 68;

  page.drawText('WHAT EMPIRE INCLUDES', { x: mx, y: ty, size: 8, font: fonts.bold, color: accent });
  ty -= 14;
  for (const item of spec.includes) {
    page.drawText('/', { x: mx, y: ty, size: 10, font: fonts.bold, color: wine });
    ty = drawWrapped(page, fonts.regular, item, {
      x: mx + 14,
      y: ty,
      size: 8.5,
      maxW: 426,
      color: ink,
      lineGap: 11,
      maxLines: 2,
    });
    ty -= 5;
  }

  ty -= 8;
  page.drawText('WHY SCARCITY PRICING', { x: mx, y: ty, size: 8, font: fonts.bold, color: accent });
  ty -= 12;
  for (const p of spec.proofPoints.slice(0, 3)) {
    ty = drawWrapped(page, fonts.regular, `- ${p}`, {
      x: mx,
      y: ty,
      size: 8,
      maxW: 440,
      color: rgb(0.3, 0.25, 0.25),
      lineGap: 10.5,
      maxLines: 2,
    });
    ty -= 3;
  }

  ty -= 8;
  page.drawRectangle({ x: mx, y: ty - 48, width: 440, height: 52, color: wine });
  page.drawText('NEXT STEP', { x: mx + 12, y: ty - 14, size: 7.5, font: fonts.bold, color: rgb(0.95, 0.75, 0.55) });
  drawWrapped(page, fonts.regular, spec.cta, {
    x: mx + 12,
    y: ty - 28,
    size: 8,
    maxW: 416,
    color: white,
    lineGap: 10.5,
    maxLines: 2,
  });

  drawComplianceStrip(page, fonts, 52, spec.compliance ?? COMPLIANCE, rgb(0.45, 0.35, 0.35));
  // Footer only on main area
  page.drawRectangle({ x: 124, y: 0, width: PAGE_W - 124, height: FOOTER_H, color: rgb(0.1, 0.08, 0.08) });
  page.drawText(
    pdfSafe('finelycred.com/resources/business-credit-one-sheets  ·  Partner materials'),
    { x: 140, y: 18, size: 7, font: fonts.regular, color: rgb(0.7, 0.65, 0.6) },
  );
}

// ─── Layout: compare — True comparison GRID ─────────────────────────────────

function layoutCompare(page: PDFPage, fonts: Fonts, spec: BusinessCreditOneSheetSpec) {
  const navy = rgb(0.15, 0.25, 0.45);
  const navyDeep = rgb(0.1, 0.16, 0.3);
  const ink = rgb(0.1, 0.12, 0.16);
  const white = rgb(1, 1, 1);
  const gridBg = rgb(0.96, 0.97, 0.98);
  const alt = rgb(0.92, 0.94, 0.97);
  const accent = rgb(0.25, 0.42, 0.72);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: gridBg });
  page.drawRectangle({ x: 0, y: 730, width: PAGE_W, height: 62, color: navy });
  page.drawText(pdfSafe(spec.eyebrow), { x: 24, y: 766, size: 7.5, font: fonts.bold, color: rgb(0.7, 0.8, 0.95) });
  page.drawText(pdfSafe(spec.title), { x: 24, y: 744, size: 20, font: fonts.bold, color: white });

  let y = drawWrapped(page, fonts.regular, spec.whoFor, {
    x: 24,
    y: 712,
    size: 8.5,
    maxW: 564,
    color: ink,
    lineGap: 11,
  });
  y -= 10;

  // Grid header + 4 columns
  const labelW = 96;
  const colW = 112;
  const rows: { label: string; values: string[] }[] = [
    { label: 'Program fee', values: TIER_CARDS.map((t) => t.programFee) },
    { label: 'Est. outlay', values: TIER_CARDS.map((t) => t.outlay) },
    { label: 'Potential BC', values: TIER_CARDS.map((t) => t.potential) },
    { label: 'Delivery', values: TIER_CARDS.map((t) => t.mode) },
    { label: 'Hours', values: TIER_CARDS.map((t) => t.hours) },
    { label: 'Destination', values: TIER_CARDS.map((t) => t.dest) },
    { label: 'Best when', values: [
      'Thin clean file',
      'Need DFY depth',
      'Named issuers',
      'Multi-entity / scale',
    ] },
    { label: 'Named path', values: ['Add-on talk', 'Add-on talk', 'Included', 'Priority included'] },
    { label: 'OS focus', values: [
      'Entity + Tier-1',
      'Vendors + optics',
      'Packaging + ladder',
      'War-room capital',
    ] },
  ];

  // Column headers
  page.drawRectangle({ x: 24, y: y - 28, width: labelW + colW * 4, height: 28, color: navyDeep });
  page.drawText('FACTOR', { x: 30, y: y - 18, size: 7.5, font: fonts.bold, color: rgb(0.7, 0.78, 0.9) });
  TIER_CARDS.forEach((t, i) => {
    page.drawText(t.name.toUpperCase(), {
      x: 24 + labelW + i * colW + 8,
      y: y - 18,
      size: 8,
      font: fonts.bold,
      color: white,
    });
  });
  y -= 28;

  const rowH = 28;
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? white : alt;
    page.drawRectangle({ x: 24, y: y - rowH, width: labelW + colW * 4, height: rowH, color: bg });
    page.drawRectangle({ x: 24, y: y - rowH, width: labelW, height: rowH, color: rgb(0.88, 0.9, 0.94) });
    page.drawText(row.label, { x: 30, y: y - 18, size: 7.5, font: fonts.bold, color: navy });
    row.values.forEach((v, i) => {
      drawWrapped(page, fonts.regular, v, {
        x: 24 + labelW + i * colW + 6,
        y: y - 12,
        size: 7,
        maxW: colW - 12,
        color: ink,
        lineGap: 8.5,
        maxLines: 2,
      });
    });
    // Grid lines
    page.drawRectangle({
      x: 24,
      y: y - rowH,
      width: labelW + colW * 4,
      height: 0.4,
      color: rgb(0.75, 0.78, 0.85),
    });
    y -= rowH;
  });

  // Vertical separators
  for (let i = 0; i <= 4; i++) {
    const x = 24 + labelW + i * colW;
    page.drawRectangle({ x, y: y, width: 0.4, height: 28 + rows.length * rowH, color: rgb(0.78, 0.8, 0.86) });
  }

  y -= 10;
  page.drawText('DECISION NOTES', { x: 24, y, size: 7.5, font: fonts.bold, color: accent });
  y -= 10;
  for (const note of (spec.bodyExtra ?? []).concat(spec.proofPoints.slice(0, 2))) {
    y = drawWrapped(page, fonts.regular, `- ${note}`, {
      x: 24,
      y,
      size: 7.5,
      maxW: 564,
      color: ink,
      lineGap: 9.5,
      maxLines: 1,
    });
    y -= 1;
  }

  y -= 6;
  page.drawRectangle({ x: 24, y: y - 46, width: 564, height: 50, color: navy });
  page.drawText('NEXT STEP', { x: 34, y: y - 12, size: 7.5, font: fonts.bold, color: rgb(0.75, 0.85, 1) });
  drawWrapped(page, fonts.regular, spec.cta, {
    x: 34,
    y: y - 26,
    size: 7.5,
    maxW: 544,
    color: white,
    lineGap: 10,
    maxLines: 2,
  });

  drawComplianceStrip(page, fonts, 52, spec.compliance ?? COMPLIANCE, rgb(0.4, 0.42, 0.5));
  drawFooter(page, fonts, navyDeep);
}

// ─── Layout: named_cards — Issuer TILES + warning ───────────────────────────

function layoutNamedCards(page: PDFPage, fonts: Fonts, spec: BusinessCreditOneSheetSpec) {
  const plum = rgb(0.42, 0.12, 0.38);
  const plumDeep = rgb(0.22, 0.06, 0.2);
  const ink = rgb(0.12, 0.1, 0.14);
  const white = rgb(1, 1, 1);
  const soft = rgb(0.97, 0.94, 0.97);
  const rose = rgb(0.72, 0.18, 0.28);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: soft });
  page.drawRectangle({ x: 0, y: 720, width: PAGE_W, height: 72, color: plum });
  page.drawText(pdfSafe(spec.eyebrow), { x: 28, y: 760, size: 8, font: fonts.bold, color: rgb(0.95, 0.75, 0.9) });
  page.drawText(pdfSafe(spec.title), { x: 28, y: 734, size: 20, font: fonts.bold, color: white });

  // Strong warning panel
  page.drawRectangle({
    x: 28,
    y: 628,
    width: 556,
    height: 78,
    color: rgb(0.98, 0.92, 0.92),
    borderColor: rose,
    borderWidth: 2.5,
  });
  page.drawRectangle({ x: 28, y: 682, width: 556, height: 24, color: rose });
  page.drawText('NEVER GUARANTEED — UNDERWRITING DECIDES', {
    x: 40,
    y: 690,
    size: 9,
    font: fonts.bold,
    color: white,
  });
  drawWrapped(
    page,
    fonts.regular,
    'Named products sit inside Business Credit packaging (Elite / Empire intensity) — still not guaranteed. This sheet tracks process only. Clear Fundability Roadmap green lights before hard pulls. Personal guarantees may still touch the personal credit file. Results vary · not guaranteed · business credit only · funding subject to underwriting · outlay varies by vendors.',
    {
      x: 40,
      y: 668,
      size: 7.5,
      maxW: 532,
      color: rgb(0.35, 0.15, 0.18),
      lineGap: 10,
      maxLines: 4,
    },
  );

  let y = 612;
  page.drawText('WHO THIS PATH IS FOR', { x: 28, y, size: 8, font: fonts.bold, color: plum });
  y -= 12;
  y = drawWrapped(page, fonts.regular, spec.whoFor, {
    x: 28,
    y,
    size: 8.5,
    maxW: 556,
    color: ink,
    lineGap: 11,
  });
  y -= 12;

  page.drawText('ISSUER / PRODUCT TILES (EXAMPLES — NOT APPROVALS)', {
    x: 28,
    y,
    size: 8,
    font: fonts.bold,
    color: plum,
  });
  y -= 14;

  const tiles = [
    { name: 'Amex Business', note: 'Ladder + docs + status board' },
    { name: 'Chase Ink path', note: 'Process tracking only' },
    { name: 'Capital products', note: 'Packaging before pulls' },
    { name: 'Your targets', note: 'Captured at kickoff' },
  ];
  const tileW = 130;
  const tileH = 72;
  tiles.forEach((t, i) => {
    const x = 28 + i * (tileW + 10);
    page.drawRectangle({
      x,
      y: y - tileH,
      width: tileW,
      height: tileH,
      color: white,
      borderColor: plum,
      borderWidth: 1.5,
    });
    page.drawRectangle({ x, y: y - 22, width: tileW, height: 22, color: plumDeep });
    page.drawText(t.name, { x: x + 8, y: y - 15, size: 8, font: fonts.bold, color: white });
    drawWrapped(page, fonts.regular, t.note, {
      x: x + 8,
      y: y - 36,
      size: 7.5,
      maxW: tileW - 16,
      color: ink,
      lineGap: 9.5,
      maxLines: 3,
    });
  });
  y -= tileH + 16;

  page.drawText('WHAT YOU GET', { x: 28, y, size: 8, font: fonts.bold, color: plum });
  y -= 12;
  for (const item of spec.includes) {
    page.drawRectangle({ x: 28, y: y - 1, width: 5, height: 5, color: plum });
    y = drawWrapped(page, fonts.regular, item, {
      x: 40,
      y,
      size: 8.5,
      maxW: 544,
      color: ink,
      lineGap: 11,
      maxLines: 2,
    });
    y -= 5;
  }

  y -= 6;
  page.drawText('WHY THIS SHEET IS WORTH DOWNLOADING', { x: 28, y, size: 8, font: fonts.bold, color: plum });
  y -= 12;
  for (const p of spec.proofPoints.slice(0, 3)) {
    y = drawWrapped(page, fonts.regular, `- ${p}`, {
      x: 28,
      y,
      size: 8,
      maxW: 556,
      color: ink,
      lineGap: 10.5,
      maxLines: 2,
    });
    y -= 2;
  }

  y -= 8;
  page.drawRectangle({ x: 28, y: y - 52, width: 556, height: 56, color: plumDeep });
  page.drawText('NEXT STEP', { x: 40, y: y - 14, size: 7.5, font: fonts.bold, color: rgb(0.95, 0.75, 0.9) });
  drawWrapped(page, fonts.regular, spec.cta, {
    x: 40,
    y: y - 30,
    size: 8,
    maxW: 532,
    color: white,
    lineGap: 10.5,
    maxLines: 2,
  });

  drawComplianceStrip(page, fonts, 52, spec.compliance ?? COMPLIANCE, rgb(0.45, 0.3, 0.4));
  drawFooter(page, fonts, plumDeep, rgb(0.85, 0.7, 0.8));
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function buildBusinessCreditOneSheetPdf(sheetId: BusinessCreditOneSheetId): Promise<Uint8Array> {
  const spec = getBusinessCreditOneSheet(sheetId);
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  switch (spec.id) {
    case 'fundability_roadmap':
      layoutFundabilityRoadmap(page, fonts, spec);
      break;
    case 'overview':
      layoutOverview(page, fonts, spec);
      break;
    case 'foundation':
      layoutFoundation(page, fonts, spec);
      break;
    case 'builder':
      layoutBuilder(page, fonts, spec);
      break;
    case 'elite':
      layoutElite(page, fonts, spec);
      break;
    case 'empire':
      layoutEmpire(page, fonts, spec);
      break;
    case 'compare':
      layoutCompare(page, fonts, spec);
      break;
    case 'named_cards':
      layoutNamedCards(page, fonts, spec);
      break;
    default:
      layoutFundabilityRoadmap(page, fonts, spec);
  }

  return doc.save();
}

export async function downloadBusinessCreditOneSheet(sheetId: BusinessCreditOneSheetId) {
  const bytes = await buildBusinessCreditOneSheetPdf(sheetId);
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finely-cred-bc-${sheetId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
