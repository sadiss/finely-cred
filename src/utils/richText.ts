import { normalizeLetterBlockSpacing } from '../lib/letterBodySafety';

export function isProbablyHtml(s: string): boolean {
  const v = (s || '').trim();
  if (!v) return false;
  // Very small heuristic: if it looks like markup, treat as HTML.
  if (v.startsWith('<') && v.includes('>')) return true;
  if (v.includes('<p') || v.includes('<div') || v.includes('<br') || v.includes('<ul') || v.includes('<ol')) return true;
  return false;
}

function escHtml(s: string) {
  return (s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Normalize draft text to editor-ready HTML. */
export function ensureHtmlDraft(s: string): string {
  const v = (s || '').trim();
  if (!v) return '<p></p>';
  return isProbablyHtml(v) ? v : plainTextToHtml(v);
}

/** Convert plain text (with newlines) into simple paragraph HTML. */
export function plainTextToHtml(text: string): string {
  const raw = normalizeLetterBlockSpacing((text || '').replaceAll('\r\n', '\n'));
  const blocks = raw.split(/\n{2,}/g);
  const html = blocks
    .map((b) => {
      const t = b.trimEnd();
      if (!t.trim()) return '<p><br /></p>';
      const withBr = escHtml(t).replaceAll('\n', '<br />');
      return `<p>${withBr}</p>`;
    })
    .join('');
  return html || '<p><br /></p>';
}

/** A conservative sanitizer for rendering editor HTML inside the app. */
export function sanitizeHtmlForPreview(html: string): string {
  const input = (html || '').trim();
  if (!input) return '';
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html');

    // Remove dangerous elements.
    const kill = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'];
    for (const tag of kill) {
      doc.querySelectorAll(tag).forEach((n) => n.remove());
    }

    // Strip event handlers + risky URLs.
    doc.querySelectorAll('*').forEach((el) => {
      // remove on* handlers
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const val = (attr.value || '').trim();
        if (name.startsWith('on')) el.removeAttribute(attr.name);
        if (name === 'style') {
          // Keep app styling consistent; don't allow inline styles from user/html imports.
          el.removeAttribute(attr.name);
        }
        if ((name === 'href' || name === 'src') && /^javascript:/i.test(val)) {
          el.removeAttribute(attr.name);
        }
      }
    });

    return doc.body.innerHTML || '';
  } catch {
    // If parsing fails, fall back to escaping (render as text).
    return `<p>${escHtml(input)}</p>`;
  }
}

/** Convert editor HTML into plain-text suitable for PDF generators. Preserves line breaks and spacing. */
export function htmlToPlainText(html: string): string {
  const input = (html || '').trim();
  if (!input) return '';
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html');

    doc.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach((n) => n.remove());

    const BLOCK = new Set([
      'p',
      'div',
      'section',
      'article',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'pre',
      'header',
      'footer',
    ]);
    const LIST = new Set(['ul', 'ol']);

    const parts: string[] = [];

    const convert = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent ?? '');
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'br') {
        parts.push('\n');
        return;
      }

      if (tag === 'hr') {
        parts.push('\n\n');
        return;
      }

      if (tag === 'li') {
        parts.push('- ');
        for (const child of Array.from(el.childNodes)) convert(child);
        parts.push('\n');
        return;
      }

      if (LIST.has(tag)) {
        for (const child of Array.from(el.childNodes)) convert(child);
        parts.push('\n');
        return;
      }

      const isBlock = BLOCK.has(tag);
      if (isBlock) parts.push('\n');

      for (const child of Array.from(el.childNodes)) convert(child);

      if (isBlock) parts.push('\n');
    };

    for (const child of Array.from(doc.body.childNodes)) convert(child);

    const joined = parts
      .join('')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
    return normalizeLetterBlockSpacing(joined);
  } catch {
    return (html || '').replaceAll('\r\n', '\n').trim();
  }
}

