import type { TemplateTone, TemplateVariantRecipe } from '../domain/templates';

export function esc(s: string) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fmtDateLong(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function joinLines(lines: Array<string | null | undefined>) {
  return lines.map((x) => (x || '').trim()).filter(Boolean).join('<br/>');
}

export function bulletList(items: string[], variant: TemplateVariantRecipe) {
  const style = variant.format.bulletStyle === 'dashes' ? '— ' : '• ';
  return `<div>${items
    .filter((x) => x.trim())
    .map((x) => `<div>${esc(style)}${esc(x.trim())}</div>`)
    .join('')}</div>`;
}

export function paragraphSpacingStyle(variant: TemplateVariantRecipe) {
  const lh = variant.kind === 'ocr_clean' ? 1.45 : 1.35;
  const ps = variant.format.paragraphSpacing === 'tight' ? 8 : variant.format.paragraphSpacing === 'loose' ? 14 : 11;
  return { lineHeight: lh, paragraphSpacingPx: ps };
}

export function tonePhrases(tone: TemplateTone) {
  if (tone === 'friendly') {
    return {
      request: 'I’m requesting your help to correct the record and ensure my file reflects accurate, verifiable reporting.',
      thanks: 'Thank you for your time and attention.',
    };
  }
  if (tone === 'firm') {
    return {
      request:
        'I demand that you correct or delete the inaccurate reporting and provide written confirmation of the actions taken.',
      thanks: 'I expect your prompt, lawful response within all applicable timelines.',
    };
  }
  return {
    request:
      'Please reinvestigate the item(s) below and correct or delete anything that is inaccurate or cannot be verified.',
    thanks: 'Thank you for your prompt attention — an accurate file matters for my housing, transportation, and credit options.',
  };
}

export function wrapLetterHtml(args: {
  title: string;
  variant: TemplateVariantRecipe;
  bodyHtml: string;
  footerNote?: string;
}) {
  const { lineHeight, paragraphSpacingPx } = paragraphSpacingStyle(args.variant);
  const header =
    args.variant.kind === 'branded_modern'
      ? `<div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:${paragraphSpacingPx}px;">
  <div style="font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Finely Cred</div>
  <div style="font-size:12px;opacity:0.85;">${esc(args.title)}</div>
</div><div style="height:1px;background:#111;opacity:0.25;margin-bottom:${paragraphSpacingPx}px;"></div>`
      : '';

  const footer = args.footerNote
    ? `<div style="margin-top:${paragraphSpacingPx}px;font-size:11px;opacity:0.8;">${esc(args.footerNote)}</div>`
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${esc(args.title)}</title>
</head>
<body style="margin:0;background:#fff;color:#111;font-family:ui-serif,Georgia,Times,'Times New Roman',serif;">
  <div style="max-width:820px;margin:0 auto;padding:40px 44px;line-height:${lineHeight};font-size:13.5px;">
    ${header}
    ${args.bodyHtml}
    ${footer}
  </div>
</body>
</html>`;
}

