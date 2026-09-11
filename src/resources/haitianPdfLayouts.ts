/**
 * Unique Haitian marketing PDFs. Hook first. No checklist machine. No prices.
 */
import type { PDFDocument, PDFPage, RGB } from 'pdf-lib';
import { HAITIAN_PLACE_CARDS } from '../lib/haitianCompanionDesk';
import {
  HAITIAN_COLLECTOR_LETTER as LETTER,
  formatHaitianLetterDate,
} from '../lib/haitianLetterMeaningCopy';
import type { HaitianPieceSection, HaitianPieceSpec } from '../lib/haitianPieceSpec';
import { HT_PIECE_COMPLIANCE_EN, HT_PIECE_COMPLIANCE_HT } from '../lib/haitianPieceSpec';
import {
  CONTENT_W,
  EMERALD,
  FILE_FLOOR,
  H,
  INK,
  IVORY,
  M,
  MUTED,
  NAVY,
  PAPER,
  RIGHT,
  ROSE,
  ROSE_PAPER,
  RULE,
  SKY,
  VIOLET,
  W,
  WHITE,
  drawActionLine,
  drawFooter,
  drawFormRows,
  drawQr,
  drawTable,
  drawWrapped,
  fillPage,
  type HaitianPdfFonts,
  winAnsi,
} from './haitianPdfPrimitives';

const COMPLY = `${HT_PIECE_COMPLIANCE_EN}  ·  ${HT_PIECE_COMPLIANCE_HT}`;

function box(page: PDFPage, x: number, y: number, w: number, h: number, color: RGB, border?: RGB) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color,
    borderColor: border,
    borderWidth: border ? 1.15 : 0,
  });
}

function paintHook(page: PDFPage, fonts: HaitianPdfFonts, y: number, piece: HaitianPieceSpec, color: RGB): number {
  y = drawWrapped(page, fonts.timesBold, piece.hookEn, {
    x: M,
    y,
    size: 13,
    maxW: CONTENT_W,
    color,
    gap: 16,
  });
  return drawWrapped(page, fonts.times, piece.hookHt, {
    x: M,
    y: y - 4,
    size: 10,
    maxW: CONTENT_W,
    color: MUTED,
    gap: 13,
  });
}

function paintSection(
  page: PDFPage,
  fonts: HaitianPdfFonts,
  y: number,
  section: HaitianPieceSection,
  color: RGB,
  family: 'times' | 'sans',
): number {
  const head = family === 'sans' ? fonts.sansBold : fonts.timesBold;
  const body = family === 'sans' ? fonts.sans : fonts.times;
  page.drawText(winAnsi(section.headingEn), { x: M, y: y - 14, size: 13, font: head, color });
  y -= 18;
  page.drawText(winAnsi(section.headingHt), { x: M, y: y - 12, size: 9, font: fonts.times, color: MUTED });
  y -= 8;
  for (const para of section.paragraphsEn) {
    y = drawWrapped(page, body, para, { x: M, y, size: 11, maxW: CONTENT_W, color: INK, gap: 15 });
    y -= 8;
  }
  for (const para of section.paragraphsHt) {
    y = drawWrapped(page, fonts.times, para, { x: M, y, size: 9, maxW: CONTENT_W, color: MUTED, gap: 12 });
    y -= 6;
  }
  if (section.table) y = drawTable(page, fonts, y, section.table, color, family) - 6;
  if (section.form) y = drawFormRows(page, fonts, y, section.form, color);
  return y;
}

async function finishWithQr(
  page: PDFPage,
  doc: PDFDocument,
  fonts: HaitianPdfFonts,
  piece: HaitianPieceSpec,
  y: number,
  color: RGB,
) {
  y = drawActionLine(page, fonts, Math.max(y, 150), piece.actionEn, piece.actionHt, color);
  await drawQr(page, doc, piece.ctaPath, { x: RIGHT - 78, y: 42, size: 72 });
  drawFooter(page, fonts.sans, COMPLY);
}

function paintGlossary(page: PDFPage, fonts: HaitianPdfFonts, piece: HaitianPieceSpec, y: number, color: RGB): number {
  if (!piece.glossary.length || y < 120) return y;
  return drawTable(
    page,
    fonts,
    y,
    {
      columns: ['English on the paper', 'Meaning'],
      rows: piece.glossary.map((row) => [row.en, row.ht]),
    },
    color,
    'sans',
  );
}

function paintAllSections(
  doc: PDFDocument,
  fonts: HaitianPdfFonts,
  page: PDFPage,
  y: number,
  piece: HaitianPieceSpec,
  color: RGB,
  family: 'times' | 'sans',
  floor: RGB,
): { page: PDFPage; y: number } {
  for (const section of piece.sections) {
    if (y < 220) {
      page = doc.addPage([W, H]);
      fillPage(page, floor);
      y = H - 52;
    }
    y = paintSection(page, fonts, y, section, color, family) - 8;
  }
  return { page, y };
}

async function closeArticle(
  doc: PDFDocument,
  fonts: HaitianPdfFonts,
  page: PDFPage,
  y: number,
  piece: HaitianPieceSpec,
  color: RGB,
  family: 'times' | 'sans',
  floor: RGB,
) {
  const rest = paintAllSections(doc, fonts, page, y, piece, color, family, floor);
  await finishWithQr(rest.page, doc, fonts, piece, rest.y, color);
}

