import {

  DISPUTE_LETTER_GUIDE_IMAGE_PAGES,

  DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES,

} from './disputeLetterGuideContent';

import {
  drawGuideContentPages,
  drawPremiumCoverPage,
  PDF_PAGE_H,
  PDF_PAGE_W,
} from './buildFreeGuidePdf';

import { downloadBlob } from '../utils/download';



function sanitizeFilename(s: string) {

  return (s || 'Guide').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');

}



async function fetchImageBytes(url: string): Promise<Uint8Array | null> {

  try {

    const res = await fetch(url);

    if (!res.ok) return null;

    return new Uint8Array(await res.arrayBuffer());

  } catch {

    return null;

  }

}



async function embedPngPageIfAvailable(pdfDoc: { embedPng: (b: Uint8Array) => Promise<unknown>; addPage: (s: [number, number]) => unknown }, url: string) {

  const bytes = await fetchImageBytes(url);

  if (!bytes) return false;

  const img = (await pdfDoc.embedPng(bytes)) as { width: number; height: number };

  const page = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]) as { drawImage: (img: unknown, o: object) => void };

  const scale = Math.min(PDF_PAGE_W / img.width, PDF_PAGE_H / img.height);

  const w = img.width * scale;

  const h = img.height * scale;

  page.drawImage(img, {

    x: (PDF_PAGE_W - w) / 2,

    y: (PDF_PAGE_H - h) / 2,

    width: w,

    height: h,

  });

  return true;

}



export async function buildDisputeLetterGuidePdf(args: {

  fullName?: string;

  leadId?: string;

  email?: string;

}): Promise<Uint8Array> {

  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const fonts = { regular, bold };



  const coverPage = pdfDoc.addPage([PDF_PAGE_W, PDF_PAGE_H]);

  drawPremiumCoverPage(coverPage, fonts, rgb, {

    title: 'Free Credit Dispute Letter Guide',

    subtitle: 'FCRA rights, 5-step framework, mailing workflow, law-per-negative citations, and escalation playbook.',

    meta: { fullName: args.fullName },

    highlights: [

      'Your FCRA rights — what bureaus must verify',

      '5-step dispute framework (one tradeline per letter)',

      'Letter Stream certified-mail workflow',

      'Law per negative — cite the right statute',

    ],

  });



  for (const url of DISPUTE_LETTER_GUIDE_IMAGE_PAGES) {

    await embedPngPageIfAvailable(pdfDoc, url);

  }



  drawGuideContentPages(pdfDoc, fonts, rgb, DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES, {

    fullName: args.fullName,

  });



  return pdfDoc.save();

}



export async function downloadDisputeLetterGuidePdf(args: {

  fullName?: string;

  leadId?: string;

  email?: string;

}) {

  const bytes = await buildDisputeLetterGuidePdf(args);

  const ab = new ArrayBuffer(bytes.byteLength);

  new Uint8Array(ab).set(bytes);

  downloadBlob({

    blob: new Blob([ab], { type: 'application/pdf' }),

    filename: `${sanitizeFilename('Free_Credit_Dispute_Letter_Guide')}_FinelyCred.pdf`,

  });

}

