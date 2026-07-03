import type { LeadCapture } from '../domain/leads';
import type { PartnerLane } from '../domain/partners';
import type { NurtureSequenceDef } from '../domain/nurtureSequences';
import { getAgentPersona } from '../domain/agentPersonas';
import { getDefaultEmailSignature } from '../data/emailDomainsRepo';
import {
  buildAnalysisPreviewBlock,
  buildCreditAdvantageCards,
  buildCreditHeroBanner,
  buildDefaultEmailFooter,
  buildBrandAccentDivider,
  buildGoldAccentDivider,
  buildPrimaryCtaButton,
  buildSecondaryCtaLink,
  buildTrustStrip,
  buildWelcomeJourneySteps,
  wrapFinelyEmailHtml,
  FINELY_EMAIL,
} from './prebuiltHtmlEmailLayout';
import {
  buildEnlightenmentSessionUrl,
  buildFunnelSuccessUrl,
  focusFromFunnelId,
  getPublicSiteOrigin,
} from '../lib/funnelPublicLinks';

export type SignupWelcomeEmailContent = {
  subject: string;
  text: string;
  html: string;
  emailDomainId?: string;
  signatureId?: string;
};

function baseTextFooter(personaName: string) {
  return `\n\n— ${personaName}\nFinely Cred · Educational only · not legal advice`;
}

/** Map portal onboarding lane → dedicated welcome email funnel id. */
export function funnelIdForPartnerLane(lane?: PartnerLane): string {
  switch (lane) {
    case 'affiliate':
      return 'portal_affiliate';
    case 'agent':
      return 'portal_agent';
    case 'au_tradelines':
      return 'portal_au_seller';
    case 'business_credit':
      return 'portal_business';
    case 'debt_kill':
      return 'portal_debt';
    case 'primary_tradeline':
      return 'portal_tradeline';
    case 'funding_readiness':
      return 'portal_funding';
    default:
      return 'portal_client';
  }
}

export function buildSignupWelcomeEmail(args: {
  lead: LeadCapture;
  sequence: NurtureSequenceDef;
  guideTitle?: string;
  downloadUrl?: string;
  emailDomainId?: string;
  /** Override sequence funnel id (portal roles, purchases, agency). */
  overrideFunnelId?: string;
  portalPath?: string;
}): SignupWelcomeEmailContent {
  const persona = getAgentPersona(args.sequence.agentPersonaId);
  const first = args.lead.fullName.split(' ')[0] || 'there';
  const guide = args.guideTitle || 'your free resource';
  const funnelPath = args.lead.funnelPath || '/free-guide';
  const download = args.downloadUrl ?? '';
  const portalUrl = `${getPublicSiteOrigin()}${args.portalPath ?? '/portal/dashboard'}`;
  const funnelId = args.overrideFunnelId ?? args.sequence.funnelId;
  const session = buildEnlightenmentSessionUrl({
    email: args.lead.email,
    name: args.lead.fullName,
    phone: args.lead.phone,
    leadId: args.lead.id,
    focus: focusFromFunnelId(funnelId),
  });
  const successPage = buildFunnelSuccessUrl(funnelPath);
  const personaName = persona?.name ?? 'Finely Cred';
  const domainId = args.emailDomainId ?? 'domain_finely_primary';
  const signature = getDefaultEmailSignature(domainId);

  const funnelCopy = resolveFunnelCopy({
    funnelId,
    first,
    guide,
    download,
    session,
    successPage,
    portalUrl,
    personaName,
  });

  const primaryHref = download || funnelCopy.primaryHref || portalUrl;

  const bodyHtml = `
    ${buildCreditHeroBanner({
      headline: funnelCopy.heroHeadline ?? 'Restore · Dispute · Fund',
      subline: funnelCopy.heroSubline ?? 'Your personalized credit path starts here',
    })}
    <p style="margin:0 0 16px;font-size:16px;">Hi ${first},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.65;">${funnelCopy.intro}</p>
    ${funnelCopy.showWelcomeSteps !== false ? buildWelcomeJourneySteps(funnelCopy.welcomeSteps ?? defaultWelcomeSteps(portalUrl)) : ''}
    ${buildBrandAccentDivider()}
    ${funnelCopy.showAdvantageCards !== false ? buildCreditAdvantageCards() : ''}
    ${funnelCopy.showAnalysisPreview !== false ? buildAnalysisPreviewBlock() : ''}
    ${buildPrimaryCtaButton({ label: funnelCopy.primaryCta, href: primaryHref, color: FINELY_EMAIL.emeraldDark })}
    ${buildSecondaryCtaLink({ label: funnelCopy.secondaryCta, href: funnelCopy.secondaryHref ?? session })}
    ${funnelCopy.extraHtml}
    ${buildTrustStrip()}
  `;

  const html = wrapFinelyEmailHtml({
    preheader: funnelCopy.preheader,
    headline: funnelCopy.headline,
    subheadline: funnelCopy.subheadline,
    bodyHtml,
    signatureHtml: signature?.htmlBlock,
    footerHtml: buildDefaultEmailFooter(args.lead.email),
    headerTheme: funnelCopy.headerTheme ?? 'emerald',
  });

  const text = `${funnelCopy.plainText}${baseTextFooter(personaName)}`;

  return {
    subject: funnelCopy.subject,
    text,
    html,
    emailDomainId: domainId,
    signatureId: signature?.id,
  };
}