export async function drawHaitianPiecePages(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  switch (piece.architecture) {
    case 'bureau-dossier':
      return drawRestoreDossier(doc, fonts, piece);
    case 'collector-letter':
      return drawLetterMeaning(doc, fonts, piece);
    case 'church-handbill':
      return drawChurchFlyer(doc, fonts, piece);
    case 'court-summons':
      return drawCourt(doc, fonts, piece);
    case 'foreclosure-notice':
      return drawForeclosure(doc, fonts, piece);
    case 'repo-notice':
      return drawRepo(doc, fonts, piece);
    case 'validation-docket':
      return drawValidation(doc, fonts, piece);
    case 'dfy-matter-brief':
      return drawDfy(doc, fonts, piece);
    case 'bankruptcy-file':
      return drawBankruptcy(doc, fonts, piece);
    case 'card-use-ledger':
      return drawBuilding(doc, fonts, piece);
    case 'tradeline-stack':
      return drawTradelines(doc, fonts, piece);
    case 'ein-folder':
      return drawBusiness(doc, fonts, piece);
    case 'vendor-ladder':
      return drawLadder(doc, fonts, piece);
    case 'privacy-lock':
      return drawPrivacy(doc, fonts, piece);
    case 'bundle-band':
      return drawBundles(doc, fonts, piece);
    case 'chex-stamp':
      return drawChex(doc, fonts, piece);
    case 'maintenance-calendar':
      return drawMaintenance(doc, fonts, piece);
    case 'diy-starter-card':
      return drawDiy(doc, fonts, piece);
    case 'bureau-file':
      return drawThreeCousins(doc, fonts, piece);
    case 'welcome-one-sheet':
      return drawWelcome(doc, fonts, piece);
    case 'visit-runway':
      return drawVisit(doc, fonts, piece);
    case 'helper-playbook':
      return drawHelper(doc, fonts, piece);
    case 'appointment-card':
      return drawAppointment(doc, fonts, piece);
    case 'cs-recruit-playbook':
      return drawRecruit(doc, fonts, piece);
    case 'cs-field-pack':
      return drawFieldPack(doc, fonts, piece);
    case 'affiliate-pass':
      return drawAffiliate(doc, fonts, piece);
    case 'admin-playbook':
      return drawAdminMap(doc, fonts, piece);
    case 'metro-miami-ledger':
      return drawMetroMiami(doc, fonts, piece);
    case 'metro-brooklyn-mailbox':
      return drawMetroBrooklyn(doc, fonts, piece);
    case 'metro-boston-campus':
      return drawMetroBoston(doc, fonts, piece);
    case 'metro-houston-cycle':
      return drawMetroHouston(doc, fonts, piece);
    case 'metro-atlanta-moves':
      return drawMetroAtlanta(doc, fonts, piece);
    case 'metro-dc-fan':
      return drawMetroDc(doc, fonts, piece);
    case 'metro-chicago-docket':
      return drawMetroChicago(doc, fonts, piece);
    case 'metro-philly-age':
      return drawMetroPhilly(doc, fonts, piece);
    case 'metro-jax-auto':
      return drawMetroJax(doc, fonts, piece);
    case 'metro-nj-corridor':
      return drawMetroNj(doc, fonts, piece);
    default: {
      const neverArch: never = piece.architecture;
      throw new Error(`No PDF drawer for Haitian architecture "${String(neverArch)}".`);
    }
  }
}

async function drawRestoreDossier(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const color = EMERALD;
  const labels = ['01 Gossip', '02 Clocks', '03 Garden'];
  for (let p = 0; p < 3; p += 1) {
    const page = doc.addPage([W, H]);
    fillPage(page, p === 1 ? FILE_FLOOR : IVORY);
    labels.forEach((label, i) => {
      const x = M + i * 168;
      box(page, x, H - 58, 156, 36, i === p ? color : WHITE, color);
      page.drawText(winAnsi(label), {
        x: x + 12,
        y: H - 36,
        size: 11,
        font: fonts.sansBold,
        color: i === p ? WHITE : color,
      });
    });
    let y = H - 78;
    page.drawText(winAnsi(piece.title), { x: M, y, size: 18, font: fonts.sansBold, color: INK });
    y -= 16;
    y = paintHook(page, fonts, y, piece, color);
    y -= 10;
    const section = piece.sections[p] ?? piece.sections[0]!;
    y = paintSection(page, fonts, y, section, color, 'sans');
    if (p === 2) y = paintGlossary(page, fonts, piece, y - 6, color);
    if (p === 2) await finishWithQr(page, doc, fonts, piece, y, color);
    else drawFooter(page, fonts.sans, COMPLY);
  }
}

