import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock } from 'lucide-react';

export function LeadMagnetPreviewBanner({
  unlockHref,
  pagesLabel = 'the full guide',
}: {
  unlockHref: string;
  pagesLabel?: string;
}) {
  return (
    <div className="relative z-20 mx-auto w-full max-w-none px-4 pt-4 md:px-8">
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-emerald-400/50 bg-white px-5 py-4 shadow-[0_18px_50px_-24px_rgba(16,185,129,0.45)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
            <BookOpen size={13} /> Preview — page 1 only
          </p>
          <p className="mt-1 text-sm font-bold leading-snug text-slate-900">
            This is a preview. Enter your details to unlock {pagesLabel}.
          </p>
        </div>
        <Link
          to={unlockHref}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-600/25 transition hover:brightness-110"
        >
          <Lock size={14} /> Get the full guide
        </Link>
      </div>
    </div>
  );
}