type FunnelCopy = {
  subject: string;
  headline: string;
  heroHeadline?: string;
  heroSubline?: string;
  subheadline?: string;
  preheader: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  primaryHref?: string;
  secondaryHref?: string;
  extraHtml: string;
  plainText: string;
  showAdvantageCards?: boolean;
  showAnalysisPreview?: boolean;
  showWelcomeSteps?: boolean;
  welcomeSteps?: Array<{ num: string; title: string; body: string }>;
  headerTheme?: 'emerald' | 'gold' | 'slate' | 'violet';
};

function defaultWelcomeSteps(portalUrl: string) {
  return [
    { num: '1', title: 'Open your portal', body: 'Upload a tri-bureau report or monitoring export — we surface the highest-impact items first.' },
    { num: '2', title: 'Run your checklist', body: 'AI-assisted disputes, evidence vault, and letter studio — organized round by round.' },
    { num: '3', title: 'Track every win', body: 'Dashboard, tasks, and messages keep you and your advisor aligned on progress.' },
  ];
}

function resolveFunnelCopy(args: {
  funnelId: string;
  first: string;
  guide: string;
  download: string;
  session: string;
  successPage: string;
  portalUrl: string;
  personaName: string;
}): FunnelCopy {
  const { first, guide, download, session, successPage, portalUrl, personaName } = args;
  const id = args.funnelId;

  const creditDefault: FunnelCopy = {
    subject: 'Your dispute guide + portal trial are ready',
    headline: `${first}, welcome to Finely Cred`,
    heroHeadline: 'Restore · Dispute · Fund',
    heroSubline: 'Your score recovery starts with clarity',
    subheadline: 'Your free guide, score recovery roadmap, and limited DIY portal trial.',
    preheader: 'Download your dispute guide, unlock your portal trial, and book a free strategy call.',
    intro: `Welcome to Finely Cred. Your <strong>${guide}</strong> is ready — and you've unlocked a limited DIY portal trial to upload a report and preview your restoration checklist.`,
    primaryCta: 'Download your guide',
    secondaryCta: 'Book your free strategy call',
    extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Bonus — 5-step score recovery roadmap on your success page: <a href="${successPage}" style="color:#6366f1;">${successPage}</a></p>`,
    plainText: `Hi ${first},\n\nWelcome to Finely Cred. Your ${guide} is ready.\n\nDownload: ${download}\n\nSuccess page: ${successPage}\n\nBook strategy call: ${session}`,
  };

  if (id === 'credit_dispute' || id === 'generic') return creditDefault;

  if (id === 'debt_freedom' || id === 'portal_debt') {
    const portal = id === 'portal_debt';
    return {
      subject: portal ? 'Your debt-restore portal is ready' : 'Your debt validation playbook is ready',
      headline: portal ? `${first}, your portal is live` : `${first}, your playbook is ready`,
      heroHeadline: 'Validate · Document · Resolve',
      heroSubline: 'Clear workflows for debt and summons response',
      subheadline: 'Validation workflows, summons checklists, and documentation discipline.',
      preheader: portal
        ? 'Open your Finely portal — debt workflows, evidence vault, and advisor support.'
        : 'Download your debt validation playbook and book a free strategy session.',
      intro: portal
        ? `Your Finely Cred portal is ready. Upload reports, track validation workflows, and store summons evidence — with advisor <strong>${personaName}</strong> on your side.`
        : `Thanks for requesting <strong>${guide}</strong>. Your PDF is ready — plus a preview of how Finely Cred turns complex credit data into clear next steps.`,
      primaryCta: portal ? 'Open your portal' : 'Download your playbook',
      secondaryCta: 'Book a free debt strategy session',
      primaryHref: portal ? portalUrl : undefined,
      extraHtml: portal
        ? `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Start with Tasks → upload your latest report → run the debt validation checklist.</p>`
        : `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Inside: validation vs verification workflows, summons checklists, and how to document every step with your advisor <strong>${personaName}</strong>.</p>`,
      plainText: portal
        ? `Hi ${first},\n\nYour Finely portal is ready.\n\nOpen portal: ${portalUrl}\n\nBook debt strategy session: ${session}`
        : `Hi ${first},\n\nThanks for requesting ${guide}. Your PDF is ready.\n\nDownload: ${download}\n\nBook session: ${session}`,
    };
  }

  if (id === 'business_credit' || id === 'portal_business') {
    const portal = id === 'portal_business';
    return {
      subject: portal ? 'Your business credit workspace is ready' : 'Your business credit jumpstart kit',
      headline: portal ? `${first}, your business workspace is live` : `${first}, your business credit kit is here`,
      heroHeadline: 'Build · Sequence · Fund',
      heroSubline: 'From entity setup to lender-ready profiles',
      subheadline: 'Entity hygiene, vendor sequencing, and funding readiness basics.',
      preheader: portal
        ? 'Vendor matrices, Paydex tracking, and funding prep — all in one portal.'
        : 'Download your business credit jumpstart kit and explore your portal preview.',
      intro: portal
        ? `Welcome to Finely Cred Business. Your workspace includes vendor tier tracking, entity hygiene checklists, and funding readiness tools — built for operators who want fundable profiles, not hype.`
        : `Your <strong>${guide}</strong> is ready. We built Finely Cred to help you move from scattered bureau data to a fundable business profile.`,
      primaryCta: portal ? 'Open business workspace' : 'Download your kit',
      secondaryCta: 'Book a free funding advisor session',
      primaryHref: portal ? portalUrl : undefined,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">${portal ? `Your dashboard: <a href="${portalUrl}" style="color:#6366f1;">${portalUrl}</a>` : `Portal preview: <a href="${successPage}" style="color:#6366f1;">${successPage}</a>`}</p>`,
      plainText: portal
        ? `Hi ${first},\n\nYour business workspace is ready.\n\nPortal: ${portalUrl}\n\nBook session: ${session}`
        : `Hi ${first},\n\nYour ${guide} is ready.\n\nDownload: ${download}\n\nPortal preview: ${successPage}\n\nBook session: ${session}`,
    };
  }

  if (id === 'tradeline_insider' || id === 'portal_tradeline') {
    const portal = id === 'portal_tradeline';
    return {
      subject: portal ? 'Your tradeline workspace is ready' : 'Your tradeline insider guide',
      headline: portal ? `${first}, tradeline tracking starts now` : `${first}, your tradeline guide is ready`,
      heroHeadline: 'Track · Post · Optimize',
      heroSubline: 'Tradeline strategy with measurable timelines',
      subheadline: 'Primary vs AU tradelines, posting timelines, and result tracking.',
      preheader: portal
        ? 'Inquiry budget tools, posting watch tasks, and tradeline OS — inside your portal.'
        : 'Download your tradeline insider guide and use the inquiry budget calculator.',
      intro: portal
        ? `Your tradeline workspace is live. Track inquiry budgets, monitor posting windows, and document every tradeline with screenshots in your evidence vault — no guesswork.`
        : `Your <strong>${guide}</strong> is ready — plus tools to track tradeline impact without guesswork.`,
      primaryCta: portal ? 'Open tradeline workspace' : 'Download your guide',
      secondaryCta: 'Book a free tradeline session',
      primaryHref: portal ? portalUrl : undefined,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">${portal ? 'Set a 45-day posting watch reminder in Tasks after any new tradeline.' : `Inquiry budget calculator: <a href="${successPage}" style="color:#6366f1;">${successPage}</a>`}</p>`,
      plainText: portal
        ? `Hi ${first},\n\nTradeline workspace: ${portalUrl}\n\nBook session: ${session}`
        : `Hi ${first},\n\nYour ${guide} is ready.\n\nDownload: ${download}\n\nSuccess page: ${successPage}\n\nBook session: ${session}`,
    };
  }

  if (id === 'score_roadmap') {
    return {
      subject: 'Your 5-step score roadmap is ready',
      headline: `${first}, your score roadmap is here`,
      heroHeadline: 'Utilize · Dispute · Fund',
      heroSubline: 'Five moves that compound — in order',
      subheadline: 'Utilization control, dispute hygiene, inquiry discipline, and funding timing.',
      preheader: 'Download your personalized 5-step score recovery roadmap.',
      intro: `Your <strong>${guide}</strong> is ready — a sequenced roadmap that prioritizes utilization, dispute hygiene, and inquiry discipline before any funding applications.`,
      primaryCta: 'Download your roadmap',
      secondaryCta: 'Book a restoration specialist session',
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Follow the steps in order — skipping ahead to funding apps before disputes finish is the #1 self-sabotage pattern we see.</p>`,
      plainText: `Hi ${first},\n\nYour score roadmap is ready.\n\nDownload: ${download}\n\nBook session: ${session}`,
    };
  }

  if (id === 'agency_white_label') {
    return {
      subject: 'Your agency growth kit is ready',
      headline: `${first}, your agency kit is here`,
      heroHeadline: 'Scale · White-label · Comply',
      heroSubline: 'Partner OS for credit service agencies',
      subheadline: 'White-label workflows, client onboarding, and revenue share basics.',
      preheader: 'Download your agency growth kit and explore white-label partner options.',
      intro: `Your <strong>${guide}</strong> is ready — built for agency owners who want compliant client workflows, not duct-tape spreadsheets.`,
      primaryCta: 'Download your agency kit',
      secondaryCta: 'Book a solutions advisor call',
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Ready to spin up a tenant? <a href="${getPublicSiteOrigin()}/agency/signup" style="color:#6366f1;">Create your agency workspace</a></p>`,
      plainText: `Hi ${first},\n\nYour agency kit is ready.\n\nDownload: ${download}\n\nAgency signup: ${getPublicSiteOrigin()}/agency/signup\n\nBook call: ${session}`,
    };
  }

  if (id === 'agency_signup') {
    return {
      subject: 'Your agency workspace is live — let\'s configure it',
      headline: `${first}, welcome to Finely Agency OS`,
      heroHeadline: 'Launch · Brand · Scale',
      heroSubline: 'White-label tenant ready for your team',
      subheadline: 'Branding, seats, compliance workflows, and client onboarding — next steps inside.',
      preheader: 'Your agency tenant is created. Configure branding, team seats, and client workflows.',
      intro: `Congratulations — your agency workspace is live. You now have a white-label tenant with compliance workflows, customer portals, and revenue-share tools. Let's get branding and team seats configured in the next 15 minutes.`,
      primaryCta: 'Open admin console',
      secondaryCta: 'Book agency onboarding call',
      primaryHref: `${getPublicSiteOrigin()}/admin/access`,
      showAnalysisPreview: false,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;"><strong>Day 1 checklist:</strong> set brand name · upload logo · invite first team member · configure client intake form.</p>`,
      plainText: `Hi ${first},\n\nYour agency workspace is live.\n\nAdmin: ${getPublicSiteOrigin()}/admin/access\n\nBook onboarding: ${session}`,
    };
  }

  if (id === 'specialist_apply' || id === 'portal_agent') {
    const portal = id === 'portal_agent';
    return {
      subject: portal ? 'Your specialist portal is ready' : 'Specialist program — application received',
      headline: portal ? `${first}, your specialist workspace is live` : `${first}, we received your application`,
      heroHeadline: portal ? 'Customers · Disputes · Scale' : 'Apply · Train · Activate',
      heroSubline: portal ? 'Credit specialist partner OS' : 'Credit specialist partnership track',
      preheader: portal
        ? 'Customer files, AI dispute workflows, and partnership line — inside your portal.'
        : 'Application received — preview the specialist toolkit while we review.',
      intro: portal
        ? `Your specialist partner portal is ready. Manage customer files, run AI-assisted dispute workflows, and access your dedicated partnership line — built for operators, not hobbyists.`
        : `Thank you for applying to the Finely Cred specialist program. While our team reviews your application, explore the toolkit preview and book an activation call with <strong>${personaName}</strong>.`,
      primaryCta: portal ? 'Open specialist portal' : 'Preview specialist toolkit',
      secondaryCta: 'Book your activation call',
      primaryHref: portal ? portalUrl : `${getPublicSiteOrigin()}/credit-specialist-apply`,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">${portal ? 'Start with Partner Dashboard → upload a sample client report to see the AI workflow.' : 'Typical review time: 2–3 business days. Check your inbox for next steps.'}</p>`,
      plainText: portal
        ? `Hi ${first},\n\nSpecialist portal: ${portalUrl}\n\nBook activation: ${session}`
        : `Hi ${first},\n\nApplication received. Preview: ${getPublicSiteOrigin()}/credit-specialist-apply\n\nBook call: ${session}`,
    };
  }

  if (id === 'affiliate_residual') {
    return {
      subject: 'Your affiliate residual income playbook is ready',
      headline: `${first}, your residual income guide is here`,
      heroHeadline: 'Recurring · Stack · Scale',
      heroSubline: 'Long-tail commissions beyond one-time referrals',
      preheader: 'Download your residual income playbook and model recurring earnings.',
      intro: `Your <strong>${guide}</strong> is ready — how to stack recurring commissions, compliant promo, and long-tail partner income so earnings compound month after month.`,
      primaryCta: 'Download your playbook',
      secondaryCta: 'Talk with affiliate success',
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Apply for full partner status when ready: <a href="${getPublicSiteOrigin()}/affiliate" style="color:#6366f1;">${getPublicSiteOrigin()}/affiliate</a></p>`,
      plainText: `Hi ${first},\n\nPlaybook ready.\n\nDownload: ${download}\n\nApply: ${getPublicSiteOrigin()}/affiliate\n\nBook call: ${session}`,
    };
  }

  if (id === 'affiliate_toolkit' || id === 'portal_affiliate') {
    const portal = id === 'portal_affiliate';
    return {
      subject: portal ? 'Your affiliate hub is ready — start earning' : 'Your affiliate toolkit is ready',
      headline: portal ? `${first}, your affiliate hub is live` : `${first}, your affiliate toolkit is here`,
      heroHeadline: 'Share · Track · Earn',
      heroSubline: 'Compliant promo tools and residual income paths',
      preheader: portal
        ? 'Promo links, commission calculator, and co-marketing kit — inside your hub.'
        : 'Download compliant promo templates and model your commission potential.',
      intro: portal
        ? `Your affiliate hub is live. Grab compliant promo links, model commissions with the calculator, and access co-marketing assets — all built for FTC-safe promotion.`
        : `Your <strong>${guide}</strong> is ready — compliant promo templates, link builders, and a commission model so you know your earning potential before you share.`,
      primaryCta: portal ? 'Open affiliate hub' : 'Download affiliate toolkit',
      secondaryCta: 'Talk with affiliate success',
      primaryHref: portal ? `${getPublicSiteOrigin()}/affiliate/hub` : undefined,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">${portal ? 'Tip: start with the co-marketing kit — pre-written captions for guides and bookstore titles.' : `Apply for full partner status: <a href="${getPublicSiteOrigin()}/affiliate" style="color:#6366f1;">${getPublicSiteOrigin()}/affiliate</a>`}</p>`,
      plainText: portal
        ? `Hi ${first},\n\nAffiliate hub: ${getPublicSiteOrigin()}/affiliate/hub\n\nBook call: ${session}`
        : `Hi ${first},\n\nToolkit ready.\n\nDownload: ${download}\n\nApply: ${getPublicSiteOrigin()}/affiliate`,
    };
  }

  if (id === 'au_seller' || id === 'portal_au_seller') {
    const portal = id === 'portal_au_seller';
    return {
      subject: portal ? 'Welcome — AU seller workspace is ready' : 'AU seller onboarding — next steps',
      headline: portal ? `${first}, your AU seller workspace is live` : `${first}, AU seller resources ready`,
      heroHeadline: 'List · Verify · Payout',
      heroSubline: 'Authorized user listing compliance and ops',
      preheader: portal
        ? 'Listing review queue, compliance checklists, and payout setup — inside your hub.'
        : 'Listing compliance checklist and payout setup guide.',
      intro: portal
        ? `Your AU seller workspace is ready. Submit listings for review, track compliance checklists, and configure payouts — with automated reminders so nothing slips.`
        : `Welcome to the AU seller track. Review the compliance checklist before listing — accurate reporting and identity verification protect both you and buyers.`,
      primaryCta: portal ? 'Open AU seller hub' : 'Download compliance checklist',
      secondaryCta: 'Set up payouts & contracts',
      primaryHref: portal ? `${getPublicSiteOrigin()}/au-seller/hub` : undefined,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Every listing passes manual review — have ID, bureau reporting proof, and pricing ready before submitting.</p>`,
      plainText: portal
        ? `Hi ${first},\n\nAU seller hub: ${getPublicSiteOrigin()}/au-seller/hub\n\nBook setup call: ${session}`
        : `Hi ${first},\n\nAU seller resources ready.\n\nDownload: ${download}\n\nBook call: ${session}`,
    };
  }

  if (id === 'strategy_session' || id === 'consultation') {
    return {
      subject: 'Your strategy call is booked — here\'s how to prep',
      headline: `${first}, you're on the calendar`,
      heroHeadline: 'Prep · Focus · Win',
      heroSubline: 'Make your free strategy call count',
      subheadline: 'What to gather before we talk — reports, goals, and timeline.',
      preheader: 'Strategy call confirmed. Gather these items before we meet.',
      intro: `Thank you for booking a Finely strategy call. To make our time together count, have your latest tri-bureau report (or screenshot summary), your top 3 goals, and your funding timeline ready.`,
      primaryCta: 'Upload a report (portal trial)',
      secondaryCta: 'Reschedule or add notes',
      primaryHref: portalUrl,
      secondaryHref: session,
      showAnalysisPreview: false,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;"><strong>Bring:</strong> report PDF or screenshots · list of target accounts · any bureau response letters · your funding deadline.</p>`,
      plainText: `Hi ${first},\n\nStrategy call booked.\n\nPrep: upload report at ${portalUrl}\n\nManage booking: ${session}`,
    };
  }

  if (id === 'contact_inquiry') {
    return {
      subject: 'We got your message — here\'s what happens next',
      headline: `${first}, thanks for reaching out`,
      heroHeadline: 'Clarity · Response · Action',
      heroSubline: 'A real person will follow up shortly',
      subheadline: 'Typical response within one business day.',
      preheader: 'Message received. Expect a personal reply within one business day.',
      intro: `Thank you for contacting Finely Cred. A team member will review your message and reply personally — usually within one business day. Meanwhile, explore our free guides and portal trial.`,
      primaryCta: 'Browse free guides',
      secondaryCta: 'Book a strategy call instead',
      primaryHref: `${getPublicSiteOrigin()}/resources`,
      showAnalysisPreview: false,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Urgent credit deadline? Book a strategy call for faster triage: <a href="${session}" style="color:#6366f1;">${session}</a></p>`,
      plainText: `Hi ${first},\n\nMessage received. We'll reply within one business day.\n\nFree guides: ${getPublicSiteOrigin()}/resources\n\nBook call: ${session}`,
    };
  }

  if (id === 'portal_client' || id === 'portal_funding') {
    return {
      subject: 'Welcome to Finely Cred — your portal is ready',
      headline: `${first}, welcome aboard`,
      heroHeadline: 'Upload · Dispute · Fund',
      heroSubline: 'We are glad you are here — your credit journey starts now',
      subheadline: 'Your personal portal is live — we built this workspace for you.',
      preheader: 'Your Finely Cred portal is ready. Three simple steps to get momentum today.',
      intro: `Welcome to Finely Cred — we're genuinely glad you're here. Your personal restoration portal is ready: upload a credit report, surface the highest-impact disputes, and track every letter and response without spreadsheet chaos.`,
      primaryCta: 'Open your portal',
      secondaryCta: 'Book a free strategy call',
      primaryHref: portalUrl,
      headerTheme: 'emerald',
      showWelcomeSteps: true,
      showAnalysisPreview: true,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Your advisor <strong>${personaName}</strong> is available in portal messages once you're set up. Questions? Reply to this email.</p>`,
      plainText: `Hi ${first},\n\nWelcome to Finely Cred — your portal is ready.\n\nOpen portal: ${portalUrl}\n\nBook strategy call: ${session}`,
    };
  }

  if (id === 'bookstore' || id === 'ebook_purchase') {
    return {
      subject: 'Your book is in My Library — start reading',
      headline: `${first}, your purchase is ready`,
      heroHeadline: 'Read · Apply · Win',
      heroSubline: 'Operator-grade credit education',
      subheadline: 'Full volume in My Library — PDF export and audio where available.',
      preheader: 'Your book is unlocked in My Library. Start with chapter 1 today.',
      intro: `Thank you for your purchase. <strong>${guide}</strong> is now in My Library — read online, export PDF, and listen to chapter audio where available.`,
      primaryCta: 'Open My Library',
      secondaryCta: 'Browse more volumes',
      primaryHref: `${getPublicSiteOrigin()}/portal/library`,
      showAnalysisPreview: false,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Tip: apply one chapter action per week — operators who execute beat readers who hoard.</p>`,
      plainText: `Hi ${first},\n\n${guide} is in My Library.\n\nLibrary: ${getPublicSiteOrigin()}/portal/library`,
    };
  }

  if (id === 'tradeline_marketplace' || id === 'tradeline_purchase') {
    return {
      subject: 'Your tradeline package is active — intake starts now',
      headline: `${first}, your package is live`,
      heroHeadline: 'Intake · Match · Post',
      heroSubline: 'Tradeline package activated',
      subheadline: 'Complete intake, then watch the 45-day posting window.',
      preheader: 'Tradeline package active. Complete intake in your portal today.',
      intro: `Your tradeline package is active. Complete the intake checklist in your portal — profile verification, bureau targets, and desired age/limit bands — so matching can begin.`,
      primaryCta: 'Complete tradeline intake',
      secondaryCta: 'Book tradeline advisor call',
      primaryHref: portalUrl,
      showAnalysisPreview: false,
      extraHtml: `<p style="margin:16px 0 0;font-size:14px;color:#475569;">Posting typically takes 30–45 days. We'll create a posting-watch task so you re-pull on schedule.</p>`,
      plainText: `Hi ${first},\n\nPackage active. Complete intake: ${portalUrl}\n\nBook call: ${session}`,
    };
  }

  if (id === 'meta_lead') {
    return {
      subject: 'Thanks for connecting — your resource is ready',
      headline: `Welcome, ${first}`,
      heroHeadline: 'Clarity · Strategy · Results',
      heroSubline: 'Personalized credit guidance from Finely Cred',
      subheadline: 'Your free resource and a path to personalized credit strategy.',
      preheader: 'Thanks for reaching out via our ad — download your resource and book a session.',
      intro: `Thanks for reaching out — your resource is ready and a Finely advisor can walk you through personalized next steps.`,
      primaryCta: 'Download your resource',
      secondaryCta: 'Book a free strategy session',
      extraHtml: '',
      plainText: `Hi ${first},\n\nThanks for connecting. Download: ${download}\n\nBook session: ${session}`,
    };
  }

  return creditDefault;
}