async function drawLetterMeaning(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  page.drawRectangle({ x: 0, y: H - 28, width: W, height: 28, color: NAVY });
  page.drawText(winAnsi(LETTER.sampleBanner), { x: M, y: H - 18, size: 9, font: fonts.sansBold, color: WHITE });
  let y = H - 58;
  page.drawText(winAnsi(LETTER.collectorName), { x: M, y, size: 16, font: fonts.timesBold, color: INK });
  y -= 14;
  page.drawText(winAnsi(LETTER.collectorUnit), { x: M, y, size: 11, font: fonts.times, color: MUTED });
  y -= 13;
  page.drawText(winAnsi(LETTER.collectorAddress), { x: M, y, size: 10, font: fonts.times, color: INK });
  y -= 13;
  page.drawText(winAnsi(LETTER.collectorCityLine), { x: M, y, size: 10, font: fonts.times, color: INK });
  y -= 16;
  page.drawRectangle({ x: M, y, width: CONTENT_W, height: 0.8, color: RULE });
  y -= 22;
  page.drawText(winAnsi(formatHaitianLetterDate()), { x: M, y, size: 11, font: fonts.times, color: INK });
  y -= 16;
  page.drawText(winAnsi(`${LETTER.accountRefLabel}: ${LETTER.accountRef}`), {
    x: M,
    y,
    size: 11,
    font: fonts.times,
    color: INK,
  });
  y -= 16;
  page.drawText(winAnsi(LETTER.reLine), { x: M, y, size: 11, font: fonts.timesBold, color: INK });
  y -= 24;
  page.drawText(winAnsi(LETTER.salutation), { x: M, y, size: 12, font: fonts.times, color: INK });
  y -= 10;
  y = drawWrapped(page, fonts.timesBold, LETTER.artifactLine, { x: M, y, size: 13, maxW: CONTENT_W, color: INK, gap: 17 });
  y -= 12;
  y = drawWrapped(page, fonts.times, LETTER.validationParagraph, {
    x: M,
    y,
    size: 11,
    maxW: CONTENT_W,
    color: INK,
    gap: 16,
  });
  y -= 22;
  page.drawText(winAnsi(LETTER.closing), { x: M, y, size: 12, font: fonts.times, color: INK });
  y -= 26;
  page.drawText(winAnsi(LETTER.signoffName), { x: M, y, size: 12, font: fonts.timesBold, color: INK });
  y -= 14;
  page.drawText(winAnsi(LETTER.signoffUnit), { x: M, y, size: 11, font: fonts.times, color: MUTED });
  drawFooter(page, fonts.times, LETTER.footer);

  const meaning = doc.addPage([W, H]);
  fillPage(meaning, IVORY);
  meaning.drawText(winAnsi(piece.title), { x: M, y: H - 52, size: 20, font: fonts.sansBold, color: INK });
  meaning.drawText(winAnsi(piece.titleHt), { x: M, y: H - 70, size: 11, font: fonts.times, color: MUTED });
  let my = paintHook(meaning, fonts, H - 86, piece, SKY);
  my -= 8;
  const meaningRest = paintAllSections(doc, fonts, meaning, my, piece, SKY, 'times', IVORY);
  await finishWithQr(meaningRest.page, doc, fonts, piece, meaningRest.y, SKY);
}

