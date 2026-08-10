import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CreditSpecialistGuideActions } from '../components/creditSpecialist/CreditSpecialistGuideActions';
import { CareerPriceCardGrid, type CareerPriceCardOption } from '../components/careers/CareerPriceCard';
import type { CareerAccent } from '../components/careers/careerUi';
import {
  CS_OFFER,
  creditSpecialistAccountSignupUrl,
  getCreditSpecialistOfferTier,
  getCreditSpecialistPlanBullets,
  listPublicCreditSpecialistOfferTiers,
  type CreditSpecialistOfferTierId,
} from '../config/creditSpecialistOffer';
import { CS } from '../config/creditSpecialistProgram';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote, addLeadTags } from '../data/leadOpsRepo';
import { parseLeadsCsv } from '../lib/leadsBulkImport';
import { DigitalInviteShareBand } from '../components/digitalCards';
import { FinelyOsAlertBanner } from '../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { CareerSignupProgress, type CareerProgressStep } from '../components/careers/CareerSignupProgress';
import { CareerTierStickySummary } from '../components/careers/CareerTierStickySummary';
import {
  addDraftLeadToJoinIntent,
  defaultCreditSpecialistJoinIntent,
  formatCreditSpecialistJoinIntentNote,
  isCreditSpecialistJoinReadyForAccountSignup,
  loadCreditSpecialistJoinIntent,
  minLeadsRequiredWithBonus,
  removeDraftLeadFromJoinIntent,
  saveCreditSpecialistJoinIntent,
  type CreditSpecialistJoinIntent,
  type CreditSpecialistLeadEntryChoice,
} from '../lib/creditSpecialistJoinIntent';
import {
  captureDigitalInviteCardFromUrl,
  digitalInviteCardLeadAttributionFields,
  digitalInviteCardLeadTags,
  formatDigitalInviteCardNote,
  getDigitalInviteCardEligibilityForRole,
  markDigitalInviteCardRedeemed,
} from '../lib/digitalInviteCardAttribution';
import { getDigitalInviteCardDef } from '../config/digitalInviteCards';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
import { CS_GUIDE_READ_PATH } from './leadmagnet/creditSpecialistGuideContent';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsGlowField,
} from '../features/os/finelyOsLightUi';

type StepId = 'tier' | 'commit' | 'leads' | 'profile' | 'done';

const STEPS: CareerProgressStep[] = [
  { id: 'tier', label: 'Tier', resultLabel: 'Pick your keep %' },
  { id: 'commit', label: 'Commit', resultLabel: 'Unlock full Specialist Hub' },
  { id: 'leads', label: 'Leads', resultLabel: 'Get a head start on your leads' },
  { id: 'profile', label: 'Profile', resultLabel: 'Two minutes to your account' },
  { id: 'done', label: 'Done', resultLabel: 'Create your account' },
];

const TIER_ACCENT: Record<CreditSpecialistOfferTierId, CareerAccent> = {
  cs_foundation: 'sky',
  cs_builder: 'gold',
  cs_pro: 'emerald',
  cs_elite: 'navy',
};

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = `${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('amber')}`;

const LEAD_CHOICES: Array<{
  id: CreditSpecialistLeadEntryChoice;
  title: string;
  desc: string;
  icon: typeof UserPlus;
}> = [
  { id: 'enter_now', title: 'Enter now', desc: 'Type in your leads one by one — takes a minute.', icon: UserPlus },
  { id: 'upload_csv', title: 'Upload list / CSV', desc: 'Paste or upload a spreadsheet of contacts.', icon: FileSpreadsheet },
  { id: 'later', title: 'Add in Hub later', desc: 'Skip for now — add leads once your account is live.', icon: Sparkles },
];

