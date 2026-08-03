import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Gauge,
  List,
  ShieldAlert,
  X,
} from 'lucide-react';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { downloadScoreRoadmapPdf } from '../../resources/buildScoreRoadmapPdf';
import {
  SCORE_BOOST_CHAPTERS,
  SCORE_BOOST_COMPLIANCE,
  SCORE_BOOST_READ_PATH,
  type ScoreBoostChapter,
  type ScoreBoostSection,
} from '../../resources/scoreRoadmapContent';
import './scoreBoostGuideReader.css';

const CHAPTERS = SCORE_BOOST_CHAPTERS;
const LANDING_PATH = '/free-score-roadmap';
const DISPUTE_GUIDE_PATH = '/free-guide/read';

const SPEED_COPY: Record<NonNullable<ScoreBoostChapter['speed']>, string> = {
  instant: 'Read now',
  fast: 'Fastest lever',
  steady: 'Weeks, not hours',
  foundation: 'Compounds over months',
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const ARC_RADIUS = 90;
const ARC_LENGTH = Math.PI * ARC_RADIUS;

function ScoreArc({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const offset = ARC_LENGTH * (1 - pct / 100);
  const angle = Math.PI * (1 - pct / 100);
  const headX = 125 + ARC_RADIUS * Math.cos(angle);
  const headY = 118 - ARC_RADIUS * Math.sin(angle);

  return (
    <svg className="sbg-gauge" viewBox="0 0 250 150" role="img" aria-label={`Roadmap progress ${Math.round(pct)} percent`}>
      <defs>
        <linearGradient id="sbgArcGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0e7a52" />
          <stop offset="58%" stopColor="#23d18b" />
          <stop offset="100%" stopColor="#f5b544" />
        </linearGradient>
      </defs>

      <g className="sbg-gauge-ticks">
        {Array.from({ length: 11 }).map((_, i) => {
          const a = Math.PI * (1 - i / 10);
          const inner = ARC_RADIUS - 12;
          return (
            <line
              key={i}
              x1={125 + inner * Math.cos(a)}
              y1={118 - inner * Math.sin(a)}
              x2={125 + (ARC_RADIUS - 4) * Math.cos(a)}
              y2={118 - (ARC_RADIUS - 4) * Math.sin(a)}
              strokeWidth={i % 5 === 0 ? 2 : 1}
            />
          );
        })}
      </g>

      <path
        className="sbg-gauge-track"
        d={`M ${125 - ARC_RADIUS} 118 A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${125 + ARC_RADIUS} 118`}
        fill="none"
        strokeWidth={9}
      />
      <path
        className="sbg-gauge-arc"
        d={`M ${125 - ARC_RADIUS} 118 A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${125 + ARC_RADIUS} 118`}
        fill="none"
        strokeWidth={9}
        strokeDasharray={ARC_LENGTH}
        strokeDashoffset={offset}
      />
      <circle className="sbg-gauge-head" cx={headX} cy={headY} r={4} />

      <text className="sbg-gauge-value" x="125" y="108" textAnchor="middle">
        {Math.round(pct)}%
      </text>
      <text className="sbg-gauge-label" x="125" y="134" textAnchor="middle">
        Roadmap progress
      </text>
    </svg>
  );
}

function SectionBlock({ section }: { section: ScoreBoostSection }) {
  return (
    <section className="sbg-section">
      {section.heading ? <h2 className="sbg-heading">{section.heading}</h2> : null}

      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 40)} className="sbg-body mt-3">
          {p}
        </p>
      ))}

      {section.metrics?.length ? (
        <div className="sbg-metrics">
          {section.metrics.map((m, i) => (
            <div
              key={`${m.label}-${m.value}`}
              className="sbg-metric sbg-animate-metric"
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              <div className="sbg-metric-label">{m.label}</div>
              <div className="sbg-metric-value">{m.value}</div>
              {m.note ? <div className="sbg-metric-note">{m.note}</div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {section.bullets?.length ? (
        <ul className="sbg-list">
          {section.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}

      {section.actions?.length ? (
        <div className="sbg-actions">
          <div className="sbg-actions-label">Do this now</div>
          <ul className="mt-1.5">
            {section.actions.map((a) => (
              <li key={a}>
                <span className="sbg-mono text-[--sbg-emerald]" aria-hidden>
                  →
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {section.guardrail ? (
        <aside className="sbg-guardrail">
          <ShieldAlert size={14} className="sbg-guardrail-icon" aria-hidden />
          {section.guardrail}
        </aside>
      ) : null}
    </section>
  );
}

export default function ScoreBoostGuideReaderPage() {
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
  const linear = ((idx + 1) / CHAPTERS.length) * 100;
  const arcValue = chapter.arc ?? linear;

  usePublicSeoMeta({
    title: `${chapter.title} — Boost Your Credit Score in 72 Hours`,
    description:
      chapter.subtitle ??
      'The free Finely Cred score roadmap: utilization, reporting dates, negative triage, inquiry budgeting, and fundability timing.',
    path: SCORE_BOOST_READ_PATH,
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
      await downloadScoreRoadmapPdf();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="sbg-reader relative">
      <div className="sbg-field pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="sbg-field-ticks pointer-events-none fixed inset-0 z-0" aria-hidden />

      <header className="sbg-bar sticky z-40" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}>
        <div className="sbg-bar-rail">
          <span className="sbg-bar-fill" style={{ width: `${linear}%` }} />
        </div>
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(LANDING_PATH)}
              className="sbg-ghost inline-flex items-center gap-1.5 rounded px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em]"
            >
              <ArrowLeft size={13} /> Landing
            </button>
            <span className="sbg-chip hidden sm:inline-flex">
              <Gauge size={11} /> 72-hour roadmap
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndexOpen((v) => !v)}
              className="sbg-ghost inline-flex items-center gap-1.5 rounded px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] lg:hidden"
              aria-expanded={indexOpen}
            >
              {indexOpen ? <X size={13} /> : <List size={13} />} Steps
            </button>
            <button
              type="button"
              onClick={() => void onDownload()}
              disabled={downloading}
              className="sbg-solid inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-[10px] uppercase tracking-[0.16em]"
            >
              <Download size={13} /> {downloading ? 'Building…' : 'Download PDF'}
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[86rem] gap-6 px-3 py-6 md:px-8 lg:grid-cols-[276px_minmax(0,1fr)] lg:gap-9 lg:py-9">
        <aside className={cn('lg:sticky lg:top-32 lg:self-start', indexOpen ? 'block' : 'hidden lg:block')}>
          <div className="sbg-panel px-3 py-4">
            <ScoreArc value={arcValue} />
            <div className="mt-2 text-center">
              <div className="sbg-window-tag justify-center">{chapter.window ?? 'Roadmap'}</div>
              {chapter.lever ? (
                <div className="sbg-condensed mt-0.5 text-lg font-semibold uppercase text-white">{chapter.lever}</div>
              ) : null}
            </div>
          </div>

          <div className="sbg-index mt-3 p-2">
            <div className="mb-1.5 flex items-center justify-between px-1.5">
              <span className="sbg-metric-label">Sequence</span>
              <span className="sbg-metric-label">
                {String(idx + 1).padStart(2, '0')}/{String(CHAPTERS.length).padStart(2, '0')}
              </span>
            </div>
            <nav className="max-h-[52vh] space-y-0.5 overflow-y-auto pr-1" aria-label="Roadmap pages">
              {CHAPTERS.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => goChapter(i)}
                  className={cn('sbg-index-item', i === idx && 'is-active')}
                  aria-current={i === idx ? 'true' : undefined}
                >
                  <span className="min-w-0">
                    {c.window ? <span className="sbg-index-window block">{c.window}</span> : null}
                    <span className="sbg-index-title block">{c.title}</span>
                  </span>
                </button>
              ))}
            </nav>
            <p className="sbg-compliance mt-2 px-1.5">{SCORE_BOOST_COMPLIANCE}</p>
          </div>
        </aside>

        <div className="min-w-0">
          <article className="sbg-panel sbg-animate-panel px-5 py-7 md:px-10 md:py-9 lg:px-12">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="sbg-window-tag">{chapter.window ?? 'Roadmap'}</span>
              {chapter.speed ? (
                <span className={`sbg-speed sbg-speed--${chapter.speed}`}>{SPEED_COPY[chapter.speed]}</span>
              ) : null}
              {chapter.readMinutes ? (
                <span className="sbg-compliance">{chapter.readMinutes} min read</span>
              ) : null}
            </div>
            <h1 className="sbg-title mt-3">{chapter.title}</h1>
            {chapter.subtitle ? <p className="sbg-sub mt-3 max-w-3xl">{chapter.subtitle}</p> : null}

            <div className="mt-7">
              {chapter.sections.map((sec, i) => (
                <SectionBlock key={`${chapter.id}-${i}`} section={sec} />
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={idx <= 0}
                onClick={() => goChapter(idx - 1)}
                className="sbg-ghost inline-flex h-11 items-center justify-center gap-2 rounded px-4 text-[10px] font-bold uppercase tracking-[0.16em]"
              >
                <ChevronLeft size={15} /> Previous
              </button>
              {idx < CHAPTERS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goChapter(idx + 1)}
                  className="sbg-solid inline-flex h-11 items-center justify-center gap-2 rounded px-5 text-[10px] uppercase tracking-[0.16em]"
                >
                  Next step <ChevronRight size={15} />
                </button>
              ) : (
                <Link
                  to={LANDING_PATH}
                  className="sbg-solid inline-flex h-11 items-center justify-center gap-2 rounded px-5 text-[10px] uppercase tracking-[0.16em]"
                >
                  Back to landing <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </article>

          <div className="sbg-panel mt-4 flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-10">
            <div>
              <div className="sbg-metric-label">Pairs with</div>
              <p className="sbg-condensed mt-0.5 text-lg font-semibold uppercase text-white">
                Free Credit Dispute Letter Guide
              </p>
              <p className="sbg-compliance mt-1">{SCORE_BOOST_COMPLIANCE}</p>
            </div>
            <Link
              to={DISPUTE_GUIDE_PATH}
              className="sbg-ghost inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded px-4 text-[10px] font-bold uppercase tracking-[0.16em]"
            >
              Read the dispute guide <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
