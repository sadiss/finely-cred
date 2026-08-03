import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Gavel,
  List,
  ScrollText,
  X,
} from 'lucide-react';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  chapterIndexById,
  cx,
  GuideSectionView,
  guideReadMinutes,
} from './guideReaderBlocks';
import {
  DEBT_BOOKING_PATH,
  DEBT_GUIDE_CHAPTERS,
  DEBT_GUIDE_LANDING_PATH,
  DEBT_GUIDE_META,
  DEBT_GUIDE_READ_PATH,
} from './debtEradicationGuideContent';
import './debtEradicationGuideReader.css';

const TOTAL = DEBT_GUIDE_CHAPTERS.length;

export default function DebtEradicationGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [indexOpen, setIndexOpen] = useState(false);

  const initialIdx = useMemo(() => {
    const q = params.get('chapter') ?? '';
    if (!q) return 0;
    const asNum = Number(q);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= TOTAL) return asNum - 1;
    return chapterIndexById(DEBT_GUIDE_CHAPTERS, q);
  }, [params]);

  const [idx, setIdx] = useState(initialIdx);

  useEffect(() => {
    setIdx(initialIdx);
  }, [initialIdx]);

  const chapter = DEBT_GUIDE_CHAPTERS[idx] ?? DEBT_GUIDE_CHAPTERS[0]!;
  const progress = ((idx + 1) / TOTAL) * 100;
  const totalMinutes = useMemo(() => guideReadMinutes(DEBT_GUIDE_CHAPTERS), []);

  usePublicSeoMeta({
    title: `${chapter.title} — ${DEBT_GUIDE_META.shortTitle}`,
    description: chapter.subtitle,
    path: DEBT_GUIDE_READ_PATH,
  });

  const goChapter = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(TOTAL - 1, next));
      setIdx(clamped);
      setParams({ chapter: DEBT_GUIDE_CHAPTERS[clamped]!.id }, { replace: true });
      setIndexOpen(false);
    },
    [setParams],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [idx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === 'ArrowRight') goChapter(idx + 1);
      if (e.key === 'ArrowLeft') goChapter(idx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goChapter, idx]);

  return (
    <main className="dge-shell relative overflow-x-hidden selection:bg-[#7c2027]/35">
      <header className="dge-dock sticky z-40" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}>
        <div className="dge-dock-rule">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="mx-auto flex max-w-[86rem] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(DEBT_GUIDE_LANDING_PATH)}
              className="dge-dock-btn inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
            >
              <ArrowLeft size={14} /> Guide home
            </button>
            <span className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#d8b463]/70 sm:inline-flex">
              <Gavel size={13} /> Field manual
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40 md:inline-flex">
              <Clock size={13} /> {chapter.readMinutes} min · {idx + 1}/{TOTAL}
            </span>
            <button
              type="button"
              onClick={() => setIndexOpen((v) => !v)}
              className="dge-dock-btn inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] lg:hidden"
              aria-expanded={indexOpen}
            >
              {indexOpen ? <X size={14} /> : <List size={14} />} Index
            </button>
            <Link
              to={`${DEBT_GUIDE_LANDING_PATH}#download`}
              className="dge-seal-btn inline-flex h-10 items-center gap-1.5 rounded-sm px-3.5 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              <Download size={14} /> Get the PDF
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[86rem] gap-6 px-4 py-6 md:px-8 lg:grid-cols-[268px_minmax(0,1fr)] lg:gap-9 lg:py-9">
        <aside className={cx('space-y-3 lg:sticky lg:top-28 lg:self-start', indexOpen ? 'block' : 'hidden lg:block')}>
          <div className="dge-index rounded-sm p-4">
            <div className="flex items-center gap-2 text-[9.5px] font-black uppercase tracking-[0.26em] text-[#d8b463]">
              <ScrollText size={13} /> Index of pages
            </div>
            <p className="dge-index-title mt-2 text-[1.35rem] leading-tight text-[#f6f1e4]">
              {DEBT_GUIDE_META.title}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/35">{DEBT_GUIDE_META.tagline}</p>
            <nav className="mt-4 space-y-0.5" aria-label="Field manual pages">
              {DEBT_GUIDE_CHAPTERS.map((ch, i) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => goChapter(i)}
                  className={cx('dge-index-item', i === idx && 'is-active')}
                  aria-current={i === idx ? 'true' : undefined}
                >
                  <span className="dge-index-numeral">{ch.number}</span>
                  <span className="min-w-0">
                    <span className="dge-index-name block">{ch.title}</span>
                    <span className="dge-index-meta mt-0.5 block">{ch.readMinutes} min · {ch.kicker}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="dge-rail-kpi grid grid-cols-3 gap-px overflow-hidden rounded-sm">
            {[
              { v: String(TOTAL), l: 'Pages' },
              { v: `${totalMinutes}m`, l: 'Full read' },
              { v: 'Free', l: 'No signup' },
            ].map((k) => (
              <div key={k.l} className="bg-black/25 px-3 py-2.5 text-center">
                <div className="dge-index-title text-lg text-[#e6d6ad]">{k.v}</div>
                <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">{k.l}</div>
              </div>
            ))}
          </div>

          <div className="dge-rail-card rounded-sm p-4">
            <div className="text-[9.5px] font-black uppercase tracking-[0.24em] text-[#d8b463]">Under a deadline?</div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">
              If you were served with court papers, read Page V today and speak with a licensed attorney in your
              county. Deadlines do not pause while you research.
            </p>
            <Link
              to={DEBT_BOOKING_PATH}
              className="dge-dock-btn mt-3 inline-flex h-9 items-center gap-1.5 rounded-sm px-3 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              <Calendar size={13} /> Book a session
            </Link>
          </div>

          <p className="dge-compliance px-1">{DEBT_GUIDE_META.compliance}</p>
        </aside>

        <div className="min-w-0">
          <article key={chapter.id} className="dge-leaf dge-turn">
            <div className="dge-leaf-inner">
              <div className="dge-caption">
                <div className="dge-caption-row">
                  <span>{DEBT_GUIDE_META.shortTitle}</span>
                  <span>Page {chapter.number}</span>
                  <span>
                    {idx + 1} of {TOTAL}
                  </span>
                  <span>{chapter.readMinutes} min read</span>
                </div>
                <div className="mt-4 flex items-start gap-5">
                  <div className="dge-seal hidden sm:grid" aria-hidden>
                    {chapter.number}
                  </div>
                  <div className="min-w-0">
                    <span className="dge-chapter-numeral sm:hidden">{chapter.number}</span>
                    <h1 className="dge-chapter-title">{chapter.title}</h1>
                    <div className="dge-rule-draw mt-3 w-32" aria-hidden />
                    <p className="dge-chapter-sub mt-3 max-w-2xl">{chapter.subtitle}</p>
                  </div>
                </div>
                <div className="dge-promise mt-5">{chapter.promise}</div>
              </div>

              <div className="mt-7">
                {chapter.sections.map((section, i) => (
                  <GuideSectionView key={section.heading} section={section} prefix="dge" index={i} />
                ))}
              </div>

              <div className="dge-takeaway">
                <div className="dge-takeaway-label">Page {chapter.number} — hold this</div>
                <p className="dge-takeaway-body">{chapter.takeaway}</p>
              </div>

              <div className="dge-foot-nav flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={idx <= 0}
                  onClick={() => goChapter(idx - 1)}
                  className="dge-page-btn inline-flex h-11 items-center gap-2 rounded-sm px-4 text-[10px] font-black uppercase tracking-[0.14em]"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className="dge-compliance--onleaf hidden text-[10.5px] sm:inline">
                  {DEBT_GUIDE_META.compliance}
                </span>
                {idx < TOTAL - 1 ? (
                  <button
                    type="button"
                    onClick={() => goChapter(idx + 1)}
                    className="dge-page-btn dge-page-btn--primary inline-flex h-11 items-center gap-2 rounded-sm px-5 text-[10px] font-black uppercase tracking-[0.14em]"
                  >
                    {DEBT_GUIDE_CHAPTERS[idx + 1]!.number}. Next page <ChevronRight size={16} />
                  </button>
                ) : (
                  <Link
                    to={`${DEBT_GUIDE_LANDING_PATH}#download`}
                    className="dge-page-btn dge-page-btn--primary inline-flex h-11 items-center gap-2 rounded-sm px-5 text-[10px] font-black uppercase tracking-[0.14em]"
                  >
                    Take the PDF with you <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </article>

          <section className="dge-rail-card mt-5 rounded-sm p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="text-[9.5px] font-black uppercase tracking-[0.26em] text-[#d8b463]">
                  Keep reading freely
                </div>
                <p className="dge-index-title mt-2 text-xl text-[#f6f1e4]">
                  The manual is free. The portal is where partners run it.
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/58">
                  Validation tracking, certified-mail records, and a document vault your specialist can read in one
                  sitting — no signup required to finish the pages.
                </p>
                <p className="dge-compliance mt-2">{DEBT_GUIDE_META.compliance}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`${DEBT_GUIDE_LANDING_PATH}#download`}
                  className="dge-seal-btn inline-flex h-10 items-center gap-1.5 rounded-sm px-4 text-[10px] font-black uppercase tracking-[0.14em]"
                >
                  <Download size={14} /> Free PDF
                </Link>
                <Link
                  to={DEBT_BOOKING_PATH}
                  className="dge-dock-btn inline-flex h-10 items-center gap-1.5 rounded-sm px-4 text-[10px] font-black uppercase tracking-[0.14em]"
                >
                  <Calendar size={14} /> Book a session
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
