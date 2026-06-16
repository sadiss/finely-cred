import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Gavel,
  KeyRound,
  Lock,
  LogIn,
  Minus,
  Shield,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote } from '../data/leadOpsRepo';
import { registerHetaSocietyMember, seedHetaOnboardingDraft } from '../lib/hetaSocietyMembership';
import { normalizeHosAccessCode, redeemHosAccessCodeRemote, validateHosAccessCode, validateHosAccessCodeRemote } from '../lib/hetaSocietyAccessCodes';
import {
  HEAD_OF_SOCIETY_NAME,
  HEAD_OF_SOCIETY_PATH,
  HETA_SOCIETY_BENEFITS,
  HETA_SOCIETY_CAREER_PATHS,
  HETA_SOCIETY_DISPUTE_LIMIT,
  HETA_SOCIETY_FAQ,
  HETA_SOCIETY_HERO_ACCENT,
  HETA_SOCIETY_MANIFESTO,
  HETA_SOCIETY_PILLARS,
  HETA_SOCIETY_SHORT,
  HETA_SOCIETY_STATS,
  HETA_SOCIETY_TAGLINE,
  HOS_VS_FREE_GUIDE,
} from '../config/hetaSocietyProgram';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_LABEL } from '../features/os/finelyOsLightUi';

const MEMBER_STEPS = [
  { id: 'key', title: 'Enter access key', desc: 'Invite-only — use the private key you were given to unlock registration.' },
  { id: 'login', title: 'Create login', desc: 'Secure portal access tied to your email — your private restoration & build file.' },
  { id: 'dispute', title: 'Restore & dispute', desc: `Track up to ${HETA_SOCIETY_DISPUTE_LIMIT} items with round-one letters and FCRA timing.` },
  { id: 'build', title: 'Build & grow', desc: 'Business credit starter, free guide, and career paths when you are ready.' },
] as const;

const PILLAR_ICON: Record<(typeof HETA_SOCIETY_PILLARS)[number]['accent'], React.ComponentType<{ className?: string }>> = {
  amber: Gavel,
  violet: Building2,
  emerald: TrendingUp,
  sky: Shield,
};

const PILLAR_GLOW: Record<(typeof HETA_SOCIETY_PILLARS)[number]['accent'], string> = {
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
};

const PILLAR_ICON_COLOR: Record<(typeof HETA_SOCIETY_PILLARS)[number]['accent'], string> = {
  amber: 'text-amber-300',
  violet: 'text-violet-300',
  emerald: 'text-emerald-300',
  sky: 'text-sky-300',
};

