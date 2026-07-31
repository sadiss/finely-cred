import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CreditSpecialistPricingTiers } from '../components/creditSpecialist/CreditSpecialistPricingTiers';
import {
  CS_OFFER,
  creditSpecialistAccountSignupUrl,
  getCreditSpecialistOfferTier,
  type CreditSpecialistOfferTierId,
} from '../config/creditSpecialistOffer';
import { CS } from '../config/creditSpecialistProgram';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote, addLeadTags } from '../data/leadOpsRepo';
import { FinelyOsAlertBanner } from '../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../components/marketing/MarketingStaffChatStrip';
import {
  defaultCreditSpecialistJoinIntent,
  formatCreditSpecialistJoinIntentNote,
  loadCreditSpecialistJoinIntent,
  saveCreditSpecialistJoinIntent,
  type CreditSpecialistJoinIntent,
} from '../lib/creditSpecialistJoinIntent';
import { openPublicChat } from '../lib/publicChatEvents';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
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

type StepId = 'welcome' | 'commit' | 'tier' | 'profile' | 'account' | 'done';

const STEPS: Array<{ id: StepId; label: string; hint: string }> = [
  { id: 'welcome', label: 'Welcome', hint: 'What you unlock' },
  { id: 'commit', label: 'Commit', hint: '3 leads · 30 days' },
  { id: 'tier', label: 'Tier', hint: 'Pick your level' },
  { id: 'profile', label: 'Profile', hint: 'Contact details' },
  { id: 'account', label: 'Account', hint: 'Submit & signup' },
  { id: 'done', label: 'Done', hint: 'Next actions' },
];

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = `${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} ${finelyOsGlowField('violet')}`;

