import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { downloadCreditSpecialistTwoSheet } from '../../resources/buildCreditSpecialistTwoSheetPdf';
import '../../components/leadmagnet/leadMagnetLuxuryStage.css';
import {
  CS_GUIDE_CHAPTERS,
  CS_GUIDE_META,
  CS_GUIDE_PATH,
  CS_GUIDE_READ_PATH,
  CS_JOIN_PATH,
  creditSpecialistChapterIndex,
  type CreditSpecialistGuideChapter,
} from './creditSpecialistGuideContent';
import GuideReaderShell from './GuideReaderShell';
import './creditSpecialistGuideLanding.css';
import './creditSpecialistBinder.css';
import './guideReaderShell.css';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function ChapterBody({ chapter }: { chapter: CreditSpecialistGuideChapter }) {
  return (
    <div className="space-y-0">
      {chapter.sections.map((sec, i) => (
        <div key={`${chapter.id}-${i}`} className={cn('csg-section-block py-6 first:border-t-0 first:pt-0')}>
          {sec.heading ? (
            <h3 className="csg-serif text-2xl font-semibold text-white md:text-[1.65rem]">{sec.heading}</h3>
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
                  <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', `bg-current csg-accent-${chapter.accent}`)} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {sec.script ? (
            <div className="csg-script">
              <div className="csg-script-label">
                <MessagesSquare size={12} /> {sec.script.label}
              </div>
              {sec.script.lines.map((line) => (
                <div
                  key={line.text.slice(0, 48)}
                  className={cn('csg-script-line', `csg-script-line--${line.speaker}`)}
                >
                  <span className="csg-script-who">{line.speaker === 'you' ? 'You' : 'Partner'}</span>
                  <span className="csg-script-text">{line.text}</span>
                </div>
              ))}
            </div>
          ) : null}

          {sec.checklist ? (
            <div className="csg-checklist">
              <div className="csg-checklist-label">{sec.checklist.label}</div>
              <div className="mt-2">
                {sec.checklist.items.map((item) => (
                  <div key={item.slice(0, 48)} className="csg-checklist-item">
                    <span className="csg-checkbox" aria-hidden />
                    <span className="csg-script-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {sec.resources?.length ? (
            <div className="csg-resources">
              {sec.resources.map((res) => (
                <a
                  key={res.href}
                  href={res.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="csg-resource"
                >
                  <span className="csg-resource-label">
                    {res.label} <ExternalLink size={12} />
                  </span>
                  {res.note ? <span className="csg-resource-note">{res.note}</span> : null}
                </a>
              ))}
            </div>
          ) : null}

          {sec.callout ? (
            <aside className="csg-callout mt-5 rounded-r-xl px-4 py-3 text-sm leading-relaxed">{sec.callout}</aside>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function CreditSpecialistGuideReaderPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tocOpen, setTocOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const initialIdx = useMemo(() => {
    const q = params.get('chapter') ?? '';
    if (!q) return 0;
    const asNum = Number(q);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= CS_GUIDE_CHAPTERS.length) return asNum - 1;
    return creditSpecialistChapterIndex(q);
  }, [params]);

  const [chapterIdx, setChapterIdx] = useState(initialIdx);

  useEffect(() => {
    setChapterIdx(initialIdx);
  }, [initialIdx]);

  const chapter = CS_GUIDE_CHAPTERS[chapterIdx] ?? CS_GUIDE_CHAPTERS[0]!;

  const shellChapters = useMemo(
    () =>
      CS_GUIDE_CHAPTERS.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        teaser: c.kicker,
      })),
    [],
  );

  usePublicSeoMeta({
    title: `${chapter.title} — ${CS_GUIDE_META.shortTitle}`,
    description: chapter.subtitle,
    path: CS_GUIDE_READ_PATH,
  });

  const goChapter = (idx: number) => {
    const next = Math.max(0, Math.min(CS_GUIDE_CHAPTERS.length - 1, idx));
    setChapterIdx(next);
    const id = CS_GUIDE_CHAPTERS[next]!.id;
    setParams({ chapter: id }, { replace: true });
    setTocOpen(false);
  };

  const onDownloadTwoSheet = async () => {
    setDownloading(true);
    try {
      await downloadCreditSpecialistTwoSheet();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <GuideReaderShell
      className="csg-page csg-reader-shell csg-binder relative overflow-x-hidden selection:bg-violet-500/25"
      chapters={shellChapters}
      chapterIndex={chapterIdx}
      onChapterChange={goChapter}
      tocOpen={tocOpen}
      onTocOpenChange={setTocOpen}
      tocLabel="Table of contents"
      tocTitle={CS_GUIDE_META.shortTitle}
      tocSubtitle="Specialist e-guide"
      tocClassName="csg-toc rounded-2xl p-4"
      tocFooter={<p className="csg-compliance mt-4">{CS_GUIDE_META.compliance}</p>}
      storageKey="finely.guideReader.creditSpecialist"
      maxWidthClassName="max-w-[88rem]"
      headerClassName="csg-reader-nav"
      progressTrackClassName="csg-progress"
      atmosphere={
        <>
          <div className="csg-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />
          <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />
        </>
      }
      headerLeft={
        <button
          type="button"
          onClick={() => navigate(CS_GUIDE_PATH)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:border-[#a78bfa]/40 hover:text-[#c4b5fd]"
        >
          <ArrowLeft size={14} /> Landing
        </button>
      }
      headerRight={
        <>
          <button
            type="button"
            onClick={() => void onDownloadTwoSheet()}
            disabled={downloading}
            className="csg-nav-cta hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c4b5fd] sm:inline-flex"
          >
            <Download size={14} /> {downloading ? '…' : '2-sheet PDF'}
          </button>
          <Link
            to={CS_JOIN_PATH}
            className="csg-ghost-btn inline-flex h-10 items-center justify-center rounded-lg px-3.5 text-[10px] font-black uppercase tracking-[0.14em]"
          >
            Join
          </Link>
        </>
      }
      tocItemClassName={(active) => cn('csg-toc-item flex w-full gap-3 rounded-xl px-3 py-2.5 text-left', active && 'is-active')}
      afterArticle={
        <div className="csg-cta-panel mt-5 rounded-2xl p-5 md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#34d399]">
                <Sparkles size={14} /> Keep reading freely
              </div>
              <p className="mt-2 text-sm text-white/60">
                This e-guide is separate from signup. Take the 2-sheet playbook anytime — join only when you want the
                program at <span className="text-[#c4b5fd]">{CS_JOIN_PATH}</span>
              </p>
              <p className="csg-compliance mt-2">{CS_GUIDE_META.compliance}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void onDownloadTwoSheet()}
                disabled={downloading}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border-2 border-white/70 bg-white/10 px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-all hover:border-white hover:bg-white/20 disabled:opacity-60"
              >
                <Download size={14} /> {downloading ? 'Building…' : 'Download 2-sheet'}
              </button>
              <Link
                to={CS_GUIDE_PATH}
                className="csg-ghost-btn inline-flex h-10 items-center justify-center rounded-lg px-4 text-[10px] font-black uppercase tracking-[0.12em]"
              >
                Landing
              </Link>
              <Link
                to={CS_JOIN_PATH}
                className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45 transition hover:text-[#c4b5fd]"
              >
                Join →
              </Link>
            </div>
          </div>
        </div>
      }
      renderChapter={(i) => {
        const ch = CS_GUIDE_CHAPTERS[i] ?? CS_GUIDE_CHAPTERS[0]!;
        return (
          <article className="csg-article csg-binder-animate-page rounded-[1.35rem] p-5 md:p-8 md:pl-14 lg:p-10 lg:pl-16">
            <div className="flex items-start gap-4">
              <div className="csg-binder-stamp csg-binder-animate-stamp" aria-hidden>
                <span className="csg-binder-stamp-num">{ch.number}</span>
                <span className="csg-binder-stamp-label">Page</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="csg-binder-lane">{ch.kicker}</span>
                  <span className="csg-binder-meta">
                    {i + 1} of {CS_GUIDE_CHAPTERS.length}
                  </span>
                </div>
                <h1 className="csg-serif mt-2.5 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl lg:text-[2.6rem]">
                  {ch.title}
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-base leading-relaxed md:text-lg">{ch.subtitle}</p>
            <div className="lm-lux-rule--short lm-lux-rule--draw mt-5" aria-hidden />

            <div className="mt-8">
              <ChapterBody chapter={ch} />
            </div>

            <div className="csg-article-nav mt-8 flex flex-wrap items-center justify-between gap-3 pt-6">
              <button
                type="button"
                disabled={i <= 0}
                onClick={() => goChapter(i - 1)}
                className="csg-prev-btn inline-flex h-11 items-center gap-2 rounded-lg px-4 text-[11px] font-black uppercase tracking-[0.12em]"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {i < CS_GUIDE_CHAPTERS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goChapter(i + 1)}
                  className="csg-gold-btn inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.12em]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Next page <ChevronRight size={16} />
                  </span>
                </button>
              ) : (
                <Link
                  to={CS_GUIDE_PATH}
                  className="csg-gold-btn inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[11px] font-black uppercase tracking-[0.12em]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Back to landing <ArrowRight size={16} />
                  </span>
                </Link>
              )}
            </div>
          </article>
        );
      }}
    />
  );
}