async function drawChurchFlyer(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, ROSE_PAPER);
  page.drawRectangle({ x: 0, y: H - 118, width: W, height: 118, color: ROSE });
  page.drawText(winAnsi('Haitian community'), { x: M, y: H - 28, size: 10, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('Pale Kreyòl'), { x: M, y: H - 62, size: 28, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('Credit help for Haitian Americans'), {
    x: M,
    y: H - 84,
    size: 12,
    font: fonts.sans,
    color: WHITE,
  });
  page.drawText(winAnsi('Scan when you are ready. Nobody is grading your accent.'), {
    x: M,
    y: H - 102,
    size: 10,
    font: fonts.sans,
    color: WHITE,
  });
  let y = H - 138;
  y = paintHook(page, fonts, y, piece, ROSE);
  y -= 10;
  const colW = (CONTENT_W - 12) / 2;
  const secrets = [
    ['Restore', 'Paying often does not delete the rumor.'],
    ['Debt', 'The letter is a clock, not breakfast.'],
    ['Building', 'Statement day is the photo, not payday.'],
    ['Business', 'The company file lives on the EIN.'],
  ];
  secrets.forEach((row, i) => {
    const col = i % 2;
    const rowI = Math.floor(i / 2);
    const x = M + col * (colW + 12);
    const top = y - rowI * 78;
    box(page, x, top - 70, colW, 66, WHITE, ROSE);
    page.drawText(winAnsi(row[0]!), { x: x + 10, y: top - 18, size: 11, font: fonts.sansBold, color: ROSE });
    drawWrapped(page, fonts.times, row[1]!, { x: x + 10, y: top - 24, size: 10, maxW: colW - 20, color: INK, gap: 13 });
  });
  y -= 168;
  page.drawText(winAnsi('Haitian Americans already live here'), { x: M, y: y - 12, size: 11, font: fonts.sansBold, color: ROSE });
  y -= 22;
  HAITIAN_PLACE_CARDS.forEach((place, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = M + col * 100;
    const top = y - row * 28;
    page.drawText(winAnsi(place.city), { x: x, y: top, size: 9, font: fonts.sansBold, color: INK });
  });
  y -= 70;
  page.drawText(winAnsi('Tear off  ·  Pale Kreyòl  ·  finelycred.com/haitian'), {
    x: M,
    y: y - 8,
    size: 9,
    font: fonts.sansBold,
    color: ROSE,
  });
  await drawQr(page, doc, piece.ctaPath, { x: RIGHT - 88, y: 48, size: 80 });
  drawFooter(page, fonts.sans, COMPLY);
}

async function drawCourt(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  page.drawRectangle({ x: 40, y: 40, width: W - 80, height: H - 80, borderColor: NAVY, borderWidth: 1.6 });
  page.drawRectangle({ x: 46, y: 46, width: W - 92, height: H - 92, borderColor: NAVY, borderWidth: 0.5 });
  page.drawText(winAnsi('IN THE COURT OF TEACHING EXAMPLES'), {
    x: W / 2 - fonts.timesBold.widthOfTextAtSize(winAnsi('IN THE COURT OF TEACHING EXAMPLES'), 11) / 2,
    y: H - 88,
    size: 11,
    font: fonts.timesBold,
    color: NAVY,
  });
  page.drawText(winAnsi('CIVIL ACTION  ·  SAMPLE  ·  NOT A LIVE CASE'), {
    x: W / 2 - fonts.times.widthOfTextAtSize(winAnsi('CIVIL ACTION  ·  SAMPLE  ·  NOT A LIVE CASE'), 9) / 2,
    y: H - 106,
    size: 9,
    font: fonts.times,
    color: MUTED,
  });
  page.drawText(winAnsi('SUMMONS'), {
    x: W / 2 - fonts.timesBold.widthOfTextAtSize('SUMMONS', 22) / 2,
    y: H - 140,
    size: 22,
    font: fonts.timesBold,
    color: INK,
  });
  let y = H - 170;
  page.drawText(winAnsi('Harborline Recovery Services'), { x: M + 16, y, size: 12, font: fonts.timesBold, color: INK });
  page.drawText(winAnsi('Plaintiff,'), { x: RIGHT - 120, y, size: 11, font: fonts.times, color: INK });
  y -= 22;
  page.drawText(winAnsi('v.'), { x: M + 16, y, size: 12, font: fonts.timesBold, color: INK });
  y -= 20;
  page.drawText(winAnsi('Account Holder (teaching name)'), { x: M + 16, y, size: 12, font: fonts.timesBold, color: INK });
  page.drawText(winAnsi('Defendant.'), { x: RIGHT - 120, y, size: 11, font: fonts.times, color: INK });
  y -= 28;
  page.drawText(winAnsi('Case No.  EDU-CV-0000'), { x: M + 16, y, size: 11, font: fonts.times, color: INK });
  y -= 18;
  page.drawText(winAnsi('Nature of action: consumer collection (teaching example)'), {
    x: M + 16,
    y,
    size: 11,
    font: fonts.times,
    color: INK,
  });
  y -= 36;
  box(page, M + 16, y - 70, CONTENT_W - 32, 70, ROSE_PAPER, ROSE);
  page.drawText(winAnsi('YOU MUST ANSWER BY'), {
    x: M + 28,
    y: y - 20,
    size: 10,
    font: fonts.timesBold,
    color: ROSE,
  });
  page.drawText(winAnsi('April 17, 2026          or write the date on your real paper: ______ / ______ / ______'), {
    x: M + 28,
    y: y - 42,
    size: 11,
    font: fonts.timesBold,
    color: INK,
  });
  page.drawText(winAnsi('A phone call to the collector is not an answer.'), {
    x: M + 28,
    y: y - 58,
    size: 10,
    font: fonts.times,
    color: MUTED,
  });
  y -= 100;
  y = drawWrapped(
    page,
    fonts.times,
    'You are hereby summoned and required to serve upon the plaintiff an answer to the complaint. This page is a sample so you can recognize the shape. It is not your live case. It is not legal advice.',
    { x: M + 16, y, size: 11, maxW: CONTENT_W - 24, color: INK, gap: 15 },
  );
  drawFooter(page, fonts.times, 'Sample summons · not a live case · not legal advice · Results vary');

  const explainer = doc.addPage([W, H]);
  fillPage(explainer, WHITE);
  explainer.drawText(winAnsi(piece.title), { x: M, y: H - 52, size: 20, font: fonts.timesBold, color: INK });
  explainer.drawText(winAnsi(piece.titleHt), { x: M, y: H - 70, size: 12, font: fonts.times, color: MUTED });
  let ey = paintHook(explainer, fonts, H - 88, piece, ROSE);
  ey -= 8;
  const explainerRest = paintAllSections(doc, fonts, explainer, ey, piece, ROSE, 'times', WHITE);
  ey = drawActionLine(explainerRest.page, fonts, explainerRest.y - 8, piece.actionEn, piece.actionHt, ROSE);
  drawFooter(explainerRest.page, fonts.times, COMPLY);
}

async function drawForeclosure(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, PAPER);
  page.drawRectangle({ x: 0, y: H - 92, width: W, height: 92, color: ROSE });
  page.drawText(winAnsi('FORECLOSURE NOTICE  ·  SAMPLE'), { x: M, y: H - 36, size: 16, font: fonts.timesBold, color: WHITE });
  page.drawText(winAnsi('AVI SEZI KAY  ·  yon egzanp'), { x: M, y: H - 58, size: 11, font: fonts.times, color: WHITE });
  page.drawText(winAnsi('The county does not accept good intentions as certified mail.'), {
    x: M,
    y: H - 76,
    size: 10,
    font: fonts.times,
    color: WHITE,
  });
  let y = paintHook(page, fonts, H - 112, piece, ROSE);
  y -= 8;
  box(page, M, y - 56, CONTENT_W, 48, ROSE, ROSE);
  page.drawText(winAnsi('SALE / DEFAULT DATE ON THE NOTICE'), {
    x: M + 12,
    y: y - 20,
    size: 9,
    font: fonts.sansBold,
    color: WHITE,
  });
  page.drawText(winAnsi('______ / ______ / ______     Property: ______________________________'), {
    x: M + 12,
    y: y - 40,
    size: 11,
    font: fonts.timesBold,
    color: WHITE,
  });
  y -= 70;
  await closeArticle(doc, fonts, page, y, piece, ROSE, 'times', PAPER);
}

