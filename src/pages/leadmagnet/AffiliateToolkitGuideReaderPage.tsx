import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  AFFILIATE_TOOLKIT_CHAPTERS,
  AFFILIATE_TOOLKIT_META,
  AFFILIATE_TOOLKIT_PATH,
  AFFILIATE_TOOLKIT_READ_PATH,
  affiliateToolkitChapterIndex,
  type AffiliateToolkitChapter,
} from './affiliateToolkitGuideContent';
import GuideReaderShell from './GuideReaderShell';
import './guideReaderShell.css';
import '../../components/leadmagnet/leadMagnetLuxuryStage.css';

function ChapterBody({ chapter }: { chapter: AffiliateToolkitChapter }) {
  return (
    <div className="space-y-0">
      {chapter.sections.map((sec, i) => (
        <div key={`${chapter.id}-${i}`} className="border-t border-white/8 py-6 first:border-t-0 first:pt-0">
          {sec.heading ? (
            <h3 className="font-serif text-2xl font-semibold text-white md:text-[1.65rem]">{sec.heading}</h3>
          ) : null}
          {sec.paragraphs?.map((p) => (
            <p key={p.slice(0, 48)} className="mt-3 text-[15px] leading-relaxed text-white/72 md:text-base">
              {p}
            </p>
          ))}
          {sec.bullets?.length ? (
            <ul className="mt-4 space-y-2.5">
              {sec.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-[15px] leading-relaxed text-white/70">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/80" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {sec.callout ? (
            <aside className="mt-5 rounded-r-xl border-l-2 border-violet-300/50 bg-violet-400/10 px-4 py-3 text-sm leading-relaxed text-violet-50/90">
              {sec.callout}
            </aside>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function AffiliateToolkitGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tocOpen, setTocOpen] = useState(false);

  const initialIdx = useMemo(() => {
    const q = params.get('chapter') ?? '';
    return q ? affiliateToolkitChapterIndex(q) : 0;
  }, [params]);

  const [chapterIdx, setChapterIdx] = useState(initialIdx);
  useEffect(() => {
    setChapterIdx(initialIdx);
  }, [initialIdx]);

  const chapter = AFFILIATE_TOOLKIT_CHAPTERS[chapterIdx] ?? AFFILIATE_TOOLKIT_CHAPTERS[0]!;

  const shellChapters = useMemo(
    () =>
      AFFILIATE_TOOLKIT_CHAPTERS.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        teaser: c.teaser,
      })),
    [],
  );

  usePublicSeoMeta({
    title: `${chapter.title} — ${AFFILIATE_TOOLKIT_META.shortTitle}`,
    description: chapter.subtitle,
    path: AFFILIATE_TOOLKIT_READ_PATH,
  });

  const goChapter = (idx: number) => {
    const next = Math.max(0, Math.min(AFFILIATE_TOOLKIT_CHAPTERS.length - 1, idx));
    setChapterIdx(next);
    setParams({ chapter: AFFILIATE_TOOLKIT_CHAPTERS[next]!.id }, { replace: true });
    setTocOpen(false);
  };

  return (
    <GuideReaderShell
      className="min-h-screen bg-[#070b14] text-white"
      chapters={shellChapters}
      chapterIndex={chapterIdx}
      onChapterChange={goChapter}
      tocOpen={tocOpen}
      onTocOpenChange={setTocOpen}
      tocLabel="Toolkit chapters"
      tocTitle={AFFILIATE_TOOLKIT_META.shortTitle}
      tocSubtitle="Affiliate path"
      tocFooter={<p className="mt-3 text-[10px] text-white/35">{AFFILIATE_TOOLKIT_META.compliance}</p>}
      storageKey="finely.guideReader.affiliateToolkit"
      showFlipControls={false}
      atmosphere={
        <>
          <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(167,139,250,0.16),transparent_55%)]" aria-hidden />
          <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />
        </>
      }
      headerLeft={
        <button
          type="button"
          onClick={() => navigate(AFFILIATE_TOOLKIT_PATH)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55 hover:text-violet-200"
        >
          <ArrowLeft size={14} /> Toolkit home
        </button>
      }
      headerRight={
        <Link
          to="/affiliate"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300/40 bg-emerald-400/15 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100"
        >
          <Sparkles size={13} /> Join path
        </Link>
      }
      renderChapter={(i) => {
        const ch = AFFILIATE_TOOLKIT_CHAPTERS[i] ?? AFFILIATE_TOOLKIT_CHAPTERS[0]!;
        return (
          <article className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-5 md:p-8 lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200/75">{ch.kicker}</span>
              <span className="text-[11px] text-white/40">
                {ch.number} / {String(AFFILIATE_TOOLKIT_CHAPTERS.length).padStart(2, '0')}
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-white md:text-4xl">{ch.title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/60">{ch.subtitle}</p>
            <div className="mt-6 h-px bg-gradient-to-r from-violet-300/40 via-white/10 to-transparent" aria-hidden />
            <div className="mt-6">
              <ChapterBody chapter={ch} />
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => goChapter(i - 1)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-white/70 disabled:opacity-35"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              {i < AFFILIATE_TOOLKIT_CHAPTERS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goChapter(i + 1)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-emerald-300/40 bg-emerald-400/15 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100"
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <Link
                  to="/affiliate"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-emerald-300/40 bg-emerald-400/15 px-4 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-100"
                >
                  Open affiliate path <ArrowRight size={14} />
                </Link>
              )}
            </div>
            <p className="mt-6 text-[10px] text-white/35">{AFFILIATE_TOOLKIT_META.compliance}</p>
          </article>
        );
      }}
    />
  );
}
