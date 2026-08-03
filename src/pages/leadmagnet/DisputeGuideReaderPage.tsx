import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  List,
  PenLine,
  X,
} from 'lucide-react';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { downloadDisputeLetterGuidePdf } from '../../resources/buildDisputeLetterGuidePdf';
import {
  DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES,
  DISPUTE_LETTER_GUIDE_READ_PATH,
  type DisputeGuideAccent,
  type GeneratedGuidePage,
  type GeneratedGuideSection,
} from '../../resources/disputeLetterGuideContent';
import './disputeGuideReader.css';

const CHAPTERS = DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES;
const LANDING_PATH = '/free-guide';
const COMPLIANCE = 'Educational only · not legal advice · results vary';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function railClass(accent: DisputeGuideAccent | undefined) {
  return `fdg-rail fdg-rail--${accent ?? 'sky'}`;
}

/** Renders [bracketed fields] in a letter draft as fill-in tokens. */
function DraftLine({ line }: { line: string }) {
  if (!line.trim()) return <span>{'\n'}</span>;
  const parts = line.split(/(\[[^\]]+\])/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('[') && part.endsWith(']') ? (
          <span key={i} className="fdg-draft-field">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
      {'\n'}
    </span>
  );
}

function SectionBlock({
  section,
  isFirstOfChapter,
}: {
  section: GeneratedGuideSection;
  isFirstOfChapter: boolean;
}) {
  return (
    <section className="fdg-section">
      {section.heading ? (
        <h2 className="fdg-section-heading">
          <span className="fdg-mark fdg-animate-mark">{section.heading}</span>
        </h2>
      ) : null}

      {section.letterExcerpt?.length ? (
        <div className="fdg-draft">
          <div className="fdg-draft-head">
            <span className="inline-flex items-center gap-1.5">
              <FileText size={12} /> Draft — Round 1
            </span>
            <span>Replace every bracket</span>
          </div>
          <div className="fdg-draft-body">
            {section.letterExcerpt.map((line, i) => (
              <DraftLine key={`${i}-${line.slice(0, 12)}`} line={line} />
            ))}
          </div>
        </div>
      ) : (
        section.paragraphs?.map((p, i) => (
          <p
            key={p.slice(0, 40)}
            className={cn('fdg-body-text', isFirstOfChapter && i === 0 && !section.heading && 'fdg-lede')}
          >
            {p}
          </p>
        ))
      )}

      {section.bullets?.length ? (
        <ol className="fdg-findings mt-4">
          {section.bullets.map((b) => (
            <li key={b} className="fdg-finding">
              <span>{b}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {section.comparison ? (
        <div className="fdg-compare">
          <div className="fdg-compare-col fdg-compare-col--bad">
            <div className="fdg-compare-label">{section.comparison.badLabel}</div>
            {section.comparison.bad.map((line) => (
              <div key={line} className="fdg-compare-line">
                <span aria-hidden>✕</span>
                <span className="fdg-strike">{line}</span>
              </div>
            ))}
          </div>
          <div className="fdg-compare-col fdg-compare-col--good">
            <div className="fdg-compare-label">{section.comparison.goodLabel}</div>
            {section.comparison.good.map((line) => (
              <div key={line} className="fdg-compare-line">
                <span aria-hidden>✓</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {section.annotation ? (
        <aside className="fdg-annotation">
          <PenLine size={14} className="fdg-annotation-icon" aria-hidden />
          {section.annotation}
        </aside>
      ) : null}

      {section.evidence ? (
        <aside className="fdg-evidence fdg-animate-sticky">
          <div className="fdg-evidence-label">{section.evidence.label}</div>
          <p className="fdg-evidence-text">{section.evidence.text}</p>
        </aside>
      ) : null}
    </section>
  );
}

function ChapterSheet({ chapter, index }: { chapter: GeneratedGuidePage; index: number }) {
  return (
    <article key={chapter.id} className="fdg-sheet fdg-animate-sheet overflow-hidden">
      <div className={railClass(chapter.accent)} aria-hidden />
      <div className="px-5 py-7 md:px-14 md:py-10 lg:px-16">
        <header className="fdg-sheet-head">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="fdg-kicker">{chapter.kicker ?? 'Page'}</span>
            <span className="fdg-meta-row">
              {String(index + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
              {chapter.readMinutes ? ` · ${chapter.readMinutes} min read` : ''}
            </span>
          </div>
          <h1 className="fdg-chapter-title mt-3">{chapter.title}</h1>
          {chapter.subtitle ? <p className="fdg-chapter-sub mt-3">{chapter.subtitle}</p> : null}
        </header>

        <div className="mt-7">
          {chapter.sections.map((sec, i) => (
            <SectionBlock key={`${chapter.id}-${i}`} section={sec} isFirstOfChapter={i === 0} />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function DisputeGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [indexOpen, setIndexOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const initialIdx = useMemo(() => {
    const q = (params.get('chapter') ?? '').trim();
    if (!q) return 0;
    const asNum = Number(q);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= CHAPTERS.length) return asNum - 1;
    const byId = CHAPTERS.findIndex((c) => c.id === q);
    return byId >= 0 ? byId : 0;
  }, [params]);

  const [idx, setIdx] = useState(initialIdx);

  useEffect(() => {
    setIdx(initialIdx);
  }, [initialIdx]);

  const chapter = CHAPTERS[idx] ?? CHAPTERS[0]!;
  const progress = ((idx + 1) / CHAPTERS.length) * 100;

  usePublicSeoMeta({
    title: `${chapter.title} — Free Credit Dispute Letter Guide`,
    description:
      chapter.subtitle ??
      'Read the free Finely Cred dispute letter guide: FCRA rights, the 5-step framework, evidence standards, and certified mail workflow.',
    path: DISPUTE_LETTER_GUIDE_READ_PATH,
  });

  const goChapter = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(CHAPTERS.length - 1, next));
      setIdx(clamped);
      setParams({ chapter: CHAPTERS[clamped]!.id }, { replace: true });
      setIndexOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setParams],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (e.key === 'ArrowRight') goChapter(idx + 1);
      if (e.key === 'ArrowLeft') goChapter(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goChapter, idx]);

  const onDownload = async () => {
    setDownloading(true);
    try {
      await downloadDisputeLetterGuidePdf({});
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="fdg-reader relative">
      <div className="fdg-desk pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="fdg-desk-grid pointer-events-none fixed inset-0 z-0" aria-hidden />

      <header
        className="fdg-docket-bar sticky z-40"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}
      >
        <div className="fdg-progress-track">
          <span className="fdg-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(LANDING_PATH)}
              className="fdg-ghost-btn inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
            >
              <ArrowLeft size={13} /> Landing
            </button>
            <span className="fdg-stamp hidden sm:inline-flex">Dispute docket</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndexOpen((v) => !v)}
              className="fdg-ghost-btn inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] lg:hidden"
              aria-expanded={indexOpen}
            >
              {indexOpen ? <X size={13} /> : <List size={13} />} Index
            </button>
            <button
              type="button"
              onClick={() => void onDownload()}
              disabled={downloading}
              className="fdg-primary-btn inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
            >
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <Download size={13} /> {downloading ? 'Building…' : 'Download PDF'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[86rem] gap-6 px-3 py-6 md:px-8 lg:grid-cols-[266px_minmax(0,1fr)] lg:gap-9 lg:py-9">
        <aside className={cn('fdg-index p-3 lg:sticky lg:top-32 lg:self-start', indexOpen ? 'block' : 'hidden lg:block')}>
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="fdg-kicker">Docket index</span>
            <span className="fdg-meta-row">{CHAPTERS.length} pg.</span>
          </div>
          <nav className="max-h-[62vh] space-y-0.5 overflow-y-auto pr-1" aria-label="Guide pages">
            {CHAPTERS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => goChapter(i)}
                className={cn('fdg-index-item rounded-r-md', i === idx && 'is-active')}
                aria-current={i === idx ? 'true' : undefined}
              >
                <span className="fdg-index-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="fdg-index-title">{c.title}</span>
              </button>
            ))}
          </nav>
          <p className="fdg-compliance mt-3 px-1 !text-white/35">{COMPLIANCE}</p>
        </aside>

        <div className="min-w-0">
          <ChapterSheet chapter={chapter} index={idx} />

          <div className="fdg-sheet mt-4 overflow-hidden">
            <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-14">
              <button
                type="button"
                disabled={idx <= 0}
                onClick={() => goChapter(idx - 1)}
                className="fdg-page-btn inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-[10px] font-bold uppercase tracking-[0.14em]"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <p className="fdg-compliance order-last text-center md:order-none">{COMPLIANCE}</p>
              {idx < CHAPTERS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goChapter(idx + 1)}
                  className="fdg-next-btn inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-[10px] font-bold uppercase tracking-[0.14em]"
                >
                  Next page <ChevronRight size={15} />
                </button>
              ) : (
                <Link
                  to={LANDING_PATH}
                  className="fdg-next-btn inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-[10px] font-bold uppercase tracking-[0.14em]"
                >
                  Back to landing <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
