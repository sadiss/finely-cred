import type { CommsTemplate } from '../domain/comms';
import { listCommsTemplates, upsertCommsTemplate } from './commsRepo';
import {
  buildAnalysisPreviewBlock,
  buildCreditAdvantageCards,
  buildDefaultEmailFooter,
  buildNegativeTeaserRows,
  buildPrimaryCtaButton,
  buildTrustStrip,
  wrapFinelyEmailHtml,
} from '../comms/prebuiltHtmlEmailLayout';
import { WELCOME_EMAIL_SUBJECT_STARTER, WELCOME_HTML_STARTER } from '../comms/templateVariables';
import { defaultSignatureHtml } from './emailDomainsRepo';

function nowIso() {
  return new Date().toISOString();
}

const SIGNUP_WELCOME_BODY = `<p style="margin:0 0 16px;">Hi {{firstName}},</p>
<p style="margin:0 0 16px;">Welcome to <strong>{{brand.name}}</strong>. Your free guide is ready — plus a preview of how we turn bureau data into dispute-ready action plans.</p>
${buildCreditAdvantageCards()}
${buildAnalysisPreviewBlock()}
${buildPrimaryCtaButton({ label: 'Download your guide', href: '{{links.dashboard}}' })}
${buildTrustStrip()}`;

const ANALYSIS_DELIVERY_BODY = `<p style="margin:0 0 16px;">Hi {{firstName}},</p>
<p style="margin:0 0 16px;">Your personalized credit analysis is ready in the portal. Below is a preview of your highest-impact dispute targets.</p>
${buildNegativeTeaserRows([
  { account: 'Example Collection Co', type: 'Collection', severity: 86, why: 'Past-due $1,240 · DOFD recent' },
  { account: 'Example Card Bank', type: 'Charge-Off', severity: 90, why: 'Cross-bureau status mismatch' },
  { account: 'Example Auto Lender', type: 'Late Payment', severity: 68, why: '6 derog months in last 24' },
])}
${buildPrimaryCtaButton({ label: 'Open full analysis report', href: '{{links.reports}}' })}
<p style="margin:16px 0 0;font-size:14px;color:#475569;">Your PDF includes ranked negatives, evidence checklists, and a round-by-round roadmap.</p>`;

const NURTURE_DAY1_BODY = `<p style="margin:0 0 16px;">Hi {{firstName}},</p>
<p style="margin:0 0 16px;">Day 1 of your score recovery path: upload your latest 3-bureau report (HTML export preferred). We'll flag charge-offs, collections, and late payments ranked by impact.</p>
${buildCreditAdvantageCards()}
${buildPrimaryCtaButton({ label: 'Upload your report', href: '{{links.reports}}' })}
${buildSecondaryLink()}`;

function buildSecondaryLink() {
  return `<p style="margin:12px 0 0;"><a href="{{links.portal}}" style="color:#6366f1;font-weight:600;text-decoration:none;">Open your portal →</a></p>`;
}

