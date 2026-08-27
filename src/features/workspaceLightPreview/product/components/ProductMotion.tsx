import React, { useEffect, useState } from 'react';
import { ProductArcGauge } from './ProductInstruments';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ProductAnimatedNumber({
  value,
  durationMs = 720,
}: {
  value: number;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? value : 0));

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, value]);

  return <>{display.toLocaleString()}</>;
}

export function ProductWelcomeReveal({
  text,
  storageKey = 'workspace-welcome',
}: {
  text: string;
  storageKey?: string;
}) {
  const key = `fc_wlp_reveal_${storageKey}`;
  const [visibleLength, setVisibleLength] = useState(() => {
    if (prefersReducedMotion()) return text.length;
    try {
      return sessionStorage.getItem(key) ? text.length : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    if (visibleLength >= text.length || prefersReducedMotion()) return;
    const timer = window.setInterval(() => {
      setVisibleLength((current) => {
        const next = Math.min(text.length, current + 1);
        if (next >= text.length) {
          window.clearInterval(timer);
          try {
            sessionStorage.setItem(key, '1');
          } catch {
            // Session personalization is optional.
          }
        }
        return next;
      });
    }, 28);
    return () => window.clearInterval(timer);
  }, [key, text, visibleLength]);

  const complete = visibleLength >= text.length;
  return (
    <span className="fc-wlp-welcome-reveal" aria-label={text}>
      <span aria-hidden>{text.slice(0, visibleLength)}</span>
      <span className="fc-wlp-welcome-cursor" data-complete={complete ? 'true' : undefined} aria-hidden />
    </span>
  );
}

/**
 * Delegates to `ProductArcGauge` (see `ProductInstruments.tsx`) so the
 * dashboard readiness dial gains tick marks, a comet head, and a foil-clipped
 * value instead of the plain progress ring this used to draw directly. The
 * exported name and prop signature are unchanged so existing call sites
 * (e.g. `PartnerCommandCenterProduct.tsx`) keep compiling untouched.
 */
export function ProductReadinessGauge({
  score,
  label = 'Readiness',
}: {
  score: number;
  label?: string;
}) {
  const safeScore = Math.max(0, Math.min(100, score));
  return (
    <ProductArcGauge value={safeScore} min={0} max={100} label={label} accent="violet" size={144} bed="dark" />
  );
}
