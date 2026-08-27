/**
 * Shared cinematic typewriter / reveal title for public sell bands.
 * - Intersection-triggered (or `immediate` for switchers)
 * - Violet caret while typing
 * - `prefers-reduced-motion: reduce` → full text instantly
 * Keep ≤2–4 animated titles per page.
 */
import React, { useEffect, useRef, useState } from 'react';

export type LandingTitleTag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

export type LandingTypewriterTitleProps = {
  text: string;
  /** Suffix typed after `text` in accent styling. */
  accentText?: string;
  /** Substring inside `text` (or first match) to accent once reached. */
  highlight?: string | string[];
  className?: string;
  accentClassName?: string;
  highlightClassName?: string;
  /** Base ms per character — cinematic default is deliberate. */
  speedMs?: number;
  /** Delay before typing starts once visible / immediate. */
  delayMs?: number;
  as?: LandingTitleTag;
  /** Skip intersection wait — type immediately (solution switchers). */
  immediate?: boolean;
  /** Violet caret while typing (hidden when complete or reduced-motion). */
  caret?: boolean;
};

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function pauseForChar(ch: string, speedMs: number): number {
  if (ch === '.' || ch === '!' || ch === '?') return speedMs * 4.2;
  if (ch === ',' || ch === '—' || ch === ';' || ch === ':') return speedMs * 2.4;
  if (ch === ' ') return speedMs * 1.15;
  return speedMs;
}

export function LandingTypewriterTitle({
  text,
  accentText,
  highlight,
  className = 'fc-sell-serif text-4xl sm:text-5xl lg:text-[3.35rem] font-semibold leading-[1.08] text-white',
  accentClassName = 'text-violet-300 italic',
  highlightClassName,
  speedMs = 38,
  delayMs = 120,
  as: Tag = 'h2',
  immediate = false,
  caret = true,
}: LandingTypewriterTitleProps) {
  const full = accentText ? `${text}${accentText}` : text;
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? full.length : 0));
  const [started, setStarted] = useState(() => immediate || prefersReducedMotion());
  const ref = useRef<HTMLElement | null>(null);
  const accentCls = highlightClassName || accentClassName;
  const highlightNeedle = Array.isArray(highlight) ? highlight[0] : highlight;

  useEffect(() => {
    const reduce = prefersReducedMotion();
    setShown(reduce ? full.length : 0);
    setStarted(immediate || reduce);
  }, [full, immediate]);

  useEffect(() => {
    if (immediate || prefersReducedMotion()) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.22 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [full, immediate]);

  useEffect(() => {
    if (!started) return;
    if (shown >= full.length) return;
    if (prefersReducedMotion()) {
      setShown(full.length);
      return;
    }
    const nextChar = full[shown] ?? '';
    const wait = shown === 0 && delayMs > 0 ? delayMs : pauseForChar(nextChar, speedMs);
    const t = window.setTimeout(() => setShown((n) => Math.min(full.length, n + 1)), wait);
    return () => window.clearTimeout(t);
  }, [started, shown, full, speedMs, delayMs]);

  const visible = full.slice(0, shown);
  const done = shown >= full.length;
  const showCaret = caret && !done && !prefersReducedMotion();

  let body: React.ReactNode;
  if (highlightNeedle && text.includes(highlightNeedle) && !accentText) {
    const idx = text.indexOf(highlightNeedle);
    const before = visible.slice(0, Math.min(visible.length, idx));
    const mid =
      visible.length > idx ? visible.slice(idx, Math.min(visible.length, idx + highlightNeedle.length)) : '';
    const after = visible.length > idx + highlightNeedle.length ? visible.slice(idx + highlightNeedle.length) : '';
    body = (
      <>
        <span>{before}</span>
        {mid ? <span className={accentCls}>{mid}</span> : null}
        {after ? <span>{after}</span> : null}
      </>
    );
  } else {
    const plainLen = text.length;
    const plainPart = visible.slice(0, Math.min(visible.length, plainLen));
    const accentPart = visible.length > plainLen ? visible.slice(plainLen) : '';
    body = (
      <>
        <span>{plainPart}</span>
        {accentPart ? <span className={accentCls}>{accentPart}</span> : null}
      </>
    );
  }

  return (
    <Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className} aria-label={full}>
      <span aria-hidden="true">{body}</span>
      {showCaret ? (
        <span
          className="ml-0.5 inline-block h-[0.85em] w-[0.08em] min-w-[2px] translate-y-[0.05em] bg-gradient-to-b from-violet-200 via-violet-400 to-violet-600 align-baseline shadow-[0_0_12px_rgba(139,92,246,0.55)] animate-pulse"
          aria-hidden
        />
      ) : null}
    </Tag>
  );
}

/** Letter-style alias — same API; use for sell titles interchangeably. */
export const FinelyRevealTitle = LandingTypewriterTitle;