async function drawRepo(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, FILE_FLOOR);
  page.drawRectangle({ x: 0, y: H - 88, width: W, height: 88, color: VIOLET });
  page.drawText(winAnsi('REPOSSESSION NOTICE  ·  SAMPLE'), { x: M, y: H - 34, size: 16, font: fonts.timesBold, color: WHITE });
  page.drawText(winAnsi('The VIN does not RSVP to family meeting night.'), {
    x: M,
    y: H - 56,
    size: 11,
    font: fonts.times,
    color: WHITE,
  });
  page.drawText(winAnsi('AVI SEZI MACHIN'), { x: M, y: H - 74, size: 10, font: fonts.sansBold, color: WHITE });
  box(page, M, H - 168, 92, 56, VIOLET);
  page.drawText(winAnsi('VIN'), { x: M + 28, y: H - 136, size: 16, font: fonts.sansBold, color: WHITE });
  let y = paintHook(page, fonts, H - 180, piece, VIOLET);
  y -= 6;
  await closeArticle(doc, fonts, page, y, piece, VIOLET, 'times', FILE_FLOOR);
}

async function drawValidation(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  page.drawRectangle({ x: M, y: H - 78, width: 120, height: 48, color: ROSE });
  page.drawText(winAnsi('RECEIVED'), { x: M + 14, y: H - 50, size: 11, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('stamp the date'), { x: M + 14, y: H - 64, size: 8, font: fonts.sans, color: WHITE });
  page.drawText(winAnsi('30-DAY CLOCK'), { x: M + 140, y: H - 44, size: 10, font: fonts.sansBold, color: ROSE });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 100, size: 20, font: fonts.timesBold, color: INK });
  let y = paintHook(page, fonts, H - 118, piece, ROSE);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, ROSE, 'times', PAPER);
}

async function drawDfy(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, IVORY);
  const half = (CONTENT_W - 12) / 2;
  box(page, M, H - 150, half, 88, WHITE, ROSE);
  box(page, M + half + 12, H - 150, half, 88, ROSE, ROSE);
  page.drawText(winAnsi('YOU HOLD'), { x: M + 14, y: H - 78, size: 10, font: fonts.sansBold, color: ROSE });
  page.drawText(winAnsi('The envelope. The dates.'), { x: M + 14, y: H - 98, size: 11, font: fonts.timesBold, color: INK });
  page.drawText(winAnsi('WE RUN'), { x: M + half + 26, y: H - 78, size: 10, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('The English clocks.'), {
    x: M + half + 26,
    y: H - 98,
    size: 11,
    font: fonts.timesBold,
    color: WHITE,
  });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 176, size: 20, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 194, piece, ROSE);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, ROSE, 'sans', IVORY);
}

async function drawBankruptcy(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  box(page, M, H - 130, CONTENT_W, 78, NAVY);
  page.drawText(winAnsi('UNITED STATES BANKRUPTCY COURT  ·  SAMPLE'), {
    x: M + 16,
    y: H - 72,
    size: 9,
    font: fonts.times,
    color: WHITE,
  });
  page.drawText(winAnsi('IN RE'), { x: M + 16, y: H - 96, size: 22, font: fonts.timesBold, color: WHITE });
  page.drawText(winAnsi('Chapter 7 / 13 / other ______     (teaching example)'), {
    x: M + 16,
    y: H - 116,
    size: 11,
    font: fonts.times,
    color: WHITE,
  });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 156, size: 18, font: fonts.timesBold, color: INK });
  let y = paintHook(page, fonts, H - 174, piece, NAVY);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, NAVY, 'times', WHITE);
}

async function drawBuilding(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  page.drawRectangle({ x: M, y: H - 92, width: CONTENT_W, height: 18, color: FILE_FLOOR, borderColor: SKY, borderWidth: 1 });
  page.drawRectangle({ x: M, y: H - 92, width: CONTENT_W * 0.28, height: 18, color: SKY });
  page.drawText(winAnsi('Statement-day photo  ·  28%'), { x: M, y: H - 114, size: 10, font: fonts.sansBold, color: SKY });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 140, size: 16, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 156, piece, SKY);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, SKY, 'sans', WHITE);
}

