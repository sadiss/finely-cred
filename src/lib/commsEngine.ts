import type { CommsSendLog, CommsTemplate } from '../domain/comms';
import type { Partner } from '../domain/partners';
import { buildMessageContext } from '../comms/buildMessageContext';
import { newId } from '../utils/ids';
import { renderTextTemplate } from '../utils/textTemplate';
import { addCommsSend } from '../data/commsRepo';
import { createThread, getOrCreateThreadBySubject, addThreadMessage } from '../data/supportRepo';
import type { SupportTopic } from '../domain/support';
import { sendEmail, sendSms } from './commsDeliveryClient';
import { buildMarketingEmailFooter, buildMarketingEmailHtmlFooter } from './commsUnsubscribeFooter';

function nowIso() {
  return new Date().toISOString();
}

export function buildDefaultCommsContext(args: { partner: Partner; extra?: Record<string, any> }) {
  return buildMessageContext({ partner: args.partner, extra: args.extra });
}

export function renderCommsTemplate(args: { template: CommsTemplate; ctx: Record<string, any> }) {
  const subject = args.template.subjectTemplate ? renderTextTemplate(args.template.subjectTemplate, args.ctx) : '';
  const body = renderTextTemplate(args.template.bodyTemplate, args.ctx);
  return { subject, body };
}

export function sendPortalFromTemplate(args: {
  template: CommsTemplate;
  partner: Partner;
  ctx?: Record<string, any>;
  dryRun?: boolean;
}): { ok: boolean; log: CommsSendLog } {
  const tpl = args.template;
  const ctx = args.ctx ?? buildDefaultCommsContext({ partner: args.partner });
  const rendered = renderCommsTemplate({ template: tpl, ctx });
  const topic = (tpl.topic ?? 'general') as SupportTopic;
  const subject = (rendered.subject || tpl.name || 'Message').trim() || 'Message';
  const body = (rendered.body || '').trim();

  const log: CommsSendLog = {
    id: newId('send'),
    templateId: tpl.id,
    channel: 'portal',
    partnerId: args.partner.id,
    to: args.partner.id,
    createdAt: nowIso(),
    status: args.dryRun ? 'dry_run' : 'sent',
    subject,
    body,
    meta: { topic, threadStrategy: tpl.threadStrategy ?? 'append_by_subject' },
  };

  if (!body) {
    const out = addCommsSend({ ...log, status: 'error', error: 'Body rendered empty' });
    return { ok: false, log: out };
  }

  if (args.dryRun) {
    const out = addCommsSend(log);
    return { ok: true, log: out };
  }

  try {
    if ((tpl.threadStrategy ?? 'append_by_subject') === 'new_thread') {
      createThread({
        partnerId: args.partner.id,
        topic,
        subject,
        initialMessage: { fromPartner: false, body },
      });
    } else {
      const thread = getOrCreateThreadBySubject({ partnerId: args.partner.id, topic, subject, reuseClosed: false });
      addThreadMessage({ threadId: thread.id, partnerId: args.partner.id, topic, fromPartner: false, body });
    }
    const out = addCommsSend(log);
    return { ok: true, log: out };
  } catch (e: any) {
    const out = addCommsSend({ ...log, status: 'error', error: e?.message || 'Send failed' });
    return { ok: false, log: out };
  }
}

