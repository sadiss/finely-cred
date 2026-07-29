/**
 * Premium Business Credit one-sheet PDFs — cinematic color bands per tier.
 */
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { businessCreditPackages, formatPrice } from '../config/pricingCatalog';

export type BusinessCreditOneSheetId =
  | 'overview'
  | 'foundation'
  | 'builder'
  | 'elite'
  | 'empire'
  | 'compare'
  | 'named_cards';

type SheetSpec = {
  id: BusinessCreditOneSheetId;
  title: string;
  eyebrow: string;
  accent: [number, number, number];
  body: string[];
  priceLine?: string;
};

const SHEETS: SheetSpec[] = [
  {
    id: 'overview',
    title: 'Business Credit — Fundability Journey',
    eyebrow: 'FINELY CRED · PARTNER ONE-SHEET',
    accent: [0.72, 0.45, 0.12],
    body: [
      'Four work-calibrated tiers: Foundation → Builder → Elite → Empire.',
      'Price follows maturity (startup vs 3+ years), destination, and named products — not a race-to-the-bottom sticker.',
      'Business Credit OS: destination cockpit, vendor sequencing, bureau depth, capital packaging.',
      'Results vary · funding subject to underwriting · not legal advice.',
    ],
  },
  {
    id: 'foundation',
    title: 'Business Foundation',
    eyebrow: 'HYBRID · ENTITY → FIRST REPORTABLES',
    accent: [0.15, 0.55, 0.45],
    priceLine: formatPrice(299700),
    body: [
      'Entity / EIN / address / domain hygiene.',
      'D-U-N-S & commercial bureau alignment.',
      'Starter net-30 vendors that report.',
      'Fundability scorecard in portal.',
      'Best for startups & clean new files · ~8–16 specialist hours.',
    ],
  },
  {
    id: 'builder',
    title: 'Business Builder',
    eyebrow: 'MOST POPULAR · DFY SEQUENCING',
    accent: [0.85, 0.55, 0.15],
    priceLine: formatPrice(599700),
    body: [
      'Full Tier 1–4 vendor sequencing with specialist cycles.',
      'Trade depth + monitoring cadence.',
      'Funding readiness assessment & doc checklist.',
      'Established-file cleanup guidance when the file is messy.',
      '~15–30 specialist hours · results vary.',
    ],
  },
  {
    id: 'elite',
    title: 'Business Elite',
    eyebrow: 'WHITE-GLOVE · NAMED PRODUCT PATH',
    accent: [0.45, 0.25, 0.75],
    priceLine: formatPrice(1299700),
    body: [
      'Everything in Builder + dedicated strategist cadence.',
      'Named card / lender ladder (process tracking — not guaranteed approval).',
      'Lender-ready packaging support.',
      'Priority ops queue · 12-month OS access.',
      '~25–45 specialist hours · funding subject to underwriting.',
    ],
  },
  {
    id: 'empire',
    title: 'Business Empire',
    eyebrow: 'EXECUTIVE · MULTI-ENTITY / AGGRESSIVE GOALS',
    accent: [0.55, 0.12, 0.22],
    priceLine: formatPrice(2499700),
    body: [
      'Highest-intensity DFY for complex or multi-entity operators.',
      'Weekly war-room cadence · custom capital packaging.',
      'Priority named-product & lender path.',
      'Custom scope $29,997–$49,997 when complexity demands it.',
      '40–80+ specialist hours · scarcity priced.',
    ],
  },
  {
    id: 'compare',
    title: 'Compare four tiers',
    eyebrow: 'MATURITY × DESTINATION × PRICE',
    accent: [0.2, 0.35, 0.65],
    body: [
      ...businessCreditPackages.map(
        (p) => `${p.name} — ${formatPrice(p.priceAmount)} — ${p.tagline}`,
      ),
      'Established (3+ years) often adds uplift — aged files take more research.',
      'Ask for the work-calibrated quote on /pricing/business-credit.',
    ],
  },
  {
    id: 'named_cards',
    title: 'Named cards & products path',
    eyebrow: 'PROCESS TRACKER · NOT A GUARANTEE',
    accent: [0.65, 0.2, 0.55],
    body: [
      'Tell us the issuers/products you want tracked (e.g. Amex Business, Chase Ink).',
      'We build a ladder, document checklist, and status board in Business Credit OS.',
      'Included in Elite / Empire; add-on available on lower tiers.',
      'Approvals are never promised — underwriting decides.',
      'Results vary · funding subject to underwriting · not legal advice.',
    ],
  },
];

export function listBusinessCreditOneSheets(): SheetSpec[] {
  return SHEETS;
}

export async function buildBusinessCreditOneSheetPdf(sheetId: BusinessCreditOneSheetId): Promise<Uint8Array> {
  const spec = SHEETS.find((s) => s.id === sheetId) ?? SHEETS[0];
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const [r, g, b] = spec.accent;

  page.drawRectangle({ x: 0, y: 640, width: 612, height: 152, color: rgb(r, g, b) });
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 48, color: rgb(0.06, 0.06, 0.08) });

  page.drawText(spec.eyebrow, {
    x: 40,
    y: 750,
    size: 9,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(spec.title, {
    x: 40,
    y: 710,
    size: 22,
    font: fontBold,
    color: rgb(1, 1, 1),
    maxWidth: 520,
  });
  if (spec.priceLine) {
    page.drawText(spec.priceLine, {
      x: 40,
      y: 670,
      size: 28,
      font: fontBold,
      color: rgb(1, 0.92, 0.7),
    });
  }

  let y = 600;
  for (const line of spec.body) {
    const words = line.split(' ');
    let row = '';
    for (const w of words) {
      const test = row ? `${row} ${w}` : w;
      if (font.widthOfTextAtSize(test, 11) > 520) {
        page.drawText(`• ${row}`, { x: 40, y, size: 11, font, color: rgb(0.15, 0.15, 0.18), maxWidth: 520 });
        y -= 18;
        row = w;
      } else row = test;
    }
    if (row) {
      page.drawText(`• ${row}`, { x: 40, y, size: 11, font, color: rgb(0.15, 0.15, 0.18), maxWidth: 520 });
      y -= 22;
    }
    if (y < 80) break;
  }

  page.drawText('finelycred.com/pricing/business-credit  ·  Partner materials', {
    x: 40,
    y: 20,
    size: 8,
    font,
    color: rgb(0.75, 0.75, 0.78),
  });

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
