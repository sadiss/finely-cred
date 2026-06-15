import type { Certificate } from '../domain/certificates';

export async function generateCertificatePdfBytes(args: {
  cert: Certificate;
  issuerName?: string;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const page = doc.addPage([792, 612]); // landscape letter
  const w = page.getWidth();
  const h = page.getHeight();

  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  // Background border
  page.drawRectangle({ x: 28, y: 28, width: w - 56, height: h - 56, borderColor: rgb(0.85, 0.65, 0.18), borderWidth: 3 });
  page.drawRectangle({ x: 40, y: 40, width: w - 80, height: h - 80, borderColor: rgb(1, 1, 1), borderWidth: 1, opacity: 0.25 });

  const title = 'Certificate of Completion';
  page.drawText(title, {
    x: 0,
    y: h - 140,
    size: 34,
    font: fontBold,
    color: rgb(0.95, 0.95, 0.95),
    maxWidth: w,
  });
  // center title
  const titleWidth = fontBold.widthOfTextAtSize(title, 34);
  page.drawText(title, { x: (w - titleWidth) / 2, y: h - 140, size: 34, font: fontBold, color: rgb(0.95, 0.95, 0.95) });

  const recipient = args.cert.recipientName || 'Participant';
  const courseTitle = args.cert.courseTitle || 'Course';

  const line1 = 'This certifies that';
  const line2 = recipient;
  const line3 = 'has successfully completed';
  const line4 = courseTitle;

  const center = (s: string, size: number, y: number, bold = false) => {
    const f = bold ? fontBold : font;
    const width = f.widthOfTextAtSize(s, size);
    page.drawText(s, { x: (w - width) / 2, y, size, font: f, color: rgb(0.92, 0.92, 0.92) });
  };

  center(line1, 14, h - 210);
  center(line2, 28, h - 255, true);
  center(line3, 14, h - 300);
  center(line4, 22, h - 340, true);

  const issued = new Date(args.cert.issuedAt).toLocaleDateString();
  const issuer = args.issuerName || 'Finely Cred';
  page.drawText(`Issued: ${issued}`, { x: 70, y: 80, size: 11, font, color: rgb(0.85, 0.85, 0.85) });
  page.drawText(`Issuer: ${issuer}`, { x: 70, y: 62, size: 11, font, color: rgb(0.85, 0.85, 0.85) });
  page.drawText(`Verify: ${args.cert.verificationCode}`, { x: w - 260, y: 62, size: 11, font, color: rgb(0.85, 0.85, 0.85) });

  const bytes = await doc.save();
  return new Uint8Array(bytes);
}

