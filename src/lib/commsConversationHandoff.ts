import type { SupportMessage, SupportThread } from '../domain/support';
import { listMessagesByThread } from '../data/supportRepo';

export type CommsComposeHandoff = {
  channel: 'email' | 'sms' | 'portal';
  partnerId: string;
  threadId: string;
  subject: string;
  body: string;
  to?: string;
  templateHints: string[];
  staffRoleHint?: string;
  relatedCaseId?: string;
  topic?: string;
};

function summarizeThread(messages: SupportMessage[], max = 8): string {
  return messages
    .slice(-max)
    .map((m) => {
      const who = m.fromPartner ? 'Partner' : 'Team';
      return `[${who}] ${m.body}`;
    })
    .join('\n\n');
}

function inferTemplateHints(thread: SupportThread, messages: SupportMessage[]): string[] {
  const text = [thread.subject, ...messages.map((m) => m.body)].join(' ').toLowerCase();
  const hints: string[] = [];
  if (text.includes('round 1') || text.includes('r1')) hints.push('tpl_dispute_r1_mailed', 'sms_dispute_r1_mailed');
  if (text.includes('round 2')) hints.push('tpl_dispute_r2_ready', 'sms_round2_ready');
  if (text.includes('round 3') || text.includes('round 4')) hints.push('tpl_dispute_r3_escalation_path', 'tpl_dispute_r4_final_push');
  if (text.includes('response') || text.includes('bureau')) hints.push('tpl_dispute_r1_response_received', 'sms_response_received');
  if (text.includes('cfpb') || text.includes('complaint')) hints.push('tpl_cfpb_filed_update', 'sms_complaint_filed');
  if (text.includes('bankruptcy') || text.includes('chapter 7') || text.includes('chapter 13')) {
    hints.push('tpl_bk_fresh_start_ch7', 'tpl_bk_ch13_cure', 'sms_bk_nurture');
  }
  if (text.includes('foreclosure') || text.includes('save your home') || text.includes('home retention')) {
    hints.push('tpl_bk_save_home', 'sms_bk_home_urgent');
  }
  if (text.includes('discharge') || text.includes('post-bankruptcy')) {
    hints.push('tpl_bk_post_discharge_credit', 'sms_bk_nurture');
  }
  if (text.includes('harassment') || text.includes('automatic stay')) {
    hints.push('tpl_bk_stop_harassment', 'sms_bk_nurture');
  }
  if (thread.topic === 'debt_summons') {
    hints.push('tpl_bk_fresh_start_ch7', 'sms_bk_home_urgent', 'sms_bk_nurture');
  }
  if (text.includes('billing') || text.includes('payment')) hints.push('sms_billing_past_due');
  if (thread.topic === 'disputes') hints.push('tpl_specialist_intro');
  if (!hints.length) hints.push('tpl_specialist_weekly_checkin');
  return Array.from(new Set(hints));
}

export function buildComposeHandoffFromThread(args: {
  thread: SupportThread;
  channel: 'email' | 'sms' | 'portal';
  partnerId: string;
}): CommsComposeHandoff {
  const messages = listMessagesByThread(args.thread.id);
  const transcript = summarizeThread(messages);
  const hints = inferTemplateHints(args.thread, messages);
  const subject = args.channel === 'sms' ? '' : `Re: ${args.thread.subject}`;
  const bodyPrefix =
    args.channel === 'sms'
      ? ''
      : `Hi {{firstName}},\n\nFollowing up on our conversation in your ${args.thread.topic} thread:\n\n`;
  const body =
    args.channel === 'sms'
      ? `Finely Cred follow-up re: ${args.thread.subject.slice(0, 60)}. Reply in portal for details. STOP to opt out.`
      : `${bodyPrefix}---\nThread context (internal reference):\n${transcript.slice(0, 2000)}\n---\n\n[Your message here]\n\nRespectfully,\n{{staffOnDuty}}`;

  return {
    channel: args.channel,
    partnerId: args.partnerId,
    threadId: args.thread.id,
    subject,
    body,
    templateHints: hints,
    staffRoleHint:
      args.thread.topic === 'disputes'
        ? 'dispute_specialist'
        : args.thread.topic === 'debt_summons'
          ? 'bankruptcy_specialist'
          : 'credit_specialist',
    relatedCaseId: args.thread.relatedCaseId,
    topic: args.thread.topic,
  };
}

export function commsStudioUrlFromHandoff(h: CommsComposeHandoff): string {
  const params = new URLSearchParams({
    room: 'compose',
    channel: h.channel,
    partnerId: h.partnerId,
    threadId: h.threadId,
  });
  if (h.relatedCaseId) params.set('caseId', h.relatedCaseId);
  if (h.templateHints[0]) params.set('templateId', h.templateHints[0]);
  return `/admin/comms?${params.toString()}`;
}

export function saveComposeHandoffDraft(h: CommsComposeHandoff) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('finely.comms.composeHandoff', JSON.stringify(h));
}

export function loadComposeHandoffDraft(): CommsComposeHandoff | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('finely.comms.composeHandoff');
    return raw ? (JSON.parse(raw) as CommsComposeHandoff) : null;
  } catch {
    return null;
  }
}

export function clearComposeHandoffDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('finely.comms.composeHandoff');
}
