import { downloadBlob } from '../utils/download';
import { buildShortReferralUrl, qrCodeImageUrl } from '../lib/leadAttribution';

/** Print-ready single-page PDF with QR + short link for brochures and business cards. */
export async function downloadLeadMagnetQrPdf(args: {
  referralCode: string;
  title?: string;
  subtitle?: string;
}) {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const url = buildShortReferralUrl(args.referralCode);
  const qrImageUrl = qrCodeImageUrl(url, 400);

  const qrRes = await fetch(qrImageUrl);
  const qrBytes = new Uint8Array(await qrRes.arrayBuffer());

  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await doc.embedFont(StandardFonts.Helvetica);
  const qr = await doc.embedPng(qrBytes);

  const title = args.title ?? 'Free Credit Dispute Letter Guide';
  const subtitle = args.subtitle ?? 'Scan to claim your free playbook + book a session';

  page.drawText('FINELY CRED', { x: 54, y: 720, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(title, { x: 54, y: 680, size: 22, font, color: rgb(0.1, 0.1, 0.1), maxWidth: 504 });
  page.drawText(subtitle, { x: 54, y: 650, size: 12, font: fontReg, color: rgb(0.25, 0.25, 0.25), maxWidth: 504 });

  const qrSize = 280;
  page.drawImage(qr, {
    x: (612 - qrSize) / 2,
    y: 320,
    width: qrSize,
    height: qrSize,
  });

  page.drawText(url, { x: 54, y: 280, size: 11, font: fontReg, color: rgb(0.2, 0.45, 0.35), maxWidth: 504 });
  page.drawText(`Referral: ${args.referralCode}`, { x: 54, y: 120, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('Educational only · Not legal advice', { x: 54, y: 80, size: 9, font: fontReg, color: rgb(0.5, 0.5, 0.5) });

  const bytes = await doc.save();
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  downloadBlob({
    blob: new Blob([ab], { type: 'application/pdf' }),
    filename: `finely-lead-magnet-qr-${args.referralCode}.pdf`,
  });
}
