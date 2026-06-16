import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  Download,
  ExternalLink,
  Gavel,
  KeyRound,
  Lock,
  Minus,
  Printer,
  Shield,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  HEAD_OF_SOCIETY_NAME,
  HEAD_OF_SOCIETY_PATH,
  HETA_SOCIETY_DISPUTE_LIMIT,
  HETA_SOCIETY_SHORT,
  HETA_SOCIETY_TAGLINE,
} from '../../config/hetaSocietyProgram';
import { downloadHosAccessFlyerPdf, hosFlyerPageUrl } from '../../lib/downloadHosAccessFlyerPdf';
import { qrCodeImageUrl } from '../../lib/leadAttribution';
import { HosBrandMark } from './HosBrandMark';

type Props = {
  onEnterKey?: () => void;
  className?: string;
  showDownload?: boolean;
};

const PILLARS = [
  {
    icon: Gavel,
    glow: 'bg-amber-500',
    title: `${HETA_SOCIETY_DISPUTE_LIMIT} dispute slots`,
    desc: 'FCRA-tracked rounds, letters, and bureau timelines.',
  },
  {
    icon: Building2,
    glow: 'bg-violet-500',
    title: 'Business credit OS',
    desc: 'Foundation gate → Tier 1–4 vendors for your industry.',
  },
  {
    icon: TrendingUp,
    glow: 'bg-emerald-500',
    title: 'Restore + build',
    desc: 'Personal restoration and business fundability together.',
  },
  {
    icon: Shield,
    glow: 'bg-sky-500',
    title: 'Growth paths',
    desc: 'Specialist, agent, and referral lanes when ready.',
  },
];

const VS_ROWS = [
  { label: 'Private member portal', public: false, hos: true },
  { label: 'Tracked dispute file', public: false, hos: true },
  { label: 'Business credit sequencing', public: false, hos: true },
  { label: 'Invite-only access key', public: false, hos: true },
  { label: 'Free PDF guide only', public: true, hos: true },
];

const PATH_STEPS = [
  { n: '01', title: 'Receive your key', desc: 'HOS-XXXXXXXX issued privately by Finely or an authorized leader.' },
  { n: '02', title: 'Verify & register', desc: 'Enter your key at the member entrance and complete your file.' },
  { n: '03', title: 'Command center', desc: 'Disputes, business build, letter guide — one disciplined lane.' },
];

