import type { User } from '@supabase/supabase-js';
import type { PostLoginWelcomeSettings } from '../domain/settings';
import type { Partner } from '../domain/partners';
import { buildMessageContext } from '../comms/buildMessageContext';
import { getCommsTemplate } from '../data/commsRepo';
import { getSiteSettings } from '../data/settingsRepo';
import { renderTextTemplate } from '../utils/textTemplate';

export type WelcomeMessageRendered = {
  headline: string;
  body: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaPath?: string;
  mode: 'simple' | 'html' | 'comms';
  enabled: boolean;
};

const DEFAULT_WELCOME: PostLoginWelcomeSettings = {
  enabled: true,
  mode: 'simple',
  headline: 'Welcome back, {{firstName}}',
  body: 'Your dashboard is ready. Upload a credit report when you can — we’ll turn it into disputes, evidence, and next steps automatically.',
  ctaLabel: 'Upload a report',
  ctaPath: '/portal/reports',
};

export function getWelcomeConfig(overrides?: Partial<PostLoginWelcomeSettings>): PostLoginWelcomeSettings {
  const site = getSiteSettings();
  return { ...DEFAULT_WELCOME, ...(site.postLoginWelcome ?? {}), ...(overrides ?? {}) };
}

export function getRenderedWelcomeMessage(args: {
  user: User | null | undefined;
  partner?: Partner | null;
  overrides?: Partial<PostLoginWelcomeSettings>;
}): WelcomeMessageRendered {
  const cfg = getWelcomeConfig(args.overrides);
  const ctx = buildMessageContext({ user: args.user, partner: args.partner });
  const mode = cfg.mode || 'simple';
  const enabled = cfg.enabled !== false;

  if (mode === 'comms' && cfg.commsTemplateId) {
    const tpl = getCommsTemplate(cfg.commsTemplateId);
    const body = tpl ? renderTextTemplate(tpl.bodyTemplate, ctx) : '';
    const headline = tpl?.subjectTemplate ? renderTextTemplate(tpl.subjectTemplate, ctx) : renderTextTemplate(cfg.headline || DEFAULT_WELCOME.headline!, ctx);
    return {
      enabled,
      mode: 'comms',
      headline,
      body: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      bodyHtml: body,
      ctaLabel: cfg.ctaLabel ? renderTextTemplate(cfg.ctaLabel, ctx) : undefined,
      ctaPath: cfg.ctaPath?.trim() || undefined,
    };
  }

  if (mode === 'html' && cfg.htmlTemplate) {
    const html = renderTextTemplate(cfg.htmlTemplate, ctx);
    return {
      enabled,
      mode: 'html',
      headline: cfg.headline ? renderTextTemplate(cfg.headline, ctx) : 'Welcome',
      body: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      bodyHtml: html,
      ctaLabel: cfg.ctaLabel ? renderTextTemplate(cfg.ctaLabel, ctx) : undefined,
      ctaPath: cfg.ctaPath?.trim() || undefined,
    };
  }

  return {
    enabled,
    mode: 'simple',
    headline: renderTextTemplate(cfg.headline || DEFAULT_WELCOME.headline!, ctx),
    body: renderTextTemplate(cfg.body || DEFAULT_WELCOME.body!, ctx),
    ctaLabel: cfg.ctaLabel ? renderTextTemplate(cfg.ctaLabel, ctx) : undefined,
    ctaPath: cfg.ctaPath?.trim() || undefined,
  };
}

export function welcomeDismissKey(userId: string | undefined): string {
  return `finely.welcome.dismissed.v1::${userId || 'anon'}`;
}

export function isWelcomeDismissed(userId: string | undefined): boolean {
  try {
    return localStorage.getItem(welcomeDismissKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function dismissWelcome(userId: string | undefined): void {
  try {
    localStorage.setItem(welcomeDismissKey(userId), '1');
  } catch {
    // ignore
  }
}

/** Rendered welcome email subject/body for Comms Studio or automated sends. */
export function getWelcomeEmailContent(args: {
  user: User | null | undefined;
  partner?: Partner | null;
}): { subject: string; text: string; html?: string } | null {
  const cfg = getWelcomeConfig();
  if (!cfg.sendWelcomeEmail) return null;
  const ctx = buildMessageContext(args);
  const subject = renderTextTemplate(cfg.emailSubject || 'Welcome to {{brand.name}}', ctx);
  const rendered = getRenderedWelcomeMessage(args);
  return {
    subject,
    text: rendered.body,
    html: rendered.bodyHtml,
  };
}

// Legacy short-alias helper for simple {{firstName}} replacements
export function renderWelcomeTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

export { buildMessageContext };
