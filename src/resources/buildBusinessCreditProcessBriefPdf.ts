/**
 * Business Credit 3-Sheet Process Brief — three-page partner PDF (never labelled a one-sheet):
 * 1) The process (cream)  2) Finely Cred approach + work (slate)  3) Business Credit OS (dark)
 */
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';

const W = 612;
const H = 792;
const M = 30;
const FOOTER_H = 36;
const COMPLY_Y = FOOTER_H + 14;

const NAVY = rgb(0.09, 0.12, 0.18);
const GOLD = rgb(0.78, 0.55, 0.18);
const CREAM = rgb(0.97, 0.95, 0.91);
const CREAM_DEEP = rgb(0.94, 0.91, 0.86);
const INK = rgb(0.12, 0.12, 0.14);
const MUTED = rgb(0.35, 0.36, 0.38);
const WHITE = rgb(1, 1, 1);
const TEAL = rgb(0.12, 0.45, 0.42);
const ROSE = rgb(0.55, 0.22, 0.28);
const SLATE = rgb(0.16, 0.2, 0.26);
const SLATE_MID = rgb(0.22, 0.26, 0.32);
const SLATE_SOFT = rgb(0.93, 0.94, 0.96);
const OS_PANEL = rgb(0.12, 0.15, 0.22);
const OS_BORDER = rgb(0.28, 0.32, 0.4);
const OS_MUTED = rgb(0.72, 0.74, 0.8);

const COMPLIANCE =
  'Results vary · not guaranteed · business credit only · funding subject to underwriting · not legal advice. Named-card and lender outcomes are never guaranteed.';

