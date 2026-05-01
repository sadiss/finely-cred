export function getPath(obj: any, path: string): any {
  const parts = (path || '')
    .split('.')
    .map((p) => p.trim())
    .filter(Boolean);
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function truthy(v: any): boolean {
  if (!v) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return Boolean(v);
}

function renderBlocks(template: string, ctx: Record<string, any>, depth = 0): string {
  if (depth > 10) return template; // safety
  let out = String(template ?? '');

  // each blocks
  out = out.replace(/\{\{#each\s+([a-zA-Z0-9_.-]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, rawPath, body) => {
    const arr = getPath(ctx, String(rawPath));
    if (!Array.isArray(arr) || arr.length === 0) return '';
    return arr
      .slice(0, 200)
      .map((item, index) => {
        const innerCtx = { ...ctx, this: item, item, index };
        return renderBlocks(String(body), innerCtx, depth + 1);
      })
      .join('');
  });

  // if blocks
  out = out.replace(/\{\{#if\s+([a-zA-Z0-9_.-]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, rawPath, body) => {
    const v = getPath(ctx, String(rawPath));
    if (!truthy(v)) return '';
    return renderBlocks(String(body), ctx, depth + 1);
  });

  // unless blocks
  out = out.replace(/\{\{#unless\s+([a-zA-Z0-9_.-]+)\s*\}\}([\s\S]*?)\{\{\/unless\}\}/g, (_, rawPath, body) => {
    const v = getPath(ctx, String(rawPath));
    if (truthy(v)) return '';
    return renderBlocks(String(body), ctx, depth + 1);
  });

  return out;
}

export function renderTextTemplate(template: string, ctx: Record<string, any>): string {
  const t0 = renderBlocks(String(template ?? ''), ctx, 0);
  return t0.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, raw) => {
    const v = getPath(ctx, String(raw));
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  });
}

export function extractTemplateVars(template: string): string[] {
  const t = String(template ?? '');
  const set = new Set<string>();
  for (const m of t.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g)) {
    const raw = String(m[1] ?? '').trim();
    if (raw) set.add(raw);
  }
  for (const m of t.matchAll(/\{\{#(if|unless|each)\s+([a-zA-Z0-9_.-]+)\s*\}\}/g)) {
    const raw = String(m[2] ?? '').trim();
    if (raw) set.add(raw);
  }
  return Array.from(set).sort();
}