function HelpStrip({ onReadGuide }: { onReadGuide: () => void }) {
  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-3 space-y-2`}>
      <span className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Need a hand?</span>
      <CreditSpecialistGuideActions tone="os" size="sm" onReadGuide={onReadGuide} />
    </div>
  );
}

export default function CreditSpecialistJoinPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const tierFromUrl = (sp.get('tier') || '').trim() as CreditSpecialistOfferTierId | '';

  usePublicSeoMeta({
    title: 'Join as a Credit Specialist',
    description: `Credit Specialist onboarding — commit to ${CS_OFFER.minLeadsRequired} leads, ${CS_OFFER.freeLeadsWindowDays}-day free-leads window, pick a tier, and create your account.`,
    path: CS_OFFER.joinPath,
  });

  const tiers = useMemo(() => listPublicCreditSpecialistOfferTiers(), []);
  const [step, setStep] = useState<StepId>('tier');
  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('cs'));
  const [intent, setIntent] = useState<CreditSpecialistJoinIntent>(() =>
    defaultCreditSpecialistJoinIntent({
      tierId: getCreditSpecialistOfferTier(tierFromUrl)?.id ?? '',
      digitalCardBonusLeadCredit: Boolean(getDigitalInviteCardEligibilityForRole('cs')),
    }),
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [niche, setNiche] = useState('');
  const [monthlyLeadsEstimate, setMonthlyLeadsEstimate] = useState('');
  const [showOptionalProfile, setShowOptionalProfile] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Bring-your-leads step state
  const [draftFullName, setDraftFullName] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftPhone, setDraftPhone] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvNotice, setCsvNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    const eligibility = getDigitalInviteCardEligibilityForRole('cs');
    setCardEligibility(eligibility);

    const existing = loadCreditSpecialistJoinIntent();
    if (existing) {
      const digitalCardBonusLeadCredit = existing.digitalCardBonusLeadCredit || Boolean(eligibility);
      const nextIntent: CreditSpecialistJoinIntent = {
        ...existing,
        digitalCardBonusLeadCredit,
        minLeadsRequired: minLeadsRequiredWithBonus(digitalCardBonusLeadCredit),
        tierId: (tierFromUrl && getCreditSpecialistOfferTier(tierFromUrl)?.id) || existing.tierId,
      };
      setIntent((prev) => ({ ...prev, ...nextIntent }));
      if (digitalCardBonusLeadCredit !== existing.digitalCardBonusLeadCredit) saveCreditSpecialistJoinIntent(nextIntent);
      if (existing.fullName) setFullName(existing.fullName);
      if (existing.email) setEmail(existing.email);
      if (existing.phone) setPhone(existing.phone);
      if (existing.companyName) setCompanyName(existing.companyName);
      if (existing.niche) setNiche(existing.niche);
      if (existing.monthlyLeadsEstimate != null) setMonthlyLeadsEstimate(String(existing.monthlyLeadsEstimate));
    } else if (tierFromUrl && getCreditSpecialistOfferTier(tierFromUrl)) {
      setIntent((prev) => ({ ...prev, tierId: tierFromUrl }));
    }
  }, [tierFromUrl]);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const selectedTier = getCreditSpecialistOfferTier(intent.tierId);
  const draftLeads = intent.draftLeads ?? [];

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const phoneOk = useMemo(() => phone.replace(/\D/g, '').length >= 10, [phone]);
  const profileOk = fullName.trim().length > 1 && emailOk && phoneOk;

  const draftEmailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim()), [draftEmail]);

  const tierOptions: CareerPriceCardOption[] = tiers.map((t) => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    badge: t.badge,
    priceLabel: `${t.keepPctLabel} keep`,
    priceSubLabel: 'revenue share · no platform fee',
    bullets: getCreditSpecialistPlanBullets(t),
    accent: TIER_ACCENT[t.id],
  }));

  const persistIntent = (next: CreditSpecialistJoinIntent) => {
    setIntent(next);
    saveCreditSpecialistJoinIntent(next);
  };

  const selectTier = (id: string) => {
    const tier = getCreditSpecialistOfferTier(id);
    if (!tier) return;
    persistIntent({ ...intent, tierId: tier.id });
  };

  const goReadGuide = () => navigate(CS_GUIDE_READ_PATH);

  const goNext = () => {
    const order = STEPS.map((s) => s.id);
    const i = order.indexOf(step);
    if (i >= 0 && i < order.length - 1) setStep(order[i + 1]! as StepId);
  };

  const goBack = () => {
    const order = STEPS.map((s) => s.id);
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]! as StepId);
  };

  const addManualDraftLead = () => {
    if (!draftFullName.trim() || !draftEmailOk) return;
    const next = addDraftLeadToJoinIntent(intent, {
      fullName: draftFullName.trim(),
      email: draftEmail.trim(),
      phone: draftPhone.trim() || undefined,
      source: 'manual',
    });
    persistIntent({ ...next, leadEntryChoice: 'enter_now' });
    setDraftFullName('');
    setDraftEmail('');
    setDraftPhone('');
  };

  const removeDraftLead = (id: string) => {
    persistIntent(removeDraftLeadFromJoinIntent(intent, id));
  };

  const parseCsvIntoDraftLeads = (text: string) => {
    const { rows, errors } = parseLeadsCsv(text);
    if (!rows.length) {
      setCsvNotice(errors.join(' ') || 'No valid rows found — check the format and try again.');
      return;
    }
    let next = intent;
    let added = 0;
    for (const row of rows) {
      const before = (next.draftLeads ?? []).length;
      next = addDraftLeadToJoinIntent(next, {
        fullName: row.fullName,
        email: row.email,
        phone: row.phone,
        source: 'csv',
      });
      if ((next.draftLeads ?? []).length > before) added += 1;
    }
    persistIntent({ ...next, leadEntryChoice: 'upload_csv' });
    const parts = [`Added ${added} lead${added === 1 ? '' : 's'}`];
    if (rows.length - added > 0) parts.push(`${rows.length - added} skipped (dupes)`);
    if (errors.length) parts.push(`${errors.length} row warning${errors.length === 1 ? '' : 's'}`);
    setCsvNotice(parts.join(' · '));
  };

  const onCsvFileChosen = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setCsvText(text);
      parseCsvIntoDraftLeads(text);
    };
    reader.readAsText(file);
  };

  const submitJoin = async () => {
    if (!profileOk || !intent.committedMinLeads || !intent.understoodFreeLeadsWindow || !intent.tierId) {
      setStatus('error');
      setStatusMsg('Complete the commitment checks, tier, and profile before submitting.');
      return;
    }
    setStatus('sending');
    setStatusMsg(null);
    try {
      const monthly = monthlyLeadsEstimate.trim() ? Number(monthlyLeadsEstimate) : undefined;
      const nextIntent: CreditSpecialistJoinIntent = {
        ...intent,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        companyName: companyName.trim() || undefined,
        niche: niche.trim() || undefined,
        monthlyLeadsEstimate: monthly,
        createdAt: intent.createdAt || new Date().toISOString(),
      };

      const app = createProgramApplication({
        kind: 'agent',
        fullName: nextIntent.fullName!,
        email: nextIntent.email!,
        phone: nextIntent.phone,
        companyName: nextIntent.companyName,
        niche: nextIntent.niche,
        monthlyLeadsEstimate: monthly,
        referralCode: cardEligibility ? `digital-card-${cardEligibility.role}` : undefined,
        notes: formatCreditSpecialistJoinIntentNote(nextIntent),
      });

      const lead = await submitLeadCapture({
        source: 'agent',
        offer: 'credit_specialist_join',
        interest: `cs_join:${nextIntent.tierId}`,
        fullName: nextIntent.fullName!,
        email: nextIntent.email!,
        phone: nextIntent.phone!,
        consentToContact: true,
        funnelPath: CS_OFFER.joinPath,
        funnelId: 'credit_specialist_join',
        goal: 'credit',
        ...(cardEligibility ? digitalInviteCardLeadAttributionFields(cardEligibility) : {}),
        giveawayStack: [
          `${nextIntent.minLeadsRequired}-lead commitment`,
          `${CS_OFFER.freeLeadsWindowDays}-day free-leads window`,
          selectedTier?.name ?? 'Specialist tier',
          ...(cardEligibility ? [getDigitalInviteCardDef('cs')?.bonus.label ?? 'Invite card bonus'] : []),
        ],
      });

      addLeadNote(lead.lead.id, formatCreditSpecialistJoinIntentNote({ ...nextIntent, leadId: lead.lead.id }));
      addLeadNote(
        lead.lead.id,
        `Program application: ${app.id}\nOffer: credit_specialist_join\nMin leads: ${nextIntent.minLeadsRequired}\nFree-leads days: ${CS_OFFER.freeLeadsWindowDays}`,
      );
      addLeadTags(lead.lead.id, [
        'credit-specialist',
        'credit_specialist_join',
        `tier:${nextIntent.tierId}`,
        `min-leads:${nextIntent.minLeadsRequired}`,
        `free-leads-days:${CS_OFFER.freeLeadsWindowDays}`,
        nextIntent.committedMinLeads ? 'committed-min-leads' : 'pending-min-leads',
        nextIntent.understoodFreeLeadsWindow ? 'understood-free-leads-window' : 'pending-free-leads-window',
        `leads-brought-at-signup:${(nextIntent.draftLeads ?? []).length}`,
        ...(cardEligibility ? digitalInviteCardLeadTags(cardEligibility) : []),
      ]);
      if (cardEligibility) {
        addLeadNote(lead.lead.id, formatDigitalInviteCardNote(cardEligibility));
        markDigitalInviteCardRedeemed(lead.lead.id);
      }

      const saved = { ...nextIntent, leadId: lead.lead.id };
      persistIntent(saved);
      setStatus('sent');
      setStatusMsg(
        cardEligibility
          ? `You’re in the queue with your invite card bonus applied — next, create your Finely account to open Specialist Hub.`
          : 'You’re in the queue — next, create your Finely account to open Specialist Hub.',
      );
      setStep('done');
    } catch (err: unknown) {
      setStatus('error');
      setStatusMsg((err as Error)?.message || 'Could not submit. Please try again.');
    }
  };

  const signupUrl = creditSpecialistAccountSignupUrl({
    tierId: intent.tierId || undefined,
    next: CS.hubPath,
  });

  const primaryCta = (() => {
    switch (step) {
      case 'tier':
        return { label: 'Continue', onCta: goNext, ready: Boolean(intent.tierId) };
      case 'commit':
        return {
          label: 'Unlock full Specialist Hub',
          onCta: goNext,
          ready: intent.committedMinLeads && intent.understoodFreeLeadsWindow,
        };
      case 'leads':
        return { label: 'Continue — minimal profile', onCta: goNext, ready: true };
      case 'profile':
        return {
          label: status === 'sending' ? 'Saving…' : 'Unlock Specialist Hub',
          onCta: () => void submitJoin(),
          ready: profileOk && status !== 'sending',
        };
      case 'done':
        return {
          label: 'Create account',
          onCta: () => navigate(signupUrl),
          ready: isCreditSpecialistJoinReadyForAccountSignup(intent),
        };
      default:
        return { label: 'Continue', onCta: goNext, ready: true };
    }
  })();

  return (
    <PageShell
      badge="Join"
      title={`Join as a ${CS.singular}`}
      subtitle={`${intent.minLeadsRequired}-lead minimum · ${CS_OFFER.freeLeadsWindowDays}-day free-leads window · guided onboarding`}
    >
      <div className={FINELY_OS_COMPACT_PAGE}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate(CS_OFFER.pricingPath)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Pricing hub
          </button>
          <button type="button" onClick={() => navigate(CS_OFFER.guidePath)} className={FINELY_OS_BACK_LINK}>
            <BookOpen size={14} /> Free guide
          </button>
        </div>

        <PublicLaneTitle
          lane="specialist"
          kitOverride={{ titleSize: 'lg' }}
          eyebrow={`Step ${stepIndex + 1} of ${STEPS.length}`}
          text={`Join as a ${CS.singular}.`}
          highlight={`${CS.singular}.`}
          speedMs={34}
          immediate
        />

        <CareerTierStickySummary
          roleLabel={CS.singular}
          tierName={selectedTier?.name}
          economics={{
            keepPctLabel: selectedTier ? `You keep ${selectedTier.keepPctLabel}` : undefined,
            buyInLabel: 'No platform fee',
            commissionLabel: `${intent.minLeadsRequired} leads · ${CS_OFFER.freeLeadsWindowDays} days`,
          }}
          ctaLabel={primaryCta.label}
          onCta={primaryCta.ready ? primaryCta.onCta : undefined}
          accent="gold"
        />

        <CareerSignupProgress
          steps={STEPS}
          activeId={step}
          onStepClick={(id) => setStep(id as StepId)}
          accent="navy"
        />

        {cardEligibility ? (
          <FinelyOsAlertBanner
            tone="success"
            message={`You unlocked ${getDigitalInviteCardDef('cs')?.bonus.label ?? '1 bonus lead credit'} by joining through your invite card — bring ${intent.minLeadsRequired} leads instead of ${CS_OFFER.minLeadsRequired} to open full access.`}
          />
        ) : null}

        <FinelyOsAlertBanner
          tone="info"
          message={`To use the system, get educated, and access methods: bring at least ${intent.minLeadsRequired} leads. You have ${CS_OFFER.freeLeadsWindowDays} days from signup to get those free leads.`}
        />

        <HelpStrip onReadGuide={goReadGuide} />

        {statusMsg && status !== 'idle' ? (
          <div className={status === 'error' ? FINELY_OS_NOTICE_ERROR : FINELY_OS_NOTICE_SUCCESS}>{statusMsg}</div>
        ) : null}

        {step === 'tier' && (
          <section className="space-y-4">
            <div className={`${finelyOsCatalogCard('amber')} !p-4 space-y-3`}>
              <h2 className={FINELY_OS_ENTITY_TITLE}>
                {tierFromUrl ? 'Your tier is ready — continue when it looks right' : 'Pick your tier'}
              </h2>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                {tierFromUrl
                  ? 'We pre-selected this from your link. Change it below if you want a different keep %, then continue.'
                  : `No platform fee — transparent revenue share. Every level includes the ${intent.minLeadsRequired}-lead / ${CS_OFFER.freeLeadsWindowDays}-day commitment.`}
              </p>
              <div className="grid sm:grid-cols-3 gap-2">
                {[
                  { t: 'Access', d: 'CRM, disputes, vault, Specialist Hub' },
                  { t: 'Education', d: 'Academy + free playbook guide' },
                  { t: 'Income path', d: 'Revenue share — illustrative only' },
                ].map((x) => (
                  <div key={x.t} className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="text-sm font-bold text-white">{x.t}</div>
                    <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{x.d}</div>
                  </div>
                ))}
              </div>
            </div>
            {selectedTier ? (
              <FinelyOsAlertBanner
                tone="success"
                message={`${selectedTier.name} — you keep ~${selectedTier.keepPctLabel}.`}
              />
            ) : null}
            <CareerPriceCardGrid
              options={tierOptions}
              selectedId={intent.tierId}
              onSelect={selectTier}
              selectLabel="Join as Credit Specialist"
              confirmLabel="Selected"
              columns={4}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate(CS_OFFER.pricingPath)} className={FINELY_OS_SECONDARY_BTN}>
                Review pricing hub
              </button>
              <button
                type="button"
                disabled={!intent.tierId}
                onClick={goNext}
                className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {step === 'commit' && (
          <section className={`${finelyOsCatalogCard('amber')} !p-4 space-y-4`}>
            <div>
              <h2 className={FINELY_OS_ENTITY_TITLE}>Confirm your entry commitment</h2>
              <p className="text-xs font-bold text-emerald-300 mt-1">Result: unlocks full Specialist Hub access.</p>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
              These two checks are required. They become part of your application notes for Finely ops.
            </p>
            <label className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-black/25 p-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-amber-400"
                checked={intent.committedMinLeads}
                onChange={(e) =>
                  persistIntent({ ...intent, committedMinLeads: e.target.checked })
                }
              />
              <span>
                <span className="font-bold text-white flex items-center gap-2">
                  <Users size={16} /> I will bring at least {intent.minLeadsRequired} partner leads
                </span>
                <span className={`block mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
                  {cardEligibility
                    ? `Invite card bonus applied — ${CS_OFFER.minLeadsRequired - intent.minLeadsRequired} lead credit already counted toward your minimum.`
                    : 'Minimum to use the system, get educated, and access methods/everything.'}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-sky-400/30 bg-black/25 p-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-sky-400"
                checked={intent.understoodFreeLeadsWindow}
                onChange={(e) =>
                  persistIntent({ ...intent, understoodFreeLeadsWindow: e.target.checked })
                }
              />
              <span>
                <span className="font-bold text-white">
                  I understand I have {CS_OFFER.freeLeadsWindowDays} days to get my free leads
                </span>
                <span className={`block mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
                  Clock starts at signup. Use Finely capture pages and the specialist playbook during the window.
                </span>
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={goBack} className={FINELY_OS_SECONDARY_BTN}>
                Back
              </button>
              <button
                type="button"
                disabled={!intent.committedMinLeads || !intent.understoodFreeLeadsWindow}
                onClick={goNext}
                className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Continue — unlock full Specialist Hub <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {step === 'leads' && (
          <section className={`${finelyOsCatalogCard('emerald')} !p-4 space-y-4`}>
            <div>
              <h2 className={FINELY_OS_ENTITY_TITLE}>Bring your leads</h2>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>
                Get a head start on your {intent.minLeadsRequired}-lead commitment right now — or add them once your
                account is live. Nothing here is submitted anywhere until you create your account.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {LEAD_CHOICES.map((choice) => {
                const Icon = choice.icon;
                const active = intent.leadEntryChoice === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => persistIntent({ ...intent, leadEntryChoice: choice.id })}
                    className={
                      'text-left rounded-xl border-2 p-4 space-y-2 transition-all ' +
                      (active
                        ? 'border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-300/40'
                        : 'border-white/10 bg-black/25 hover:border-emerald-400/40')
                    }
                  >
                    <span
                      className={
                        'inline-flex items-center justify-center w-9 h-9 rounded-full border ' +
                        (active ? 'bg-emerald-500/25 border-emerald-400/50' : 'bg-black/30 border-white/15')
                      }
                    >
                      <Icon size={16} className={active ? 'text-emerald-300' : 'text-white/60'} />
                    </span>
                    <div className="font-bold text-white text-sm flex items-center gap-1.5">
                      {choice.title}
                      {active ? <Check size={14} className="text-emerald-300" /> : null}
                    </div>
                    <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{choice.desc}</div>
                  </button>
                );
              })}
            </div>

            {intent.leadEntryChoice === 'enter_now' && (
              <div className="rounded-xl border border-emerald-400/30 bg-black/25 p-4 space-y-3">
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs font-bold uppercase tracking-wide text-white/60`}>
                  Add a lead
                </p>
                <div className="grid sm:grid-cols-3 gap-2">
                  <input
                    value={draftFullName}
                    onChange={(e) => setDraftFullName(e.target.value)}
                    placeholder="Full name"
                    className={formInput}
                  />
                  <input
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className={formInput}
                  />
                  <input
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    type="tel"
                    className={formInput}
                  />
                </div>
                <button
                  type="button"
                  disabled={!draftFullName.trim() || !draftEmailOk}
                  onClick={addManualDraftLead}
                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <UserPlus size={14} /> Add lead
                </button>
              </div>
            )}

            {intent.leadEntryChoice === 'upload_csv' && (
              <div className="rounded-xl border border-emerald-400/30 bg-black/25 p-4 space-y-3">
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs font-bold uppercase tracking-wide text-white/60`}>
                  Upload or paste your list
                </p>
                <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                  Columns: full_name, email, phone (optional). A header row is auto-detected.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={(e) => onCsvFileChosen(e.target.files?.[0])}
                  className="block w-full text-xs text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-emerald-200 hover:file:bg-emerald-500/30"
                />
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={4}
                  placeholder="Jordan Lee,jordan@example.com,5551234567"
                  className={`${formInput} font-mono text-xs resize-y`}
                />
                <button
                  type="button"
                  disabled={!csvText.trim()}
                  onClick={() => parseCsvIntoDraftLeads(csvText)}
                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FileSpreadsheet size={14} /> Parse & add leads
                </button>
                {csvNotice ? <p className="text-xs text-emerald-200/90">{csvNotice}</p> : null}
              </div>
            )}

            {intent.leadEntryChoice === 'later' && (
              <FinelyOsAlertBanner
                tone="info"
                message={`No problem — you'll get a clear checklist in ${CS.hubName} to add your ${intent.minLeadsRequired} leads within the ${CS_OFFER.freeLeadsWindowDays}-day window.`}
              />
            )}

            {draftLeads.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className={`${FINELY_OS_ENTITY_BODY} text-xs font-bold uppercase tracking-wide text-white/60`}>
                    Draft leads ({draftLeads.length} of {intent.minLeadsRequired})
                  </p>
                  <span className="text-[11px] font-bold text-emerald-300">
                    {Math.min(100, Math.round((draftLeads.length / intent.minLeadsRequired) * 100))}% there
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {draftLeads.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs"
                    >
                      <span className="truncate">
                        <span className="font-bold text-white">{l.fullName}</span>{' '}
                        <span className="text-white/50">{l.email}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDraftLead(l.id)}
                        className="text-white/40 hover:text-rose-300 shrink-0"
                        aria-label={`Remove ${l.fullName}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={goBack} className={FINELY_OS_SECONDARY_BTN}>
                Back
              </button>
              <button type="button" onClick={goNext} className={FINELY_OS_PRIMARY_BTN}>
                Continue — minimal profile <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {step === 'profile' && (
          <section className={`${finelyOsCatalogCard('amber')} !p-4 space-y-4`}>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Your minimal profile</h2>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
              Just three fields — we’ll save this with your {intent.minLeadsRequired}-lead / {CS_OFFER.freeLeadsWindowDays}-day
              commitment for activation.
            </p>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className={formLabel}>Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={formInput} autoComplete="name" />
              </div>
              <div>
                <label className={formLabel}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={formInput} type="email" autoComplete="email" />
              </div>
              <div>
                <label className={formLabel}>Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className={formInput} type="tel" autoComplete="tel" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOptionalProfile((v) => !v)}
              className="text-xs font-bold text-amber-300 hover:text-amber-100 underline underline-offset-2"
            >
              {showOptionalProfile ? 'Hide optional details' : 'Add optional details (company, niche, monthly leads)'}
            </button>

            {showOptionalProfile ? (
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className={formLabel}>Company (optional)</label>
                  <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={formInput} />
                </div>
                <div>
                  <label className={formLabel}>Niche (optional)</label>
                  <input value={niche} onChange={(e) => setNiche(e.target.value)} className={formInput} placeholder="Restore, funding, real estate…" />
                </div>
                <div>
                  <label className={formLabel}>Monthly leads estimate (optional)</label>
                  <input
                    value={monthlyLeadsEstimate}
                    onChange={(e) => setMonthlyLeadsEstimate(e.target.value.replace(/[^\d]/g, ''))}
                    className={formInput}
                    placeholder={`At least ${intent.minLeadsRequired}`}
                  />
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-white/10 bg-black/25 p-3 space-y-1 text-xs">
              <div className={FINELY_OS_ENTITY_BODY}>
                <Check size={13} className="inline text-emerald-400 mr-1" />
                Tier: <strong className="text-white">{selectedTier?.name ?? '—'}</strong> ({selectedTier?.keepPctLabel ?? '—'} keep)
              </div>
              <div className={FINELY_OS_ENTITY_BODY}>
                <Check size={13} className="inline text-emerald-400 mr-1" />
                Commitment: ≥{intent.minLeadsRequired} leads · {CS_OFFER.freeLeadsWindowDays}-day window
              </div>
              {draftLeads.length > 0 ? (
                <div className={FINELY_OS_ENTITY_BODY}>
                  <Check size={13} className="inline text-emerald-400 mr-1" />
                  {draftLeads.length} draft lead{draftLeads.length === 1 ? '' : 's'} ready to sync into your Hub
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={goBack} className={FINELY_OS_SECONDARY_BTN}>
                Back
              </button>
              <button
                type="button"
                disabled={!profileOk || status === 'sending'}
                onClick={() => {
                  persistIntent({
                    ...intent,
                    fullName: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    companyName: companyName.trim() || undefined,
                    niche: niche.trim() || undefined,
                    monthlyLeadsEstimate: monthlyLeadsEstimate.trim() ? Number(monthlyLeadsEstimate) : undefined,
                  });
                  void submitJoin();
                }}
                className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {status === 'sending' ? 'Saving…' : 'Continue — unlock Specialist Hub'} <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {step === 'done' && (
          <section className={`${finelyOsCatalogCard('emerald')} !p-4 space-y-4`}>
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 size={22} />
              <h2 className={FINELY_OS_ENTITY_TITLE}>You’re set — finish account signup</h2>
            </div>
            <p className={FINELY_OS_ENTITY_BODY}>
              Your {selectedTier?.name ?? 'tier'} selection, {intent.minLeadsRequired}-lead commitment, and{' '}
              {CS_OFFER.freeLeadsWindowDays}-day free-leads window are saved{cardEligibility ? ' — invite card bonus applied' : ''}
              {draftLeads.length > 0 ? `, along with ${draftLeads.length} draft lead${draftLeads.length === 1 ? '' : 's'}` : ''}.
              Create your account to open {CS.hubName} and start the free-leads clock.
            </p>
            <ol className={`${FINELY_OS_ENTITY_BODY} space-y-2 list-decimal pl-5`}>
              <li>Create your Finely account (Credit Specialist role pre-selected — no role picker).</li>
              <li>Complete legal + profile steps in onboarding.</li>
              <li>
                {draftLeads.length > 0
                  ? `Your ${draftLeads.length} draft lead${draftLeads.length === 1 ? '' : 's'} sync into ${CS.hubName} automatically.`
                  : `Use capture pages + the free guide to source your ${intent.minLeadsRequired} leads within ${CS_OFFER.freeLeadsWindowDays} days.`}
              </li>
            </ol>
            <div className="flex flex-wrap gap-2">
              {isCreditSpecialistJoinReadyForAccountSignup(intent) ? (
                <button type="button" onClick={() => navigate(signupUrl)} className={FINELY_OS_PRIMARY_BTN}>
                  Create account <ArrowRight size={14} />
                </button>
              ) : (
                <button type="button" onClick={() => setStep('tier')} className={FINELY_OS_PRIMARY_BTN}>
                  Finish tier + commitment first <ArrowRight size={14} />
                </button>
              )}
              <button type="button" onClick={() => navigate(CS_OFFER.guidePath)} className={FINELY_OS_SECONDARY_BTN}>
                <BookOpen size={14} /> Open specialist guide
              </button>
              <button type="button" onClick={() => navigate(CS_OFFER.pricingPath)} className={FINELY_OS_SECONDARY_BTN}>
                Back to pricing
              </button>
            </div>
          </section>
        )}

        <DigitalInviteShareBand role="cs" />

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>{CS_OFFER.complianceFootnote}</p>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