function pdfSafe(s: string): string {
  return String(s ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/•/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/…/g, '...')
    .replace(/©/g, '(c)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
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

function drawFooter(page: PDFPage, font: PDFFont, bold: PDFFont, pageNum: number, total: number) {
  page.drawRectangle({ x: 0, y: 0, width: W, height: FOOTER_H, color: NAVY });
  page.drawRectangle({ x: 0, y: FOOTER_H - 2, width: W, height: 2, color: GOLD });
  page.drawText(pdfSafe('finelycred.com/resources/business-credit-one-sheets  ·  Partner materials'), {
    x: M,
    y: 13,
    size: 7,
    font,
    color: rgb(0.7, 0.71, 0.75),
  });
  page.drawText(pdfSafe('FINELY CRED'), {
    x: W - M - 68,
    y: 13,
    size: 7.5,
    font: bold,
    color: GOLD,
  });
  page.drawText(pdfSafe(`${pageNum} / ${total}`), {
    x: W / 2 - 10,
    y: 13,
    size: 7,
    font,
    color: rgb(0.62, 0.64, 0.68),
  });
}

function drawCompliance(page: PDFPage, font: PDFFont, color: RGB = MUTED) {
  let cy = COMPLY_Y + 8;
  for (const line of wrap(font, COMPLIANCE, 6.5, W - M * 2)) {
    page.drawText(line, { x: M, y: cy, size: 6.5, font, color });
    cy -= 8.5;
  }
}

type Ctx = { page: PDFPage; font: PDFFont; bold: PDFFont };

/** Page 1 — cream process map */
function drawProcessPage(ctx: Ctx) {
  const { page, font, bold } = ctx;

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });
  page.drawRectangle({ x: 0, y: FOOTER_H, width: 8, height: H - FOOTER_H, color: CREAM_DEEP });

  // Hero
  page.drawRectangle({ x: 0, y: H - 108, width: W, height: 108, color: NAVY });
  page.drawRectangle({ x: 0, y: H - 112, width: W, height: 4, color: GOLD });

  page.drawText(pdfSafe('3-SHEET PARTNER BRIEF  ·  START HERE'), {
    x: M,
    y: H - 26,
    size: 8,
    font: bold,
    color: GOLD,
  });
  page.drawText(pdfSafe('How Business Credit Actually Gets Built'), {
    x: M,
    y: H - 52,
    size: 21,
    font: bold,
    color: WHITE,
  });
  page.drawText(
    pdfSafe('Identity truth -> commercial visibility -> reporting trades -> payment optics -> capital packaging.'),
    { x: M, y: H - 72, size: 9, font, color: rgb(0.84, 0.86, 0.9) },
  );
  page.drawText(
    pdfSafe('Skip a layer and underwriting sees noise — not readiness. Process beats product hunting.'),
    { x: M, y: H - 88, size: 8.5, font, color: rgb(0.72, 0.74, 0.8) },
  );
  page.drawText(pdfSafe('Foundation -> Builder -> Elite -> Empire = work intensity, not sticker theater.'), {
    x: M,
    y: H - 102,
    size: 8,
    font: bold,
    color: TEAL,
  });

  // Insight strip
  let y = H - 128;
  page.drawRectangle({
    x: M,
    y: y - 40,
    width: W - M * 2,
    height: 46,
    color: WHITE,
    borderColor: rgb(0.88, 0.86, 0.82),
    borderWidth: 1,
  });
  page.drawRectangle({ x: M, y: y - 40, width: 5, height: 46, color: TEAL });
  page.drawText(pdfSafe('WHY SEQUENCE MATTERS'), {
    x: M + 14,
    y: y - 8,
    size: 7.5,
    font: bold,
    color: TEAL,
  });
  let iy = y - 20;
  for (const line of wrap(
    font,
    'Random vendor stacks and early named-card chases burn inquiries and poison optics. Finely Cred builds a commercial file layer by layer so each application sits on prior truth — denials teach the next move instead of stalling the whole path.',
    8,
    W - M * 2 - 24,
  )) {
    page.drawText(line, { x: M + 14, y: iy, size: 8, font, color: INK });
    iy -= 10;
  }

  y -= 56;
  page.drawText(pdfSafe('THE SIX-LAYER SEQUENCE'), {
    x: M,
    y,
    size: 8,
    font: bold,
    color: GOLD,
  });
  page.drawText(pdfSafe('Each layer unlocks the next — do not leapfrog'), {
    x: M + 148,
    y,
    size: 7.5,
    font,
    color: MUTED,
  });
  y -= 6;

  // Fill from here down to ~COMPLY_Y + 78 with 6 equal cards + bottom strip
  const bottomStripH = 70;
  const bottomY = COMPLY_Y + 22;
  const layersBottom = bottomY + bottomStripH + 6;
  const layersTop = y;
  const layerCount = 6;
  const gap = 4;
  const cardH = Math.floor((layersTop - layersBottom - gap * (layerCount - 1)) / layerCount);

  const layers: { n: string; title: string; body: string; tip: string; accent: RGB }[] = [
    {
      n: '01',
      title: 'Entity truth',
      body: 'Legal name, EIN, SOS status, address, phone, and domain must match what funders and bureaus query. Mismatches die before trades are read. Partner owns the docs; specialists audit hygiene against live commercial systems.',
      tip: 'Match or stall',
      accent: TEAL,
    },
    {
      n: '02',
      title: 'Commercial identity',
      body: 'D-U-N-S / bureau profiles and NAICS so the business is findable in commercial systems — not a personal credit shadow. Visibility before volume: if they cannot find you, they cannot fund you.',
      tip: 'Be findable',
      accent: TEAL,
    },
    {
      n: '03',
      title: 'Reporting vendors',
      body: 'Net-30 and trade accounts that actually report. Sequenced Tier 1 to 4 — not spray-and-pray logo shopping. Approvals without reporting are vanity; reporting trades are the scoreboard.',
      tip: 'Reportables only',
      accent: GOLD,
    },
    {
      n: '04',
      title: 'Payment optics',
      body: 'On-time (or early) rhythm that builds Paydex-style signals and aged trade depth. Missed payments erase months of sequencing. Cashflow discipline is the commercial score.',
      tip: 'Pay on rhythm',
      accent: GOLD,
    },
    {
      n: '05',
      title: 'Fundability packaging',
      body: 'Banking, ownership, use-of-funds, and vault docs ready before chasing revolving or named products. Package first; apply second — underwriting stalls kill momentum.',
      tip: 'Docs before chase',
      accent: ROSE,
    },
    {
      n: '06',
      title: 'Capital path',
      body: 'Work-calibrated tier aimed at business-credit capital bands — approximate, underwriting-gated, never guaranteed. Intensity follows destination: Foundation through Empire.',
      tip: 'Bands, not promises',
      accent: ROSE,
    },
  ];

  for (const layer of layers) {
    const top = y;
    page.drawRectangle({
      x: M,
      y: top - cardH,
      width: W - M * 2,
      height: cardH,
      color: WHITE,
      borderColor: rgb(0.88, 0.86, 0.82),
      borderWidth: 1,
    });
    page.drawRectangle({ x: M, y: top - cardH, width: 5, height: cardH, color: layer.accent });
    page.drawText(pdfSafe(layer.n), {
      x: M + 12,
      y: top - 15,
      size: 12,
      font: bold,
      color: layer.accent,
    });
    page.drawText(pdfSafe(layer.title), {
      x: M + 44,
      y: top - 14,
      size: 10,
      font: bold,
      color: INK,
    });
    page.drawText(pdfSafe(layer.tip), {
      x: W - M - 88,
      y: top - 14,
      size: 7.5,
      font: bold,
      color: layer.accent,
    });
    let by = top - 28;
    for (const line of wrap(font, layer.body, 8, W - M * 2 - 52)) {
      page.drawText(line, { x: M + 44, y: by, size: 8, font, color: MUTED });
      by -= 10.5;
    }
    y -= cardH + gap;
  }

  // Bottom insight pair — sits just above compliance
  const half = (W - M * 2 - 8) / 2;
  const boxes: { t: string; d: string; c: RGB }[] = [
    {
      t: 'COMMON FAILURE',
      d: 'Chasing named cards or heavy revolving before entity match + reporting trades exist. Thin files look risky; wasted pulls look worse. Leapfrogging layers is the most expensive mistake.',
      c: ROSE,
    },
    {
      t: 'PARTNER WIN PATTERN',
      d: 'Freeze entity data consistent, pay every sequenced vendor on rhythm, upload docs to the OS weekly, and let specialists advance the next layer. DFY accelerates — ownership truth still wins.',
      c: TEAL,
    },
  ];
  const stripTop = bottomY + bottomStripH;
  boxes.forEach((b, i) => {
    const x = M + i * (half + 8);
    page.drawRectangle({
      x,
      y: bottomY,
      width: half,
      height: bottomStripH,
      color: CREAM_DEEP,
      borderColor: rgb(0.86, 0.84, 0.8),
      borderWidth: 1,
    });
    page.drawRectangle({ x, y: stripTop - 3, width: half, height: 3, color: b.c });
    page.drawText(pdfSafe(b.t), { x: x + 8, y: stripTop - 14, size: 7.5, font: bold, color: b.c });
    let dy = stripTop - 26;
    for (const line of wrap(font, b.d, 7.5, half - 16)) {
      page.drawText(line, { x: x + 8, y: dy, size: 7.5, font, color: INK });
      dy -= 9.5;
    }
  });

  drawCompliance(page, font);
  drawFooter(page, font, bold, 1, 3);
}

