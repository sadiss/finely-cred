/** Edge-safe nurture email copy — mirrors src/lib/nurtureStepCopy.ts */
import type { NurtureSequenceCatalog, NurtureStepCatalog } from './nurtureSequencesCatalog.ts';

function firstNameFrom(context: Record<string, unknown>) {
  const raw = String(context.fullName ?? context.name ?? '').trim();
  if (raw) return raw.split(/\s+/)[0]!;
  return 'there';
}

function appBaseUrl() {
  return (Deno.env.get('APP_BASE_URL') || Deno.env.get('VITE_APP_BASE_URL') || 'https://app.finelycred.com').replace(/\/+$/, '');
}

function buildMarketingEmailFooter(args?: { email?: string; personaName?: string }) {
  const persona = args?.personaName ?? 'Finely Cred';
  const email = (args?.email || '').trim().toLowerCase();
  const unsub = email ? `${appBaseUrl()}/unsubscribe?email=${encodeURIComponent(email)}` : `${appBaseUrl()}/unsubscribe`;
  return `\n\n— ${persona}\nFinely Cred · Educational only · not legal advice\nUnsubscribe: ${unsub}`;
}

function sessionUrl(context: Record<string, unknown>, funnelId: string) {
  const email = String(context.email ?? '').trim();
  const name = String(context.fullName ?? context.name ?? '');
  const focus = funnelId.includes('debt') ? 'debt' : funnelId.includes('business') ? 'business' : 'credit';
  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (name) params.set('name', name);
  params.set('focus', focus);
  return `${appBaseUrl()}/enlightenment-session?${params.toString()}`;
}

export function buildNurtureStepEmail(args: {
  step: NurtureStepCatalog;
  sequence: NurtureSequenceCatalog;
  context: Record<string, unknown>;
}): { subject: string; text: string } {
  const firstName = firstNameFrom(args.context);
  const guideTitle = String(args.context.guideTitle ?? 'your free resource');
  const email = String(args.context.email ?? '').trim();
  const funnelPath = String(args.context.funnelPath ?? '/free-guide');
  const successUrl = `${appBaseUrl()}${funnelPath.startsWith('/') ? funnelPath : `/${funnelPath}`}/success`;
  const session = sessionUrl(args.context, args.sequence.funnelId);
  const footer = buildMarketingEmailFooter({ email: email || undefined, personaName: args.step.personaName });
  const id = args.step.templateId;
  const subjectDefault = args.step.subject ?? `Finely Cred — ${args.sequence.name}`;

  const copy = (() => {
    switch (id) {
      case 'lead_magnet_welcome_credit':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour ${guideTitle} is ready. You also unlocked a limited DIY portal trial.` };
      case 'lead_magnet_day1_credit':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nStart with the round-1 dispute checklist.\n\nBonus score roadmap: ${successUrl}` };
      case 'lead_magnet_checklist_credit':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nOpen your portal trial and run the AI checklist.` };
      case 'lead_magnet_book_session':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nBook your free session:\n\n${session}` };
      case 'lead_magnet_trial_ending':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour portal trial is ending — save your progress or upgrade.` };
      case 'lead_magnet_welcome_debt':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour debt validation playbook is ready.` };
      case 'lead_magnet_day1_debt':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nDay 1: validation vs verification — know the difference.` };
      case 'lead_magnet_summons_debt':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nIf a summons arrived, document dates and respond within your state's window.` };
      case 'lead_magnet_debt_call':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nBook a free debt strategy session:\n\n${session}` };
      case 'lead_magnet_welcome_business':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour business credit kit covers entity hygiene and vendor sequencing.` };
      case 'lead_magnet_day1_business':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nDay 1: confirm EIN, business address, and banking separation.` };
      case 'lead_magnet_duns_business':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nNext: establish D-U-N-S visibility and stack vendor lines.` };
      case 'lead_magnet_funding_call':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nBook a funding advisor session:\n\n${session}` };
      case 'lead_magnet_welcome_tradeline':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour tradeline insider guide is ready.` };
      case 'lead_magnet_day1_tradeline':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nDay 1: primary vs authorized user paths.` };
      case 'lead_magnet_welcome_score_roadmap':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour personalized score roadmap is ready.` };
      case 'lead_magnet_day1_score_roadmap':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nDay 1: bring revolving utilization under 30% on each card.` };
      case 'lead_magnet_welcome_agency':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour agency white-label kit is ready.` };
      case 'lead_magnet_day1_agency':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nDay 1 for agencies: align partner terminology and lane routing.` };
      case 'lead_magnet_welcome_specialist':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nSpecialist program toolkit preview — dispute workflows and evidence vault.` };
      case 'lead_magnet_day1_specialist':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nStart with factual findings on the file before drafting letters.` };
      case 'lead_magnet_welcome_affiliate':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour affiliate toolkit is ready — referral links and compliant promo templates.` };
      case 'lead_magnet_day1_affiliate':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nDay 1: use partner-first language in every promo.` };
      case 'lead_magnet_welcome_meta':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nThanks for reaching out via our Meta ad — your resource is ready.` };
      case 'lead_magnet_day1_meta':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nBased on your interest, start with the guide you requested.` };
      case 'lead_magnet_meta_session':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nBook your free Finely session:\n\n${session}` };
      case 'lead_magnet_welcome_generic':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nWelcome to Finely Cred — explore your portal preview.` };
      case 'lead_magnet_followup_generic':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nQuick check-in — reply with your #1 goal and we'll point you to the right lane.` };
      case 'ebook_purchase_welcome':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour purchase is in My Library.` };
      case 'ebook_chapter1_audio':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nTry listen mode for chapter 1.` };
      case 'ebook_related_course':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nWe picked a related course module — open My Library to continue.` };
      case 'tradeline_purchase_welcome':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour tradeline package is active — complete intake in your portal.` };
      case 'tradeline_posting_reminder':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nTime to re-pull your credit report — tradelines often post 30–45 days after enrollment.` };
      default:
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nFollow-up from ${args.sequence.name}.` };
    }
  })();

  return { subject: copy.subject, text: `${copy.text}${footer}` };
}