function HelpStrip({ onWatch, onAsk }: { onWatch: () => void; onAsk: () => void }) {
  return (
    <div className={`${finelyOsCatalogCard('sky')} !p-3 flex flex-wrap items-center gap-2`}>
      <span className={`${FINELY_OS_ENTITY_BODY} text-xs mr-1`}>Need a hand?</span>
      <button type="button" onClick={onWatch} className={FINELY_OS_SECONDARY_BTN}>
        <BookOpen size={14} /> Watch how
      </button>
      <button type="button" onClick={onAsk} className={FINELY_OS_SECONDARY_BTN}>
        <Sparkles size={14} /> Ask Finely
      </button>
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

  const [step, setStep] = useState<StepId>('welcome');
  const [intent, setIntent] = useState<CreditSpecialistJoinIntent>(() =>
    defaultCreditSpecialistJoinIntent({
      tierId: getCreditSpecialistOfferTier(tierFromUrl)?.id ?? '',
    }),
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [niche, setNiche] = useState('');
  const [monthlyLeadsEstimate, setMonthlyLeadsEstimate] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadCreditSpecialistJoinIntent();
    if (existing) {
      setIntent((prev) => ({
        ...prev,
        ...existing,
        tierId: (tierFromUrl && getCreditSpecialistOfferTier(tierFromUrl)?.id) || existing.tierId || prev.tierId,
      }));
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
  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100);
  const selectedTier = getCreditSpecialistOfferTier(intent.tierId);

  const emailOk = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const phoneOk = useMemo(() => phone.replace(/\D/g, '').length >= 10, [phone]);
  const profileOk = fullName.trim().length > 1 && emailOk && phoneOk;

  const persistIntent = (next: CreditSpecialistJoinIntent) => {
    setIntent(next);
    saveCreditSpecialistJoinIntent(next);
  };

  const goWatch = () => navigate(CS_OFFER.guidePath);
  const goAsk = () => openPublicChat({ goal: 'business', personaId: 'lead_converter' });

  const goNext = () => {
    const order = STEPS.map((s) => s.id);
    const i = order.indexOf(step);
    if (i >= 0 && i < order.length - 1) setStep(order[i + 1]!);
  };

  const goBack = () => {
    const order = STEPS.map((s) => s.id);
    const i = order.indexOf(step);
    if (i > 0) setStep(order[i - 1]!);
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
        giveawayStack: [
          `${CS_OFFER.minLeadsRequired}-lead commitment`,
          `${CS_OFFER.freeLeadsWindowDays}-day free-leads window`,
          selectedTier?.name ?? 'Specialist tier',
        ],
      });

      addLeadNote(lead.lead.id, formatCreditSpecialistJoinIntentNote({ ...nextIntent, leadId: lead.lead.id }));
      addLeadNote(
        lead.lead.id,
        `Program application: ${app.id}\nOffer: credit_specialist_join\nMin leads: ${CS_OFFER.minLeadsRequired}\nFree-leads days: ${CS_OFFER.freeLeadsWindowDays}`,
      );
      addLeadTags(lead.lead.id, [
        'credit-specialist',
        'credit_specialist_join',
        `tier:${nextIntent.tierId}`,
        `min-leads:${CS_OFFER.minLeadsRequired}`,
        `free-leads-days:${CS_OFFER.freeLeadsWindowDays}`,
        nextIntent.committedMinLeads ? 'committed-min-leads' : 'pending-min-leads',
        nextIntent.understoodFreeLeadsWindow ? 'understood-free-leads-window' : 'pending-free-leads-window',
      ]);

      const saved = { ...nextIntent, leadId: lead.lead.id };
      persistIntent(saved);
      setStatus('sent');
      setStatusMsg('You’re in the queue — next, create your Finely account to open Specialist Hub.');
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

  return (
    <PageShell
      badge="Join"
      title={`Join as a ${CS.singular}`}
      subtitle={`${CS_OFFER.minLeadsRequired}-lead minimum · ${CS_OFFER.freeLeadsWindowDays}-day free-leads window · guided onboarding`}
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

        {/* Progress */}
        <div className={`${finelyOsCatalogCard('violet')} !p-4 space-y-3`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={FINELY_OS_ENTITY_TITLE}>Credit Specialist onboarding</p>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}>
                Step {stepIndex + 1} of {STEPS.length} — {STEPS[stepIndex]?.hint}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-black tabular-nums text-violet-300">{progressPct}%</div>
              <div className="text-[10px] uppercase tracking-wider text-white/50">complete</div>
            </div>
          </div>
          <div className="h-2 rounded-full bg-black/40 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-violet-500 transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => {
              const done = i < stepIndex || step === 'done';
              const active = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={i > stepIndex && step !== 'done'}
                  onClick={() => {
                    if (i <= stepIndex || step === 'done') setStep(s.id);
                  }}
                  className={
                    'rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide border transition ' +
                    (active
                      ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                      : done
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                        : 'border-white/10 bg-black/20 text-white/40')
                  }
                >
                  {i + 1}. {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <FinelyOsAlertBanner
          tone="info"
          message={`To use the system, get educated, and access methods: bring at least ${CS_OFFER.minLeadsRequired} leads. You have ${CS_OFFER.freeLeadsWindowDays} days from signup to get those free leads.`}
        />

        <HelpStrip onWatch={goWatch} onAsk={goAsk} />

        {statusMsg && status !== 'idle' ? (
          <div className={status === 'error' ? FINELY_OS_NOTICE_ERROR : FINELY_OS_NOTICE_SUCCESS}>{statusMsg}</div>
        ) : null}

        {step === 'welcome' && (
          <section className={`${finelyOsCatalogCard('violet')} !p-4 space-y-4`}>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Welcome — here’s the deal in plain English</h2>
            <p className={FINELY_OS_ENTITY_BODY}>
              Finely Cred Credit Specialists run partner files on our OS. There is no flat platform fee. You unlock full
              education, methods, and tools when you commit to bringing partners — starting with{' '}
              <strong className={FINELY_OS_ENTITY_VALUE}>{CS_OFFER.minLeadsRequired} leads</strong> inside a clear{' '}
              <strong className={FINELY_OS_ENTITY_VALUE}>{CS_OFFER.freeLeadsWindowDays}-day</strong> window.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { t: 'Access', d: 'CRM, disputes, vault, Specialist Hub' },
                { t: 'Education', d: 'Academy + free playbook guide' },
                { t: 'Income path', d: 'Revenue share — illustrative, not guaranteed' },
              ].map((x) => (
                <div key={x.t} className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="text-sm font-bold text-white">{x.t}</div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{x.d}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={goNext} className={FINELY_OS_PRIMARY_BTN}>
                Continue — commit to leads <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate(CS_OFFER.pricingPath)} className={FINELY_OS_SECONDARY_BTN}>
                Review pricing first
              </button>
            </div>
          </section>
        )}

        {step === 'commit' && (
          <section className={`${finelyOsCatalogCard('amber')} !p-4 space-y-4`}>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Confirm your entry commitment</h2>
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
                  <Users size={16} /> I will bring at least {CS_OFFER.minLeadsRequired} partner leads
                </span>
                <span className={`block mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
                  Minimum to use the system, get educated, and access methods/everything.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-violet-400/30 bg-black/25 p-4 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 accent-violet-400"
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
                Continue — pick a tier <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {step === 'tier' && (
          <section className="space-y-4">
            <CreditSpecialistPricingTiers
              selectedTierId={intent.tierId}
              onSelectTier={(tier) => persistIntent({ ...intent, tierId: tier.id })}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={goBack} className={FINELY_OS_SECONDARY_BTN}>
                Back
              </button>
              <button
                type="button"
                disabled={!intent.tierId}
                onClick={goNext}
                className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Continue with {selectedTier?.name ?? 'tier'} <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {step === 'profile' && (
          <section className={`${finelyOsCatalogCard('violet')} !p-4 space-y-4`}>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Your profile</h2>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>We’ll save this with your 3-lead / 30-day commitment for activation.</p>
            <div className="grid md:grid-cols-2 gap-3">
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
                  placeholder={`At least ${CS_OFFER.minLeadsRequired}`}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={goBack} className={FINELY_OS_SECONDARY_BTN}>
                Back
              </button>
              <button
                type="button"
                disabled={!profileOk}
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
                  goNext();
                }}
                className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Continue — create account path <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

        {step === 'account' && (
          <section className={`${finelyOsCatalogCard('emerald')} !p-4 space-y-4`}>
            <h2 className={FINELY_OS_ENTITY_TITLE}>Submit & open account signup</h2>
            <div className="rounded-xl border border-white/10 bg-black/25 p-4 space-y-2">
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                <Check size={14} className="inline text-emerald-400 mr-1" />
                {intent.committedMinLeads
                  ? `Committed to ≥${CS_OFFER.minLeadsRequired} leads`
                  : 'Lead commitment missing'}
              </div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                <Check size={14} className="inline text-emerald-400 mr-1" />
                {intent.understoodFreeLeadsWindow
                  ? `${CS_OFFER.freeLeadsWindowDays}-day free-leads window confirmed`
                  : 'Free-leads window not confirmed'}
              </div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                Tier: <strong className="text-white">{selectedTier?.name ?? '—'}</strong>
              </div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                Contact: <strong className="text-white">{fullName}</strong> · {email}
              </div>
            </div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
              Submitting saves your application + lead note with the 3-lead / 30-day intent, then you create your Finely
              account (role: Credit Specialist).
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={goBack} className={FINELY_OS_SECONDARY_BTN}>
                Back
              </button>
              <button
                type="button"
                disabled={status === 'sending'}
                onClick={() => void submitJoin()}
                className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-50`}
              >
                {status === 'sending' ? 'Submitting…' : 'Submit application'} <ArrowRight size={14} />
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
              Your {CS_OFFER.minLeadsRequired}-lead commitment and {CS_OFFER.freeLeadsWindowDays}-day free-leads window are
              saved. Create your account to open {CS.hubName} and start the free-leads clock.
            </p>
            <ol className={`${FINELY_OS_ENTITY_BODY} space-y-2 list-decimal pl-5`}>
              <li>Create your Finely account (Credit Specialist role pre-selected).</li>
              <li>Complete legal + profile steps in onboarding.</li>
              <li>Use capture pages + the free guide to source your {CS_OFFER.minLeadsRequired} leads within {CS_OFFER.freeLeadsWindowDays} days.</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate(signupUrl)} className={FINELY_OS_PRIMARY_BTN}>
                Create account <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate(CS_OFFER.guidePath)} className={FINELY_OS_SECONDARY_BTN}>
                <BookOpen size={14} /> Open specialist guide
              </button>
              <button type="button" onClick={() => navigate(CS_OFFER.pricingPath)} className={FINELY_OS_SECONDARY_BTN}>
                Back to pricing
              </button>
            </div>
          </section>
        )}

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>{CS_OFFER.complianceFootnote}</p>

        <MarketingStaffChatStrip
          roleId="lead_converter"
          goal="business"
          roleLabel="Credit Specialist onboarding"
          subline="Stuck on the 3-lead commitment or which tier to pick? Ask Aia — she’ll connect you."
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
