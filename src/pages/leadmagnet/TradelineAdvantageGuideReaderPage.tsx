import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  LayoutGrid,
  ShieldCheck,
  X,
} from 'lucide-react';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { chapterIndexById, cx, GuideSectionView, guideReadMinutes } from './guideReaderBlocks';
import {
  TL_BOOKING_PATH,
  TL_GUIDE_CHAPTERS,
  TL_GUIDE_LANDING_PATH,
  TL_GUIDE_META,
  TL_GUIDE_READ_PATH,
  TL_MARKETPLACE_PATH,
} from './tradelineAdvantageGuideContent';
import './tradelineAdvantageGuideReader.css';

const TOTAL = TL_GUIDE_CHAPTERS.length;

export default function TradelineAdvantageGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [walletOpen, setWalletOpen] = useState(false);

  const initialIdx = useMemo(() => {
    const q = params.get('chapter') ?? '';
    if (!q) return 0;
    const asNum = Number(q);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= TOTAL) return asNum - 1;
    return chapterIndexById(TL_GUIDE_CHAPTERS, q);
  }, [params]);

  const [idx, setIdx] = useState(initialIdx);

  useEffect(() => {
    setIdx(initialIdx);
  }, [initialIdx]);

  const chapter = TL_GUIDE_CHAPTERS[idx] ?? TL_GUIDE_CHAPTERS[0]!;
  const progress = ((idx + 1) / TOTAL) * 100;
  const totalMinutes = useMemo(() => guideReadMinutes(TL_GUIDE_CHAPTERS), []);

  usePublicSeoMeta({
    title: `${chapter.title} — ${TL_GUIDE_META.shortTitle}`,
    description: chapter.subtitle,
    path: TL_GUIDE_READ_PATH,
  });

  const goChapter = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(TOTAL - 1, next));
      setIdx(clamped);
      setParams({ chapter: TL_GUIDE_CHAPTERS[clamped]!.id }, { replace: true });
      setWalletOpen(false);
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
      if (e.key === 'Escape') setWalletOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goChapter, idx]);

  return (
    <main className="tlg-shell relative overflow-x-hidden selection:bg-[#7fe3ff]/25">
      <header className="tlg-strip sticky z-40" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}>
        <div className="tlg-strip-track">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(TL_GUIDE_LANDING_PATH)}
              className="tlg-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
            >
              <ArrowLeft size={14} /> Guide home
            </button>
            <span className="tlg-mono hidden items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#7fe3ff]/80 sm:inline-flex">
              <CreditCard size={13} /> Tradeline Advantage
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="tlg-mono hidden items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/35 md:inline-flex">
              <Clock size={13} /> {chapter.readMinutes} min · {String(idx + 1).padStart(2, '0')}/{TOTAL}
            </span>
            <button
              type="button"
              onClick={() => setWalletOpen((v) => !v)}
              className="tlg-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em]"
              aria-expanded={walletOpen}
            >
              {walletOpen ? <X size={14} /> : <LayoutGrid size={14} />} Wallet
            </button>
            <Link
              to={`${TL_GUIDE_LANDING_PATH}#download`}
              className="tlg-btn tlg-btn--foil inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-[10px] uppercase tracking-[0.14em]"
            >
              <Download size={14} /> Get the PDF
            </Link>
          </div>
        </div>
      </header>

      {/* Wallet — every chapter as a card face, opened from the strip */}
      {walletOpen ? (
        <div className="relative z-30 mx-auto max-w-[76rem] px-4 pt-4 md:px-8">
          <div className="tlg-panel p-4">
            <div className="tlg-mono mb-3 text-[9.5px] uppercase tracking-[0.26em] text-[#7fe3ff]">
              The wallet · {TOTAL} chapters · {totalMinutes} min total
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {TL_GUIDE_CHAPTERS.map((ch, i) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => goChapter(i)}
                  className={cx('tlg-nav-item', i === idx && 'is-active')}
                  aria-current={i === idx ? 'true' : undefined}
                >
                  <span className="tlg-nav-num">{ch.number}</span>
                  <span className="min-w-0">
                    <span className="tlg-nav-name block">{ch.title}</span>
                    <span className="tlg-nav-meta mt-0.5 block">{ch.readMinutes} min · {ch.kicker}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto max-w-[76rem] px-4 py-6 md:px-8 lg:py-8">
        <article key={chapter.id} className="tlg-card tlg-deal">
          <div className="tlg-card-inner">
            <div className="tlg-face">
              <div className="tlg-face-meta">
                <span>{TL_GUIDE_META.shortTitle}</span>
                <span>Chapter {chapter.number}</span>
                <span>{chapter.kicker}</span>
                <span>{chapter.readMinutes} min</span>
              </div>

              <div className="mt-4 flex items-start gap-4 sm:gap-6">
                <div className="hidden flex-col items-center gap-3 sm:flex">
                  <div className="tlg-chip" aria-hidden>
                    <span className="tlg-chip-shine" />
                  </div>
                  <span className="tlg-emboss-num" aria-hidden>
                    {chapter.number}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="tlg-chapter-title">{chapter.title}</h1>
                  <div className="tlg-stripe mt-4" aria-hidden />
                  <p className="tlg-chapter-sub mt-4 max-w-3xl">{chapter.subtitle}</p>
                </div>
              </div>

              <div className="tlg-promise mt-5">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#7fe3ff]" />
                <span>{chapter.promise}</span>
              </div>
            </div>

            <div className="mt-7">
              {chapter.sections.map((section, i) => (
                <GuideSectionView key={section.heading} section={section} prefix="tlg" index={i} />
              ))}
            </div>

            <div className="tlg-takeaway">
              <div className="tlg-takeaway-label">Chapter {chapter.number} — keep this</div>
              <p className="tlg-takeaway-body">{chapter.takeaway}</p>
            </div>

            <div className="tlg-foot flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={idx <= 0}
                onClick={() => goChapter(idx - 1)}
                className="tlg-page-btn inline-flex h-11 items-center gap-2 rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.14em]"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="tlg-compliance hidden sm:inline">{TL_GUIDE_META.compliance}</span>
              {idx < TOTAL - 1 ? (
                <button
                  type="button"
                  onClick={() => goChapter(idx + 1)}
                  className="tlg-btn tlg-btn--foil inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[10px] uppercase tracking-[0.14em]"
                >
                  {TL_GUIDE_CHAPTERS[idx + 1]!.number} · {TL_GUIDE_CHAPTERS[idx + 1]!.kicker}
                  <ChevronRight size={16} />
                </button>
              ) : (
                <Link
                  to={`${TL_GUIDE_LANDING_PATH}#download`}
                  className="tlg-btn tlg-btn--foil inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[10px] uppercase tracking-[0.14em]"
                >
                  Take the PDF with you <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </article>

        {/* Up next — the wallet as a reading queue */}
        <section className="mt-5 grid gap-3 lg:grid-cols-3">
          {TL_GUIDE_CHAPTERS.slice(idx + 1, idx + 4).map((ch) => {
            const target = TL_GUIDE_CHAPTERS.indexOf(ch);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => goChapter(target)}
                className="tlg-panel p-4 text-left transition hover:-translate-y-0.5"
              >
                <div className="tlg-mono text-[9.5px] uppercase tracking-[0.24em] text-[#7fe3ff]">
                  Up next · {ch.number}
                </div>
                <div className="tlg-display mt-2 text-base font-semibold text-white">{ch.title}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{ch.teaser}</p>
              </button>
            );
          })}
          {idx >= TOTAL - 1 ? (
            <div className="tlg-panel p-4 lg:col-span-3">
              <div className="tlg-mono text-[9.5px] uppercase tracking-[0.24em] text-[#7fe3ff]">You finished</div>
              <div className="tlg-display mt-2 text-base font-semibold text-white">
                Run the 90-day calendar before you buy anything.
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
                Re-pull your reports at day 75 and decide with data. If enhancement still fits the goal, review the
                marketplace with the due-diligence questions from Chapter 04 in hand.
              </p>
            </div>
          ) : null}
        </section>

        <section className="tlg-panel mt-5 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="tlg-mono text-[9.5px] uppercase tracking-[0.26em] text-[#7fe3ff]">
                Compliance-first by design
              </div>
              <p className="tlg-display mt-2 text-xl font-semibold text-white">
                Free levers first. Enhancement only when it fits.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-white/60">
                Authorized user placement is profile enhancement with a defined lifespan — never credit repair, never a
                substitute for accuracy work, and never sold with a score promise.
              </p>
              <p className="tlg-compliance mt-2">{TL_GUIDE_META.compliance}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={TL_MARKETPLACE_PATH}
                className="tlg-btn inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.14em]"
              >
                <CreditCard size={14} /> Marketplace
              </Link>
              <Link
                to={TL_BOOKING_PATH}
                className="tlg-btn inline-flex h-10 items-center gap-1.5 rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.14em]"
              >
                <Calendar size={14} /> Book a session
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
