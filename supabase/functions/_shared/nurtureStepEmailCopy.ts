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
      case 'strategy_session_welcome':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nThank you for booking a Finely strategy call. Have your latest report, top 3 goals, and funding timeline ready.` };
      case 'agency_signup_welcome':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour agency workspace is live. Configure branding and partner intake today.` };
      case 'lead_magnet_welcome_au_seller':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour AU seller workspace is ready. Review compliance before your first listing.` };
      case 'invoice_sent':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYour Finely Cred invoice is ready in the portal billing section.` };
      case 'invoice_reminder':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nFriendly reminder — an open invoice is waiting in your portal billing section.` };
      case 'cold_prospect_d0':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nI came across your company and thought Finely Cred's partner path might fit.\n\nBook: ${session}\n\nReply STOP or use unsubscribe below anytime.` };
      case 'cold_prospect_d2':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nTwo-minute next step: skim partner one-sheets, then book if it clicks.\n\n${session}` };
      case 'cold_prospect_d5':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nSharing the partner offer overview again — no pressure.\n\nBook when ready: ${session}` };
      case 'cold_prospect_d7':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nLast note from this sequence — grab a free strategy session if useful.\n\n${session}` };
      case 'offer_pack_send':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nHere is your partner offer pack.\n\nBook: ${session}` };
      case 'offer_pack_followup':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nAny questions on the offer pack? Reply or book: ${session}` };
      case 'booked_session_confirm':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nYou are booked for a Finely strategy session. Have your latest report and top 3 goals ready.` };
      case 'booked_session_prep':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nPrep checklist: (1) latest credit report, (2) top 3 goals, (3) collector or court letters.` };
      case 'partner_onboard_welcome':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nWelcome, partner. Your portal is ready — start with intake, then upload a report when you have one.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_onboard_day3':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nDay 3 tip: finish intake, upload evidence/report, open Ask Finely if stuck.\n\nResults vary · not legal advice.` };
      case 'partner_onboard_day7':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nWeek-1 checklist: confirm goals, review the restore command strip, queue your first letter draft if ready.\n\nResults vary · not legal advice.` };
      case 'partner_onboard_day14':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nMid-month check-in: open your dashboard for the next obvious step.\n\nBook: ${session}\n\nResults vary · not legal advice.` };
      case 'partner_onboard_day21':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nEducation tip: prioritize utilization and accurate reporting dates before stacking new products.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_onboard_day30':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\n30-day wrap — book a free session if helpful:\n\n${session}\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_edu_m1':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nPartner education: utilization and reporting cycles.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_edu_m2':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nPartner education: disputes vs documentation — use factual findings from bureau screenshots.\n\nResults vary · not legal advice.` };
      case 'partner_edu_m3':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nPartner education: funding readiness basics.\n\nFunding subject to underwriting · results vary · not legal advice · not income guarantees.` };
      case 'partner_edu_m4':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nPartner education: business credit sequencing.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_birthday':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nHappy birthday from the Finely Cred team.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_opp_au_intro':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nOptional opportunity: authorized-user tradelines — no outcome guaranteed.\n\nBook: ${session}\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_opp_au_day3':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nAU tip: posting windows, account age, and utilization matter. Educational only.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_opp_au_day7':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nQuestions on AU? Book a free session:\n\n${session}\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_opp_aff_intro':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nOptional opportunity: partner affiliate toolkit. Income is not guaranteed.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_opp_aff_day3':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nAffiliate tip: partner-first wording, never promise scores or earnings.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'partner_opp_aff_day7':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nAffiliate Q&A — book a short call:\n\n${session}\n\nResults vary · not legal advice · not income guarantees.` };
      case 'specialist_keepwarm_welcome':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nCredit Specialist keep-warm: focus on pipeline hygiene and factual findings first.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'specialist_keepwarm_day14':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nSpecialist tip: clear stalled tasks before adding new partners.\n\nResults vary · not legal advice · not income guarantees.` };
      case 'specialist_keepwarm_day30':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nPlaybook refresh: cite what is visible on bureau screenshots.\n\nResults vary · not legal advice.` };
      case 'specialist_keepwarm_day60':
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nKeep-warm check-in for active specialists.\n\n${session}\n\nResults vary · not legal advice · not income guarantees.` };
      default:
        return { subject: subjectDefault, text: `Hi ${firstName},\n\nFollow-up from ${args.sequence.name}.` };
    }
  })();

  return { subject: copy.subject, text: `${copy.text}${footer}` };
}
