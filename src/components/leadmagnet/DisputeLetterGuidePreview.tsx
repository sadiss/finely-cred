import React, { useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import {
  DISPUTE_LETTER_GUIDE_COVER,
  DISPUTE_LETTER_GUIDE_GENERATED_PAGES,
  DISPUTE_LETTER_GUIDE_IMAGE_PAGES,
  DISPUTE_LETTER_GUIDE_PAGE_COUNT,
} from '../../resources/disputeLetterGuideContent';

const PREVIEW_SLIDES = [
  { src: DISPUTE_LETTER_GUIDE_COVER, label: 'Cover' },
  ...DISPUTE_LETTER_GUIDE_IMAGE_PAGES.slice(1, 4).map((src, i) => ({
    src,
    label: i === 0 ? 'Contents' : i === 1 ? 'FCRA overview' : '5-step framework',
  })),
  { src: null, label: 'Letter Stream + Complaints (completed)' },
];

type Props = {
  compact?: boolean;
  className?: string;
};

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

      <div className={`relative bg-white ${compact ? 'aspect-[3/4]' : 'aspect-[3/4] sm:aspect-[4/5]'}`}>
        {slide.src ? (
          <img
            src={slide.src}
            alt={slide.label}
            className="absolute inset-0 w-full h-full object-contain p-1 sm:p-2"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center text-left overflow-y-auto">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Finely Cred edition</p>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-3">Completed sections</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
              {DISPUTE_LETTER_GUIDE_GENERATED_PAGES.map((p) => (
                <li key={p.id} className="flex gap-2">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  <span>{p.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="px-3 sm:px-4 py-2 text-[10px] sm:text-xs text-white/50 border-t border-white/[0.08] truncate">
        {slide.label}
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 sm:px-4 pb-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2 py-2 text-[10px] text-emerald-100 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#39ff14]" /> Secure PDF
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-2 py-2 text-[10px] text-amber-100 inline-flex items-center gap-1.5">
          <BadgeCheck className="w-3.5 h-3.5 text-amber-300" /> Trust checklist
        </div>
      </div>
    </div>
  );
}

export function DisputeLetterGuideContentsList({ className = '' }: { className?: string }) {
  const items = [
    'The FCRA & willful violation',
    'Waiving rights when disputing online',
    'What is OCR',
    'Steps 1–5: letter structure + example',
    'Letter Stream (mailing workflow)',
    'Complaints & escalation (CFPB, FTC, AG)',
    "Editor's notes & disclaimer",
  ];
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