async function drawTradelines(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, IVORY);
  [0, 1, 2].forEach((i) => {
    box(page, M + 18 + i * 14, H - 86 - i * 10, CONTENT_W - 40, 52, i === 2 ? VIOLET : WHITE, VIOLET);
  });
  page.drawText(winAnsi('PRIMARY'), { x: M + 48, y: H - 58, size: 9, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('Guest chair  ·  authorized user'), {
    x: M + 48,
    y: H - 74,
    size: 10,
    font: fonts.times,
    color: WHITE,
  });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 168, size: 18, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 186, piece, VIOLET);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, VIOLET, 'sans', WHITE);
}

async function drawBusiness(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  box(page, M, H - 64, 72, 36, VIOLET);
  page.drawText(winAnsi('EIN'), { x: M + 18, y: H - 42, size: 14, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('Company file  ·  not the owner SSN'), { x: M + 88, y: H - 42, size: 12, font: fonts.sansBold, color: INK });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 90, size: 18, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 108, piece, VIOLET);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, VIOLET, 'sans', WHITE);
}

async function drawLadder(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, FILE_FLOOR);
  ['Entity + EIN', 'Vendors that report', 'Company ask'].forEach((step, i) => {
    box(page, M + i * 168, H - 88, 156, 44, i === 1 ? EMERALD : WHITE, EMERALD);
    page.drawText(winAnsi(`${i + 1}`), {
      x: M + 12 + i * 168,
      y: H - 62,
      size: 14,
      font: fonts.sansBold,
      color: i === 1 ? WHITE : EMERALD,
    });
    page.drawText(winAnsi(step), {
      x: M + 32 + i * 168,
      y: H - 62,
      size: 9,
      font: fonts.sansBold,
      color: i === 1 ? WHITE : INK,
    });
  });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 116, size: 18, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 134, piece, EMERALD);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, EMERALD, 'sans', WHITE);
}

async function drawPrivacy(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  box(page, M, H - 100, 64, 64, SKY);
  page.drawText(winAnsi('LOCK'), { x: M + 12, y: H - 64, size: 12, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi(piece.title), { x: M + 80, y: H - 48, size: 18, font: fonts.sansBold, color: INK });
  page.drawText(winAnsi('Three bureaus. Three PINs. No group chat.'), {
    x: M + 80,
    y: H - 68,
    size: 10,
    font: fonts.times,
    color: MUTED,
  });
  let y = paintHook(page, fonts, H - 118, piece, SKY);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, SKY, 'sans', WHITE);
}

async function drawBundles(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  const half = (CONTENT_W - 16) / 2;
  box(page, M, H - 140, half, 88, EMERALD);
  box(page, M + half + 16, H - 140, half, 88, ROSE);
  page.drawText(winAnsi('RESTORE'), { x: M + 16, y: H - 78, size: 12, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('The screen is wrong'), { x: M + 16, y: H - 98, size: 11, font: fonts.times, color: WHITE });
  page.drawText(winAnsi('DEBT'), { x: M + half + 32, y: H - 78, size: 12, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('The envelope arrived'), {
    x: M + half + 32,
    y: H - 98,
    size: 11,
    font: fonts.times,
    color: WHITE,
  });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 168, size: 20, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 186, piece, ROSE);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, ROSE, 'sans', IVORY);
}

async function drawChex(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, FILE_FLOOR);
  box(page, M, H - 120, 200, 72, SKY);
  box(page, M + 220, H - 120, 200, 72, WHITE, SKY);
  page.drawText(winAnsi('CHEXSYSTEMS'), { x: M + 16, y: H - 72, size: 11, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi('Banking report'), { x: M + 16, y: H - 90, size: 10, font: fonts.times, color: WHITE });
  page.drawText(winAnsi('EQUIFAX'), { x: M + 236, y: H - 72, size: 11, font: fonts.sansBold, color: SKY });
  page.drawText(winAnsi('Not the same cousin'), { x: M + 236, y: H - 90, size: 10, font: fonts.times, color: INK });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 150, size: 16, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 168, piece, SKY);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, SKY, 'sans', WHITE);
}

async function drawMaintenance(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, IVORY);
  ;['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].forEach((m, i) => {
    const x = M + (i % 6) * 84;
    box(page, x, H - 88, 76, 48, i === 2 ? EMERALD : WHITE, EMERALD);
    page.drawText(winAnsi(m), {
      x: x + 18,
      y: H - 60,
      size: 11,
      font: fonts.sansBold,
      color: i === 2 ? WHITE : EMERALD,
    });
  });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 116, size: 18, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 134, piece, EMERALD);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, EMERALD, 'sans', WHITE);
}

async function drawDiy(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  page.drawRectangle({ x: M, y: H - 70, width: CONTENT_W, height: 36, color: EMERALD });
  page.drawText(winAnsi('CERTIFIED MAIL LOG'), { x: M + 14, y: H - 48, size: 12, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 96, size: 18, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 114, piece, EMERALD);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, EMERALD, 'sans', WHITE);
}

async function drawThreeCousins(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, FILE_FLOOR);
  ;['Equifax', 'Experian', 'TransUnion'].forEach((name, i) => {
    box(page, M + i * 168, H - 90, 156, 52, i === 1 ? SKY : WHITE, SKY);
    page.drawText(winAnsi(name), {
      x: M + 16 + i * 168,
      y: H - 60,
      size: 12,
      font: fonts.sansBold,
      color: i === 1 ? WHITE : SKY,
    });
  });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 118, size: 18, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 136, piece, SKY);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, SKY, 'sans', WHITE);
}

