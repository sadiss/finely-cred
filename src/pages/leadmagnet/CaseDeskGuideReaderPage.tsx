import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CareerResourceRail } from '../../components/careers/CareerResourceRail';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  CASE_DESK_CAREERS_PATH,
  CASE_DESK_GUIDE_CHAPTERS,
  CASE_DESK_GUIDE_META,
  CASE_DESK_GUIDE_PATH,
  CASE_DESK_GUIDE_READ_PATH,
  DEBT_GUIDE_PREREQ_PATH,
  caseDeskGuideChapterIndex,
  type CaseDeskGuideChapter,
  type CaseDeskGuideSection,
} from './caseDeskOperatorGuideContent';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  finelyOsLandingWealthyIvorySection,
} from '../../features/os/finelyOsLightUi';
import GuideReaderShell from './GuideReaderShell';
import './guideReaderShell.css';

const SERIF = 'font-serif';

function SectionBlock({ section }: { section: CaseDeskGuideSection }) {
  return (
    <section className="mt-7 first:mt-0">
      {section.heading ? (
        <h2 className={`${SERIF} text-xl sm:text-2xl font-bold text-stone-900`}>{section.heading}</h2>
      ) : null}
      {section.paragraphs?.map((p) => (
        <p key={p.slice(0, 48)} className={`mt-3 ${SERIF} text-[16px] leading-relaxed text-stone-700`}>
          {p}
        </p>
      ))}
      {section.bullets?.length ? (
        <ol className="mt-4 space-y-2.5">
          {section.bullets.map((b, i) => (
            <li key={b.slice(0, 48)} className="flex gap-3">
              <span className={`${SERIF} text-sm font-black tabular-nums text-stone-400`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={`${SERIF} text-[15px] leading-relaxed text-stone-700`}>{b}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {section.resources?.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {section.resources.map((res) =>
            res.external ? (
              <a
                key={res.href + res.label}
                href={res.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm border border-stone-400/55 bg-white/80 px-3 py-2 font-serif text-[13px] font-semibold text-stone-800 hover:border-stone-700"
                title={res.note}
              >
                {res.label} <ExternalLink size={12} />
              </a>
            ) : (
              <Link
                key={res.href + res.label}
                to={res.href}
                className="inline-flex items-center gap-1.5 rounded-sm border border-stone-400/55 bg-white/80 px-3 py-2 font-serif text-[13px] font-semibold text-stone-800 hover:border-stone-700"
                title={res.note}
              >
                {res.label} <ArrowRight size={12} />
              </Link>
            ),
          )}
        </div>
      ) : null}
      {section.callout ? (
        <aside
          className={`mt-5 rounded-sm border-l-4 border-rose-800/50 bg-[#efe7d4] px-4 py-3 ${SERIF} text-sm italic leading-relaxed text-stone-700`}
        >
          {section.callout}
        </aside>
      ) : null}
    </section>
  );
}

function Sheet({ chapter, index }: { chapter: CaseDeskGuideChapter; index: number }) {
  return (
    <article
      className="rounded-sm border border-stone-400/50 bg-[#faf6ea] p-6 sm:p-9 shadow-[0_22px_50px_-34px_rgba(41,37,36,0.55)]"
      style={{
        background:
          'linear-gradient(180deg,#faf6ea 0%,#f3ecdb 100%), radial-gradient(circle at 10% 0%, rgba(120,113,108,0.06), transparent 40%)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`${SERIF} text-[10px] font-black uppercase tracking-[0.28em] text-stone-500`}>
          {chapter.kicker}
        </span>
        <span className={`${SERIF} text-[12px] text-stone-500`}>
          Sheet {chapter.sheet} / {String(CASE_DESK_GUIDE_CHAPTERS.length).padStart(2, '0')} · {chapter.readMinutes}{' '}
          min
        </span>
      </div>
      <p className={`mt-4 ${SERIF} text-4xl font-black tabular-nums text-stone-300`}>{chapter.sheet}</p>
      <h1 className={`${SERIF} mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-stone-900`}>{chapter.title}</h1>
      <p className={`mt-3 ${SERIF} text-lg italic text-stone-600`}>{chapter.subtitle}</p>
      <div className="mt-5 border-t border-stone-300" />
      <div className="mt-2">
        {chapter.sections.map((sec, i) => (
          <SectionBlock key={`${chapter.id}-${i}`} section={sec} />
        ))}
      </div>
      <p className="mt-8 text-[11px] text-stone-400">Chapter index {index + 1}</p>
    </article>
  );
}

export default function CaseDeskGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tocOpen, setTocOpen] = useState(false);

  const initialIdx = useMemo(() => {
    const q = params.get('chapter') ?? '';
    if (!q) return 0;
    const asNum = Number(q);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= CASE_DESK_GUIDE_CHAPTERS.length) return asNum - 1;
    return caseDeskGuideChapterIndex(q);
  }, [params]);

  const [chapterIdx, setChapterIdx] = useState(initialIdx);
  useEffect(() => {
    setChapterIdx(initialIdx);
  }, [initialIdx]);

  const chapter = CASE_DESK_GUIDE_CHAPTERS[chapterIdx] ?? CASE_DESK_GUIDE_CHAPTERS[0]!;

  const shellChapters = useMemo(
    () =>
      CASE_DESK_GUIDE_CHAPTERS.map((c) => ({
        id: c.id,
        number: c.sheet,
        title: c.title,
        teaser: c.kicker || c.subtitle,
      })),
    [],
  );

  usePublicSeoMeta({
    title: `${chapter.title} — ${CASE_DESK_GUIDE_META.shortTitle}`,
    description: chapter.subtitle,
    path: CASE_DESK_GUIDE_READ_PATH,
  });

  const goChapter = (idx: number) => {
    const next = Math.max(0, Math.min(CASE_DESK_GUIDE_CHAPTERS.length - 1, idx));
    setChapterIdx(next);
    const id = CASE_DESK_GUIDE_CHAPTERS[next]?.id;
    setParams(id ? { chapter: id } : {}, { replace: true });
    setTocOpen(false);
  };

  return (
    <GuideReaderShell
      className="min-h-screen bg-[#ebe3cf] text-stone-900"
      chapters={shellChapters}
      chapterIndex={chapterIdx}
      onChapterChange={goChapter}
      tocOpen={tocOpen}
      onTocOpenChange={setTocOpen}
      tocLabel="Contents"
      tocTitle={CASE_DESK_GUIDE_META.shortTitle}
      tocSubtitle="Case Desk Operator"
      tocClassName="!bg-[#faf6ea] !border-stone-400/50"
      tocFooter={
        <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-stone-600 !mx-0 !text-left mt-3`}>
          {CASE_DESK_GUIDE_META.compliance}
        </p>
      }
      storageKey="finely.guideReader.caseDesk"
      chromeTone="light"
      showFlipControls={false}
      headerClassName="!bg-[#f3ecdb]/95 !border-b !border-stone-400/40"
      progressTrackClassName="h-1 bg-stone-300/60"
      progressFillClassName="h-full bg-emerald-700/80"
      headerLeft={
        <Link
          to={CASE_DESK_GUIDE_PATH}
          className="inline-flex items-center gap-1.5 font-serif text-sm font-bold text-stone-700 hover:text-stone-900"
        >
          <ArrowLeft size={15} /> Guide home
        </Link>
      }
      headerRight={
        <>
          <button
            type="button"
            className="rounded-sm border border-stone-400/55 bg-white/70 px-3 py-1.5 font-serif text-xs font-bold text-stone-700 hover:border-stone-700"
            onClick={() => navigate(DEBT_GUIDE_PREREQ_PATH)}
          >
            Debt guide (prereq)
          </button>
          <button
            type="button"
            className="rounded-sm border border-stone-700/50 bg-stone-900 px-3 py-1.5 font-serif text-xs font-bold text-[#f6f1e4] hover:bg-stone-800"
            onClick={() => navigate(CASE_DESK_CAREERS_PATH)}
          >
            Apply
          </button>
        </>
      }
      afterArticle={
        <section className={`mt-8 rounded-3xl px-4 py-6 sm:px-6 ${finelyOsLandingWealthyIvorySection()}`}>
          <CareerResourceRail role="case_help" tone="parchment" heading="FCRA · FDCPA · portals" />
        </section>
      }
      renderChapter={(i) => {
        const ch = CASE_DESK_GUIDE_CHAPTERS[i] ?? CASE_DESK_GUIDE_CHAPTERS[0]!;
        return (
          <div>
            <Sheet chapter={ch} index={i} />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={i === 0}
                className="inline-flex items-center gap-2 rounded-sm border border-stone-400/55 bg-[#faf6ea] px-4 py-2.5 font-serif text-sm font-bold text-stone-800 disabled:opacity-40"
                onClick={() => goChapter(i - 1)}
              >
                <ArrowLeft size={14} /> Previous
              </button>
              <button
                type="button"
                disabled={i >= CASE_DESK_GUIDE_CHAPTERS.length - 1}
                className="inline-flex items-center gap-2 rounded-sm border border-stone-700/50 bg-stone-900 px-4 py-2.5 font-serif text-sm font-bold text-[#f6f1e4] disabled:opacity-40"
                onClick={() => goChapter(i + 1)}
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          </div>
        );
      }}
    />
  );
}