const PREBUILT_TEMPLATES: Array<Omit<CommsTemplate, 'createdAt' | 'updatedAt'> & { createdAt?: string }> = [
  {
    id: 'tpl_signup_welcome_credit',
    name: 'Signup welcome — credit restoration',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Your dispute guide + portal trial are ready, {{firstName}}',
    bodyTemplate: wrapFinelyEmailHtml({
      headline: 'Welcome, {{firstName}}',
      subheadline: 'Your guide, portal trial, and personalized analysis path.',
      bodyHtml: SIGNUP_WELCOME_BODY,
      signatureHtml: defaultSignatureHtml('Taylor Morgan', 'Credit Strategy Advisor', '(888) 555-0142'),
      footerHtml: buildDefaultEmailFooter('{{partner.profile.email}}'),
      headerTheme: 'gold',
    }),
    tags: ['marketing', 'signup', 'html', 'seed'],
    meta: { contentType: 'html', emailDomainId: 'domain_finely_primary' },
  },
  {
    id: 'tpl_analysis_report_delivery',
    name: 'Analysis report delivery',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Your credit analysis is ready, {{firstName}}',
    bodyTemplate: wrapFinelyEmailHtml({
      headline: 'Your analysis report is ready',
      subheadline: 'Ranked negatives, evidence checklists, and next steps.',
      bodyHtml: ANALYSIS_DELIVERY_BODY,
      signatureHtml: defaultSignatureHtml('Taylor Morgan', 'Credit Strategy Advisor'),
      footerHtml: buildDefaultEmailFooter('{{partner.profile.email}}'),
      headerTheme: 'slate',
    }),
    tags: ['transactional', 'reports', 'html', 'seed'],
    meta: { contentType: 'html', emailDomainId: 'domain_finely_primary' },
  },
  {
    id: 'tpl_nurture_day1_credit_html',
    name: 'Nurture day 1 — upload report',
    channel: 'email',
    enabled: true,
    subjectTemplate: 'Day 1: upload your report, {{firstName}}',
    bodyTemplate: wrapFinelyEmailHtml({
      headline: 'Start with your report upload',
      subheadline: 'We rank negatives by impact — not guesswork.',
      bodyHtml: NURTURE_DAY1_BODY,
      signatureHtml: defaultSignatureHtml('Taylor Morgan', 'Credit Strategy Advisor'),
      footerHtml: buildDefaultEmailFooter('{{partner.profile.email}}'),
      headerTheme: 'emerald',
    }),
    tags: ['nurture', 'marketing', 'html', 'seed'],
    meta: { contentType: 'html', emailDomainId: 'domain_finely_primary' },
  },
  {
    id: 'tpl_portal_welcome_html',
    name: 'Portal welcome banner (HTML)',
    channel: 'email',
    enabled: true,
    subjectTemplate: WELCOME_EMAIL_SUBJECT_STARTER,
    bodyTemplate: wrapFinelyEmailHtml({
      headline: 'Welcome back, {{user.firstName}}',
      bodyHtml: WELCOME_HTML_STARTER.replace(/^<div[^>]*>/, '').replace(/<\/div>$/, ''),
      signatureHtml: defaultSignatureHtml('Taylor Morgan', 'Credit Strategy Advisor'),
      footerHtml: buildDefaultEmailFooter('{{user.email}}'),
      headerTheme: 'violet',
    }),
    tags: ['welcome', 'portal', 'html', 'seed'],
    meta: { contentType: 'html', emailDomainId: 'domain_finely_primary' },
  },
];

/** Seed polished HTML templates into Comms Studio (idempotent). */
export function ensureCommsHtmlTemplatesOnce() {
  const existing = new Map(listCommsTemplates().map((t) => [t.id, t]));
  let changed = false;
  const ts = nowIso();

  for (const tpl of PREBUILT_TEMPLATES) {
    const cur = existing.get(tpl.id);
    if (cur && cur.meta?.seedLocked) continue;
    if (cur && !tpl.tags?.includes('seed')) continue;
    if (cur && cur.bodyTemplate.length > 200 && cur.updatedAt > '2020-01-01') {
      // Preserve admin edits unless template is still placeholder-sized
      if (!cur.bodyTemplate.includes('{{body}}') && cur.bodyTemplate.includes('<!DOCTYPE html>')) continue;
    }
    upsertCommsTemplate({
      ...tpl,
      createdAt: cur?.createdAt ?? tpl.createdAt ?? ts,
      updatedAt: ts,
      meta: { ...(cur?.meta ?? {}), ...(tpl.meta ?? {}), seededAt: ts },
    });
    changed = true;
  }

  return changed;
}

export function countCommsHtmlTemplates() {
  ensureCommsHtmlTemplatesOnce();
  const html = listCommsTemplates().filter((t) => t.meta?.contentType === 'html' || t.bodyTemplate.includes('<!DOCTYPE html>'));
  return { total: html.length, prebuilt: PREBUILT_TEMPLATES.length };
}
