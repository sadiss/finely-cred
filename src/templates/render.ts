import type { RenderedTemplate, TemplateRenderContext, TemplateTone } from '../domain/templates';
import type { TemplateVariantRecipe } from '../domain/templates';
import { getTemplateBase } from './index';

function stripHtml(html: string): string {
  // Minimal HTML -> text for export/preview.
  const withNewlines = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|h1|h2|h3|li|tr)>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '');
  const text = withNewlines.replace(/<[^>]+>/g, '');
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function renderTemplate(args: {
  baseId: string;
  variant: TemplateVariantRecipe;
  ctx: TemplateRenderContext;
  version: number;
  tone: TemplateTone;
}): RenderedTemplate {
  const base = getTemplateBase(args.baseId);
  if (!base) throw new Error(`Template not found: ${args.baseId}`);
  const v = Math.max(1, Math.min(base.versions, Math.round(args.version || 1)));
  const html = base.renderHtml({ ...args.ctx, version: v, tone: args.tone, variant: args.variant });
  const text = stripHtml(html);
  return {
    baseId: base.id,
    title: base.title,
    category: base.category,
    variantId: args.variant.id,
    version: v,
    tone: args.tone,
    html,
    text,
  };
}

