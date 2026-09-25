import { ensureHaitianCommsTemplatesOnce } from '../data/commsHaitianTemplatesSeed';
import { getCommsTemplate } from '../data/commsRepo';
import { renderCommsTemplate } from './commsEngine';
import { buildMarketingEmailFooter } from './commsUnsubscribeFooter';
import { htmlFromPlainEmail } from '../comms/prebuiltHtmlEmailLayout';

function firstNameFrom(context: Record<string, unknown>) {
  const raw = String(context.fullName ?? context.name ?? '').trim();
  if (raw) return raw.split(/\s+/)[0]!;
  return 'there';
}

/** Render seq_kreyol_funnel steps from commsHaitianTemplatesSeed (EN templates). */
export function buildHaitianNurtureStepEmail(args: {
  templateId: string;
  context: Record<string, unknown>;
  stepSubject?: string;
  personaName: string;
}): { subject: string; text: string; html: string } {
  ensureHaitianCommsTemplatesOnce();
  const template = getCommsTemplate(args.templateId);
  const firstName = firstNameFrom(args.context);
  const email = String(args.context.email ?? '').trim();
  const ctx = {
    firstName,
    fullName: String(args.context.fullName ?? args.context.name ?? firstName),
    email,
    partner: { profile: { email: 'support@finelycred.com' } },
    links: {
      calendar: 'https://finelycred.com/enlightenment-session',
      portal: 'https://finelycred.com/portal/haitian',
    },
  };

  if (template) {
    const rendered = renderCommsTemplate({ template, ctx });
    const subject = args.stepSubject ?? rendered.subject ?? 'Finely Cred — Haitian community';
    const footer = buildMarketingEmailFooter({ email: email || undefined, personaName: args.personaName });
    const isHtml = template.bodyTemplate.includes('<!DOCTYPE html>') || template.meta?.contentType === 'html';
    const html = isHtml ? rendered.body : htmlFromPlainEmail({ headline: subject, text: rendered.body, email: email || undefined });
    const text = isHtml
      ? `Hi ${firstName},\n\nHaitian community follow-up from Finely Cred.${footer}`
      : `${rendered.body}${footer}`;
    return { subject, text, html };
  }

  const fallbackText = `Hi ${firstName},\n\nHaitian community follow-up from Finely Cred.`;
  const footer = buildMarketingEmailFooter({ email: email || undefined, personaName: args.personaName });
  const subject = args.stepSubject ?? 'Finely Cred — Haitian community';
  return {
    subject,
    text: `${fallbackText}${footer}`,
    html: htmlFromPlainEmail({ headline: subject, text: fallbackText, email: email || undefined }),
  };
}

export function isHaitianNurtureTemplateId(templateId: string): boolean {
  return templateId.startsWith('tpl_haitian_');
}