export function HosAccessFlyer({ onEnterKey, className = '', showDownload = true }: Props) {
  const [busy, setBusy] = useState(false);
  const pageUrl = hosFlyerPageUrl();
  const qrUrl = useMemo(() => qrCodeImageUrl(pageUrl, 200), [pageUrl]);

  const downloadPdf = async () => {
    setBusy(true);
    try {
      await downloadHosAccessFlyerPdf();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="hos-flyer" className={`hos-access-flyer relative scroll-mt-28 ${className}`} aria-label={`${HEAD_OF_SOCIETY_NAME} access flyer`}>
      {showDownload ? (
        <div className="hos-flyer-toolbar mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.08] to-transparent px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Private handoff asset</p>
            <p className="mt-1 text-sm text-white/60">Download · print · text to men you are inviting into {HETA_SOCIETY_SHORT}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`${HEAD_OF_SOCIETY_PATH}/flyer`} className="hos-flyer-btn-ghost inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/5">
              <ExternalLink size={14} /> Flyer page
            </a>
            <button type="button" onClick={() => window.print()} className="hos-flyer-btn-ghost inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/5">
              <Printer size={14} /> Print
            </button>
            <button type="button" disabled={busy} onClick={() => void downloadPdf()} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-100 via-amber-400 to-amber-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#1a1400] shadow-[0_8px_30px_-8px_rgba(251,191,36,0.55)] disabled:opacity-50">
              <Download size={14} /> {busy ? 'Building PDF…' : 'Download PDF'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="hos-flyer-poster">
        <div className="hos-flyer-shimmer" aria-hidden />
        <div className="hos-flyer-crest" aria-hidden>
          <img
            src="/hos/hos-mark.svg"
            alt=""
            className="absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
            draggable={false}
          />
          <div className="hos-flyer-crest-inner" />
        </div>

        <div className="relative z-[1] p-5 sm:p-8 lg:p-10">
          {/* Masthead */}
          <div className="flex flex-col gap-6 border-b border-white/[0.07] pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl border border-amber-400/45 bg-gradient-to-br from-amber-400/30 via-amber-600/10 to-transparent shadow-[0_0_60px_-8px_rgba(251,191,36,0.7)] p-3">
                <HosBrandMark size={52} className="h-full w-full" alt="" />
                <div className="absolute -inset-px rounded-2xl ring-1 ring-amber-300/20" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300/80">Finely Cred presents</p>
                <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">{HEAD_OF_SOCIETY_NAME}</h2>
                <p className="mt-1 text-sm font-bold uppercase tracking-[0.12em] text-white/45">{HETA_SOCIETY_SHORT} · invite-only member lane</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="hos-flyer-stat-pill">
                <span className="text-xl font-black text-amber-200">{HETA_SOCIETY_DISPUTE_LIMIT}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/45">Disputes</span>
              </div>
              <div className="hos-flyer-stat-pill">
                <span className="text-xl font-black text-amber-200">4</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/45">Biz tiers</span>
              </div>
              <div className="hos-flyer-stat-pill">
                <span className="text-xl font-black text-amber-200">1</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/45">Private file</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-50">
                <Lock size={12} /> Key required
              </span>
            </div>
          </div>

          {/* Hero headline */}
          <div className="mt-10 text-center lg:text-left">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200/70">Member access briefing</p>
            <h3 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-[3.25rem]">
              <span className="hos-flyer-foil">{HETA_SOCIETY_TAGLINE.replace('.', '')}</span>
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/55 lg:mx-0 lg:text-lg">
              Not the public portal. A keyed entrance for men restoring personal credit, building business credit, and growing with discipline.
            </p>
          </div>

          {/* Public vs HOS */}
          <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
            <div className="hos-flyer-vs-col">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">General site</p>
              <p className="mt-1 text-lg font-bold text-white/70">Public Finely</p>
              <ul className="mt-4 space-y-2.5">
                {VS_ROWS.map(({ label, public: pub }) => (
                  <li key={label} className="flex items-center gap-2 text-sm text-white/50">
                    {pub ? <Check className="h-4 w-4 shrink-0 text-white/30" /> : <Minus className="h-4 w-4 shrink-0 text-white/20" />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden lg:flex flex-col items-center justify-center px-2">
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200">VS</span>
            </div>
            <div className="hos-flyer-vs-col hos-flyer-vs-col--hos">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-200/80">Private lane</p>
              <p className="mt-1 text-lg font-bold text-white">{HEAD_OF_SOCIETY_NAME}</p>
              <ul className="mt-4 space-y-2.5">
                {VS_ROWS.map(({ label, hos }) => (
                  <li key={label} className="flex items-center gap-2 text-sm text-white/85">
                    {hos ? <Check className="h-4 w-4 shrink-0 text-amber-400" /> : <X className="h-4 w-4 shrink-0 text-white/25" />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main grid: pillars + ticket */}
          <div className="mt-10 grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
            <div className="grid gap-3 sm:grid-cols-2">
              {PILLARS.map(({ icon: Icon, glow, title, desc }) => (
                <div key={title} className="hos-flyer-pillar group">
                  <div className={`hos-flyer-pillar-glow ${glow}`} />
                  <Icon className="relative mb-3 h-6 w-6 text-amber-200/90" />
                  <p className="relative text-sm font-black text-white">{title}</p>
                  <p className="relative mt-1.5 text-xs leading-relaxed text-white/48">{desc}</p>
                </div>
              ))}
            </div>

            <div className="hos-flyer-ticket p-6 sm:p-7">
              <div className="hos-flyer-ticket-notch hos-flyer-ticket-notch-left" aria-hidden />
              <div className="hos-flyer-ticket-notch hos-flyer-ticket-notch-right" aria-hidden />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-200">
                    <KeyRound className="h-5 w-5" />
                    <span className="text-xs font-black uppercase tracking-[0.16em]">Access ticket</span>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">Present at member entrance</p>
                </div>
                <span className="rotate-2 rounded border border-amber-300/60 bg-gradient-to-br from-amber-200 to-amber-500 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em] text-[#1a1400] shadow-lg">
                  Confidential
                </span>
              </div>

              <div className="mt-6 rounded-xl border border-dashed border-amber-400/40 bg-black/50 px-4 py-6 text-center ring-1 ring-inset ring-amber-400/10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Private key format</p>
                <p className="mt-3 font-mono text-3xl font-black tracking-[0.22em] text-transparent bg-gradient-to-b from-amber-50 via-amber-300 to-amber-600 bg-clip-text sm:text-4xl">
                  HOS-XXXXXXXX
                </p>
                <p className="mt-3 text-xs text-white/45">Single-use by default · do not share publicly</p>
              </div>

              <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="relative flex-1 pl-8">
                  <div className="hos-flyer-path-line hidden sm:block" aria-hidden />
                  <ol className="space-y-5">
                    {PATH_STEPS.map(({ n, title, desc }) => (
                      <li key={n} className="relative flex gap-3">
                        <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-xs font-black text-[#1a1400] shadow-[0_4px_14px_-4px_rgba(251,191,36,0.6)]">
                          {n}
                        </span>
                        <div>
                          <p className="font-bold text-white">{title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-white/48">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="shrink-0 rounded-xl border border-white/10 bg-white p-2 shadow-inner">
                  <img src={qrUrl} alt="QR code to HOS member entrance" width={120} height={120} className="block rounded-lg" />
                  <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-wide text-white/40">Scan entrance</p>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-sm leading-relaxed text-white/70">
                  <span className="font-bold text-emerald-200/90">Why it&apos;s special: </span>
                  One disciplined lane — restoration, building, and growth — without the noise of the general site.
                </p>
              </div>

              {onEnterKey ? (
                <button
                  type="button"
                  onClick={onEnterKey}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 via-amber-400 to-amber-600 py-4 text-sm font-black uppercase tracking-wide text-[#1a1400] shadow-[0_16px_40px_-12px_rgba(251,191,36,0.6)] transition hover:scale-[1.01] hover:brightness-105"
                >
                  I have my access key <ArrowRight className="h-4 w-4" />
                </button>
              ) : null}

              <p className="mt-4 text-center font-mono text-[11px] text-amber-200/50">{pageUrl.replace(/^https?:\/\//, '')}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
            <p className="max-w-xl text-xs leading-relaxed text-white/40">
              For private handoff only — text, email, or print for men you are inviting. Pair this flyer with their personal{' '}
              <span className="font-mono text-amber-200/60">HOS-XXXXXXXX</span> key.
            </p>
            {showDownload ? (
              <button type="button" disabled={busy} onClick={() => void downloadPdf()} className="inline-flex items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-500/10 px-5 py-2.5 text-xs font-black uppercase tracking-wide text-amber-100 hover:bg-amber-500/15 disabled:opacity-50">
                <Download size={14} /> Download PDF
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
