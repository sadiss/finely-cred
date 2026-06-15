import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

function stripToTextWithBreaks(html: string): string {
  const s = String(html || '');
  // Normalize common block boundaries into newlines before stripping tags.
  const withNewlines = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|h1|h2|h3|h4|li|tr|table|thead|tbody|tfoot|section|article|header|footer)>/gi, '\n')
    .replace(/<(\/)?(ul|ol|table|thead|tbody|tfoot|section|article|header|footer)[^>]*>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
  const text = withNewlines.replace(/<[^>]+>/g, '');
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function wrapLine(font: any, fontSize: number, text: string, maxWidth: number): string[] {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(next, fontSize);
    if (width <= maxWidth) line = next;
    else {
      if (line) out.push(line);
      line = w;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

export async function htmlToPdfTextFallback(args: { html: string; title?: string }): Promise<{ blob: Blob; text: string }> {
  const text = stripToTextWithBreaks(args.html);

  // Generate a text-first PDF (print-safe + OCR-friendly).
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  const pageSize: [number, number] = [612, 792]; // US Letter
  const margin = 54;
  const fontSize = 10.5;
  const lineHeight = 14;

  let page = doc.addPage(pageSize);
  let y = page.getHeight() - margin;
  const maxWidth = page.getWidth() - margin * 2;

  const drawLine = (s: string, opts?: { bold?: boolean }) => {
    if (y < margin + lineHeight) {
      page = doc.addPage(pageSize);
      y = page.getHeight() - margin;
    }
    page.drawText(s, {
      x: margin,
      y,
      size: opts?.bold ? 12 : fontSize,
      font: opts?.bold ? fontBold : font,
      color: rgb(0.05, 0.05, 0.05),
      maxWidth,
    });
    y -= lineHeight;
  };

  const title = (args.title || '').trim();
  if (title) {
    drawLine(title, { bold: true });
    drawLine('');
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      drawLine('');
      continue;
    }
    const wrapped = wrapLine(font, fontSize, line, maxWidth);
    wrapped.forEach((w) => drawLine(w));
  }

  const bytes = await doc.save();
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: 'application/pdf' });
  return { blob, text };
}

