import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export function SitewideDeckRail({
  title,
  eyebrow,
  subtitle,
  children,
  actionLabel,
  onAction,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const railRef = React.useRef<HTMLDivElement | null>(null);
  const scrollBy = (amount: number) => railRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  return (
    <section className="rounded-[34px] border border-white/10 bg-[#070b09]/88 backdrop-blur-2xl p-5 md:p-6 overflow-hidden shadow-2xl shadow-black/30">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-amber-300 font-black"><Sparkles size={13} />{eyebrow}</div> : null}
          <h2 className="mt-2 text-2xl md:text-3xl font-light text-white">{title}</h2>
          {subtitle ? <p className="mt-2 text-white/58 text-sm max-w-3xl leading-relaxed">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => scrollBy(-420)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 hover:bg-white/[0.08] text-white/70" title="Previous"><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => scrollBy(420)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 hover:bg-white/[0.08] text-white/70" title="Next"><ChevronRight size={16} /></button>
          {actionLabel ? (
            <button type="button" onClick={onAction} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110">
              {actionLabel} <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <div ref={railRef} className="mt-5 flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory fc-scroll-area">
        {children}
      </div>
    </section>
  );
}

export function SitewideRailCard({ title, meta, body, footer, tone = 'default' }: { title: string; meta?: string; body?: string; footer?: React.ReactNode; tone?: 'default' | 'gold' | 'emerald' | 'rose' }) {
  const toneClass = tone === 'gold' ? 'border-amber-500/25 bg-amber-500/10' : tone === 'emerald' ? 'border-emerald-500/25 bg-emerald-500/10' : tone === 'rose' ? 'border-rose-500/25 bg-rose-500/10' : 'border-white/10 bg-white/[0.035]';
  return (
    <article className={`snap-start shrink-0 w-[290px] md:w-[340px] rounded-[28px] border ${toneClass} p-5 min-h-[190px] flex flex-col justify-between`}>
      <div>
        {meta ? <div className="text-[10px] uppercase tracking-[0.28em] text-white/40 font-black">{meta}</div> : null}
        <div className="mt-2 text-white font-semibold text-lg leading-snug">{title}</div>
        {body ? <p className="mt-3 text-white/58 text-sm leading-relaxed">{body}</p> : null}
      </div>
      {footer ? <div className="mt-5">{footer}</div> : null}
    </article>
  );
}
