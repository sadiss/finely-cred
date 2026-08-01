import type { NurtureSequenceDef } from '../domain/nurtureSequences';
import { buildMarketingEmailFooter } from './commsUnsubscribeFooter';
import { buildEnlightenmentSessionUrl, buildFunnelSuccessUrl, focusFromFunnelId } from './funnelPublicLinks';

export type NurtureEmailContext = {
  firstName?: string;
  guideTitle?: string;
  personaName: string;
  sequenceName: string;
};

function firstNameFrom(context: Record<string, unknown>) {
  const raw = String(context.fullName ?? context.name ?? '').trim();
  if (raw) return raw.split(/\s+/)[0]!;
  return 'there';
}

export function buildNurtureStepEmail(args: {
  templateId: string;
  sequence: NurtureSequenceDef;
  context: Record<string, unknown>;
  personaName: string;
  stepSubject?: string;
}): { subject: string; text: string } {
  const ctx: NurtureEmailContext = {
    firstName: firstNameFrom(args.context),
    guideTitle: String(args.context.guideTitle ?? 'your free resource'),
    personaName: args.personaName,
    sequenceName: args.sequence.name,
  };
  const id = args.templateId;
  const email = String(args.context.email ?? '').trim();
  const funnelPath = String(args.context.funnelPath ?? '/free-guide');
  const sessionUrl = buildEnlightenmentSessionUrl({
    email: email || undefined,
    name: String(args.context.fullName ?? args.context.name ?? ''),
    focus: focusFromFunnelId(args.sequence.funnelId),
  });
  const successUrl = buildFunnelSuccessUrl(funnelPath);
  const footer = buildMarketingEmailFooter({ email: email || undefined, personaName: ctx.personaName });

  const copy = (() => {
    switch (id) {
      case 'lead_magnet_welcome_credit':
        return {
          subject: args.stepSubject ?? 'Your dispute guide + portal trial are ready',
          text: `Hi ${ctx.firstName},\n\nYour ${ctx.guideTitle} is ready. You also unlocked a limited DIY portal trial — upload a report and preview the restoration checklist.`,
        };
      case 'lead_magnet_day1_credit':
        return {
          subject: args.stepSubject ?? 'Page 1 of your dispute guide — start here',
          text: `Hi ${ctx.firstName},\n\nStart with the round-1 dispute checklist: identify inaccurate items, gather proof, and mail with tracking.\n\nBonus score roadmap on your success page: ${successUrl}`,
        };
      case 'lead_magnet_checklist_credit':
        return {
          subject: args.stepSubject ?? 'Run the AI restoration checklist',
          text: `Hi ${ctx.firstName},\n\nOpen your portal trial and run the AI checklist — it surfaces the highest-impact disputes first.`,
        };
      case 'lead_magnet_book_session':
        return {
          subject: args.stepSubject ?? 'Book your free strategy call',
          text: `Hi ${ctx.firstName},\n\nReady for a live walkthrough? Book your free session and we'll map your next 90 days.\n\n${sessionUrl}`,
        };
      case 'lead_magnet_trial_ending':
        return {
          subject: args.stepSubject ?? 'Your DIY trial ends soon',
          text: `Hi ${ctx.firstName},\n\nYour portal trial is ending — save your progress or upgrade to keep your dispute workspace active.`,
        };
      case 'lead_magnet_welcome_debt':
        return {
          subject: args.stepSubject ?? 'Your debt validation playbook is ready',
          text: `Hi ${ctx.firstName},\n\nYour debt validation playbook is ready — validation vs verification, summons awareness, and documentation habits.`,
        };
      case 'lead_magnet_day1_debt':
        return {
          subject: args.stepSubject ?? 'Validation vs verification — know the difference',
          text: `Hi ${ctx.firstName},\n\nDay 1 focus: understand validation requests vs verification disputes — they trigger different collector obligations.`,
        };
      case 'lead_magnet_summons_debt':
        return {
          subject: args.stepSubject ?? 'If you received a summons — read this first',
          text: `Hi ${ctx.firstName},\n\nIf a summons arrived, document dates, respond within your state's window, and seek licensed counsel for legal strategy.`,
        };
      case 'lead_magnet_debt_call':
        return {
          subject: args.stepSubject ?? 'Talk with a debt strategist (free session)',
          text: `Hi ${ctx.firstName},\n\nBook a free debt strategy session — we'll review your validation options and next safe steps.`,
        };
      case 'lead_magnet_welcome_business':
        return {
          subject: args.stepSubject ?? 'Your business credit jumpstart kit',
          text: `Hi ${ctx.firstName},\n\nYour business credit kit covers entity hygiene, vendor sequencing, and funding readiness basics.`,
        };
      case 'lead_magnet_day1_business':
        return {
          subject: args.stepSubject ?? 'Entity hygiene checklist — day 1',
          text: `Hi ${ctx.firstName},\n\nDay 1: confirm EIN, business address, and banking separation before applying for vendor accounts.`,
        };
      case 'lead_magnet_duns_business':
        return {
          subject: args.stepSubject ?? 'D-U-N-S and vendor credit sequencing',
          text: `Hi ${ctx.firstName},\n\nNext: establish D-U-N-S visibility and stack 3–5 vendor lines that report to business bureaus.`,
        };
      case 'lead_magnet_funding_call':
        return {
          subject: args.stepSubject ?? 'Book a funding advisor session',
          text: `Hi ${ctx.firstName},\n\nBook a funding advisor session — we'll map tradeline + lending readiness for your entity.`,
        };
      case 'lead_magnet_welcome_tradeline':
        return {
          subject: args.stepSubject ?? 'Your tradeline insider guide',
          text: `Hi ${ctx.firstName},\n\nYour tradeline insider guide explains primary vs authorized user paths and posting timelines.`,
        };
      case 'lead_magnet_day1_tradeline':
        return {
          subject: args.stepSubject ?? 'Primary vs authorized user — start here',
          text: `Hi ${ctx.firstName},\n\nDay 1: decide whether primary installment tradelines or AU boosts fit your profile and goals.`,
        };
      case 'lead_magnet_welcome_score_roadmap':
        return {
          subject: args.stepSubject ?? 'Your 5-step score roadmap is ready',
          text: `Hi ${ctx.firstName},\n\nYour personalized score roadmap is ready — utilization, mix, and timing sequenced into the 700s.`,
        };
      case 'lead_magnet_day1_score_roadmap':
        return {
          subject: args.stepSubject ?? 'Utilization first — day 1 priorities',
          text: `Hi ${ctx.firstName},\n\nDay 1 focus: bring revolving utilization under 30% on each card before chasing new accounts.`,
        };
      case 'lead_magnet_welcome_agency':
        return {
          subject: args.stepSubject ?? 'Your agency growth kit is ready',
          text: `Hi ${ctx.firstName},\n\nYour agency white-label kit is ready — partner OS overview, onboarding checklist, and compliant promo copy.`,
        };
      case 'lead_magnet_day1_agency':
        return {
          subject: args.stepSubject ?? 'Partner onboarding checklist — day 1',
          text: `Hi ${ctx.firstName},\n\nDay 1 for agencies: align partner terminology, intake consents, and lane routing before scaling outreach.`,
        };
      case 'lead_magnet_welcome_specialist':
        return {
          subject: args.stepSubject ?? 'Specialist program toolkit preview',
          text: `Hi ${ctx.firstName},\n\nThanks for applying to the specialist network — your toolkit preview covers dispute workflows, evidence vault, and partner activation.`,
        };
      case 'lead_magnet_day1_specialist':
        return {
          subject: args.stepSubject ?? 'AI dispute workflow primer — start here',
          text: `Hi ${ctx.firstName},\n\nStart with factual findings on the file — what each bureau reports — before drafting letters.`,
        };
      case 'lead_magnet_welcome_affiliate':
        return {
          subject: args.stepSubject ?? 'Your affiliate toolkit is ready',
          text: `Hi ${ctx.firstName},\n\nYour affiliate toolkit is ready — referral links, QR kits, and compliant promo templates for partners.`,
        };
      case 'lead_magnet_day1_affiliate':
        return {
          subject: args.stepSubject ?? 'Compliant promo templates — day 1',
          text: `Hi ${ctx.firstName},\n\nDay 1: use partner-first language in every promo — never promise specific score outcomes.`,
        };
      case 'lead_magnet_welcome_meta':
        return {
          subject: args.stepSubject ?? 'Thanks for connecting on Facebook',
          text: `Hi ${ctx.firstName},\n\nThanks for reaching out via our Meta ad — your resource is ready and a Finely advisor can walk you through next steps.`,
        };
      case 'lead_magnet_day1_meta':
        return {
          subject: args.stepSubject ?? 'Your personalized credit roadmap',
          text: `Hi ${ctx.firstName},\n\nBased on your interest, start with the guide you requested — then reply if you'd like a free strategy session.`,
        };
      case 'lead_magnet_meta_session':
        return {
          subject: args.stepSubject ?? 'Book your free Finely session',
          text: `Hi ${ctx.firstName},\n\nSpots open this week for a free strategy call — bring your top credit or funding question.`,
        };
      case 'lead_magnet_welcome_generic':
        return {
          subject: args.stepSubject ?? 'Welcome to Finely Cred',
          text: `Hi ${ctx.firstName},\n\nWelcome to Finely Cred — explore your portal preview and download your free resources.`,
        };
      case 'lead_magnet_followup_generic':
        return {
          subject: args.stepSubject ?? 'Your next step with Finely Cred',
          text: `Hi ${ctx.firstName},\n\nQuick check-in — did you get a chance to review your guide? Reply with your #1 goal and we'll point you to the right lane.`,
        };
      case 'ebook_purchase_welcome':
        return {
          subject: args.stepSubject ?? 'Your book is in My Library',
          text: `Hi ${ctx.firstName},\n\nYour purchase is in My Library — read online or switch to listen mode for chapter narration.`,
        };
      case 'ebook_chapter1_audio':
        return {
          subject: args.stepSubject ?? 'Listen to chapter 1 while you read',
          text: `Hi ${ctx.firstName},\n\nTry listen mode for chapter 1 — human-quality narration from Finely Voice Studio.`,
        };
      case 'ebook_related_course':
        return {
          subject: args.stepSubject ?? 'Related course you might like',
          text: `Hi ${ctx.firstName},\n\nBased on your book, we picked a related course module — open My Library to continue learning.`,
        };
      case 'tradeline_purchase_welcome':
        return {
          subject: args.stepSubject ?? 'Your tradeline package is active',
          text: `Hi ${ctx.firstName},\n\nYour tradeline package is active — complete intake in your portal so posting can begin on schedule.`,
        };
      case 'tradeline_posting_reminder':
        return {
          subject: args.stepSubject ?? 'Time to re-pull your report',
          text: `Hi ${ctx.firstName},\n\nIt's time to re-pull your credit report — AU and primary tradelines often post 30–45 days after enrollment.`,
        };
      case 'strategy_session_welcome':
        return {
          subject: args.stepSubject ?? 'Your strategy call is booked — here\'s how to prep',
          text: `Hi ${ctx.firstName},\n\nThank you for booking a Finely strategy call. Have your latest report, top 3 goals, and funding timeline ready.\n\nPortal: ${successUrl}`,
        };
      case 'agency_signup_welcome':
        return {
          subject: args.stepSubject ?? 'Your agency workspace is live',
          text: `Hi ${ctx.firstName},\n\nYour agency workspace is live. Configure branding, team seats, and client intake in the admin console today.`,
        };
      case 'lead_magnet_welcome_au_seller':
        return {
          subject: args.stepSubject ?? 'Welcome — AU seller workspace',
          text: `Hi ${ctx.firstName},\n\nYour AU seller workspace is ready. Review the compliance checklist before submitting your first listing.`,
        };
      case 'cold_prospect_d0':
        return {
          subject: args.stepSubject ?? 'Quick idea for your business credit path',
          text: `Hi ${ctx.firstName},\n\nI came across your company and thought Finely Cred's partner path (business credit + funding readiness) might fit.\n\nIf useful: ${sessionUrl}\n\nReply STOP or use unsubscribe below anytime.`,
        };
      case 'cold_prospect_d2':
        return {
          subject: args.stepSubject ?? 'A short next step (2 minutes)',
          text: `Hi ${ctx.firstName},\n\nTwo-minute next step: skim our partner one-sheets, then book a free strategy session if it clicks.\n\nOne-sheets: https://finelycred.com/resources/business-credit-one-sheets\nBook: ${sessionUrl}`,
        };
      case 'cold_prospect_d5':
        return {
          subject: args.stepSubject ?? 'Partner one-sheets + session option',
          text: `Hi ${ctx.firstName},\n\nSharing the partner offer overview again — tiers are plain English, no pressure.\n\nBook when ready: ${sessionUrl}`,
        };
      case 'cold_prospect_d7':
        return {
          subject: args.stepSubject ?? 'Book a free strategy session',
          text: `Hi ${ctx.firstName},\n\nLast note from this sequence — grab a free strategy session if you want a human walkthrough.\n\n${sessionUrl}`,
        };
      case 'offer_pack_send':
        return {
          subject: args.stepSubject ?? 'Your Finely Cred offer pack',
          text: `Hi ${ctx.firstName},\n\nHere is your partner offer pack — pricing tiers and one-sheets for business credit / restore paths.\n\nPricing: https://finelycred.com/pricing/business-credit\nOne-sheets: https://finelycred.com/resources/business-credit-one-sheets\nBook: ${sessionUrl}`,
        };
      case 'offer_pack_followup':
        return {
          subject: args.stepSubject ?? 'Questions on the offer pack?',
          text: `Hi ${ctx.firstName},\n\nAny questions on the offer pack? Reply to this email or book a short session: ${sessionUrl}`,
        };
      case 'booked_session_confirm':
        return {
          subject: args.stepSubject ?? 'You are booked — prep for your Finely session',
          text: `Hi ${ctx.firstName},\n\nYou are booked for a Finely strategy session. Have your latest report, top 3 goals, and funding timeline ready.\n\nPortal: ${successUrl}\nReschedule / book link: ${sessionUrl}`,
        };
      case 'booked_session_prep':
        return {
          subject: args.stepSubject ?? 'Prep checklist for your session',
          text: `Hi ${ctx.firstName},\n\nPrep checklist: (1) latest credit report, (2) top 3 goals, (3) any collector or court letters. See you on the call.`,
        };
      case 'invoice_sent':
        return {
          subject: args.stepSubject ?? 'Your Finely Cred invoice',
          text: `Hi ${ctx.firstName},\n\nYour Finely Cred invoice is ready in the portal billing section.`,
        };
      case 'invoice_reminder':
        return {
          subject: args.stepSubject ?? 'Invoice reminder',
          text: `Hi ${ctx.firstName},\n\nFriendly reminder — an open invoice is waiting in your portal billing section.`,
        };
      case 'partner_onboard_welcome':
        return {
          subject: args.stepSubject ?? 'Welcome to your Finely Cred portal',
          text: `Hi ${ctx.firstName},\n\nWelcome, partner. Your portal is ready — start with intake, then upload a report when you have one.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_onboard_day3':
        return {
          subject: args.stepSubject ?? 'Your first 3 portal moves',
          text: `Hi ${ctx.firstName},\n\nDay 3 tip: (1) finish intake, (2) upload evidence or a report, (3) open Ask Finely if you are stuck.\n\nResults vary · not legal advice.`,
        };
      case 'partner_onboard_day7':
        return {
          subject: args.stepSubject ?? 'Week-1 checklist for partners',
          text: `Hi ${ctx.firstName},\n\nWeek-1 checklist: confirm goals, review the restore command strip, and queue your first letter draft if ready.\n\nResults vary · not legal advice.`,
        };
      case 'partner_onboard_day14':
        return {
          subject: args.stepSubject ?? 'Mid-month progress check',
          text: `Hi ${ctx.firstName},\n\nMid-month check-in: open your dashboard for the next obvious step. Reply if you want a human walkthrough.\n\nBook: ${sessionUrl}\n\nResults vary · not legal advice.`,
        };
      case 'partner_onboard_day21':
        return {
          subject: args.stepSubject ?? 'Education tip: what to focus on next',
          text: `Hi ${ctx.firstName},\n\nEducation tip: prioritize utilization and accurate reporting dates before stacking new products.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_onboard_day30':
        return {
          subject: args.stepSubject ?? '30-day wrap — book a free session if helpful',
          text: `Hi ${ctx.firstName},\n\n30-day wrap: if you want a specialist to review your file, book a free session.\n\n${sessionUrl}\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_edu_m1':
        return {
          subject: args.stepSubject ?? 'Partner education: utilization & reporting cycles',
          text: `Hi ${ctx.firstName},\n\nThis month's partner education: utilization and reporting cycles — keep revolving balances intentional before statement close.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_edu_m2':
        return {
          subject: args.stepSubject ?? 'Partner education: disputes vs documentation',
          text: `Hi ${ctx.firstName},\n\nPartner education: disputes work best with factual findings tied to what you can see on the bureau screenshots — not generic delete commands.\n\nResults vary · not legal advice.`,
        };
      case 'partner_edu_m3':
        return {
          subject: args.stepSubject ?? 'Partner education: funding readiness basics',
          text: `Hi ${ctx.firstName},\n\nPartner education: funding readiness — entity hygiene, banking separation, and clean personal credit often move together.\n\nFunding subject to underwriting · results vary · not legal advice · not income guarantees.`,
        };
      case 'partner_edu_m4':
        return {
          subject: args.stepSubject ?? 'Partner education: business credit sequencing',
          text: `Hi ${ctx.firstName},\n\nPartner education: business credit sequencing — vendors before high-limit cards, and never skip EIN / address consistency.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_birthday':
        return {
          subject: args.stepSubject ?? 'Happy birthday from Finely Cred',
          text: `Hi ${ctx.firstName},\n\nHappy birthday from the Finely Cred team. Wishing you a strong year ahead — open your portal anytime for the next step on your plan.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_opp_au_intro':
        return {
          subject: args.stepSubject ?? 'Optional path: authorized-user tradelines',
          text: `Hi ${ctx.firstName},\n\nOptional opportunity (marketing): authorized-user tradelines can support some restore plans when structured carefully. No outcome is guaranteed.\n\nLearn more in your portal or book: ${sessionUrl}\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_opp_au_day3':
        return {
          subject: args.stepSubject ?? 'How AU tradelines fit a restore plan',
          text: `Hi ${ctx.firstName},\n\nAU tip: posting windows, primary account age, and utilization all matter. This is educational — not a promise of score change.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_opp_au_day7':
        return {
          subject: args.stepSubject ?? 'Questions on AU? Book a free session',
          text: `Hi ${ctx.firstName},\n\nQuestions on AU tradelines? Book a free session and we will map fit vs skip.\n\n${sessionUrl}\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_opp_aff_intro':
        return {
          subject: args.stepSubject ?? 'Optional path: partner affiliate toolkit',
          text: `Hi ${ctx.firstName},\n\nOptional opportunity: share Finely Cred with your network using compliant partner language. Income is not guaranteed.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_opp_aff_day3':
        return {
          subject: args.stepSubject ?? 'Compliant sharing tips for partners',
          text: `Hi ${ctx.firstName},\n\nAffiliate tip: use partner-first wording, never promise specific scores or earnings, and always include results-vary language.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'partner_opp_aff_day7':
        return {
          subject: args.stepSubject ?? 'Affiliate Q&A — book a short call',
          text: `Hi ${ctx.firstName},\n\nWant the affiliate toolkit walkthrough? Book a short call:\n\n${sessionUrl}\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'specialist_keepwarm_welcome':
        return {
          subject: args.stepSubject ?? 'Specialist lane — your weekly focus',
          text: `Hi ${ctx.firstName},\n\nCredit Specialist keep-warm: this week focus on pipeline hygiene — hot replies, booked sessions, and factual dispute findings first.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'specialist_keepwarm_day14':
        return {
          subject: args.stepSubject ?? 'Pipeline hygiene for Credit Specialists',
          text: `Hi ${ctx.firstName},\n\nSpecialist tip: clear stalled tasks before adding new partners. Quality over volume.\n\nResults vary · not legal advice · not income guarantees.`,
        };
      case 'specialist_keepwarm_day30':
        return {
          subject: args.stepSubject ?? 'Playbook refresh: factual findings first',
          text: `Hi ${ctx.firstName},\n\nPlaybook refresh: auto-reasons should cite what is visible on bureau screenshots — never procedural “please verify/delete” language.\n\nResults vary · not legal advice.`,
        };
      case 'specialist_keepwarm_day60':
        return {
          subject: args.stepSubject ?? 'Keep-warm check-in for active specialists',
          text: `Hi ${ctx.firstName},\n\nKeep-warm check-in: open Specialist Command for today’s queue, or book an activation refresh if you are stuck.\n\n${sessionUrl}\n\nResults vary · not legal advice · not income guarantees.`,
        };
      default:
        return {
          subject: args.stepSubject ?? `Finely Cred — ${args.sequence.name}`,
          text: `Hi ${ctx.firstName},\n\nFollow-up from ${args.sequence.name} (${id}).`,
        };
    }
  })();

  return { subject: copy.subject, text: `${copy.text}${footer}` };
}
