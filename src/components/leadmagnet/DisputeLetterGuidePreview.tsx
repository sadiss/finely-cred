import React, { useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import {
  DISPUTE_LETTER_GUIDE_COVER,
  DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES,
  DISPUTE_LETTER_GUIDE_PAGE_COUNT,
} from '../../resources/disputeLetterGuideContent';

const PREVIEW_SLIDES = [
  { type: 'cover' as const, label: 'Cover' },
  ...DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.slice(0, 4).map((p) => ({
    type: 'page' as const,
    page: p,
    label: p.title,
  })),
  { type: 'toc' as const, label: 'Full guide contents' },
];

type Props = {
  compact?: boolean;
  className?: string;
};

function GuidePagePreview({ page }: { page: (typeof DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES)[number] }) {
  return (
    <div className="absolute inset-0 p-4 sm:p-6 flex flex-col text-left overflow-y-auto bg-gradient-to-br from-[#0b1210] via-[#111820] to-[#0a0f0e]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[45%] rounded-full bg-[#39ff14]/15 blur-3xl" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[35%] rounded-full bg-amber-500/10 blur-3xl" />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#39ff14] mb-2">Finely Cred edition</p>
        <h4 className="text-base sm:text-lg font-bold text-white mb-1">{page.title}</h4>
        {page.subtitle ? <p className="text-xs text-white/60 mb-3">{page.subtitle}</p> : null}
        <div className="space-y-3">
          {page.sections.map((sec, i) => (
            <div key={i} className="rounded-lg border border-[#39ff14]/20 bg-black/30 p-2.5">
              {sec.heading ? <p className="text-[11px] font-bold text-[#39ff14] mb-1">{sec.heading}</p> : null}
              {sec.paragraphs?.map((p, j) => (
                <p key={j} className="text-[10px] sm:text-xs text-white/75 leading-relaxed mb-1">
                  {p}
                </p>
              ))}
              {sec.bullets ? (
                <ul className="space-y-1 mt-1">
                  {sec.bullets.slice(0, 4).map((b) => (
                    <li key={b} className="text-[10px] sm:text-xs text-white/70 flex gap-1.5">
                      <span className="text-[#39ff14] shrink-0">+</span>
                      <span className="line-clamp-2">{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DisputeLetterGuidePreview({ compact, className = '' }: Props) {
  const [idx, setIdx] = useState(0);
  const slide = PREVIEW_SLIDES[idx] ?? PREVIEW_SLIDES[0]!;

  return (
    <div className={`rounded-2xl border border-[#39ff14]/20 bg-fc-chrome/80 overflow-hidden shadow-2xl shadow-black/30 ${className}`}>
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-white/[0.08] bg-[#07110d]">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-[#39ff14] shrink-0" />
          <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-widest truncate">
            Guide preview · {DISPUTE_LETTER_GUIDE_PAGE_COUNT} pages
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setIdx((i) => (i - 1 + PREVIEW_SLIDES.length) % PREVIEW_SLIDES.length)}
            className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-white/70"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-white/50 tabular-nums w-8 text-center">
            {idx + 1}/{PREVIEW_SLIDES.length}
          </span>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => setIdx((i) => (i + 1) % PREVIEW_SLIDES.length)}
            className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/5 text-white/70"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`relative bg-[#0b1210] ${compact ? 'aspect-[3/4]' : 'aspect-[3/4] sm:aspect-[4/5]'}`}>
        {slide.type === 'cover' ? (
          <img
            src={DISPUTE_LETTER_GUIDE_COVER}
            alt={slide.label}
            className="absolute inset-0 w-full h-full object-contain p-1 sm:p-2"
            loading="lazy"
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = 'none';
              el.parentElement?.querySelector('[data-fallback-cover]')?.classList.remove('hidden');
            }}
          />
        ) : null}
        {slide.type === 'cover' ? (
          <div data-fallback-cover className="hidden absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-br from-[#0b1210] via-[#111820] to-[#0a0f0e]">
            <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[45%] rounded-full bg-[#39ff14]/20 blur-3xl" />
            <p className="relative text-[#39ff14] text-xs font-black uppercase tracking-widest mb-2">Finely Cred</p>
            <h3 className="relative text-xl font-bold text-white mb-2">Free Credit Dispute Letter Guide</h3>
            <p className="relative text-sm text-white/65">5-step framework · FCRA rights · certified mail workflow</p>
          </div>
        ) : null}
        {slide.type === 'page' ? <GuidePagePreview page={slide.page} /> : null}
        {slide.type === 'toc' ? (
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center text-left overflow-y-auto bg-gradient-to-br from-[#0b1210] via-[#111820] to-[#0a0f0e]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#39ff14] mb-2">Finely Cred edition</p>
            <h4 className="text-base sm:text-lg font-bold text-white mb-3">What&apos;s inside</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-white/75">
              {DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.map((p) => (
                <li key={p.id} className="flex gap-2">
                  <span className="text-[#39ff14] shrink-0">✓</span>
                  <span>{p.title}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-white/50 border-t border-white/[0.08] truncate">
        {slide.label}
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 sm:px-4 pb-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2 py-2 text-[10px] text-emerald-100 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#39ff14]" /> Secure PDF
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-2 py-2 text-[10px] text-amber-100 inline-flex items-center gap-1.5">
          <BadgeCheck className="w-3.5 h-3.5 text-amber-300" /> FCRA checklist
        </div>
      </div>
    </div>
  );
}

export function DisputeLetterGuideContentsList({ className = '' }: { className?: string }) {
  const items = DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES.map((p) => p.title);
  return (
    <ul className={`space-y-2 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
          <span className="text-[#39ff14] mt-0.5 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
