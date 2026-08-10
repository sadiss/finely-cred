/**
 * Shared e-guide reader chrome: wider TOC↔article layout, descriptive TOC,
 * progress, Scroll|Flip mode. Body rendering stays per-family via renderChapter.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, GalleryHorizontal, List, ScrollText, X } from 'lucide-react';
import { GuideReaderFlipBook, type GuideFlipBookHandle } from './GuideReaderFlipBook';
import './guideReaderShell.css';

export type GuideReaderChapterMeta = {
  id: string;
  number: string;
  title: string;
  /** Short descriptive blurb under the TOC title */
  teaser?: string;
};

export type GuideReaderMode = 'scroll' | 'flip';

export type GuideReaderShellProps = {
  chapters: GuideReaderChapterMeta[];
  chapterIndex: number;
  onChapterChange: (index: number) => void;

  /** Skin classes on <main> */
  className?: string;
  atmosphere?: React.ReactNode;

  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  progressTrackClassName?: string;
  progressFillClassName?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  /** Extra header actions between mode toggle and headerRight */
  headerMid?: React.ReactNode;

  tocOpen: boolean;
  onTocOpenChange: (open: boolean) => void;
  tocToggleLabel?: string;
  tocLabel?: string;
  tocTitle?: React.ReactNode;
  tocSubtitle?: React.ReactNode;
  tocClassName?: string;
  tocNavClassName?: string;
  tocFooter?: React.ReactNode;
  tocExtra?: React.ReactNode;
  tocPosition?: 'left' | 'right';
  /** When set, replaces the default descriptive TOC list (still inside the TOC column). */
  customToc?: React.ReactNode;
  renderTocNumber?: (chapter: GuideReaderChapterMeta, index: number) => React.ReactNode;
  tocItemClassName?: (active: boolean, index: number) => string;

  beforeGrid?: React.ReactNode;
  afterArticle?: React.ReactNode;

  /** Per-family body — scroll shows current; flip mounts all as leaves. */
  renderChapter: (index: number) => React.ReactNode;

  maxWidthClassName?: string;
  gridClassName?: string;
  articleWrapClassName?: string;

  /** Hide built-in flip prev/next when the chapter body already has nav. */
  showFlipControls?: boolean;
  enableKeyboard?: boolean;
  defaultMode?: GuideReaderMode;
  storageKey?: string;
  /** Light parchment skins (Case Desk) need dark Flip/Scroll chrome. */
  chromeTone?: 'dark' | 'light';
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function useIsLgUp() {
  const [ok, setOk] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true));
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setOk(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return ok;
}