/** Page 2 — slate approach */
function drawApproachPage(ctx: Ctx) {
  const { page, font, bold } = ctx;

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: SLATE_SOFT });
  page.drawRectangle({ x: 0, y: FOOTER_H, width: 10, height: H - FOOTER_H, color: TEAL });

  page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: SLATE });
  page.drawRectangle({ x: 10, y: H - 100, width: W - 10, height: 4, color: GOLD });

  page.drawText(pdfSafe('PAGE 2  ·  APPROACH + EXECUTION'), {
    x: M + 2,
    y: H - 26,
    size: 8,
    font: bold,
    color: GOLD,
  });
  page.drawText(pdfSafe('Our Unique Approach'), {
    x: M + 2,
    y: H - 52,
    size: 22,
    font: bold,
    color: WHITE,
  });
  page.drawText(
    pdfSafe('Work-calibrated specialist hours — hybrid setup through executive war-room cadence. Not DIY PDF stacks.'),
    { x: M + 2, y: H - 72, size: 9, font, color: rgb(0.8, 0.82, 0.86) },
  );
  page.drawText(
    pdfSafe('Partners get a managed build: sequence, evidence, and capital packaging inside one OS.'),
    { x: M + 2, y: H - 88, size: 8.5, font, color: rgb(0.68, 0.7, 0.76) },
  );

  let y = H - 116;

  const doctrines = [
    {
      t: 'Sequence first',
      d: 'Every application sits on a prior layer. Denials become diagnostics — not file poison. We refuse random vendor stacks and early named-product theater.',
    },
    {
      t: 'Hours, not hope',
      d: 'Foundation, Builder, Elite, and Empire price specialist cycles: email hybrid -> DFY sequencing -> priority packaging -> weekly war-room intensity.',
    },
    {
      t: 'Compliance voice',
      d: 'No fake named-card promises. Capital bands are approximate, business-credit-only, and always subject to underwriting and partner homework.',
    },
  ];
  const colW = (W - M * 2 - 10 - 12) / 3;
  const doctrineH = 100;
  doctrines.forEach((d, i) => {
    const x = M + 2 + i * (colW + 6);
    page.drawRectangle({
      x,
      y: y - doctrineH,
      width: colW,
      height: doctrineH,
      color: WHITE,
      borderColor: rgb(0.86, 0.87, 0.9),
      borderWidth: 1,
    });
    page.drawRectangle({ x, y: y - 2, width: colW, height: 3, color: i === 2 ? ROSE : TEAL });
    page.drawText(pdfSafe(d.t.toUpperCase()), {
      x: x + 8,
      y: y - 16,
      size: 8.5,
      font: bold,
      color: i === 2 ? ROSE : TEAL,
    });
    let dy = y - 30;
    for (const line of wrap(font, d.d, 7.8, colW - 16)) {
      page.drawText(line, { x: x + 8, y: dy, size: 7.8, font, color: INK });
      dy -= 10;
    }
  });

  y -= doctrineH + 12;
  page.drawText(pdfSafe('WHAT WE ACTUALLY DO FOR PARTNERS'), {
    x: M + 2,
    y,
    size: 8,
    font: bold,
    color: GOLD,
  });
  page.drawText(pdfSafe('Diagnose  ·  Sequence  ·  Package'), {
    x: M + 210,
    y,
    size: 8,
    font: bold,
    color: TEAL,
  });
  y -= 8;

  const homeworkH = 78;
  const homeworkBottom = COMPLY_Y + 20;
  const workBottom = homeworkBottom + homeworkH + 6;
  const workTop = y;
  const workCount = 3;
  const workGap = 5;
  const workH = Math.floor((workTop - workBottom - workGap * (workCount - 1)) / workCount);

  const work: { phase: string; tag: string; items: string[] }[] = [
    {
      phase: 'Diagnose',
      tag: 'FILE TRUTH',
      items: [
        'Entity / EIN / SOS / address / phone / domain hygiene audit against what funders query',
        'Commercial bureau visibility + gap map (thin vs aged chaos vs ready-to-sequence)',
        'Maturity x destination fit: startup vs established; vendors vs named capital path',
        'Tier recommendation grounded in homework capacity — not sticker envy',
      ],
    },
    {
      phase: 'Sequence',
      tag: 'EXECUTION',
      items: [
        'Tier 1-4 vendor path with reporting logic — approvals that feed Paydex-style optics',
        'Trade monitoring cadence + payment rhythm coaching so optics compound weekly',
        'Document vault readiness before underwriting asks stall momentum',
        'Escalation when a denial signals a layer gap instead of blind re-applying',
      ],
    },
    {
      phase: 'Package',
      tag: 'CAPITAL READY',
      items: [
        'Funding-readiness scorecard inside Business Credit OS — blockers visible every week',
        'Named-product / lender packaging process (Elite+) — never guaranteed outcomes',
        'Specialist touchpoints: email hybrid (Foundation) through weekly war-room (Empire)',
        'Capital outlook framed as approximate bands subject to underwriting',
      ],
    },
  ];

  for (const block of work) {
    page.drawRectangle({
      x: M + 2,
      y: y - workH,
      width: W - M * 2 - 2,
      height: workH,
      color: WHITE,
      borderColor: rgb(0.86, 0.87, 0.9),
      borderWidth: 1,
    });
    page.drawRectangle({ x: M + 2, y: y - workH, width: 84, height: workH, color: SLATE });
    page.drawText(pdfSafe(block.phase.toUpperCase()), {
      x: M + 12,
      y: y - workH / 2 + 6,
      size: 10,
      font: bold,
      color: GOLD,
    });
    page.drawText(pdfSafe(block.tag), {
      x: M + 12,
      y: y - workH / 2 - 10,
      size: 6.5,
      font: bold,
      color: TEAL,
    });
    let iy = y - 12;
    for (const item of block.items) {
      for (const line of wrap(font, `- ${item}`, 7.6, W - M * 2 - 98)) {
        page.drawText(line, { x: M + 96, y: iy, size: 7.6, font, color: INK });
        iy -= 9.8;
      }
    }
    y -= workH + workGap;
  }

  page.drawRectangle({
    x: M + 2,
    y: homeworkBottom,
    width: W - M * 2 - 2,
    height: homeworkH,
    color: SLATE_MID,
  });
  page.drawRectangle({
    x: M + 2,
    y: homeworkBottom + homeworkH - 3,
    width: W - M * 2 - 2,
    height: 3,
    color: GOLD,
  });
  page.drawText(pdfSafe('PARTNER HOMEWORK (YOU STILL MATTER)'), {
    x: M + 12,
    y: homeworkBottom + homeworkH - 14,
    size: 8,
    font: bold,
    color: GOLD,
  });
  const homework = [
    'Provide banking access and docs on request — specialists cannot package what they cannot see.',
    'Pay vendors as sequenced; keep entity name/address/phone/domain frozen-consistent across SOS, bureaus, and apps.',
    'Use Business Credit OS weekly so tasks, vault, and scorecard stay current — DFY accelerates, it does not replace ownership truth.',
  ];
  let hy = homeworkBottom + homeworkH - 28;
  for (const h of homework) {
    for (const line of wrap(font, `- ${h}`, 7.6, W - M * 2 - 22)) {
      page.drawText(line, { x: M + 12, y: hy, size: 7.6, font, color: WHITE });
      hy -= 9.8;
    }
  }

  drawCompliance(page, font, rgb(0.4, 0.42, 0.46));
  drawFooter(page, font, bold, 2, 3);
}

