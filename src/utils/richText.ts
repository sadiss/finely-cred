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

/** Convert plain text (with newlines) into simple paragraph HTML. */
export function plainTextToHtml(text: string): string {
  const raw = (text || '').replaceAll('\r\n', '\n');
  const blocks = raw.split(/\n{2,}/g);
  const html = blocks
    .map((b) => {
      const t = b.trimEnd();
      if (!t.trim()) return '<p></p>';
      const withBr = escHtml(t).replaceAll('\n', '<br />');
      return `<p>${withBr}</p>`;
    })
    .join('');
  return html || '<p></p>';
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

/** Convert editor HTML into plain-text suitable for PDF generators. */
export function htmlToPlainText(html: string): string {
  const input = (html || '').trim();
  if (!input) return '';
  try {
    const doc = new DOMParser().parseFromString(input, 'text/html');

    // Remove hidden / non-content nodes.
    doc.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach((n) => n.remove());

    const out: string[] = [];
    const pushText = (t: string) => {
      const cleaned = t.replace(/\s+/g, ' ').trim();
      if (cleaned) out.push(cleaned);
    };
    const pushNewline = () => {
      // Avoid runaway blank lines.
      if (out.length === 0) return;
      if (out[out.length - 1] !== '\n') out.push('\n');
    };

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        pushText(node.textContent || '');
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'br') {
        pushNewline();
        return;
      }
      if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article') {
        // paragraph-ish blocks
        for (const child of Array.from(el.childNodes)) walk(child);
        pushNewline();
        pushNewline();
        return;
      }
      if (tag === 'li') {
        // list item: "- item"
        out.push('-');
        out.push(' ');
        for (const child of Array.from(el.childNodes)) walk(child);
        pushNewline();
        return;
      }
      if (tag === 'ul' || tag === 'ol') {
        for (const child of Array.from(el.childNodes)) walk(child);
        pushNewline();
        return;
      }
      if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
        for (const child of Array.from(el.childNodes)) walk(child);
        pushNewline();
        pushNewline();
        return;
      }

      for (const child of Array.from(el.childNodes)) walk(child);
    };

    walk(doc.body);

    // Join tokens, then normalize newlines/spaces.
    const joined = out.join('');
    return joined
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return (html || '').replaceAll('\r\n', '\n').trim();
  }
}

