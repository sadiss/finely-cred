import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Gavel, Scale } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
import { CareerResourceRail } from '../../components/careers/CareerResourceRail';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  CASE_DESK_CAREERS_PATH,
  CASE_DESK_GUIDE_CHAPTERS,
  CASE_DESK_GUIDE_META,
  CASE_DESK_GUIDE_PATH,
  CASE_DESK_GUIDE_READ_PATH,
  DEBT_GUIDE_PREREQ_PATH,
} from './caseDeskOperatorGuideContent';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PAGE,
  finelyOsLandingWealthyIvorySection,
} from '../../features/os/finelyOsLightUi';

const SERIF = 'font-serif';

export default function CaseDeskGuideLandingPage() {
  const navigate = useNavigate();

  usePublicSeoMeta({
    title: `${CASE_DESK_GUIDE_META.title} — Free operator handbook`,
    description: CASE_DESK_GUIDE_META.description,
    path: CASE_DESK_GUIDE_PATH,
  });

  return (
    <main className={`${FINELY_OS_PAGE} min-h-screen bg-[#f3ecdb]`}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <Link to={CASE_DESK_CAREERS_PATH} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Case desk careers
          </Link>
          <button
            type="button"
            className={`${SERIF} text-sm font-bold text-stone-700 underline underline-offset-4 hover:text-stone-900`}
            onClick={() => navigate(DEBT_GUIDE_PREREQ_PATH)}
          >
            Prerequisite: Debt & summons guide
          </button>
        </div>

        <section className={`mt-2 rounded-3xl px-5 sm:px-10 py-12 sm:py-14 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-sm border border-stone-500/50 bg-[#efe7d4] px-3 py-1.5">
                  <Gavel size={13} className="text-stone-700" />
                  <span className={`${SERIF} text-[10px] font-black uppercase tracking-[0.24em] text-stone-700`}>
                    {CASE_DESK_GUIDE_META.edition}
                  </span>
                </span>
                <span className={`${SERIF} text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/80`}>
                  {CASE_DESK_GUIDE_META.valueLabel}
                </span>
              </div>

              <LandingTypewriterTitle
                as="h1"
                text="Case Desk Operator Guide"
                className={`mt-5 ${SERIF} text-4xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-stone-900 leading-[1.08]`}
                speedMs={32}
              />
              <p className={`mt-4 max-w-xl ${SERIF} text-lg leading-relaxed text-stone-700`}>
                {CASE_DESK_GUIDE_META.tagline}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-sm border-[3px] border-double border-stone-700/60 bg-[#f6f1e4] px-6 py-3 font-serif text-sm font-bold text-stone-900 shadow-[3px_3px_0_rgba(68,64,60,0.35)] hover:-translate-y-0.5"
                  onClick={() => navigate(CASE_DESK_GUIDE_READ_PATH)}
                >
                  <BookOpen size={15} /> Read every chapter free <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-sm border border-stone-500/60 bg-stone-900 px-5 py-3 font-serif text-sm font-bold text-[#f6f1e4] hover:bg-stone-800"
                  onClick={() => navigate(CASE_DESK_CAREERS_PATH)}
                >
                  Apply to the case desk <ArrowRight size={14} />
                </button>
              </div>

              <ul className="mt-8 space-y-3">
                {[
                  'Packet anatomy and track separation',
                  'Scope discipline — per-partner, logged, revocable',
                  'Validation-first doctrine and when to escalate',
                  'Complaint ladder with CFPB, AG, FTC, BBB',
                ].map((line) => (
                  <li key={line} className={`flex items-start gap-3 ${SERIF} text-[15px] text-stone-700`}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[#faf6ea]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* Book-first mock — parchment cover */}
            <button
              type="button"
              onClick={() => navigate(CASE_DESK_GUIDE_READ_PATH)}
              className="group relative mx-auto w-full max-w-md text-left"
              aria-label="Open Case Desk Operator Guide"
            >
              <div className="absolute -inset-3 rounded-sm bg-stone-900/10 blur-xl transition group-hover:bg-stone-900/15" />
              <div
                className="relative overflow-hidden rounded-sm border border-stone-500/50 p-7 sm:p-8 shadow-[12px_18px_0_rgba(68,64,60,0.18)] transition group-hover:-translate-y-1"
                style={{
                  background:
                    'linear-gradient(165deg,#faf6ea 0%,#ebe2cb 55%,#e3d8bc 100%)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <Scale size={22} className="text-stone-700" />
                  <span className={`${SERIF} text-[10px] font-black uppercase tracking-[0.28em] text-stone-500`}>
                    Finely Cred
                  </span>
                </div>
                <p className={`mt-8 ${SERIF} text-[11px] font-black uppercase tracking-[0.3em] text-rose-800/70`}>
                  Operator handbook
                </p>
                <h2 className={`mt-3 ${SERIF} text-3xl font-bold leading-tight text-stone-900`}>
                  Case Desk
                  <br />
                  Operator Guide
                </h2>
                <p className={`mt-4 ${SERIF} text-sm italic leading-relaxed text-stone-600`}>
                  {CASE_DESK_GUIDE_META.tagline}
                </p>
                <div className="mt-10 border-t border-stone-400/50 pt-4">
                  <p className={`${SERIF} text-[12px] font-bold uppercase tracking-[0.2em] text-stone-600`}>
                    {CASE_DESK_GUIDE_CHAPTERS.length} chapters · free to read
                  </p>
                </div>
              </div>
            </button>
          </div>
        </section>

        <section className={`mt-6 rounded-3xl px-5 sm:px-8 py-10 ${finelyOsLandingWealthyIvorySection()}`}>
          <p className={`${SERIF} text-[10px] font-black uppercase tracking-[0.3em] text-stone-500`}>Inside the handbook</p>
          <h2 className={`mt-2 ${SERIF} text-3xl font-bold text-stone-900`}>Seven sheets. One operating stance.</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">
            {CASE_DESK_GUIDE_CHAPTERS.map((ch) => (
              <li key={ch.id}>
                <button
                  type="button"
                  onClick={() => navigate(`${CASE_DESK_GUIDE_READ_PATH}?chapter=${ch.id}`)}
                  className="flex w-full items-start gap-4 rounded-sm border border-stone-400/45 bg-[#faf6ea] p-4 text-left transition hover:border-stone-600 hover:shadow-[3px_3px_0_rgba(68,64,60,0.2)]"
                >
                  <span className={`${SERIF} text-2xl font-black tabular-nums text-stone-400`}>{ch.sheet}</span>
                  <span className="min-w-0">
                    <span className={`block ${SERIF} text-base font-bold text-stone-900`}>{ch.title}</span>
                    <span className={`mt-1 block ${SERIF} text-sm text-stone-600`}>{ch.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6">
          <CareerResourceRail role="case_help" tone="parchment" heading="Resource rail" />
        </section>

        <section className="mt-6">
          <MarketingStaffChatStrip
            roleId="dispute_coach"
            goal="debt"
            roleLabel="case desk"
            subline="Ask about validation sequencing, packet prep, or when to climb the complaint ladder — educational only."
          />
        </section>

        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-stone-600 !mx-0 !text-left mt-6`}>
          {CASE_DESK_GUIDE_META.compliance}
        </p>
      </div>
    </main>
  );
}