/** Page 3 — dark Business Credit OS */
function drawSoftwarePage(ctx: Ctx) {
  const { page, font, bold } = ctx;

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: NAVY });
  page.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: GOLD });
  page.drawRectangle({ x: 0, y: FOOTER_H, width: 5, height: H - FOOTER_H - 5, color: TEAL });

  page.drawText(pdfSafe('PAGE 3  ·  BUSINESS CREDIT OS'), {
    x: M,
    y: H - 28,
    size: 8,
    font: bold,
    color: GOLD,
  });
  page.drawText(pdfSafe('Powerful. Efficient. Built for execution.'), {
    x: M,
    y: H - 52,
    size: 19,
    font: bold,
    color: WHITE,
  });
  page.drawText(
    pdfSafe('One partner workspace for entity fundability, vendor sequencing, bureau scores, vault evidence, and capital readiness.'),
    { x: M, y: H - 70, size: 8.5, font, color: OS_MUTED },
  );
  page.drawText(
    pdfSafe('Specialists move faster when the file is structured. Partners see blockers early. Packaging starts from evidence — not memory.'),
    { x: M, y: H - 84, size: 8, font, color: rgb(0.58, 0.6, 0.66) },
  );

  // KPI strip
  let y = H - 102;
  const kpis = [
    { k: 'Cockpit', v: 'One view' },
    { k: 'Scorecard', v: 'Weekly' },
    { k: 'Ladder', v: 'Tier 1-4' },
    { k: 'Vault', v: 'Evidence' },
    { k: 'Loops', v: 'Specialist' },
    { k: 'Ask Finely', v: 'In-context' },
  ];
  const kpiW = (W - M * 2 - 5 * 5) / 6;
  const kpiH = 38;
  kpis.forEach((k, i) => {
    const x = M + i * (kpiW + 5);
    page.drawRectangle({
      x,
      y: y - kpiH,
      width: kpiW,
      height: kpiH,
      color: OS_PANEL,
      borderColor: OS_BORDER,
      borderWidth: 1,
    });
    page.drawText(pdfSafe(k.v), { x: x + 5, y: y - 12, size: 8.5, font: bold, color: GOLD });
    page.drawText(pdfSafe(k.k), { x: x + 5, y: y - 26, size: 6.5, font, color: OS_MUTED });
  });

  y -= kpiH + 12;
  page.drawText(pdfSafe('WHAT LIVES IN THE OS'), {
    x: M,
    y,
    size: 8,
    font: bold,
    color: GOLD,
  });
  y -= 6;

  const bottomPanelH = 100;
  const bottomPanelY = COMPLY_Y + 18;
  const gridBottom = bottomPanelY + bottomPanelH + 8;
  const gridTop = y;
  const rows = 3;
  const cols = 2;
  const cellGapX = 8;
  const cellGapY = 6;
  const cellW = (W - M * 2 - cellGapX) / cols;
  const cellH = Math.floor((gridTop - gridBottom - cellGapY * (rows - 1)) / rows);

  const features: { title: string; body: string; bite: string }[] = [
    {
      title: 'Cockpit',
      body: 'Vendors, bureaus, and capital tasks in one command view — stop living in scattered spreadsheets and buried email threads. One glance shows what moves this week.',
      bite: 'Command center',
    },
    {
      title: 'Fundability scorecard',
      body: 'Weekly visibility on ready vs blocking so partners always know the next move — hygiene, trades, docs, and packaging status without guessing.',
      bite: 'Truth meter',
    },
    {
      title: 'Vendor ladder',
      body: 'Tier sequencing with live status: applied, approved, reporting, payment cadence. Reporting logic over logo shopping — every step feeds the commercial file.',
      bite: 'Sequence engine',
    },
    {
      title: 'Document vault',
      body: 'SOS docs, approvals, denials, banking packets, and underwriting asks stay attached to the file — evidence ready when specialists package capital.',
      bite: 'Evidence room',
    },
    {
      title: 'Specialist loops',
      body: 'Tasks and escalations tied to hybrid / DFY / war-room intensity so purchased hours show up as visible progress — not silent tickets.',
      bite: 'Hours -> motion',
    },
    {
      title: 'Ask Finely',
      body: 'In-context help for spacing calendars, hygiene checks, and "what next" without leaving the OS mid-build. Coach answers stay tied to your file state.',
      bite: 'Always-on coach',
    },
  ];

  features.forEach((f, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = M + col * (cellW + cellGapX);
    const top = gridTop - row * (cellH + cellGapY);
    page.drawRectangle({
      x,
      y: top - cellH,
      width: cellW,
      height: cellH,
      color: OS_PANEL,
      borderColor: OS_BORDER,
      borderWidth: 1,
    });
    page.drawRectangle({ x, y: top - 3, width: 34, height: 3, color: GOLD });
    page.drawText(pdfSafe(f.title.toUpperCase()), {
      x: x + 10,
      y: top - 16,
      size: 9,
      font: bold,
      color: GOLD,
    });
    page.drawText(pdfSafe(f.bite), {
      x: x + cellW - 82,
      y: top - 16,
      size: 7,
      font: bold,
      color: TEAL,
    });
    let by = top - 32;
    for (const line of wrap(font, f.body, 7.8, cellW - 20)) {
      page.drawText(line, { x: x + 10, y: by, size: 7.8, font, color: OS_MUTED });
      by -= 10;
    }
  });

  // Why + next steps
  const leftW = (W - M * 2) * 0.46;
  const rightW = W - M * 2 - leftW - 8;

  page.drawRectangle({ x: M, y: bottomPanelY, width: leftW, height: bottomPanelH, color: TEAL });
  page.drawText(pdfSafe('WHY THE SOFTWARE MATTERS'), {
    x: M + 10,
    y: bottomPanelY + bottomPanelH - 14,
    size: 7.5,
    font: bold,
    color: WHITE,
  });
  let ey = bottomPanelY + bottomPanelH - 28;
  for (const line of wrap(
    font,
    'Business credit fails in the gaps between tools. The OS closes those gaps: one scorecard, one ladder, one vault, one specialist loop. That is how Finely Cred turns a maze into a managed build partners can actually finish — with compliance language baked into every capital conversation.',
    7.8,
    leftW - 20,
  )) {
    page.drawText(line, { x: M + 10, y: ey, size: 7.8, font, color: WHITE });
    ey -= 10;
  }

  const rx = M + leftW + 8;
  page.drawRectangle({
    x: rx,
    y: bottomPanelY,
    width: rightW,
    height: bottomPanelH,
    color: OS_PANEL,
    borderColor: GOLD,
    borderWidth: 1.5,
  });
  page.drawText(pdfSafe('NEXT STEPS'), {
    x: rx + 10,
    y: bottomPanelY + bottomPanelH - 14,
    size: 7.5,
    font: bold,
    color: GOLD,
  });
  const steps = [
    '1) Download your tier one-sheet (Foundation / Builder / Elite / Empire).',
    '2) Open /pricing/business-credit for a work-calibrated quote.',
    '3) Book a session or chat with a Funding Strategist.',
    '4) Enter Business Credit OS and run the six-layer sequence.',
  ];
  let sy = bottomPanelY + bottomPanelH - 28;
  for (const s of steps) {
    for (const line of wrap(font, s, 7.5, rightW - 20)) {
      page.drawText(line, { x: rx + 10, y: sy, size: 7.5, font, color: rgb(0.88, 0.9, 0.93) });
      sy -= 10;
    }
  }

  drawCompliance(page, font, rgb(0.5, 0.52, 0.56));
  drawFooter(page, font, bold, 3, 3);
}

export async function buildBusinessCreditProcessBriefPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  drawProcessPage({ page: doc.addPage([W, H]), font, bold });
  drawApproachPage({ page: doc.addPage([W, H]), font, bold });
  drawSoftwarePage({ page: doc.addPage([W, H]), font, bold });

  return doc.save();
}

export async function downloadBusinessCreditProcessBrief() {
  const bytes = await buildBusinessCreditProcessBriefPdf();
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = BUSINESS_CREDIT_PROCESS_BRIEF.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const BUSINESS_CREDIT_PROCESS_BRIEF = {
  id: 'process_brief' as const,
  /** Three pages — never label this a one-sheet. */
  pageCount: 3,
  sheetLabel: '3-sheet',
  title: 'Business Credit 3-Sheet Process Brief',
  downloadLabel: 'Download the 3-sheet Process Brief',
  filename: 'finely-cred-business-credit-3-sheet-process-brief.pdf',
  eyebrow: '3-SHEET PARTNER BRIEF · START HERE',
  summary:
    'How business credit is built (six-layer sequence), Finely Cred work-calibrated approach and what specialists actually do, plus Business Credit OS — the cockpit that makes the build efficient. Pair with the single-page Fundability Roadmap one-sheet for stage gates and scorecard mapping.',
  pages: [
    'Process map — entity truth -> commercial identity -> vendors -> payment optics -> packaging -> capital',
    'Unique approach — sequence first, hours not hope, compliance voice + Diagnose / Sequence / Package work',
    'Business Credit OS — cockpit, scorecard, vendor ladder, vault, specialist loops, Ask Finely',
  ],
};
