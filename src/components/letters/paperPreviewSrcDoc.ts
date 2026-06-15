export function injectPrintSafeCss(args: { html: string; extraCss?: string }): string {
  const css = `
    *{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#fff!important;color:#111!important}
    body{font-family:ui-serif,Georgia,Times,'Times New Roman',serif}
    a{color:#0f766e}
    img,svg,canvas,video{max-width:100%;height:auto}
    @media (prefers-color-scheme: dark){
      html,body{background:#fff!important;color:#111!important}
    }
  `.trim();
  const injection = `<style>${css}\n${String(args.extraCss || '').trim()}</style>`;
  const html = String(args.html || '');
  if (!html) return '';

  // Insert into existing <head> when possible.
  if (html.includes('</head>')) return html.replace('</head>', `${injection}</head>`);

  // If they gave a full document without head, add one.
  if (html.includes('<html')) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${injection}</head>`);
  }

  // Fallback: wrap.
  return `<!doctype html><html><head><meta charset="utf-8" />${injection}</head><body>${html}</body></html>`;
}