async function drawWelcome(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  page.drawText(winAnsi('Haitian community'), { x: M, y: H - 48, size: 11, font: fonts.sansBold, color: EMERALD });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 76, size: 22, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 94, piece, EMERALD);
  y -= 10;
  await closeArticle(doc, fonts, page, y, piece, EMERALD, 'sans', WHITE);
}

async function drawVisit(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  ;['Read', 'Pick', 'Stop'].forEach((word, i) => {
    box(page, M + i * 168, H - 88, 156, 44, i === 2 ? SKY : WHITE, SKY);
    page.drawText(winAnsi(word), {
      x: M + 24 + i * 168,
      y: H - 62,
      size: 14,
      font: fonts.sansBold,
      color: i === 2 ? WHITE : SKY,
    });
  });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 118, size: 18, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 136, piece, SKY);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, SKY, 'sans', WHITE);
}

async function drawHelper(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  box(page, M, H - 160, CONTENT_W * 0.48, 96, WHITE, VIOLET);
  box(page, M + CONTENT_W * 0.52, H - 160, CONTENT_W * 0.48, 88, VIOLET);
  page.drawText(winAnsi('She holds her phone'), { x: M + 12, y: H - 88, size: 11, font: fonts.sansBold, color: VIOLET });
  page.drawText(winAnsi('You point at the sentence'), {
    x: M + CONTENT_W * 0.52 + 12,
    y: H - 88,
    size: 11,
    font: fonts.sansBold,
    color: WHITE,
  });
  let y = drawWrapped(page, fonts.sansBold, piece.title, {
    x: M,
    y: H - 168,
    size: 18,
    maxW: CONTENT_W,
    color: INK,
    gap: 22,
  });
  y = paintHook(page, fonts, y - 8, piece, VIOLET);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, VIOLET, 'times', WHITE);
}

async function drawAppointment(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, IVORY);
  box(page, M, H - 140, CONTENT_W, 92, WHITE, EMERALD);
  page.drawText(winAnsi('Book a session'), { x: M + 18, y: H - 70, size: 22, font: fonts.sansBold, color: EMERALD });
  page.drawText(winAnsi('Bring the envelope. Not the whole life story.'), {
    x: M + 18,
    y: H - 94,
    size: 11,
    font: fonts.times,
    color: INK,
  });
  let y = paintHook(page, fonts, H - 158, piece, EMERALD);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, EMERALD, 'sans', WHITE);
}

async function drawRecruit(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  page.drawText(winAnsi('CREDIT SPECIALIST'), { x: M, y: H - 48, size: 10, font: fonts.sansBold, color: VIOLET });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 76, size: 22, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 94, piece, VIOLET);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, VIOLET, 'sans', WHITE);
}

async function drawFieldPack(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, FILE_FLOOR);
  page.drawText(winAnsi('FIELD PACK  ·  THIS WEEK'), { x: M, y: H - 48, size: 10, font: fonts.sansBold, color: SKY });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 74, size: 20, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 92, piece, SKY);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, SKY, 'sans', WHITE);
}

async function drawAffiliate(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  box(page, M, H - 70, 132, 36, EMERALD);
  page.drawText(winAnsi('SHARE PASS'), { x: M + 14, y: H - 48, size: 11, font: fonts.sansBold, color: WHITE });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 96, size: 20, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 114, piece, EMERALD);
  y -= 8;
  const rest = paintAllSections(doc, fonts, page, y, piece, EMERALD, 'sans', WHITE);
  await finishWithQr(rest.page, doc, fonts, piece, rest.y, EMERALD);
}

async function drawAdminMap(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  page.drawText(winAnsi('MARKETER MAP'), { x: M, y: H - 48, size: 10, font: fonts.sansBold, color: SKY });
  page.drawText(winAnsi(piece.title), { x: M, y: H - 74, size: 20, font: fonts.sansBold, color: INK });
  let y = paintHook(page, fonts, H - 92, piece, SKY);
  y -= 8;
  await closeArticle(doc, fonts, page, y, piece, SKY, 'sans', WHITE);
}

async function metroShell(
  doc: PDFDocument,
  fonts: HaitianPdfFonts,
  piece: HaitianPieceSpec,
  color: RGB,
  paintSig: (page: PDFPage, y: number) => number,
) {
  const page = doc.addPage([W, H]);
  fillPage(page, WHITE);
  let y = paintSig(page, H - 48);
  page.drawText(winAnsi(piece.title), { x: M, y: y - 22, size: 18, font: fonts.sansBold, color: INK });
  y = paintHook(page, fonts, y - 40, piece, color);
  y -= 8;
  const rest = paintAllSections(doc, fonts, page, y, piece, color, 'sans', WHITE);
  await finishWithQr(rest.page, doc, fonts, piece, rest.y, color);
}