function HosAccessGate({
  done,
  leadId,
  accessKey,
  setAccessKey,
  keyUnlocked,
  setKeyUnlocked,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  phone,
  setPhone,
  consent,
  setConsent,
  busy,
  err,
  verifyKey,
  assigneeName,
  assigneeEmailHint,
  submit,
  loginPath,
  navigate,
}: {
  done: boolean;
  leadId: string | null;
  accessKey: string;
  setAccessKey: (v: string) => void;
  keyUnlocked: boolean;
  setKeyUnlocked: (v: boolean) => void;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  consent: boolean;
  setConsent: (v: boolean) => void;
  busy: boolean;
  err: string | null;
  verifyKey: () => void | Promise<void>;
  assigneeName?: string | null;
  assigneeEmailHint?: string | null;
  submit: (e: React.FormEvent) => void;
  loginPath: string;
  navigate: (path: string) => void;
}) {
  return (
    <div id="hos-access" className="hos-landing-gate relative scroll-mt-28 p-5 sm:p-7">
      <div className="relative z-[1]">
        {done ? (
          <div className="space-y-5 text-center sm:text-left">
            <div className="hos-landing-invite-seal mx-auto sm:mx-0">
              <Sparkles className="h-6 w-6 text-amber-200" />
            </div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">Welcome to {HEAD_OF_SOCIETY_NAME}</h2>
            <p className="text-sm leading-relaxed text-white/65">
              Reference <span className="font-mono text-amber-200/90">{leadId}</span>. Create your login to open your HOS
              command center — restore, build, and track up to {HETA_SOCIETY_DISPUTE_LIMIT} disputes.
            </p>
            <Button variant="gold" size="lg" className="w-full" onClick={() => navigate(loginPath)}>
              Create login & open portal <ArrowRight size={18} />
            </Button>
            <Button variant="platinum" size="lg" className="w-full" onClick={() => navigate('/free-guide')}>
              Get dispute guide first
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="hos-landing-gate-badge">
                  <Lock size={11} /> Invite-only
                </span>
                <h2 className="mt-3 text-xl font-black text-white sm:text-2xl">Member access gate</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">
                  Enter the private key you were given. Verify it, then complete your restoration & build file.
                </p>
              </div>
              <div className="hos-landing-invite-seal shrink-0">
                <KeyRound className="h-5 w-5 text-amber-200" />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Access key</label>
                <input
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value.toUpperCase());
                    setKeyUnlocked(false);
                  }}
                  className={`${FINELY_OS_ENTITY_INPUT} font-mono tracking-[0.2em] text-center sm:text-left`}
                  placeholder="HOS-XXXXXXXX"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              {!keyUnlocked ? (
                <button
                  type="button"
                  onClick={verifyKey}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-100 via-amber-400 to-amber-600 py-4 text-sm font-black uppercase tracking-wide text-[#1a1400] shadow-[0_12px_40px_-12px_rgba(251,191,36,0.55)] transition hover:brightness-105"
                >
                  <Zap size={16} className="transition group-hover:scale-110" />
                  Verify access key
                </button>
              ) : (
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  <CheckCircle2 className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                  Key verified{assigneeName ? ` for ${assigneeName}` : ''} — complete your member file below.
                  {assigneeEmailHint ? (
                    <p className="mt-1 text-xs text-emerald-200/80">Register with {assigneeEmailHint}</p>
                  ) : null}
                </div>
              )}
            </div>

            {keyUnlocked ? (
              <form onSubmit={submit} className="mt-6 space-y-3 border-t border-white/[0.08] pt-6">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className={FINELY_OS_ENTITY_LABEL}>First name</label>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} required />
                  </div>
                  <div>
                    <label className={FINELY_OS_ENTITY_LABEL}>Last name</label>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} required />
                  </div>
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={FINELY_OS_ENTITY_INPUT} required />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Phone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" className={FINELY_OS_ENTITY_INPUT} required />
                </div>
                <label className="flex items-start gap-2 text-xs text-white/55">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
                  I agree to be contacted about my HOS membership and restoration file (required).
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-100 via-amber-400 to-amber-600 py-4 text-sm font-black uppercase tracking-wide text-[#1a1400] shadow-[0_12px_40px_-12px_rgba(251,191,36,0.5)] disabled:opacity-50"
                >
                  {busy ? 'Submitting…' : `Activate ${HETA_SOCIETY_SHORT} membership`}
                </button>
              </form>
            ) : null}
            {err ? <p className="mt-3 text-sm text-rose-300">{err}</p> : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function HetaSocietyPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: `${HEAD_OF_SOCIETY_NAME} (HOS) — Restoration & Building for Men`,
    description: `Invite-only men's program — restore credit, build business credit, and grow through ${HEAD_OF_SOCIETY_NAME}.`,
    path: HEAD_OF_SOCIETY_PATH,
  });

  const [accessKey, setAccessKey] = useState('');
  const [keyUnlocked, setKeyUnlocked] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [assigneeName, setAssigneeName] = useState<string | null>(null);
  const [assigneeEmailHint, setAssigneeEmailHint] = useState<string | null>(null);
  const [expectedEmail, setExpectedEmail] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(HETA_SOCIETY_FAQ[0]?.id ?? null);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const loginPath = '/onboarding?lane=heta_society&next=/portal/hos';

  const scrollToAccess = () => document.getElementById('hos-access')?.scrollIntoView({ behavior: 'smooth' });

  const verifyKey = async () => {
    setErr(null);
    const check = await validateHosAccessCodeRemote(accessKey);
    if (!check.valid) {
      setKeyUnlocked(false);
      setAssigneeName(null);
      setAssigneeEmailHint(null);
      setExpectedEmail(null);
      setErr(check.reason);
      return;
    }
    if (check.valid && check.record) {
      setAccessKey(check.record.code);
      const name =
        `${check.record.assignedFirstName} ${check.record.assignedLastName}`.trim() ||
        (check.assignee ? `${check.assignee.firstName} ${check.assignee.lastName}`.trim() : '');
      setAssigneeName(name || null);
      if (check.record.assignedFirstName) setFirstName(check.record.assignedFirstName);
      if (check.record.assignedLastName) setLastName(check.record.assignedLastName);
      if (check.record.assignedEmail) {
        setEmail(check.record.assignedEmail);
        setExpectedEmail(check.record.assignedEmail);
        setAssigneeEmailHint(check.record.assignedEmail);
      } else if (check.assignee?.emailHint) {
        setAssigneeEmailHint(check.assignee.emailHint);
      }
      if (check.record.assignedPhone) setPhone(check.record.assignedPhone);
    }
    setKeyUnlocked(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!keyUnlocked) return setErr('Verify your access key first.');
    const keyCheck = validateHosAccessCode(accessKey, email.trim());
    if (!keyCheck.valid) {
      setKeyUnlocked(false);
      return setErr(keyCheck.reason);
    }
    if (expectedEmail && email.trim().toLowerCase() !== expectedEmail.toLowerCase()) {
      return setErr(`This key is assigned to ${expectedEmail}. Use that email to register.`);
    }
    if (!firstName.trim() || !lastName.trim()) return setErr('Enter your first and last name.');
    if (!email.includes('@')) return setErr('Enter a valid email.');
    if (!phone.trim()) return setErr('Enter your phone number.');
    if (!consent) return setErr('Consent is required to join.');
    setBusy(true);
    try {
      const result = await submitLeadCapture({
        source: 'heta_society',
        offer: 'heta_society_signup',
        interest: `${HEAD_OF_SOCIETY_NAME} (HOS)`,
        fullName,
        email: email.trim(),
        phone: phone.trim(),
        consentToContact: true,
        funnelPath: HEAD_OF_SOCIETY_PATH,
        funnelId: 'heta_society',
        goal: 'credit',
        giveawayStack: HETA_SOCIETY_BENEFITS.map((b) => b.title),
      });
      setLeadId(result.lead.id);
      const redeemed = await redeemHosAccessCodeRemote(accessKey, { email: email.trim(), leadId: result.lead.id });
      if (!redeemed.valid) {
        setErr(redeemed.reason);
        return;
      }
      registerHetaSocietyMember({ leadId: result.lead.id, email: email.trim(), fullName });
      addLeadNote(result.lead.id, `${HEAD_OF_SOCIETY_NAME} (HOS) access key ${normalizeHosAccessCode(accessKey)} assigned to ${fullName} (${email.trim()}).`);
      seedHetaOnboardingDraft({ fullName, email: email.trim(), phone: phone.trim(), leadId: result.lead.id });
      setDone(true);
    } catch (ex: unknown) {
      setErr((ex as Error)?.message ?? 'Signup failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const gateProps = {
    done,
    leadId,
    accessKey,
    setAccessKey,
    keyUnlocked,
    setKeyUnlocked,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    phone,
    setPhone,
    consent,
    setConsent,
    busy,
    err,
    verifyKey,
    assigneeName,
    assigneeEmailHint,
    submit,
    loginPath,
    navigate,
  };

  return (
    <div className="hos-landing min-h-screen text-white">
      <header className="hos-landing-nav">
        <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-400/35 bg-black/40 text-amber-200">
              <Shield size={18} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/80">{HEAD_OF_SOCIETY_NAME}</p>
              <p className="text-xs font-bold text-white/70 truncate">Private member entrance · {HETA_SOCIETY_SHORT}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(loginPath)}>
              <LogIn size={16} /> Member login
            </Button>
            <Button variant="gold" size="sm" onClick={scrollToAccess}>
              Enter access key
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="hos-landing-hero">
        <div className="hos-landing-hero-art" aria-hidden />
        <div className="hos-landing-hero-glow" aria-hidden />
        <div className="hos-flyer-shimmer opacity-40" aria-hidden />
        <div className="hos-landing-grain" aria-hidden />

        <div className="container relative z-[2] mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-10">
            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap gap-2">
                <span className="hos-landing-chip">
                  <Shield size={14} className="shrink-0 text-amber-200/90" aria-hidden /> {HETA_SOCIETY_SHORT} · Invite-only
                </span>
                <span className="hos-landing-chip !border-emerald-400/25 !bg-emerald-500/10 !text-emerald-100">
                  Men's restoration lane
                </span>
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.35rem]">
                <span className="block text-white">{HETA_SOCIETY_TAGLINE}</span>
                <span className="mt-3 block hos-flyer-foil">{HETA_SOCIETY_HERO_ACCENT}</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/62 sm:text-lg">
                {HEAD_OF_SOCIETY_NAME} is not the general Finely portal — it is your dedicated command center to restore
                personal credit, stand up business credit, and grow with discipline. Access by private key only.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {HETA_SOCIETY_STATS.map(({ value, label, sub }) => (
                  <div key={label} className="hos-landing-stat">
                    <div className="hos-landing-stat-value">{value}</div>
                    <p className="mt-1.5 text-[11px] font-black uppercase tracking-wide text-white/85">{label}</p>
                    <p className="mt-0.5 text-[10px] text-white/45">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button variant="gold" size="lg" onClick={scrollToAccess}>
                  Enter access key <ArrowRight size={18} />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate(loginPath)}>
                  <LogIn size={18} /> Returning member
                </Button>
              </div>
            </div>

            <HosAccessGate {...gateProps} />
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="hos-landing-manifesto py-8 sm:py-10">
        <div className="container mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/70">The standard</p>
          <p className="mt-4 text-xl font-bold leading-relaxed text-white/88 sm:text-2xl">&ldquo;{HETA_SOCIETY_MANIFESTO}&rdquo;</p>
        </div>
      </section>

      {/* Pillars */}
      <section className="container mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75">What you command</p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Restore. Build. Grow. On your terms.</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
            Everything in HOS is built for men who want a tracked file — not hype, not random PDFs floating in email.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HETA_SOCIETY_PILLARS.map(({ id, title, desc, accent }) => {
            const Icon = PILLAR_ICON[accent];
            return (
              <div key={id} className="hos-landing-pillar group">
                <div className={`hos-landing-pillar-glow ${PILLAR_GLOW[accent]}`} aria-hidden />
                <Icon className={`relative mb-4 h-7 w-7 ${PILLAR_ICON_COLOR[accent]}`} />
                <p className="relative font-black text-white">{title}</p>
                <p className="relative mt-2 text-sm leading-relaxed text-white/55">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits grid */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75">Membership includes</p>
              <h2 className="mt-2 text-2xl font-black text-white">Your HOS file, fully loaded</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {HETA_SOCIETY_BENEFITS.map(({ id, title, desc }) => (
              <div
                key={id}
                className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-5 transition hover:border-amber-400/35"
              >
                <p className="text-base font-black text-white">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="container mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75">Choose your lane</p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Free guide vs. full HOS membership</h2>
          <p className="mt-3 text-sm text-white/55">
            Start with the PDF if you only need letters. Join HOS when you want a tracked restoration file and portal tools.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          <div className="hos-landing-vs-card">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">Public lane</p>
            <h3 className="mt-2 text-xl font-black text-white/85">Free dispute guide</h3>
            <ul className="mt-5 space-y-3">
              {HOS_VS_FREE_GUIDE.map(({ feature, freeGuide }) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/65">
                  {freeGuide ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Minus className="h-4 w-4 shrink-0 text-white/25" />
                  )}
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="mt-6 w-full" onClick={() => navigate('/free-guide')}>
              Get free guide only
            </Button>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center px-2">
            <span className="rounded-full border border-amber-400/35 bg-amber-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-100">
              VS
            </span>
          </div>

          <div className="hos-landing-vs-card hos-landing-vs-card--hos relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" aria-hidden />
            <p className="relative text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80">Private lane</p>
            <h3 className="relative mt-2 text-xl font-black hos-flyer-foil">{HETA_SOCIETY_SHORT} membership</h3>
            <ul className="relative mt-5 space-y-3">
              {HOS_VS_FREE_GUIDE.map(({ feature, hos }) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/80">
                  {hos ? (
                    <Check className="h-4 w-4 shrink-0 text-amber-300" />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-white/25" />
                  )}
                  {feature}
                </li>
              ))}
            </ul>
            <Button variant="gold" className="relative mt-6 w-full" onClick={scrollToAccess}>
              Enter access key <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </section>

      {/* Member path */}
      <section className="container mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75">Your path in</p>
          <h2 className="mt-2 text-2xl font-black text-white">Four steps to your command center</h2>
        </div>
        <div className="hos-landing-path">
          <div className="hos-landing-path-line" aria-hidden />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MEMBER_STEPS.map(({ id, title, desc }, i) => (
              <div key={id} className="hos-landing-path-step">
                <div className="hos-landing-path-num mb-3">{String(i + 1).padStart(2, '0')}</div>
                <p className="font-black text-white">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portal preview */}
      <section className="border-t border-white/[0.06] bg-gradient-to-b from-transparent to-black/40 py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75">Inside the portal</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Your HOS command center</h2>
              <p className="mt-2 max-w-xl text-sm text-white/55">
                Disputes, business build, and letter tools — one disciplined lane after you create login.
              </p>
            </div>
            <Button variant="gold" onClick={() => navigate('/portal/hos')}>
              Preview portal <ArrowRight size={16} />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="hos-landing-portal-mock md:col-span-2">
              <div className="hos-landing-portal-bar">
                <span /><span /><span />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/70">Dispute tracker</p>
              <p className="mt-2 text-lg font-black text-white">{HETA_SOCIETY_DISPUTE_LIMIT} active slots · FCRA clock</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {['Intake', 'Letter sent', '30-day window'].map((step, idx) => (
                  <div key={step} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Slot {idx + 1}</p>
                    <p className="mt-1 text-xs font-semibold text-white/75">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="hos-landing-portal-mock">
                <Building2 className="mb-2 h-5 w-5 text-violet-300" />
                <p className="font-black text-white">Business credit OS</p>
                <p className="mt-1 text-xs text-white/50">Foundation → Tier 1–4 vendors</p>
              </div>
              <div className="hos-landing-portal-mock">
                <BookOpen className="mb-2 h-5 w-5 text-emerald-300" />
                <p className="font-black text-white">Letter guide</p>
                <p className="mt-1 text-xs text-white/50">PDF + portal send & track</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upload CTA */}
      <section className="container mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.1] to-black/40 p-6 sm:p-8">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15">
                <Upload className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <p className="text-lg font-black text-white">Already have a credit report?</p>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  After login, upload in the portal — HOS tracks your disputes with timeline and letter prep.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    Intake → upload → letter ready → sent → 30-day window
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    Up to {HETA_SOCIETY_DISPUTE_LIMIT} active items in your restoration file
                  </li>
                </ul>
              </div>
            </div>
            <Button variant="emerald" size="md" className="shrink-0" onClick={() => navigate(loginPath)}>
              Log in to upload
            </Button>
          </div>
        </div>
      </section>

      {/* Careers */}
      <section className="container mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Users className="h-6 w-6 text-sky-300" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200/70">When you are ready</p>
            <h2 className="text-2xl font-black text-white">Career paths beyond your file</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {HETA_SOCIETY_CAREER_PATHS.map(({ id, title, desc, path }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigate(path)}
              className="group rounded-2xl border border-white/[0.1] bg-white/[0.03] p-5 text-left transition hover:border-sky-300/35 hover:bg-sky-500/[0.06] hover:shadow-[0_20px_50px_-30px_rgba(56,189,248,0.35)]"
            >
              <Shield className="mb-3 h-5 w-5 text-sky-300 transition group-hover:scale-110" />
              <p className="font-black text-white">{title}</p>
              <p className="mt-2 text-sm text-white/55">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-sky-200/80">
                Explore <ArrowRight size={12} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-200/75">Questions</p>
          <h2 className="mt-2 text-2xl font-black text-white">HOS FAQ</h2>
        </div>
        <div className="space-y-2">
          {HETA_SOCIETY_FAQ.map(({ id, q, a }) => {
            const open = openFaq === id;
            return (
              <div key={id} className="hos-landing-faq-item" data-open={open ? 'true' : 'false'}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
                >
                  <span className="font-bold text-white/92">{q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-amber-200/70 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open ? (
                  <div className="border-t border-white/[0.06] px-4 pb-4 sm:px-5">
                    <p className="text-sm leading-relaxed text-white/58">{a}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="hos-landing-cta-banner mt-10 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="relative z-[1]">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/80">Ready?</p>
            <p className="mt-2 text-2xl font-black text-white sm:text-3xl">Open your restoration file today</p>
            <p className="mt-2 max-w-lg text-sm text-white/55">
              Have your access key ready — verify it, create login, and start your first dispute round.
            </p>
          </div>
          <Button variant="gold" size="lg" className="relative z-[1] mt-5 shrink-0 sm:mt-0" onClick={scrollToAccess}>
            Enter access key <ArrowRight size={18} />
          </Button>
        </div>
      </section>

      <FinelyOsPageFooter />
    </div>
  );
}