export async function sendEmailFromTemplate(args: {
  template: CommsTemplate;
  partner: Partner;
  ctx?: Record<string, any>;
  dryRun?: boolean;
}): Promise<{ ok: boolean; log: CommsSendLog }> {
  const tpl = args.template;
  const ctx = args.ctx ?? buildDefaultCommsContext({ partner: args.partner });
  const rendered = renderCommsTemplate({ template: tpl, ctx });
  const subject = (rendered.subject || tpl.name || 'Message').trim() || 'Message';
  let body = (rendered.body || '').trim();
  const toEmail = (args.partner.profile.email || '').trim();
  const isMarketing = (tpl.tags ?? []).some((t) => t === 'nurture' || t === 'marketing');
  const contentType = (tpl.meta?.contentType as string) || (tpl.bodyTemplate.includes('<') ? 'html' : 'text');
  const isHtml = contentType === 'html' || tpl.bodyTemplate.includes('<!DOCTYPE html>');
  if (isMarketing && body) {
    if (isHtml && !body.toLowerCase().includes('unsubscribe')) {
      body = body.replace(
        /<\/body>\s*<\/html>\s*$/i,
        `${buildMarketingEmailHtmlFooter({ email: toEmail })}</body></html>`,
      );
    } else if (!isHtml && !body.toLowerCase().includes('unsubscribe')) {
      body = `${body}${buildMarketingEmailFooter({ email: toEmail })}`;
    }
  }

  const base: CommsSendLog = {
    id: newId('send'),
    templateId: tpl.id,
    channel: 'email',
    partnerId: args.partner.id,
    to: toEmail || args.partner.id,
    createdAt: nowIso(),
    status: args.dryRun ? 'dry_run' : 'sent',
    subject,
    body,
  };

  if (!toEmail) {
    const out = addCommsSend({ ...base, status: 'error', error: 'Partner email missing' });
    return { ok: false, log: out };
  }
  if (!body) {
    const out = addCommsSend({ ...base, status: 'error', error: 'Body rendered empty' });
    return { ok: false, log: out };
  }

  if (args.dryRun) {
    const out = addCommsSend(base);
    return { ok: true, log: out };
  }

  try {
    const emailDomainId = (tpl.meta?.emailDomainId as string) || undefined;
    await sendEmail({
      toEmail,
      toName: args.partner.profile.fullName,
      subject,
      text: isHtml ? body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : body,
      html: isHtml ? body : undefined,
      emailDomainId,
    });
    const out = addCommsSend(base);
    return { ok: true, log: out };
  } catch (e: any) {
    const out = addCommsSend({ ...base, status: 'error', error: e?.message || 'Email send failed' });
    return { ok: false, log: out };
  }
}

export async function sendSmsFromTemplate(args: {
  template: CommsTemplate;
  partner: Partner;
  ctx?: Record<string, any>;
  dryRun?: boolean;
}): Promise<{ ok: boolean; log: CommsSendLog }> {
  const tpl = args.template;
  const ctx = args.ctx ?? buildDefaultCommsContext({ partner: args.partner });
  const rendered = renderCommsTemplate({ template: tpl, ctx });
  const body = (rendered.body || '').trim();
  const toPhone = (args.partner.profile.phone || '').trim();

  const base: CommsSendLog = {
    id: newId('send'),
    templateId: tpl.id,
    channel: 'sms',
    partnerId: args.partner.id,
    to: toPhone || args.partner.id,
    createdAt: nowIso(),
    status: args.dryRun ? 'dry_run' : 'sent',
    subject: undefined,
    body,
  };

  if (!toPhone) {
    const out = addCommsSend({ ...base, status: 'error', error: 'Partner phone missing' });
    return { ok: false, log: out };
  }
  if (!body) {
    const out = addCommsSend({ ...base, status: 'error', error: 'Body rendered empty' });
    return { ok: false, log: out };
  }

  if (args.dryRun) {
    const out = addCommsSend(base);
    return { ok: true, log: out };
  }

  try {
    await sendSms({ toPhone, body });
    const out = addCommsSend(base);
    return { ok: true, log: out };
  } catch (e: any) {
    const out = addCommsSend({ ...base, status: 'error', error: e?.message || 'SMS send failed' });
    return { ok: false, log: out };
  }
}

/** Bulk-send a portal template to many partners. */
export function bulkSendPortalFromTemplate(args: {
  template: CommsTemplate;
  partners: Partner[];
  dryRun?: boolean;
}): { sent: number; failed: number; logs: CommsSendLog[] } {
  const logs: CommsSendLog[] = [];
  let sent = 0;
  let failed = 0;
  for (const partner of args.partners) {
    try {
      const res = sendPortalFromTemplate({ template: args.template, partner, dryRun: args.dryRun });
      logs.push(res.log);
      if (res.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }
  return { sent, failed, logs };
}