async function drawMetroMiami(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, EMERALD, (page, y) => {
    ;['Haiti', 'Couch', 'Condo'].forEach((label, i) => {
      box(page, M + i * 168, y - 44, 156, 40, i === 2 ? EMERALD : WHITE, EMERALD);
      page.drawText(winAnsi(label), {
        x: M + 16 + i * 168,
        y: y - 22,
        size: 11,
        font: fonts.sansBold,
        color: i === 2 ? WHITE : EMERALD,
      });
    });
    return y - 52;
  });
}

async function drawMetroBrooklyn(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, VIOLET, (page, y) => {
    box(page, M, y - 56, CONTENT_W, 52, VIOLET);
    page.drawText(winAnsi('MAIL'), { x: M + 16, y: y - 22, size: 14, font: fonts.sansBold, color: WHITE });
    page.drawText(winAnsi('Keep the envelope. The text is a rumor.'), {
      x: M + 80,
      y: y - 22,
      size: 11,
      font: fonts.times,
      color: WHITE,
    });
    return y - 64;
  });
}

async function drawMetroBoston(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, SKY, (page, y) => {
    const half = (CONTENT_W - 12) / 2;
    box(page, M, y - 48, half, 40, SKY);
    box(page, M + half + 12, y - 48, half, 40, WHITE, SKY);
    page.drawText(winAnsi('Campus'), { x: M + 14, y: y - 24, size: 12, font: fonts.sansBold, color: WHITE });
    page.drawText(winAnsi('Hospital'), { x: M + half + 26, y: y - 24, size: 12, font: fonts.sansBold, color: SKY });
    return y - 56;
  });
}

async function drawMetroHouston(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, ROSE, (page, y) => {
    page.drawText(winAnsi('payday Friday'), { x: M, y: y - 12, size: 10, font: fonts.sans, color: MUTED });
    page.drawText(winAnsi('SNAPSHOT Wednesday'), { x: M + 160, y: y - 12, size: 12, font: fonts.sansBold, color: ROSE });
    page.drawText(winAnsi('panic Thursday'), { x: M + 360, y: y - 12, size: 10, font: fonts.sans, color: MUTED });
    return y - 28;
  });
}

async function drawMetroAtlanta(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, VIOLET, (page, y) => {
    ;[0, 1, 2].forEach((i) => {
      page.drawRectangle({ x: M + i * 40, y: y - 36, width: 22, height: 22 + i * 8, color: VIOLET });
    });
    page.drawText(winAnsi('Buyer 4  still shouting  ·  original creditor is the name that matters'), {
      x: M + 140,
      y: y - 20,
      size: 10,
      font: fonts.times,
      color: INK,
    });
    return y - 48;
  });
}

async function drawMetroDc(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, SKY, (page, y) => {
    ;['DC', 'MD', 'VA'].forEach((st, i) => {
      box(page, M + i * 110, y - 40, 100, 36, i === 0 ? SKY : WHITE, SKY);
      page.drawText(winAnsi(st), {
        x: M + 34 + i * 110,
        y: y - 22,
        size: 14,
        font: fonts.sansBold,
        color: i === 0 ? WHITE : SKY,
      });
    });
    return y - 48;
  });
}

async function drawMetroChicago(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, ROSE, (page, y) => {
    box(page, M, y - 44, CONTENT_W * 0.48, 36, ROSE);
    box(page, M + CONTENT_W * 0.52, y - 44, CONTENT_W * 0.48, 36, WHITE, ROSE);
    page.drawText(winAnsi('City / utility'), { x: M + 12, y: y - 22, size: 11, font: fonts.sansBold, color: WHITE });
    page.drawText(winAnsi('Bank card'), {
      x: M + CONTENT_W * 0.52 + 12,
      y: y - 22,
      size: 11,
      font: fonts.sansBold,
      color: ROSE,
    });
    return y - 52;
  });
}

async function drawMetroPhilly(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, EMERALD, (page, y) => {
    page.drawRectangle({ x: M, y: y - 16, width: 180, height: 10, color: EMERALD });
    page.drawRectangle({ x: M + 200, y: y - 16, width: 80, height: 10, color: RULE });
    page.drawText(winAnsi('Age on the good lines     clutter on the old ones'), {
      x: M,
      y: y - 32,
      size: 10,
      font: fonts.times,
      color: INK,
    });
    return y - 44;
  });
}

async function drawMetroJax(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, VIOLET, (page, y) => {
    box(page, M, y - 48, 88, 40, VIOLET);
    page.drawText(winAnsi('VIN'), { x: M + 24, y: y - 24, size: 16, font: fonts.sansBold, color: WHITE });
    page.drawText(winAnsi('Statute time. Not island time.'), {
      x: M + 104,
      y: y - 22,
      size: 12,
      font: fonts.timesBold,
      color: INK,
    });
    return y - 56;
  });
}

async function drawMetroNj(doc: PDFDocument, fonts: HaitianPdfFonts, piece: HaitianPieceSpec) {
  return metroShell(doc, fonts, piece, SKY, (page, y) => {
    ;['Newark', 'Elizabeth', 'Jersey City'].forEach((city, i) => {
      box(page, M + i * 168, y - 40, 156, 36, WHITE, SKY);
      page.drawText(winAnsi(city), { x: M + 16 + i * 168, y: y - 20, size: 11, font: fonts.sansBold, color: SKY });
    });
    return y - 48;
  });
}
