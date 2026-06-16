import { downloadBlob } from '../utils/download';
import { qrCodeImageUrl } from './leadAttribution';
import {
  HEAD_OF_SOCIETY_NAME,
  HETA_SOCIETY_DISPUTE_LIMIT,
  HETA_SOCIETY_SHORT,
  HETA_SOCIETY_TAGLINE,
  HEAD_OF_SOCIETY_PATH,
} from '../config/hetaSocietyProgram';

function flyerUrl(origin?: string) {
  const base = (origin || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  return `${base}${HEAD_OF_SOCIETY_PATH}#hos-flyer`;
}

/** Print-ready HOS access flyer — share privately with invitees. */
export async function downloadHosAccessFlyerPdf(args?: { origin?: string }) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const url = flyerUrl(args?.origin);
  const qrImageUrl = qrCodeImageUrl(url, 420);

  const qrRes = await fetch(qrImageUrl);
  const qrBytes = new Uint8Array(await qrRes.arrayBuffer());

  const doc = await PDFDocument.create();
  // US Letter portrait
  const page = doc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const qr = await doc.embedPng(qrBytes);

  const gold = rgb(0.85, 0.65, 0.13);
  const goldDark = rgb(0.45, 0.32, 0.05);
  const ink = rgb(0.08, 0.1, 0.12);
  const muted = rgb(0.35, 0.38, 0.42);
  const white = rgb(1, 1, 1);

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.06, 0.08, 0.1) });
  page.drawRectangle({ x: 28, y: 28, width: width - 56, height: height - 56, borderColor: gold, borderWidth: 2 });
  page.drawRectangle({ x: 36, y: 36, width: width - 72, height: height - 72, borderColor: goldDark, borderWidth: 0.5 });

  // Header band
  page.drawRectangle({ x: 36, y: height - 120, width: width - 72, height: 72, color: rgb(0.12, 0.14, 0.18) });
  page.drawText('FINELY CRED', { x: 52, y: height - 68, size: 9, font: fontBold, color: gold });
  page.drawText(`${HEAD_OF_SOCIETY_NAME.toUpperCase()}  ·  ${HETA_SOCIETY_SHORT}`, {
    x: 52,
    y: height - 88,
    size: 11,
    font: fontBold,
    color: white,
  });
  page.drawText('INVITE-ONLY MEMBER LANE', { x: 52, y: height - 104, size: 8, font, color: muted });

  // Title
  page.drawText(HETA_SOCIETY_TAGLINE.replace('.', ''), { x: 52, y: height - 168, size: 26, font: fontBold, color: white, maxWidth: width - 104 });
  page.drawText('Restore personal credit. Build business credit. Grow with discipline.', {
    x: 52,
    y: height - 198,
    size: 12,
    font,
    color: gold,
    maxWidth: width - 240,
  });

  const bullets = [
    `${HETA_SOCIETY_DISPUTE_LIMIT} tracked dispute slots with FCRA timing`,
    'Private member portal — not the general Finely login',
    'Business credit Tier 1–4 vendor sequencing',
    'Free letter guide + growth paths when you are ready',
  ];
  let y = height - 240;
  for (const b of bullets) {
    page.drawText('◆', { x: 52, y, size: 10, font: fontBold, color: gold });
    page.drawText(b, { x: 68, y, size: 10, font, color: rgb(0.88, 0.9, 0.92), maxWidth: width - 280 });
    y -= 22;
  }

  // Access path box
  page.drawRectangle({ x: 52, y: 200, width: width - 104, height: 148, color: rgb(0.1, 0.12, 0.16), borderColor: goldDark, borderWidth: 1 });
  page.drawText('YOUR ACCESS PATH', { x: 68, y: 318, size: 9, font: fontBold, color: gold });
  const steps = [
    '1  Receive your private key (HOS-XXXXXXXX) from Finely or an authorized leader',
    '2  Visit the member entrance and verify your key',
    '3  Complete your file and open your restoration + build command center',
  ];
  y = 298;
  for (const s of steps) {
    page.drawText(s, { x: 68, y, size: 9.5, font, color: white, maxWidth: width - 280 });
    y -= 28;
  }

  // QR + URL
  const qrSize = 128;
  page.drawImage(qr, { x: width - 52 - qrSize, y: 210, width: qrSize, height: qrSize });
  page.drawText('Scan to open member entrance', { x: width - 52 - qrSize, y: 196, size: 7, font, color: muted });
  page.drawText(url.replace(/^https?:\/\//, ''), { x: 52, y: 168, size: 8, font: fontBold, color: gold, maxWidth: width - 120 });

  // Footer
  page.drawText('This lane is private. Do not share your access key publicly.', {
    x: 52,
    y: 52,
    size: 8,
    font,
    color: muted,
    maxWidth: width - 104,
  });

  const bytes = await doc.save();
  downloadBlob({
    blob: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
    filename: `finely-hos-access-flyer.pdf`,
  });
}

export function hosFlyerPageUrl(origin?: string) {
  return flyerUrl(origin);
}
