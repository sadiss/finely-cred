import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, BookOpen, ChevronLeft, ChevronRight, PenLine, ShieldCheck } from 'lucide-react';
import {
  DISPUTE_LETTER_GUIDE_COVER,
  DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES,
  DISPUTE_LETTER_GUIDE_PAGE_COUNT,
  DISPUTE_LETTER_GUIDE_READ_PATH,
  type GeneratedGuidePage,
} from '../../resources/disputeLetterGuideContent';
import '../../pages/leadmagnet/disputeGuideReader.css';

/** Chapters worth showing in the spread — front matter first, then framework and craft. */
const SPOTLIGHT_IDS = [
  'read-this-first',
  'report-anatomy',
  'finding-not-feeling',
  'round-map',
  'five-step-overview',
  'step-1',
  'example-letter',
  'validation-first-doctrine',
];

const PREVIEW_SLIDES = [
  { type: 'cover' as const, label: 'Cover' },
  { type: 'intro' as const, label: 'Introduction' },
  ...SPOTLIGHT_IDS.flatMap((id) => {
    const page = DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.find((p) => p.id === id);
    return page ? [{ type: 'page' as const, page, label: page.title }] : [];
  }),
  { type: 'toc' as const, label: 'Full guide contents' },
];

type Props = {
  compact?: boolean;
  className?: string;
};

const INTRO_POINTS = [
  'How a reinvestigation actually works — before you write a word',
  'The eleven account-block fields that decide every dispute',
  'Factual findings vs discarded language, side by side',
  'The 5-step framework, one chapter per step',
  'Certified mail workflow, escalation paths, and the model letter',
];

