import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  List,
  MessagesSquare,
  Sparkles,
  X,
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
import './creditSpecialistGuideLanding.css';
import './creditSpecialistBinder.css';

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
  const progress = ((chapterIdx + 1) / CS_GUIDE_CHAPTERS.length) * 100;

  usePublicSeoMeta({
    title: `${chapter.title} — ${CS_GUIDE_META.shortTitle}`,
    description: chapter.subtitle,
    path: CS_GUIDE_READ_PATH,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [chapterIdx]);

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
    <main className="csg-page csg-reader-shell csg-binder relative overflow-x-hidden selection:bg-[#c99b48]/30">
      <div className="csg-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="lm-lux-grain lm-lux-grain--fixed pointer-events-none" aria-hidden />

      <header className="csg-reader-nav sticky z-40" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}>
        <div className="csg-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="mx-auto flex max-w-[88rem] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(CS_GUIDE_PATH)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:border-[#d4a447]/40 hover:text-[#f0cc75]"
            >
              <ArrowLeft size={14} /> Landing
            </button>
            <span className="hidden truncate text-[11px] font-bold uppercase tracking-[0.14em] text-white/45 sm:inline">
              Specialist e-guide
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTocOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4a447]/35 bg-[#d4a447]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#f0cc75] lg:hidden"
              aria-expanded={tocOpen}
            >
              {tocOpen ? <X size={14} /> : <List size={14} />} Pages
            </button>
            <button
              type="button"
              onClick={() => void onDownloadTwoSheet()}
              disabled={downloading}
              className="csg-nav-cta hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#e8c96a] sm:inline-flex"
            >
              <Download size={14} /> {downloading ? '…' : '2-sheet PDF'}
            </button>
            <Link
              to={CS_JOIN_PATH}
              className="csg-ghost-btn inline-flex h-10 items-center justify-center rounded-lg px-3.5 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              Join
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[88rem] gap-6 px-4 py-6 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        {/* TOC — desktop always; mobile drawer */}
        <aside
          className={cn(
            'csg-toc rounded-2xl p-4 lg:sticky lg:top-24 lg:self-start',
            tocOpen ? 'block' : 'hidden lg:block',
          )}
        >
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#d4a447]">
            <BookOpen size={14} /> Table of contents
          </div>
          <p className="csg-serif text-lg text-white">{CS_GUIDE_META.shortTitle}</p>
          <nav className="mt-4 space-y-1.5" aria-label="Guide pages">
            {CS_GUIDE_CHAPTERS.map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => goChapter(i)}
                className={cn('csg-toc-item flex w-full gap-3 rounded-xl px-3 py-2.5 text-left', i === chapterIdx && 'is-active')}
              >
                <span className={cn('text-[11px] font-black tabular-nums', `csg-accent-${ch.accent}`)}>{ch.number}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{ch.title}</span>
                  <span className="mt-0.5 block text-[11px] text-white/40 line-clamp-1">{ch.kicker}</span>
                </span>
              </button>
            ))}
          </nav>
          <p className="csg-compliance mt-4">{CS_GUIDE_META.compliance}</p>
        </aside>

        <div className="min-w-0">
          <article
            key={chapter.id}
            className="csg-article csg-binder-animate-page rounded-[1.35rem] p-5 md:p-8 md:pl-14 lg:p-10 lg:pl-16"
          >
            <div className="flex items-start gap-4">
              <div className="csg-binder-stamp csg-binder-animate-stamp" aria-hidden>
                <span className="csg-binder-stamp-num">{chapter.number}</span>
                <span className="csg-binder-stamp-label">Page</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="csg-binder-lane">{chapter.kicker}</span>
                  <span className="csg-binder-meta">
                    {chapterIdx + 1} of {CS_GUIDE_CHAPTERS.length}
                  </span>
                </div>
                <h1 className="csg-serif mt-2.5 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl lg:text-[2.6rem]">
                  {chapter.title}
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-base leading-relaxed md:text-lg">{chapter.subtitle}</p>
            <div className="lm-lux-rule--short lm-lux-rule--draw mt-5" aria-hidden />

            <div className="mt-8">
              <ChapterBody chapter={chapter} />
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e3dac6] pt-6">
              <button
                type="button"
                disabled={chapterIdx <= 0}
                onClick={() => goChapter(chapterIdx - 1)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#e3dac6] bg-white/60 px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[#4a4234] transition hover:border-[#a8792a]/60 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              {chapterIdx < CS_GUIDE_CHAPTERS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goChapter(chapterIdx + 1)}
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

          {/* End-of-chapter strip — join stays secondary */}
          <div className="csg-cta-panel mt-5 rounded-2xl p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#95e000]">
                  <Sparkles size={14} /> Keep reading freely
                </div>
                <p className="mt-2 text-sm text-white/60">
                  This e-guide is separate from signup. Take the 2-sheet playbook anytime — join only when you want the
                  program at <span className="text-[#f0cc75]">{CS_JOIN_PATH}</span>
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
                  className="inline-flex h-10 items-center justify-center rounded-lg px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45 transition hover:text-[#f0cc75]"
                >
                  Join →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
