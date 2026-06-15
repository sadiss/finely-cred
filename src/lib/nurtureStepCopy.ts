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
      default:
        return {
          subject: args.stepSubject ?? `Finely Cred — ${args.sequence.name}`,
          text: `Hi ${ctx.firstName},\n\nFollow-up from ${args.sequence.name} (${id}).`,
        };
    }
  })();

  return { subject: copy.subject, text: `${copy.text}${footer}` };
}
