import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, LayoutGrid, Ruler, X } from 'lucide-react';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  AGENCY_GUIDE_CHAPTERS,
  AGENCY_GUIDE_COMPLIANCE,
  AGENCY_GUIDE_LANDING_PATH,
  AGENCY_GUIDE_READ_PATH,
  agencyGuideChapterIndex,
  type AgencyGuideChapter,
  type AgencyGuideSection,
} from '../../resources/agencyGuideReaderContent';
import './agencyGuideReader.css';

const CHAPTERS = AGENCY_GUIDE_CHAPTERS;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function SectionBlock({ section }: { section: AgencyGuideSection }) {
  return (
    <section className="agr-section">
      {section.heading ? (
        <h2 className="agr-section-heading agr-animate-tape">{section.heading}</h2>
      ) : null}

      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 44)} className="agr-body-text">
          {p}
        </p>
      ))}

      {section.bullets?.length ? (
        <ol className="agr-list">
          {section.bullets.map((b, i) => (
            <li key={b.slice(0, 44)} className="agr-list-item">
              <span className="agr-list-num">{String(i + 1).padStart(2, '0')}</span>
              <span>{b}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {section.spec ? (
        <div className="agr-spec">
          <div className="agr-spec-label">{section.spec.label}</div>
          {section.spec.rows.map((row, i) => (
            <div
              key={row.k}
              className="agr-spec-row agr-animate-row"
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              <div className="agr-spec-k">{row.k}</div>
              <div className="agr-spec-v">{row.v}</div>
            </div>
          ))}
        </div>
      ) : null}

      {section.metrics?.length ? (
        <div className="agr-metrics">
          {section.metrics.map((m) => (
            <div key={m.label} className="agr-metric">
              <div className="agr-metric-value">{m.value}</div>
              <div className="agr-metric-label">{m.label}</div>
              {m.note ? <p className="agr-metric-note">{m.note}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {section.worksheet ? (
        <div className="agr-worksheet">
          <div className="agr-worksheet-label">{section.worksheet.label}</div>
          {section.worksheet.lines.map((line) => (
            <div key={line.prompt} className="agr-worksheet-line">
              <div className="agr-worksheet-prompt">{line.prompt}</div>
              <div className="agr-worksheet-rule" aria-hidden />
              {line.hint ? <span className="agr-worksheet-hint">{line.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}

      {section.callout ? <aside className="agr-callout">{section.callout}</aside> : null}
    </section>
  );
}

function PlanSheet({ chapter, index }: { chapter: AgencyGuideChapter; index: number }) {
  return (
    <article key={chapter.id} className="agr-sheet agr-animate-sheet overflow-hidden">
      <span className={`agr-sheet-accent agr-sheet-accent--${chapter.accent}`} aria-hidden />
      <div className="px-5 py-7 md:px-12 md:py-10 lg:px-14">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="agr-tag">
            <Ruler size={11} /> {chapter.kicker}
          </span>
          <span className="agr-meta">
            Sheet {String(index + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')} ·{' '}
            {chapter.readMinutes} min
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="agr-sheet-no agr-mono">{chapter.sheet}</span>
        </div>
        <h1 className="agr-chapter-title mt-1">{chapter.title}</h1>
        <p className="agr-chapter-sub mt-3">{chapter.subtitle}</p>
        <div className="agr-hairline mt-5" aria-hidden />

        <div className="mt-7">
          {chapter.sections.map((sec, i) => (
            <SectionBlock key={`${chapter.id}-${i}`} section={sec} />
          ))}
        </div>
      </div>
    </article>
  );
}

export default function AgencyGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [indexOpen, setIndexOpen] = useState(false);

  const initialIdx = useMemo(() => {
    const q = (params.get('chapter') ?? '').trim();
    return q ? agencyGuideChapterIndex(q) : 0;
  }, [params]);

  const [idx, setIdx] = useState(initialIdx);

  useEffect(() => {
    setIdx(initialIdx);
  }, [initialIdx]);

  const chapter = CHAPTERS[idx] ?? CHAPTERS[0]!;
  const progress = ((idx + 1) / CHAPTERS.length) * 100;

  usePublicSeoMeta({
    title: `${chapter.title} — The Agency Guide`,
    description: chapter.subtitle,
    path: AGENCY_GUIDE_READ_PATH,
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

  return (
    <main className="agr-reader relative">
      <div className="agr-table pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="agr-table-grid pointer-events-none fixed inset-0 z-0" aria-hidden />

      <header
        className="agr-rail sticky z-40"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}
      >
        <div className="agr-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(AGENCY_GUIDE_LANDING_PATH)}
              className="agr-ghost-btn inline-flex items-center gap-1.5 rounded px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
            >
              <ArrowLeft size={13} /> Landing
            </button>
            <span className="agr-tag hidden sm:inline-flex">Agency plan set</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndexOpen((v) => !v)}
              className="agr-ghost-btn inline-flex items-center gap-1.5 rounded px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] lg:hidden"
              aria-expanded={indexOpen}
            >
              {indexOpen ? <X size={13} /> : <LayoutGrid size={13} />} Sheets
            </button>
            <Link
              to={AGENCY_GUIDE_LANDING_PATH}
              className="agr-primary-btn inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
            >
              Get the full kit
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[86rem] gap-6 px-3 py-6 md:px-8 lg:grid-cols-[262px_minmax(0,1fr)] lg:gap-9 lg:py-9">
        <aside
          className={cn(
            'agr-index p-2.5 lg:sticky lg:top-32 lg:self-start',
            indexOpen ? 'block' : 'hidden lg:block',
          )}
        >
          <div className="mb-2 flex items-center justify-between px-1.5 pt-1">
            <span className="agr-tag">Sheet index</span>
            <span className="agr-meta">{CHAPTERS.length} sheets</span>
          </div>
          <nav className="max-h-[62vh] overflow-y-auto pr-1" aria-label="Guide sheets">
            {CHAPTERS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => goChapter(i)}
                className={cn('agr-index-item', i === idx && 'is-active')}
                aria-current={i === idx ? 'true' : undefined}
              >
                <span className="agr-index-sheet agr-mono">{c.sheet}</span>
                <span className="min-w-0">
                  <span className="agr-index-title">{c.title}</span>
                  <span className="agr-index-kicker">{c.kicker}</span>
                </span>
              </button>
            ))}
          </nav>
          <p className="agr-compliance mt-3 px-1.5 pb-1">{AGENCY_GUIDE_COMPLIANCE}</p>
        </aside>

        <div className="min-w-0">
          <PlanSheet chapter={chapter} index={idx} />

          <div className="agr-sheet mt-4 overflow-hidden">
            <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-12">
              <button
                type="button"
                disabled={idx <= 0}
                onClick={() => goChapter(idx - 1)}
                className="agr-ghost-btn inline-flex h-11 items-center justify-center gap-2 rounded px-4 text-[10px] font-bold uppercase tracking-[0.14em]"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              <p className="agr-compliance order-last text-center md:order-none">{AGENCY_GUIDE_COMPLIANCE}</p>
              {idx < CHAPTERS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goChapter(idx + 1)}
                  className="agr-primary-btn inline-flex h-11 items-center justify-center gap-2 rounded px-5 text-[10px] font-bold uppercase tracking-[0.14em]"
                >
                  Next sheet <ChevronRight size={15} />
                </button>
              ) : (
                <Link
                  to={AGENCY_GUIDE_LANDING_PATH}
                  className="agr-primary-btn inline-flex h-11 items-center justify-center gap-2 rounded px-5 text-[10px] font-bold uppercase tracking-[0.14em]"
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