function SheetPage({ page }: { page: GeneratedGuidePage }) {
  const first = page.sections[0];
  const bulletSection = page.sections.find((s) => s.bullets?.length);
  const evidence = page.sections.find((s) => s.evidence)?.evidence;
  const annotation = page.sections.find((s) => s.annotation)?.annotation;

  return (
    <div className="fdg-sheet absolute inset-0 overflow-y-auto !rounded-none !shadow-none">
      <div className={`fdg-rail fdg-rail--${page.accent ?? 'sky'} !rounded-none`} aria-hidden />
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between gap-2">
          <span className="fdg-kicker">{page.kicker ?? 'Chapter'}</span>
          {page.readMinutes ? <span className="fdg-meta-row">{page.readMinutes} min</span> : null}
        </div>
        <h4 className="fdg-chapter-title mt-1.5 !text-[1.35rem] sm:!text-2xl">{page.title}</h4>
        {page.subtitle ? <p className="fdg-chapter-sub mt-1.5 !text-[13px]">{page.subtitle}</p> : null}

        <div className="mt-3 border-t border-[#e6e2d8] pt-3">
          {first?.heading ? (
            <p className="fdg-section-heading !text-[15px]">
              <span className="fdg-mark">{first.heading}</span>
            </p>
          ) : null}
          {first?.paragraphs?.slice(0, 2).map((p) => (
            <p key={p.slice(0, 30)} className="fdg-body-text mt-2 !text-[12.5px] !leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        {bulletSection?.bullets?.length ? (
          <ol className="fdg-findings mt-3">
            {bulletSection.bullets.slice(0, 4).map((b) => (
              <li key={b} className="fdg-finding !text-[12px] !py-1.5">
                <span>{b}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {annotation ? (
          <aside className="fdg-annotation !mt-3 !text-[12px]">
            <PenLine size={13} className="fdg-annotation-icon" aria-hidden />
            {annotation}
          </aside>
        ) : null}

        {evidence ? (
          <aside className="fdg-evidence !mt-3">
            <div className="fdg-evidence-label">{evidence.label}</div>
            <p className="fdg-evidence-text !text-[12px]">{evidence.text}</p>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export function DisputeLetterGuidePreview({ compact, className = '' }: Props) {
  const [idx, setIdx] = useState(0);
  const slide = PREVIEW_SLIDES[idx] ?? PREVIEW_SLIDES[0]!;

  return (
    <div
      className={`fdg-reader !min-h-0 overflow-hidden rounded-2xl border border-[#0f6fb8]/25 bg-[#0b1420] shadow-2xl shadow-black/40 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] bg-[#060c14] px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="fdg-stamp">Docket preview</span>
          <span className="fdg-meta-row hidden truncate sm:inline">{DISPUTE_LETTER_GUIDE_PAGE_COUNT} pages</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setIdx((i) => (i - 1 + PREVIEW_SLIDES.length) % PREVIEW_SLIDES.length)}
            className="fdg-ghost-btn rounded-md p-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="fdg-meta-row w-9 text-center tabular-nums">
            {idx + 1}/{PREVIEW_SLIDES.length}
          </span>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => setIdx((i) => (i + 1) % PREVIEW_SLIDES.length)}
            className="fdg-ghost-btn rounded-md p-1.5"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className={`relative bg-[#0b1420] ${compact ? 'aspect-[3/4]' : 'aspect-[3/4] sm:aspect-[4/5]'}`}>
        {slide.type === 'cover' ? (
          <>
            <img
              src={DISPUTE_LETTER_GUIDE_COVER}
              alt={slide.label}
              className="absolute inset-0 h-full w-full bg-white object-contain object-center p-2 sm:p-3"
              loading="lazy"
              onError={(e) => {
                const el = e.currentTarget;
                el.style.display = 'none';
                el.parentElement?.querySelector('[data-fallback-cover]')?.classList.remove('hidden');
              }}
            />
            <div data-fallback-cover className="fdg-sheet absolute inset-0 hidden !rounded-none flex-col justify-end p-6">
              <div className="fdg-rail fdg-rail--sky absolute inset-x-0 top-0 !rounded-none" aria-hidden />
              <span className="fdg-kicker">Finely Cred · free edition</span>
              <h3 className="fdg-chapter-title mt-2 !text-2xl">Free Credit Dispute Letter Guide</h3>
              <p className="fdg-chapter-sub mt-2 !text-sm">
                Read your report like an analyst · write findings, not feelings · certified mail workflow
              </p>
            </div>
          </>
        ) : null}

        {slide.type === 'intro' ? (
          <div className="fdg-sheet absolute inset-0 overflow-y-auto !rounded-none">
            <div className="fdg-rail fdg-rail--ink !rounded-none" aria-hidden />
            <div className="px-5 py-6">
              <span className="fdg-kicker">Introduction</span>
              <h4 className="fdg-chapter-title mt-1.5 !text-2xl">Your guide is ready</h4>
              <p className="fdg-chapter-sub mt-2 !text-[13px]">
                Twenty-one chapters, built to be worked in order. Educational only — not legal advice.
              </p>
              <ol className="fdg-findings mt-4">
                {INTRO_POINTS.map((item) => (
                  <li key={item} className="fdg-finding !text-[12.5px]">
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        {slide.type === 'page' ? <SheetPage page={slide.page} /> : null}

        {slide.type === 'toc' ? (
          <div className="fdg-sheet absolute inset-0 overflow-y-auto !rounded-none">
            <div className="fdg-rail fdg-rail--amber !rounded-none" aria-hidden />
            <div className="px-5 py-6">
              <span className="fdg-kicker">Docket index</span>
              <h4 className="fdg-chapter-title mt-1.5 !text-2xl">What&apos;s inside</h4>
              <ol className="fdg-findings mt-3">
                {DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.map((p) => (
                  <li key={p.id} className="fdg-finding !text-[12.5px] !py-1.5">
                    <span>{p.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </div>

      <div className="truncate border-t border-white/[0.08] px-3 py-2 text-[10px] text-white/50 sm:px-4 sm:text-xs">
        {slide.label}
      </div>

      <div className="grid grid-cols-2 gap-2 px-3 pb-2 sm:px-4">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#0f6fb8]/25 bg-[#0f6fb8]/10 px-2 py-2 text-[10px] text-sky-100">
          <ShieldCheck className="h-3.5 w-3.5 text-sky-300" /> Secure PDF
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-2 text-[10px] text-amber-100">
          <BadgeCheck className="h-3.5 w-3.5 text-amber-300" /> FCRA checklist
        </div>
      </div>

      <div className="px-3 pb-3 sm:px-4">
        <Link
          to={DISPUTE_LETTER_GUIDE_READ_PATH}
          className="fdg-primary-btn inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em]"
        >
          <span className="relative z-10 inline-flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" /> Read all {DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.length} chapters free
          </span>
        </Link>
      </div>
    </div>
  );
}

export function DisputeLetterGuideContentsList({ className = '' }: { className?: string }) {
  const items = DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.map((p) => p.title);
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
          <span className="mt-0.5 shrink-0 text-sky-400">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
