import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Target,
} from 'lucide-react';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { chapterIndexById, cx, GuideSectionView, guideReadMinutes } from './guideReaderBlocks';
import {
  BC_BOOKING_PATH,
  BC_GUIDE_CHAPTERS,
  BC_GUIDE_LANDING_PATH,
  BC_GUIDE_META,
  BC_GUIDE_READ_PATH,
  BC_ONE_SHEETS_PATH,
} from './businessCreditPowerGuideContent';
import GuideReaderShell from './GuideReaderShell';
import './businessCreditPowerGuideReader.css';
import './guideReaderShell.css';

const TOTAL = BC_GUIDE_CHAPTERS.length;

export default function BusinessCreditPowerGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [railOpen, setRailOpen] = useState(false);

  const initialIdx = useMemo(() => {
    const q = params.get('chapter') ?? '';
    if (!q) return 0;
    const asNum = Number(q);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= TOTAL) return asNum - 1;
    return chapterIndexById(BC_GUIDE_CHAPTERS, q);
  }, [params]);

  const [idx, setIdx] = useState(initialIdx);

  useEffect(() => {
    setIdx(initialIdx);
  }, [initialIdx]);

  const chapter = BC_GUIDE_CHAPTERS[idx] ?? BC_GUIDE_CHAPTERS[0]!;
  const totalMinutes = useMemo(() => guideReadMinutes(BC_GUIDE_CHAPTERS), []);

  const shellChapters = useMemo(
    () =>
      BC_GUIDE_CHAPTERS.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        teaser: `${c.readMinutes} min · ${c.kicker}`,
      })),
    [],
  );

  usePublicSeoMeta({
    title: `${chapter.title} — ${BC_GUIDE_META.shortTitle}`,
    description: chapter.subtitle,
    path: BC_GUIDE_READ_PATH,
  });

  const goChapter = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(TOTAL - 1, next));
      setIdx(clamped);
      setParams({ chapter: BC_GUIDE_CHAPTERS[clamped]!.id }, { replace: true });
      setRailOpen(false);
    },
    [setParams],
  );

  return (
    <GuideReaderShell
      className="bcg-shell relative overflow-x-hidden selection:bg-[#2fd4c4]/25"
      chapters={shellChapters}
      chapterIndex={idx}
      onChapterChange={goChapter}
      tocOpen={railOpen}
      onTocOpenChange={setRailOpen}
      tocToggleLabel="Pages"
      tocPosition="right"
      storageKey="finely.guideReader.businessCredit"
      maxWidthClassName="max-w-[92rem]"
      gridClassName="lg:grid-cols-[minmax(0,1fr)_286px]"
      headerClassName="bcg-bar"
      progressTrackClassName="bcg-bar-track"
      headerLeft={
        <>
          <button
            type="button"
            onClick={() => navigate(BC_GUIDE_LANDING_PATH)}
            className="bcg-bar-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
          >
            <ArrowLeft size={14} /> Guide home
          </button>
          <span className="bcg-mono hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2fd4c4]/80 sm:inline-flex">
            <Building2 size={13} /> Power Guide
          </span>
        </>
      }
      headerMid={
        <span className="bcg-mono hidden items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/35 md:inline-flex">
          <Clock size={13} /> {chapter.readMinutes} min · {String(idx + 1).padStart(2, '0')}/{TOTAL}
        </span>
      }
      headerRight={
        <Link
          to={`${BC_GUIDE_LANDING_PATH}#download`}
          className="bcg-gold-btn inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-[10px] font-black uppercase tracking-[0.14em]"
        >
          <Download size={14} /> Get the PDF
        </Link>
      }
      beforeGrid={
        <nav
          aria-label="Page stepper"
          className="relative z-10 mx-auto mt-5 max-w-[92rem] overflow-x-auto px-4 pb-1 md:px-8"
        >
          <ol className="flex min-w-max items-center gap-1.5">
            {BC_GUIDE_CHAPTERS.map((ch, i) => (
              <li key={ch.id}>
                <button
                  type="button"
                  onClick={() => goChapter(i)}
                  className={cx(
                    'bcg-mono inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition',
                    i === idx
                      ? 'border-[#a78bfa]/70 bg-[#a78bfa]/14 text-[#c4b5fd]'
                      : i < idx
                        ? 'border-[#2fd4c4]/35 bg-[#2fd4c4]/[0.07] text-[#2fd4c4]/80 hover:border-[#2fd4c4]/60'
                        : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/25 hover:text-white/70',
                  )}
                  aria-current={i === idx ? 'step' : undefined}
                >
                  <span>{ch.number}</span>
                  <span className="hidden sm:inline">{ch.kicker}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      }
      customToc={
        <>
          <div className="bcg-kpi grid grid-cols-3 gap-px overflow-hidden rounded-xl">
            {[
              { v: String(TOTAL), l: 'Pages' },
              { v: `${totalMinutes}m`, l: 'Full read' },
              { v: '12mo', l: 'Build plan' },
            ].map((k) => (
              <div key={k.l} className="bg-black/30 px-3 py-2.5 text-center">
                <div className="bcg-display text-lg font-bold text-[#c4b5fd]">{k.v}</div>
                <div className="bcg-mono text-[9px] uppercase tracking-[0.14em] text-white/40">{k.l}</div>
              </div>
            ))}
          </div>

          <div className="bcg-rail-panel rounded-xl p-4">
            <div className="bcg-mono text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#a78bfa]">
              Page index
            </div>
            <p className="bcg-display mt-2 text-[1.15rem] font-semibold leading-tight text-white">
              {BC_GUIDE_META.title}
            </p>
            <p className="bcg-mono mt-1 text-[9.5px] uppercase tracking-[0.14em] text-white/35">
              {BC_GUIDE_META.tagline}
            </p>
            <nav className="mt-3.5 space-y-1" aria-label="Power guide pages">
              {BC_GUIDE_CHAPTERS.map((ch, i) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => goChapter(i)}
                  className={cx('bcg-rail-item', i === idx && 'is-active')}
                  aria-current={i === idx ? 'true' : undefined}
                >
                  <span className="bcg-rail-num">{ch.number}</span>
                  <span className="min-w-0">
                    <span className="bcg-rail-name block">{ch.title}</span>
                    <span className="bcg-rail-meta mt-0.5 block">{ch.readMinutes} min · {ch.kicker}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="bcg-rail-panel rounded-xl p-4">
            <div className="bcg-mono text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#2fd4c4]">
              This page in one line
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/65">{chapter.teaser}</p>
          </div>

          <p className="bcg-compliance px-1">{BC_GUIDE_META.compliance}</p>
        </>
      }
      afterArticle={
        <section className="bcg-rail-panel mt-5 rounded-xl p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="bcg-mono text-[9.5px] font-semibold uppercase tracking-[0.26em] text-[#a78bfa]">
                Free to read · free to keep
              </div>
              <p className="bcg-display mt-2 text-xl font-semibold text-white">
                The build is a calendar, not a hack.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                Partners run this same sequence inside the Finely Cred business workspace — identity ledger, vendor
                tracker, bureau checkpoints, and the funding package in one place.
              </p>
              <p className="bcg-compliance mt-2">{BC_GUIDE_META.compliance}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={BC_ONE_SHEETS_PATH}
                className="bcg-bar-btn inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.14em]"
              >
                <FileText size={14} /> One-sheets
              </Link>
              <Link
                to={BC_BOOKING_PATH}
                className="bcg-bar-btn inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.14em]"
              >
                <Calendar size={14} /> Book a session
              </Link>
            </div>
          </div>
        </section>
      }
      renderChapter={(i) => {
        const ch = BC_GUIDE_CHAPTERS[i] ?? BC_GUIDE_CHAPTERS[0]!;
        return (
          <article className="bcg-plate bcg-rise">
            <div className="bcg-plate-inner">
              <div className="bcg-opener">
                <div className="bcg-opener-meta">
                  <span>{BC_GUIDE_META.shortTitle}</span>
                  <span>Page {ch.number}</span>
                  <span>{ch.kicker}</span>
                  <span>{ch.readMinutes} min</span>
                </div>
                <div className="mt-3 flex items-start gap-5">
                  <span className="bcg-numeral hidden md:block" aria-hidden>
                    {ch.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h1 className="bcg-chapter-title">{ch.title}</h1>
                    <div className="bcg-sweep mt-3.5" aria-hidden />
                    <p className="bcg-chapter-sub mt-3.5 max-w-3xl">{ch.subtitle}</p>
                  </div>
                </div>
                <div className="bcg-promise mt-5 rounded-r-lg">
                  <Target size={15} className="mt-0.5 shrink-0 text-[#2fd4c4]" />
                  <span>{ch.promise}</span>
                </div>
              </div>

              <div className="mt-7">
                {ch.sections.map((section, si) => (
                  <GuideSectionView key={section.heading} section={section} prefix="bcg" index={si} />
                ))}
              </div>

              <div className="bcg-takeaway">
                <div className="bcg-takeaway-label">Page {ch.number} — the operating rule</div>
                <p className="bcg-takeaway-body">{ch.takeaway}</p>
              </div>

              <div className="bcg-foot flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={i <= 0}
                  onClick={() => goChapter(i - 1)}
                  className="bcg-page-btn inline-flex h-11 items-center gap-2 rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.14em]"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="bcg-compliance hidden sm:inline">{BC_GUIDE_META.compliance}</span>
                {i < TOTAL - 1 ? (
                  <button
                    type="button"
                    onClick={() => goChapter(i + 1)}
                    className="bcg-gold-btn inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[10px] font-black uppercase tracking-[0.14em]"
                  >
                    {BC_GUIDE_CHAPTERS[i + 1]!.number} · {BC_GUIDE_CHAPTERS[i + 1]!.kicker}
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <Link
                    to={`${BC_GUIDE_LANDING_PATH}#download`}
                    className="bcg-gold-btn inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[10px] font-black uppercase tracking-[0.14em]"
                  >
                    Take the PDF with you <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </article>
        );
      }}
    />
  );
}