function readStoredMode(key: string | undefined, fallback: GuideReaderMode): GuideReaderMode {
  if (!key || typeof window === 'undefined') return fallback;
  try {
    const v = window.localStorage.getItem(key);
    if (v === 'scroll' || v === 'flip') return v;
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * Shared ?chapter= sync helper — id or 1-based index.
 */
export function useGuideReaderChapterIndex(
  chapters: Array<{ id: string }>,
  chapterParam: string | null,
): number {
  return useMemo(() => {
    const q = (chapterParam ?? '').trim();
    if (!q) return 0;
    const asNum = Number(q);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= chapters.length) return asNum - 1;
    const byId = chapters.findIndex((c) => c.id === q);
    return byId >= 0 ? byId : 0;
  }, [chapterParam, chapters]);
}

export default function GuideReaderShell({
  chapters,
  chapterIndex,
  onChapterChange,
  className,
  atmosphere,
  headerClassName,
  headerStyle,
  progressTrackClassName = 'grs-progress-track',
  progressFillClassName,
  headerLeft,
  headerRight,
  headerMid,
  tocOpen,
  onTocOpenChange,
  tocToggleLabel = 'Pages',
  tocLabel = 'Table of contents',
  tocTitle,
  tocSubtitle,
  tocClassName,
  tocNavClassName,
  tocFooter,
  tocExtra,
  tocPosition = 'left',
  customToc,
  renderTocNumber,
  tocItemClassName,
  beforeGrid,
  afterArticle,
  renderChapter,
  maxWidthClassName = 'max-w-[92rem]',
  gridClassName,
  articleWrapClassName,
  showFlipControls = true,
  enableKeyboard = true,
  defaultMode = 'scroll',
  storageKey,
  chromeTone = 'dark',
}: GuideReaderShellProps) {
  const reducedMotion = usePrefersReducedMotion();
  const isLgUp = useIsLgUp();
  const flipAllowed = isLgUp && !reducedMotion;

  const [mode, setMode] = useState<GuideReaderMode>(() =>
    readStoredMode(storageKey, defaultMode),
  );
  const effectiveMode: GuideReaderMode = flipAllowed && mode === 'flip' ? 'flip' : 'scroll';

  const articleFocusRef = useRef<HTMLDivElement | null>(null);
  const flipRef = useRef<GuideFlipBookHandle | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [flipSize, setFlipSize] = useState({ width: 720, height: 780 });

  const total = chapters.length;
  const progress = total > 0 ? ((chapterIndex + 1) / total) * 100 : 0;
  const chapter = chapters[chapterIndex] ?? chapters[0];

  useEffect(() => {
    if (!flipAllowed && mode === 'flip') setMode('scroll');
  }, [flipAllowed, mode]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, mode);
    } catch {
      /* ignore */
    }
  }, [mode, storageKey]);

  useEffect(() => {
    if (effectiveMode !== 'scroll') return;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    // Focus article region for a11y (without scrolling the focused element oddly)
    const el = articleFocusRef.current;
    if (el) {
      el.focus({ preventScroll: true });
    }
  }, [chapterIndex, effectiveMode, reducedMotion]);

  useEffect(() => {
    if (effectiveMode !== 'flip' || !stageRef.current) return;
    const el = stageRef.current;
    const measure = () => {
      const w = Math.max(480, Math.min(el.clientWidth || 720, 900));
      const h = Math.max(520, Math.min(Math.round(window.innerHeight * 0.72), 860));
      setFlipSize({ width: w, height: h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [effectiveMode]);

  const goChapter = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      onChapterChange(clamped);
      onTocOpenChange(false);
    },
    [onChapterChange, onTocOpenChange, total],
  );

  useEffect(() => {
    if (!enableKeyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (effectiveMode === 'flip') flipRef.current?.flipNext();
        else goChapter(chapterIndex + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (effectiveMode === 'flip') flipRef.current?.flipPrev();
        else goChapter(chapterIndex - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chapterIndex, effectiveMode, enableKeyboard, goChapter]);

  const setReaderMode = (next: GuideReaderMode) => {
    if (next === 'flip' && !flipAllowed) return;
    setMode(next);
  };

  const tocColumn = (
    <aside
      className={cn(
        'grs-toc-col space-y-3 lg:sticky lg:top-28 lg:self-start',
        tocOpen ? 'block' : 'hidden lg:block',
        tocClassName,
      )}
    >
      {customToc ?? (
        <div className="grs-toc-panel">
          <div
            className={cn(
              'mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]',
              chromeTone === 'light' ? 'text-amber-900/80' : 'text-[#d4a447]',
            )}
          >
            <BookOpen size={14} aria-hidden /> {tocLabel}
          </div>
          {tocTitle ? (
            <div
              className={cn(
                'text-lg font-semibold leading-tight',
                chromeTone === 'light' ? 'text-stone-900' : 'text-white',
              )}
            >
              {tocTitle}
            </div>
          ) : null}
          {tocSubtitle ? (
            <div
              className={cn(
                'mt-1 text-[11px] uppercase tracking-[0.14em]',
                chromeTone === 'light' ? 'text-stone-600' : 'text-white/40',
              )}
            >
              {tocSubtitle}
            </div>
          ) : null}
          <nav className={cn('mt-4 max-h-[62vh] space-y-1 overflow-y-auto pr-1', tocNavClassName)} aria-label={tocLabel}>
            {chapters.map((ch, i) => {
              const active = i === chapterIndex;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => goChapter(i)}
                  className={cn(
                    'grs-toc-item',
                    active && 'is-active',
                    tocItemClassName?.(active, i),
                  )}
                  aria-current={active ? 'true' : undefined}
                >
                  <span className="grs-toc-num">
                    {renderTocNumber ? renderTocNumber(ch, i) : ch.number}
                  </span>
                  <span className="min-w-0">
                    <span className="grs-toc-title">{ch.title}</span>
                    {ch.teaser ? <span className="grs-toc-teaser">{ch.teaser}</span> : null}
                  </span>
                </button>
              );
            })}
          </nav>
          {tocFooter}
        </div>
      )}
      {tocExtra}
    </aside>
  );

  const articleColumn = (
    <div className={cn('min-w-0', articleWrapClassName)}>
      {effectiveMode === 'scroll' ? (
        <div
          ref={articleFocusRef}
          tabIndex={-1}
          className="outline-none"
          aria-live="polite"
          aria-label={chapter ? `${chapter.number}. ${chapter.title}` : 'Guide chapter'}
        >
          {renderChapter(chapterIndex)}
        </div>
      ) : (
        <div ref={stageRef}>
          <p className="grs-sr-only" aria-live="polite">
            Flip mode. Page {chapterIndex + 1} of {total}
            {chapter ? `: ${chapter.title}` : ''}. Use arrow keys or previous/next.
          </p>
          <GuideReaderFlipBook
            ref={flipRef}
            pageIndex={chapterIndex}
            onPageChange={goChapter}
            width={flipSize.width}
            height={flipSize.height}
          >
            {chapters.map((_, i) => renderChapter(i))}
          </GuideReaderFlipBook>
          {showFlipControls ? (
            <div className="grs-flip-controls">
              <button
                type="button"
                disabled={chapterIndex <= 0}
                onClick={() => flipRef.current?.flipPrev() ?? goChapter(chapterIndex - 1)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 text-[10px] font-black uppercase tracking-[0.12em] text-white/75 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                {chapterIndex + 1} / {total}
              </span>
              <button
                type="button"
                disabled={chapterIndex >= total - 1}
                onClick={() => flipRef.current?.flipNext() ?? goChapter(chapterIndex + 1)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#d4a447]/40 bg-[#d4a447]/12 px-4 text-[10px] font-black uppercase tracking-[0.12em] text-[#f0cc75] transition hover:border-[#d4a447]/70 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      )}
      {afterArticle}
    </div>
  );

  return (
    <main
      className={cn(
        'grs-shell relative overflow-x-hidden',
        chromeTone === 'light' && 'grs-shell--light',
        className,
      )}
      data-grs-chrome={chromeTone}
    >
      {atmosphere}

      <header
        className={cn('grs-header sticky z-40', headerClassName)}
        style={headerStyle ?? { top: 'calc(env(safe-area-inset-top, 0px) + 4.25rem)' }}
      >
        <div className={progressTrackClassName || undefined}>
          <span
            className={progressFillClassName || undefined}
            style={{ width: `${progress}%`, display: 'block', height: '100%' }}
          />
        </div>
        <div
          className={cn(
            'mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8',
            maxWidthClassName,
          )}
        >
          <div className="flex min-w-0 items-center gap-3">{headerLeft}</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onTocOpenChange(!tocOpen)}
              className={cn(
                'grs-toc-mobile-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition lg:hidden',
                chromeTone === 'light'
                  ? 'border border-stone-400/55 bg-white/70 text-stone-700 hover:border-stone-700'
                  : 'border border-white/15 bg-white/[0.04] text-white/70 hover:border-white/30',
              )}
              aria-expanded={tocOpen}
            >
              {tocOpen ? <X size={14} /> : <List size={14} />} {tocToggleLabel}
            </button>

            <div className="grs-mode-toggle" role="group" aria-label="Reading mode">
              <button
                type="button"
                className={cn('grs-mode-toggle__btn', effectiveMode === 'scroll' && 'is-active')}
                aria-pressed={effectiveMode === 'scroll'}
                onClick={() => setReaderMode('scroll')}
              >
                <ScrollText size={13} aria-hidden /> Scroll
              </button>
              <button
                type="button"
                className={cn('grs-mode-toggle__btn', effectiveMode === 'flip' && 'is-active')}
                aria-pressed={effectiveMode === 'flip'}
                disabled={!flipAllowed}
                title={
                  !isLgUp
                    ? 'Flip mode is available on larger screens'
                    : reducedMotion
                      ? 'Flip mode disabled when reduced motion is preferred'
                      : 'Flip through chapters like a book'
                }
                onClick={() => setReaderMode('flip')}
              >
                <GalleryHorizontal size={13} aria-hidden /> Flip
              </button>
            </div>

            {headerMid}
            {headerRight}
          </div>
        </div>
      </header>

      {beforeGrid}

      <div
        className={cn(
          'relative z-10 mx-auto grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12 lg:py-9',
          maxWidthClassName,
          tocPosition === 'right' && 'lg:grid-cols-[minmax(0,1fr)_300px]',
          gridClassName,
        )}
      >
        {tocPosition === 'left' ? (
          <>
            {tocColumn}
            {articleColumn}
          </>
        ) : (
          <>
            {articleColumn}
            {tocColumn}
          </>
        )}
      </div>
    </main>
  );
}
